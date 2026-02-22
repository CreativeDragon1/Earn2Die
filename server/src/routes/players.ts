import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/players - List players (admin/mod only shows full list, others see limited)
router.get('/', async (req, res: Response) => {
  try {
    const search = req.query.search as string | undefined as string | undefined;
    const limit = req.query.limit as string | undefined as string | undefined;
    const where: any = {};
    if (search) {
      where.username = { contains: search as string };
    }

    const players = await prisma.player.findMany({
      where,
      select: {
        id: true,
        username: true,
        role: true,
        reputation: true,
        createdAt: true,
        _count: { select: { townMemberships: true, tradeListings: true } },
      },
      orderBy: { reputation: 'desc' },
      take: limit ? Number(limit) : 50,
    });
    res.json(players);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/:id - Get player profile
router.get('/:id', async (req, res: Response) => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: (req.params as Record<string, string>).id },
      select: {
        id: true,
        username: true,
        role: true,
        reputation: true,
        balance: true,
        createdAt: true,
        townMemberships: {
          include: { town: { select: { id: true, name: true, type: true, banner: true } } },
        },
        ownedTowns: { select: { id: true, name: true, type: true, population: true } },
        _count: {
          select: {
            tradeListings: true,
            warsInitiated: true,
            legalCasesPlaintiff: true,
            legalCasesDefendant: true,
          },
        },
      },
    });
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json(player);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/players/:id/role - Update player role (admin only)
router.put('/:id/role', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!['player', 'mod', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    const updated = await prisma.player.update({
      where: { id: (req.params as Record<string, string>).id },
      data: { role },
      select: { id: true, username: true, role: true },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/stats/overview - Server stats
router.get('/stats/overview', async (_req, res: Response) => {
  try {
    const [playerCount, townCount, activeWars, activeTrades, openCases] = await Promise.all([
      prisma.player.count(),
      prisma.town.count(),
      prisma.war.count({ where: { status: { in: ['declared', 'active'] } } }),
      prisma.tradeListing.count({ where: { status: 'active' } }),
      prisma.legalCase.count({ where: { status: { not: 'closed' } } }),
    ]);

    res.json({ playerCount, townCount, activeWars, activeTrades, openCases });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as playersRouter };
