import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { parseId } from './shared';

const upsertSchema = z.object({
  phone: z.string().trim().max(32).nullable().optional(),
  openid: z.string().trim().max(80).nullable().optional(),
  nickname: z.string().trim().max(60).nullable().optional(),
  avatar: z.string().trim().max(255).nullable().optional(),
  gender: z.string().trim().max(16).nullable().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});

export const adminUsersRouter = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  registerSource: z.enum(['WECHAT', 'PHONE']).optional(),
  familyCount: z.enum(['NONE', 'ONE', 'MULTIPLE']).optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional()
});

const toDateRange = (startDate?: string, endDate?: string) => {
  const range: { gte?: Date; lte?: Date } = {};
  if (startDate) {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) throw new HttpError('参数错误', 400, 400);
    range.gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) throw new HttpError('参数错误', 400, 400);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return Object.keys(range).length > 0 ? range : undefined;
};

const formatUser = (user: Awaited<ReturnType<typeof prisma.user.findMany>>[number] & {
  _count?: {
    favorites: number;
    viewHistories: number;
    familyMembers: number;
    ownedFamilies: number;
    recipes: number;
  };
  viewHistories?: { createdAt: Date }[];
}) => {
  const familyMemberCount = user._count?.familyMembers ?? 0;
  const ownedFamilyCount = user._count?.ownedFamilies ?? 0;
  const recentActiveAt = user.viewHistories?.[0]?.createdAt ?? user.updatedAt;

  return {
    id: user.bizId ?? `user_${user.id}`,
    legacyId: user.id,
    code: user.code ?? `YH${String(user.id).padStart(6, '0')}`,
    phone: user.phone,
    openid: user.openid,
    nickname: user.nickname,
    avatar: user.avatar,
    gender: user.gender,
    status: user.status,
    registerSource: user.openid ? 'WECHAT' : 'PHONE',
    joinedFamilyCount: familyMemberCount,
    createdFamilyCount: ownedFamilyCount,
    familyCount: familyMemberCount + ownedFamilyCount,
    favoriteCount: user._count?.favorites ?? 0,
    recentViewCount: user._count?.viewHistories ?? 0,
    recipeCount: user._count?.recipes ?? 0,
    priceRecordCount: 0,
    lastActiveAt: recentActiveAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

adminUsersRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, registerSource, familyCount, startDate, endDate } = parsed.data;
  const skip = (page - 1) * pageSize;
  const createdRange = toDateRange(startDate, endDate);
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(registerSource === 'WECHAT' ? { openid: { not: null } } : {}),
    ...(registerSource === 'PHONE' ? { openid: null } : {}),
    ...(createdRange ? { createdAt: createdRange } : {}),
    ...(familyCount === 'NONE' ? { familyMembers: { none: { deletedAt: null } }, ownedFamilies: { none: { deletedAt: null } } } : {}),
    ...(familyCount === 'ONE' ? { familyMembers: { some: { deletedAt: null } } } : {}),
    ...(familyCount === 'MULTIPLE' ? { ownedFamilies: { some: { deletedAt: null } } } : {}),
    ...(q
      ? {
          OR: [
            { nickname: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q, mode: 'insensitive' as const } },
            { bizId: { contains: q, mode: 'insensitive' as const } },
            { code: { contains: q, mode: 'insensitive' as const } }
          ]
        }
      : {})
  };
  const [list, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ id: 'desc' }],
      skip,
      take: pageSize,
      include: {
        _count: { select: { favorites: true, viewHistories: true, familyMembers: true, ownedFamilies: true, recipes: true } },
        viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
      }
    }),
    prisma.user.count({ where })
  ]);
  const data: PageResult<ReturnType<typeof formatUser>> = { list: list.map(formatUser), total, page, pageSize };
  res.json(ok(data));
});

adminUsersRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.user.findFirst({
    where: { id: parseId(req.params.id), deletedAt: null },
    include: {
      _count: { select: { favorites: true, viewHistories: true, familyMembers: true, ownedFamilies: true, recipes: true } },
      viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
    }
  });
  if (!item) throw new HttpError('not found', 404, 404);
  res.json(ok(formatUser(item)));
});

adminUsersRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.user.create({ data: parsed.data })));
});

adminUsersRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  res.json(ok(await prisma.user.update({ where: { id: parseId(req.params.id) }, data: parsed.data })));
});

adminUsersRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const parsed = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const item = await prisma.user.update({
    where: { id: parseId(req.params.id) },
    data: { status: parsed.data.status },
    include: {
      _count: { select: { favorites: true, viewHistories: true, familyMembers: true, ownedFamilies: true, recipes: true } },
      viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
    }
  });
  res.json(ok(formatUser(item)));
});

adminUsersRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  res.json(ok(await prisma.user.update({ where: { id: parseId(req.params.id) }, data: { deletedAt: new Date() } })));
});
