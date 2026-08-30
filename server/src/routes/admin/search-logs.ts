import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  resultType: z.enum(['WITH_RESULTS', 'NO_RESULTS']).optional()
});

const serializeLog = (item: {
  id: number;
  keyword: string;
  searchCount: number;
  resultCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: { id: number; nickname: string | null; phone: string | null };
}) => ({
  id: item.id,
  keyword: item.keyword,
  searchCount: item.searchCount,
  resultCount: item.resultCount,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
  user: item.user
});

export const adminSearchLogsRouter = Router();

adminSearchLogsRouter.get('/overview', requireAdminAuth, async (_req, res) => {
  const [totalRecords, aggregate, noResultSearches, topKeywords] = await Promise.all([
    prisma.searchHistory.count({ where: { deletedAt: null } }),
    prisma.searchHistory.aggregate({ where: { deletedAt: null }, _sum: { searchCount: true } }),
    prisma.searchHistory.aggregate({ where: { deletedAt: null, resultCount: 0 }, _sum: { searchCount: true } }),
    prisma.searchHistory.groupBy({
      by: ['keyword'],
      where: { deletedAt: null },
      _sum: { searchCount: true },
      _max: { resultCount: true, updatedAt: true },
      orderBy: { _sum: { searchCount: 'desc' } },
      take: 10
    })
  ]);
  const totalSearches = aggregate._sum.searchCount ?? 0;
  const noResultCount = noResultSearches._sum.searchCount ?? 0;
  res.json(ok({
    totalRecords,
    totalSearches,
    noResultSearches: noResultCount,
    noResultRate: totalSearches ? Number(((noResultCount / totalSearches) * 100).toFixed(2)) : 0,
    topKeywords: topKeywords.map((item) => ({
      keyword: item.keyword,
      searchCount: item._sum.searchCount ?? 0,
      latestResultCount: item._max.resultCount ?? 0,
      updatedAt: item._max.updatedAt?.toISOString() ?? null
    }))
  }));
});

adminSearchLogsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, resultType } = parsed.data;
  const where = {
    deletedAt: null,
    ...(q ? {
      OR: [
        { keyword: { contains: q, mode: 'insensitive' as const } },
        { user: { nickname: { contains: q, mode: 'insensitive' as const } } },
        { user: { phone: { contains: q, mode: 'insensitive' as const } } }
      ]
    } : {}),
    ...(resultType === 'NO_RESULTS' ? { resultCount: 0 } : {}),
    ...(resultType === 'WITH_RESULTS' ? { resultCount: { gt: 0 } } : {})
  };
  const [rows, total] = await Promise.all([
    prisma.searchHistory.findMany({
      where,
      include: { user: { select: { id: true, nickname: true, phone: true } } },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.searchHistory.count({ where })
  ]);
  const data: PageResult<ReturnType<typeof serializeLog>> = { list: rows.map(serializeLog), total, page, pageSize };
  res.json(ok(data));
});
