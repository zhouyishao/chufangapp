import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { baseContentSchema, baseListQuerySchema, parseId } from './shared';

const upsertSchema = baseContentSchema.extend({
  userId: z.coerce.number().int().nullable().optional(),
  recipeId: z.coerce.number().int().nullable().optional(),
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().nullable().optional(),
  images: z.array(z.string()).default([]),
  postStatus: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).default('PUBLISHED')
});

export const adminPostsRouter = Router();

adminPostsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(typeof isPublish === 'boolean' ? { isPublish } : {}),
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { user: { select: { id: true, nickname: true, avatar: true } }, recipe: { select: { id: true, title: true } } },
      orderBy: [{ id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.post.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminPostsRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.post.findFirst({ where: { id: parseId(req.params.id), deletedAt: null } });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminPostsRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.post.create({ data: parsed.data })));
});

adminPostsRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.post.update({ where: { id: parseId(req.params.id) }, data: parsed.data })));
});

adminPostsRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  res.json(ok(await prisma.post.update({ where: { id: parseId(req.params.id) }, data: { deletedAt: new Date() } })));
});
