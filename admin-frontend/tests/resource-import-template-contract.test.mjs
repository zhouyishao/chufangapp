import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8').catch(() => '');

test('resource import templates are type-specific and include a dedicated instruction sheet', async () => {
  const page = await readSource('../src/app/pages/ResourceAccessCenterPage.tsx');
  const templates = await readSource('../src/app/resource-import-template.ts');

  assert.match(page, /buildResourceImportWorkbook\(type\)/);
  assert.match(templates, /RECIPE:\s*\{/);
  assert.match(templates, /INGREDIENT:\s*\{/);
  assert.match(templates, /FRUIT:\s*\{/);
  assert.match(templates, /SEASONING:\s*\{/);
  assert.match(templates, /BEVERAGE:\s*\{/);
  assert.match(templates, /book_append_sheet\(workbook, dataSheet, '填写模板'\)/);
  assert.match(templates, /book_append_sheet\(workbook, instructionSheet, '填写说明'\)/);
});

test('examples do not pollute imported names and detailed beverage fields are documented', async () => {
  const templates = await readSource('../src/app/resource-import-template.ts');

  assert.doesNotMatch(templates, /\(必填\)|（必填）/);
  for (const field of ['用料', '调制步骤', '杯型', '基酒', '调制方式', '装饰', '风味标签', '场景标签']) {
    assert.match(templates, new RegExp(`'${field}'`));
  }
  assert.match(templates, /required:\s*true/);
});
