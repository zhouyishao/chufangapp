import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const homeSources = [
  '../src/pages/index/index.vue',
  '../src/components/home-modules/PrototypeHomeModules.vue',
  '../src/components/home-modules/FourCardGridContentModule.vue',
  '../src/components/home-modules/LargeImageCarouselModule.vue',
  '../src/components/home-modules/SeasonalIngredientCardModule.vue'
].map(read).join('\n');

const detailPages = [
  '../src/pages/recipe-detail/index.vue',
  '../src/pages/ingredient-detail/index.vue',
  '../src/pages/fruit-detail/index.vue',
  '../src/pages/beverage-detail/index.vue',
  '../src/pages/seasoning-detail/index.vue'
].map(read);

test('首页进入五类内容详情时统一携带 home 来源', () => {
  for (const route of [
    '/pages/recipe-detail/index',
    '/pages/ingredient-detail/index',
    '/pages/fruit-detail/index',
    '/pages/beverage-detail/index',
    '/pages/seasoning-detail/index'
  ]) {
    const escapedRoute = route.replaceAll('/', '\\/');
    assert.match(homeSources, new RegExp(`${escapedRoute}[^\\n]*from=home`));
  }
});

test('五类详情页统一使用来源感知的返回方法', () => {
  for (const page of detailPages) {
    assert.match(page, /navigateBackFromContentDetail/);
    assert.match(page, /resolveDetailEntryOrigin/);
  }
});

test('共享返回策略兼容 H5 hash 参数并优先返回首页', () => {
  const navigation = read('../src/utils/content-detail-navigation.ts');
  assert.match(navigation, /window\.location\.hash/);
  assert.match(navigation, /get\('from'\)/);
  assert.match(navigation, /origin === 'home'/);
  assert.match(navigation, /pages\/index\/index/);
});
