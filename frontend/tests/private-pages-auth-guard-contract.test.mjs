import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const files = [
  '../src/pages/favorites/index.vue',
  '../src/pages/recent-views/index.vue',
  '../src/pages/purchase-history/index.vue'
];

test('private asset pages redirect unauthenticated users before loading empty data', async () => {
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /const guardPrivatePage = \(\) =>/);
    assert.match(source, /uni\.reLaunch\(\{ url: '\/pages\/phone-login\/index' \}\)/);
    assert.match(source, /if \(!guardPrivatePage\(\)\) return/);
    assert.match(source, /onLoad\(\(\) =>/);
    assert.match(source, /guardPrivatePage\(\);/);
  }
});
