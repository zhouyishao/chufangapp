import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const read = (file) => readFile(join(root, file), 'utf8');

test('个人菜谱服务提供真实更新和删除能力', async () => {
  const publicApi = await read('src/services/public-api.ts');
  const recipes = await read('src/services/my-recipes.ts');

  assert.match(publicApi, /export const updateMobileMyRecipe/);
  assert.match(publicApi, /method:\s*'PATCH'/);
  assert.match(publicApi, /export const deleteMobileMyRecipe/);
  assert.match(publicApi, /method:\s*'DELETE'/);
  assert.match(recipes, /export const updateMyRecipe/);
  assert.match(recipes, /export const deleteMyRecipe/);
});

test('添加菜谱页可作为编辑页回填完整内容并保留媒体文件 ID', async () => {
  const source = await read('src/pages/recipe-create/index.vue');

  assert.match(source, /onLoad/);
  assert.match(source, /editingRecipeId/);
  assert.match(source, /findMyRecipeById/);
  assert.match(source, /coverFileId\.value\s*=\s*existing\.coverFileId/);
  assert.match(source, /mediaFileId/);
  assert.match(source, /isEditing\s*\?\s*'编辑菜谱'\s*:\s*'添加菜谱'/);
  assert.match(source, /updateMyRecipe/);
  assert.match(source, /!form\.category\s*&&\s*!isEditing\.value/);
});

test('个人菜谱详情提供带 ID 的编辑入口和二次确认删除', async () => {
  const source = await read('src/pages/my-recipe-detail/index.vue');

  assert.match(source, /recipe-create\/index\?id=/);
  assert.match(source, /uni\.showModal/);
  assert.match(source, /deleteMyRecipe/);
  assert.match(source, /删除后无法恢复/);
  assert.match(source, /isDeleting/);
});
