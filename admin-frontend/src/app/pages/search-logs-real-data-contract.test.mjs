import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('./SearchOpsPage.tsx', import.meta.url), 'utf8');
const api = await readFile(new URL('../api.ts', import.meta.url), 'utf8');

test('search logs page reads real overview and paginated records', () => {
  assert.match(page, /getSearchLogOverview/);
  assert.match(page, /listSearchLogs/);
  assert.match(api, /\/search-logs\/overview/);
  assert.match(api, /\/search-logs\?/);
  assert.doesNotMatch(page, /PagePlaceholder|等待后续业务开发/);
});
