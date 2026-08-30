import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { buildPublicIdWhere, createBusinessId, getPublicCode, getPublicId, nextCodeFromItems } from '../../lib/business-id';
import { optionalContentMediaUrl } from '../../lib/content-media-url';
import { lockActiveMediaFiles } from '../../services/file-mutation';
import { resolveActiveFileId, resolveActiveFileIds } from '../../services/content-media';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  isPublish: z.coerce.boolean().optional(),
  isRecommend: z.coerce.boolean().optional(),
  categoryId: z.string().trim().optional(),
  isAlcoholic: z.coerce.boolean().optional(),
  beverageType: z.string().trim().optional()
});

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(120),
  coverImage: optionalContentMediaUrl(),
  coverFileId: z.coerce.number().int().positive().nullable().optional(),
  transparentImage: z.string().trim().max(255).nullable().optional(),
  transparentImageFileId: z.coerce.number().int().positive().nullable().optional(),
  galleryFileIds: z.array(z.coerce.number().int().positive()).nullable().optional(),
  videoFileId: z.coerce.number().int().positive().nullable().optional(),
  categoryId: z.union([z.coerce.number().int(), z.string().trim()]).nullable().optional(),
  beverageType: z.string().trim().max(80).nullable().optional(),
  isAlcoholic: z.coerce.boolean().default(false),
  alcoholDegree: z.coerce.number().finite().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  sort: z.coerce.number().int().min(0).default(0),
  sortOrder: z.coerce.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  isPublish: z.coerce.boolean().default(true),
  isRecommend: z.coerce.boolean().default(false),
  kind: z.enum(['ORDINARY', 'MIXED']).optional(),
  cocktailMethod: z.string().trim().max(80).nullable().optional(),
  baseSpirit: z.string().trim().max(120).nullable().optional(),
  glassType: z.string().trim().max(120).nullable().optional(),
  garnish: z.string().trim().max(255).nullable().optional(),
  instructions: z.string().trim().nullable().optional(),
  ingredientsV2: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    amount: z.string().trim().max(80).nullable().optional(),
    isBase: z.coerce.boolean().default(false)
  })).max(50).optional(),
  tools: z.array(z.object({ name: z.string().trim().min(1).max(120) })).max(30).optional(),
  steps: z.array(z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1),
    mediaFileId: z.coerce.number().int().positive().nullable().optional(),
    timerSeconds: z.coerce.number().int().min(0).max(86400).nullable().optional(),
    tip: z.string().trim().nullable().optional()
  })).max(100).optional()
});

export const adminBeveragesRouter = Router();

const serializeCategory = (category: { id: number; bizId?: string | null; code?: string | null; type: unknown; name: string } | null) =>
  category
    ? { ...category, legacyId: category.id, id: getPublicId('category', category), code: getPublicCode('category', category) }
    : null;

const serializeBeverage = <T extends { id: number; bizId?: string | null; code?: string | null; sort?: number; sortOrder?: number; category?: { id: number; bizId?: string | null; code?: string | null; type: unknown; name: string } | null }>(item: T) => ({
  ...item,
  legacyId: item.id,
  id: getPublicId('beverage', item),
  code: getPublicCode('beverage', item),
  sortOrder: item.sortOrder ?? item.sort ?? 0,
  category: serializeCategory(item.category ?? null),
  categoryId: item.category ? getPublicId('category', item.category) : null
});

const resolveCategoryId = async (value: number | string | null | undefined) => {
  if (value === undefined || value === null || value === '') return null;
  const item = await prisma.category.findFirst({ where: { ...buildPublicIdWhere(value), deletedAt: null } });
  if (!item) throw new HttpError('分类不存在', 422, 422);
  return item.id;
};

const getExistingBeverage = async (value: unknown) => {
  const item = await prisma.beverage.findFirst({ where: { ...buildPublicIdWhere(value), deletedAt: null } });
  if (!item) throw new HttpError('not found', 404, 404);
  return item;
};

adminBeveragesRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish, isRecommend, isAlcoholic, beverageType } = parsed.data;
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    isDeleted: false,
    ...(status ? { status } : {}),
    ...(typeof isPublish === 'boolean' ? { isPublish } : {}),
    ...(typeof isRecommend === 'boolean' ? { isRecommend } : {}),
    ...(typeof isAlcoholic === 'boolean' ? { isAlcoholic } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(beverageType ? { beverageType } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };
  const [list, total] = await Promise.all([
    prisma.beverage.findMany({
      where,
      orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize,
      include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
    }),
    prisma.beverage.count({ where })
  ]);
  const data: PageResult<ReturnType<typeof serializeBeverage>> = { list: list.map(serializeBeverage), total, page, pageSize };
  res.json(ok(data));
});

adminBeveragesRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.beverage.findFirst({
    where: { ...buildPublicIdWhere(req.params.id), deletedAt: null },
    include: {
      category: { select: { id: true, bizId: true, code: true, name: true, type: true } },
      ingredientsV2: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      tools: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
      steps: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }], include: { mediaFile: true } }
    }
  });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(serializeBeverage(item)));
});

adminBeveragesRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
  const { categoryId: _categoryId, ingredientsV2, tools, steps, ...payload } = parsed.data;
  const codes = await prisma.beverage.findMany({ select: { code: true } });
  const created = await prisma.$transaction(async (tx) => {
    const coverFileId = await resolveActiveFileId(tx, parsed.data.coverFileId, parsed.data.coverImage);
    const transparentImageFileId = await resolveActiveFileId(tx, parsed.data.transparentImageFileId, parsed.data.transparentImage);
    const galleryFileIds = await resolveActiveFileIds(tx, parsed.data.galleryFileIds, []);
    await lockActiveMediaFiles(tx, [coverFileId, transparentImageFileId, parsed.data.videoFileId, ...galleryFileIds, ...(steps ?? []).map((step) => step.mediaFileId)]);
    return tx.beverage.create({
      data: {
        ...payload,
        coverFileId,
        transparentImageFileId,
        galleryFileIds,
        categoryId,
        bizId: createBusinessId('beverage'),
        code: nextCodeFromItems('beverage', codes),
        sortOrder: parsed.data.sortOrder ?? parsed.data.sort,
        ingredientsV2: { create: (ingredientsV2 ?? []).map((item, sortIndex) => ({ ...item, sortIndex })) },
        tools: { create: (tools ?? []).map((item, sortIndex) => ({ ...item, sortIndex })) },
        steps: { create: (steps ?? []).map((item, sortIndex) => ({ ...item, sortIndex })) }
      },
      include: {
        category: { select: { id: true, bizId: true, code: true, name: true, type: true } },
        ingredientsV2: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
        tools: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
        steps: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }], include: { mediaFile: true } }
      }
    });
  });
  res.json(ok(serializeBeverage(created)));
});

adminBeveragesRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await getExistingBeverage(req.params.id);
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
  const { categoryId: _categoryId, ingredientsV2, tools, steps, ...payload } = parsed.data;
  const shouldUpdateTransparentImage = parsed.data.transparentImage !== undefined || parsed.data.transparentImageFileId !== undefined;
  const updated = await prisma.$transaction(async (tx) => {
    const coverFileId = await resolveActiveFileId(tx, parsed.data.coverFileId, parsed.data.coverImage);
    const transparentImageFileId = shouldUpdateTransparentImage
      ? await resolveActiveFileId(tx, parsed.data.transparentImageFileId, parsed.data.transparentImage)
      : existing.transparentImageFileId;
    const galleryFileIds = await resolveActiveFileIds(tx, parsed.data.galleryFileIds, []);
    await lockActiveMediaFiles(tx, [coverFileId, shouldUpdateTransparentImage ? transparentImageFileId : null, parsed.data.videoFileId, ...galleryFileIds, ...(steps ?? []).map((step) => step.mediaFileId)]);
    if (ingredientsV2) await tx.beverageIngredient.deleteMany({ where: { beverageId: existing.id } });
    if (tools) await tx.beverageTool.deleteMany({ where: { beverageId: existing.id } });
    if (steps) await tx.beverageStep.deleteMany({ where: { beverageId: existing.id } });
    return tx.beverage.update({
      where: { id: existing.id },
      data: {
        ...payload,
        coverFileId,
        ...(shouldUpdateTransparentImage ? { transparentImageFileId } : {}),
        galleryFileIds,
        categoryId,
        sortOrder: parsed.data.sortOrder ?? parsed.data.sort,
        ...(ingredientsV2 ? { ingredientsV2: { create: ingredientsV2.map((item, sortIndex) => ({ ...item, sortIndex })) } } : {}),
        ...(tools ? { tools: { create: tools.map((item, sortIndex) => ({ ...item, sortIndex })) } } : {}),
        ...(steps ? { steps: { create: steps.map((item, sortIndex) => ({ ...item, sortIndex })) } } : {})
      },
      include: {
        category: { select: { id: true, bizId: true, code: true, name: true, type: true } },
        ingredientsV2: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
        tools: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }] },
        steps: { orderBy: [{ sortIndex: 'asc' }, { id: 'asc' }], include: { mediaFile: true } }
      }
    });
  });
  res.json(ok(serializeBeverage(updated)));
});

adminBeveragesRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const existing = await getExistingBeverage(req.params.id);
  const deleted = await prisma.beverage.update({
    where: { id: existing.id },
    data: { deletedAt: new Date(), isDeleted: true },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  res.json(ok(serializeBeverage(deleted)));
});

adminBeveragesRouter.post('/:id/enable', requireAdminAuth, async (req, res) => {
  const existing = await getExistingBeverage(req.params.id);
  const updated = await prisma.beverage.update({ where: { id: existing.id }, data: { status: 'ACTIVE', isPublish: true } });
  res.json(ok(serializeBeverage(updated)));
});

adminBeveragesRouter.post('/:id/disable', requireAdminAuth, async (req, res) => {
  const existing = await getExistingBeverage(req.params.id);
  const updated = await prisma.beverage.update({ where: { id: existing.id }, data: { status: 'DISABLED', isPublish: false } });
  res.json(ok(serializeBeverage(updated)));
});

adminBeveragesRouter.post('/sort', requireAdminAuth, async (req, res) => {
  const schema = z.object({ items: z.array(z.object({ id: z.string().trim(), sortOrder: z.coerce.number().int().min(0) })) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  await prisma.$transaction(async (tx) => {
    for (const item of parsed.data.items) {
      const existing = await tx.beverage.findFirst({ where: { ...buildPublicIdWhere(item.id), deletedAt: null } });
      if (existing) await tx.beverage.update({ where: { id: existing.id }, data: { sortOrder: item.sortOrder, sort: item.sortOrder } });
    }
  });
  res.json(ok({ updated: parsed.data.items.length }));
});
