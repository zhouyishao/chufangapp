import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageFiles = [
  'src/pages/login/index.vue',
  'src/pages/phone-login/index.vue',
  'src/pages/register/index.vue',
  'src/pages/forgot-password/index.vue'
];

const readPage = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

const cssBlock = (source, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `缺少样式块：${selector}`);
  return match[1];
};

test('登录入口返回按钮固定在头部左侧', async () => {
  const source = await readPage(pageFiles[0]);
  const topbar = cssBlock(source, '.topbar');

  assert.match(topbar, /display:\s*flex/);
  assert.match(topbar, /align-items:\s*center/);
  assert.match(topbar, /justify-content:\s*flex-start/);
  assert.match(topbar, /min-height:\s*72rpx/);
});

for (const file of pageFiles) {
  test(`${file} 的返回按钮重置默认布局并居中图标`, async () => {
    const source = await readPage(file);
    const block = cssBlock(source, '.back-button');

    assert.match(block, /margin:\s*0/);
    assert.match(block, /padding:\s*0/);
    assert.match(block, /line-height:\s*1/);
    assert.match(block, /box-sizing:\s*border-box/);
    assert.match(block, /align-items:\s*center/);
    assert.match(block, /justify-content:\s*center/);
  });

  test(`${file} 的主按钮文字水平垂直居中`, async () => {
    const source = await readPage(file);
    const block = cssBlock(source, '.primary-button');

    assert.match(block, /display:\s*flex/);
    assert.match(block, /align-items:\s*center/);
    assert.match(block, /justify-content:\s*center/);
    assert.match(block, /box-sizing:\s*border-box/);
    assert.match(block, /padding:\s*0\s+24rpx/);
  });
}

test('我的未登录态手机号登录按钮文字水平垂直居中', async () => {
  const source = await readPage('src/pages/mine/index.vue');
  const matches = [...source.matchAll(/\.guest-login\s*\{([^}]*)\}/g)];
  assert.ok(matches.length > 0, '缺少样式块：.guest-login');
  const block = matches.at(-1)[1];

  assert.match(block, /display:\s*flex/);
  assert.match(block, /align-items:\s*center/);
  assert.match(block, /justify-content:\s*center/);
  assert.match(block, /box-sizing:\s*border-box/);
  assert.match(block, /padding:\s*0\s+24rpx/);
  assert.match(block, /line-height:\s*normal/);
});
