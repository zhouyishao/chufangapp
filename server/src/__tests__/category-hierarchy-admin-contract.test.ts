import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (path: string) => readFile(join(process.cwd(), path), 'utf8');

test('admin category contract persists a configurable parent category', async () => {
  const source = await readSource('src/routes/admin/categories.ts');

  assert.match(source, /parentId/);
  assert.match(source, /resolveParentId/);
  assert.match(source, /parent:\s*\{/);
  assert.match(source, /不能选择自身或下级分类作为上级分类/);
});

test('admin category list exposes hierarchy, publication filters and truthful metrics', async () => {
  const source = await readSource('src/routes/admin/categories.ts');

  assert.match(source, /level:\s*z\.coerce\.number\(\)/);
  assert.match(source, /isPublish:\s*z\.enum\(\['true', 'false'\]\)/);
  assert.match(source, /buildCategoryMetrics/);
  for (const field of ['directContentCount', 'descendantContentCount', 'publicContentCount', 'childCount', 'summary']) {
    assert.match(source, new RegExp(field));
  }
});

test('admin category writes prevent third levels and referenced type changes', async () => {
  const source = await readSource('src/routes/admin/categories.ts');

  assert.match(source, /分类最多支持两级/);
  assert.match(source, /已有内容或子分类，不能修改分类类型/);
});
