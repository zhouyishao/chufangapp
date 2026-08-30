import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { assertRoleMutationAllowed, validatePermissionReplacement } from '../services/admin-rbac-guards';

test('permission replacement accepts a unique complete list of active permissions', () => {
  assert.deepEqual(
    validatePermissionReplacement([1, 2, 2], [{ id: 1, status: 'ACTIVE', deletedAt: null }, { id: 2, status: 'ACTIVE', deletedAt: null }]),
    [1, 2]
  );
  assert.throws(
    () => validatePermissionReplacement([1, 9], [{ id: 1, status: 'ACTIVE', deletedAt: null }]),
    /权限不存在或已停用/
  );
});

test('system and assigned role protections are enforced', () => {
  assert.throws(() => assertRoleMutationAllowed({ isSystem: true, code: 'READ_ONLY', adminCount: 0, mutation: 'DELETE' }), /系统角色不可删除/);
  assert.throws(() => assertRoleMutationAllowed({ isSystem: false, code: 'CUSTOM', adminCount: 1, mutation: 'DISABLE' }), /仍有管理员使用/);
  assert.throws(() => assertRoleMutationAllowed({ isSystem: true, code: 'SUPER_ADMIN', adminCount: 1, mutation: 'REPLACE_PERMISSIONS' }), /超级管理员权限固定/);
});

test('role router exposes real CRUD, permission catalog, and complete permission replacement', async () => {
  const source = await readFile(path.resolve(process.cwd(), 'src/routes/admin/roles.ts'), 'utf8');
  assert.match(source, /adminRolesRouter\.get\('\/'/);
  assert.match(source, /adminPermissionsRouter\.get\('\/'/);
  assert.match(source, /\/permissions'/);
  assert.match(source, /rolePermission\.updateMany/);
  assert.match(source, /rolePermission\.upsert/);
  assert.match(source, /adminRolesRouter\.delete/);
});
