import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { REPAIR_REASON, shouldHideRecipe } from '../../prisma/repair-chinese-recipes';

test('Chinese recipe repair is dry-run by default and never deletes rows', () => {
  const script = readFileSync(resolve(__dirname, '../../prisma/repair-chinese-recipes.ts'), 'utf8');
  const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8')) as { scripts: Record<string, string> };

  assert.match(script, /const apply = process\.argv\.includes\('--apply'\)/);
  assert.match(script, /themealdb_recipe/);
  assert.match(script, /mock_recipe/);
  assert.match(script, /status:\s*'IGNORED'/);
  assert.match(script, /isPublish:\s*false/);
  assert.doesNotMatch(script, /\.delete\(|\.deleteMany\(|TRUNCATE|DROP TABLE/);
  assert.equal(packageJson.scripts['data:repair-chinese-recipes'], 'tsx prisma/repair-chinese-recipes.ts');
  assert.equal(packageJson.scripts['data:repair-chinese-recipes:apply'], 'tsx prisma/repair-chinese-recipes.ts --apply');
});

test('Chinese recipe repair exposes an idempotent recipe candidate classifier', () => {
  const script = readFileSync(resolve(__dirname, '../../prisma/repair-chinese-recipes.ts'), 'utf8');

  assert.match(script, /export function shouldHideRecipe/);
  assert.match(script, /isPublish:\s*true/);
  assert.match(script, /rejectReason:\s*true/);
  assert.match(script, /REPAIR_REASON/);
});

test('recipe repair excludes only recipes already hidden by its governance reason', () => {
  assert.equal(shouldHideRecipe({
    title: 'Spaghetti Carbonara',
    isPublish: false,
    rejectReason: REPAIR_REASON
  }), false);
  assert.equal(shouldHideRecipe({
    title: 'E2E 测试菜谱',
    isPublish: false,
    rejectReason: REPAIR_REASON
  }), false);

  assert.equal(shouldHideRecipe({
    title: 'Spaghetti Carbonara',
    isPublish: true,
    rejectReason: null
  }), true);
  assert.equal(shouldHideRecipe({
    title: '12345',
    isPublish: false,
    rejectReason: '审核未通过'
  }), true);
  assert.equal(shouldHideRecipe({
    title: 'E2E 测试菜谱',
    isPublish: false,
    rejectReason: '其他下架原因'
  }), true);
});
