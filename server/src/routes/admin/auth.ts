import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { config } from '../../config';
import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { ok } from '../../http/response';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { loadAdminAccess } from '../../security/admin-access';

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

  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  const access = await loadAdminAccess(admin.id);
  if (!access) throw new HttpError('管理员尚未配置有效角色，请联系超级管理员', 403, 403);

  const token = jwt.sign({ sub: String(admin.id), username: admin.username }, config.jwtAdminSecret, {
    expiresIn: '7d'
  });

  res.json(
    ok({
      token,
      admin: access.admin,
      role: access.role,
      permissions: access.permissions
    })
  );
});

adminAuthRouter.get('/profile', requireAdminAuth, async (req, res) => {
  if (!req.adminAccess) throw new HttpError('unauthorized', 401, 401);
  res.json(ok(req.adminAccess));
});
