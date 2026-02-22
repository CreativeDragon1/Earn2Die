import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const createReportSchema = z.object({
  missionType: z.enum(['infiltration', 'sabotage', 'intel', 'counter_spy', 'assassination']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  title: z.string().min(3).max(100),
  details: z.string().min(10).max(2000),
  evidence: z.string().max(500).optional(),
  targetPlayerId: z.string().optional(),
  targetTownId: z.string().optional(),
  isClassified: z.boolean().optional(),
});

// GET /api/espionage - List reports
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined as string | undefined;
    const missionType = req.query.missionType as string | undefined as string | undefined;
    const where: any = {};
    
    // Non-admins can only see their own reports or non-classified
    if (req.player!.role !== 'admin') {
      where.OR = [
        { spyId: req.player!.id },
        { isClassified: false },
      ];
    }
    if (status) where.status = status;
    if (missionType) where.missionType = missionType;

    const reports = await prisma.espionageReport.findMany({
      where,
      include: {
        spy: { select: { id: true, username: true } },
        targetPlayer: { select: { id: true, username: true } },
        targetTown: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/espionage/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const report = await prisma.espionageReport.findUnique({
      where: { id: (req.params as Record<string, string>).id },
      include: {
        spy: { select: { id: true, username: true } },
        targetPlayer: { select: { id: true, username: true } },
        targetTown: { select: { id: true, name: true } },
      },
    });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    if (report.isClassified && report.spyId !== req.player!.id && req.player!.role !== 'admin') {
      res.status(403).json({ error: 'Classified report' });
      return;
    }
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/espionage - Create espionage report
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = createReportSchema.parse(req.body);

    const report = await prisma.espionageReport.create({
      data: {
        ...data,
        spyId: req.player!.id,
      },
      include: {
        spy: { select: { id: true, username: true } },
        targetTown: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(report);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/espionage/:id/status - Update report status
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, intelGained } = req.body;

    const report = await prisma.espionageReport.findUnique({ where: { id: (req.params as Record<string, string>).id } });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    if (report.spyId !== req.player!.id && req.player!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const updateData: any = { status };
    if (status === 'completed' || status === 'failed' || status === 'intercepted') {
      updateData.resolvedAt = new Date();
    }
    if (intelGained) updateData.intelGained = intelGained;

    const updated = await prisma.espionageReport.update({
      where: { id: (req.params as Record<string, string>).id },
      data: updateData,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as espionageRouter };
