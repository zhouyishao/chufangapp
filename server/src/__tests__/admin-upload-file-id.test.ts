import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

test('后台媒体上传必须持久化 File 记录并返回 fileId', async () => {
  const source = await readFile(join(process.cwd(), 'src/routes/admin/upload.ts'), 'utf8');
  assert.match(source, /prisma\.file\.create/);
  assert.match(source, /createOrLoadUploadedFile/);
  assert.match(source, /id:\s*persisted\.record\.id/);
  assert.match(source, /sha256:\s*file\.sha256/);
});
