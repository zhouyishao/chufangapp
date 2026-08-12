import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('home page uses published backend modules as its only content source', async () => {
  const source = await readSource('../src/pages/index/index.vue');

  assert.match(source, /getHomeTopNavs/);
  assert.match(source, /getHomeHeroBanners/);
  assert.match(source, /getHomeModules/);
  assert.match(source, /<PrototypeHomeModules[\s\S]*:modules="currentNavModules"/);
  assert.match(source, /暂时没有推荐内容/);
  assert.match(source, /新的时令灵感正在准备中/);
  assert.doesNotMatch(source, /后台发布|后台配置/);

  assert.doesNotMatch(source, /\bgetHome\s*\(/);
  assert.doesNotMatch(source, /getHomeTopNavContents/);
  assert.doesNotMatch(source, /remoteRecipes|remoteSeasonalIngredients|remoteHomeCategories/);
  assert.doesNotMatch(source, /remoteTopNavRecipes|remoteTopNavMeta|loadTopNavContents/);
  assert.doesNotMatch(source, /baseQuickActions|quickActionStats|const\s+quickActions/);
});

test('home channel switching reloads banner and published modules for the selected channel', async () => {
  const source = await readSource('../src/pages/index/index.vue');
  const switchStart = source.indexOf('const handleCategoryChange');
  const switchEnd = source.indexOf('const updateScrollState', switchStart);
  const switchSource = source.slice(switchStart, switchEnd);

  assert.ok(switchStart >= 0 && switchEnd > switchStart);
  assert.match(switchSource, /loadChannel\(navId,\s*requestSequence\)/);
  assert.match(switchSource, /channelRequestSequence/);

  const loadStart = source.indexOf('const loadChannel');
  const loadEnd = source.indexOf('const loadHome', loadStart);
  const loadSource = source.slice(loadStart, loadEnd);
  assert.ok(loadStart >= 0 && loadEnd > loadStart);
  assert.match(loadSource, /getHomeHeroBanners\(navId\)/);
  assert.match(loadSource, /getHomeModules\(navId\)/);
  assert.match(loadSource, /homeHeroBanners\.value\s*=\s*banners/);
  assert.match(loadSource, /currentNavModules\.value\s*=\s*modules/);
});

test('home modules show a useful empty state when published records have no renderable media', async () => {
  const source = await readSource('../src/components/home-modules/PrototypeHomeModules.vue');

  assert.match(source, /v-if="!visibleModules\.length"/);
  assert.match(source, /当前频道暂无完整内容/);
  assert.match(source, /去分类看看/);
  assert.doesNotMatch(source, /后台配置|后台发布/);
});

test('home module media uses a compiled uni-app component and grid media cannot cover card copy', async () => {
  const source = await readSource('../src/components/home-modules/PrototypeHomeModules.vue');
  const mediaSource = await readSource('../src/components/home-modules/PrototypeMediaTile.vue');
  const serviceSource = await readSource('../src/services/public-api.ts');

  assert.match(source, /import PrototypeMediaTile from ['"]\.\/PrototypeMediaTile\.vue['"]/);
  assert.match(source, /<PrototypeMediaTile/);
  assert.doesNotMatch(source, /h\(['"](?:image|view|text)['"]/);
  assert.match(mediaSource, /<image[\s\S]*:src="item\.cover"/);
  assert.doesNotMatch(
    source,
    /\.recipe-card__media-inner,\s*\n\.grid-card__media,\s*\n\.compact-row__media\s*\{[\s\S]*?height:\s*100%/
  );
  assert.match(serviceSource, /cover:\s*item\.cover\s*\?\s*resolveAssetUrl\(item\.cover\)\s*:\s*null/);
});

test('large image carousel keeps configured image items even when item copy is empty', async () => {
  const source = await readSource('../src/components/home-modules/PrototypeHomeModules.vue');

  assert.match(source, /v-else-if="isLargeImageCarousel\(module\)"/);
  assert.match(source, /module\.displayStyle === 'LARGE_IMAGE_CAROUSEL'/);
  assert.match(source, /item\.type === 'image'\s*&&\s*item\.cover\?\.trim\(\)/);
  assert.match(source, /class="large-image-carousel"/);
});

test('seasonal produce keeps the locked prototype rhythm and more entry', async () => {
  const source = await readSource('../src/components/home-modules/PrototypeHomeModules.vue');

  assert.match(source, /v-if="shouldShowMore\(module\)"/);
  assert.match(source, /const shouldShowMore = \(module: HomeModule\) =>/);
  assert.match(source, /module\.showMore \|\| isSeasonal\(module\)/);
  assert.match(source, /\.prototype-section--seasonal\s*\{\s*background:\s*transparent;/);
  assert.match(source, /\.prototype-section\s*\{[\s\S]*?padding:\s*28px 0 0;/);
  assert.match(source, /\.seasonal-rail__inner\s*\{[\s\S]*?padding:\s*0 20px 2px;/);
  assert.match(source, /\.seasonal-item__media\s*\{[\s\S]*?width:\s*68px;[\s\S]*?height:\s*68px;/);
  assert.match(source, /\.seasonal-item__name\s*\{[\s\S]*?margin-top:\s*6px;/);
});

test('locked home channels use the canonical category navigation instead of unrelated fallback navs', async () => {
  const page = await readSource('../src/pages/index/index.vue');
  const service = await readSource('../src/services/public-api.ts');

  assert.match(service, /getHomeTopNavs\s*=\s*async\s*\(params/);
  assert.match(service, /params\.page/);
  assert.match(page, /getHomeTopNavs\(\{\s*page:\s*'category'\s*\}\)/);
  assert.match(page, /contentType/);
  assert.doesNotMatch(page, /topNavs\.find\(\(item\) => !usedIds\.has\(item\.id\)/);
  assert.match(service, /'fruit'/);
  assert.match(service, /'seasoning'/);
});

test('category page uses backend page modules instead of embedded content data', async () => {
  const source = await readSource('../src/pages/ingredients/index.vue');

  assert.match(source, /getPageModules/);
  assert.match(source, /extractContentModules/);
  assert.match(source, /const contentItems = computed/);
  assert.match(source, /extractTopNavItems/);
  assert.match(source, /extractFilterItems/);
  assert.match(source, /暂无当前分类内容/);
  assert.match(source, /handleFilterTap/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
});
