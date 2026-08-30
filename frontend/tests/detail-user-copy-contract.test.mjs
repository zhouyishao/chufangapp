import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public detail pages do not expose backend configuration language', async () => {
  for (const path of [
    'src/pages/ingredient-detail/index.vue',
    'src/pages/fruit-detail/index.vue',
    'src/pages/beverage-detail/index.vue',
    'src/pages/seasoning-detail/index.vue'
  ]) {
    const source = await read(path);
    assert.doesNotMatch(source, /后台暂未配置|后台还没有配置|未配置/);
  }
});

test('ingredient guide has a calm empty explanation instead of a blank panel', async () => {
  const source = await read('src/pages/ingredient-detail/index.vue');

  assert.match(source, /暂无这部分说明/);
  assert.match(source, /v-if="activeGuideItems\.length"/);
});
