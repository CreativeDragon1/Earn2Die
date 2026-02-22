import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

const VALID_WAR_REASONS = [
  'harboring_enemies',    // Suspicion of harbouring enemies of the state
  'resource_invasion',    // Invasion for resources
  'espionage_revenge',    // Revenge for espionage
  'other_revenge',        // Revenge for other reasons
  'other',                // Must be described in reasonDetails
] as const;

const declareWarSchema = z.object({
  title: z.string().min(3).max(100),
  reason: z.enum(VALID_WAR_REASONS, {
    errorMap: () => ({ message: `Reason must be one of: ${VALID_WAR_REASONS.join(', ')}` }),
  }),
  reasonDetails: z.string().max(1000).optional(),
  attackingTownId: z.string(),
  defendingTownId: z.string(),
});

const addBattleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  victor: z.enum(['attacker', 'defender']).optional(),
  location: z.string().max(100).optional(),
  // War crime flags (server rules)
  arsonCommitted: z.boolean().optional(),
  residentialDamage: z.boolean().optional(),
  farmDamage: z.boolean().optional(),
});

// GET /api/wars
router.get('/', async (req, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const wars = await prisma.war.findMany({
      where: status ? { status } : undefined,
      include: {
        attacker: { select: { id: true, username: true } },
        attackingTown: { select: { id: true, name: true } },
        defendingTown: { select: { id: true, name: true } },
        _count: { select: { battles: true } },
      },
      orderBy: { noticeSentAt: 'desc' },
    });
    res.json(wars);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/wars/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const war = await prisma.war.findUnique({
      where: { id: (req.params as Record<string, string>).id },
      include: {
        attacker: { select: { id: true, username: true } },
        attackingTown: { select: { id: true, name: true, banner: true } },
        defendingTown: { select: { id: true, name: true, banner: true } },
        battles: { orderBy: { foughtAt: 'desc' } },
      },
    });
    if (!war) { res.status(404).json({ error: 'War not found' }); return; }
    res.json(war);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/wars
 * Sends a formal war notice (status = notice_sent).
 * The defending town must receive at least 24 hours notice before combat begins.
 * The caller must be the leader (owner) of the attacking town.
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = declareWarSchema.parse(req.body);

    // Attacker must own/lead the attacking town
    const attackingTown = await prisma.town.findUnique({ where: { id: data.attackingTownId } });
    if (!attackingTown) { res.status(404).json({ error: 'Attacking town not found' }); return; }
    if (attackingTown.ownerId !== req.player!.id) {
      res.status(403).json({ error: 'You must be the leader of the attacking town' }); return;
    }
    if (attackingTown.status !== 'approved') {
      res.status(400).json({ error: 'Attacking town must have approved status to declare war' }); return;
    }
    if (data.attackingTownId === data.defendingTownId) {
      res.status(400).json({ error: 'Cannot declare war on your own town' }); return;
    }
    const defendingTown = await prisma.town.findUnique({ where: { id: data.defendingTownId } });
    if (!defendingTown || defendingTown.status !== 'approved') {
      res.status(404).json({ error: 'Defending town not found or not yet approved' }); return;
    }

    const war = await prisma.war.create({
      data: {
        title: data.title,
        reason: data.reason,
        reasonDetails: data.reasonDetails,
        attackerId: req.player!.id,
        attackingTownId: data.attackingTownId,
        defendingTownId: data.defendingTownId,
        status: 'notice_sent',
      },
      include: {
        attackingTown: { select: { id: true, name: true } },
        defendingTown: { select: { id: true, name: true } },
      },
    });

    // Calculate earliest combat time (24h from now)
    const earliestCombat = new Date(war.noticeSentAt.getTime() + 24 * 60 * 60 * 1000);
    res.status(201).json({
      war,
      message: `War notice sent to ${defendingTown.name}. Combat may not begin before ${earliestCombat.toISOString()}.`,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/wars/:id/status
 * Move war from notice_sent → active (only after 24h notice period), or end it.
 */
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, outcome } = req.body;
    const war = await prisma.war.findUnique({ where: { id: (req.params as Record<string, string>).id } });
    if (!war) { res.status(404).json({ error: 'War not found' }); return; }
    if (war.attackerId !== req.player!.id && req.player!.role !== 'admin') {
      res.status(403).json({ error: 'Only the war initiator or admin can update status' }); return;
    }

    // Enforce 24-hour notice before going active
    if (status === 'active') {
      const hoursSinceNotice = (Date.now() - new Date(war.noticeSentAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceNotice < 24 && req.player!.role !== 'admin') {
        const remaining = Math.ceil(24 - hoursSinceNotice);
        res.status(400).json({
          error: `The 24-hour notice period has not elapsed. ${remaining} hour(s) remaining.`,
        });
        return;
      }
    }

    const updateData: any = { status };
    if (status === 'active') updateData.startedAt = new Date();
    if (status === 'ended') {
      updateData.endedAt = new Date();
      if (outcome) updateData.outcome = outcome;
    }

    const updated = await prisma.war.update({
      where: { id: (req.params as Record<string, string>).id },
      data: updateData,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/wars/:id/battles
router.post('/:id/battles', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = addBattleSchema.parse(req.body);
    const war = await prisma.war.findUnique({ where: { id: (req.params as Record<string, string>).id } });
    if (!war) { res.status(404).json({ error: 'War not found' }); return; }
    if (war.status !== 'active') {
      res.status(400).json({ error: 'Battles can only be recorded during an active war' }); return;
    }

    const battle = await prisma.battle.create({
      data: { ...data, warId: (req.params as Record<string, string>).id },
    });

    if (data.victor) {
      const scoreField = data.victor === 'attacker' ? 'attackerScore' : 'defenderScore';
      await prisma.war.update({
        where: { id: (req.params as Record<string, string>).id },
        data: { [scoreField]: { increment: 1 } },
      });
    }

    const warCrimes = [];
    if (data.arsonCommitted) warCrimes.push('arson against residential infrastructure');
    if (data.residentialDamage) warCrimes.push('destruction of residential infrastructure');
    if (data.farmDamage) warCrimes.push('destruction of farm infrastructure');

    res.status(201).json({
      battle,
      warCrimeWarnings: warCrimes.length > 0
        ? `Potential war crimes detected: ${warCrimes.join(', ')}. The defending town may file a legal case.`
        : null,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

export { router as warsRouter };
