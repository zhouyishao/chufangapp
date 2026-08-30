import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('./SettingsPage.tsx', import.meta.url), 'utf8');

test('administrator page uses real RBAC APIs without fixed metrics or local mutations', () => {
  for (const name of ['listAdmins', 'listRoles', 'createAdmin', 'updateAdmin', 'resetAdminPassword', 'setAdminStatus', 'deleteAdmin']) assert.match(source, new RegExp(name));
  assert.match(source, /system:admin:manage/);
  assert.match(source, /roleId/);
  assert.match(source, /初始密码|重置密码/);
  assert.doesNotMatch(source, /initialAdmins|resolveMockList|今日操作|setSourceItems/);
});
