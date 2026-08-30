import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { hashMobilePassword, isValidMobilePassword } from '../../services/mobile-password';
import { parseId } from './shared';

const formatZodError = (result: any): HttpError => {
  if (result.success) return new HttpError('无错误', 400, 400);
  const errorMsg = result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ');
  return new HttpError(`参数格式错误: ${errorMsg}`, 400, 400);
};

// Zod schemas for user operations
const createUserSchema = z.object({
  nickname: z.string().trim().min(1, '昵称必填').max(60),
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  email: z.string().trim().email('邮箱格式不正确').or(z.literal('')).nullable().optional(),
  password: z.string().max(72).refine(isValidMobilePassword, '密码至少 8 位且必须包含字母和数字'),
  avatar: z.string().trim().max(255).nullable().optional(),
  gender: z.string().trim().max(16).nullable().optional(),
  birthday: z.string().trim().nullable().optional(),
  region: z.string().trim().max(100).nullable().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  role: z.string().trim().max(32).default('USER'),
  source: z.string().trim().max(32).default('ADMIN_CREATED')
});

const updateUserSchema = z.object({
  nickname: z.string().trim().min(1, '昵称必填').max(60).optional(),
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').or(z.literal('')).nullable().optional(),
  email: z.string().trim().email('邮箱格式不正确').or(z.literal('')).nullable().optional(),
  password: z.string().max(72).refine(
    (value) => value === '' || isValidMobilePassword(value),
    '密码至少 8 位且必须包含字母和数字'
  ).optional(),
  avatar: z.string().trim().max(255).nullable().optional(),
  gender: z.string().trim().max(16).nullable().optional(),
  birthday: z.string().trim().nullable().optional(),
  region: z.string().trim().max(100).nullable().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  role: z.string().trim().max(32).optional()
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  source: z.string().trim().optional(),
  role: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional()
});

const activityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  userId: z.coerce.number().int().positive().optional(),
  targetType: z.enum(['RECIPE', 'INGREDIENT']).optional()
});

const behaviorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  eventType: z.enum(['VIEW', 'FAVORITE', 'SEARCH', 'BASKET_ADD']).optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional()
});

const toDateRange = (startDate?: string, endDate?: string) => {
  const range: { gte?: Date; lte?: Date } = {};
  if (startDate) {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) throw new HttpError('时间格式不正确', 400, 400);
    range.gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) throw new HttpError('时间格式不正确', 400, 400);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return Object.keys(range).length > 0 ? range : undefined;
};

// Formatter to sanitize output (hide passwordHash)
const formatUser = (
  user: any
) => {
  const familyMemberCount = user._count?.familyMembers ?? 0;
  const ownedFamilyCount = user._count?.ownedFamilies ?? 0;
  const recentActiveAt = user.viewHistories?.[0]?.createdAt ?? user.updatedAt;

  return {
    id: user.bizId ?? `user_${user.id}`,
    legacyId: user.id,
    code: user.code ?? `YH${String(user.id).padStart(6, '0')}`,
    phone: user.phone || null,
    openid: user.openid || null,
    nickname: user.nickname,
    avatar: user.avatar || null,
    gender: user.gender || null,
    email: user.email || null,
    role: user.role,
    source: user.source,
    birthday: user.birthday ? user.birthday.toISOString().slice(0, 10) : null,
    region: user.region || null,
    status: user.status,
    hasPassword: Boolean(user.passwordHash),
    registerSource: user.openid ? 'WECHAT' : 'PHONE',
    joinedFamilyCount: familyMemberCount,
    createdFamilyCount: ownedFamilyCount,
    familyCount: familyMemberCount + ownedFamilyCount,
    favoriteCount: user._count?.favorites ?? 0,
    recentViewCount: user._count?.viewHistories ?? 0,
    recipeCount: user._count?.recipes ?? 0,
    postCount: user._count?.posts ?? 0,
    commentCount: user._count?.comments ?? 0,
    submissionCount: (user._count?.recipes ?? 0) + (user._count?.posts ?? 0),
    priceRecordCount: 0,
    lastActiveAt: recentActiveAt,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const adminUsersRouter = Router();

// 1. GET /api/admin/users
adminUsersRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, status, source, role, startDate, endDate } = parsed.data;
  const skip = (page - 1) * pageSize;
  const createdRange = toDateRange(startDate, endDate);

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(source && source !== 'all' ? { source } : {}),
    ...(role && role !== 'all' ? { role } : {}),
    ...(createdRange ? { createdAt: createdRange } : {}),
    ...(q
      ? {
          OR: [
            { nickname: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
            { bizId: { contains: q, mode: 'insensitive' as const } },
            { code: { contains: q, mode: 'insensitive' as const } }
          ]
        }
      : {})
  };

  const [list, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ id: 'desc' }],
      skip,
      take: pageSize,
      include: {
        _count: {
          select: {
            favorites: true,
            viewHistories: true,
            familyMembers: true,
            ownedFamilies: true,
            recipes: true,
            posts: true,
            comments: true
          }
        },
        viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
      }
    }),
    prisma.user.count({ where })
  ]);

  const data: PageResult<ReturnType<typeof formatUser>> = {
    list: list.map(formatUser),
    total,
    page,
    pageSize
  };
  res.json(ok(data));
});

adminUsersRouter.get('/behavior', requireAdminAuth, async (req, res) => {
  const parsed = behaviorQuerySchema.safeParse(req.query);
  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, eventType, startDate, endDate } = parsed.data;
  const updatedAt = toDateRange(startDate, endDate);
  const take = page * pageSize;
  const selectedEvents = eventType ? [eventType] : ['VIEW', 'FAVORITE', 'SEARCH', 'BASKET_ADD'] as const;
  const includesEvent = (value: typeof selectedEvents[number]) => selectedEvents.includes(value);
  const userSearch = q
    ? [
        { user: { is: { nickname: { contains: q, mode: 'insensitive' as const } } } },
        { user: { is: { phone: { contains: q, mode: 'insensitive' as const } } } }
      ]
    : [];
  const contentSearch = q
    ? [
        { recipe: { is: { title: { contains: q, mode: 'insensitive' as const } } } },
        { ingredient: { is: { name: { contains: q, mode: 'insensitive' as const } } } },
        { beverage: { is: { name: { contains: q, mode: 'insensitive' as const } } } }
      ]
    : [];
  const actorSelect = { id: true, code: true, bizId: true, nickname: true, phone: true, avatar: true } as const;
  const contentInclude = {
    user: { select: actorSelect },
    recipe: { select: { id: true, title: true } },
    ingredient: { select: { id: true, name: true } },
    beverage: { select: { id: true, name: true } }
  } as const;

  const [views, viewCount, favorites, favoriteCount, searches, searchCount, basketItems, basketCount] = await Promise.all([
    includesEvent('VIEW')
      ? prisma.viewHistory.findMany({
          where: { deletedAt: null, ...(updatedAt ? { updatedAt } : {}), ...(q ? { OR: [...userSearch, ...contentSearch] } : {}) },
          include: contentInclude,
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          take
        })
      : [],
    includesEvent('VIEW')
      ? prisma.viewHistory.count({ where: { deletedAt: null, ...(updatedAt ? { updatedAt } : {}), ...(q ? { OR: [...userSearch, ...contentSearch] } : {}) } })
      : 0,
    includesEvent('FAVORITE')
      ? prisma.favorite.findMany({
          where: { deletedAt: null, ...(updatedAt ? { updatedAt } : {}), ...(q ? { OR: [...userSearch, ...contentSearch] } : {}) },
          include: contentInclude,
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          take
        })
      : [],
    includesEvent('FAVORITE')
      ? prisma.favorite.count({ where: { deletedAt: null, ...(updatedAt ? { updatedAt } : {}), ...(q ? { OR: [...userSearch, ...contentSearch] } : {}) } })
      : 0,
    includesEvent('SEARCH')
      ? prisma.searchHistory.findMany({
          where: {
            deletedAt: null,
            ...(updatedAt ? { updatedAt } : {}),
            ...(q ? { OR: [{ keyword: { contains: q, mode: 'insensitive' as const } }, ...userSearch] } : {})
          },
          include: { user: { select: actorSelect } },
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          take
        })
      : [],
    includesEvent('SEARCH')
      ? prisma.searchHistory.count({
          where: {
            deletedAt: null,
            ...(updatedAt ? { updatedAt } : {}),
            ...(q ? { OR: [{ keyword: { contains: q, mode: 'insensitive' as const } }, ...userSearch] } : {})
          }
        })
      : 0,
    includesEvent('BASKET_ADD')
      ? prisma.purchaseListItem.findMany({
          where: {
            deletedAt: null,
            ...(updatedAt ? { updatedAt } : {}),
            ...(q
              ? {
                  OR: [
                    { name: { contains: q, mode: 'insensitive' as const } },
                    { recipeName: { contains: q, mode: 'insensitive' as const } },
                    ...userSearch
                  ]
                }
              : {})
          },
          include: { user: { select: actorSelect }, recipe: { select: { id: true, title: true } }, family: { select: { id: true, name: true } } },
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          take
        })
      : [],
    includesEvent('BASKET_ADD')
      ? prisma.purchaseListItem.count({
          where: {
            deletedAt: null,
            ...(updatedAt ? { updatedAt } : {}),
            ...(q
              ? {
                  OR: [
                    { name: { contains: q, mode: 'insensitive' as const } },
                    { recipeName: { contains: q, mode: 'insensitive' as const } },
                    ...userSearch
                  ]
                }
              : {})
          }
        })
      : 0
  ]);

  const actor = (user: { id: number; code: string | null; bizId: string | null; nickname: string | null; phone: string | null; avatar: string | null }) => ({
    id: user.id,
    code: user.code ?? user.bizId ?? `user_${user.id}`,
    name: user.nickname,
    phone: user.phone,
    avatar: user.avatar
  });
  const content = (item: { targetType: string; targetId: string; recipe: { id: number; title: string } | null; ingredient: { id: number; name: string } | null; beverage: { id: number; name: string } | null }) => ({
    type: item.targetType,
    id: item.recipe?.id ?? item.ingredient?.id ?? item.beverage?.id ?? item.targetId,
    title: item.recipe?.title ?? item.ingredient?.name ?? item.beverage?.name ?? `${item.targetType} ${item.targetId}`
  });
  const events = [
    ...views.map((item) => ({ id: `VIEW-${item.id}`, eventType: 'VIEW' as const, user: actor(item.user), target: content(item), detail: null, eventTime: item.updatedAt.toISOString() })),
    ...favorites.map((item) => ({ id: `FAVORITE-${item.id}`, eventType: 'FAVORITE' as const, user: actor(item.user), target: content(item), detail: null, eventTime: item.updatedAt.toISOString() })),
    ...searches.map((item) => ({
      id: `SEARCH-${item.id}`,
      eventType: 'SEARCH' as const,
      user: actor(item.user),
      target: { type: 'KEYWORD', id: item.keyword, title: item.keyword },
      detail: `${item.searchCount} 次 · 最近 ${item.resultCount} 个结果`,
      eventTime: item.updatedAt.toISOString()
    })),
    ...basketItems.map((item) => ({
      id: `BASKET_ADD-${item.id}`,
      eventType: 'BASKET_ADD' as const,
      user: actor(item.user),
      target: { type: 'INGREDIENT', id: item.ingredientId ?? item.name, title: item.name },
      detail: [item.amountText ?? item.purchaseText ?? null, item.recipe?.title ?? item.recipeName ?? null, item.family?.name ?? '个人菜篮'].filter(Boolean).join(' · '),
      eventTime: item.updatedAt.toISOString()
    }))
  ].sort((left, right) => right.eventTime.localeCompare(left.eventTime));
  const total = viewCount + favoriteCount + searchCount + basketCount;
  res.json(ok({
    list: events.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    summary: { views: viewCount, favorites: favoriteCount, searches: searchCount, basketAdds: basketCount }
  }));
});

adminUsersRouter.get('/favorites', requireAdminAuth, async (req, res) => {
  const parsed = activityQuerySchema.safeParse(req.query);
  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, userId, targetType } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(userId ? { userId } : {}),
    ...(targetType === 'RECIPE' ? { recipeId: { not: null } } : {}),
    ...(targetType === 'INGREDIENT' ? { ingredientId: { not: null } } : {}),
    ...(q
      ? {
          OR: [
            { user: { is: { nickname: { contains: q, mode: 'insensitive' as const } } } },
            { user: { is: { phone: { contains: q, mode: 'insensitive' as const } } } },
            { recipe: { is: { title: { contains: q, mode: 'insensitive' as const } } } },
            { ingredient: { is: { name: { contains: q, mode: 'insensitive' as const } } } }
          ]
        }
      : {})
  };

  const [list, total] = await Promise.all([
    prisma.favorite.findMany({
      where,
      include: {
        user: { select: { id: true, bizId: true, code: true, phone: true, nickname: true, avatar: true } },
        recipe: { select: { id: true, title: true, cover: true, status: true, isPublish: true } },
        ingredient: { select: { id: true, name: true, cover: true, status: true, isPublish: true } }
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.favorite.count({ where })
  ]);

  const data: PageResult<{
    id: number;
    userId: number;
    userCode: string;
    userName: string | null;
    phone: string | null;
    avatar: string | null;
    targetType: 'RECIPE' | 'INGREDIENT';
    targetId: number | null;
    targetTitle: string;
    targetCover: string | null;
    targetStatus: string | null;
    isPublish: boolean | null;
    createdAt: Date;
    updatedAt: Date;
  }> = {
    list: list.map((item) => ({
      id: item.id,
      userId: item.userId,
      userCode: item.user.code ?? item.user.bizId ?? `user_${item.user.id}`,
      userName: item.user.nickname,
      phone: item.user.phone,
      avatar: item.user.avatar,
      targetType: item.recipeId ? 'RECIPE' : 'INGREDIENT',
      targetId: item.recipeId ?? item.ingredientId,
      targetTitle: item.recipe?.title ?? item.ingredient?.name ?? '内容已删除',
      targetCover: item.recipe?.cover ?? item.ingredient?.cover ?? null,
      targetStatus: item.recipe?.status ?? item.ingredient?.status ?? null,
      isPublish: item.recipe?.isPublish ?? item.ingredient?.isPublish ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })),
    total,
    page,
    pageSize
  };
  res.json(ok(data));
});

adminUsersRouter.get('/recent-views', requireAdminAuth, async (req, res) => {
  const parsed = activityQuerySchema.safeParse(req.query);
  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, userId, targetType } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(userId ? { userId } : {}),
    ...(targetType === 'RECIPE' ? { recipeId: { not: null } } : {}),
    ...(targetType === 'INGREDIENT' ? { ingredientId: { not: null } } : {}),
    ...(q
      ? {
          OR: [
            { user: { is: { nickname: { contains: q, mode: 'insensitive' as const } } } },
            { user: { is: { phone: { contains: q, mode: 'insensitive' as const } } } },
            { recipe: { is: { title: { contains: q, mode: 'insensitive' as const } } } },
            { ingredient: { is: { name: { contains: q, mode: 'insensitive' as const } } } }
          ]
        }
      : {})
  };

  const [list, total] = await Promise.all([
    prisma.viewHistory.findMany({
      where,
      include: {
        user: { select: { id: true, bizId: true, code: true, phone: true, nickname: true, avatar: true } },
        recipe: { select: { id: true, title: true, cover: true, status: true, isPublish: true } },
        ingredient: { select: { id: true, name: true, cover: true, status: true, isPublish: true } }
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.viewHistory.count({ where })
  ]);

  const data: PageResult<{
    id: number;
    userId: number;
    userCode: string;
    userName: string | null;
    phone: string | null;
    avatar: string | null;
    targetType: 'RECIPE' | 'INGREDIENT';
    targetId: number | null;
    targetTitle: string;
    targetCover: string | null;
    targetStatus: string | null;
    isPublish: boolean | null;
    createdAt: Date;
    updatedAt: Date;
  }> = {
    list: list.map((item) => ({
      id: item.id,
      userId: item.userId,
      userCode: item.user.code ?? item.user.bizId ?? `user_${item.user.id}`,
      userName: item.user.nickname,
      phone: item.user.phone,
      avatar: item.user.avatar,
      targetType: item.recipeId ? 'RECIPE' : 'INGREDIENT',
      targetId: item.recipeId ?? item.ingredientId,
      targetTitle: item.recipe?.title ?? item.ingredient?.name ?? '内容已删除',
      targetCover: item.recipe?.cover ?? item.ingredient?.cover ?? null,
      targetStatus: item.recipe?.status ?? item.ingredient?.status ?? null,
      isPublish: item.recipe?.isPublish ?? item.ingredient?.isPublish ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })),
    total,
    page,
    pageSize
  };
  res.json(ok(data));
});

// 2. GET /api/admin/users/:id
adminUsersRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.user.findFirst({
    where: { id: parseId(req.params.id), deletedAt: null },
    include: {
      _count: {
        select: {
          favorites: true,
          viewHistories: true,
          familyMembers: true,
          ownedFamilies: true,
          recipes: true,
          posts: true,
          comments: true
        }
      },
      viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
    }
  });
  if (!item) throw new HttpError('用户不存在或已注销', 404, 404);
  res.json(ok(formatUser(item)));
});

// 3. POST /api/admin/users
adminUsersRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const { phone, email, password, birthday, ...data } = parsed.data;

  // Uniqueness checks
  if (phone && phone.trim() !== '') {
    const existing = await prisma.user.findFirst({
      where: { phone: phone.trim(), deletedAt: null }
    });
    if (existing) throw new HttpError('手机号已被注册', 409, 409);
  }

  if (email && email.trim() !== '') {
    const existing = await prisma.user.findFirst({
      where: { email: email.trim(), deletedAt: null }
    });
    if (existing) throw new HttpError('邮箱已被注册', 422, 422);
  }

  const passwordHash = await hashMobilePassword(password);

  // Parse Birthday
  let birthdayDate: Date | null = null;
  if (birthday && birthday.trim() !== '') {
    birthdayDate = new Date(birthday);
    if (Number.isNaN(birthdayDate.getTime())) {
      throw new HttpError('生日格式不正确', 400, 400);
    }
  }

  // Generate business code and UUID
  const lastUser = await prisma.user.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true }
  });
  const nextId = (lastUser?.id ?? 0) + 1;
  const code = `YH${String(nextId).padStart(6, '0')}`;
  const bizId = `usr_${crypto.randomUUID().replace(/-/g, '')}`;

  const created = await prisma.user.create({
    data: {
      ...data,
      phone: phone || null,
      email: email || null,
      passwordHash,
      birthday: birthdayDate,
      code,
      bizId,
      source: data.source || 'ADMIN_CREATED',
      sourceType: 'ADMIN'
    },
    include: {
      _count: {
        select: {
          favorites: true,
          viewHistories: true,
          familyMembers: true,
          ownedFamilies: true,
          recipes: true,
          posts: true,
          comments: true
        }
      },
      viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
    }
  });

  res.json(ok(formatUser(created)));
});

// 4. PUT /api/admin/users/:id
adminUsersRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const userId = parseId(req.params.id);
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null }
  });
  if (!user) throw new HttpError('用户不存在或已注销', 404, 404);

  const { phone, email, password, birthday, ...data } = parsed.data;

  // Uniqueness checks excluding current user
  if (phone && phone.trim() !== '') {
    const existing = await prisma.user.findFirst({
      where: { phone: phone.trim(), id: { not: userId }, deletedAt: null }
    });
    if (existing) throw new HttpError('手机号已被其他用户使用', 422, 422);
  }

  if (email && email.trim() !== '') {
    const existing = await prisma.user.findFirst({
      where: { email: email.trim(), id: { not: userId }, deletedAt: null }
    });
    if (existing) throw new HttpError('邮箱已被其他用户使用', 422, 422);
  }

  // Parse Birthday
  let birthdayDate: Date | null | undefined = undefined;
  if (birthday !== undefined) {
    if (birthday === null || birthday === '') {
      birthdayDate = null;
    } else {
      birthdayDate = new Date(birthday);
      if (Number.isNaN(birthdayDate.getTime())) {
        throw new HttpError('生日格式不正确', 400, 400);
      }
    }
  }

  const passwordUpdate = password?.trim()
    ? { passwordHash: await hashMobilePassword(password) }
    : {};

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      ...(phone !== undefined ? { phone: (phone === '' || phone === null) ? null : phone } : {}),
      ...(email !== undefined ? { email: (email === '' || email === null) ? null : email } : {}),
      ...(birthdayDate !== undefined ? { birthday: birthdayDate } : {}),
      ...passwordUpdate
    },
    include: {
      _count: {
        select: {
          favorites: true,
          viewHistories: true,
          familyMembers: true,
          ownedFamilies: true,
          recipes: true,
          posts: true,
          comments: true
        }
      },
      viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
    }
  });

  res.json(ok(formatUser(updated)));
});

// 5. PATCH /api/admin/users/:id/status
adminUsersRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const userId = parseId(req.params.id);
  const parsed = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) }).safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError('参数错误', 400, 400);
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null }
  });
  if (!user) throw new HttpError('用户不存在或已注销', 404, 404);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: parsed.data.status },
    include: {
      _count: {
        select: {
          favorites: true,
          viewHistories: true,
          familyMembers: true,
          ownedFamilies: true,
          recipes: true,
          posts: true,
          comments: true
        }
      },
      viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
    }
  });

  res.json(ok(formatUser(updated)));
});

// 6. DELETE /api/admin/users/:id (Soft Delete)
adminUsersRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const userId = parseId(req.params.id);
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null }
  });
  if (!user) throw new HttpError('用户不存在或已注销', 404, 404);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() }
  });

  res.json(ok({
    success: true,
    message: '用户已成功注销',
    id: updated.bizId ?? `user_${updated.id}`
  }));
});
