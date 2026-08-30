import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(
  new URL('../src/app/pages/ResourceAccessCenterPage.tsx', import.meta.url),
  'utf8'
);

const getFunctionSource = (name, nextName) => {
  const start = pageSource.indexOf(`const ${name} = async () => {`);
  const end = pageSource.indexOf(`const ${nextName} = async () => {`, start + 1);
  assert.notEqual(start, -1, `missing ${name}`);
  assert.notEqual(end, -1, `missing ${nextName}`);
  return pageSource.slice(start, end);
};

test('API provider chosen for synchronization does not filter staged import records', () => {
  const refreshSource = getFunctionSource('refresh', 'refreshProviders');
  const categoriesSource = getFunctionSource('refreshCategories', 'handleTestProvider');

  assert.doesNotMatch(refreshSource, /providerId:\s*selectedProviderFilter/);
  assert.doesNotMatch(categoriesSource, /providerId:\s*selectedProviderFilter/);
});
