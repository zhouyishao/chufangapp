import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const usersRoute = readFileSync(resolve('src/routes/admin/users.ts'), 'utf8');

test('admin user behavior timeline aggregates durable C-end events', () => {
  assert.match(usersRoute, /adminUsersRouter\.get\('\/behavior'/);
  assert.match(usersRoute, /prisma\.viewHistory\.findMany/);
  assert.match(usersRoute, /prisma\.favorite\.findMany/);
  assert.match(usersRoute, /prisma\.searchHistory\.findMany/);
  assert.match(usersRoute, /prisma\.purchaseListItem\.findMany/);
  assert.match(usersRoute, /VIEW/);
  assert.match(usersRoute, /FAVORITE/);
  assert.match(usersRoute, /SEARCH/);
  assert.match(usersRoute, /BASKET_ADD/);
});

test('behavior route is declared before the dynamic user detail route', () => {
  assert.ok(
    usersRoute.indexOf("adminUsersRouter.get('/behavior'") < usersRoute.indexOf("adminUsersRouter.get('/:id'"),
    'the static behavior route must not be captured as a user id'
  );
});
