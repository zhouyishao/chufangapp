import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const detailPages = [
  'src/pages/ingredient-detail/index.vue',
  'src/pages/fruit-detail/index.vue',
  'src/pages/beverage-detail/index.vue',
  'src/pages/seasoning-detail/index.vue'
];

test('all non-recipe details share the locked hero, state and bottom action shell', async () => {
  const pages = await Promise.all(detailPages.map(read));

  for (const page of pages) {
    assert.match(page, /<content-detail-hero/);
    assert.match(page, /<content-detail-state/);
    assert.match(page, /<content-detail-bottom-bar/);
    assert.doesNotMatch(page, /data:image\/svg\+xml/);
  }
});

test('ingredient guide does not repeat the same hero image for every text point', async () => {
  const ingredient = await read('src/pages/ingredient-detail/index.vue');
  const template = ingredient.split('<script setup')[0];
  const style = await read('src/pages/ingredient-detail/canonical.scss');

  assert.doesNotMatch(template, /guide-item__image/);
  assert.match(template, /guide-item__dot/);
  assert.match(style, /\.guide-item[\s\S]*grid-template-columns:\s*16rpx minmax\(0,\s*1fr\)/);
  assert.doesNotMatch(style, /\.guide-item__image/);
});

test('shared detail layout keeps compact tabs, square recommendations and restrained surfaces', async () => {
  const style = await read('src/styles/content-detail-canonical.scss');

  assert.match(style, /\.detail-content[\s\S]*var\(--app-page-padding\)/);
  assert.match(style, /\.guide-tabs,[\s\S]*height:\s*82rpx/);
  assert.match(style, /\.related-image[\s\S]*aspect-ratio:\s*1/);
  assert.match(style, /\.guide-copy,[\s\S]*background:\s*transparent/);
});
