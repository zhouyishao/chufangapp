import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('all five content details use the shared friendly state panel', async () => {
  const state = await read('src/components/content-detail-state.vue');
  assert.match(state, /content-detail-state/);
  assert.match(state, /aria-live/);
  assert.match(state, /重新加载/);
  assert.match(state, /返回上一页/);

  for (const page of [
    'src/pages/recipe-detail/index.vue',
    'src/pages/ingredient-detail/index.vue',
    'src/pages/fruit-detail/index.vue',
    'src/pages/beverage-detail/index.vue',
    'src/pages/seasoning-detail/index.vue'
  ]) {
    const source = await read(page);
    assert.match(source, /ContentDetailState/);
    assert.doesNotMatch(source, />\s*\{\{\s*(?:remoteError|error)\s*\}\}\s*</);
  }
});

test('public API errors are converted to reader-facing detail messages', async () => {
  const source = await read('src/utils/content-detail-error.ts');
  assert.match(source, /getContentDetailErrorMessage/);
  assert.match(source, /内容暂时不可用/);
  assert.match(source, /网络连接不稳定/);
  assert.match(source, /登录状态已失效/);
  assert.doesNotMatch(source, /internal server error/i);
});

test('all detail pages share one safe-area-aware bottom action bar', async () => {
  const actions = await read('src/components/content-detail-bottom-bar.vue');
  assert.match(actions, /var\(--app-safe-area-bottom\)/);
  assert.doesNotMatch(actions, /env\(safe-area-inset-bottom/);
  assert.match(actions, /content-detail-bottom-bar__button/);
  assert.match(actions, /is-dual/);

  for (const page of [
    'src/pages/recipe-detail/index.vue',
    'src/pages/ingredient-detail/index.vue',
    'src/pages/fruit-detail/index.vue',
    'src/pages/beverage-detail/index.vue',
    'src/pages/seasoning-detail/index.vue'
  ]) {
    assert.match(await read(page), /ContentDetailBottomBar/);
  }
});
