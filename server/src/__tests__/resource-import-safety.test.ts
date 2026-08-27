import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { normalizeResourcePayload } from '../services/resource-import/validator';

test('recipe import preserves structured steps and their media metadata', () => {
  const payload = normalizeResourcePayload('RECIPE', {
    name: '清蒸鲈鱼',
    ingredients: [{ name: '鲈鱼', amount: '1条' }],
    steps: [{ sortIndex: 2, title: '蒸制', description: '大火蒸八分钟', image: 'https://example.com/step.webp', video: 'https://example.com/step.mp4', timerSeconds: 480, tip: '关火后焖两分钟' }]
  });

  assert.deepEqual(payload.steps, [{
    sortIndex: 2,
    title: '蒸制',
    description: '大火蒸八分钟',
    image: 'https://example.com/step.webp',
    video: 'https://example.com/step.mp4',
    timerSeconds: 480,
    tip: '关火后焖两分钟'
  }]);
});

test('recipe spreadsheet traceability columns map to the governed source fields', () => {
  const payload = normalizeResourcePayload('RECIPE', {
    名称: '番茄炒蛋',
    来源名称: '家庭菜谱整理',
    '外部 ID': 'home-tomato-eggs-001',
    外部链接: 'https://example.com/recipes/home-tomato-eggs-001'
  });

  assert.equal(payload.sourceName, '家庭菜谱整理');
  assert.equal(payload.externalId, 'home-tomato-eggs-001');
  assert.equal(payload.externalUrl, 'https://example.com/recipes/home-tomato-eggs-001');
});

test('resource confirmation imports pending rows only and keeps imported content unpublished', () => {
  const route = readFileSync(resolve(__dirname, '../routes/admin/resources.ts'), 'utf8');
  const importer = readFileSync(resolve(__dirname, '../services/resource-import/importer.ts'), 'utf8');

  assert.match(route, /status:\s*'PENDING'/);
  assert.match(importer, /isPublish:\s*false/g);
  assert.match(importer, /auditStatus:\s*'PENDING'/g);
});

test('mobile favorites and histories select the actual beverage cover field', () => {
  const route = readFileSync(resolve(__dirname, '../routes/api/mobile.ts'), 'utf8');
  assert.doesNotMatch(route, /beverage:\s*\{\s*select:\s*\{[^}]*\bcover:\s*true/);
  assert.match(route, /beverage:\s*\{\s*select:\s*\{[^}]*coverImage:\s*true/);
});
