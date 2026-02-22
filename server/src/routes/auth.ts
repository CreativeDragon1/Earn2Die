import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import admin from '../lib/firebase';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Verifies Firebase token without requiring a Player record (for first-time setup)
async function verifyFirebaseOnly(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(header.split(' ')[1]);
    (req as any).firebaseUid = decoded.uid;
    (req as any).firebaseEmail = decoded.email || '';
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired Firebase token' });
  }
}

const profileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric and underscores only'),
  minecraftUuid: z.string().optional(),
});

/**
 * POST /api/auth/profile
 * Called from the frontend after Firebase sign-in/sign-up.
 * Creates the Player record on first call; returns existing profile on subsequent calls.
 */
router.post('/profile', verifyFirebaseOnly, async (req: Request, res: Response) => {
  const firebaseUid = (req as any).firebaseUid as string;
  const firebaseEmail = (req as any).firebaseEmail as string;

  try {
    const existing = await prisma.player.findUnique({ where: { firebaseUid } });
    if (existing) {
      const townMembership = await prisma.townMember.findUnique({
        where: { playerId: existing.id },
        include: { town: { select: { id: true, name: true, type: true, status: true } } },
      });
      res.json({ player: existing, townMembership });
      return;
    }

    // New player — username required in request body
    const data = profileSchema.parse(req.body);

    const player = await prisma.player.create({
      data: {
        firebaseUid,
        username: data.username,
        email: firebaseEmail,
        minecraftUuid: data.minecraftUuid,
      },
      select: {
        id: true, username: true, email: true, role: true,
        balance: true, reputation: true, minecraftUuid: true, createdAt: true,
      },
    });

    res.status(201).json({ player, townMembership: null });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Returns the current player's full profile including town membership.
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: req.player!.id },
      select: {
        id: true, username: true, email: true, role: true,
        balance: true, reputation: true, minecraftUuid: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    const townMembership = await prisma.townMember.findUnique({
      where: { playerId: player.id },
      include: { town: { select: { id: true, name: true, type: true, status: true } } },
    });
    res.json({ ...player, townMembership });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as authRouter };
