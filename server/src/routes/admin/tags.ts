import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { baseListQuerySchema, parseId } from './shared';

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(80),
  scope: z.enum(['RECIPE', 'INGREDIENT', 'SCENE', 'TASTE', 'METHOD', 'CROWD']),
  sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  isPublish: z.coerce.boolean().default(true)
});

export const adminTagsRouter = Router();

adminTagsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.extend({
    scope: z.enum(['RECIPE', 'INGREDIENT', 'SCENE', 'TASTE', 'METHOD', 'CROWD']).optional()
  }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, scope } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(scope ? { scope } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, total] = await Promise.all([
    prisma.tag.findMany({
      where,
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.tag.count({ where })
  ]);

  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminTagsRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const item = await prisma.tag.findFirst({ where: { id, deletedAt: null } });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminTagsRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const created = await prisma.tag.create({ data: parsed.data });
  res.json(ok(created));
});

adminTagsRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const updated = await prisma.tag.update({ where: { id }, data: parsed.data });
  res.json(ok(updated));
});

adminTagsRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const existing = await prisma.tag.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const recipeRefs = await prisma.recipeTag.count({ where: { tagId: id, deletedAt: null } });
  const ingredientRefs = await prisma.ingredientTag.count({ where: { tagId: id, deletedAt: null } });
  if (recipeRefs + ingredientRefs > 0) throw new HttpError('该标签已被内容引用，不能删除', 422, 422);

  const deleted = await prisma.tag.update({ where: { id }, data: { deletedAt: new Date() } });
  res.json(ok(deleted));
});

adminTagsRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const schema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const updated = await prisma.tag.update({ where: { id }, data: { status: parsed.data.status } });
  res.json(ok(updated));
});
