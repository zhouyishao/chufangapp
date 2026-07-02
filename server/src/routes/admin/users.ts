import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { parseId } from './shared';

const formatZodError = (result: any): HttpError => {
  if (result.success) return new HttpError('无错误', 400, 400);
  const errorMsg = result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ');
  return new HttpError(`参数格式错误: ${errorMsg}`, 400, 400);
};

// Zod schemas for user operations
const createUserSchema = z.object({
  nickname: z.string().trim().min(1, '昵称必填').max(60),
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').or(z.literal('')).nullable().optional(),
  email: z.string().trim().email('邮箱格式不正确').or(z.literal('')).nullable().optional(),
  password: z.string().min(6, '密码长度至少为 6 位').or(z.literal('')).nullable().optional(),
  avatar: z.string().trim().max(255).nullable().optional(),
  gender: z.string().trim().max(16).nullable().optional(),
  birthday: z.string().trim().nullable().optional(),
  region: z.string().trim().max(100).nullable().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
  role: z.string().trim().max(32).default('USER'),
  source: z.string().trim().max(32).default('ADMIN_CREATED')
});

const updateUserSchema = z.object({
  nickname: z.string().trim().min(1, '昵称必填').max(60).optional(),
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').or(z.literal('')).nullable().optional(),
  email: z.string().trim().email('邮箱格式不正确').or(z.literal('')).nullable().optional(),
  avatar: z.string().trim().max(255).nullable().optional(),
  gender: z.string().trim().max(16).nullable().optional(),
  birthday: z.string().trim().nullable().optional(),
  region: z.string().trim().max(100).nullable().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  role: z.string().trim().max(32).optional()
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  source: z.string().trim().optional(),
  role: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional()
});

const toDateRange = (startDate?: string, endDate?: string) => {
  const range: { gte?: Date; lte?: Date } = {};
  if (startDate) {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) throw new HttpError('时间格式不正确', 400, 400);
    range.gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) throw new HttpError('时间格式不正确', 400, 400);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return Object.keys(range).length > 0 ? range : undefined;
};

// Formatter to sanitize output (hide passwordHash)
const formatUser = (
  user: any
) => {
  const familyMemberCount = user._count?.familyMembers ?? 0;
  const ownedFamilyCount = user._count?.ownedFamilies ?? 0;
  const recentActiveAt = user.viewHistories?.[0]?.createdAt ?? user.updatedAt;

  return {
    id: user.bizId ?? `user_${user.id}`,
    legacyId: user.id,
    code: user.code ?? `YH${String(user.id).padStart(6, '0')}`,
    phone: user.phone || null,
    openid: user.openid || null,
    nickname: user.nickname,
    avatar: user.avatar || null,
    gender: user.gender || null,
    email: user.email || null,
    role: user.role,
    source: user.source,
    birthday: user.birthday ? user.birthday.toISOString().slice(0, 10) : null,
    region: user.region || null,
    status: user.status,
    registerSource: user.openid ? 'WECHAT' : 'PHONE',
    joinedFamilyCount: familyMemberCount,
    createdFamilyCount: ownedFamilyCount,
    familyCount: familyMemberCount + ownedFamilyCount,
    favoriteCount: user._count?.favorites ?? 0,
    recentViewCount: user._count?.viewHistories ?? 0,
    recipeCount: user._count?.recipes ?? 0,
    postCount: user._count?.posts ?? 0,
    commentCount: user._count?.comments ?? 0,
    submissionCount: (user._count?.recipes ?? 0) + (user._count?.posts ?? 0),
    priceRecordCount: 0,
    lastActiveAt: recentActiveAt,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const adminUsersRouter = Router();

// 1. GET /api/admin/users
adminUsersRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, status, source, role, startDate, endDate } = parsed.data;
  const skip = (page - 1) * pageSize;
  const createdRange = toDateRange(startDate, endDate);

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(source && source !== 'all' ? { source } : {}),
    ...(role && role !== 'all' ? { role } : {}),
    ...(createdRange ? { createdAt: createdRange } : {}),
    ...(q
      ? {
          OR: [
            { nickname: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
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
        _count: {
          select: {
            favorites: true,
            viewHistories: true,
            familyMembers: true,
            ownedFamilies: true,
            recipes: true,
            posts: true,
            comments: true
          }
        },
        viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
      }
    }),
    prisma.user.count({ where })
  ]);

  const data: PageResult<ReturnType<typeof formatUser>> = {
    list: list.map(formatUser),
    total,
    page,
    pageSize
  };
  res.json(ok(data));
});

// 2. GET /api/admin/users/:id
adminUsersRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const item = await prisma.user.findFirst({
    where: { id: parseId(req.params.id), deletedAt: null },
    include: {
      _count: {
        select: {
          favorites: true,
          viewHistories: true,
          familyMembers: true,
          ownedFamilies: true,
          recipes: true,
          posts: true,
          comments: true
        }
      },
      viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
    }
  });
  if (!item) throw new HttpError('用户不存在或已注销', 404, 404);
  res.json(ok(formatUser(item)));
});

// 3. POST /api/admin/users
adminUsersRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const { phone, email, password, birthday, ...data } = parsed.data;

  // Uniqueness checks
  if (phone && phone.trim() !== '') {
    const existing = await prisma.user.findFirst({
      where: { phone: phone.trim(), deletedAt: null }
    });
    if (existing) throw new HttpError('手机号已被注册', 422, 422);
  }

  if (email && email.trim() !== '') {
    const existing = await prisma.user.findFirst({
      where: { email: email.trim(), deletedAt: null }
    });
    if (existing) throw new HttpError('邮箱已被注册', 422, 422);
  }

  // Hash Password
  let passwordHash: string | null = null;
  if (password && password.trim() !== '') {
    passwordHash = await bcrypt.hash(password, 10);
  }

  // Parse Birthday
  let birthdayDate: Date | null = null;
  if (birthday && birthday.trim() !== '') {
    birthdayDate = new Date(birthday);
    if (Number.isNaN(birthdayDate.getTime())) {
      throw new HttpError('生日格式不正确', 400, 400);
    }
  }

  // Generate business code and UUID
  const lastUser = await prisma.user.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true }
  });
  const nextId = (lastUser?.id ?? 0) + 1;
  const code = `YH${String(nextId).padStart(6, '0')}`;
  const bizId = `usr_${crypto.randomUUID().replace(/-/g, '')}`;

  const created = await prisma.user.create({
    data: {
      ...data,
      phone: phone || null,
      email: email || null,
      passwordHash,
      birthday: birthdayDate,
      code,
      bizId,
      source: data.source || 'ADMIN_CREATED',
      sourceType: 'ADMIN'
    },
    include: {
      _count: {
        select: {
          favorites: true,
          viewHistories: true,
          familyMembers: true,
          ownedFamilies: true,
          recipes: true,
          posts: true,
          comments: true
        }
      },
      viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
    }
  });

  res.json(ok(formatUser(created)));
});

// 4. PUT /api/admin/users/:id
adminUsersRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const userId = parseId(req.params.id);
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null }
  });
  if (!user) throw new HttpError('用户不存在或已注销', 404, 404);

  const { phone, email, birthday, ...data } = parsed.data;

  // Uniqueness checks excluding current user
  if (phone && phone.trim() !== '') {
    const existing = await prisma.user.findFirst({
      where: { phone: phone.trim(), id: { not: userId }, deletedAt: null }
    });
    if (existing) throw new HttpError('手机号已被其他用户使用', 422, 422);
  }

  if (email && email.trim() !== '') {
    const existing = await prisma.user.findFirst({
      where: { email: email.trim(), id: { not: userId }, deletedAt: null }
    });
    if (existing) throw new HttpError('邮箱已被其他用户使用', 422, 422);
  }

  // Parse Birthday
  let birthdayDate: Date | null | undefined = undefined;
  if (birthday !== undefined) {
    if (birthday === null || birthday === '') {
      birthdayDate = null;
    } else {
      birthdayDate = new Date(birthday);
      if (Number.isNaN(birthdayDate.getTime())) {
        throw new HttpError('生日格式不正确', 400, 400);
      }
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      ...(phone !== undefined ? { phone: (phone === '' || phone === null) ? null : phone } : {}),
      ...(email !== undefined ? { email: (email === '' || email === null) ? null : email } : {}),
      ...(birthdayDate !== undefined ? { birthday: birthdayDate } : {})
    },
    include: {
      _count: {
        select: {
          favorites: true,
          viewHistories: true,
          familyMembers: true,
          ownedFamilies: true,
          recipes: true,
          posts: true,
          comments: true
        }
      },
      viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
    }
  });

  res.json(ok(formatUser(updated)));
});

// 5. PATCH /api/admin/users/:id/status
adminUsersRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const userId = parseId(req.params.id);
  const parsed = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) }).safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError('参数错误', 400, 400);
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null }
  });
  if (!user) throw new HttpError('用户不存在或已注销', 404, 404);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: parsed.data.status },
    include: {
      _count: {
        select: {
          favorites: true,
          viewHistories: true,
          familyMembers: true,
          ownedFamilies: true,
          recipes: true,
          posts: true,
          comments: true
        }
      },
      viewHistories: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
    }
  });

  res.json(ok(formatUser(updated)));
});

// 6. DELETE /api/admin/users/:id (Soft Delete)
adminUsersRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const userId = parseId(req.params.id);
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null }
  });
  if (!user) throw new HttpError('用户不存在或已注销', 404, 404);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() }
  });

  res.json(ok({
    success: true,
    message: '用户已成功注销',
    id: updated.bizId ?? `user_${updated.id}`
  }));
});
