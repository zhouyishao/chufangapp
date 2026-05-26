import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';

const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().trim().optional()
});

const idParam = (value: unknown) => {
  if (Array.isArray(value)) throw new HttpError('参数错误', 400, 400);
  const id = Number.parseInt(String(value), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);
  return id;
};

export const apiMobileRouter = Router();

apiMobileRouter.post('/auth/login', async (req, res) => {
  const schema = z.object({
    phone: z.string().trim().max(32).optional(),
    openid: z.string().trim().max(80).optional(),
    nickname: z.string().trim().max(60).optional(),
    avatar: z.string().trim().max(255).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || (!parsed.data.phone && !parsed.data.openid)) throw new HttpError('参数错误', 400, 400);

  const user = parsed.data.phone
    ? await prisma.user.upsert({
        where: { phone: parsed.data.phone },
        create: { ...parsed.data, sourceType: 'USER' },
        update: { nickname: parsed.data.nickname, avatar: parsed.data.avatar }
      })
    : await prisma.user.upsert({
        where: { openid: parsed.data.openid },
        create: { ...parsed.data, sourceType: 'USER' },
        update: { nickname: parsed.data.nickname, avatar: parsed.data.avatar }
      });
  res.json(ok(user));
});

apiMobileRouter.get('/home', async (_req, res) => {
  const [banners, recommendations, seasonalFoods, categories, menus] = await Promise.all([
    prisma.banner.findMany({
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true },
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      take: 5
    }),
    prisma.recommendation.findMany({
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true },
      include: {
        recipe: { select: { id: true, title: true, cover: true, subtitle: true } },
        ingredient: { select: { id: true, name: true, cover: true } }
      },
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      take: 10
    }),
    prisma.seasonalFood.findMany({
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true },
      include: { ingredient: { select: { id: true, name: true, cover: true } } },
      orderBy: [{ month: 'asc' }, { sort: 'desc' }],
      take: 12
    }),
    prisma.category.findMany({
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true },
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      take: 12
    }),
    prisma.menu.findMany({
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true },
      include: { recipes: { include: { recipe: { select: { id: true, title: true, cover: true } } } } },
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      take: 6
    })
  ]);
  res.json(ok({ banners, recommendations, seasonalFoods, categories, menus }));
});

apiMobileRouter.get('/recommendations', async (req, res) => {
  const parsed = pageQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    status: 'ACTIVE' as const,
    isPublish: true,
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.recommendation.findMany({ where, orderBy: [{ sort: 'desc' }, { id: 'desc' }], skip, take: pageSize }),
    prisma.recommendation.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

apiMobileRouter.get('/seasonal-foods', async (req, res) => {
  const parsed = pageQuerySchema.extend({ month: z.coerce.number().int().min(1).max(12).optional() }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, month } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    status: 'ACTIVE' as const,
    isPublish: true,
    ...(month ? { month } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.seasonalFood.findMany({
      where,
      include: { ingredient: { select: { id: true, name: true, cover: true } } },
      orderBy: [{ month: 'asc' }, { sort: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.seasonalFood.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

apiMobileRouter.get('/search', async (req, res) => {
  const parsed = pageQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const keyword = parsed.data.q ?? '';
  const where = { deletedAt: null, status: 'ACTIVE' as const, isPublish: true };
  const [recipes, ingredients] = await Promise.all([
    prisma.recipe.findMany({
      where: { ...where, ...(keyword ? { title: { contains: keyword, mode: 'insensitive' as const } } : {}) },
      orderBy: [{ isRecommend: 'desc' }, { id: 'desc' }],
      take: 10
    }),
    prisma.ingredient.findMany({
      where: { ...where, ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}) },
      orderBy: [{ isRecommend: 'desc' }, { id: 'desc' }],
      take: 10
    })
  ]);
  res.json(ok({ recipes, ingredients }));
});

apiMobileRouter.get('/favorites', async (req, res) => {
  const parsed = pageQuerySchema.extend({ userId: z.coerce.number().int() }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { userId, page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = { userId, deletedAt: null };
  const [list, total] = await Promise.all([
    prisma.favorite.findMany({
      where,
      include: { recipe: true, ingredient: true },
      orderBy: [{ id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.favorite.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

apiMobileRouter.get('/profile', async (req, res) => {
  const schema = z.object({ userId: z.coerce.number().int() });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const user = await prisma.user.findFirst({
    where: { id: parsed.data.userId, deletedAt: null },
    select: {
      id: true,
      phone: true,
      nickname: true,
      avatar: true,
      createdAt: true,
      _count: { select: { favorites: true, comments: true, posts: true } }
    }
  });
  if (!user) throw new HttpError('not found', 404, 404);
  res.json(ok(user));
});

apiMobileRouter.post('/favorites', async (req, res) => {
  const schema = z.object({
    userId: z.coerce.number().int(),
    recipeId: z.coerce.number().int().nullable().optional(),
    ingredientId: z.coerce.number().int().nullable().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || (!parsed.data.recipeId && !parsed.data.ingredientId)) throw new HttpError('参数错误', 400, 400);
  const created = await prisma.favorite.create({ data: parsed.data });
  if (parsed.data.recipeId) {
    await prisma.recipe.update({ where: { id: parsed.data.recipeId }, data: { favoriteCount: { increment: 1 } } });
  }
  res.json(ok(created));
});

apiMobileRouter.delete('/favorites/:id', async (req, res) => {
  res.json(ok(await prisma.favorite.update({ where: { id: idParam(req.params.id) }, data: { deletedAt: new Date() } })));
});
