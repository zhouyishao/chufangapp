import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const genericPage = await readFile(new URL('../components/GenericMockListPage.tsx', import.meta.url), 'utf8');
const unitsPage = await readFile(new URL('./UnitsPage.tsx', import.meta.url), 'utf8');
const unitForm = await readFile(new URL('./UnitFormPage.tsx', import.meta.url), 'utf8');
const unitDetail = await readFile(new URL('./UnitDetailPage.tsx', import.meta.url), 'utf8');

test('fixed-data pages are explicitly labeled and cannot pretend to persist writes', () => {
  assert.match(genericPage, /演示数据/);
  assert.match(genericPage, /尚未接入真实后端/);
  assert.doesNotMatch(genericPage, /更新成功|新增成功|状态修改成功|删除成功/);
  assert.doesNotMatch(genericPage, /setItems/);
});

test('unit routes no longer expose mock persistence', () => {
  for (const source of [unitsPage, unitForm, unitDetail]) {
    assert.match(source, /PagePlaceholder/);
    assert.doesNotMatch(source, /mockUnits|保存成功|handleDelete|handleToggleStatus/);
  }
});
