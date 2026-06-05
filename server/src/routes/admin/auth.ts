import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { config } from '../../config';
import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { ok } from '../../http/response';
import { requireAdminAuth } from '../../http/middleware/admin-auth';

const loginSchema = z.object({
  username: z.string().trim().min(1).max(32),
  password: z.string().min(1).max(128)
});

export const adminAuthRouter = Router();

adminAuthRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const { username, password } = parsed.data;

  const admin = await prisma.admin.findFirst({
    where: {
      OR: [{ username }, { nickname: username }],
      deletedAt: null,
      status: 'ACTIVE'
    }
  });
  if (!admin) throw new HttpError('用户名或密码错误', 400, 400);

  const okPassword = await bcrypt.compare(password, admin.passwordHash);
  if (!okPassword) throw new HttpError('用户名或密码错误', 400, 400);

  const token = jwt.sign({ sub: String(admin.id), username: admin.username }, config.jwtAdminSecret, {
    expiresIn: '7d'
  });

  res.json(
    ok({
      token,
      admin: { id: admin.id, username: admin.username, nickname: admin.nickname ?? null }
    })
  );
});

adminAuthRouter.get('/profile', requireAdminAuth, async (req, res) => {
  const adminId = Number.parseInt(req.admin?.sub ?? '', 10);
  if (!Number.isFinite(adminId)) throw new HttpError('unauthorized', 401, 401);

  const admin = await prisma.admin.findFirst({
    where: { id: adminId, deletedAt: null, status: 'ACTIVE' },
    select: { id: true, username: true, nickname: true, createdAt: true, updatedAt: true }
  });
  if (!admin) throw new HttpError('unauthorized', 401, 401);

  res.json(ok(admin));
});
