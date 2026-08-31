import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const uploader = await readFile(new URL('../components/UploadImage.tsx', import.meta.url), 'utf8');

test('content uploader discloses placeholder image validation', () => {
  assert.match(uploader, /拒绝 example\.com 或包含 placeholder 的占位地址/);
});
