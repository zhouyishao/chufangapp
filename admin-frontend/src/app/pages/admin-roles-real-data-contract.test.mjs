import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('./RolesPage.tsx', import.meta.url), 'utf8');

test('role page uses live RBAC APIs and permission groups', () => {
  for (const name of ['listRoles', 'listAdminPermissions', 'createRole', 'updateRole', 'replaceRolePermissions', 'setRoleStatus', 'deleteRole']) {
    assert.match(source, new RegExp(name));
  }
  assert.match(source, /system:role:manage/);
  assert.match(source, /permissionIds/);
  assert.match(source, /isSystem/);
  assert.doesNotMatch(source, /initialRoles|resolveMockList|权限树占位|defaultChecked|setSourceItems/);
});
