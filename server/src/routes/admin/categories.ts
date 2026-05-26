import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  type: z.enum(['RECIPE', 'INGREDIENT', 'SEASONING', 'FRUIT', 'COCKTAIL']).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional()
});

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(['RECIPE', 'INGREDIENT', 'SEASONING', 'FRUIT', 'COCKTAIL']).default('INGREDIENT'),
  sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  isPublish: z.coerce.boolean().default(true)
});

export const adminCategoriesRouter = Router();

adminCategoriesRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, type, status } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize,
      select: {
        id: true,
        type: true,
        name: true,
        sort: true,
        status: true,
        isPublish: true,
        isRecommend: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.category.count({ where })
  ]);

  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminCategoriesRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const item = await prisma.category.findFirst({ where: { id, deletedAt: null } });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminCategoriesRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const created = await prisma.category.create({ data: parsed.data });
  res.json(ok(created));
});

adminCategoriesRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const updated = await prisma.category.update({
    where: { id },
    data: parsed.data
  });
  res.json(ok(updated));
});

adminCategoriesRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const existing = await prisma.category.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);

  const deleted = await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
  res.json(ok(deleted));
});

adminCategoriesRouter.patch('/:id/publish', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const schema = z.object({ isPublish: z.coerce.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const updated = await prisma.category.update({
    where: { id },
    data: { isPublish: parsed.data.isPublish }
  });
  res.json(ok(updated));
});

adminCategoriesRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) throw new HttpError('参数错误', 400, 400);

  const schema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const updated = await prisma.category.update({
    where: { id },
    data: { status: parsed.data.status }
  });
  res.json(ok(updated));
});
