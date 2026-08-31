import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('recipe success state follows the frozen prototype hierarchy', async () => {
  const page = await read('src/pages/recipe-detail/index.vue');
  const style = await read('src/pages/recipe-detail/canonical.scss');
  const template = page.split('<script setup')[0];

  assert.doesNotMatch(template, /recipe-tag-chips/);
  assert.doesNotMatch(template, /card-basket-btn/);
  assert.match(template, /ingredient-img-fallback[\s\S]*item\.name\.slice\(0, 1\)/);
  assert.match(style, /\.recipe-info-card::before,[\s\S]*\.recipe-info-card::after[\s\S]*display:\s*none/);
  assert.match(style, /\.recipe-name[\s\S]*var\(--font-size-page-title\)/);
  assert.match(style, /\.recipe-detail-switch[\s\S]*padding:\s*0 var\(--recipe-inline\)/);
  assert.match(template, /recipe-summary-line/);
  assert.doesNotMatch(template, /recipe-tag-row/);
  assert.doesNotMatch(template, /recipe-meta-row/);
  assert.doesNotMatch(template, /usage-row/);
  assert.match(style, /\.recipe-fixed-action::before[\s\S]*width:\s*76rpx/);
  assert.match(style, /\.related-list,[\s\S]*grid-auto-flow:\s*column/);
  assert.match(template, /primaryIngredientName \}\}还能这样做/);
  assert.match(style, /\.related-list\s*\{[\s\S]*grid-auto-columns:\s*326rpx/);
  assert.match(style, /\.beverage-cards-list\s*\{[\s\S]*grid-auto-columns:\s*208rpx/);
  assert.match(style, /\.same-ingredient-row\s*\{/);
  assert.match(style, /:deep\(\.content-detail-bottom-bar\)[\s\S]*position:\s*static/);
});

test('shared detail actions preserve prototype touch sizes and equal dual actions', async () => {
  const hero = await read('src/components/content-detail-hero.vue');
  const bottom = await read('src/components/content-detail-bottom-bar.vue');

  assert.match(hero, /width:\s*var\(--touch-target\)/);
  assert.match(hero, /height:\s*var\(--touch-target\)/);
  assert.match(hero, /\.content-detail-hero__action[\s\S]*margin:\s*0/);
  assert.match(bottom, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(bottom, /min-height:\s*104rpx/);
});
