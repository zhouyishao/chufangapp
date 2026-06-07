import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { buildPublicIdWhere } from '../../lib/business-id';
import { prisma } from '../../prisma';
import { parseId } from './shared';

const targetTypeValues = ['NONE', 'URL', 'RECIPE', 'INGREDIENT', 'CATEGORY', 'MENU', 'BEVERAGE', 'TOPIC'] as const;
const bannerStatusValues = ['DRAFT', 'ENABLED', 'DISABLED'] as const;
const imageFocusValues = ['left', 'center', 'right'] as const;

const nullableString = (max: number) =>
  z.string().trim().max(max).nullable().optional().transform((value) => (value ? value : null));

const nullableDateTime = () =>
  z.string().nullable().optional().transform((value) => (value ? new Date(value) : null));

const upsertSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subtitle: nullableString(160),
  buttonText: nullableString(32),
  cover: z.string().trim().min(1).max(255),
  imageFocus: z.enum(imageFocusValues).default('center'),
  targetType: z.enum(targetTypeValues).default('NONE'),
  targetId: nullableString(64),
  targetTitleSnapshot: nullableString(120),
  link: nullableString(255),
  sortOrder: z.coerce.number().int().min(1).max(9999).default(1),
  status: z.enum(bannerStatusValues).default('DRAFT'),
  startAt: z.string().nullable().optional().transform((value) => (value ? new Date(value) : null)),
  endAt: z.string().nullable().optional().transform((value) => (value ? new Date(value) : null)),
  remark: nullableString(255)
});

export const adminTopNavHeroBannersRouter = Router({ mergeParams: true });

const resolveNavId = async (rawId: unknown) => {
  const nav = await prisma.homeTopNav.findFirst({
    where: { ...buildPublicIdWhere(rawId), deletedAt: null, isDeleted: false }
  });
  if (!nav) throw new HttpError('导航不存在', 404, 404);
  return nav.id;
};

adminTopNavHeroBannersRouter.get('/', requireAdminAuth, async (req, res) => {
  const navId = await resolveNavId(req.params.navId);
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10));
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
  const status = typeof req.query.status === 'string' && bannerStatusValues.includes(req.query.status as typeof bannerStatusValues[number])
    ? (req.query.status as typeof bannerStatusValues[number])
    : undefined;
  const skip = (page - 1) * pageSize;

  const where = {
    navId,
    deletedAt: null,
    isDeleted: false,
    ...(status ? { status } : {}),
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, total] = await Promise.all([
    prisma.homeHeroBanner.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      skip,
      take: pageSize
    }),
    prisma.homeHeroBanner.count({ where })
  ]);

  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminTopNavHeroBannersRouter.get('/:bannerId', requireAdminAuth, async (req, res) => {
  const navId = await resolveNavId(req.params.navId);
  const item = await prisma.homeHeroBanner.findFirst({
    where: { id: parseId(req.params.bannerId), navId, deletedAt: null, isDeleted: false }
  });
  if (!item) throw new HttpError('轮播图不存在', 404, 404);
  res.json(ok(item));
});

adminTopNavHeroBannersRouter.post('/', requireAdminAuth, async (req, res) => {
  const navId = await resolveNavId(req.params.navId);
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const payload = parsed.data;
  res.json(ok(await prisma.homeHeroBanner.create({
    data: {
      navId,
      title: payload.title,
      subtitle: payload.subtitle,
      buttonText: payload.buttonText,
      cover: payload.cover,
      imageFocus: payload.imageFocus,
      targetType: payload.targetType,
      targetId: payload.targetId,
      targetTitleSnapshot: payload.targetTitleSnapshot,
      link: payload.link,
      sortOrder: payload.sortOrder,
      sort: payload.sortOrder,
      status: payload.status,
      isPublish: payload.status === 'ENABLED',
      startAt: payload.startAt,
      endAt: payload.endAt,
      remark: payload.remark
    }
  })));
});

adminTopNavHeroBannersRouter.put('/:bannerId', requireAdminAuth, async (req, res) => {
  const navId = await resolveNavId(req.params.navId);
  const bannerId = parseId(req.params.bannerId);
  const existing = await prisma.homeHeroBanner.findFirst({
    where: { id: bannerId, navId, deletedAt: null, isDeleted: false }
  });
  if (!existing) throw new HttpError('轮播图不存在', 404, 404);

  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const payload = parsed.data;
  res.json(ok(await prisma.homeHeroBanner.update({
    where: { id: bannerId },
    data: {
      title: payload.title,
      subtitle: payload.subtitle,
      buttonText: payload.buttonText,
      cover: payload.cover,
      imageFocus: payload.imageFocus,
      targetType: payload.targetType,
      targetId: payload.targetId,
      targetTitleSnapshot: payload.targetTitleSnapshot,
      link: payload.link,
      sortOrder: payload.sortOrder,
      sort: payload.sortOrder,
      status: payload.status,
      isPublish: payload.status === 'ENABLED',
      startAt: payload.startAt,
      endAt: payload.endAt,
      remark: payload.remark
    }
  })));
});

adminTopNavHeroBannersRouter.patch('/:bannerId/status', requireAdminAuth, async (req, res) => {
  const navId = await resolveNavId(req.params.navId);
  const bannerId = parseId(req.params.bannerId);
  const existing = await prisma.homeHeroBanner.findFirst({
    where: { id: bannerId, navId, deletedAt: null, isDeleted: false }
  });
  if (!existing) throw new HttpError('轮播图不存在', 404, 404);

  const parsed = z.object({ status: z.enum(bannerStatusValues) }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  res.json(ok(await prisma.homeHeroBanner.update({
    where: { id: bannerId },
    data: {
      status: parsed.data.status,
      isPublish: parsed.data.status === 'ENABLED'
    }
  })));
});

adminTopNavHeroBannersRouter.delete('/:bannerId', requireAdminAuth, async (req, res) => {
  const navId = await resolveNavId(req.params.navId);
  const bannerId = parseId(req.params.bannerId);
  const existing = await prisma.homeHeroBanner.findFirst({
    where: { id: bannerId, navId, deletedAt: null, isDeleted: false }
  });
  if (!existing) throw new HttpError('轮播图不存在', 404, 404);

  res.json(ok(await prisma.homeHeroBanner.update({
    where: { id: bannerId },
    data: { deletedAt: new Date(), isDeleted: true, isPublish: false }
  })));
});
