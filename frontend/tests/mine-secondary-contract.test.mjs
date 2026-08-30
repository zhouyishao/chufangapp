import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('收藏列表提供真实取消收藏操作', async () => {
  const source = await read('../src/pages/favorites/index.vue');
  assert.match(source, /deleteMobileFavorite/);
  assert.match(source, /@tap\.stop="removeFavorite\(item\)"/);
  assert.match(source, /取消收藏/);
});

test('收藏列表覆盖五类内容并支持真实分页', async () => {
  const source = await read('../src/pages/favorites/index.vue');
  for (const targetType of ['RECIPE', 'INGREDIENT', 'FRUIT', 'BEVERAGE', 'SEASONING']) {
    assert.match(source, new RegExp(targetType));
  }
  assert.match(source, /onReachBottom/);
  assert.match(source, /hasMore/);
  assert.match(source, /data\.total/);
});

test('家庭列表提供创建和扫码加入两个入口，并区分加载错误和空态', async () => {
  const source = await read('../src/pages/family/index.vue');
  assert.match(source, /pages\/scan\/index/);
  assert.match(source, /v-if="loading"/);
  assert.match(source, /v-else-if="error"/);
  assert.match(source, /v-else-if="!families\.length"/);
  assert.match(source, /family\.avatar/);
  assert.match(source, /family-card__avatar/);
  assert.match(source, /pages\/family-manage\/index\?id=/);
});

test('家庭详情进入成员三级页，备注只表示成员称呼', async () => {
  const manage = await read('../src/pages/family-manage/index.vue');
  const member = await read('../src/pages/family-member/index.vue');
  assert.match(manage, /pages\/family-member\/index\?familyId=/);
  assert.match(member, /设置备注名/);
  assert.match(member, /例如：妈妈|例如：爸爸|家人称呼/);
  assert.doesNotMatch(member, /例如：负责买菜/);
});

test('我的菜谱页面不再展示已否决的草稿功能', async () => {
  const source = await read('../src/pages/my-recipes/index.vue');
  assert.doesNotMatch(source, /draftCount|草稿|is-draft/);
  assert.match(source, /添加菜谱/);
});

test('隐私入口展示家庭共享管理而不是普通设置页', async () => {
  const source = await read('../src/pages/settings/index.vue');
  assert.match(source, /onLoad/);
  assert.match(source, /section.*privacy/);
  assert.match(source, /隐私与家庭共享/);
  assert.match(source, /个人口味与忌口/);
  assert.match(source, /个人菜谱共享/);
});
