import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { ok, type PageResult } from '../../http/response';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().trim().optional(),
  categoryId: z.coerce.number().int().optional()
});

export const apiRecipesRouter = Router();

apiRecipesRouter.get('/', async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, categoryId } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    isPublish: true,
    status: 'ACTIVE' as const,
    auditStatus: 'APPROVED' as const,
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: [{ isRecommend: 'desc' }, { sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        subtitle: true,
        cover: true,
        description: true,
        cookTime: true,
        servings: true,
        difficulty: true,
        taste: true,
        scene: true,
        viewCount: true,
        favoriteCount: true,
        commentCount: true,
        createdAt: true,
        updatedAt: true,
        categoryId: true,
        category: { select: { id: true, name: true, type: true } },
        cuisineId: true,
        cuisine: { select: { id: true, name: true } }
      }
    }),
    prisma.recipe.count({ where })
  ]);

  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

apiRecipesRouter.get('/:id', async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const recipe = await prisma.recipe.findFirst({
    where: { id, deletedAt: null, isPublish: true, status: 'ACTIVE', auditStatus: 'APPROVED' },
    include: {
      category: { select: { id: true, name: true, type: true } },
      cuisine: { select: { id: true, name: true } },
      steps: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      ingredients: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] }
    }
  });
  if (!recipe) throw new HttpError('not found', 404, 404);

  await prisma.recipe.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  res.json(ok(recipe));
});
