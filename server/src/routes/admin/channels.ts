import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { baseListQuerySchema, parseId } from './shared';

const upsertSchema = z.object({
  name: z.string().trim().min(1).max(80),
  code: z.string().trim().min(1).max(80),
  position: z.string().trim().max(80).nullable().optional(),
  sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  isPublish: z.coerce.boolean().default(true)
});

export const adminChannelsRouter = Router();

adminChannelsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {})
  };

  const [list, total] = await Promise.all([
    prisma.channel.findMany({
      where,
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.channel.count({ where })
  ]);

  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminChannelsRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const item = await prisma.channel.findFirst({ where: { id, deletedAt: null } });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(item));
});

adminChannelsRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const created = await prisma.channel.create({ data: parsed.data });
  res.json(ok(created));
});

adminChannelsRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const updated = await prisma.channel.update({ where: { id }, data: parsed.data });
  res.json(ok(updated));
});

adminChannelsRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const existing = await prisma.channel.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new HttpError('not found', 404, 404);
  const deleted = await prisma.channel.update({ where: { id }, data: { deletedAt: new Date() } });
  res.json(ok(deleted));
});

adminChannelsRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const schema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const updated = await prisma.channel.update({ where: { id }, data: { status: parsed.data.status } });
  res.json(ok(updated));
});
