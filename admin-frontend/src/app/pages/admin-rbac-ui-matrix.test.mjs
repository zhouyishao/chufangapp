import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [navigation, permissions, gate, app, sidebar] = await Promise.all([
  readFile(new URL('../navigation.ts', import.meta.url), 'utf8'),
  readFile(new URL('../permissions.ts', import.meta.url), 'utf8'),
  readFile(new URL('../components/PermissionGate.tsx', import.meta.url), 'utf8').catch(() => ''),
  readFile(new URL('../App.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../components/Sidebar.tsx', import.meta.url), 'utf8')
]);

test('navigation exposes canonical permission keys and is filtered before render', () => {
  for (const key of ['home:configuration:view', 'content:recipe:view', 'content:ingredient:view', 'content:beverage:view', 'user:account:view']) {
    assert.match(navigation, new RegExp(key));
  }
  for (const legacy of ["'home:view'", "'recipe:view'", "'ingredient:view'", "'beverage:view'", "'user:view'"]) {
    assert.doesNotMatch(navigation, new RegExp(legacy));
  }
  assert.match(permissions, /filterNavigationByAccess/);
  assert.match(sidebar, /filterNavigationByAccess/);
});

test('direct routes and action gate use canonical permissions', () => {
  assert.match(app, /settings\/admins[^\n]+system:admin:view/);
  assert.match(app, /content\/recipes\/create[^\n]+content:recipe:create/);
  assert.match(app, /home-ops\/top-nav\/new[^\n]+home:configuration:create/);
  assert.match(gate, /mode.*hide.*disable/s);
  assert.match(gate, /canAccess/);
});
