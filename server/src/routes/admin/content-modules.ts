import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { buildPublicIdWhere } from '../../lib/business-id';

const displayStyles = ['HORIZONTAL_RECIPE_CARD', 'SEASONAL_INGREDIENT_CARD', 'IMAGE_TEXT_LIST', 'TWO_COLUMN_RECIPE_GRID', 'LARGE_IMAGE_CAROUSEL', 'FOUR_CARD_GRID'] as const;
const contentTypes = ['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'] as const;
const contentSources = ['MANUAL', 'CATEGORY', 'CATEGORY_CONTENT', 'CATEGORY_GROUP', 'TAG'] as const;
const moduleStatuses = ['ENABLED', 'DISABLED'] as const;

const upsertSchema = z.object({
  title: z.string().trim().min(1).max(80),
  subtitle: z.string().trim().max(160).nullable().optional(),
  displayStyle: z.enum(displayStyles),
  contentType: z.enum(contentTypes),
  contentSource: z.enum(contentSources),
  displayCount: z.coerce.number().int().min(1).max(50).default(6),
  showMore: z.coerce.boolean().default(false),
  showTitle: z.coerce.boolean().default(true),
  moreLink: z.string().trim().max(255).nullable().optional(),
  sortOrder: z.coerce.number().int().min(1).max(999).default(1),
  status: z.enum(moduleStatuses).default('ENABLED'),
  items: z.array(z.object({
    id: z.union([z.string(), z.number()]).transform(String),
    type: z.string().optional().default(''),
    sortOrder: z.coerce.number().int().min(0).default(0)
  })).optional().default([]),
  categoryId: z.coerce.number().int().nullable().optional(),
  tagId: z.coerce.number().int().nullable().optional()
});

const statusSchema = z.object({
  status: z.enum(moduleStatuses)
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(moduleStatuses).optional(),
  keyword: z.string().trim().optional()
});

const displayStyleLabel: Record<string, string> = {
  HORIZONTAL_RECIPE_CARD: '横向菜谱卡片',
  SEASONAL_INGREDIENT_CARD: '时令食材卡片',
  IMAGE_TEXT_LIST: '图文列表',
  TWO_COLUMN_RECIPE_GRID: '双列菜谱卡片',
  LARGE_IMAGE_CAROUSEL: '大矩形图片模块',
  FOUR_CARD_GRID: '四宫格小卡片模块'
};

const contentTypeLabel: Record<string, string> = {
  RECIPE: '菜谱',
  INGREDIENT: '食材',
  FRUIT: '水果',
  SEASONING: '调料',
  BEVERAGE: '酒水'
};

const contentSourceLabel: Record<string, string> = {
  MANUAL: '手动选择',
  CATEGORY: '按分类筛选',
  CATEGORY_CONTENT: '分类内容自动读取',
  CATEGORY_GROUP: '分类管理入口',
  TAG: '按标签筛选'
};

const displayStyleContentTypes: Record<string, string[]> = {
  HORIZONTAL_RECIPE_CARD: ['RECIPE'],
  SEASONAL_INGREDIENT_CARD: ['INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'],
  IMAGE_TEXT_LIST: ['RECIPE'],
  TWO_COLUMN_RECIPE_GRID: ['RECIPE'],
  LARGE_IMAGE_CAROUSEL: ['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE'],
  FOUR_CARD_GRID: ['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE']
};

const serializeModule = (item: {
  id: number;
  navId: number;
  title: string;
  subtitle: string | null;
  displayStyle: string;
  contentType: string;
  contentSource: string;
  displayCount: number;
  showMore: boolean;
  showTitle: boolean;
  moreLink: string | null;
  sortOrder: number;
  status: string;
  items: unknown;
  categoryId: number | null;
  tagId: number | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...item,
  displayStyleLabel: displayStyleLabel[item.displayStyle] ?? item.displayStyle,
  contentTypeLabel: contentTypeLabel[item.contentType] ?? item.contentType,
  contentSourceLabel: contentSourceLabel[item.contentSource] ?? item.contentSource
});

const getExistingNav = async (navId: string) => {
  const nav = await prisma.homeTopNav.findFirst({
    where: { ...buildPublicIdWhere(navId), deletedAt: null, isDeleted: false }
  });
  if (!nav) throw new HttpError('导航不存在', 404, 404);
  return nav;
};

const getExistingModule = async (navId: number, moduleId: string) => {
  const parsedId = Number(moduleId);
  if (!Number.isFinite(parsedId)) throw new HttpError('模块ID格式错误', 400, 400);
  const mod = await prisma.contentModule.findFirst({
    where: { id: parsedId, navId }
  });
  if (!mod) throw new HttpError('模块不存在', 404, 404);
  return mod;
};

export const adminContentModulesRouter = Router({ mergeParams: true });

adminContentModulesRouter.get('/', requireAdminAuth, async (req, res) => {
  const nav = await getExistingNav(String(req.params.navId));
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, status, keyword } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    navId: nav.id,
    ...(status ? { status } : {}),
    ...(keyword ? { title: { contains: keyword, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.contentModule.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], skip, take: pageSize }),
    prisma.contentModule.count({ where })
  ]);
  const data: PageResult<ReturnType<typeof serializeModule>> = {
    list: list.map(serializeModule),
    total,
    page,
    pageSize
  };
  res.json(ok(data));
});

adminContentModulesRouter.get('/:moduleId', requireAdminAuth, async (req, res) => {
  const nav = await getExistingNav(String(req.params.navId));
  const mod = await getExistingModule(nav.id, String(req.params.moduleId));
  res.json(ok(serializeModule(mod)));
});

adminContentModulesRouter.post('/', requireAdminAuth, async (req, res) => {
  const nav = await getExistingNav(String(req.params.navId));
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    const messages = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new HttpError(messages || '参数错误', 400, 400);
  }

  const allowedTypes = displayStyleContentTypes[parsed.data.displayStyle] ?? [];
  if (!allowedTypes.includes(parsed.data.contentType)) {
    throw new HttpError(
      `展示样式「${displayStyleLabel[parsed.data.displayStyle]}」不支持内容类型「${contentTypeLabel[parsed.data.contentType]}」，请选择：${allowedTypes.map(t => contentTypeLabel[t]).join('、')}`,
      422,
      422
    );
  }

  // Fallback: LARGE_IMAGE_CAROUSEL items auto-type to "image"
  let resolvedItems = (parsed.data.items ?? []) as Array<{ id: string; type?: string; sortOrder: number }>;
  if (parsed.data.displayStyle === 'LARGE_IMAGE_CAROUSEL') {
    resolvedItems = resolvedItems.map(item => ({ ...item, type: item.type || 'image' }));
  }

  const created = await prisma.contentModule.create({
    data: {
      navId: nav.id,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle ?? null,
      displayStyle: parsed.data.displayStyle,
      contentType: parsed.data.contentType,
      contentSource: parsed.data.contentSource,
      displayCount: parsed.data.displayCount,
      showMore: parsed.data.showMore,
      showTitle: parsed.data.showTitle,
      moreLink: parsed.data.moreLink ?? null,
      sortOrder: parsed.data.sortOrder,
      status: parsed.data.status,
      items: resolvedItems,
      categoryId: parsed.data.categoryId ?? null,
      tagId: parsed.data.tagId ?? null
    }
  });
  res.json(ok(serializeModule(created)));
});

adminContentModulesRouter.put('/:moduleId', requireAdminAuth, async (req, res) => {
  const nav = await getExistingNav(String(req.params.navId));
  const existing = await getExistingModule(nav.id, String(req.params.moduleId));
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    const messages = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new HttpError(messages || '参数错误', 400, 400);
  }

  const allowedTypes = displayStyleContentTypes[parsed.data.displayStyle] ?? [];
  if (!allowedTypes.includes(parsed.data.contentType)) {
    throw new HttpError(
      `展示样式「${displayStyleLabel[parsed.data.displayStyle]}」不支持内容类型「${contentTypeLabel[parsed.data.contentType]}」，请选择：${allowedTypes.map(t => contentTypeLabel[t]).join('、')}`,
      422,
      422
    );
  }

  // Fallback: LARGE_IMAGE_CAROUSEL items auto-type to "image"
  let resolvedItemsUpdate = (parsed.data.items ?? []) as Array<{ id: string; type?: string; sortOrder: number }>;
  if (parsed.data.displayStyle === 'LARGE_IMAGE_CAROUSEL') {
    resolvedItemsUpdate = resolvedItemsUpdate.map(item => ({ ...item, type: item.type || 'image' }));
  }

  const updated = await prisma.contentModule.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title,
      subtitle: parsed.data.subtitle ?? null,
      displayStyle: parsed.data.displayStyle,
      contentType: parsed.data.contentType,
      contentSource: parsed.data.contentSource,
      displayCount: parsed.data.displayCount,
      showMore: parsed.data.showMore,
      showTitle: parsed.data.showTitle,
      moreLink: parsed.data.moreLink ?? null,
      sortOrder: parsed.data.sortOrder,
      status: parsed.data.status,
      items: resolvedItemsUpdate,
      categoryId: parsed.data.categoryId ?? null,
      tagId: parsed.data.tagId ?? null
    }
  });
  res.json(ok(serializeModule(updated)));
});

adminContentModulesRouter.patch('/:moduleId/status', requireAdminAuth, async (req, res) => {
  const nav = await getExistingNav(String(req.params.navId));
  const existing = await getExistingModule(nav.id, String(req.params.moduleId));
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const updated = await prisma.contentModule.update({
    where: { id: existing.id },
    data: { status: parsed.data.status }
  });
  res.json(ok(serializeModule(updated)));
});

adminContentModulesRouter.delete('/:moduleId', requireAdminAuth, async (req, res) => {
  const nav = await getExistingNav(String(req.params.navId));
  const existing = await getExistingModule(nav.id, String(req.params.moduleId));
  await prisma.contentModule.delete({ where: { id: existing.id } });
  res.json(ok(true));
});
