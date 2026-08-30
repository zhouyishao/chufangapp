import type { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { sanitizeOperationDetail } from '../../services/admin-operation-log';

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  module: z.string().trim().optional(),
  action: z.string().trim().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

type LogInput = {
  id: number;
  adminId: number | null;
  module: string | null;
  action: string | null;
  method: string | null;
  path: string | null;
  ip: string | null;
  requestBody: unknown;
  responseCode: number | null;
  responseMessage: string | null;
  createdAt: Date;
  admin: { id: number; username: string; nickname: string | null } | null;
};

export const serializeAdminOperationLog = (row: LogInput) => ({
  id: row.id,
  admin: row.admin,
  module: row.module,
  action: row.action,
  method: row.method,
  path: row.path,
  ip: row.ip,
  responseCode: row.responseCode,
  responseMessage: row.responseMessage,
  detail: sanitizeOperationDetail(row.requestBody),
  createdAt: row.createdAt
});

export const adminOperationLogsRouter = Router();

adminOperationLogsRouter.get('/', async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, module, action, startDate, endDate } = parsed.data;
  const where: Prisma.OperationLogWhereInput = {
    deletedAt: null,
    ...(module ? { module } : {}),
    ...(action ? { action } : {}),
    ...(startDate || endDate ? { createdAt: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } } : {}),
    ...(q ? { OR: [{ action: { contains: q, mode: 'insensitive' } }, { path: { contains: q, mode: 'insensitive' } }, { responseMessage: { contains: q, mode: 'insensitive' } }] } : {})
  };
  const [total, rows] = await Promise.all([
    prisma.operationLog.count({ where }),
    prisma.operationLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);
  const adminIds = Array.from(new Set(rows.map((row) => row.adminId).filter((id): id is number => typeof id === 'number')));
  const admins = adminIds.length ? await prisma.admin.findMany({ where: { id: { in: adminIds } }, select: { id: true, username: true, nickname: true } }) : [];
  const adminById = new Map(admins.map((admin) => [admin.id, admin]));
  const list = rows.map((row) => serializeAdminOperationLog({ ...row, admin: row.adminId ? adminById.get(row.adminId) ?? null : null }));
  res.json(ok<PageResult<(typeof list)[number]>>({ list, total, page, pageSize }));
});
