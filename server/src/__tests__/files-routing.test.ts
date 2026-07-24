import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { createApp } from '../app';
import {
  buildFileReadWhere,
  buildStoredFileSha256,
  createOrLoadUploadedFile,
  loadKnownUploadedFile,
  prepareFileRemoval,
  lockFileForMutation
} from '../services/file-mutation';
import { readUploadedMedia } from '../routes/admin/upload';

test('file upload, query and deletion require authentication', async () => {
  const server = createApp().listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    for (const [method, path] of [['POST', '/api/files'], ['GET', '/api/files/1'], ['DELETE', '/api/files/1']] as const) {
      const response: globalThis.Response = await fetch(`http://127.0.0.1:${address.port}${path}`, { method });
      assert.equal(response.status, 401, `${method} ${path} should require App JWT`);
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('admin file inventory requires administrator authentication', async () => {
  const server = createApp().listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const response: globalThis.Response = await fetch(`http://127.0.0.1:${address.port}/api/admin/files`);
    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('App A/B 只能读取自己的文件，管理员读取条件不限制 uploaderId', async () => {
  assert.deepEqual(buildFileReadWhere(8, 1), { id: 8, deletedAt: null, status: 'ACTIVE', uploaderId: 1 });
  assert.deepEqual(buildFileReadWhere(8, 2), { id: 8, deletedAt: null, status: 'ACTIVE', uploaderId: 2 });
  assert.deepEqual(buildFileReadWhere(8), { id: 8, deletedAt: null, status: 'ACTIVE' });

  const source = await readFile(join(process.cwd(), 'src/routes/files.ts'), 'utf8');
  assert.match(source, /buildFileReadWhere\(idParam\(req\.params\.id\), req\.appUser\?\.id\)/);
});

test('App 文件 SHA 按用户隔离，同一用户稳定复用且管理员保持原始 SHA', () => {
  const rawSha256 = 'a'.repeat(64);

  assert.equal(buildStoredFileSha256(rawSha256), rawSha256);
  assert.equal(buildStoredFileSha256(rawSha256, 12), buildStoredFileSha256(rawSha256, 12));
  assert.notEqual(buildStoredFileSha256(rawSha256, 12), rawSha256);
  assert.notEqual(buildStoredFileSha256(rawSha256, 12), buildStoredFileSha256(rawSha256, 13));
  assert.match(buildStoredFileSha256(rawSha256, 12), /^[a-f0-9]{64}$/);
});

test('文件变更使用按 fileId 统一的 PostgreSQL 事务级互斥锁', async () => {
  const calls: Array<{ query: string; values: unknown[] }> = [];
  await lockFileForMutation({
    $executeRawUnsafe: async (query: string, ...values: unknown[]) => {
      calls.push({ query, values });
      return 1;
    }
  }, 42);

  assert.deepEqual(calls, [{
    query: 'SELECT pg_advisory_xact_lock($1, $2)',
    values: [727001, 42]
  }]);
});

test('上传使用用户范围 SHA，删除在事务内锁定并提交后才物理删除', async () => {
  const source = await readFile(join(process.cwd(), 'src/routes/files.ts'), 'utf8');

  assert.match(source, /buildStoredFileSha256\(media\.sha256,\s*req\.appUser\?\.id\)/);
  assert.match(source, /prisma\.\$transaction\(async \(transaction\) =>/);
  assert.match(source, /await lockFileForMutation\(transaction, id\)/);
  assert.match(source, /transaction\.file\.findFirst/);
  assert.match(source, /transaction\.file\.update/);

  const transactionEnd = source.indexOf('});', source.indexOf('prisma.$transaction(async (transaction) =>'));
  const physicalDelete = source.indexOf('fs.unlink', transactionEnd);
  assert.ok(transactionEnd > 0 && physicalDelete > transactionEnd);
});

test('并发上传命中 SHA 唯一冲突时返回已有记录并清理本次临时文件', async () => {
  const existing = { id: 7, url: '/uploads/existing.webp' };
  let loadCount = 0;
  let cleanupCount = 0;

  const result = await createOrLoadUploadedFile({
    load: async () => {
      loadCount += 1;
      return loadCount === 1 ? null : existing;
    },
    create: async () => {
      throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    },
    cleanup: async () => {
      cleanupCount += 1;
    },
    isCurrentUpload: (record) => record.url === '/uploads/current.webp'
  });

  assert.deepEqual(result, { record: existing, created: false });
  assert.equal(loadCount, 2);
  assert.equal(cleanupCount, 1);
});

test('ACTIVE SHA 复用必须在 fileId 锁内重读当前状态', async () => {
  const events: string[] = [];
  const record = await loadKnownUploadedFile({
    runExclusive: async (operation) => {
      events.push('lock');
      return operation(undefined);
    },
    load: async () => {
      events.push('load');
      return { id: 18, deletedAt: null, status: 'ACTIVE' as const };
    }
  });

  assert.deepEqual(record, { id: 18, deletedAt: null, status: 'ACTIVE' });
  assert.deepEqual(events, ['lock', 'load']);

  const source = await readFile(join(process.cwd(), 'src/routes/files.ts'), 'utf8');
  assert.match(source, /loadKnownUploadedFile/);
  assert.match(source, /await lockFileForMutation\(transaction,\s*knownFile!?\.id\)/);
});

test('DISABLED 且未软删文件在锁内重读后不得作为上传复用结果', async () => {
  const record = await loadKnownUploadedFile({
    runExclusive: async (operation) => operation(undefined),
    load: async () => ({ id: 20, deletedAt: null, status: 'DISABLED' as const })
  });
  assert.equal(record, null);

  const source = await readFile(join(process.cwd(), 'src/routes/files.ts'), 'utf8');
  assert.match(source, /status:\s*'ACTIVE'/);
  assert.match(source, /where:\s*\{\s*sha256:\s*storedSha256,\s*deletedAt:\s*null,\s*status:\s*'ACTIVE'/);
});

test('已软删除文件再次 DELETE 只重试物理删除，不重复更新业务状态', async () => {
  let updateCount = 0;
  const deletedAt = new Date('2026-07-24T00:00:00.000Z');
  const result = await prepareFileRemoval({
    runExclusive: async (operation) => operation(undefined),
    load: async () => ({
      id: 19,
      uploaderId: 1,
      deletedAt,
      referenceCount: 0,
      storageKind: 'LOCAL',
      path: 'uploads/retry.webp'
    }),
    softDelete: async () => {
      updateCount += 1;
    },
    appUserId: 1
  });

  assert.equal(result.deletedAt, deletedAt);
  assert.equal(updateCount, 0);

  const source = await readFile(join(process.cwd(), 'src/routes/files.ts'), 'utf8');
  assert.match(source, /status:\s*'DISABLED'[\s,}]+sha256:\s*null/);
});

test('头像上传在 multipart 读取阶段使用约 6MB 上限', async () => {
  const oversized = Buffer.alloc(6 * 1024 * 1024 + 1);
  const request = Object.assign(
    (await import('node:stream')).Readable.from([oversized]),
    { header: () => 'multipart/form-data; boundary=test-boundary' }
  );

  await assert.rejects(
    readUploadedMedia(request as never, 'image', { maxBodySize: 6 * 1024 * 1024 }),
    (error: Error & { status?: number }) => error.status === 400
  );

  const source = await readFile(join(process.cwd(), 'src/routes/files.ts'), 'utf8');
  assert.match(source, /purpose === 'content'[\s\S]*readUploadedMedia/);
  assert.match(source, /avatarMultipartLimit/);
});
