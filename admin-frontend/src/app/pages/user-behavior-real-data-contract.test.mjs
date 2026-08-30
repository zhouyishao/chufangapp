import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('./UserBehaviorPage.tsx', import.meta.url), 'utf8');
const api = await readFile(new URL('../api.ts', import.meta.url), 'utf8');

test('user behavior page renders a real unified event timeline', () => {
  assert.match(page, /listUserBehavior/);
  assert.match(page, /浏览内容/);
  assert.match(page, /收藏内容/);
  assert.match(page, /执行搜索/);
  assert.match(page, /加入菜篮/);
  assert.match(api, /\/users\/behavior\?/);
  assert.doesNotMatch(page, /PagePlaceholder|等待后续业务开发/);
});
