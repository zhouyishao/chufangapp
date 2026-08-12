import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('favorites uses a compact title, icon-only removal and an empty-state discovery action', async () => {
  const source = await read('src/pages/favorites/index.vue');

  assert.doesNotMatch(source, /个人菜谱库|收藏列表/);
  assert.match(source, /去首页看看/);
  assert.match(source, /goExplore/);
  assert.match(source, /aria-label="取消收藏"/);
  assert.doesNotMatch(source, /处理中.*取消收藏/s);
});

test('recipe create avoids glass cards on every form section', async () => {
  const source = await read('src/pages/recipe-create/index.vue');

  assert.doesNotMatch(source, /class="form-section glass-card"/);
  assert.match(source, /class="form-section"/);
});
