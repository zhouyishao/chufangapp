import { Router } from 'express';
import { z } from 'zod';

import { createBusinessId, getPublicCode, getPublicId, nextCodeFromItems } from '../../lib/business-id';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';
import { baseListQuerySchema, parseId } from './shared';

const familyListQuerySchema = baseListQuerySchema.extend({
  city: z.string().trim().optional(),
  minMembers: z.coerce.number().int().min(0).optional(),
  maxMembers: z.coerce.number().int().min(0).optional()
});

const memberListQuerySchema = baseListQuerySchema.extend({
  familyId: z.coerce.number().int().min(1).optional(),
  role: z.enum(['CREATOR', 'ADMIN', 'MEMBER']).optional(),
  joinMethod: z.enum(['SCAN_QR', 'MANUAL_INVITE', 'INVITE_LINK', 'ADMIN_CREATE']).optional(),
  memberStatus: z.enum(['ACTIVE', 'LEFT', 'REMOVED']).optional(),
  city: z.string().trim().optional()
});

const inviteListQuerySchema = baseListQuerySchema.extend({
  familyId: z.coerce.number().int().min(1).optional(),
  inviteMethod: z.enum(['QR_CODE', 'LINK']).optional(),
  inviteStatus: z.enum(['JOINED', 'PENDING', 'EXPIRED', 'REVOKED']).optional(),
  inviterId: z.coerce.number().int().min(1).optional()
});

const createFamilySchema = z.object({
  name: z.string().trim().min(1).max(80),
  ownerId: z.coerce.number().int().min(1).optional(),
  city: z.string().trim().max(40).optional(),
  district: z.string().trim().max(40).optional(),
  memberLimit: z.coerce.number().int().min(1).max(20).default(8)
});

const createInviteSchema = z.object({
  familyId: z.coerce.number().int().min(1),
  inviterId: z.coerce.number().int().min(1).optional(),
  inviteMethod: z.enum(['QR_CODE', 'LINK']).default('QR_CODE'),
  inviteName: z.string().trim().min(1).max(120).default('家庭邀请')
});

export const adminFamiliesRouter = Router();

const memberInclude = {
  user: true,
  family: { include: { owner: true } }
} as const;

const inviteInclude = {
  family: true,
  inviter: true,
  invitee: true
} as const;

const toUserSummary = (user?: { id: number; bizId?: string | null; code?: string | null; nickname?: string | null; phone?: string | null; avatar?: string | null; createdAt?: Date; gender?: string | null } | null) =>
  user
    ? {
        id: getPublicId('user', user),
        legacyId: user.id,
        code: getPublicCode('user', user),
        nickname: user.nickname,
        phone: user.phone,
        avatar: user.avatar,
        gender: user.gender,
        createdAt: user.createdAt?.toISOString()
      }
    : null;

const toFamilySummary = (family: {
  id: number;
  bizId?: string | null;
  code?: string | null;
  name: string;
  avatar?: string | null;
  city?: string | null;
  district?: string | null;
  memberLimit: number;
  activeAt?: Date | null;
  createdAt: Date;
  status: 'ACTIVE' | 'DISABLED';
  owner?: Parameters<typeof toUserSummary>[0];
  _count?: { members?: number; invites?: number };
}) => ({
  id: getPublicId('family', family),
  legacyId: family.id,
  code: getPublicCode('family', family),
  name: family.name,
  avatar: family.avatar,
  city: family.city,
  district: family.district,
  memberLimit: family.memberLimit,
  memberCount: family._count?.members ?? 0,
  inviteCount: family._count?.invites ?? 0,
  activeAt: family.activeAt?.toISOString() ?? null,
  createdAt: family.createdAt.toISOString(),
  status: family.status,
  owner: toUserSummary(family.owner)
});

const toMember = (member: {
  id: number;
  role: 'CREATOR' | 'ADMIN' | 'MEMBER';
  joinMethod: 'SCAN_QR' | 'MANUAL_INVITE' | 'INVITE_LINK' | 'ADMIN_CREATE';
  joinedAt: Date;
  leftAt?: Date | null;
  memberStatus: 'ACTIVE' | 'LEFT' | 'REMOVED';
  user: Parameters<typeof toUserSummary>[0];
  family: Parameters<typeof toFamilySummary>[0];
}) => ({
  id: member.id,
  role: member.role,
  joinMethod: member.joinMethod,
  joinedAt: member.joinedAt.toISOString(),
  leftAt: member.leftAt?.toISOString() ?? null,
  memberStatus: member.memberStatus,
  user: toUserSummary(member.user),
  family: toFamilySummary(member.family)
});

const toInvite = (invite: {
  id: number;
  bizId?: string | null;
  code?: string | null;
  inviteName: string;
  inviteMethod: 'QR_CODE' | 'LINK';
  inviteType: string;
  token?: string | null;
  url?: string | null;
  inviteStatus: 'JOINED' | 'PENDING' | 'EXPIRED' | 'REVOKED';
  joinedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  family: Parameters<typeof toFamilySummary>[0];
  inviter?: Parameters<typeof toUserSummary>[0];
  invitee?: Parameters<typeof toUserSummary>[0];
}) => ({
  id: getPublicId('family_invite', invite),
  legacyId: invite.id,
  code: getPublicCode('family_invite', invite),
  inviteName: invite.inviteName,
  inviteMethod: invite.inviteMethod,
  inviteType: invite.inviteType,
  token: invite.token,
  url: invite.url,
  inviteStatus: invite.inviteStatus,
  joinedAt: invite.joinedAt?.toISOString() ?? null,
  expiresAt: invite.expiresAt?.toISOString() ?? null,
  createdAt: invite.createdAt.toISOString(),
  family: toFamilySummary(invite.family),
  inviter: toUserSummary(invite.inviter),
  invitee: toUserSummary(invite.invitee)
});

adminFamiliesRouter.get('/overview', requireAdminAuth, async (_req, res) => {
  const [familyTotal, activeFamilies, memberTotal, todayFamilies, todayMembers, abnormalMembers] = await Promise.all([
    prisma.family.count({ where: { deletedAt: null } }),
    prisma.family.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.familyMember.count({ where: { deletedAt: null } }),
    prisma.family.count({ where: { deletedAt: null, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.familyMember.count({ where: { deletedAt: null, joinedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.familyMember.count({ where: { deletedAt: null, memberStatus: { not: 'ACTIVE' } } })
  ]);
  res.json(ok({ familyTotal, activeFamilies, memberTotal, todayFamilies, todayMembers, abnormalMembers }));
});

adminFamiliesRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = familyListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status, city, minMembers, maxMembers } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(city ? { city } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { code: { contains: q, mode: 'insensitive' as const } }] } : {})
  };
  const [rows, total] = await Promise.all([
    prisma.family.findMany({ where, include: { owner: true, _count: { select: { members: true, invites: true } } }, orderBy: [{ id: 'desc' }], skip, take: pageSize }),
    prisma.family.count({ where })
  ]);
  const filtered = rows
    .map(toFamilySummary)
    .filter((item) => (minMembers === undefined || item.memberCount >= minMembers) && (maxMembers === undefined || item.memberCount <= maxMembers));
  const data: PageResult<(typeof filtered)[number]> = { list: filtered, total, page, pageSize };
  res.json(ok(data));
});

adminFamiliesRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = createFamilySchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const codes = await prisma.family.findMany({ select: { code: true } });
  const family = await prisma.family.create({
    data: {
      bizId: createBusinessId('family'),
      code: nextCodeFromItems('family', codes),
      name: parsed.data.name,
      ownerId: parsed.data.ownerId,
      city: parsed.data.city,
      district: parsed.data.district,
      memberLimit: parsed.data.memberLimit,
      activeAt: new Date()
    },
    include: { owner: true, _count: { select: { members: true, invites: true } } }
  });
  if (parsed.data.ownerId) {
    await prisma.familyMember.upsert({
      where: { familyId_userId: { familyId: family.id, userId: parsed.data.ownerId } },
      create: { familyId: family.id, userId: parsed.data.ownerId, role: 'CREATOR', joinMethod: 'ADMIN_CREATE' },
      update: { role: 'CREATOR', memberStatus: 'ACTIVE' }
    });
  }
  res.json(ok(toFamilySummary(family)));
});

adminFamiliesRouter.get('/members', requireAdminAuth, async (req, res) => {
  const parsed = memberListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, role, joinMethod, memberStatus, familyId, city } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(role ? { role } : {}),
    ...(joinMethod ? { joinMethod } : {}),
    ...(memberStatus ? { memberStatus } : {}),
    ...(familyId ? { familyId } : {}),
    ...(city ? { family: { city } } : {}),
    ...(q ? { OR: [{ user: { nickname: { contains: q, mode: 'insensitive' as const } } }, { user: { phone: { contains: q, mode: 'insensitive' as const } } }, { family: { name: { contains: q, mode: 'insensitive' as const } } }] } : {})
  };
  const [rows, total] = await Promise.all([
    prisma.familyMember.findMany({ where, include: memberInclude, orderBy: [{ id: 'desc' }], skip, take: pageSize }),
    prisma.familyMember.count({ where })
  ]);
  const list = rows.map(toMember);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminFamiliesRouter.get('/invites', requireAdminAuth, async (req, res) => {
  const parsed = inviteListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, inviteMethod, inviteStatus, familyId, inviterId } = parsed.data;
  const skip = (page - 1) * pageSize;
  const where = {
    deletedAt: null,
    ...(inviteMethod ? { inviteMethod } : {}),
    ...(inviteStatus ? { inviteStatus } : {}),
    ...(familyId ? { familyId } : {}),
    ...(inviterId ? { inviterId } : {}),
    ...(q ? { OR: [{ inviteName: { contains: q, mode: 'insensitive' as const } }, { url: { contains: q, mode: 'insensitive' as const } }] } : {})
  };
  const [rows, total] = await Promise.all([
    prisma.familyInvite.findMany({ where, include: inviteInclude, orderBy: [{ id: 'desc' }], skip, take: pageSize }),
    prisma.familyInvite.count({ where })
  ]);
  const list = rows.map(toInvite);
  const data: PageResult<(typeof list)[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminFamiliesRouter.post('/invites', requireAdminAuth, async (req, res) => {
  const parsed = createInviteSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const family = await prisma.family.findFirst({ where: { id: parsed.data.familyId, deletedAt: null } });
  if (!family) throw new HttpError('家庭不存在', 404, 404);
  const token = createBusinessId('family_invite').replace('family_invite_', '');
  const codes = await prisma.familyInvite.findMany({ select: { code: true } });
  const invite = await prisma.familyInvite.create({
    data: {
      bizId: createBusinessId('family_invite'),
      code: nextCodeFromItems('family_invite', codes),
      familyId: parsed.data.familyId,
      inviterId: parsed.data.inviterId,
      inviteMethod: parsed.data.inviteMethod,
      inviteName: parsed.data.inviteName,
      token,
      url: `https://jlyc.app/invite/${token}`,
      inviteStatus: 'PENDING'
    },
    include: inviteInclude
  });
  res.json(ok(toInvite(invite)));
});

adminFamiliesRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const family = await prisma.family.findFirst({
    where: { id, deletedAt: null },
    include: {
      owner: true,
      _count: { select: { members: true, invites: true } },
      members: { where: { deletedAt: null }, include: { user: true, family: { include: { owner: true, _count: { select: { members: true, invites: true } } } } }, orderBy: [{ id: 'asc' }] },
      invites: { where: { deletedAt: null }, include: inviteInclude, orderBy: [{ id: 'desc' }], take: 5 }
    }
  });
  if (!family) throw new HttpError('not found', 404, 404);
  res.json(ok({ ...toFamilySummary(family), members: family.members.map(toMember), invites: family.invites.map(toInvite) }));
});

adminFamiliesRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const parsed = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) }).safeParse(req.body);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const family = await prisma.family.update({
    where: { id: parseId(req.params.id) },
    data: { status: parsed.data.status },
    include: { owner: true, _count: { select: { members: true, invites: true } } }
  });
  res.json(ok(toFamilySummary(family)));
});

adminFamiliesRouter.patch('/members/:id/remove', requireAdminAuth, async (req, res) => {
  const member = await prisma.familyMember.update({
    where: { id: parseId(req.params.id) },
    data: { memberStatus: 'REMOVED', leftAt: new Date(), status: 'DISABLED' },
    include: memberInclude
  });
  res.json(ok(toMember(member)));
});
