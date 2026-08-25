import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { baseListQuerySchema, parseId } from './shared';
import { createBusinessId, nextCodeFromItems } from '../../lib/business-id';
import { createOfficialRecord } from '../../services/resource-import/importer';
import { normalizeResourcePayload } from '../../services/resource-import/validator';
import type { ResourceImportType } from '../../services/resource-import/types';
import {
  evaluateStagedResourceCandidate,
  getRecipeImportAdmissionFailure
} from '../../services/resource-import/governed-staging';

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

function mapRowData(importType: string, raw: any) {
  return normalizeResourcePayload(importType as ResourceImportType, raw);
}

// 1. POST /resource-imports/preview
adminResourcesRouter.post('/resource-imports/preview', requireAdminAuth, async (req, res) => {
  const previewSchema = z.object({
    importType: z.enum(['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE']),
    sourceType: z.string().trim().min(1),
    items: z.array(z.object({
      rowIndex: z.number().int().nonnegative(),
      rawData: z.record(z.string(), z.any())
    })).min(1)
  });

  const parsed = previewSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const { importType, sourceType, items } = parsed.data;

  const previewedItems = await Promise.all(items.map(async (item) => {
    const raw = item.rawData;
    const resourceType = importType as ResourceImportType;
    const mapped = mapRowData(resourceType, raw);
    const candidate = await evaluateStagedResourceCandidate(prisma, resourceType, mapped);
    const { duplicateKey: _duplicateKey, canApplyBatchDuplicate: _canApplyBatchDuplicate, ...stagedCandidate } = candidate;

    return {
      rowIndex: item.rowIndex,
      rawData: raw,
      ...stagedCandidate
    };
  }));

  res.json(ok(previewedItems));
});

// 2. POST /resource-imports/upload
adminResourcesRouter.post('/resource-imports/upload', requireAdminAuth, async (req, res) => {
  const uploadSchema = z.object({
    importType: z.enum(['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE']),
    sourceType: z.string().trim().min(1),
    fileName: z.string().trim().min(1),
    items: z.array(z.object({
      rowIndex: z.number().int().nonnegative(),
      rawData: z.record(z.string(), z.any())
    })).min(1)
  });

  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const { importType, sourceType, fileName, items } = parsed.data;
  const username = req.admin?.username || 'admin';

  const stagedItemsData = await Promise.all(items.map(async (item) => {
    const raw = item.rawData;
    const resourceType = importType as ResourceImportType;
    const mapped = mapRowData(resourceType, raw);
    const candidate = await evaluateStagedResourceCandidate(prisma, resourceType, mapped);
    const { duplicateKey: _duplicateKey, canApplyBatchDuplicate: _canApplyBatchDuplicate, ...stagedCandidate } = candidate;

    return {
      rowIndex: item.rowIndex,
      rawData: raw,
      ...stagedCandidate
    };
  }));

  const failedCount = stagedItemsData.filter(i => i.status === 'FAILED').length;

  const batch = await prisma.resourceImportBatch.create({
    data: {
      importType,
      sourceType,
      fileName,
      status: 'PENDING',
      totalCount: items.length,
      successCount: 0,
      failedCount,
      createdBy: username
    }
  });

  const createdItems = await Promise.all(stagedItemsData.map((item) => {
    return prisma.resourceImportItem.create({
      data: {
        importId: batch.id,
        rowIndex: item.rowIndex,
        rawData: item.rawData as Prisma.InputJsonValue,
        mappedData: item.mappedData as Prisma.InputJsonValue,
        status: item.status,
        errorMessage: item.errorMessage,
        externalId: item.externalId,
        externalUrl: item.externalUrl,
        filterCode: item.filterCode,
        duplicateTargetId: item.duplicateTargetId,
        qualityScore: item.qualityScore,
        isChinese: item.isChinese,
        qualityIssues: item.qualityIssues
          ? (item.qualityIssues as Prisma.InputJsonValue)
          : Prisma.DbNull
      }
    });
  }));

  res.json(ok({ batch, items: createdItems }));
});

const batchListQuerySchema = baseListQuerySchema.extend({
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  sourceType: z.enum(['API', 'JSON', 'XLSX', 'CSV']).optional(),
  providerId: z.coerce.number().int().optional()
});

const importItemListQuerySchema = baseListQuerySchema.extend({
  status: z.enum(['PENDING', 'IMPORTED', 'FAILED', 'IGNORED']).optional(),
  providerId: z.coerce.number().int().optional(),
  resourceType: z.enum(['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE']).optional(),
  categoryName: z.string().trim().min(1).max(80).optional(),
  isChinese: z.preprocess(
    (value) => value === 'true' || value === true ? true : value === 'false' || value === false ? false : value,
    z.boolean()
  ).optional(),
  minQuality: z.coerce.number().int().min(0).max(100).optional(),
  maxQuality: z.coerce.number().int().min(0).max(100).optional()
}).superRefine((value, context) => {
  const { minQuality, maxQuality } = value;
  if (minQuality !== undefined && maxQuality !== undefined && minQuality > maxQuality) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['minQuality'],
      message: 'minQuality 不能大于 maxQuality'
    });
  }
});

const bulkIgnoreRecipeImportsSchema = z.object({
  itemIds: z.array(z.coerce.number().int().positive()).min(1).max(500),
  reason: z.string().trim().min(2).max(200)
});

const writeResourceImportOperationLog = async (
  tx: Prisma.TransactionClient,
  input: { adminId: number | null; method: string; path: string; itemIds: number[]; reason: string }
) => {
  await tx.operationLog.create({
    data: {
      adminId: input.adminId,
      module: 'resource',
      action: 'bulk_ignore_recipe_imports',
      method: input.method,
      path: input.path,
      requestBody: {
        detail: { itemIds: input.itemIds, reason: input.reason }
      } as Prisma.InputJsonValue
    }
  });
};

const refreshImportBatchStats = async (tx: Prisma.TransactionClient, importIds: number[]) => {
  const batches = await tx.resourceImportBatch.findMany({
    where: { id: { in: importIds } },
    include: { items: { select: { status: true } } }
  });

  await Promise.all(batches.map(async (batch) => {
    const successCount = batch.items.filter((item) => item.status === 'IMPORTED').length;
    const failedCount = batch.items.filter((item) => item.status === 'FAILED').length;
    const pendingCount = batch.items.filter((item) => item.status === 'PENDING').length;
    await tx.resourceImportBatch.update({
      where: { id: batch.id },
      data: {
        successCount,
        failedCount,
        status: pendingCount === 0 ? 'COMPLETED' : 'PENDING',
        finishedAt: pendingCount === 0 ? new Date() : null
      }
    });
  }));
};

// 3. GET /resource-imports/batches/stats
adminResourcesRouter.get('/resource-imports/batches/stats', requireAdminAuth, async (req, res) => {
  const [total, pending, completed, failed] = await Promise.all([
    prisma.resourceImportBatch.count(),
    prisma.resourceImportBatch.count({ where: { status: 'PENDING' } }),
    prisma.resourceImportBatch.count({ where: { status: 'COMPLETED' } }),
    prisma.resourceImportBatch.count({ where: { status: 'FAILED' } })
  ]);
  res.json(ok({ total, pending, completed, failed }));
});

// 4. GET /resource-imports
adminResourcesRouter.get('/resource-imports', requireAdminAuth, async (req, res) => {
  const parsed = batchListQuerySchema.extend({
    importType: z.enum(['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE']).optional()
  }).safeParse(req.query);
  if (!parsed.success) throw formatZodError(parsed);
  const { page, pageSize, q, status, importType, providerId, sourceType } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(status ? { status } : {}),
    ...(importType ? { importType } : {}),
    ...(providerId ? { providerId } : {}),
    ...(sourceType ? { sourceType } : {}),
    ...(q ? {
      OR: [
        { fileName: { contains: q, mode: 'insensitive' as const } },
        { createdBy: { contains: q, mode: 'insensitive' as const } },
        { sourceName: { contains: q, mode: 'insensitive' as const } }
      ]
    } : {})
  };

  const list = (await prisma.resourceImportBatch.findMany({
    where,
    include: { provider: { select: { id: true, name: true, providerName: true } } },
    orderBy: { id: 'desc' },
    skip,
    take: pageSize
  } as any)) as any[];
  const total = await prisma.resourceImportBatch.count({ where });

  const data: PageResult<any> = {
    list: list.map((item) => ({
      ...item,
      providerName: item.provider?.providerName ?? null,
      provider: item.provider
        ? { id: item.provider.id, name: item.provider.name, providerName: item.provider.providerName }
        : null,
      createdAt: item.createdAt.toISOString(),
      finishedAt: item.finishedAt ? item.finishedAt.toISOString() : null
    })),
    total,
    page,
    pageSize
  };
  res.json(ok(data));
});

// 5. GET /resource-imports/items
adminResourcesRouter.get('/resource-imports/items', requireAdminAuth, async (req, res) => {
  const parsed = importItemListQuerySchema.extend({
    batchId: z.coerce.number().int().optional(),
    importId: z.coerce.number().int().optional()
  }).safeParse(req.query);

  if (!parsed.success) throw formatZodError(parsed);
  const {
    page,
    pageSize,
    q,
    status,
    batchId,
    importId,
    providerId,
    resourceType,
    categoryName,
    isChinese,
    minQuality,
    maxQuality
  } = parsed.data;
  const skip = (page - 1) * pageSize;

  const targetImportId = importId || batchId;
  const batchWhere = {
    ...(providerId ? { providerId } : {}),
    ...(resourceType ? { importType: resourceType } : {})
  };

  const where = {
    ...(targetImportId ? { importId: targetImportId } : {}),
    ...(status ? { status } : {}),
    ...(Object.keys(batchWhere).length > 0 ? { batch: { is: batchWhere } } : {}),
    ...(categoryName ? { mappedData: { path: ['categoryName'], string_contains: categoryName } } : {}),
    ...(typeof isChinese === 'boolean' ? { isChinese } : {}),
    ...(minQuality !== undefined || maxQuality !== undefined
      ? {
          qualityScore: {
            ...(minQuality !== undefined ? { gte: minQuality } : {}),
            ...(maxQuality !== undefined ? { lte: maxQuality } : {})
          }
        }
      : {}),
    ...(q ? {
      OR: [
        { mappedData: { path: ['name'], string_contains: q } },
        { mappedData: { path: ['categoryName'], string_contains: q } }
      ]
    } : {})
  };

  const items = (await prisma.resourceImportItem.findMany({
    where,
    include: { batch: { select: { importType: true, providerId: true, sourceName: true, provider: { select: { providerName: true } } } } },
    orderBy: { id: 'desc' },
    skip,
    take: pageSize
  } as any)) as any[];
  const total = await prisma.resourceImportItem.count({ where });

  const list = items.map(item => ({
    id: item.id,
    importId: item.importId,
    importType: item.batch.importType,
    providerId: item.batch.providerId,
    providerName: item.batch.provider?.providerName ?? null,
    rowIndex: item.rowIndex,
    rawData: item.rawData,
    mappedData: item.mappedData,
    status: item.status,
    errorMessage: item.errorMessage,
    targetId: item.targetId,
    externalId: item.externalId,
    externalUrl: item.externalUrl,
    filterCode: item.filterCode,
    duplicateTargetId: item.duplicateTargetId,
    qualityScore: item.qualityScore,
    isChinese: item.isChinese,
    qualityIssues: item.qualityIssues,
    createdAt: item.createdAt.toISOString()
  }));

  const data: PageResult<any> = { list, total, page, pageSize };
  res.json(ok(data));
});

adminResourcesRouter.post('/resource-imports/items/bulk-ignore', requireAdminAuth, async (req, res) => {
  const parsed = bulkIgnoreRecipeImportsSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const uniqueItemIds = [...new Set(parsed.data.itemIds)];
  const adminId = Number.parseInt(req.admin?.sub ?? '', 10);
  const updatedCount = await prisma.$transaction(async (tx) => {
    const eligibleItems = await tx.resourceImportItem.findMany({
      where: {
        id: { in: uniqueItemIds },
        status: { in: ['PENDING', 'FAILED'] },
        batch: { is: { importType: 'RECIPE' } }
      },
      select: { id: true, importId: true }
    });
    if (eligibleItems.length !== uniqueItemIds.length) {
      throw new HttpError('只能批量忽略待处理或失败的菜谱资源', 409, 409);
    }

    const updated = await tx.resourceImportItem.updateMany({
      where: {
        id: { in: uniqueItemIds },
        status: { in: ['PENDING', 'FAILED'] },
        batch: { is: { importType: 'RECIPE' } }
      },
      data: { status: 'IGNORED', errorMessage: parsed.data.reason, filterCode: 'MANUAL_IGNORE' }
    });
    if (updated.count !== uniqueItemIds.length) {
      throw new HttpError('菜谱资源状态已变化，请刷新后重试', 409, 409);
    }
    await refreshImportBatchStats(tx, [...new Set(eligibleItems.map((item) => item.importId))]);
    await writeResourceImportOperationLog(tx, {
      adminId: Number.isFinite(adminId) ? adminId : null,
      method: req.method,
      path: req.originalUrl,
      itemIds: uniqueItemIds,
      reason: parsed.data.reason
    });
    return updated.count;
  });

  res.json(ok({ updatedCount }));
});

adminResourcesRouter.get('/resource-imports/categories', requireAdminAuth, async (req, res) => {
  const parsed = z.object({
    batchId: z.coerce.number().int().optional(),
    importId: z.coerce.number().int().optional(),
    providerId: z.coerce.number().int().optional(),
    resourceType: z.enum(['RECIPE', 'INGREDIENT', 'FRUIT', 'SEASONING', 'BEVERAGE']).optional(),
    q: z.string().trim().min(1).max(80).optional()
  }).safeParse(req.query);

  if (!parsed.success) throw formatZodError(parsed);
  const { batchId, importId, providerId, resourceType, q } = parsed.data;
  const targetImportId = importId || batchId;

  const batchWhere = {
    ...(providerId ? { providerId } : {}),
    ...(resourceType ? { importType: resourceType } : {})
  };

  const where = {
    ...(targetImportId ? { importId: targetImportId } : {}),
    ...(Object.keys(batchWhere).length > 0 ? { batch: { is: batchWhere } } : {}),
    ...(q ? { mappedData: { path: ['categoryName'], string_contains: q } } : {})
  };

  const rows = (await prisma.resourceImportItem.findMany({
    where,
    select: { mappedData: true },
    take: 500
  } as any)) as Array<{ mappedData: Record<string, unknown> | null }>;

  const list = Array.from(
    new Set(
      rows
        .map((row) => {
          const mappedData = row.mappedData ?? {};
          return typeof mappedData.categoryName === 'string' ? mappedData.categoryName.trim() : '';
        })
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  res.json(ok({ list }));
});

// 6. GET /resource-imports/:id
adminResourcesRouter.get('/resource-imports/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const batch = await prisma.resourceImportBatch.findUnique({
    where: { id },
    include: { provider: { select: { id: true, name: true, providerName: true } }, items: { orderBy: { rowIndex: 'asc' } } }
  } as any) as any;
  if (!batch) throw new HttpError('导入记录不存在', 404, 404);
  
  const items = batch.items.map((item: any) => ({
    id: item.id,
    importId: item.importId,
    importType: batch.importType,
    providerId: batch.providerId,
    providerName: batch.provider?.providerName ?? null,
    rowIndex: item.rowIndex,
    rawData: item.rawData,
    mappedData: item.mappedData,
    status: item.status,
    errorMessage: item.errorMessage,
    targetId: item.targetId,
    externalId: item.externalId,
    externalUrl: item.externalUrl,
    filterCode: item.filterCode,
    duplicateTargetId: item.duplicateTargetId,
    qualityScore: item.qualityScore,
    isChinese: item.isChinese,
    qualityIssues: item.qualityIssues,
    createdAt: item.createdAt.toISOString()
  }));

  res.json(ok({
    ...batch,
    providerName: batch.provider?.providerName ?? null,
    provider: batch.provider
      ? { id: batch.provider.id, name: batch.provider.name, providerName: batch.provider.providerName }
      : null,
    createdAt: batch.createdAt.toISOString(),
    finishedAt: batch.finishedAt ? batch.finishedAt.toISOString() : null,
    items
  }));
});

// 7. PUT /resource-imports/items/:id
adminResourcesRouter.put('/resource-imports/items/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const editSchema = z.object({
    name: z.string().trim().min(1),
    content: z.record(z.string(), z.any())
  });
  const parsed = editSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const existing = await prisma.resourceImportItem.findUnique({
    where: { id },
    include: { batch: true }
  });
  if (!existing) throw new HttpError('导入项不存在', 404, 404);

  const raw = { ...existing.rawData as Record<string, any>, name: parsed.data.name, ...parsed.data.content };
  const resourceType = existing.batch.importType as ResourceImportType;
  const mapped = mapRowData(resourceType, raw);
  if (resourceType === 'RECIPE') mapped.sourceName = existing.batch.sourceName ?? mapped.sourceName;
  const candidate = await evaluateStagedResourceCandidate(prisma, resourceType, mapped);

  const updated = await prisma.resourceImportItem.update({
    where: { id },
      data: {
      rawData: raw as Prisma.InputJsonValue,
      mappedData: candidate.mappedData as Prisma.InputJsonValue,
      status: candidate.status,
      errorMessage: candidate.errorMessage,
      externalId: candidate.externalId,
      externalUrl: candidate.externalUrl,
      filterCode: candidate.filterCode,
      duplicateTargetId: candidate.duplicateTargetId,
      qualityScore: candidate.qualityScore,
      isChinese: candidate.isChinese,
      qualityIssues: candidate.qualityIssues
        ? (candidate.qualityIssues as Prisma.InputJsonValue)
        : Prisma.DbNull
    }
  });

  const allBatchItems = await prisma.resourceImportItem.findMany({
    where: { importId: existing.importId }
  });
  const failedCount = allBatchItems.filter(i => i.status === 'FAILED').length;
  await prisma.resourceImportBatch.update({
    where: { id: existing.importId },
    data: { failedCount }
  });

  res.json(ok(updated));
});

// 8. PATCH /resource-imports/items/:id/status
adminResourcesRouter.patch('/resource-imports/items/:id/status', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const statusSchema = z.object({ status: z.enum(['PENDING', 'IMPORTED', 'FAILED', 'IGNORED']) });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const existing = await prisma.resourceImportItem.findUnique({ where: { id } });
  if (!existing) throw new HttpError('导入项不存在', 404, 404);

  const updated = await prisma.resourceImportItem.update({
    where: { id },
    data: { status: parsed.data.status }
  });

  const allBatchItems = await prisma.resourceImportItem.findMany({
    where: { importId: existing.importId }
  });
  const failedCount = allBatchItems.filter(i => i.status === 'FAILED').length;
  const successCount = allBatchItems.filter(i => i.status === 'IMPORTED').length;
  const pendingCount = allBatchItems.filter(i => i.status === 'PENDING').length;

  await prisma.resourceImportBatch.update({
    where: { id: existing.importId },
    data: {
      successCount,
      failedCount,
      status: pendingCount === 0 ? 'COMPLETED' : 'PENDING'
    }
  });

  res.json(ok(updated));
});

// 9. POST /resource-imports/confirm
adminResourcesRouter.post('/resource-imports/confirm', requireAdminAuth, async (req, res) => {
  const confirmSchema = z.object({
    importId: z.coerce.number().int().positive(),
    itemIds: z.array(z.coerce.number().int().positive()).optional()
  });
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed);

  const { importId, itemIds } = parsed.data;
  const targetItemIds = itemIds ? [...new Set(itemIds)] : null;
  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.resourceImportBatch.findUnique({
      where: { id: importId },
      include: { provider: true }
    } as any) as any;
    if (!batch) throw new HttpError('导入批次不存在', 404, 404);

    const pendingItems = await tx.resourceImportItem.findMany({
      where: {
        importId,
        status: 'PENDING',
        ...(targetItemIds ? { id: { in: targetItemIds } } : {})
      }
    });
    const requestedItemIds = targetItemIds ?? pendingItems.map((item) => item.id);
    if (requestedItemIds.length === 0 || pendingItems.length !== requestedItemIds.length) {
      throw new HttpError('只能确认校验通过且状态为待导入的资源', 409, 409);
    }

    const claimed = await tx.resourceImportItem.updateMany({
      where: { id: { in: requestedItemIds }, importId, status: 'PENDING' },
      data: { status: 'PROCESSING' }
    });
    if (claimed.count !== requestedItemIds.length) {
      throw new HttpError('资源状态已变化，请刷新后重试', 409, 409);
    }

    const items = await tx.resourceImportItem.findMany({
      where: { id: { in: requestedItemIds }, importId, status: 'PROCESSING' }
    });
    if (items.length !== requestedItemIds.length) {
      throw new HttpError('资源状态已变化，请刷新后重试', 409, 409);
    }

    let successCount = 0;
    let failCount = 0;
    for (const item of items) {
      try {
        const mapped = item.mappedData as Record<string, any>;
        if (!String(mapped.name ?? '').trim()) throw new Error('必填项缺失: 名称为空');
        const resourceType = batch.importType as ResourceImportType;
        const candidate = resourceType === 'RECIPE'
          ? await evaluateStagedResourceCandidate(tx, resourceType, mapped as any)
          : null;
        const admissionFailure = candidate ? getRecipeImportAdmissionFailure(candidate) : null;
        if (admissionFailure) {
          await tx.resourceImportItem.update({
            where: { id: item.id },
            data: {
              mappedData: candidate!.mappedData as Prisma.InputJsonValue,
              status: 'FAILED',
              errorMessage: admissionFailure,
              externalId: candidate!.externalId,
              externalUrl: candidate!.externalUrl,
              filterCode: candidate!.filterCode,
              duplicateTargetId: candidate!.duplicateTargetId,
              qualityScore: candidate!.qualityScore,
              isChinese: candidate!.isChinese,
              qualityIssues: candidate!.qualityIssues
                ? (candidate!.qualityIssues as Prisma.InputJsonValue)
                : Prisma.DbNull
            }
          });
          failCount++;
          continue;
        }
        const governedMapped = candidate?.mappedData ?? mapped;
        const targetId = await createOfficialRecord(
          tx,
          resourceType,
          governedMapped as any,
          item.id,
          batch.provider?.providerName ?? batch.sourceName ?? null,
          (governedMapped.externalUrl as string | undefined) ?? null
        );
        await tx.resourceImportItem.update({
          where: { id: item.id },
          data: { status: 'IMPORTED', errorMessage: null, targetId }
        });
        successCount++;
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        await tx.resourceImportItem.update({
          where: { id: item.id },
          data: { status: 'FAILED', errorMessage }
        });
        failCount++;
      }
    }

    await refreshImportBatchStats(tx, [importId]);
    const updatedBatch = await tx.resourceImportBatch.findUnique({ where: { id: importId } });
    return { successCount, failCount, batch: updatedBatch };
  });

  res.json(ok(result));
});

// 10. POST /resource-imports/:id/retry-failed
adminResourcesRouter.post('/resource-imports/:id/retry-failed', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.resourceImportBatch.findUnique({
      where: { id },
      include: { provider: true }
    } as any) as any;
    if (!batch) throw new HttpError('导入批次不存在', 404, 404);

    const failedItems = await tx.resourceImportItem.findMany({
      where: { importId: id, status: 'FAILED' },
      select: { id: true }
    });
    const failedItemIds = failedItems.map((item) => item.id);
    if (failedItemIds.length === 0) {
      await refreshImportBatchStats(tx, [id]);
      return { successCount: 0, failCount: 0, batch: await tx.resourceImportBatch.findUnique({ where: { id } }) };
    }

    const claimed = await tx.resourceImportItem.updateMany({
      where: { id: { in: failedItemIds }, importId: id, status: 'FAILED' },
      data: { status: 'PROCESSING' }
    });
    if (claimed.count !== failedItemIds.length) {
      throw new HttpError('资源状态已变化，请刷新后重试', 409, 409);
    }

    const items = await tx.resourceImportItem.findMany({
      where: { id: { in: failedItemIds }, importId: id, status: 'PROCESSING' }
    });
    if (items.length !== failedItemIds.length) {
      throw new HttpError('资源状态已变化，请刷新后重试', 409, 409);
    }

    const resourceType = batch.importType as ResourceImportType;
    let successCount = 0;
    let failCount = 0;
    for (const item of items) {
      try {
        const mapped = item.mappedData as Record<string, any>;
        if (!String(mapped.name ?? '').trim()) throw new Error('必填项缺失: 名称为空');
        const candidate = resourceType === 'RECIPE'
          ? await evaluateStagedResourceCandidate(tx, resourceType, mapped as any)
          : null;
        const admissionFailure = candidate ? getRecipeImportAdmissionFailure(candidate) : null;
        if (admissionFailure) {
          await tx.resourceImportItem.update({
            where: { id: item.id },
            data: {
              mappedData: candidate!.mappedData as Prisma.InputJsonValue,
              status: 'FAILED',
              errorMessage: admissionFailure,
              externalId: candidate!.externalId,
              externalUrl: candidate!.externalUrl,
              filterCode: candidate!.filterCode,
              duplicateTargetId: candidate!.duplicateTargetId,
              qualityScore: candidate!.qualityScore,
              isChinese: candidate!.isChinese,
              qualityIssues: candidate!.qualityIssues
                ? (candidate!.qualityIssues as Prisma.InputJsonValue)
                : Prisma.DbNull
            }
          });
          failCount++;
          continue;
        }
        const governedMapped = candidate?.mappedData ?? mapped;
        const targetId = await createOfficialRecord(
          tx,
          resourceType,
          governedMapped as any,
          item.id,
          batch.provider?.providerName ?? batch.sourceName ?? null,
          (governedMapped.externalUrl as string | undefined) ?? null
        );
        await tx.resourceImportItem.update({
          where: { id: item.id },
          data: { status: 'IMPORTED', errorMessage: null, targetId }
        });
        successCount++;
      } catch (err: any) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await tx.resourceImportItem.update({
          where: { id: item.id },
          data: { status: 'FAILED', errorMessage: errMsg }
        });
        failCount++;
      }
    }

    await refreshImportBatchStats(tx, [id]);
    return {
      successCount,
      failCount,
      batch: await tx.resourceImportBatch.findUnique({ where: { id } })
    };
  });

  res.json(ok(result));
});
