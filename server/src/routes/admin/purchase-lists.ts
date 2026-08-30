import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { prisma } from '../../prisma';

const purchaseStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
type PurchaseStatus = (typeof purchaseStatuses)[number];

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  status: z.enum(purchaseStatuses).optional()
});

const purchaseItemInclude = {
  family: { select: { id: true, name: true } },
  user: { select: { id: true, nickname: true, phone: true } },
  ingredient: { select: { id: true, name: true, currentPrice: true, priceUnit: true } },
  recipe: { select: { id: true, title: true } }
} as const;

type PurchaseRow = Awaited<ReturnType<typeof prisma.purchaseListItem.findMany<{ include: typeof purchaseItemInclude }>>>[number];

const getPurchaseStatus = (itemCount: number, checkedCount: number): PurchaseStatus => {
  if (itemCount > 0 && checkedCount === itemCount) return 'COMPLETED';
  if (checkedCount > 0) return 'IN_PROGRESS';
  return 'PENDING';
};

const toScopeKey = (row: PurchaseRow) => row.familyId ? `family:${row.familyId}` : `user:${row.userId}`;

const aggregateRows = (rows: PurchaseRow[]) => {
  const grouped = new Map<string, PurchaseRow[]>();
  rows.forEach((row) => {
    const key = toScopeKey(row);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  });

  return [...grouped.entries()].map(([scopeKey, items]) => {
    const first = items[0];
    if (!first) return null;
    const checkedCount = items.filter((item) => item.checked).length;
    const pricedItems = items.filter((item) => item.ingredient?.currentPrice !== null && item.ingredient?.currentPrice !== undefined);
    const estimatedAmount = pricedItems.reduce(
      (sum, item) => sum + Number(item.ingredient?.currentPrice ?? 0) * Number(item.quantity),
      0
    );
    const creators = [...new Set(items.map((item) => item.user.nickname || item.user.phone || `用户 ${item.userId}`))];

    return {
      scopeKey,
      scopeType: first.familyId ? 'FAMILY' as const : 'USER' as const,
      scopeId: first.familyId ?? first.userId,
      name: first.family ? `${first.family.name}共享菜篮` : `${first.user.nickname || first.user.phone || `用户 ${first.userId}`}个人菜篮`,
      familyName: first.family?.name ?? null,
      creators,
      itemCount: items.length,
      checkedCount,
      status: getPurchaseStatus(items.length, checkedCount),
      estimatedAmount: Number(estimatedAmount.toFixed(2)),
      missingPriceCount: items.length - pricedItems.length,
      createdAt: items.reduce((earliest, item) => item.createdAt < earliest ? item.createdAt : earliest, first.createdAt).toISOString(),
      updatedAt: items.reduce((latest, item) => item.updatedAt > latest ? item.updatedAt : latest, first.updatedAt).toISOString()
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
};

const serializeItem = (item: PurchaseRow) => ({
  id: item.id,
  name: item.ingredient?.name || item.name,
  amountText: item.amountText,
  quantity: Number(item.quantity),
  unit: item.unit,
  checked: item.checked,
  checkedAt: item.checkedAt?.toISOString() ?? null,
  recipeId: item.recipeId,
  recipeName: item.recipe?.title || item.recipeName,
  ingredientId: item.ingredientId,
  currentPrice: item.ingredient?.currentPrice === null || item.ingredient?.currentPrice === undefined
    ? null
    : Number(item.ingredient.currentPrice),
  priceUnit: item.ingredient?.priceUnit ?? null,
  creator: item.user.nickname || item.user.phone || `用户 ${item.userId}`,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString()
});

export const adminPurchaseListsRouter = Router();

adminPurchaseListsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, q, status } = parsed.data;
  const rows = await prisma.purchaseListItem.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { recipeName: { contains: q, mode: 'insensitive' as const } },
          { family: { name: { contains: q, mode: 'insensitive' as const } } },
          { user: { nickname: { contains: q, mode: 'insensitive' as const } } },
          { user: { phone: { contains: q, mode: 'insensitive' as const } } }
        ]
      } : {})
    },
    include: purchaseItemInclude,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }]
  });
  const aggregates = aggregateRows(rows).filter((item) => !status || item.status === status);
  const start = (page - 1) * pageSize;
  const data: PageResult<(typeof aggregates)[number]> = {
    list: aggregates.slice(start, start + pageSize),
    total: aggregates.length,
    page,
    pageSize
  };
  res.json(ok(data));
});

adminPurchaseListsRouter.get('/:scopeType/:scopeId', requireAdminAuth, async (req, res) => {
  const parsed = z.object({
    scopeType: z.enum(['family', 'user']),
    scopeId: z.coerce.number().int().positive()
  }).safeParse(req.params);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);

  const rows = await prisma.purchaseListItem.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      ...(parsed.data.scopeType === 'family'
        ? { familyId: parsed.data.scopeId }
        : { familyId: null, userId: parsed.data.scopeId })
    },
    include: purchaseItemInclude,
    orderBy: [{ checked: 'asc' }, { updatedAt: 'desc' }, { id: 'desc' }]
  });
  if (rows.length === 0) throw new HttpError('采购清单不存在', 404, 404);
  res.json(ok({ summary: aggregateRows(rows)[0], items: rows.map(serializeItem) }));
});
