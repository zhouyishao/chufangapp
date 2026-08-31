import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('./PurchaseListsPage.tsx', import.meta.url), 'utf8');
const api = await readFile(new URL('../api.ts', import.meta.url), 'utf8');

test('purchase page uses the real admin API and has no editable mock list', () => {
  assert.match(page, /listPurchaseLists/);
  assert.match(page, /getPurchaseListDetail/);
  assert.match(api, /\/purchase-lists/);
  assert.doesNotMatch(page, /GenericMockListPage|initialItems|lst_001/);
  assert.doesNotMatch(page, /primaryLabel=.*采购清单/);
});
