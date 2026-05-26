import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { baseContentSchema, baseListQuerySchema, parseId } from './shared';

const menuRecipeSchema = z.object({
  recipeId: z.coerce.number().int(),
  sortIndex: z.coerce.number().int().min(0).default(0)
});

const upsertSchema = baseContentSchema.extend({
  name: z.string().trim().min(1).max(120),
  scene: z.string().trim().max(80).nullable().optional(),
  cover: z.string().trim().max(255).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  recipes: z.array(menuRecipeSchema).default([])
});

export const adminMenusRouter = Router();

adminMenusRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish, isRecommend } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(typeof isPublish === 'boolean' ? { isPublish } : {}),
    ...(typeof isRecommend === 'boolean' ? { isRecommend } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.menu.findMany({
      where,
      include: { recipes: { include: { recipe: { select: { id: true, title: true, cover: true } } } } },
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.menu.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminMenusRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.menu.findFirst({
    where: { id: parseId(req.params.id), deletedAt: null },
    include: { recipes: { include: { recipe: { select: { id: true, title: true, cover: true } } } } }
  });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminMenusRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { recipes, ...menu } = parsed.data;
  const created = await prisma.menu.create({
    data: { ...menu, recipes: { create: recipes } },
    include: { recipes: true }
  });
  res.json(ok(created));
});

adminMenusRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { recipes, ...menu } = parsed.data;
  const updated = await prisma.$transaction(async (tx) => {
    await tx.menuRecipe.deleteMany({ where: { menuId: id } });
    return tx.menu.update({
      where: { id },
      data: { ...menu, recipes: { create: recipes } },
      include: { recipes: true }
    });
  });
  res.json(ok(updated));
});

adminMenusRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  res.json(ok(await prisma.menu.update({ where: { id: parseId(req.params.id) }, data: { deletedAt: new Date() } })));
});
