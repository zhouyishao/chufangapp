import { Router } from 'express';
import { z } from 'zod';

import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';
import { parseId, baseListQuerySchema } from './shared';
import { encryptSecret, maskSecret } from '../../services/resource-import/secret';
import { buildRequestSnapshot, findDuplicateTargetId } from '../../services/resource-import/importer';
import {
  evaluateResourcePayload,
  normalizeResourcePayload
} from '../../services/resource-import/validator';
import {
  fetchProviderPreview,
  buildProviderDraft,
  type ResourceApiProviderRuntime
} from '../../services/resource-import/provider-client';
import {
  resourceImportTypes,
  resourceProviderAuthTypes,
  resourceProviderMethods
} from '../../services/resource-import/types';

const jsonObject = z.record(z.string(), z.unknown());

const providerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  providerName: z.string().trim().min(1).max(120),
  resourceType: z.enum(resourceImportTypes),
  method: z.enum(resourceProviderMethods).default('GET'),
  endpointUrl: z.string().trim().url(),
  authType: z.enum(resourceProviderAuthTypes).default('NONE'),
  appKey: z.string().trim().max(255).nullable().optional(),
  secret: z.string().trim().max(255).nullable().optional(),
  defaultHeaders: jsonObject.nullable().optional(),
  defaultParams: jsonObject.nullable().optional(),
  dataPath: z.string().trim().min(1).max(120).default('data.list'),
  timeoutMs: z.coerce.number().int().min(1000).max(60000).default(10000),
  dailyLimit: z.coerce.number().int().min(1).max(1000000).default(10000),
  description: z.string().trim().nullable().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});

const testDraftSchema = providerSchema;

const syncSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  params: jsonObject.nullable().optional()
});

const formatZodError = (error: z.ZodError) => {
  const message = error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ');
  return new HttpError(`参数格式错误: ${message}`, 400, 400);
};

const serializeProvider = (provider: {
  id: number;
  name: string;
  providerName: string;
  resourceType: string;
  method: string;
  endpointUrl: string;
  authType: string;
  appKey: string | null;
  encryptedSecret: string | null;
  defaultHeaders: unknown;
  defaultParams: unknown;
  dataPath: string;
  timeoutMs: number;
  dailyLimit: number;
  description: string | null;
  status: 'ACTIVE' | 'DISABLED';
  lastSyncedAt: Date | null;
  lastTestedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { importBatches: number };
}) => ({
  ...provider,
  hasSecret: Boolean(provider.encryptedSecret),
  secretPreview: maskSecret(provider.encryptedSecret),
  encryptedSecret: undefined,
  lastSyncedAt: provider.lastSyncedAt ? provider.lastSyncedAt.toISOString() : null,
  lastTestedAt: provider.lastTestedAt ? provider.lastTestedAt.toISOString() : null,
  createdAt: provider.createdAt.toISOString(),
  updatedAt: provider.updatedAt.toISOString(),
  importBatchCount: provider._count?.importBatches ?? 0
});

const toRuntimeProvider = (provider: {
  id?: number;
  name: string;
  providerName: string;
  resourceType: string;
  method: string;
  endpointUrl: string;
  authType: string;
  appKey: string | null;
  encryptedSecret: string | null;
  defaultHeaders: unknown;
  defaultParams: unknown;
  dataPath: string;
  timeoutMs: number;
  dailyLimit: number;
  description: string | null;
  status: string;
  lastSyncedAt: Date | null;
  lastTestedAt: Date | null;
  lastError: string | null;
}): ResourceApiProviderRuntime => ({
  ...provider,
  defaultHeaders: provider.defaultHeaders && typeof provider.defaultHeaders === 'object' ? (provider.defaultHeaders as Record<string, unknown>) : null,
  defaultParams: provider.defaultParams && typeof provider.defaultParams === 'object' ? (provider.defaultParams as Record<string, unknown>) : null
});

const mapPreviewItems = async (resourceType: (typeof resourceImportTypes)[number], rows: Record<string, unknown>[]) => {
  const mapped = rows.slice(0, 3).map((row) => {
    const normalized = normalizeResourcePayload(resourceType, row);
    return evaluateResourcePayload(resourceType, normalized);
  });
  return mapped;
};

const listQuerySchema = baseListQuerySchema.extend({
  resourceType: z.enum(resourceImportTypes).optional()
});

export const adminResourceApiProvidersRouter = Router();

adminResourceApiProvidersRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw formatZodError(parsed.error);
  const { page, pageSize, q, status, resourceType } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(status ? { status } : {}),
    ...(resourceType ? { resourceType } : {}),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { providerName: { contains: q, mode: 'insensitive' as const } },
        { endpointUrl: { contains: q, mode: 'insensitive' as const } }
      ]
    } : {})
  };

  const [list, total] = await Promise.all([
    prisma.resourceApiProvider.findMany({
      where,
      include: { _count: { select: { importBatches: true } } },
      orderBy: [{ id: 'desc' }],
      skip,
      take: pageSize
    }),
    prisma.resourceApiProvider.count({ where })
  ]);

  res.json(ok({
    list: list.map(serializeProvider),
    total,
    page,
    pageSize
  } satisfies PageResult<ReturnType<typeof serializeProvider>>));
});

adminResourceApiProvidersRouter.get('/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const provider = await prisma.resourceApiProvider.findUnique({
    where: { id },
    include: { _count: { select: { importBatches: true } } }
  });
  if (!provider) throw new HttpError('资源提供方未找到', 404, 404);
  res.json(ok(serializeProvider(provider)));
});

adminResourceApiProvidersRouter.post('/', requireAdminAuth, async (req, res) => {
  const parsed = providerSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed.error);

  const existing = await prisma.resourceApiProvider.findFirst({
    where: { name: parsed.data.name, providerName: parsed.data.providerName }
  });
  if (existing) throw new HttpError('同名资源提供方已存在', 422, 422);

  const created = await prisma.resourceApiProvider.create({
    data: {
      name: parsed.data.name,
      providerName: parsed.data.providerName,
      resourceType: parsed.data.resourceType,
      method: parsed.data.method,
      endpointUrl: parsed.data.endpointUrl,
      authType: parsed.data.authType,
      appKey: parsed.data.appKey ?? null,
      encryptedSecret: parsed.data.secret ? encryptSecret(parsed.data.secret) : null,
      defaultHeaders: parsed.data.defaultHeaders ? (parsed.data.defaultHeaders as Prisma.InputJsonValue) : Prisma.DbNull,
      defaultParams: parsed.data.defaultParams ? (parsed.data.defaultParams as Prisma.InputJsonValue) : Prisma.DbNull,
      dataPath: parsed.data.dataPath,
      timeoutMs: parsed.data.timeoutMs,
      dailyLimit: parsed.data.dailyLimit,
      description: parsed.data.description ?? null,
      status: parsed.data.status
    }
  });

  res.json(ok({
    ...serializeProvider({
      ...created,
      lastSyncedAt: created.lastSyncedAt,
      lastTestedAt: created.lastTestedAt,
      lastError: created.lastError,
      _count: { importBatches: 0 }
    })
  }));
});

adminResourceApiProvidersRouter.put('/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const parsed = providerSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed.error);

  const existing = await prisma.resourceApiProvider.findUnique({ where: { id } });
  if (!existing) throw new HttpError('资源提供方未找到', 404, 404);

  if (existing.name !== parsed.data.name || existing.providerName !== parsed.data.providerName) {
    const duplicate = await prisma.resourceApiProvider.findFirst({
      where: {
        name: parsed.data.name,
        providerName: parsed.data.providerName,
        id: { not: id }
      }
    });
    if (duplicate) throw new HttpError('同名资源提供方已存在', 422, 422);
  }

  const updated = await prisma.resourceApiProvider.update({
    where: { id },
    data: {
      name: parsed.data.name,
      providerName: parsed.data.providerName,
      resourceType: parsed.data.resourceType,
      method: parsed.data.method,
      endpointUrl: parsed.data.endpointUrl,
      authType: parsed.data.authType,
      appKey: parsed.data.appKey ?? null,
      encryptedSecret: parsed.data.secret ? encryptSecret(parsed.data.secret) : existing.encryptedSecret,
      defaultHeaders: parsed.data.defaultHeaders ? (parsed.data.defaultHeaders as Prisma.InputJsonValue) : Prisma.DbNull,
      defaultParams: parsed.data.defaultParams ? (parsed.data.defaultParams as Prisma.InputJsonValue) : Prisma.DbNull,
      dataPath: parsed.data.dataPath,
      timeoutMs: parsed.data.timeoutMs,
      dailyLimit: parsed.data.dailyLimit,
      description: parsed.data.description ?? null,
      status: parsed.data.status
    },
    include: { _count: { select: { importBatches: true } } }
  });

  res.json(ok(serializeProvider(updated)));
});

adminResourceApiProvidersRouter.patch('/:id/status', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const schema = z.object({ status: z.enum(['ACTIVE', 'DISABLED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed.error);

  const updated = await prisma.resourceApiProvider.update({
    where: { id },
    data: { status: parsed.data.status },
    include: { _count: { select: { importBatches: true } } }
  });

  res.json(ok(serializeProvider(updated)));
});

adminResourceApiProvidersRouter.delete('/:id', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const provider = await prisma.resourceApiProvider.findUnique({
    where: { id },
    include: { _count: { select: { importBatches: true } } }
  });
  if (!provider) throw new HttpError('资源提供方未找到', 404, 404);
  if (provider._count.importBatches > 0) {
    throw new HttpError('该资源提供方下已有导入批次，不能删除', 422, 422);
  }

  const deleted = await prisma.resourceApiProvider.delete({ where: { id } });
  res.json(ok({
    ...serializeProvider({
      ...deleted,
      lastSyncedAt: deleted.lastSyncedAt,
      lastTestedAt: deleted.lastTestedAt,
      lastError: deleted.lastError,
      _count: { importBatches: 0 }
    })
  }));
});

adminResourceApiProvidersRouter.post('/test', requireAdminAuth, async (req, res) => {
  const parsed = testDraftSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed.error);

  const draft = buildProviderDraft({
    ...parsed.data,
    appKey: parsed.data.appKey ?? null,
    defaultHeaders: parsed.data.defaultHeaders ?? null,
    defaultParams: parsed.data.defaultParams ?? null,
    description: parsed.data.description ?? null,
    secret: parsed.data.secret ?? null
  });
  const preview = await fetchProviderPreview(
    toRuntimeProvider({
      ...draft,
      encryptedSecret: draft.secret ? encryptSecret(draft.secret) : null,
      lastSyncedAt: null,
      lastTestedAt: null,
      lastError: null
    }),
    3
  );

  const mappedPreview = await mapPreviewItems(draft.resourceType, preview.preview);
  res.json(ok({
    total: preview.total,
    preview: mappedPreview,
    requestUrl: preview.requestUrl,
    requestBody: preview.requestBody,
    headers: preview.headers
  }));
});

adminResourceApiProvidersRouter.post('/:id/test', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const provider = await prisma.resourceApiProvider.findUnique({ where: { id } });
  if (!provider) throw new HttpError('资源提供方未找到', 404, 404);

  const runtime = toRuntimeProvider(provider);
  const preview = await fetchProviderPreview(runtime, 3);
  const mappedPreview = await mapPreviewItems(provider.resourceType as (typeof resourceImportTypes)[number], preview.preview);

  await prisma.resourceApiProvider.update({
    where: { id },
    data: { lastTestedAt: new Date(), lastError: null }
  });

  res.json(ok({
    total: preview.total,
    preview: mappedPreview,
    requestUrl: preview.requestUrl,
    requestBody: preview.requestBody,
    headers: preview.headers
  }));
});

adminResourceApiProvidersRouter.post('/:id/sync', requireAdminAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const provider = await prisma.resourceApiProvider.findUnique({ where: { id } });
  if (!provider) throw new HttpError('资源提供方未找到', 404, 404);

  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) throw formatZodError(parsed.error);

  const runtime = toRuntimeProvider(provider);
  const preview = await fetchProviderPreview(runtime, parsed.data.limit, parsed.data.params ?? {});
  const resourceType = provider.resourceType as (typeof resourceImportTypes)[number];
  const seenKeys = new Set<string>();
  const rows = preview.rows.slice(0, parsed.data.limit);
  const batchName = `公共资源-${provider.providerName}-${new Date().toISOString().slice(0, 10)}`;

  const staged = await Promise.all(rows.map(async (row, index) => {
    const mapped = normalizeResourcePayload(resourceType, row);
    mapped.sourceName = provider.providerName;
    const evaluated = evaluateResourcePayload(resourceType, mapped);
    const duplicateTargetId = await findDuplicateTargetId(prisma, resourceType, mapped);
    const duplicateKey = `${resourceType}:${mapped.externalId?.trim() || mapped.name.trim().toLowerCase()}`;
    let status = evaluated.status;
    let errorMessage = evaluated.errorMessage;
    let filterCode = evaluated.filterCode;

    if (seenKeys.has(duplicateKey)) {
      status = 'FAILED';
      errorMessage = '数据重复: 同一批次中已存在相同资源';
      filterCode = mapped.externalId ? 'DUPLICATE_EXTERNAL_ID' : 'DUPLICATE_NAME';
    }

    if (duplicateTargetId) {
      status = 'FAILED';
      errorMessage = mapped.externalId
        ? '数据重复: 该外部资源在正式库中已存在'
        : '数据重复: 该资源在正式库中已存在';
      filterCode = mapped.externalId ? 'DUPLICATE_EXTERNAL_ID' : 'DUPLICATE_NAME';
    }

    if (status === 'PENDING') seenKeys.add(duplicateKey);

    return {
      rowIndex: index + 1,
      rawData: row,
      mappedData: mapped,
      status,
      errorMessage,
      externalId: evaluated.externalId,
      externalUrl: evaluated.externalUrl,
      filterCode,
      duplicateTargetId
    };
  }));

  const totalCount = staged.length;
  const failedCount = staged.filter((item) => item.status === 'FAILED').length;
  const successCount = staged.filter((item) => item.status === 'PENDING').length;

  const batch = await prisma.resourceImportBatch.create({
    data: {
      importType: resourceType,
      sourceType: 'API',
      fileName: batchName,
      status: 'PENDING',
      totalCount,
      successCount,
      failedCount,
      createdBy: req.admin?.username || 'admin',
      providerId: provider.id,
      sourceName: provider.providerName,
      requestSnapshot: {
        method: provider.method,
        endpointUrl: provider.endpointUrl,
        dataPath: provider.dataPath,
        params: parsed.data.params ? (parsed.data.params as Prisma.InputJsonValue) : {},
        sourceName: provider.providerName
      } as Prisma.InputJsonValue
    }
  });

  await prisma.resourceImportItem.createMany({
    data: staged.map((item) => ({
      importId: batch.id,
      rowIndex: item.rowIndex,
      rawData: item.rawData as Prisma.InputJsonValue,
      mappedData: item.mappedData as Prisma.InputJsonValue,
      status: item.status,
      errorMessage: item.errorMessage,
      externalId: item.externalId,
      externalUrl: item.externalUrl,
      filterCode: item.filterCode,
      duplicateTargetId: item.duplicateTargetId
    }))
  });

  await prisma.resourceApiProvider.update({
    where: { id: provider.id },
    data: {
      lastSyncedAt: new Date(),
      lastError: null
    }
  });

  res.json(ok({
    batch: {
      ...batch,
      createdAt: batch.createdAt.toISOString(),
      finishedAt: batch.finishedAt ? batch.finishedAt.toISOString() : null
    },
    summary: {
      total: totalCount,
      pending: successCount,
      failed: failedCount,
      imported: 0,
      ignored: 0
    },
    preview: staged.slice(0, 3)
  }));
});
