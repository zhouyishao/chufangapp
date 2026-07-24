import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('home page uses published backend modules as its only content source', async () => {
  const source = await readSource('../src/pages/index/index.vue');

  assert.match(source, /getHomeTopNavs/);
  assert.match(source, /getHomeHeroBanners/);
  assert.match(source, /getHomeModules/);
  assert.match(source, /<HomeModuleRenderer\s+:modules="currentNavModules"/);
  assert.match(source, /暂无首页内容/);
  assert.match(source, /后台发布推荐模块后/);

  assert.doesNotMatch(source, /\bgetHome\s*\(/);
  assert.doesNotMatch(source, /getHomeTopNavContents/);
  assert.doesNotMatch(source, /remoteRecipes|remoteSeasonalIngredients|remoteHomeCategories/);
  assert.doesNotMatch(source, /remoteTopNavRecipes|remoteTopNavMeta|loadTopNavContents/);
  assert.doesNotMatch(source, /baseQuickActions|quickActionStats|const\s+quickActions/);
});

test('home channel switching reloads banner and published modules for the selected channel', async () => {
  const source = await readSource('../src/pages/index/index.vue');
  const switchStart = source.indexOf('const handleCategoryChange');
  const switchEnd = source.indexOf('// ====== 轮播图跳转 ======', switchStart);
  const switchSource = source.slice(switchStart, switchEnd);

  assert.ok(switchStart >= 0 && switchEnd > switchStart);
  assert.match(switchSource, /getHomeHeroBanners\(navId\)/);
  assert.match(switchSource, /loadCurrentModules\(navId,\s*requestSequence\)/);
  assert.match(switchSource, /homeHeroBanners\.value\s*=\s*\[\]/);
  assert.match(switchSource, /channelRequestSequence/);
});

test('category page uses backend page modules instead of embedded content data', async () => {
  const source = await readSource('../src/pages/ingredients/index.vue');

  assert.match(source, /getPageModules/);
  assert.match(source, /contentModules/);
  assert.match(source, /extractTopNavItems/);
  assert.match(source, /extractFilterItems/);
  assert.match(source, /暂无当前分类内容/);
  assert.match(source, /handleFilterTap/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
});
