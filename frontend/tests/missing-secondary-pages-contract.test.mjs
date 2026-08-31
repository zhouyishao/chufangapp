import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('原型确认的二级页面均注册为独立路由', async () => {
  const pages = await read('../src/pages.json');
  for (const path of [
    'pages/privacy-sharing/index',
    'pages/account-security/index',
    'pages/notification-settings/index',
    'pages/family-gathering/index',
    'pages/about/index',
    'pages/legal/index',
    'pages/purchase-detail/index'
  ]) {
    assert.match(pages, new RegExp(`"${path.replaceAll('/', '\\/')}"`));
  }
});

test('我的页的隐私入口不再借用设置页查询参数', async () => {
  const source = await read('../src/pages/mine/index.vue');
  assert.match(source, /pages\/privacy-sharing\/index/);
  assert.doesNotMatch(source, /settings\/index\?section=privacy/);
});

test('设置页提供账号安全、通知设置、隐私共享和关于产品入口', async () => {
  const source = await read('../src/pages/settings/index.vue');
  for (const path of [
    'pages/account-security/index',
    'pages/notification-settings/index',
    'pages/privacy-sharing/index',
    'pages/about/index'
  ]) {
    assert.match(source, new RegExp(path.replaceAll('/', '\\/')));
  }
});

test('隐私共享页使用真实口味接口并进入独立个人口味编辑页', async () => {
  const source = await read('../src/pages/privacy-sharing/index.vue');
  assert.match(source, /listMobileUserPreferences/);
  assert.match(source, /pages\/personal-preferences\/index/);
  assert.match(source, /pages\/my-recipes\/index/);
});

test('采购记录可以进入独立采购详情页', async () => {
  const source = await read('../src/pages/purchase-history/index.vue');
  assert.match(source, /pages\/purchase-detail\/index/);
  assert.match(source, /openPurchaseDetail/);
});

test('关于产品提供服务协议和隐私政策入口', async () => {
  const source = await read('../src/pages/about/index.vue');
  assert.match(source, /goLegal\('terms'\)/);
  assert.match(source, /goLegal\('privacy'\)/);
  assert.match(source, /pages\/legal\/index\?type=\$\{type\}/);
});

test('提醒设置可以进入家庭聚餐并发送真实开饭提醒', async () => {
  const settings = await read('../src/pages/notification-settings/index.vue');
  const gathering = await read('../src/pages/family-gathering/index.vue');

  assert.match(settings, /pages\/family-gathering\/index/);
  assert.match(gathering, /sendMobileMealReady/);
  assert.match(gathering, /idempotencyKey/);
});
