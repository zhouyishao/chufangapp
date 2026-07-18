import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../../prisma';
import { parseBearerToken, verifyAppAccessToken } from '../../services/app-token';
import { fail } from '../response';

declare module 'express-serve-static-core' {
  interface Request {
    appUser?: { id: number };
  }
}

export const requireAppAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = parseBearerToken(req.header('authorization'));
  if (!token) {
    res.status(401).json(fail(401, 'unauthorized'));
    return;
  }

  try {
    const payload = verifyAppAccessToken(token);
    const user = await prisma.user.findFirst({
      where: {
        id: Number(payload.sub),
        deletedAt: null,
        isDeleted: false,
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    if (!user) {
      res.status(401).json(fail(401, 'unauthorized'));
      return;
    }

    req.appUser = user;
    next();
  } catch {
    res.status(401).json(fail(401, 'unauthorized'));
  }
};
