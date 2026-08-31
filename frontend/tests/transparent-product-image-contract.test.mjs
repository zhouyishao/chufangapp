import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('recipe ingredient cards use linked transparent product images without a cover fallback', async () => {
  const page = await readSource('../src/pages/recipe-detail/index.vue');
  const api = await readSource('../src/services/public-api.ts');

  assert.match(api, /transparentImage:\s*string\s*\|\s*null/);
  assert.match(page, /item\.ingredient\?\.transparentImage/);
  assert.doesNotMatch(page, /item\.ingredient\?\.cover/);
  assert.doesNotMatch(page, /exact\?\.transparentImage/);
  assert.match(page, /mode="aspectFit"/);
});

test('all admin content forms expose a dedicated transparent image uploader', async () => {
  const files = [
    '../../admin-frontend/src/app/pages/IngredientFormPage.tsx',
    '../../admin-frontend/src/app/pages/SeasoningFormPage.tsx',
    '../../admin-frontend/src/app/pages/BeverageFormPage.tsx'
  ];

  for (const file of files) {
    const source = await readSource(file);
    assert.match(source, /TransparentImageUpload/);
    assert.match(source, /value=\{draft\.transparentImage\}/);
  }

  const uploader = await readSource('../../admin-frontend/src/app/components/TransparentImageUpload.tsx');
  assert.match(uploader, /透明实物图/);
  assert.match(uploader, /PNG\/WebP/);
  assert.match(uploader, /未配置时自动使用详情封面图/);
});
