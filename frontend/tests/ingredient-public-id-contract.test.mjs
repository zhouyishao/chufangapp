import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('ingredient consumers preserve public ids from backend modules through detail loading', async () => {
  const api = await readSource('../src/services/public-api.ts');
  const ingredient = await readSource('../src/pages/ingredient-detail/index.vue');
  const fruit = await readSource('../src/pages/fruit-detail/index.vue');
  const seasoning = await readSource('../src/pages/seasoning-detail/index.vue');

  assert.match(api, /getIngredient\s*=\s*async\s*\(id:\s*string\s*\|\s*number\)/);
  assert.match(api, /\/ingredients\/\$\{encodeURIComponent\(String\(id\)\)\}/);

  for (const [name, source] of [
    ['ingredient', ingredient],
    ['fruit', fruit],
    ['seasoning', seasoning]
  ]) {
    assert.doesNotMatch(source, /Number\.isFinite\(Number\(id\)\)/, `${name} must accept public ids`);
    assert.doesNotMatch(source, /getIngredient\(Number\(id\)\)/, `${name} must not coerce public ids`);
  }
});
