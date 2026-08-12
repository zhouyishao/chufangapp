import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('隐私共享进入独立个人偏好页，并使用真实偏好接口', async () => {
  const privacy = await read('../src/pages/privacy-sharing/index.vue');
  const preferences = await read('../src/pages/personal-preferences/index.vue');

  assert.match(privacy, /pages\/personal-preferences\/index/);
  assert.match(preferences, /listMobileUserPreferences/);
  assert.match(preferences, /replaceMobileUserPreferences/);
  assert.match(preferences, /正在加载|加载失败|还没有/);
  assert.match(preferences, /重新加载|重试/);
});

test('账号安全提供登录设备和注销入口，缺失接口时不伪造成功', async () => {
  const security = await read('../src/pages/account-security/index.vue');
  const devices = await read('../src/pages/login-devices/index.vue');
  const deletion = await read('../src/pages/account-deletion/index.vue');

  assert.match(security, /pages\/login-devices\/index/);
  assert.match(security, /pages\/account-deletion\/index/);
  assert.match(devices, /服务端暂未提供登录设备接口/);
  assert.match(deletion, /服务端暂未提供账号注销接口/);
  assert.doesNotMatch(devices, /操作成功|已下线/);
  assert.doesNotMatch(deletion, /注销成功|已删除账号/);
});

test('最近浏览清理呈现真实阻塞状态，不伪造清理成功', async () => {
  const source = await read('../src/pages/recent-views/index.vue');
  assert.match(source, /清理记录/);
  assert.match(source, /暂未提供浏览记录清理接口/);
  assert.doesNotMatch(source, /清理成功|已清空/);
});

test('添加菜谱不再暴露草稿，并防止保存重复提交', async () => {
  const source = await read('../src/pages/recipe-create/index.vue');
  assert.doesNotMatch(source, /saveDraft|草稿已保存|>草稿</);
  assert.match(source, /isSaving/);
  assert.match(source, /:disabled="isSaving"/);
});

test('所有账号入口均可到达服务协议和隐私政策', async () => {
  for (const page of ['login', 'phone-login', 'register', 'forgot-password']) {
    const source = await read(`../src/pages/${page}/index.vue`);
    assert.match(source, /pages\/legal\/index\?type=/, page);
    assert.match(source, /服务协议/, page);
    assert.match(source, /隐私政策/, page);
  }
});
