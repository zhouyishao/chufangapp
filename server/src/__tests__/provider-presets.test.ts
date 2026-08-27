import assert from 'node:assert/strict';
import test from 'node:test';

import type { PrismaClient } from '@prisma/client';

import { ensureDefaultResourceApiProviders } from '../services/resource-import/provider-presets';

test('preset refresh does not overwrite an existing provider configuration or credentials', async () => {
  const providerUpdates: Array<Record<string, unknown>> = [];
  const governanceUpdates: Array<Record<string, unknown>> = [];
  const existingTianApi = {
    id: 18,
    providerCode: 'tianapi_caipu',
    appKey: 'admin-managed-key',
    endpointUrl: 'https://admin.example/recipes',
    defaultHeaders: { 'X-Private-Partner': 'admin-header-secret' },
    defaultParams: { word: '家常菜' },
    status: 'DISABLED',
    lastError: '管理员正在排查限流',
    termsUrl: 'https://admin.example/terms',
    licenseNote: '管理员确认的授权说明'
  };
  const fakePrisma = {
    resourceApiProvider: {
      findUnique: async ({ where }: { where: { providerCode: string } }) =>
        where.providerCode === 'tianapi_caipu' ? existingTianApi : null,
      update: async (call: { data: Record<string, unknown> }) => {
        providerUpdates.push(call.data);
        return existingTianApi;
      },
      create: async () => ({}),
      updateMany: async (call: { data: Record<string, unknown> }) => {
        governanceUpdates.push(call.data);
        return { count: 0 };
      }
    }
  } as unknown as PrismaClient;
  const originalKey = process.env.TIANAPI_KEY;
  process.env.TIANAPI_KEY = 'environment-key-must-not-overwrite';

  try {
    await ensureDefaultResourceApiProviders(fakePrisma);
    delete process.env.TIANAPI_KEY;
    await ensureDefaultResourceApiProviders(fakePrisma);
  } finally {
    if (originalKey === undefined) delete process.env.TIANAPI_KEY;
    else process.env.TIANAPI_KEY = originalKey;
  }

  assert.deepEqual(providerUpdates, []);
  assert.equal(governanceUpdates.length, 2);
  assert.deepEqual(governanceUpdates[0], {
    status: 'DISABLED',
    lastError: '已退出中国菜谱主导入链路，历史数据仅供追溯'
  });
  assert.deepEqual(governanceUpdates[1], governanceUpdates[0]);
});
