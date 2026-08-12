import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('ingredient detail follows the frozen prototype information hierarchy', async () => {
  const source = await read('src/pages/ingredient-detail/index.vue');

  assert.match(source, /class="ingredient-heading"/);
  assert.match(source, /class="ingredient-info-strip"/);
  assert.match(source, /class="guide-list"/);
  assert.match(source, /class="guide-item__dot"/);
  assert.doesNotMatch(source, /class="guide-item__image"/);
  assert.match(source, /class="related-recipe-rail"/);
  assert.match(source, /ContentDetailBottomBar/);
});

test('ingredient detail uses one full-width primary basket action and accessible tabs', async () => {
  const source = await read('src/pages/ingredient-detail/index.vue');
  const canonicalStyles = await read('src/pages/ingredient-detail/canonical.scss');

  assert.match(source, /role="tablist"/);
  assert.match(source, /:aria-selected="activeTipsTab === tab\.id"/);
  assert.match(source, /:primary-label="isInBasket \? '已加入菜篮' : '加入菜篮'"/);
  assert.match(canonicalStyles, /aspect-ratio:\s*1/);
});

test('ingredient guide tabs render one prototype-aligned bottom indicator', async () => {
  const source = await read('src/pages/ingredient-detail/index.vue');
  const canonicalStyles = await read('src/pages/ingredient-detail/canonical.scss');

  assert.doesNotMatch(source, /\.tips-tab\.is-active::before/);
  assert.match(canonicalStyles, /\.tips-tab\s*\{[^}]*height:\s*100%/s);
  assert.match(canonicalStyles, /\.tips-tab::after\s*\{[^}]*top:\s*auto[^}]*right:\s*28%[^}]*bottom:\s*-1rpx[^}]*left:\s*28%/s);
  assert.match(canonicalStyles, /\.tips-tab\.is-active::after\s*\{[^}]*background:\s*var\(--app-primary\)/s);
});
