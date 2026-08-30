import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSourceCategoryId } from '../domain/content-module-rules';

test('内容来源分类与模块展示位置互不覆盖', () => {
  assert.equal(resolveSourceCategoryId({
    contentSource: 'CATEGORY_CONTENT',
    categoryId: 11,
    sourceCategoryId: 22
  }), 22);
});

test('旧模块在迁移窗口内继续使用原 categoryId 取内容', () => {
  assert.equal(resolveSourceCategoryId({
    contentSource: 'CATEGORY_CONTENT',
    categoryId: 11,
    sourceCategoryId: null
  }), 11);
  assert.equal(resolveSourceCategoryId({
    contentSource: 'MANUAL',
    categoryId: 11,
    sourceCategoryId: null
  }), null);
});
