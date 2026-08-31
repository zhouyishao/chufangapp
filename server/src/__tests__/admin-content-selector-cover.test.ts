import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

test('后台内容选择器返回封面与文件封面，便于发布前识别缺图内容', async () => {
  const source = await readFile(join(process.cwd(), 'src/routes/admin/content-selector.ts'), 'utf8');

  assert.match(source, /coverFile:\s*\{\s*select:\s*\{\s*url:\s*true/);
  assert.match(source, /cover:\s*item\.coverFile\?\.url\s*\?\?\s*item\.cover/);
  assert.match(source, /cover:\s*item\.coverFile\?\.url\s*\?\?\s*item\.coverImage/);
});
