import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSeasonPresentation,
  normalizeGuideItems,
  presentIngredient
} from '../lib/ingredient-presentation';

test('formats continuous, wrapped and separated season ranges for C-end display', () => {
  assert.equal(buildSeasonPresentation('5,6,7,8,9,10', 6).label, '5月—10月');
  assert.equal(buildSeasonPresentation('11,12,1,2', 1).label, '11月—次年2月');
  assert.equal(buildSeasonPresentation('3,4,5,9,10', 7).label, '3月—5月、9月—10月');
  assert.equal(buildSeasonPresentation('5,6,7,8,9,10', 6).isInSeason, true);
});

test('normalizes legacy JSON guide content without exposing internal metadata', () => {
  const guides = normalizeGuideItems(
    JSON.stringify({
      alias: ['马铃薯'],
      englishName: 'Potato',
      items: [
        { title: '看表皮', description: '表皮完整，无发芽和青斑。' },
        { name: '掂重量', text: '同等大小选择更有分量的。' }
      ]
    }),
    '挑选要点'
  );

  assert.deepEqual(guides, [
    { title: '看表皮', description: '表皮完整，无发芽和青斑。' },
    { title: '掂重量', description: '同等大小选择更有分量的。' }
  ]);
  assert.equal(JSON.stringify(guides).includes('englishName'), false);
});

test('presentation DTO keeps detail cover and prefers transparent image for compact cards', () => {
  const dto = presentIngredient({
    id: 1,
    name: '土豆',
    cover: '/hero.jpg',
    transparentImage: '/potato.webp',
    seasonMonth: '5,6,7,8,9,10',
    selectionTips: '[{"title":"看表皮","description":"完整无芽"}]',
    storageMethod: '阴凉通风处保存',
    nutrition: '蒸、煮、炖均可'
  });

  assert.equal(dto.cover, '/hero.jpg');
  assert.equal(dto.displayImage, '/potato.webp');
  assert.equal(dto.season.label, '5月—10月');
  assert.deepEqual(dto.selectionGuide, [{ title: '看表皮', description: '完整无芽' }]);
});
