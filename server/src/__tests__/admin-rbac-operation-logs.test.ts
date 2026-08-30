import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { serializeAdminOperationLog } from '../routes/admin/operation-logs';

test('operation log serialization exposes administrator identity and sanitized detail only', () => {
  const result = serializeAdminOperationLog({
    id: 1,
    adminId: 2,
    module: '管理员管理',
    action: '重置密码',
    method: 'PUT',
    path: '/admins/2/password',
    ip: '127.0.0.1',
    requestBody: { targetAdminId: 2, password: 'secret', nested: { token: 'jwt', passwordReset: true } },
    responseCode: 0,
    responseMessage: 'success',
    createdAt: new Date('2026-08-13T12:00:00.000Z'),
    admin: { id: 2, username: 'admin', nickname: '管理员' }
  });

  assert.deepEqual(result.detail, { targetAdminId: 2, nested: { passwordReset: true } });
  assert.deepEqual(result.admin, { id: 2, username: 'admin', nickname: '管理员' });
  assert.equal(JSON.stringify(result).includes('secret'), false);
});

test('operation log route is paginated, filtered, ordered, and read-only', async () => {
  const source = await readFile(path.resolve(process.cwd(), 'src/routes/admin/operation-logs.ts'), 'utf8');
  assert.match(source, /pageSize/);
  assert.match(source, /startDate/);
  assert.match(source, /endDate/);
  assert.match(source, /orderBy:\s*\[?\{\s*createdAt:\s*'desc'/);
  assert.match(source, /adminOperationLogsRouter\.get\('\/'/);
  assert.doesNotMatch(source, /adminOperationLogsRouter\.(post|put|patch|delete)/);
});
