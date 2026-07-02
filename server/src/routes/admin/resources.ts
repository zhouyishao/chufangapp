import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { baseListQuerySchema, parseId } from './shared';
import { createBusinessId, nextCodeFromItems } from '../../lib/business-id';

export const adminResourcesRouter = Router();

// Zod validation error formatting helper
const formatZodError = (result: any): HttpError => {
  if (result.success) return new HttpError('无错误', 400, 400);
  const errorMsg = result.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ');
  return new HttpError(`参数格式错误: ${errorMsg}`, 400, 400);
};

// ==========================================
// 1. 应用管理 (ResourceApp)
// ==========================================

const appUpsertSchema = z.object({
  name: z.string().trim().min(1).max(120),
  appId: z.string().trim().min(1).max(64),
  appType: z.enum(['ADMIN', 'APP', 'THIRD_PARTY']),
  owner: z.string().trim().min(1).max(64),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});

adminResourcesRouter.get('/resource-apps', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.extend({
    appType: z.enum(['ADMIN', 'APP', 'THIRD_PARTY']).optional()
  }).safeParse(req.query);
  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, status, appType } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(status ? { status } : {}),
    ...(appType ? { appType } : {}),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { appId: { contains: q, mode: 'insensitive' as const } }
      ]
    } : {})
  };

  const [apps, total] = await Promise.all([
    prisma.resourceApp.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.resourceApp.count({ where })
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const list = await Promise.all(apps.map(async (app) => {
    const apiKeyCount = await prisma.resourceApiKey.count({
      where: { appId: app.id }
    });
    const todayCallCount = await prisma.resourceCallLog.count({
      where: { appId: app.id, calledAt: { gte: todayStart } }
    });
    const lastLog = await prisma.resourceCallLog.findFirst({
      where: { appId: app.id },
      orderBy: { calledAt: 'desc' },
      select: { calledAt: true }
    });

    return {
      ...app,
      apiKeyCount,
      todayCallCount,
      lastCalledAt: lastLog ? lastLog.calledAt.toISOString() : null
    };
  }));

  const data: PageResult<typeof list[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminResourcesRouter.get('/resource-apps/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const app = await prisma.resourceApp.findUnique({ where: { id } });
  if (!app) throw new HttpError('应用未找到', 404, 404);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const apiKeyCount = await prisma.resourceApiKey.count({
    where: { appId: app.id }
  });
  const todayCallCount = await prisma.resourceCallLog.count({
    where: { appId: app.id, calledAt: { gte: todayStart } }
  });
  const lastLog = await prisma.resourceCallLog.findFirst({
    where: { appId: app.id },
    orderBy: { calledAt: 'desc' },
    select: { calledAt: true }
  });

  res.json(ok({
    ...app,
    apiKeyCount,
    todayCallCount,
    lastCalledAt: lastLog ? lastLog.calledAt.toISOString() : null
  }));
});

adminResourcesRouter.post('/resource-apps', requireAdminAuth, async (req, res) => {
  const parsed = appUpsertSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  // Check unique appId
  const existing = await prisma.resourceApp.findUnique({
    where: { appId: parsed.data.appId }
  });
  if (existing) throw new HttpError('App ID 已存在', 422, 422);

  const created = await prisma.resourceApp.create({ data: parsed.data });
  res.json(ok(created));
});

adminResourcesRouter.put('/resource-apps/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const parsed = appUpsertSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const app = await prisma.resourceApp.findUnique({ where: { id } });
  if (!app) throw new HttpError('应用未找到', 404, 404);

  // Check unique appId if changed
  if (parsed.data.appId !== app.appId) {
    const existing = await prisma.resourceApp.findUnique({
      where: { appId: parsed.data.appId }
    });
    if (existing) throw new HttpError('App ID 已存在', 422, 422);
  }

  const updated = await prisma.resourceApp.update({
    where: { id },
    data: parsed.data
  });
  res.json(ok(updated));
});

adminResourcesRouter.patch('/resource-apps/:id/status', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const statusSchema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const updated = await prisma.resourceApp.update({
    where: { id },
    data: { status: parsed.data.status }
  });
  res.json(ok(updated));
});

adminResourcesRouter.delete('/resource-apps/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const existing = await prisma.resourceApp.findUnique({ where: { id } });
  if (!existing) throw new HttpError('应用未找到', 404, 404);

  // Reasonable deletion strategy: Block deletion if there are associated API Keys
  const apiKeyCount = await prisma.resourceApiKey.count({ where: { appId: id } });
  if (apiKeyCount > 0) {
    throw new HttpError(`无法删除应用：该应用下存在 ${apiKeyCount} 个关联的 API Key，请先删除相关 API Key`, 422, 422);
  }

  const deleted = await prisma.resourceApp.delete({ where: { id } });
  res.json(ok(deleted));
});

// ==========================================
// 2. API Key 管理 (ResourceApiKey)
// ==========================================

const apiKeyUpsertSchema = z.object({
  name: z.string().trim().min(1).max(120),
  appId: z.coerce.number().int().positive(),
  permissionScope: z.string().trim().min(1),
  status: z.enum(['ACTIVE', 'DISABLED', 'EXPIRED']).default('ACTIVE'),
  expiresAt: z.string().nullable().optional()
});

adminResourcesRouter.get('/resource-api-keys', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, status } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(status ? { status } : {}),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { keyPrefix: { contains: q, mode: 'insensitive' as const } }
      ]
    } : {})
  };

  const [keys, total] = await Promise.all([
    prisma.resourceApiKey.findMany({
      where,
      include: {
        app: {
          select: { name: true }
        }
      },
      orderBy: { id: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.resourceApiKey.count({ where })
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const list = await Promise.all(keys.map(async (k) => {
    const todayCallCount = await prisma.resourceCallLog.count({
      where: { apiKeyId: k.id, calledAt: { gte: todayStart } }
    });

    return {
      id: k.id,
      name: k.name,
      appId: k.appId,
      appName: k.app.name,
      keyPrefix: k.keyPrefix,
      permissionScope: k.permissionScope,
      status: k.status,
      expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
      todayCallCount,
      createdAt: k.createdAt.toISOString(),
      updatedAt: k.updatedAt.toISOString()
    };
  }));

  const data: PageResult<typeof list[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminResourcesRouter.get('/resource-api-keys/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const k = await prisma.resourceApiKey.findUnique({
    where: { id },
    include: { app: { select: { name: true } } }
  });
  if (!k) throw new HttpError('密钥未找到', 404, 404);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCallCount = await prisma.resourceCallLog.count({
    where: { apiKeyId: k.id, calledAt: { gte: todayStart } }
  });

  res.json(ok({
    id: k.id,
    name: k.name,
    appId: k.appId,
    appName: k.app.name,
    keyPrefix: k.keyPrefix,
    permissionScope: k.permissionScope,
    status: k.status,
    expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
    todayCallCount,
    createdAt: k.createdAt.toISOString(),
    updatedAt: k.updatedAt.toISOString()
  }));
});

adminResourcesRouter.post('/resource-api-keys', requireAdminAuth, async (req, res) => {
  const parsed = apiKeyUpsertSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const app = await prisma.resourceApp.findUnique({ where: { id: parsed.data.appId } });
  if (!app) throw new HttpError('所属应用不存在', 422, 422);

  // Generate Key Prefix and SHA-256 Hash
  const rawKey = 'ak_' + crypto.randomBytes(24).toString('hex');
  const keyPrefix = rawKey.slice(0, 10);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const created = await prisma.resourceApiKey.create({
    data: {
      name: parsed.data.name,
      appId: parsed.data.appId,
      keyPrefix,
      keyHash,
      permissionScope: parsed.data.permissionScope,
      status: parsed.data.status,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null
    }
  });

  // Strict: Avoid returning keyHash in response
  res.json(ok({
    id: created.id,
    name: created.name,
    appId: created.appId,
    appName: app.name,
    keyPrefix: created.keyPrefix,
    permissionScope: created.permissionScope,
    status: created.status,
    expiresAt: created.expiresAt ? created.expiresAt.toISOString() : null,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    rawKey // Only return the raw key ONCE on creation
  }));
});

adminResourcesRouter.post('/resource-api-keys/:id/reset', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const k = await prisma.resourceApiKey.findUnique({
    where: { id },
    include: { app: { select: { name: true } } }
  });
  if (!k) throw new HttpError('密钥未找到', 404, 404);

  // Re-generate raw key
  const rawKey = 'ak_' + crypto.randomBytes(24).toString('hex');
  const keyPrefix = rawKey.slice(0, 10);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const updated = await prisma.resourceApiKey.update({
    where: { id },
    data: {
      keyPrefix,
      keyHash
    }
  });

  // Strict: Avoid returning keyHash in response
  res.json(ok({
    id: updated.id,
    name: updated.name,
    appId: updated.appId,
    appName: k.app.name,
    keyPrefix: updated.keyPrefix,
    permissionScope: updated.permissionScope,
    status: updated.status,
    expiresAt: updated.expiresAt ? updated.expiresAt.toISOString() : null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    rawKey // Only return the reset raw key ONCE
  }));
});

adminResourcesRouter.patch('/resource-api-keys/:id/status', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const statusSchema = z.object({ status: z.enum(['ACTIVE', 'DISABLED', 'EXPIRED']) });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const updated = await prisma.resourceApiKey.update({
    where: { id },
    data: { status: parsed.data.status }
  });
  res.json(ok(updated));
});

adminResourcesRouter.delete('/resource-api-keys/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const existing = await prisma.resourceApiKey.findUnique({ where: { id } });
  if (!existing) throw new HttpError('密钥未找到', 404, 404);

  const deleted = await prisma.resourceApiKey.delete({ where: { id } });
  res.json(ok(deleted));
});

// ==========================================
// 3. 接口权限 (ResourcePermission)
// ==========================================

const permissionUpsertSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(80),
  path: z.string().trim().min(1).max(255),
  method: z.string().trim().min(1).max(16),
  module: z.enum(['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE', 'PRICE', 'CATEGORY']),
  authRequired: z.coerce.boolean().default(true),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});

adminResourcesRouter.get('/resource-permissions', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.extend({
    module: z.enum(['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE', 'PRICE', 'CATEGORY']).optional()
  }).safeParse(req.query);
  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, status, module } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(status ? { status } : {}),
    ...(module ? { module } : {}),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { code: { contains: q, mode: 'insensitive' as const } },
        { path: { contains: q, mode: 'insensitive' as const } }
      ]
    } : {})
  };

  const [list, total] = await Promise.all([
    prisma.resourcePermission.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.resourcePermission.count({ where })
  ]);

  const data: PageResult<typeof list[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminResourcesRouter.get('/resource-permissions/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const item = await prisma.resourcePermission.findUnique({ where: { id } });
  if (!item) throw new HttpError('权限未找到', 404, 404);
  res.json(ok(item));
});

adminResourcesRouter.post('/resource-permissions', requireAdminAuth, async (req, res) => {
  const parsed = permissionUpsertSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const existing = await prisma.resourcePermission.findUnique({
    where: { code: parsed.data.code }
  });
  if (existing) throw new HttpError('权限编码已存在', 422, 422);

  const created = await prisma.resourcePermission.create({ data: parsed.data });
  res.json(ok(created));
});

adminResourcesRouter.put('/resource-permissions/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const parsed = permissionUpsertSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const item = await prisma.resourcePermission.findUnique({ where: { id } });
  if (!item) throw new HttpError('权限未找到', 404, 404);

  if (parsed.data.code !== item.code) {
    const existing = await prisma.resourcePermission.findUnique({
      where: { code: parsed.data.code }
    });
    if (existing) throw new HttpError('权限编码已存在', 422, 422);
  }

  const updated = await prisma.resourcePermission.update({
    where: { id },
    data: parsed.data
  });
  res.json(ok(updated));
});

adminResourcesRouter.patch('/resource-permissions/:id/status', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const statusSchema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const updated = await prisma.resourcePermission.update({
    where: { id },
    data: { status: parsed.data.status }
  });
  res.json(ok(updated));
});

adminResourcesRouter.delete('/resource-permissions/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const existing = await prisma.resourcePermission.findUnique({ where: { id } });
  if (!existing) throw new HttpError('权限未找到', 404, 404);

  const deleted = await prisma.resourcePermission.delete({ where: { id } });
  res.json(ok(deleted));
});

// ==========================================
// 4. 调用日志 (ResourceCallLog)
// ==========================================

adminResourcesRouter.get('/resource-logs', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.extend({
    method: z.string().trim().optional(),
    statusCode: z.coerce.number().int().optional()
  }).safeParse(req.query);

  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, method, statusCode } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(method ? { method } : {}),
    ...(statusCode ? { statusCode } : {}),
    ...(q ? {
      OR: [
        { path: { contains: q, mode: 'insensitive' as const } },
        { apiKeyPrefix: { contains: q, mode: 'insensitive' as const } },
        { ip: { contains: q, mode: 'insensitive' as const } },
        { errorMessage: { contains: q, mode: 'insensitive' as const } }
      ]
    } : {})
  };

  const [logs, total] = await Promise.all([
    prisma.resourceCallLog.findMany({
      where,
      include: {
        app: {
          select: { name: true }
        }
      },
      orderBy: { calledAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.resourceCallLog.count({ where })
  ]);

  const list = logs.map((log) => ({
    id: log.id,
    calledAt: log.calledAt.toISOString(),
    appId: log.appId,
    appName: log.app.name,
    apiKeyPrefix: log.apiKeyPrefix,
    path: log.path,
    method: log.method,
    statusCode: log.statusCode,
    durationMs: log.durationMs,
    ip: log.ip,
    errorMessage: log.errorMessage,
    createdAt: log.createdAt.toISOString()
  }));

  const data: PageResult<typeof list[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminResourcesRouter.get('/resource-logs/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const log = await prisma.resourceCallLog.findUnique({
    where: { id },
    include: { app: { select: { name: true } } }
  });
  if (!log) throw new HttpError('日志未找到', 404, 404);

  res.json(ok({
    id: log.id,
    calledAt: log.calledAt.toISOString(),
    appId: log.appId,
    appName: log.app.name,
    apiKeyPrefix: log.apiKeyPrefix,
    path: log.path,
    method: log.method,
    statusCode: log.statusCode,
    durationMs: log.durationMs,
    ip: log.ip,
    errorMessage: log.errorMessage,
    createdAt: log.createdAt.toISOString()
  }));
});

// ==========================================
// 5. 资源接入与导入记录 (Resource Import)
// ==========================================

async function checkDuplicate(resourceType: string, name: string): Promise<boolean> {
  const normalizedName = name.trim();
  if (resourceType === 'RECIPE') {
    const existing = await prisma.recipe.findFirst({
      where: { title: { equals: normalizedName, mode: 'insensitive' }, deletedAt: null }
    });
    return !!existing;
  } else if (resourceType === 'BEVERAGE') {
    const existing = await prisma.beverage.findFirst({
      where: { name: { equals: normalizedName, mode: 'insensitive' }, deletedAt: null }
    });
    return !!existing;
  } else if (['INGREDIENT', 'FRUIT', 'SEASONING'].includes(resourceType)) {
    const existing = await prisma.ingredient.findFirst({
      where: { name: { equals: normalizedName, mode: 'insensitive' }, deletedAt: null }
    });
    return !!existing;
  }
  return false;
}

async function resolveCategory(name: string, type: string): Promise<number> {
  const normalizedName = name.trim();
  let catType: any = 'INGREDIENT';
  if (type === 'RECIPE') catType = 'RECIPE';
  else if (type === 'FRUIT') catType = 'FRUIT';
  else if (type === 'SEASONING') catType = 'SEASONING';
  else if (type === 'BEVERAGE') catType = 'BEVERAGE';

  const existing = await prisma.category.findFirst({
    where: { name: { equals: normalizedName, mode: 'insensitive' }, type: catType, deletedAt: null }
  });
  if (existing) {
    return existing.id;
  }

  const codes = await prisma.category.findMany({ select: { code: true } });
  const code = nextCodeFromItems('category', codes);
  const bizId = createBusinessId('category');

  const created = await prisma.category.create({
    data: {
      type: catType,
      name: normalizedName,
      bizId,
      code,
      sort: 0,
      sortOrder: 0,
      status: 'ACTIVE',
      isPublish: true
    }
  });

  return created.id;
}

async function importRecipe(name: string, content: any) {
  const categoryId = content.categoryName ? await resolveCategory(content.categoryName, 'RECIPE') : undefined;

  let cuisineId = undefined;
  if (content.cuisineName) {
    const cuisine = await prisma.cuisine.findFirst({
      where: { name: { equals: content.cuisineName.trim(), mode: 'insensitive' } }
    });
    if (cuisine) {
      cuisineId = cuisine.id;
    } else {
      const createdCuisine = await prisma.cuisine.create({
        data: {
          name: content.cuisineName.trim(),
          description: '',
          sort: 0,
          isPublish: true
        }
      });
      cuisineId = createdCuisine.id;
    }
  }

  const recipes = await prisma.recipe.findMany({ select: { code: true } });
  const code = nextCodeFromItems('recipe', recipes);
  const bizId = createBusinessId('recipe');

  const createdRecipe = await prisma.recipe.create({
    data: {
      bizId,
      code,
      title: name.trim(),
      subtitle: content.subtitle || null,
      description: content.description || null,
      cookTime: content.cookTime ? Number(content.cookTime) : null,
      difficulty: content.difficulty || null,
      servings: content.servings ? Number(content.servings) : null,
      calories: content.calories ? Number(content.calories) : null,
      taste: content.taste || null,
      scene: content.scene || null,
      tips: content.tips || null,
      categoryId,
      cuisineId,
      isDraft: false,
      isPublish: true,
      auditStatus: 'APPROVED'
    }
  });

  if (content.steps && Array.isArray(content.steps)) {
    const stepData = content.steps.map((step: any, idx: number) => {
      const desc = typeof step === 'string' ? step : step.description || '';
      const sortIdx = typeof step === 'string' ? (idx + 1) : step.sortIndex || (idx + 1);
      return {
        recipeId: createdRecipe.id,
        sortIndex: sortIdx,
        description: desc
      };
    });
    await prisma.recipeStep.createMany({ data: stepData });
  }

  if (content.ingredients && Array.isArray(content.ingredients)) {
    const ingData = await Promise.all(content.ingredients.map(async (ing: any, idx: number) => {
      const ingName = typeof ing === 'string' ? ing : ing.name || '';
      const amount = typeof ing === 'string' ? '' : ing.amount || '';
      const sortIdx = typeof ing === 'string' ? (idx + 1) : ing.sortIndex || (idx + 1);

      const matchingIng = await prisma.ingredient.findFirst({
        where: { name: { equals: ingName.trim(), mode: 'insensitive' }, deletedAt: null }
      });

      return {
        recipeId: createdRecipe.id,
        ingredientId: matchingIng ? matchingIng.id : null,
        name: ingName.trim(),
        amount,
        sortIndex: sortIdx
      };
    }));
    await prisma.recipeIngredient.createMany({ data: ingData });
  }

  return createdRecipe;
}

async function importIngredient(resourceType: string, name: string, content: any) {
  const categoryId = content.categoryName ? await resolveCategory(content.categoryName, resourceType) : undefined;

  const ingredients = await prisma.ingredient.findMany({ select: { code: true } });
  const code = nextCodeFromItems('ingredient', ingredients);
  const bizId = createBusinessId('ingredient');

  const created = await prisma.ingredient.create({
    data: {
      bizId,
      code,
      name: name.trim(),
      cover: content.cover || null,
      categoryId,
      seasonMonth: content.seasonMonth || null,
      nutrition: content.nutrition || null,
      selectionTips: content.selectionTips || null,
      storageMethod: content.storageMethod || null,
      taboo: content.taboo || null,
      currentPrice: content.currentPrice ? Number(content.currentPrice) : null,
      priceUnit: content.priceUnit || null,
      priceSource: content.priceSource || null,
      priceDate: content.priceDate ? new Date(content.priceDate) : null,
      isPublish: true
    }
  });
  return created;
}

async function importBeverage(name: string, content: any) {
  const categoryId = content.categoryName ? await resolveCategory(content.categoryName, 'BEVERAGE') : undefined;

  const beverages = await prisma.beverage.findMany({ select: { code: true } });
  const code = nextCodeFromItems('beverage', beverages);
  const bizId = createBusinessId('beverage');

  const created = await prisma.beverage.create({
    data: {
      bizId,
      code,
      name: name.trim(),
      coverImage: content.coverImage || content.cover || null,
      categoryId,
      beverageType: content.beverageType || null,
      isAlcoholic: content.isAlcoholic === true || content.isAlcoholic === 'true',
      alcoholDegree: content.alcoholDegree ? Number(content.alcoholDegree) : null,
      description: content.description || null,
      isPublish: true
    }
  });
  return created;
}

adminResourcesRouter.post('/resource-imports/batches', requireAdminAuth, async (req, res) => {
  const uploadSchema = z.object({
    fileName: z.string().trim().min(1),
    sourceType: z.string().trim().min(1),
    items: z.array(z.object({
      resourceType: z.enum(['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE']),
      name: z.string().trim().min(1),
      content: z.record(z.string(), z.any())
    })).min(1)
  });

  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const { fileName, sourceType, items } = parsed.data;
  const operator = req.admin?.username || 'admin';

  const batch = await prisma.resourceImportBatch.create({
    data: {
      fileName,
      sourceType,
      status: 'PENDING',
      totalCount: items.length,
      operator
    }
  });

  const stagedItems = await Promise.all(items.map(async (item) => {
    const isDuplicate = await checkDuplicate(item.resourceType, item.name);
    return prisma.resourceImportItem.create({
      data: {
        batchId: batch.id,
        resourceType: item.resourceType,
        name: item.name,
        content: item.content,
        status: 'PENDING',
        isDuplicate
      }
    });
  }));

  res.json(ok({ batch, items: stagedItems }));
});

adminResourcesRouter.get('/resource-imports/batches/stats', requireAdminAuth, async (req, res) => {
  const [total, pending, completed, failed] = await Promise.all([
    prisma.resourceImportBatch.count(),
    prisma.resourceImportBatch.count({ where: { status: 'PENDING' } }),
    prisma.resourceImportBatch.count({ where: { status: 'COMPLETED' } }),
    prisma.resourceImportBatch.count({ where: { status: 'FAILED' } })
  ]);
  res.json(ok({ total, pending, completed, failed }));
});

adminResourcesRouter.get('/resource-imports/batches', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.safeParse(req.query);
  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, status } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(status ? { status } : {}),
    ...(q ? {
      OR: [
        { fileName: { contains: q, mode: 'insensitive' as const } },
        { operator: { contains: q, mode: 'insensitive' as const } }
      ]
    } : {})
  };

  const [list, total] = await Promise.all([
    prisma.resourceImportBatch.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.resourceImportBatch.count({ where })
  ]);

  const data: PageResult<typeof list[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminResourcesRouter.get('/resource-imports/items', requireAdminAuth, async (req, res) => {
  const parsed = baseListQuerySchema.extend({
    batchId: z.coerce.number().int().optional(),
    resourceType: z.enum(['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE']).optional(),
    isDuplicate: z.coerce.boolean().optional()
  }).safeParse(req.query);

  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, status, batchId, resourceType, isDuplicate } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(batchId ? { batchId } : {}),
    ...(status ? { status } : {}),
    ...(resourceType ? { resourceType } : {}),
    ...(isDuplicate !== undefined ? { isDuplicate } : {}),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } }
      ]
    } : {})
  };

  const [list, total] = await Promise.all([
    prisma.resourceImportItem.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.resourceImportItem.count({ where })
  ]);

  const data: PageResult<typeof list[number]> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminResourcesRouter.put('/resource-imports/items/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const editSchema = z.object({
    name: z.string().trim().min(1),
    content: z.record(z.string(), z.any())
  });
  const parsed = editSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const existing = await prisma.resourceImportItem.findUnique({ where: { id } });
  if (!existing) throw new HttpError('导入项不存在', 404, 404);

  const isDuplicate = await checkDuplicate(existing.resourceType, parsed.data.name);

  const updated = await prisma.resourceImportItem.update({
    where: { id },
    data: {
      name: parsed.data.name,
      content: parsed.data.content,
      isDuplicate
    }
  });

  res.json(ok(updated));
});

adminResourcesRouter.patch('/resource-imports/items/:id/status', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const statusSchema = z.object({ status: z.enum(['PENDING', 'IMPORTED', 'FAILED', 'IGNORED']) });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const updated = await prisma.resourceImportItem.update({
    where: { id },
    data: { status: parsed.data.status }
  });

  res.json(ok(updated));
});

adminResourcesRouter.post('/resource-imports/items/batch-confirm', requireAdminAuth, async (req, res) => {
  const confirmSchema = z.object({
    itemIds: z.array(z.coerce.number().int().positive()).min(1)
  });
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const { itemIds } = parsed.data;

  const items = await prisma.resourceImportItem.findMany({
    where: { id: { in: itemIds } }
  });

  let successCount = 0;
  let failCount = 0;
  const affectedBatchIds = new Set<number>();

  for (const item of items) {
    if (item.status === 'IMPORTED' || item.status === 'IGNORED') {
      continue;
    }
    affectedBatchIds.add(item.batchId);
    try {
      if (item.resourceType === 'RECIPE') {
        await importRecipe(item.name, item.content);
      } else if (['INGREDIENT', 'FRUIT', 'SEASONING'].includes(item.resourceType)) {
        await importIngredient(item.resourceType, item.name, item.content);
      } else if (item.resourceType === 'BEVERAGE') {
        await importBeverage(item.name, item.content);
      }

      await prisma.resourceImportItem.update({
        where: { id: item.id },
        data: { status: 'IMPORTED', errorReason: null }
      });
      successCount++;
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await prisma.resourceImportItem.update({
        where: { id: item.id },
        data: { status: 'FAILED', errorReason: errMsg }
      });
      failCount++;
    }
  }

  for (const batchId of affectedBatchIds) {
    const allStagedItems = await prisma.resourceImportItem.findMany({
      where: { batchId }
    });
    const pendingCount = allStagedItems.filter((i: { status: string }) => i.status === 'PENDING').length;
    const batchSuccess = allStagedItems.filter((i: { status: string }) => i.status === 'IMPORTED').length;
    const batchFail = allStagedItems.filter((i: { status: string }) => i.status === 'FAILED').length;

    await prisma.resourceImportBatch.update({
      where: { id: batchId },
      data: {
        successCount: batchSuccess,
        failCount: batchFail,
        status: pendingCount === 0 ? 'COMPLETED' : 'PENDING'
      }
    });
  }

  res.json(ok({ successCount, failCount }));
});
