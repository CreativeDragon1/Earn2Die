import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

const applyTownSchema = z.object({
  name: z.string().min(2).max(32),
  description: z.string().max(500).optional(),
  motto: z.string().max(100).optional(),
  coordinates: z.string().min(1),
  // Usernames of the founding members (must include the applicant; min 5 total)
  founderUsernames: z.array(z.string()).min(5, 'A town requires at least 5 founding members'),
});

const updateTownSchema = z.object({
  description: z.string().max(500).optional(),
  motto: z.string().max(100).optional(),
  banner: z.string().url().optional(),
  hasWall: z.boolean().optional(),
  hasPathConnection: z.boolean().optional(),
  hasConstitution: z.boolean().optional(),
});

// Helper: recalculate protection status and land area
async function refreshProtection(townId: string) {
  const town = await prisma.town.findUnique({
    where: { id: townId },
    include: { _count: { select: { members: true } } },
  });
  if (!town) return;
  const allRequirementsMet =
    town.hasWall &&
    town.hasPathConnection &&
    town.hasConstitution &&
    town.status === 'approved';
  // 150x150 base + 50x50 per additional registered member beyond the first 5
  const extraMembers = Math.max(0, town._count.members - 5);
  const landArea = 150 * 150 + extraMembers * 50 * 50;
  await prisma.town.update({
    where: { id: townId },
    data: { protectionStatus: allRequirementsMet, territory: Math.floor(landArea / 256) },
  });
}

// ─── PUBLIC ROUTES ──────────────────────────────────────────────

// GET /api/towns - List all approved towns (admin sees all)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const isAdmin = req.player!.role === 'admin';
  try {
    const towns = await prisma.town.findMany({
      where: isAdmin ? undefined : { status: 'approved' },
      include: {
        owner: { select: { id: true, username: true } },
        _count: { select: { members: true } },
      },
      orderBy: { population: 'desc' },
    });
    res.json(towns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/towns/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const town = await prisma.town.findUnique({
      where: { id: (req.params as Record<string, string>).id },
      include: {
        owner: { select: { id: true, username: true } },
        members: {
          include: { player: { select: { id: true, username: true, reputation: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        alliances1: { include: { town2: { select: { id: true, name: true } } } },
        alliances2: { include: { town1: { select: { id: true, name: true } } } },
      },
    });
    if (!town) { res.status(404).json({ error: 'Town not found' }); return; }
    // Non-admins can only view approved towns
    if (town.status !== 'approved' && req.player!.role !== 'admin') {
      res.status(404).json({ error: 'Town not found' }); return;
    }
    res.json(town);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TOWN APPLICATION ───────────────────────────────────────────

/**
 * POST /api/towns/apply
 * Any player can submit a town application. It creates a Town with status=pending_approval.
 * The applicant must supply at least 5 founder usernames. The server admin reviews and
 * calls the approve or reject endpoint.
 * NOTE: town membership is NOT assigned until admin approves. The applicant also must
 * not already be in a town.
 */
router.post('/apply', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Applicant must not already be in any town
    const existing = await prisma.townMember.findUnique({ where: { playerId: req.player!.id } });
    if (existing) {
      res.status(409).json({ error: 'You are already a permanent member of a town and cannot found a new one.' });
      return;
    }

    const data = applyTownSchema.parse(req.body);

    // Validate that all founder usernames exist and haven't already joined a town
    const founders = await prisma.player.findMany({
      where: { username: { in: data.founderUsernames } },
    });
    if (founders.length < data.founderUsernames.length) {
      const missing = data.founderUsernames.filter(u => !founders.find(f => f.username === u));
      res.status(400).json({ error: `Unknown player usernames: ${missing.join(', ')}` });
      return;
    }
    const alreadyInTown = await prisma.townMember.findMany({
      where: { playerId: { in: founders.map(f => f.id) } },
      include: { player: { select: { username: true } } },
    });
    if (alreadyInTown.length > 0) {
      const names = alreadyInTown.map(m => m.player.username).join(', ');
      res.status(409).json({ error: `These players are already permanent members of a town: ${names}` });
      return;
    }

    // Ensure applicant is among the founders
    const applicantInList = founders.find(f => f.id === req.player!.id);
    if (!applicantInList) {
      res.status(400).json({ error: 'You must include yourself in the founder list.' });
      return;
    }

    const town = await prisma.town.create({
      data: {
        name: data.name,
        description: data.description,
        motto: data.motto,
        coordinates: data.coordinates,
        ownerId: req.player!.id,
        status: 'pending_approval',
        pendingMemberIds: JSON.stringify(founders.map(f => f.id)),
      },
      include: { owner: { select: { id: true, username: true } } },
    });

    res.status(201).json({
      town,
      message: 'Town application submitted. Server admin will review it.',
      pendingFounders: founders.map(f => f.username),
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Town name already taken' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN ONLY ROUTES ──────────────────────────────────────────

/**
 * POST /api/towns/:id/approve  [admin only]
 * Approves a pending town application and creates TownMember records for all founders.
 */
router.post('/:id/approve', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const town = await prisma.town.findUnique({ where: { id: (req.params as Record<string, string>).id } });
    if (!town) { res.status(404).json({ error: 'Town not found' }); return; }
    if (town.status !== 'pending_approval') {
      res.status(400).json({ error: `Town is already ${town.status}` }); return;
    }

    const memberIds: string[] = town.pendingMemberIds ? JSON.parse(town.pendingMemberIds) : [];

    // Double-check no founder has joined another town in the meantime
    const conflicts = await prisma.townMember.findMany({
      where: { playerId: { in: memberIds } },
      include: { player: { select: { username: true } } },
    });
    if (conflicts.length > 0) {
      const names = conflicts.map(m => m.player.username).join(', ');
      res.status(409).json({ error: `These founders already belong to a different town and must be removed: ${names}` });
      return;
    }

    // Create TownMember records
    await prisma.townMember.createMany({
      data: memberIds.map((pid, i) => ({
        playerId: pid,
        townId: town.id,
        role: pid === town.ownerId ? 'leader' : 'citizen',
      })),
    });

    const updated = await prisma.town.update({
      where: { id: town.id },
      data: {
        status: 'approved',
        population: memberIds.length,
        pendingMemberIds: null,
      },
      include: { owner: { select: { id: true, username: true } }, members: { include: { player: { select: { id: true, username: true } } } } },
    });

    await refreshProtection(town.id);
    res.json({ message: 'Town approved', town: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/towns/:id/reject  [admin only]
 */
router.post('/:id/reject', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const town = await prisma.town.findUnique({ where: { id: (req.params as Record<string, string>).id } });
    if (!town) { res.status(404).json({ error: 'Town not found' }); return; }
    const updated = await prisma.town.update({
      where: { id: town.id },
      data: { status: 'rejected', pendingMemberIds: null },
    });
    res.json({ message: 'Town application rejected', town: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/towns/:id/add-member  [admin only]
 * Registers a new member with an approved town. The player becomes a permanent member.
 */
router.post('/:id/add-member', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { username } = z.object({ username: z.string() }).parse(req.body);
    const townId = (req.params as Record<string, string>).id;

    const town = await prisma.town.findUnique({ where: { id: townId } });
    if (!town) { res.status(404).json({ error: 'Town not found' }); return; }
    if (town.status !== 'approved') {
      res.status(400).json({ error: 'Town must be approved before adding members' }); return;
    }

    const player = await prisma.player.findUnique({ where: { username } });
    if (!player) { res.status(404).json({ error: 'Player not found' }); return; }

    const alreadyMember = await prisma.townMember.findUnique({ where: { playerId: player.id } });
    if (alreadyMember) {
      res.status(409).json({ error: 'Player is already a permanent member of a town' }); return;
    }

    const membership = await prisma.townMember.create({
      data: { playerId: player.id, townId },
      include: { player: { select: { id: true, username: true } } },
    });
    await prisma.town.update({ where: { id: townId }, data: { population: { increment: 1 } } });
    await refreshProtection(townId);

    res.status(201).json({ message: `${username} permanently added to ${town.name}`, membership });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── TOWN OWNER / ADMIN UPDATES ─────────────────────────────────

// PUT /api/towns/:id - Update town details & requirement flags
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const town = await prisma.town.findUnique({ where: { id: (req.params as Record<string, string>).id } });
    if (!town) { res.status(404).json({ error: 'Town not found' }); return; }
    if (town.ownerId !== req.player!.id && req.player!.role !== 'admin') {
      res.status(403).json({ error: 'Only the town owner or admin can update' }); return;
    }

    const data = updateTownSchema.parse(req.body);
    const updated = await prisma.town.update({
      where: { id: (req.params as Record<string, string>).id },
      data,
      include: { owner: { select: { id: true, username: true } } },
    });
    await refreshProtection(updated.id);
    res.json(updated);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/towns/:id [admin only]
router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const town = await prisma.town.findUnique({ where: { id: (req.params as Record<string, string>).id } });
    if (!town) { res.status(404).json({ error: 'Town not found' }); return; }
    await prisma.town.delete({ where: { id: (req.params as Record<string, string>).id } });
    res.json({ message: 'Town removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as townsRouter };
