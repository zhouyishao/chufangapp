import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const route = readFileSync(resolve('src/routes/admin/purchase-lists.ts'), 'utf8');
const app = readFileSync(resolve('src/app.ts'), 'utf8');

test('admin purchase lists aggregate real purchase list items by household scope', () => {
  assert.match(app, /adminPurchaseListsRouter/);
  assert.match(app, /\/api\/admin\/purchase-lists/);
  assert.match(route, /purchaseListItem\.findMany/);
  assert.match(route, /familyId/);
  assert.match(route, /checkedCount/);
  assert.match(route, /missingPriceCount/);
  assert.doesNotMatch(route, /lst_001|initialItems/);
});
