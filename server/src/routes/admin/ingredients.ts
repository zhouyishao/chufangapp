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
  categoryId: z.string().trim().optional()
});

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(80),
  cover: optionalContentMediaUrl(),
  coverFileId: z.coerce.number().int().positive().nullable().optional(),
  transparentImage: z.string().trim().max(255).nullable().optional(),
  transparentImageFileId: z.coerce.number().int().positive().nullable().optional(),
  categoryId: z.union([z.coerce.number().int(), z.string().trim()]).nullable().optional(),
  seasonMonth: z.string().trim().max(64).nullable().optional(),
  nutrition: z.string().trim().nullable().optional(),
  selectionTips: z.string().trim().nullable().optional(),
  storageMethod: z.string().trim().nullable().optional(),
  taboo: z.string().trim().nullable().optional(),
  detailImages: z.array(z.string().trim().max(255)).default([]),
  detailImageFileIds: z.array(z.coerce.number().int().positive()).nullable().optional(),
  selectionMedia: z.string().trim().max(255).nullable().optional(),
  selectionMediaFileId: z.coerce.number().int().positive().nullable().optional(),
  currentPrice: z.coerce.number().finite().nullable().optional(),
  priceUnit: z.string().trim().max(20).nullable().optional(),
  priceSource: z.string().trim().max(80).nullable().optional(),
  isPublish: z.coerce.boolean().default(true),
  isRecommend: z.coerce.boolean().default(false),
  sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});

export const adminIngredientsRouter = Router();

const serializeCategory = (category: { id: number; bizId?: string | null; code?: string | null; type: unknown; name: string } | null) =>
  category
    ? {
        ...category,
        legacyId: category.id,
        id: getPublicId('category', category),
        code: getPublicCode('category', category)
      }
    : null;

const serializeIngredient = <
  T extends { id: number; bizId?: string | null; code?: string | null; sort?: number; sortOrder?: number; category?: { id: number; bizId?: string | null; code?: string | null; type: unknown; name: string } | null }
>(item: T) => ({
  ...item,
  legacyId: item.id,
  id: getPublicId('ingredient', item),
  code: getPublicCode('ingredient', item),
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

const resolveCategoryIds = async (value: string | undefined) => {
  if (!value?.trim()) return [];
  const rawValues = value.split(',').map((item) => item.trim()).filter(Boolean);
  const ids: number[] = [];
  for (const rawValue of rawValues) {
    const categoryId = await resolveCategoryId(rawValue);
    if (categoryId) ids.push(categoryId);
  }
  return ids;
};

adminIngredientsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, isPublish, isRecommend } = parsed.data;
  const categoryIds = await resolveCategoryIds(parsed.data.categoryId);
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(typeof isPublish === 'boolean' ? { isPublish } : {}),
    ...(typeof isRecommend === 'boolean' ? { isRecommend } : {}),
    ...(categoryIds.length ? { categoryId: { in: categoryIds } } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, total] = await Promise.all([
    prisma.ingredient.findMany({
      where,
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize,
      include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
    }),
    prisma.ingredient.count({ where })
  ]);

  const data: PageResult<ReturnType<typeof serializeIngredient>> = { list: list.map(serializeIngredient), total, page, pageSize };
  res.json(ok(data));
});

adminIngredientsRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.ingredient.findFirst({
    where: { ...buildPublicIdWhere(req.params.id), deletedAt: null },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(serializeIngredient(item)));
});

adminIngredientsRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
  const { categoryId: _categoryId, ...payload } = parsed.data;
  const codes = await prisma.ingredient.findMany({ select: { code: true } });
  try {
    const created = await prisma.$transaction(async (tx) => {
      const coverFileId = await resolveActiveFileId(tx, parsed.data.coverFileId, parsed.data.cover);
      const transparentImageFileId = await resolveActiveFileId(tx, parsed.data.transparentImageFileId, parsed.data.transparentImage);
      const selectionMediaFileId = await resolveActiveFileId(tx, parsed.data.selectionMediaFileId, parsed.data.selectionMedia);
      const detailImageFileIds = await resolveActiveFileIds(tx, parsed.data.detailImageFileIds, parsed.data.detailImages);
      await lockActiveMediaFiles(tx, [coverFileId, transparentImageFileId, selectionMediaFileId, ...detailImageFileIds]);
      return tx.ingredient.create({
        data: { ...payload, categoryId, coverFileId, transparentImageFileId, selectionMediaFileId, detailImageFileIds, bizId: createBusinessId('ingredient'), code: nextCodeFromItems('ingredient', codes), sortOrder: parsed.data.sort },
        include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
      });
    });
    res.json(ok(serializeIngredient(created)));
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw new HttpError(`名称「${parsed.data.name}」已存在，请使用其他名称`, 422, 422);
    }
    throw err;
  }
});

adminIngredientsRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.ingredient.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);
  const categoryId = await resolveCategoryId(parsed.data.categoryId);
  const { categoryId: _categoryId, ...payload } = parsed.data;
  const shouldUpdateTransparentImage = parsed.data.transparentImage !== undefined || parsed.data.transparentImageFileId !== undefined;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const coverFileId = await resolveActiveFileId(tx, parsed.data.coverFileId, parsed.data.cover);
      const transparentImageFileId = shouldUpdateTransparentImage
        ? await resolveActiveFileId(tx, parsed.data.transparentImageFileId, parsed.data.transparentImage)
        : existing.transparentImageFileId;
      const selectionMediaFileId = await resolveActiveFileId(tx, parsed.data.selectionMediaFileId, parsed.data.selectionMedia);
      const detailImageFileIds = await resolveActiveFileIds(tx, parsed.data.detailImageFileIds, parsed.data.detailImages);
      await lockActiveMediaFiles(tx, [coverFileId, shouldUpdateTransparentImage ? transparentImageFileId : null, selectionMediaFileId, ...detailImageFileIds]);
      return tx.ingredient.update({
        where: { id: existing.id },
        data: {
          ...payload,
          categoryId,
          coverFileId,
          ...(shouldUpdateTransparentImage ? { transparentImageFileId } : {}),
          selectionMediaFileId,
          detailImageFileIds,
          sortOrder: parsed.data.sort
        },
        include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
      });
    });
    res.json(ok(serializeIngredient(updated)));
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw new HttpError(`名称「${parsed.data.name}」已存在，请使用其他名称`, 422, 422);
    }
    throw err;
  }
});

adminIngredientsRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const existing = await prisma.ingredient.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const deleted = await prisma.ingredient.update({
    where: { id: existing.id },
    data: { deletedAt: new Date(), isDeleted: true },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  res.json(ok(serializeIngredient(deleted)));
});

adminIngredientsRouter.patch('/:id/publish', requireAdminAuth, async (req, res) => {
  const schema = z.object({ isPublish: z.coerce.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.ingredient.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const updated = await prisma.ingredient.update({
    where: { id: existing.id },
    data: { isPublish: parsed.data.isPublish },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  res.json(ok(serializeIngredient(updated)));
});

adminIngredientsRouter.patch('/:id/recommend', requireAdminAuth, async (req, res) => {
  const schema = z.object({ isRecommend: z.coerce.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.ingredient.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const updated = await prisma.ingredient.update({
    where: { id: existing.id },
    data: { isRecommend: parsed.data.isRecommend },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  res.json(ok(serializeIngredient(updated)));
});

adminIngredientsRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const schema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const existing = await prisma.ingredient.findFirst({ where: { ...buildPublicIdWhere(req.params.id), deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const updated = await prisma.ingredient.update({
    where: { id: existing.id },
    data: { status: parsed.data.status },
    include: { category: { select: { id: true, bizId: true, code: true, name: true, type: true } } }
  });
  res.json(ok(serializeIngredient(updated)));
});
