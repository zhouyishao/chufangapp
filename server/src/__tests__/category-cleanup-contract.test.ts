import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (path: string) => readFile(join(process.cwd(), path), 'utf8');

test('seed uses controlled production taxonomies', async () => {
  const seed = await readSource('prisma/seed.ts');

  assert.doesNotMatch(seed, /'时令水果'/);
  assert.doesNotMatch(seed, /'应季食材'/);
  assert.match(seed, /'苹果类'/);
  assert.match(seed, /'盐类'/);
});

test('cleanup defaults to dry-run and refuses categories with public content', async () => {
  const source = await readSource('src/scripts/cleanup-content-categories.ts');

  assert.match(source, /process\.argv\.includes\('--apply'\)/);
  assert.match(source, /公开内容不为 0，已取消整理/);
  assert.match(source, /isPublish:\s*false/);
  assert.match(source, /prisma\.\$transaction/);
  assert.match(source, /未修改数据库/);
  assert.match(source, /isEmptyPublishedCategory/);
});
