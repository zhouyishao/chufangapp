import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('five content detail pages use the shared locked full-bleed hero', async () => {
  const hero = await read('src/components/content-detail-hero.vue');
  assert.match(hero, /aspect-ratio:\s*852\s*\/\s*844/);
  assert.match(hero, /var\(--app-safe-area-top\)/);
  assert.match(hero, /heart-filled/);
  assert.match(hero, /name="share"/);

  const pages = [
    'src/pages/recipe-detail/index.vue',
    'src/pages/ingredient-detail/index.vue',
    'src/pages/fruit-detail/index.vue',
    'src/pages/beverage-detail/index.vue',
    'src/pages/seasoning-detail/index.vue'
  ];
  for (const page of pages) {
    assert.match(await read(page), /ContentDetailHero|content-detail-hero/);
  }
});

test('detail pages keep the confirmed content-specific structures', async () => {
  const recipe = await read('src/pages/recipe-detail/index.vue');
  assert.match(recipe, />食材</);
  assert.match(recipe, />步骤</);
  assert.match(recipe, />小贴士</);
  assert.match(recipe, /加入菜篮/);
  assert.match(recipe, /去烹饪/);
  assert.match(recipe, /相似菜谱|同食材菜谱/);

  for (const page of ['src/pages/ingredient-detail/index.vue', 'src/pages/fruit-detail/index.vue']) {
    const source = await read(page);
    assert.match(source, /怎么挑/);
    assert.match(source, /怎么放/);
    assert.match(source, /怎么吃/);
    assert.match(source, /约多少钱一斤/);
    assert.match(source, /相关菜谱|适合做/);
  }

  const beverage = await read('src/pages/beverage-detail/index.vue');
  assert.match(beverage, /基酒与辅料/);
  assert.match(beverage, /器具/);
  assert.match(beverage, /去制作/);

  const seasoning = await read('src/pages/seasoning-detail/index.vue');
  assert.match(seasoning, /用途/);
  assert.match(seasoning, /怎么搭/);
  assert.match(seasoning, /相关菜谱/);
});
