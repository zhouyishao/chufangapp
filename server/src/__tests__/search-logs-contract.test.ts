import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const schema = readFileSync(resolve('prisma/schema.prisma'), 'utf8');
const mobile = readFileSync(resolve('src/routes/api/mobile.ts'), 'utf8');
const admin = readFileSync(resolve('src/routes/admin/search-logs.ts'), 'utf8');
const app = readFileSync(resolve('src/app.ts'), 'utf8');

test('every C-end search increments a durable count', () => {
  assert.match(schema, /searchCount\s+Int\s+@default\(1\)/);
  const searchBlock = mobile.slice(
    mobile.indexOf("apiMobileRouter.get('/search'"),
    mobile.indexOf("apiMobileRouter.get('/search-histories'")
  );
  assert.match(searchBlock, /searchCount:\s*1/);
  assert.match(searchBlock, /searchCount:\s*\{ increment: 1 \}/);
});

test('admin search logs expose overview and paginated real history', () => {
  assert.match(app, /adminSearchLogsRouter/);
  assert.match(app, /\/api\/admin\/search-logs/);
  assert.match(admin, /searchHistory\.aggregate/);
  assert.match(admin, /searchHistory\.findMany/);
  assert.match(admin, /noResultSearches/);
});
