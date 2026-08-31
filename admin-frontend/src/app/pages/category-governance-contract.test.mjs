import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('category page exposes real hierarchy, app visibility and subtree counts', async () => {
  const page = await read('./CategoriesPage.tsx');

  assert.match(page, /levelFilter/);
  assert.match(page, /publishFilter/);
  assert.match(page, /publicContentCount/);
  assert.match(page, /descendantContentCount/);
  assert.match(page, /item\.parent\?\.name/);
  assert.match(page, /reorderCategories/);
  assert.doesNotMatch(page, /当前分类接口为一级扁平分类/);
  assert.doesNotMatch(page, />1<\/td>/);
});

test('category edit form removes fake fields and locks referenced category type', async () => {
  const form = await read('./CategoryFormPage.tsx');

  assert.doesNotMatch(form, /description:/);
  assert.doesNotMatch(form, /remark:/);
  assert.match(form, /canChangeType/);
  assert.match(form, /已有内容或子分类，不能修改分类类型/);
});
