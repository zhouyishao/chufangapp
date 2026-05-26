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

export const apiIngredientsRouter = Router();

apiIngredientsRouter.get('/', async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, categoryId } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    isPublish: true,
    status: 'ACTIVE' as const,
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, total] = await Promise.all([
    prisma.ingredient.findMany({
      where,
      orderBy: [{ isRecommend: 'desc' }, { sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize,
      include: { category: { select: { id: true, name: true, type: true } } }
    }),
    prisma.ingredient.count({ where })
  ]);

  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

apiIngredientsRouter.get('/:id', async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const item = await prisma.ingredient.findFirst({
    where: { id, deletedAt: null, isPublish: true, status: 'ACTIVE' },
    include: { category: { select: { id: true, name: true, type: true } } }
  });
  if (!item) throw new HttpError('not found', 404, 404);

  res.json(ok(item));
});
