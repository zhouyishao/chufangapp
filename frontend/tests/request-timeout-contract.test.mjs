import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const requestSource = await readFile(new URL('../src/services/public-api.ts', import.meta.url), 'utf8');

test('authenticated requests have an abortable hard timeout on H5', () => {
  assert.match(requestSource, /const timeoutMs = options\.timeout \?\? 15000/);
  assert.match(requestSource, /requestTask\.abort\?\.\(\)/);
  assert.match(requestSource, /请求超时，请检查网络后重试/);
  assert.match(requestSource, /if \(settled\) return/);
});
