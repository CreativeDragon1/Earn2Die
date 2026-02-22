import { Request, Response, NextFunction } from 'express';
import admin from '../lib/firebase';
import prisma from '../lib/prisma';

export type AuthRequest = Request & {
  player?: {
    id: string;
    username: string;
    role: string;
    firebaseUid: string;
  };
};

/**
 * Verifies the Firebase ID token from the Authorization header,
 * then loads the matching Player record from the database.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = header.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const player = await prisma.player.findUnique({ where: { firebaseUid: decoded.uid } });

    if (!player) {
      res.status(401).json({ error: 'Player profile not found. Complete registration first.' });
      return;
    }

    req.player = {
      id: player.id,
      username: player.username,
      role: player.role,
      firebaseUid: decoded.uid,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.player) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.player.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
