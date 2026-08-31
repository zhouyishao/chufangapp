import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/ingredients/index.vue', import.meta.url), 'utf8');

test('category page waits for route parameters before the first request', () => {
  assert.match(source, /const routeReady = ref\(false\)/);
  assert.match(source, /const initializeRoute = \(query[\s\S]*routeReady\.value = true;[\s\S]*void fetchModules\(\)/);
  assert.match(source, /onLoad\(\(query[\s\S]*initializeRoute\(query\)/);
  assert.match(source, /onMounted\(\(\) => \{[\s\S]*initializeRoute\(parseH5RouteQuery\(\)\)/);
});

test('category page does not refetch with defaults during its initial onShow', () => {
  assert.match(source, /onShow\(\(\) => \{\s*if \(!routeReady\.value \|\| !modules\.value\.length\) return;/);
});

test('category page adopts the active category label returned by the API', () => {
  assert.match(source, /const activeFilter = extractCategoryFilterData\(result\)\?\.activeKey;/);
  assert.match(source, /if \(currentCategoryId\.value && activeFilter\) currentFilter\.value = activeFilter;/);
});
