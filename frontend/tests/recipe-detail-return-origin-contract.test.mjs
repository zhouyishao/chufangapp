import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('首页菜谱入口携带来源，详情页丢失路由栈时返回首页', async () => {
  const homeModules = await read('src/components/home-modules/PrototypeHomeModules.vue');
  const horizontalRecipeModule = await read('src/components/home-modules/HorizontalRecipeCardModule.vue');
  const imageTextListModule = await read('src/components/home-modules/ImageTextListModule.vue');
  const fourCardGridModule = await read('src/components/home-modules/FourCardGridContentModule.vue');
  const twoColumnGridModule = await read('src/components/home-modules/TwoColumnRecipeGridModule.vue');
  const largeImageCarouselModule = await read('src/components/home-modules/LargeImageCarouselModule.vue');
  const home = await read('src/pages/index/index.vue');
  const detail = await read('src/pages/recipe-detail/index.vue');
  const navigation = await read('src/utils/content-detail-navigation.ts');

  assert.match(homeModules, /recipe-detail\/index\?id=\$\{item\.id\}&from=home/);
  assert.match(horizontalRecipeModule, /recipe-detail\/index\?id=\$\{id\}&from=home/);
  assert.match(imageTextListModule, /recipe-detail\/index\?id=\$\{id\}&from=home/);
  assert.match(fourCardGridModule, /recipe-detail\/index\?id=\$\{item\.id\}&from=home/);
  assert.match(twoColumnGridModule, /recipe-detail\/index\?id=\$\{id\}&from=home/);
  assert.match(largeImageCarouselModule, /recipe-detail\/index\?id=\$\{targetId\}&from=home/);
  assert.match(home, /route\}\?id=\$\{banner\.targetId\}&from=home/);
  assert.match(navigation, /window\.location\.hash/);
  assert.match(navigation, /URLSearchParams/);
  assert.match(detail, /detailEntryOrigin\.value\s*=\s*resolveDetailEntryOrigin/);
  assert.match(detail, /navigateBackFromContentDetail/);
  assert.match(navigation, /origin\s*===\s*'home'/);
  assert.match(navigation, /uni\.reLaunch\(\{\s*url:\s*'\/pages\/index\/index'/);
});

test('存在正常页面栈时详情页仍然原路返回', async () => {
  const navigation = await read('src/utils/content-detail-navigation.ts');
  assert.match(navigation, /getCurrentPages\(\)\.length\s*>\s*1[\s\S]*uni\.navigateBack\(\)/);
});

test('明确来自首页时优先返回首页，不受残留页面栈影响', async () => {
  const navigation = await read('src/utils/content-detail-navigation.ts');
  const homeOriginBranch = navigation.indexOf("if (origin === 'home')");
  const pageStackBranch = navigation.indexOf('if (getCurrentPages().length > 1)');

  assert.notEqual(homeOriginBranch, -1);
  assert.notEqual(pageStackBranch, -1);
  assert.ok(homeOriginBranch < pageStackBranch, '首页来源判断必须早于页面栈返回判断');
});
