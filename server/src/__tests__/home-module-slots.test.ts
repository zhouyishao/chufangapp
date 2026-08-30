import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getHomeModuleSlots,
  inferLegacyHomeModuleKey,
  isHomeModuleKey,
  isHomeModuleKeyForChannel
} from '../domain/home-module-slots';

test('推荐频道严格对应冻结原型的七个模块', () => {
  assert.deepEqual(
    getHomeModuleSlots('recommend').map((slot) => slot.label),
    ['时令果蔬', '家常精选', '挑选指南', '清爽一餐', '食材灵感', '饮品搭配', '本周热门']
  );
});

test('四个内容频道返回冻结原型中的模块清单', () => {
  assert.deepEqual(getHomeModuleSlots('recipe').map((slot) => slot.label), ['今天吃什么', '按一餐来选', '更多家常菜']);
  assert.deepEqual(getHomeModuleSlots('ingredient').map((slot) => slot.label), ['当季食材', '今天怎么挑', '一材多吃']);
  assert.deepEqual(getHomeModuleSlots('fruit').map((slot) => slot.label), ['本月正当季', '怎么挑 · 怎么放', '水果也能入菜']);
  assert.deepEqual(getHomeModuleSlots('beverage').map((slot) => slot.label), ['清爽饮品', '搭配这一餐', '酒水基础', '调饮配方']);
});

test('旧数字标题按模板与顺序推断到正确槽位', () => {
  assert.equal(inferLegacyHomeModuleKey('recommend', {
    title: '222',
    displayStyle: 'TWO_COLUMN_RECIPE_GRID',
    contentType: 'RECIPE',
    sortOrder: 4
  }), 'LIGHT_MEAL');
  assert.equal(inferLegacyHomeModuleKey('recommend', {
    title: '33',
    displayStyle: 'SEASONAL_INGREDIENT_CARD',
    contentType: 'INGREDIENT',
    sortOrder: 1
  }), 'SEASONAL_PRODUCE');
});

test('模块标识只允许原型目录中定义的值', () => {
  assert.equal(isHomeModuleKey('DRINK_PAIRING'), true);
  assert.equal(isHomeModuleKey('222'), false);
});

test('公开 C 端只接收属于当前频道的已绑定模块', () => {
  assert.equal(isHomeModuleKeyForChannel('recommend', 'SEASONAL_PRODUCE'), true);
  assert.equal(isHomeModuleKeyForChannel('recommend', 'TODAY_RECIPES'), false);
  assert.equal(isHomeModuleKeyForChannel('recommend', null), false);
  assert.equal(isHomeModuleKeyForChannel('recommend', 'E2E_20260801_1785561956448'), false);
});
