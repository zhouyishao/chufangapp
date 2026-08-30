import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { localizeResourcePayload } from '../services/resource-import/localize';
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

test('domestic UAPI ingredient rows keep Chinese names, images, and nutrition data', () => {
  const payload = normalizeResourcePayload('FRUIT', {
    code: 'pingguo_junzhi',
    name: '苹果',
    calory: '53',
    carbohydrate: 13.7,
    weight: '100',
    thumb_image_url: 'https://example.com/apple.webp'
  });

  assert.equal(payload.name, '苹果');
  assert.equal(payload.externalId, 'pingguo_junzhi');
  assert.equal(payload.cover, 'https://example.com/apple.webp');
  assert.match(payload.nutrition ?? '', /热量 53 kcal/);
  assert.match(payload.nutrition ?? '', /碳水 13\.7 g/);
});

test('legacy overseas fruit rows are localized before display and confirmation', () => {
  const payload = localizeResourcePayload('FRUIT', {
    name: 'Banana',
    categoryName: 'Musaceae',
    externalId: '1'
  });

  assert.equal(payload.name, '香蕉');
  assert.equal(payload.categoryName, '芭蕉科');
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
