import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getMinimumManualContentCount,
  getMissingCoverContentIds,
  getContentTypeChangeImpact,
  isDisplayStyleCompatibleWithContent,
  resolveDefaultModuleContentType
} from '../src/app/home-module-form-rules';

test('新模块默认继承所属频道内容类型，但仍允许运营人员主动修改', () => {
  assert.equal(resolveDefaultModuleContentType('recipe'), 'RECIPE');
  assert.equal(resolveDefaultModuleContentType('ingredient'), 'INGREDIENT');
  assert.equal(resolveDefaultModuleContentType('fruit'), 'FRUIT');
  assert.equal(resolveDefaultModuleContentType('beverage'), 'BEVERAGE');
});

test('展示模板不能修改内容类型', () => {
  assert.deepEqual(getContentTypeChangeImpact('RECIPE', 'RECIPE'), {
    changed: false,
    clearSelections: false
  });
  assert.deepEqual(getContentTypeChangeImpact('RECIPE', 'INGREDIENT'), {
    changed: true,
    clearSelections: true
  });
});

test('不兼容当前内容类型的展示模板不可选择，但不会自动改变类型', () => {
  assert.equal(isDisplayStyleCompatibleWithContent(['INGREDIENT', 'FRUIT'], 'RECIPE'), false);
  assert.equal(isDisplayStyleCompatibleWithContent(['RECIPE', 'INGREDIENT'], 'RECIPE'), true);
});

test('图片型模块能识别已选内容中缺少封面的项目', () => {
  assert.deepEqual(getMissingCoverContentIds(
    [{ id: '11' }, { id: '12' }, { id: '13' }],
    {
      11: { cover: '/uploads/potato.webp' },
      12: { cover: null },
      13: { cover: '   ' }
    }
  ), ['12', '13']);
});

test('时令横滑模块至少配置五项，才能形成原型中的右侧露出', () => {
  assert.equal(getMinimumManualContentCount('SEASONAL_PRODUCE'), 5);
  assert.equal(getMinimumManualContentCount('SEASONAL_INGREDIENTS'), 5);
  assert.equal(getMinimumManualContentCount('SEASONAL_FRUITS'), 5);
  assert.equal(getMinimumManualContentCount('HOME_RECIPES'), 1);
  assert.equal(getMinimumManualContentCount(null), 1);
});
