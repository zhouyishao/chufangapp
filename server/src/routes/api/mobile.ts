import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { ok, type PageResult } from '../../http/response';
import { buildPublicIdWhere, createBusinessId, getPublicCode, getPublicId, nextCodeFromItems } from '../../lib/business-id';
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

const publicRecipeWhere = {
  deletedAt: null,
  status: 'ACTIVE' as const,
  isPublish: true,
  auditStatus: 'APPROVED' as const
};

const favoriteTargetSchema = z.object({
  userId: z.coerce.number().int().positive(),
  recipeId: z.coerce.number().int().positive().nullable().optional(),
  ingredientId: z.coerce.number().int().positive().nullable().optional()
});

const assertSingleTarget = (recipeId?: number | null, ingredientId?: number | null) => {
  if ((recipeId && ingredientId) || (!recipeId && !ingredientId)) {
    throw new HttpError('请选择一个收藏或浏览对象', 400, 400);
  }
};

const userIdSchema = z.object({ userId: z.coerce.number().int().positive() });

const ingredientPriceRecordSchema = z.object({
  userId: z.coerce.number().int().positive(),
  ingredientId: z.coerce.number().int().positive(),
  price: z.coerce.number().finite().positive(),
  unit: z.string().trim().min(1).max(20),
  priceDate: z.string().trim().optional(),
  source: z.string().trim().max(80).nullable().optional()
});

const jsonStringArray = z.array(z.string().trim().min(1).max(40)).max(30).default([]);

const myRecipeIngredientSchema = z.object({
  sortIndex: z.coerce.number().int().min(1),
  name: z.string().trim().min(1).max(120),
  amount: z.string().trim().max(80).nullable().optional()
});

const myRecipeStepSchema = z.object({
  sortIndex: z.coerce.number().int().min(1),
  title: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().min(1).max(500),
  image: z.string().trim().max(255).nullable().optional(),
  video: z.string().trim().max(255).nullable().optional()
});

const myRecipeUpsertSchema = z.object({
  userId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(255).nullable().optional(),
  cover: z.string().trim().max(255).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  duration: z.string().trim().max(40).nullable().optional(),
  difficulty: z.string().trim().max(20).nullable().optional(),
  flavor: z.string().trim().max(50).nullable().optional(),
  category: z.string().trim().max(40).nullable().optional(),
  visibility: z.string().trim().max(40).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  isDraft: z.coerce.boolean().default(true),
  ingredients: z.array(myRecipeIngredientSchema).default([]),
  steps: z.array(myRecipeStepSchema).default([])
});

const purchaseItemInclude = {
  recipe: { select: { id: true, title: true, cover: true } },
  ingredient: { select: { id: true, name: true, cover: true, currentPrice: true, priceUnit: true } },
  family: { select: { id: true, name: true } }
};

const familyInclude = {
  owner: { select: { id: true, nickname: true, phone: true, avatar: true } },
  members: {
    where: { deletedAt: null, memberStatus: 'ACTIVE' as const },
    include: { user: { select: { id: true, nickname: true, phone: true, avatar: true } } },
    orderBy: [{ role: 'asc' as const }, { id: 'asc' as const }]
  },
  preferences: true,
  _count: { select: { members: true, purchaseListItems: true } }
};

const toPurchaseItem = (item: {
  id: number;
  userId: number;
  familyId: number | null;
  recipeId: number | null;
  ingredientId: number | null;
  recipeName: string | null;
  name: string;
  amountText: string | null;
  quantity: { toNumber?: () => number } | number;
  unit: string | null;
  purchaseText: string | null;
  checked: boolean;
  checkedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  recipe?: { id: number; title: string; cover: string | null } | null;
  ingredient?: { id: number; name: string; cover: string | null; currentPrice: number | null; priceUnit: string | null } | null;
  family?: { id: number; name: string } | null;
}) => ({
  ...item,
  quantity: typeof item.quantity === 'number' ? item.quantity : item.quantity.toNumber?.() ?? Number(item.quantity),
  checkedAt: item.checkedAt?.toISOString() ?? null,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString()
});

const toIngredientPriceRecord = (record: {
  id: number;
  ingredientId: number;
  userId: number | null;
  price: number;
  unit: string;
  priceDate: Date;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: record.id,
  ingredientId: record.ingredientId,
  userId: record.userId,
  price: record.price,
  unit: record.unit,
  date: record.priceDate.toISOString().slice(0, 10),
  source: record.source ?? null,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString()
});

const toFamily = (family: {
  id: number;
  name: string;
  avatar: string | null;
  city: string | null;
  district: string | null;
  description: string | null;
  memberLimit: number;
  createdAt: Date;
  owner?: { id: number; nickname: string | null; phone: string | null; avatar: string | null } | null;
  members?: Array<{
    id: number;
    role: 'CREATOR' | 'ADMIN' | 'MEMBER';
    joinedAt: Date;
    remark?: string | null;
    user: { id: number; nickname: string | null; phone: string | null; avatar: string | null };
  }>;
  preferences?: {
    avoidItems: unknown;
    allergies: unknown;
    preferences: unknown;
    taste: string | null;
    note: string | null;
  } | null;
  _count?: { members?: number; purchaseListItems?: number };
}) => ({
  id: family.id,
  name: family.name,
  avatar: family.avatar,
  city: family.city,
  district: family.district,
  description: family.description,
  memberLimit: family.memberLimit,
  memberCount: family._count?.members ?? family.members?.length ?? 0,
  pendingItems: family._count?.purchaseListItems ?? 0,
  createdAt: family.createdAt.toISOString(),
  owner: family.owner ?? null,
  members: (family.members ?? []).map((member) => ({
    id: member.id,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    remark: member.remark ?? null,
    user: member.user
  })),
  preferences: {
    avoidItems: Array.isArray(family.preferences?.avoidItems) ? family.preferences.avoidItems : [],
    allergies: Array.isArray(family.preferences?.allergies) ? family.preferences.allergies : [],
    preferences: Array.isArray(family.preferences?.preferences) ? family.preferences.preferences : [],
    taste: family.preferences?.taste ?? null,
    note: family.preferences?.note ?? null
  }
});

const toMyRecipe = (recipe: {
  id: number;
  bizId?: string | null;
  code?: string | null;
  title: string;
  subtitle: string | null;
  cover: string | null;
  description: string | null;
  cookTime: number | null;
  difficulty: string | null;
  taste: string | null;
  scene: string | null;
  tips: string | null;
  sourceName: string | null;
  isDraft: boolean;
  updatedAt: Date;
  steps?: Array<{
    id: number;
    sortIndex: number;
    title: string | null;
    description: string;
    image: string | null;
    video: string | null;
  }>;
  ingredients?: Array<{
    id: number;
    sortIndex: number;
    name: string;
    amount: string | null;
  }>;
}) => ({
  id: recipe.id,
  legacyId: recipe.id,
  publicId: getPublicId('recipe', recipe),
  code: getPublicCode('recipe', recipe),
  name: recipe.title,
  description: recipe.description ?? recipe.subtitle ?? '',
  image: recipe.cover,
  duration: recipe.cookTime ? `${recipe.cookTime} 分钟` : '',
  flavor: recipe.taste ?? '',
  updatedAt: recipe.updatedAt.toISOString().slice(0, 10),
  status: recipe.isDraft ? 'draft' : 'published',
  difficulty: recipe.difficulty ?? '',
  category: recipe.scene ?? '',
  visibility: recipe.sourceName ?? (recipe.isDraft ? '草稿' : '仅自己可见'),
  note: recipe.tips ?? '',
  ingredients: (recipe.ingredients ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    amount: item.amount ?? ''
  })),
  steps: (recipe.steps ?? []).map((step) => ({
    id: step.id,
    title: step.title ?? `步骤 ${step.sortIndex}`,
    description: step.description
  }))
});

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

  if (user.status === 'DISABLED') {
    throw new HttpError('该账户已被禁用，无法登录，请联系管理员。', 403, 403);
  }

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
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        isPublish: true,
        OR: [{ recipeId: null }, { recipe: publicRecipeWhere }]
      },
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
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true, recipes: { some: { recipe: publicRecipeWhere } } },
      include: {
        recipes: {
          where: { recipe: publicRecipeWhere },
          include: { recipe: { select: { id: true, title: true, cover: true } } }
        }
      },
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      take: 6
    })
  ]);
  const channels = categories
    .filter((category) => category.type === 'RECIPE')
    .map((category) => ({
      id: category.id,
      title: category.name,
      code: `recipe_category_${category.id}`,
      status: category.status,
      sort: category.sort,
      items: recommendations
        .filter((item) => item.recipe)
        .slice(0, 6)
        .map((item, index) => ({
          id: item.id,
          channelId: category.id,
          contentType: 'RECIPE',
          contentId: item.recipe?.id ?? item.id,
          title: item.recipe?.title ?? item.title,
          imageUrl: item.recipe?.cover ?? item.cover,
          sort: index + 1,
          status: item.status
        }))
    }));

  res.json(ok({ banners, recommendations, seasonalFoods, categories, menus, channels }));
});

apiMobileRouter.get('/my-recipes', async (req, res) => {
  const parsed = pageQuerySchema.extend({ userId: z.coerce.number().int().positive() }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { userId, page, pageSize, q } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    authorId: userId,
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize,
      include: {
        steps: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
        ingredients: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] }
      }
    }),
    prisma.recipe.count({ where })
  ]);
  const data: PageResult<ReturnType<typeof toMyRecipe>> = { list: list.map(toMyRecipe), total, page, pageSize };
  res.json(ok(data));
});

apiMobileRouter.get('/my-recipes/:id', async (req, res) => {
  const parsed = z.object({ userId: z.coerce.number().int().positive().optional() }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const recipe = await prisma.recipe.findFirst({
    where: {
      ...buildPublicIdWhere(req.params.id),
      deletedAt: null,
      ...(parsed.data.userId ? { authorId: parsed.data.userId } : {})
    },
    include: {
      steps: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      ingredients: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] }
    }
  });
  if (!recipe) throw new HttpError('食谱不存在', 404, 404);
  res.json(ok(toMyRecipe(recipe)));
});

apiMobileRouter.post('/my-recipes', async (req, res) => {
  const parsed = myRecipeUpsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const codes = await prisma.recipe.findMany({ select: { code: true } });
  const cookTimeText = parsed.data.duration ?? '';
  const cookTime = Number.parseInt(cookTimeText.match(/\d+/)?.[0] ?? '', 10);
  const created = await prisma.recipe.create({
    data: {
      bizId: createBusinessId('recipe'),
      code: nextCodeFromItems('recipe', codes),
      title: parsed.data.title,
      subtitle: parsed.data.subtitle ?? null,
      cover: parsed.data.cover ?? null,
      description: parsed.data.description ?? null,
      cookTime: Number.isFinite(cookTime) ? cookTime : null,
      difficulty: parsed.data.difficulty ?? null,
      taste: parsed.data.flavor ?? null,
      scene: parsed.data.category ?? null,
      tips: parsed.data.notes ?? null,
      sourceName: parsed.data.visibility ?? null,
      authorId: parsed.data.userId,
      isDraft: parsed.data.isDraft,
      isPublish: false,
      status: 'ACTIVE',
      auditStatus: 'DRAFT',
      sourceType: 'USER',
      steps: {
        create: parsed.data.steps.map((step) => ({
          sortIndex: step.sortIndex,
          title: step.title ?? null,
          description: step.description,
          image: step.image ?? null,
          video: step.video ?? null,
          duration: null
        }))
      },
      ingredients: {
        create: parsed.data.ingredients.map((item) => ({
          sortIndex: item.sortIndex,
          name: item.name,
          amount: item.amount ?? null
        }))
      }
    },
    include: {
      steps: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      ingredients: { where: { deletedAt: null }, orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] }
    }
  });
  res.json(ok(toMyRecipe(created)));
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
  const parsed = pageQuerySchema.extend({ userId: z.coerce.number().int().positive().optional() }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const keyword = parsed.data.q ?? '';
  const where = { deletedAt: null, status: 'ACTIVE' as const, isPublish: true };
  const [recipes, ingredients] = await Promise.all([
    prisma.recipe.findMany({
      where: { ...where, auditStatus: 'APPROVED', ...(keyword ? { title: { contains: keyword, mode: 'insensitive' as const } } : {}) },
      orderBy: [{ isRecommend: 'desc' }, { id: 'desc' }],
      take: 10
    }),
    prisma.ingredient.findMany({
      where: { ...where, ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {}) },
      orderBy: [{ isRecommend: 'desc' }, { id: 'desc' }],
      take: 10
    })
  ]);
  const resultCount = recipes.length + ingredients.length;
  if (parsed.data.userId && keyword) {
    await prisma.searchHistory.upsert({
      where: { userId_keyword: { userId: parsed.data.userId, keyword } },
      create: { userId: parsed.data.userId, keyword, resultCount },
      update: { resultCount, deletedAt: null, status: 'ACTIVE', updatedAt: new Date() }
    });
  }
  res.json(ok({ recipes, ingredients }));
});

apiMobileRouter.get('/search-histories', async (req, res) => {
  const parsed = pageQuerySchema.extend({ userId: z.coerce.number().int().positive() }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { userId, page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = { userId, deletedAt: null };
  const [list, total] = await Promise.all([
    prisma.searchHistory.findMany({ where, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], skip, take: pageSize }),
    prisma.searchHistory.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

apiMobileRouter.delete('/search-histories', async (req, res) => {
  const parsed = userIdSchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const result = await prisma.searchHistory.updateMany({
    where: { userId: parsed.data.userId, deletedAt: null },
    data: { deletedAt: new Date(), status: 'DISABLED' }
  });
  res.json(ok(result));
});

apiMobileRouter.get('/ingredient-price-records', async (req, res) => {
  const parsed = z.object({
    userId: z.coerce.number().int().positive(),
    ingredientId: z.coerce.number().int().positive()
  }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const list = await prisma.ingredientPriceRecord.findMany({
    where: {
      userId: parsed.data.userId,
      ingredientId: parsed.data.ingredientId,
      deletedAt: null
    },
    orderBy: [{ priceDate: 'desc' }, { id: 'desc' }]
  });
  res.json(ok(list.map(toIngredientPriceRecord)));
});

apiMobileRouter.post('/ingredient-price-records', async (req, res) => {
  const parsed = ingredientPriceRecordSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const priceDate = parsed.data.priceDate ? new Date(parsed.data.priceDate) : new Date();
  if (Number.isNaN(priceDate.getTime())) throw new HttpError('日期错误', 400, 400);

  const created = await prisma.$transaction(async (tx) => {
    const record = await tx.ingredientPriceRecord.create({
      data: {
        ingredientId: parsed.data.ingredientId,
        userId: parsed.data.userId,
        price: parsed.data.price,
        unit: parsed.data.unit,
        priceDate,
        source: parsed.data.source ?? null
      }
    });
    await tx.ingredient.update({
      where: { id: parsed.data.ingredientId },
      data: {
        currentPrice: parsed.data.price,
        priceUnit: parsed.data.unit,
        priceSource: parsed.data.source ?? null,
        priceDate
      }
    });
    return record;
  });
  res.json(ok(toIngredientPriceRecord(created)));
});

apiMobileRouter.delete('/ingredient-price-records/:id', async (req, res) => {
  const id = idParam(req.params.id);
  const parsed = userIdSchema.safeParse(req.body ?? req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.ingredientPriceRecord.findFirst({
    where: { id, userId: parsed.data.userId, deletedAt: null }
  });
  if (!existing) throw new HttpError('记录不存在', 404, 404);
  const deleted = await prisma.ingredientPriceRecord.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'DISABLED' }
  });
  res.json(ok(toIngredientPriceRecord(deleted)));
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
      include: {
        recipe: { select: { id: true, title: true, subtitle: true, cover: true, description: true, cookTime: true, difficulty: true } },
        ingredient: { select: { id: true, name: true, cover: true, seasonMonth: true, currentPrice: true, priceUnit: true } }
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.favorite.count({ where })
  ]);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

apiMobileRouter.get('/view-histories', async (req, res) => {
  const parsed = pageQuerySchema.extend({ userId: z.coerce.number().int().positive() }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { userId, page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = { userId, deletedAt: null };
  const [list, total] = await Promise.all([
    prisma.viewHistory.findMany({
      where,
      include: {
        recipe: { select: { id: true, title: true, subtitle: true, cover: true, description: true, cookTime: true, difficulty: true } },
        ingredient: { select: { id: true, name: true, cover: true, seasonMonth: true, currentPrice: true, priceUnit: true } }
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.viewHistory.count({ where })
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

apiMobileRouter.get('/families', async (req, res) => {
  const parsed = userIdSchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const families = await prisma.family.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      members: { some: { userId: parsed.data.userId, deletedAt: null, memberStatus: 'ACTIVE' } }
    },
    include: familyInclude,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }]
  });
  res.json(ok(families.map(toFamily)));
});

apiMobileRouter.post('/families', async (req, res) => {
  const parsed = z.object({
    userId: z.coerce.number().int().positive(),
    name: z.string().trim().min(1).max(80),
    city: z.string().trim().max(40).nullable().optional(),
    district: z.string().trim().max(40).nullable().optional(),
    description: z.string().trim().max(255).nullable().optional()
  }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const user = await prisma.user.findFirst({ where: { id: parsed.data.userId, deletedAt: null, status: 'ACTIVE' } });
  if (!user) throw new HttpError('用户不存在', 404, 404);
  const codes = await prisma.family.findMany({ select: { code: true } });
  const family = await prisma.family.create({
    data: {
      bizId: createBusinessId('family'),
      code: nextCodeFromItems('family', codes),
      name: parsed.data.name,
      ownerId: parsed.data.userId,
      city: parsed.data.city,
      district: parsed.data.district,
      description: parsed.data.description,
      activeAt: new Date(),
      members: { create: { userId: parsed.data.userId, role: 'CREATOR', joinMethod: 'MANUAL_INVITE' } },
      preferences: { create: {} }
    },
    include: familyInclude
  });
  res.json(ok(toFamily(family)));
});

apiMobileRouter.get('/families/:id', async (req, res) => {
  const id = idParam(req.params.id);
  const family = await prisma.family.findFirst({ where: { id, deletedAt: null }, include: familyInclude });
  if (!family) throw new HttpError('家庭不存在', 404, 404);
  res.json(ok(toFamily(family)));
});

apiMobileRouter.put('/families/:id', async (req, res) => {
  const id = idParam(req.params.id);
  const parsed = z.object({
    userId: z.coerce.number().int().positive(),
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(255).nullable().optional()
  }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const member = await prisma.familyMember.findFirst({
    where: { familyId: id, userId: parsed.data.userId, deletedAt: null, memberStatus: 'ACTIVE' }
  });
  if (!member || member.role === 'MEMBER') throw new HttpError('无权修改该家庭', 403, 403);
  const family = await prisma.family.update({
    where: { id },
    data: { name: parsed.data.name, description: parsed.data.description },
    include: familyInclude
  });
  res.json(ok(toFamily(family)));
});

apiMobileRouter.post('/families/:id/invites', async (req, res) => {
  const id = idParam(req.params.id);
  const parsed = z.object({ userId: z.coerce.number().int().positive() }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const member = await prisma.familyMember.findFirst({
    where: { familyId: id, userId: parsed.data.userId, deletedAt: null, memberStatus: 'ACTIVE' },
    include: { family: true }
  });
  if (!member) throw new HttpError('无权邀请该家庭成员', 403, 403);
  const token = createBusinessId('family_invite').replace('family_invite_', '');
  const codes = await prisma.familyInvite.findMany({ select: { code: true } });
  const invite = await prisma.familyInvite.create({
    data: {
      bizId: createBusinessId('family_invite'),
      code: nextCodeFromItems('family_invite', codes),
      familyId: id,
      inviterId: parsed.data.userId,
      inviteName: `${member.family.name} 家庭邀请`,
      inviteMethod: 'QR_CODE',
      token,
      url: `/pages/family-invite/index?token=${token}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
  res.json(ok(invite));
});

apiMobileRouter.get('/family-invites/:token', async (req, res) => {
  const token = String(req.params.token || '').trim();
  if (!token) throw new HttpError('参数错误', 400, 400);
  const invite = await prisma.familyInvite.findFirst({
    where: { token, deletedAt: null, status: 'ACTIVE' },
    include: { family: { include: familyInclude }, inviter: { select: { id: true, nickname: true, phone: true, avatar: true } } }
  });
  if (!invite) throw new HttpError('邀请不存在', 404, 404);
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) throw new HttpError('邀请已过期', 410, 410);
  res.json(ok({ ...invite, family: toFamily(invite.family) }));
});

apiMobileRouter.post('/family-invites/:token/join', async (req, res) => {
  const token = String(req.params.token || '').trim();
  const parsed = userIdSchema.safeParse(req.body);
  if (!parsed.success || !token) throw new HttpError('参数错误', 400, 400);
  const invite = await prisma.familyInvite.findFirst({
    where: { token, deletedAt: null, status: 'ACTIVE' },
    include: { family: { include: familyInclude } }
  });
  if (!invite) throw new HttpError('邀请不存在', 404, 404);
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) throw new HttpError('邀请已过期', 410, 410);
  await prisma.familyMember.upsert({
    where: { familyId_userId: { familyId: invite.familyId, userId: parsed.data.userId } },
    create: { familyId: invite.familyId, userId: parsed.data.userId, role: 'MEMBER', joinMethod: 'SCAN_QR' },
    update: { memberStatus: 'ACTIVE', status: 'ACTIVE', leftAt: null }
  });
  await prisma.familyInvite.update({
    where: { id: invite.id },
    data: { inviteeId: parsed.data.userId, inviteStatus: 'JOINED', joinedAt: new Date() }
  });
  const family = await prisma.family.findFirstOrThrow({ where: { id: invite.familyId }, include: familyInclude });
  res.json(ok(toFamily(family)));
});

apiMobileRouter.put('/families/:id/preferences', async (req, res) => {
  const id = idParam(req.params.id);
  const parsed = z.object({
    userId: z.coerce.number().int().positive(),
    avoidItems: jsonStringArray,
    allergies: jsonStringArray,
    preferences: jsonStringArray,
    taste: z.string().trim().max(80).nullable().optional(),
    note: z.string().trim().max(255).nullable().optional()
  }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const member = await prisma.familyMember.findFirst({ where: { familyId: id, userId: parsed.data.userId, deletedAt: null, memberStatus: 'ACTIVE' } });
  if (!member) throw new HttpError('无权修改该家庭偏好', 403, 403);
  const preference = await prisma.familyPreference.upsert({
    where: { familyId: id },
    create: {
      familyId: id,
      avoidItems: parsed.data.avoidItems,
      allergies: parsed.data.allergies,
      preferences: parsed.data.preferences,
      taste: parsed.data.taste,
      note: parsed.data.note
    },
    update: {
      avoidItems: parsed.data.avoidItems,
      allergies: parsed.data.allergies,
      preferences: parsed.data.preferences,
      taste: parsed.data.taste,
      note: parsed.data.note,
      deletedAt: null,
      status: 'ACTIVE'
    }
  });
  res.json(ok(preference));
});

apiMobileRouter.delete('/family-members/:id', async (req, res) => {
  const id = idParam(req.params.id);
  const parsed = userIdSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const target = await prisma.familyMember.findFirst({ where: { id }, include: { family: true } });
  if (!target) throw new HttpError('成员不存在', 404, 404);
  const operator = await prisma.familyMember.findFirst({
    where: { familyId: target.familyId, userId: parsed.data.userId, deletedAt: null, memberStatus: 'ACTIVE' }
  });
  if (!operator || (operator.role === 'MEMBER' && operator.userId !== target.userId)) throw new HttpError('无权移除成员', 403, 403);
  const updated = await prisma.familyMember.update({
    where: { id },
    data: { memberStatus: operator.userId === target.userId ? 'LEFT' : 'REMOVED', status: 'DISABLED', leftAt: new Date() }
  });
  res.json(ok(updated));
});

apiMobileRouter.put('/family-members/:id', async (req, res) => {
  const id = idParam(req.params.id);
  const parsed = z.object({
    userId: z.coerce.number().int().positive(),
    remark: z.string().trim().max(255).nullable().optional(),
    role: z.enum(['CREATOR', 'ADMIN', 'MEMBER']).optional()
  }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const target = await prisma.familyMember.findFirst({
    where: { id, deletedAt: null, memberStatus: 'ACTIVE' },
    include: { family: true }
  });
  if (!target) throw new HttpError('成员不存在', 404, 404);

  const operator = await prisma.familyMember.findFirst({
    where: { familyId: target.familyId, userId: parsed.data.userId, deletedAt: null, memberStatus: 'ACTIVE' }
  });
  if (!operator) throw new HttpError('无权修改成员', 403, 403);

  const isSelf = operator.userId === target.userId;
  const canEditRole = !isSelf && operator.role !== 'MEMBER';
  const canEditRemark = isSelf || operator.role !== 'MEMBER';
  if ((!canEditRole && parsed.data.role !== undefined) || !canEditRemark) {
    throw new HttpError('无权修改成员', 403, 403);
  }

  const nextRole = parsed.data.role && canEditRole ? parsed.data.role : target.role;
  const nextRemark = parsed.data.remark === undefined ? target.remark : parsed.data.remark;

  const updated = await prisma.familyMember.update({
    where: { id },
    data: {
      role: nextRole,
      remark: nextRemark
    },
    include: {
      user: { select: { id: true, nickname: true, phone: true, avatar: true } }
    }
  });

  res.json(ok({
    id: updated.id,
    role: updated.role,
    joinedAt: updated.joinedAt.toISOString(),
    remark: updated.remark ?? null,
    user: updated.user
  }));
});

apiMobileRouter.get('/basket-items', async (req, res) => {
  const parsed = pageQuerySchema.extend({
    userId: z.coerce.number().int().positive(),
    familyId: z.coerce.number().int().positive().optional()
  }).safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { userId, familyId, page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = { userId, deletedAt: null, ...(familyId ? { familyId } : {}) };
  const [rows, total] = await Promise.all([
    prisma.purchaseListItem.findMany({
      where,
      include: purchaseItemInclude,
      orderBy: [{ checked: 'asc' }, { updatedAt: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.purchaseListItem.count({ where })
  ]);
  const list = rows.map(toPurchaseItem);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

apiMobileRouter.post('/basket-items', async (req, res) => {
  const parsed = z.object({
    userId: z.coerce.number().int().positive(),
    familyId: z.coerce.number().int().positive().nullable().optional(),
    recipeId: z.coerce.number().int().positive().nullable().optional(),
    ingredientId: z.coerce.number().int().positive().nullable().optional(),
    recipeName: z.string().trim().max(120).nullable().optional(),
    name: z.string().trim().min(1).max(80),
    amountText: z.string().trim().max(80).nullable().optional(),
    quantity: z.coerce.number().positive().max(999).default(1),
    unit: z.string().trim().max(24).nullable().optional(),
    purchaseText: z.string().trim().max(120).nullable().optional()
  }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const user = await prisma.user.findFirst({ where: { id: parsed.data.userId, deletedAt: null, status: 'ACTIVE' } });
  if (!user) throw new HttpError('用户不存在', 404, 404);
  if (parsed.data.familyId) {
    const member = await prisma.familyMember.findFirst({
      where: { familyId: parsed.data.familyId, userId: parsed.data.userId, deletedAt: null, memberStatus: 'ACTIVE' }
    });
    if (!member) throw new HttpError('无权修改该家庭菜篮子', 403, 403);
  }
  const existing = parsed.data.ingredientId
    ? await prisma.purchaseListItem.findFirst({
        where: {
          userId: parsed.data.userId,
          familyId: parsed.data.familyId ?? null,
          recipeId: parsed.data.recipeId ?? null,
          ingredientId: parsed.data.ingredientId,
          deletedAt: null
        }
      })
    : null;
  const item = existing
    ? await prisma.purchaseListItem.update({
        where: { id: existing.id },
        data: {
          quantity: parsed.data.quantity,
          amountText: parsed.data.amountText,
          purchaseText: parsed.data.purchaseText,
          checked: false,
          checkedAt: null,
          status: 'ACTIVE'
        },
        include: purchaseItemInclude
      })
    : await prisma.purchaseListItem.create({
        data: {
          userId: parsed.data.userId,
          familyId: parsed.data.familyId,
          recipeId: parsed.data.recipeId,
          ingredientId: parsed.data.ingredientId,
          recipeName: parsed.data.recipeName,
          name: parsed.data.name,
          amountText: parsed.data.amountText,
          quantity: parsed.data.quantity,
          unit: parsed.data.unit,
          purchaseText: parsed.data.purchaseText
        },
        include: purchaseItemInclude
      });
  res.json(ok(toPurchaseItem(item)));
});

apiMobileRouter.put('/basket-items/:id', async (req, res) => {
  const id = idParam(req.params.id);
  const parsed = z.object({
    userId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().positive().max(999).optional(),
    checked: z.coerce.boolean().optional()
  }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.purchaseListItem.findFirst({ where: { id, userId: parsed.data.userId, deletedAt: null } });
  if (!existing) throw new HttpError('菜篮子条目不存在', 404, 404);
  const item = await prisma.purchaseListItem.update({
    where: { id },
    data: {
      ...(parsed.data.quantity === undefined ? {} : { quantity: parsed.data.quantity }),
      ...(parsed.data.checked === undefined ? {} : { checked: parsed.data.checked, checkedAt: parsed.data.checked ? new Date() : null })
    },
    include: purchaseItemInclude
  });
  res.json(ok(toPurchaseItem(item)));
});

apiMobileRouter.delete('/basket-items/:id', async (req, res) => {
  const id = idParam(req.params.id);
  const parsed = userIdSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.purchaseListItem.findFirst({ where: { id, userId: parsed.data.userId, deletedAt: null } });
  if (!existing) throw new HttpError('菜篮子条目不存在', 404, 404);
  const item = await prisma.purchaseListItem.update({ where: { id }, data: { deletedAt: new Date(), status: 'DISABLED' }, include: purchaseItemInclude });
  res.json(ok(toPurchaseItem(item)));
});

apiMobileRouter.post('/favorites', async (req, res) => {
  const parsed = favoriteTargetSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { userId, recipeId = null, ingredientId = null } = parsed.data;
  assertSingleTarget(recipeId, ingredientId);

  const targetWhere = recipeId ? { recipeId, ingredientId: null } : { recipeId: null, ingredientId };
  const existing = await prisma.favorite.findFirst({
    where: { userId, ...targetWhere },
    include: {
      recipe: { select: { id: true, title: true, subtitle: true, cover: true, description: true, cookTime: true, difficulty: true } },
      ingredient: { select: { id: true, name: true, cover: true, seasonMonth: true, currentPrice: true, priceUnit: true } }
    }
  });

  if (existing) {
    const restored = await prisma.favorite.update({
      where: { id: existing.id },
      data: { deletedAt: null, status: 'ACTIVE', updatedAt: new Date() },
      include: {
        recipe: { select: { id: true, title: true, subtitle: true, cover: true, description: true, cookTime: true, difficulty: true } },
        ingredient: { select: { id: true, name: true, cover: true, seasonMonth: true, currentPrice: true, priceUnit: true } }
      }
    });
    if (recipeId && existing.deletedAt) {
      await prisma.recipe.update({ where: { id: recipeId }, data: { favoriteCount: { increment: 1 } } });
    }
    res.json(ok(restored));
    return;
  }

  const created = await prisma.favorite.create({
    data: { userId, recipeId, ingredientId },
    include: {
      recipe: { select: { id: true, title: true, subtitle: true, cover: true, description: true, cookTime: true, difficulty: true } },
      ingredient: { select: { id: true, name: true, cover: true, seasonMonth: true, currentPrice: true, priceUnit: true } }
    }
  });
  if (recipeId) await prisma.recipe.update({ where: { id: recipeId }, data: { favoriteCount: { increment: 1 } } });
  res.json(ok(created));
});

apiMobileRouter.delete('/favorites/:id', async (req, res) => {
  const id = idParam(req.params.id);
  const favorite = await prisma.favorite.findUnique({ where: { id } });
  if (!favorite) throw new HttpError('收藏不存在', 404, 404);
  const updated = await prisma.favorite.update({ where: { id }, data: { deletedAt: new Date() } });
  if (favorite.recipeId && !favorite.deletedAt) {
    await prisma.recipe.update({ where: { id: favorite.recipeId }, data: { favoriteCount: { decrement: 1 } } });
  }
  res.json(ok(updated));
});

apiMobileRouter.post('/view-histories', async (req, res) => {
  const parsed = favoriteTargetSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { userId, recipeId = null, ingredientId = null } = parsed.data;
  assertSingleTarget(recipeId, ingredientId);

  const targetWhere = recipeId ? { recipeId, ingredientId: null } : { recipeId: null, ingredientId };
  const existing = await prisma.viewHistory.findFirst({
    where: { userId, ...targetWhere },
    include: {
      recipe: { select: { id: true, title: true, subtitle: true, cover: true, description: true, cookTime: true, difficulty: true } },
      ingredient: { select: { id: true, name: true, cover: true, seasonMonth: true, currentPrice: true, priceUnit: true } }
    }
  });

  if (recipeId) {
    await prisma.recipe.update({ where: { id: recipeId }, data: { viewCount: { increment: 1 } } });
  }

  if (existing) {
    const updated = await prisma.viewHistory.update({
      where: { id: existing.id },
      data: { deletedAt: null, status: 'ACTIVE', updatedAt: new Date() },
      include: {
        recipe: { select: { id: true, title: true, subtitle: true, cover: true, description: true, cookTime: true, difficulty: true } },
        ingredient: { select: { id: true, name: true, cover: true, seasonMonth: true, currentPrice: true, priceUnit: true } }
      }
    });
    res.json(ok(updated));
    return;
  }

  const created = await prisma.viewHistory.create({
    data: { userId, recipeId, ingredientId },
    include: {
      recipe: { select: { id: true, title: true, subtitle: true, cover: true, description: true, cookTime: true, difficulty: true } },
      ingredient: { select: { id: true, name: true, cover: true, seasonMonth: true, currentPrice: true, priceUnit: true } }
    }
  });
  res.json(ok(created));
});
