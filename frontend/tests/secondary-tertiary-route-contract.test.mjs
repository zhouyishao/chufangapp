import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const expectedRouteGroups = {
  content: [
    'pages/recommendations/index',
    'pages/seasonal/index',
    'pages/search/index',
    'pages/notifications/index',
    'pages/category-filter/index',
    'pages/today/index',
    'pages/serving-recommendation/index',
    'pages/family-menu/index'
  ],
  detailAndFlow: [
    'pages/recipe-detail/index',
    'pages/ingredient-detail/index',
    'pages/fruit-detail/index',
    'pages/beverage-detail/index',
    'pages/seasoning-detail/index',
    'pages/cooking/index'
  ],
  basketAndFamily: [
    'pages/purchase-history/index',
    'pages/purchase-detail/index',
    'pages/family-manage/index',
    'pages/family/index',
    'pages/family-create/index',
    'pages/family-member/index',
    'pages/family-invite/index',
    'pages/family-preferences/index',
    'pages/family-gathering/index',
    'pages/scan/index'
  ],
  mineAndAccount: [
    'pages/my-recipes/index',
    'pages/recipe-create/index',
    'pages/my-recipe-detail/index',
    'pages/favorites/index',
    'pages/recent-views/index',
    'pages/profile-edit/index',
    'pages/privacy-sharing/index',
    'pages/personal-preferences/index',
    'pages/settings/index',
    'pages/notification-settings/index',
    'pages/account-security/index',
    'pages/login-devices/index',
    'pages/account-deletion/index',
    'pages/about/index',
    'pages/legal/index'
  ]
};

test('冻结原型确认的二级和三级页面全部注册为正式路由', async () => {
  const pages = await read('../src/pages.json');
  for (const routes of Object.values(expectedRouteGroups)) {
    for (const route of routes) {
      assert.match(pages, new RegExp(`"${route.replaceAll('/', '\\/')}"`), route);
    }
  }
});

test('设置与账号安全形成可返回的三级页面链路', async () => {
  const settings = await read('../src/pages/settings/index.vue');
  const security = await read('../src/pages/account-security/index.vue');

  assert.match(settings, /pages\/account-security\/index/);
  assert.match(settings, /pages\/notification-settings\/index/);
  assert.match(settings, /pages\/privacy-sharing\/index/);
  assert.match(settings, /pages\/about\/index/);
  assert.match(security, /pages\/login-devices\/index/);
  assert.match(security, /pages\/account-deletion\/index/);
});

test('隐私共享通过独立个人口味页面进入编辑流程', async () => {
  const privacy = await read('../src/pages/privacy-sharing/index.vue');
  assert.match(privacy, /pages\/personal-preferences\/index/);
});

test('家庭、采购和聚餐页面都有正式入口', async () => {
  const mine = await read('../src/pages/mine/index.vue');
  const settings = await read('../src/pages/settings/index.vue');
  const notifications = await read('../src/pages/notification-settings/index.vue');

  assert.match(mine, /pages\/family-manage\/index/);
  assert.match(settings, /pages\/purchase-history\/index/);
  assert.match(notifications, /pages\/family-gathering\/index/);
});
