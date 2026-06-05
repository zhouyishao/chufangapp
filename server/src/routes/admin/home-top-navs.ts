import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { buildPublicIdWhere, createBusinessId, getPublicCode, getPublicId, nextCodeFromItems } from '../../lib/business-id';

const navStatusValues = ['draft', 'online', 'offline'] as const;
const navTypeValues = ['system_recommend', 'recipe_category', 'recipe_tag', 'topic', 'recommend_pool'] as const;

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  keyword: z.string().trim().optional(),
  status: z.enum(navStatusValues).optional()
});

const relationSchema = z.object({
  relationType: z.string().trim().min(1).max(32),
  relationId: z.union([z.string().trim().min(1), z.coerce.number().int()]),
  relationName: z.string().trim().max(64).nullable().optional()
});

const styleSchema = z.object({
  navStyle: z.string().trim().max(32).default('text_tab'),
  activeStyle: z.string().trim().max(32).default('underline'),
  layoutMode: z.string().trim().max(32).default('fixed'),
  textColor: z.string().trim().max(16).default('#666666'),
  activeTextColor: z.string().trim().max(16).default('#7A8B6F'),
  showDivider: z.coerce.boolean().default(true),
  tabGap: z.string().trim().max(16).default('medium'),
  reserveSpace: z.coerce.boolean().default(false)
});

const ruleSchema = z.object({
  sourceType: z.string().trim().max(32).default('category'),
  difficultyFilter: z.string().trim().max(32).nullable().optional().default('all'),
  durationFilter: z.string().trim().max(32).nullable().optional().default('all'),
  cookingMethodFilter: z.string().trim().max(32).nullable().optional().default('all'),
  displayCount: z.coerce.number().int().min(1).max(50).default(6),
  sortRule: z.string().trim().max(32).default('comprehensive'),
  moreButtonText: z.string().trim().max(10).default('查看更多'),
  jumpRule: z.string().trim().max(64).default('nav_content_list'),
  recommendStartAt: z.string().datetime().nullable().optional(),
  recommendEndAt: z.string().datetime().nullable().optional()
});

const upsertSchema = z.object({
  name: z.string().trim().min(2).max(8),
  alias: z.string().trim().max(64).nullable().optional(),
  navType: z.enum(navTypeValues).default('recipe_category'),
  displayPosition: z.string().trim().max(32).default('home_top'),
  iconUrl: z.string().trim().max(255).nullable().optional(),
  sortOrder: z.coerce.number().int().min(1).max(999).default(1),
  status: z.enum(navStatusValues).default('draft'),
  isDefault: z.coerce.boolean().default(false),
  isFixed: z.coerce.boolean().default(true),
  showMoreEntry: z.coerce.boolean().default(false),
  description: z.string().trim().max(80).nullable().optional(),
  remark: z.string().trim().max(100).nullable().optional(),
  relations: z.array(relationSchema).default([]),
  contentRule: ruleSchema.default({
    sourceType: 'category',
    difficultyFilter: 'all',
    durationFilter: 'all',
    cookingMethodFilter: 'all',
    displayCount: 6,
    sortRule: 'comprehensive',
    moreButtonText: '查看更多',
    jumpRule: 'nav_content_list'
  }),
  style: styleSchema.default({
    navStyle: 'text_tab',
    activeStyle: 'underline',
    layoutMode: 'fixed',
    textColor: '#666666',
    activeTextColor: '#7A8B6F',
    showDivider: true,
    tabGap: 'medium',
    reserveSpace: false
  })
});

export const adminHomeTopNavsRouter = Router();

const includeRelations = {
  relations: true,
  style: true,
  contentRule: true
};

const navTypeText: Record<string, string> = {
  system_recommend: '系统推荐',
  recipe_category: '菜谱分类',
  recipe_tag: '菜谱标签',
  topic: '专题',
  recommend_pool: '推荐池'
};

const statusText: Record<string, string> = {
  draft: '草稿',
  online: '已上线',
  offline: '已下线'
};

const serializeNav = <T extends {
  id: number;
  bizId?: string | null;
  code?: string | null;
  navType: string;
  status: string;
  relations?: Array<{ relationType: string; relationId: string; relationName: string | null }>;
  style?: unknown;
  contentRule?: unknown;
}>(item: T) => ({
  ...item,
  legacyId: item.id,
  id: getPublicId('top_nav', item),
  code: getPublicCode('top_nav', item),
  navTypeText: navTypeText[item.navType] ?? item.navType,
  relationName: item.relations?.[0]?.relationName ?? '-',
  statusText: statusText[item.status] ?? item.status
});

const parseDate = (value: string | null | undefined) => (value ? new Date(value) : null);

const getExistingNav = async (id: string) => {
  const item = await prisma.homeTopNav.findFirst({ where: { ...buildPublicIdWhere(id), deletedAt: null, isDeleted: false } });
  if (!item) throw new HttpError('not found', 404, 404);
  return item;
};

const validateDefault = async (payload: z.infer<typeof upsertSchema>, currentId?: number) => {
  if (payload.isDefault && payload.status !== 'online') throw new HttpError('请先上线该导航，再设置为默认选中。', 422, 422);
  const duplicate = await prisma.homeTopNav.findFirst({
    where: {
      name: payload.name,
      displayPosition: payload.displayPosition,
      deletedAt: null,
      isDeleted: false,
      ...(currentId ? { id: { not: currentId } } : {})
    }
  });
  if (duplicate) throw new HttpError('当前导航名称已存在', 422, 422);
};

const replaceRelations = async (tx: Pick<typeof prisma, 'homeTopNavRelation'>, navId: number, relations: z.infer<typeof relationSchema>[]) => {
  await tx.homeTopNavRelation.deleteMany({ where: { navId } });
  if (relations.length) {
    await tx.homeTopNavRelation.createMany({
      data: relations.map((item) => ({
        navId,
        relationType: item.relationType,
        relationId: String(item.relationId),
        relationName: item.relationName ?? null
      }))
    });
  }
};

adminHomeTopNavsRouter.get('/summary', requireAdminAuth, async (_req, res) => {
  const [totalCount, onlineCount, defaultCount, categoryCount, tagCount, recommendationCount] = await Promise.all([
    prisma.homeTopNav.count({ where: { deletedAt: null, isDeleted: false } }),
    prisma.homeTopNav.count({ where: { deletedAt: null, isDeleted: false, status: 'online' } }),
    prisma.homeTopNav.count({ where: { deletedAt: null, isDeleted: false, isDefault: true } }),
    prisma.category.count({ where: { deletedAt: null, status: 'ACTIVE', isPublish: true } }),
    prisma.tag.count(),
    prisma.recommendation.count({ where: { deletedAt: null, status: 'ACTIVE', isPublish: true } })
  ]);
  res.json(ok({ totalCount, onlineCount, defaultCount, availableRelationCount: categoryCount + tagCount + recommendationCount }));
});

adminHomeTopNavsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, keyword, status } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    isDeleted: false,
    ...(status ? { status } : {}),
    ...(keyword ? { name: { contains: keyword, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.homeTopNav.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], skip, take: pageSize, include: includeRelations }),
    prisma.homeTopNav.count({ where })
  ]);
  const data: PageResult<ReturnType<typeof serializeNav>> = { list: list.map(serializeNav), total, page, pageSize };
  res.json(ok(data));
});

adminHomeTopNavsRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.homeTopNav.findFirst({ where: { ...buildPublicIdWhere(String(req.params.id)), deletedAt: null, isDeleted: false }, include: includeRelations });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(serializeNav(item)));
});

adminHomeTopNavsRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  await validateDefault(parsed.data);
  if (parsed.data.status === 'online' && parsed.data.relations.length === 0) throw new HttpError('请先选择关联内容', 422, 422);
  const codes = await prisma.homeTopNav.findMany({ select: { code: true } });
  const created = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) await tx.homeTopNav.updateMany({ where: { displayPosition: parsed.data.displayPosition, deletedAt: null }, data: { isDefault: false } });
    const nav = await tx.homeTopNav.create({
      data: {
        bizId: createBusinessId('top_nav'),
        code: nextCodeFromItems('top_nav', codes),
        name: parsed.data.name,
        alias: parsed.data.alias ?? null,
        navType: parsed.data.navType,
        displayPosition: parsed.data.displayPosition,
        iconUrl: parsed.data.iconUrl ?? null,
        sortOrder: parsed.data.sortOrder,
        status: parsed.data.status,
        isDefault: parsed.data.isDefault,
        isFixed: parsed.data.isFixed,
        showMoreEntry: parsed.data.showMoreEntry,
        description: parsed.data.description ?? null,
        remark: parsed.data.remark ?? null,
        style: { create: parsed.data.style },
        contentRule: { create: { ...parsed.data.contentRule, recommendStartAt: parseDate(parsed.data.contentRule.recommendStartAt), recommendEndAt: parseDate(parsed.data.contentRule.recommendEndAt) } }
      }
    });
    await replaceRelations(tx, nav.id, parsed.data.relations);
    return tx.homeTopNav.findFirstOrThrow({ where: { id: nav.id }, include: includeRelations });
  });
  res.json(ok(serializeNav(created)));
});

adminHomeTopNavsRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const existing = await getExistingNav(String(req.params.id));
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  await validateDefault(parsed.data, existing.id);
  if (parsed.data.status === 'online' && parsed.data.relations.length === 0) throw new HttpError('请先选择关联内容', 422, 422);
  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) await tx.homeTopNav.updateMany({ where: { displayPosition: parsed.data.displayPosition, deletedAt: null, id: { not: existing.id } }, data: { isDefault: false } });
    await tx.homeTopNav.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        alias: parsed.data.alias ?? null,
        navType: parsed.data.navType,
        displayPosition: parsed.data.displayPosition,
        iconUrl: parsed.data.iconUrl ?? null,
        sortOrder: parsed.data.sortOrder,
        status: parsed.data.status,
        isDefault: parsed.data.isDefault,
        isFixed: parsed.data.isFixed,
        showMoreEntry: parsed.data.showMoreEntry,
        description: parsed.data.description ?? null,
        remark: parsed.data.remark ?? null,
        style: { upsert: { create: parsed.data.style, update: parsed.data.style } },
        contentRule: { upsert: { create: { ...parsed.data.contentRule, recommendStartAt: parseDate(parsed.data.contentRule.recommendStartAt), recommendEndAt: parseDate(parsed.data.contentRule.recommendEndAt) }, update: { ...parsed.data.contentRule, recommendStartAt: parseDate(parsed.data.contentRule.recommendStartAt), recommendEndAt: parseDate(parsed.data.contentRule.recommendEndAt) } } }
      }
    });
    await replaceRelations(tx, existing.id, parsed.data.relations);
    return tx.homeTopNav.findFirstOrThrow({ where: { id: existing.id }, include: includeRelations });
  });
  res.json(ok(serializeNav(updated)));
});

adminHomeTopNavsRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const existing = await getExistingNav(String(req.params.id));
  if (existing.isDefault) throw new HttpError('默认导航不可删除，请先更换默认导航', 422, 422);
  await prisma.homeTopNav.update({ where: { id: existing.id }, data: { deletedAt: new Date(), isDeleted: true } });
  res.json(ok(true));
});

adminHomeTopNavsRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const parsed = z.object({ status: z.enum(navStatusValues) }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await getExistingNav(String(req.params.id));
  if (existing.isDefault && parsed.data.status !== 'online') throw new HttpError('当前导航为默认导航，下线前请先设置新的默认导航。', 422, 422);
  const updated = await prisma.homeTopNav.update({ where: { id: existing.id }, data: { status: parsed.data.status }, include: includeRelations });
  res.json(ok(serializeNav(updated)));
});

adminHomeTopNavsRouter.patch('/:id/default', requireAdminAuth, async (req, res) => {
  const parsed = z.object({ isDefault: z.coerce.boolean() }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await getExistingNav(String(req.params.id));
  if (parsed.data.isDefault && existing.status !== 'online') throw new HttpError('请先上线该导航，再设置为默认选中。', 422, 422);
  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) await tx.homeTopNav.updateMany({ where: { displayPosition: existing.displayPosition, deletedAt: null, id: { not: existing.id } }, data: { isDefault: false } });
    return tx.homeTopNav.update({ where: { id: existing.id }, data: { isDefault: parsed.data.isDefault }, include: includeRelations });
  });
  res.json(ok(serializeNav(updated)));
});

adminHomeTopNavsRouter.patch('/reorder', requireAdminAuth, async (req, res) => {
  const parsed = z.object({ items: z.array(z.object({ id: z.string().trim(), sortOrder: z.coerce.number().int().min(1).max(999) })) }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  await prisma.$transaction(async (tx) => {
    for (const item of parsed.data.items) {
      const nav = await tx.homeTopNav.findFirst({ where: { ...buildPublicIdWhere(item.id), deletedAt: null } });
      if (nav) await tx.homeTopNav.update({ where: { id: nav.id }, data: { sortOrder: item.sortOrder } });
    }
  });
  res.json(ok(true));
});
