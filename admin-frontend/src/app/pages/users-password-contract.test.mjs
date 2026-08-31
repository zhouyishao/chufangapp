import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const usersPage = await readFile(new URL('./UsersPage.tsx', import.meta.url), 'utf8');

test('admin create requires an initial password and edit can reset it', () => {
  assert.match(usersPage, /初始密码/);
  assert.match(usersPage, /重置密码（留空不修改）/);
  assert.doesNotMatch(usersPage, /drawerMode === 'edit' \|\| !payload\.password/);
  assert.doesNotMatch(usersPage, /delete password from payload on edit/);
});
