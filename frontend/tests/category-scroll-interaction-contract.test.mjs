import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/ingredients/index.vue', import.meta.url), 'utf8');

test('category page keeps the header stable and gives both panes their own vertical scroll', () => {
  assert.match(source, /<scroll-view[\s\S]*class="category-secondary-rail"[\s\S]*scroll-y/);
  assert.match(source, /<scroll-view[\s\S]*class="category-content-pane"[\s\S]*scroll-y/);
  assert.match(source, /\.category-page\s*\{[\s\S]*height:\s*100dvh;[\s\S]*overflow:\s*hidden;/);
  assert.match(source, /\.category-workspace\s*\{[\s\S]*flex:\s*1 1 auto;[\s\S]*min-height:\s*0;/);
  assert.match(source, /\.category-secondary-rail,[\s\S]*\.category-content-pane\s*\{[\s\S]*height:\s*100%;/);
});

test('category rail gives compact fruit labels enough room to read as one item', () => {
  assert.match(source, /\.category-workspace\s*\{[\s\S]*grid-template-columns:\s*96px minmax\(0, 1fr\);/);
  assert.match(source, /\.category-secondary-rail__item\s*\{[\s\S]*padding:\s*6px;/);
});

test('changing a primary category resets the content pane to the top', () => {
  assert.match(source, /const contentScrollTop = ref\(0\)/);
  assert.match(source, /const resetContentScroll = \(\) => \{[\s\S]*contentScrollTop\.value = 0;/);
  assert.match(source, /handleTopNavTap[\s\S]*resetContentScroll\(\);[\s\S]*void fetchModules\(\)/);
});

test('specific categories form a continuous right-side stream and load the next section near the bottom', () => {
  assert.match(source, /const categorySections = ref<CategorySection\[\]>\(\[\]\)/);
  assert.match(source, /const startCategoryStream = async \(item: PageModuleCategoryFilterItem/);
  assert.match(source, /const loadNextCategorySection = async \(\)/);
  assert.match(source, /class="category-content-section"/);
  assert.match(source, /@scrolltolower="loadNextCategorySection"/);
  assert.match(source, /lower-threshold="240"/);
});

test('right-side scrolling updates the left highlight while left clicks can jump to loaded sections', () => {
  assert.match(source, /:scroll-into-view="railScrollIntoView"/);
  assert.match(source, /:scroll-into-view="contentScrollIntoView"/);
  assert.match(source, /const syncActiveCategory = \(item: PageModuleCategoryFilterItem/);
  assert.match(source, /const updateActiveCategoryFromViewport = \(\)/);
  assert.match(source, /handleFilterTap[\s\S]*jumpToCategorySection/);
});

test('recommendation remains an independent list rather than joining the category stream', () => {
  assert.match(source, /const isCategoryStream = computed\(\(\) => Boolean\(currentCategoryId\.value\)\)/);
  assert.match(source, /v-if="isCategoryStream"/);
  assert.match(source, /if \(item\.type === 'system'\)[\s\S]*categorySections\.value = \[\];[\s\S]*void fetchModules\(\)/);
  assert.match(source, /if \(isCategoryStream\.value\) return categorySections\.value;/);
});
