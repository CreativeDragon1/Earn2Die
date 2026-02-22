import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const fileCaseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(20).max(5000),
  type: z.enum(['dispute', 'criminal', 'appeal', 'treaty_violation', 'land_claim']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  evidence: z.string().max(2000).optional(),
  defendantId: z.string(),
  townId: z.string().optional(),
});

const verdictSchema = z.object({
  decision: z.enum(['guilty', 'not_guilty', 'settled', 'dismissed']),
  reasoning: z.string().min(10).max(5000),
  penalty: z.string().max(1000).optional(),
});

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  isOfficial: z.boolean().optional(),
});

// GET /api/legal - List cases
router.get('/', async (req, res: Response) => {
  try {
    const status = req.query.status as string | undefined as string | undefined;
    const type = req.query.type as string | undefined as string | undefined;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const cases = await prisma.legalCase.findMany({
      where,
      include: {
        plaintiff: { select: { id: true, username: true } },
        defendant: { select: { id: true, username: true } },
        judge: { select: { id: true, username: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { filedAt: 'desc' },
    });
    res.json(cases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/legal/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const legalCase = await prisma.legalCase.findUnique({
      where: { id: (req.params as Record<string, string>).id },
      include: {
        plaintiff: { select: { id: true, username: true } },
        defendant: { select: { id: true, username: true } },
        judge: { select: { id: true, username: true } },
        town: { select: { id: true, name: true } },
        verdict: { include: { judge: { select: { id: true, username: true } } } },
        comments: {
          include: { author: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!legalCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.json(legalCase);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/legal - File a case
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = fileCaseSchema.parse(req.body);

    if (data.defendantId === req.player!.id) {
      res.status(400).json({ error: 'Cannot file a case against yourself' });
      return;
    }

    const legalCase = await prisma.legalCase.create({
      data: {
        ...data,
        plaintiffId: req.player!.id,
      },
      include: {
        plaintiff: { select: { id: true, username: true } },
        defendant: { select: { id: true, username: true } },
      },
    });
    res.status(201).json(legalCase);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/legal/:id/assign-judge - Assign a judge
router.put('/:id/assign-judge', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.player!.role !== 'admin' && req.player!.role !== 'mod') {
      res.status(403).json({ error: 'Only admins or mods can assign judges' });
      return;
    }

    const { judgeId } = req.body;
    const updated = await prisma.legalCase.update({
      where: { id: (req.params as Record<string, string>).id },
      data: { judgeId, status: 'under_review' },
      include: { judge: { select: { id: true, username: true } } },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/legal/:id/status - Update case status
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const legalCase = await prisma.legalCase.findUnique({ where: { id: (req.params as Record<string, string>).id } });
    if (!legalCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    if (legalCase.judgeId !== req.player!.id && req.player!.role !== 'admin') {
      res.status(403).json({ error: 'Only the assigned judge or admin can update status' });
      return;
    }

    const { status, trialDate } = req.body;
    const updateData: any = { status };
    if (trialDate) updateData.trialDate = new Date(trialDate);
    if (status === 'closed') updateData.closedAt = new Date();

    const updated = await prisma.legalCase.update({
      where: { id: (req.params as Record<string, string>).id },
      data: updateData,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/legal/:id/verdict - Issue verdict
router.post('/:id/verdict', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const legalCase = await prisma.legalCase.findUnique({ where: { id: (req.params as Record<string, string>).id } });
    if (!legalCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    if (legalCase.judgeId !== req.player!.id && req.player!.role !== 'admin') {
      res.status(403).json({ error: 'Only the assigned judge can issue a verdict' });
      return;
    }

    const data = verdictSchema.parse(req.body);

    const verdict = await prisma.verdict.create({
      data: {
        ...data,
        caseId: (req.params as Record<string, string>).id,
        judgeId: req.player!.id,
      },
    });

    await prisma.legalCase.update({
      where: { id: (req.params as Record<string, string>).id },
      data: { status: 'closed', closedAt: new Date() },
    });

    res.status(201).json(verdict);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Verdict already issued for this case' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/legal/:id/comments - Add comment
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = commentSchema.parse(req.body);

    // Only judges/admins can post official comments
    if (data.isOfficial && req.player!.role !== 'admin' && req.player!.role !== 'mod') {
      const legalCase = await prisma.legalCase.findUnique({ where: { id: (req.params as Record<string, string>).id } });
      if (!legalCase || legalCase.judgeId !== req.player!.id) {
        res.status(403).json({ error: 'Only judges can post official comments' });
        return;
      }
    }

    const comment = await prisma.caseComment.create({
      data: {
        ...data,
        caseId: (req.params as Record<string, string>).id,
        authorId: req.player!.id,
      },
      include: { author: { select: { id: true, username: true } } },
    });
    res.status(201).json(comment);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

export { router as legalRouter };
