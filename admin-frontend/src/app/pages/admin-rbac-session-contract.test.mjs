import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const permissions = await readFile(new URL('../permissions.ts', import.meta.url), 'utf8');
const storage = await readFile(new URL('../storage.ts', import.meta.url), 'utf8');
const api = await readFile(new URL('../api.ts', import.meta.url), 'utf8');
const types = await readFile(new URL('../types.ts', import.meta.url), 'utf8');
const requireAuth = await readFile(new URL('../components/RequireAuth.tsx', import.meta.url), 'utf8');

test('admin session consumes live role permissions without wildcard fallback', () => {
  assert.doesNotMatch(permissions, /return \['\*'\]/);
  assert.match(permissions, /admin\.permissions/);
  assert.match(storage, /Array\.isArray\(value\.permissions\)/);
  assert.match(storage, /isAdminRoleSummary/);
  assert.match(types, /AdminRoleSummary/);
  assert.match(types, /permissions:\s*string\[\]/);
});

test('admin API exposes typed administrator and role management', () => {
  for (const name of ['listAdmins', 'createAdmin', 'updateAdmin', 'resetAdminPassword', 'setAdminStatus', 'deleteAdmin', 'listRoles', 'createRole', 'updateRole', 'replaceRolePermissions', 'setRoleStatus', 'deleteRole', 'listAdminPermissions']) {
    assert.match(api, new RegExp(`export const ${name}`));
  }
  const createAdminDeclaration = api.match(/export const createAdmin[^\n]+/)?.[0] ?? '';
  assert.ok(createAdminDeclaration);
  assert.doesNotMatch(createAdminDeclaration, /Record<string, any>/);
});

test('authenticated routes refresh the live admin permission snapshot before rendering', () => {
  assert.match(api, /export const getAdminProfile/);
  assert.match(api, /request<AdminProfileResult>\('\/auth\/profile'\)/);
  assert.match(requireAuth, /getAdminProfile/);
  assert.match(requireAuth, /saveAdminUser/);
  assert.match(requireAuth, /permissions:\s*profile\.permissions/);
  assert.match(requireAuth, /登录状态验证失败/);
  assert.match(requireAuth, /重新验证/);
  assert.doesNotMatch(requireAuth, /if \(!token\)[\s\S]*return <>\{children\}<\/>;/);
});
