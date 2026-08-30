import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageNames = [
  'basket',
  'family',
  'family-manage',
  'family-create',
  'family-member',
  'family-invite',
  'family-preferences',
  'scan',
  'purchase-history',
  'purchase-detail',
  'family-gathering'
];

const readPage = (name) =>
  readFile(new URL(`../src/pages/${name}/index.vue`, import.meta.url), 'utf8');

test('家庭、菜篮和采购二三级页统一预留手机顶部安全区', async () => {
  for (const name of pageNames) {
    const source = await readPage(name);
    assert.match(
      source,
      /safe-top-spacer|safe-area-inset-top|--app-safe-area-top/,
      `${name} 缺少顶部安全区`
    );
  }
});

test('家庭成员敏感写操作具备权限受限状态和重复提交保护', async () => {
  const source = await readPage('family-member');
  assert.match(source, /canManageMember/);
  assert.match(source, /permissionMessage/);
  assert.match(source, /isSavingMember/);
  assert.match(source, /isRemovingMember/);
  assert.match(source, /:disabled="isSavingMember"/);
});

test('邀请与扫码加入均区分加载错误、可重试和重复提交', async () => {
  const invite = await readPage('family-invite');
  const scan = await readPage('scan');
  for (const [name, source] of [['family-invite', invite], ['scan', scan]]) {
    assert.match(source, /loadError/, `${name} 缺少真实错误状态`);
    assert.match(source, /重新加载|重新查询/, `${name} 缺少重试入口`);
    assert.match(source, /joining/, `${name} 缺少加入防重复状态`);
  }
});

test('采购归档明确说明当前后端能力边界，详情仍可重试', async () => {
  const history = await readPage('purchase-history');
  const detail = await readPage('purchase-detail');
  assert.match(history, /已购买条目生成的采购归档/);
  assert.match(detail, /loadBasketItems\(null\)/);
  assert.match(detail, /重新加载/);
});

test('聚餐提醒展示家庭口味入口并保护重复发送', async () => {
  const source = await readPage('family-gathering');
  assert.match(source, /查看家庭口味/);
  assert.match(source, /pages\/family-preferences\/index\?familyId=/);
  assert.match(source, /if \(!selectedFamily\.value \|\| sending\.value\) return/);
  assert.match(source, /idempotencyKey/);
});
