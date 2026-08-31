import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const composer = await readFile(new URL('./HomeComposerPage.tsx', import.meta.url), 'utf8');
const navPage = await readFile(new URL('./TopNavPage.tsx', import.meta.url), 'utf8');

test('home composer and navigation manager explain the same five-channel rule', () => {
  assert.match(composer, /正式 C 端展示排序前 5 个/);
  assert.match(navPage, /完整频道池/);
  assert.match(navPage, /正式 C 端首页只展示排序前 5 个/);
  assert.doesNotMatch(composer, /固定 5 个，不允许增加或改序/);
});
