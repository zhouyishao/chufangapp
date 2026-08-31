import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readPage = (name) =>
  readFile(new URL(`../src/pages/${name}/index.vue`, import.meta.url), 'utf8');

const contentPages = [
  'recommendations',
  'seasonal',
  'recipes',
  'ingredients',
  'search',
  'notifications',
  'category-filter',
  'today',
  'serving-recommendation',
  'family-menu'
];

const detailPages = [
  ['recipe-detail', 'getRecipe'],
  ['ingredient-detail', 'getIngredient'],
  ['fruit-detail', 'getIngredient'],
  ['seasoning-detail', 'getIngredient'],
  ['beverage-detail', 'getBeverage']
];

test('内容承接页面都提供加载、空、错误与重试状态', async () => {
  for (const name of contentPages) {
    const source = await readPage(name);
    assert.match(source, /loading/i, `${name}: loading`);
    assert.match(source, /empty|暂无|没有找到|还没有/, `${name}: empty`);
    assert.match(source, /error|加载失败|请求失败/, `${name}: error`);
    assert.match(source, /重试|重新加载|retry|reload/i, `${name}: retry`);
  }
});

test('五类详情页保留真实服务并统一满宽主图和异常状态', async () => {
  const sharedHero = await readFile(
    new URL('../src/components/content-detail-hero.vue', import.meta.url),
    'utf8'
  );
  assert.match(sharedHero, /aspect-ratio:\s*852\s*\/\s*844/, 'shared hero: locked ratio');
  assert.match(sharedHero, /@error=/, 'shared hero: media fallback');

  for (const [name, loader] of detailPages) {
    const source = await readPage(name);
    assert.match(source, new RegExp(`${loader}\\(`), `${name}: real service`);
    assert.match(source, /ContentDetailHero|content-detail-hero/, `${name}: shared hero structure`);
    assert.match(source, /loading/i, `${name}: loading`);
    assert.match(source, /error|加载失败|内容不可用|已下架/, `${name}: unavailable state`);
    assert.match(source, /ContentDetailState|重试|retry/i, `${name}: retry`);
  }
});

test('食材和水果详情包含挑选保存吃法及相关菜谱承接', async () => {
  for (const name of ['ingredient-detail', 'fruit-detail']) {
    const source = await readPage(name);
    assert.match(source, /怎么挑|挑选/, `${name}: selecting`);
    assert.match(source, /怎么放|保存/, `${name}: storage`);
    assert.match(source, /怎么吃|搭配/, `${name}: usage`);
    assert.match(source, /相关菜谱|适合做|recipe/i, `${name}: related recipes`);
  }

  const seasoning = await readPage('seasoning-detail');
  assert.match(seasoning, /用途/);
  assert.match(seasoning, /怎么放|保存/);
  assert.match(seasoning, /搭配/);
  assert.match(seasoning, /相关菜谱|recipe/i);
});

test('饮品详情区分普通饮品与可调制饮品并可进入制作流程', async () => {
  const source = await readPage('beverage-detail');
  assert.match(source, /isMixable|可调制|去制作/);
  assert.match(source, /基酒|辅料/);
  assert.match(source, /器具/);
  assert.match(source, /pages\/cooking\/index\?type=beverage/);
});

test('制作页支持步骤媒体降级、计时控制和最终完成状态', async () => {
  const source = await readPage('cooking');
  assert.match(source, /getRecipeGuidedFlow/);
  assert.match(source, /getBeverageGuidedFlow/);
  assert.match(source, /<video/);
  assert.match(source, /@error=/);
  assert.match(source, /mediaFailed|mediaError/);
  assert.match(source, /小贴士/);
  assert.match(source, /开始|暂停/);
  assert.match(source, /重置/);
  assert.match(source, /上一步/);
  assert.match(source, /下一步/);
  assert.match(source, /完成烹饪|完成制作|已完成/);
});
