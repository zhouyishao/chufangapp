import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { ADMIN_ROUTE_FAMILIES, permissionForAdminRequest } from '../security/admin-route-policy';

test('route policy distinguishes read, create, update, publish, and delete actions', () => {
  const cases = [
    ['GET', '/recipes', 'content:recipe:view'],
    ['POST', '/recipes', 'content:recipe:create'],
    ['PUT', '/recipes/recipe_1', 'content:recipe:update'],
    ['PATCH', '/recipes/recipe_1/publish', 'content:recipe:publish'],
    ['DELETE', '/recipes/recipe_1', 'content:recipe:delete'],
    ['GET', '/admins', 'system:admin:view'],
    ['POST', '/admins', 'system:admin:manage'],
    ['GET', '/roles', 'system:role:view'],
    ['PUT', '/roles/2/permissions', 'system:role:manage']
  ] as const;

  for (const [method, requestPath, expected] of cases) {
    assert.equal(permissionForAdminRequest(method, requestPath), expected, `${method} ${requestPath}`);
  }
});

test('every mounted live admin prefix belongs to a permission family', async () => {
  const appSource = await readFile(path.resolve(process.cwd(), 'src/app.ts'), 'utf8');
  const prefixes = Array.from(appSource.matchAll(/^\s*app\.use\('\/api\/admin\/([^']+)'/gm), (match) => match[1] ?? '')
    .filter((prefix) => prefix !== 'auth')
    .map((prefix) => prefix.split('/')[0] ?? '')
    .filter(Boolean);
  const covered = new Set(ADMIN_ROUTE_FAMILIES.map((family) => family.prefix.split('/')[0] ?? ''));

  assert.deepEqual(prefixes.filter((prefix) => !covered.has(prefix)), []);
});

test('unknown authenticated admin paths fail closed', () => {
  assert.equal(permissionForAdminRequest('GET', '/not-mapped'), null);
});
