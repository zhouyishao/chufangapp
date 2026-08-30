import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (path: string) => readFile(join(process.cwd(), path), 'utf8');

test('category reorder requires a complete same-parent sibling set and writes transactionally', async () => {
  const source = await readSource('src/routes/admin/categories.ts');

  assert.match(source, /adminCategoriesRouter\.patch\('\/reorder'/);
  assert.match(source, /orderedIds/);
  assert.match(source, /排序列表必须包含同级全部分类/);
  assert.match(source, /prisma\.\$transaction/);
});

test('category reorder validates duplicate ids, type and parent scope', async () => {
  const source = await readSource('src/routes/admin/categories.ts');

  assert.match(source, /分类排序 ID 不能重复/);
  assert.match(source, /分类排序范围不一致/);
  assert.match(source, /sortOrder/);
});
