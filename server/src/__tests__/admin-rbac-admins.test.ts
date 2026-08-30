import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { assertAdminMutationAllowed } from '../services/admin-rbac-guards';
import { sanitizeOperationDetail } from '../services/admin-operation-log';

test('self disable and self delete are rejected', () => {
  assert.throws(
    () => assertAdminMutationAllowed({ actorId: 5, targetId: 5, mutation: 'DISABLE', targetIsSuperAdmin: false, activeSuperAdminCount: 2 }),
    /不能停用当前登录账号/
  );
  assert.throws(
    () => assertAdminMutationAllowed({ actorId: 5, targetId: 5, mutation: 'DELETE', targetIsSuperAdmin: false, activeSuperAdminCount: 2 }),
    /不能删除当前登录账号/
  );
});

test('the final active super administrator cannot be disabled, deleted, or reassigned', () => {
  for (const mutation of ['DISABLE', 'DELETE', 'CHANGE_ROLE'] as const) {
    assert.throws(
      () => assertAdminMutationAllowed({ actorId: 1, targetId: 2, mutation, targetIsSuperAdmin: true, activeSuperAdminCount: 1 }),
      /至少保留一个有效的超级管理员/
    );
  }
});

test('operation log sanitizer recursively removes secrets', () => {
  const sanitized = sanitizeOperationDetail({
    targetAdminId: 2,
    password: 'secret123',
    nested: { passwordHash: 'hash', authorization: 'Bearer token', token: 'jwt', status: 'ACTIVE' }
  });

  assert.deepEqual(sanitized, { targetAdminId: 2, nested: { status: 'ACTIVE' } });
});

test('administrator router exposes real CRUD and never serializes passwordHash', async () => {
  const source = await readFile(path.resolve(process.cwd(), 'src/routes/admin/admins.ts'), 'utf8');
  assert.match(source, /adminAdminsRouter\.get\('\/'/);
  assert.match(source, /adminAdminsRouter\.post\('\/'/);
  assert.match(source, /\/password'/);
  assert.match(source, /\/status'/);
  assert.match(source, /adminAdminsRouter\.delete/);
  assert.match(source, /bcrypt\.hash/);
  assert.doesNotMatch(source, /passwordHash:\s*admin\.passwordHash/);
});

test('editing the final super administrator only invokes role guard for a real downgrade', async () => {
  const source = await readFile(path.resolve(process.cwd(), 'src/routes/admin/admins.ts'), 'utf8');
  assert.doesNotMatch(source, /parsed\.data\.status === 'DISABLED' \? 'DISABLE' : 'CHANGE_ROLE'/);
  assert.match(source, /currentRoleId !== role\.id/);
});
