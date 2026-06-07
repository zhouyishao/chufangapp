// ====== 已废弃 ======
// 新接口使用 /api/admin/home/top-navs/:navId/hero-banners
// 本文件保留兼容，不再挂载到 app.ts
import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { parseId } from './shared';

const targetTypeValues = ['NONE', 'URL', 'RECIPE', 'INGREDIENT', 'CATEGORY', 'MENU', 'BEVERAGE', 'TOPIC'] as const;

const nullableString = (max: number) =>
  z.string().trim().max(max).nullable().optional().transform((value) => (value ? value : null));

const parseDate = (value: string | null | undefined) => (value ? new Date(value) : null);

const upsertSchema = z.object({
  navId: z.coerce.number().int().min(1),
  title: z.string().trim().min(1).max(120),
  subtitle: nullableString(160),
  buttonText: nullableString(32),
  cover: z.string().trim().min(1).max(255),
  targetType: z.enum(targetTypeValues).default('NONE'),
  targetId: nullableString(64),
  link: nullableString(255),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  status: z.enum(['ENABLED', 'DISABLED']).default('ENABLED'),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional()
});

export const adminHomeHeroBannersRouter = Router();

const normalizePayload = (payload: z.infer<typeof upsertSchema>) => ({
  navId: payload.navId,
  title: payload.title,
  subtitle: payload.subtitle,
  buttonText: payload.buttonText,
  cover: payload.cover,
  targetType: payload.targetType,
  targetId: payload.targetId,
  link: payload.link,
  sortOrder: payload.sortOrder,
  sort: payload.sortOrder,
  status: payload.status,
  isPublish: payload.status === 'ENABLED',
  startAt: parseDate(payload.startAt),
  endAt: parseDate(payload.endAt)
});

adminHomeHeroBannersRouter.get('/', requireAdminAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10));
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
  const status = ['ENABLED', 'DISABLED'].includes(req.query.status as string) ? req.query.status as 'ENABLED' | 'DISABLED' : undefined;
  const skip = (page - 1) * pageSize;
  const where = {
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

adminHomeHeroBannersRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.homeHeroBanner.findFirst({ where: { id: parseId(req.params.id), deletedAt: null, isDeleted: false } });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminHomeHeroBannersRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.homeHeroBanner.create({ data: normalizePayload(parsed.data) })));
});

adminHomeHeroBannersRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.homeHeroBanner.update({ where: { id: parseId(req.params.id) }, data: normalizePayload(parsed.data) })));
});

adminHomeHeroBannersRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const parsed = z.object({ status: z.enum(['ENABLED', 'DISABLED']) }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.homeHeroBanner.update({
    where: { id: parseId(req.params.id) },
    data: { status: parsed.data.status, isPublish: parsed.data.status === 'ENABLED' }
  })));
});

adminHomeHeroBannersRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  res.json(ok(await prisma.homeHeroBanner.update({
    where: { id: parseId(req.params.id) },
    data: { deletedAt: new Date(), isDeleted: true, isPublish: false }
  })));
});
