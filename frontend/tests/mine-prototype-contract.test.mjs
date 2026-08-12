import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/pages/mine/index.vue', import.meta.url), 'utf8');

test('我的页使用冻结原型的信息架构', () => {
  assert.match(source, /已向.*共享/);
  assert.match(source, />管理</);
  assert.match(source, />口味</);
  assert.match(source, />家庭码</);
  assert.match(source, /消息与提醒/);
  assert.match(source, /隐私与家庭共享/);
  assert.match(source, /更多设置/);
});

test('我的页不保留被否决或重复的入口', () => {
  assert.doesNotMatch(source, /profile-stats/);
  assert.doesNotMatch(source, /mine-list__group-title/);
  assert.doesNotMatch(source, /查看全部/);
  assert.doesNotMatch(source, /通知提醒/);
  assert.doesNotMatch(source, /家庭共享<\/text>[\s\S]*?<switch/);
  assert.doesNotMatch(source, /主页壁纸|个性化与主页背景|草稿/);
});

test('我的菜谱卡片只通过整卡进入详情', () => {
  assert.match(source, /@tap="openMyRecipe\(recipe\.id\)"/);
  assert.doesNotMatch(source, /mine-recipe-card__more|mine-recipe-card--more/);
});
