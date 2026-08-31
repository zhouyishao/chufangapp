import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeResourcePayload } from '../services/resource-import/validator';

test('酒水导入识别下载模板中的中文扩展字段', () => {
  const mapped = normalizeResourcePayload('BEVERAGE', {
    名称: '莫吉托',
    杯型: '高球杯',
    基酒: '白朗姆酒',
    调制方式: '摇和',
    装饰: '薄荷叶',
    风味标签: '清爽,柑橘',
    场景标签: '夏日,聚会',
    用料: '白朗姆酒 45ml, 青柠汁 20ml',
    调制步骤: '加入冰块。\n摇匀后倒入杯中。'
  });

  assert.equal(mapped.glassType, '高球杯');
  assert.equal(mapped.baseSpirit, '白朗姆酒');
  assert.equal(mapped.cocktailMethod, '摇和');
  assert.equal(mapped.garnish, '薄荷叶');
  assert.deepEqual(mapped.flavorTags, ['清爽', '柑橘']);
  assert.deepEqual(mapped.sceneTags, ['夏日', '聚会']);
  assert.equal(mapped.ingredients?.length, 2);
  assert.match(mapped.instructions ?? '', /摇匀后倒入杯中/);
});
