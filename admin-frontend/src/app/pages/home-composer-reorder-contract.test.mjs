import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(new URL('./HomeComposerPage.tsx', import.meta.url), 'utf8');
const apiSource = await readFile(new URL('../api.ts', import.meta.url), 'utf8');

test('home composer saves module order with one dedicated request', () => {
  const saveOrderBlock = pageSource.slice(
    pageSource.indexOf('const saveOrder = async () =>'),
    pageSource.indexOf('const publishChannel = async () =>')
  );

  assert.match(apiSource, /reorderContentModules/);
  assert.match(apiSource, /\/modules\/reorder/);
  assert.match(saveOrderBlock, /reorderContentModules/);
  assert.doesNotMatch(saveOrderBlock, /Promise\.all/);
  assert.doesNotMatch(saveOrderBlock, /updateContentModule/);
});
