import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('全局按钮清除 uni-app 默认盒模型，图标与文字使用统一居中基线', async () => {
  const source = await read('src/styles/global.scss');

  assert.match(source, /button\s*\{[^}]*margin:\s*0;/s);
  assert.match(source, /button\s*\{[^}]*padding:\s*0;/s);
  assert.match(source, /button\s*\{[^}]*line-height:\s*normal;/s);
  assert.match(source, /button::after\s*\{[^}]*border:\s*0;/s);
  assert.match(source, /\.app-icon-button\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/s);
});

test('创建家庭的返回与主按钮都有明确的 flex 居中规则', async () => {
  const source = await read('src/pages/family-create/index.vue');

  assert.match(source, /\.nav-button\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/s);
  assert.match(source, /\.primary-button\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/s);
});

test('添加菜谱采用四阶段原型结构，并使用居中的三列头部', async () => {
  const source = await read('src/pages/recipe-create/index.vue');

  assert.match(source, /class="recipe-create-header"/);
  assert.match(source, /class="create-progress"/);
  assert.match(source, /class="create-progress-label"/);
  assert.match(source, /\{\{\s*currentStage\s*\}\}\s*\/\s*4/);
  assert.match(source, /class="create-progress__dot"/);
  assert.match(source, /基本信息/);
  assert.match(source, /用料设置/);
  assert.match(source, /制作步骤/);
  assert.match(source, /确认发布/);
  assert.match(source, /\.recipe-create-header\s*\{[^}]*grid-template-columns:\s*var\(--touch-target\)\s+1fr\s+var\(--touch-target\);/s);
  assert.doesNotMatch(source, /class="topbar glass-card"/);
  assert.doesNotMatch(source, /class="bottom-actions glass-card"/);
});

test('添加菜谱首屏遵循冻结原型的信息密度，只承载名称与封面媒体', async () => {
  const source = await read('src/pages/recipe-create/index.vue');
  const firstStage = source.match(
    /<section v-if="currentStage === 1"[\s\S]*?<\/section>\s*<section v-else-if="currentStage === 2"/
  )?.[0] ?? '';

  assert.match(firstStage, /基本信息与封面/);
  assert.match(firstStage, /先写名称，再添加至少一张图片或视频/);
  assert.match(firstStage, /maxlength="30"/);
  assert.match(firstStage, /class="media-count"/);
  assert.doesNotMatch(firstStage, /一句介绍/);
  assert.doesNotMatch(firstStage, /class="quick-grid"/);
});

test('添加菜谱底部动作等宽，首阶段主操作可独占整行', async () => {
  const source = await read('src/pages/recipe-create/index.vue');

  assert.match(source, /\.create-bottom-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(source, /\.create-bottom-actions__primary--full\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s);
});

test('添加菜谱只保留当前原型样式，旧头部与旧底部栏不会继续参与布局', async () => {
  const source = await read('src/pages/recipe-create/index.vue');
  const recipePageRules = source.match(/\.recipe-create-page\s*\{/g) ?? [];

  assert.equal(recipePageRules.length, 1);
  assert.doesNotMatch(source, /^\.topbar\s*\{/m);
  assert.doesNotMatch(source, /^\.icon-button\s*\{/m);
  assert.doesNotMatch(source, /^\.bottom-actions\s*\{/m);
  assert.doesNotMatch(source, /^\.primary-button(?:,|\s*\{)/m);
  assert.doesNotMatch(source, /^\.secondary-button(?:,|\s*\{)/m);
});

test('添加菜谱用料阶段具有清晰的清单层级和完成数量', async () => {
  const source = await read('src/pages/recipe-create/index.vue');
  const ingredientStage = source.match(
    /<section v-else-if="currentStage === 2"[\s\S]*?<\/section>\s*<section v-else-if="currentStage === 3"/
  )?.[0] ?? '';

  assert.match(ingredientStage, /菜谱信息与用料/);
  assert.match(ingredientStage, /class="ingredient-section-head"/);
  assert.match(ingredientStage, /用料清单/);
  assert.match(ingredientStage, /\{\{\s*completedIngredientCount\s*\}\}\s*项/);
  assert.match(ingredientStage, /placeholder="食材名称"/);
  assert.match(ingredientStage, /placeholder="用量，例如 500g"/);
});

test('添加菜谱步骤支持标题、真实视频路径和独立媒体删除', async () => {
  const source = await read('src/pages/recipe-create/index.vue');

  assert.match(source, /class="step-title-input"/);
  assert.match(source, /placeholder="步骤标题，例如：处理鲈鱼"/);
  assert.match(source, /@tap="removeStepMedia\(index,\s*'image'\)"/);
  assert.match(source, /@tap="removeStepMedia\(index,\s*'video'\)"/);
  assert.match(source, /result\.tempFilePath/);
  assert.doesNotMatch(source, /steps\.value\[index\]\.video\s*=\s*'local-video'/);
});

test('添加菜谱确认阶段预览真实用料与图文步骤', async () => {
  const source = await read('src/pages/recipe-create/index.vue');
  const previewStage = source.match(
    /<section v-else class="form-section create-preview"[\s\S]*?<\/section>\s*<\/main>/
  )?.[0] ?? '';

  assert.match(previewStage, /class="preview-ingredient-list"/);
  assert.match(previewStage, /v-for="ingredient in completedIngredients"/);
  assert.match(previewStage, /class="preview-step-list"/);
  assert.match(previewStage, /v-for="\(step, index\) in completedSteps"/);
  assert.match(previewStage, /class="preview-step__media"/);
});
