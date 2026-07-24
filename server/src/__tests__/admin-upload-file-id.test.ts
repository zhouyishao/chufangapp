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

test('内容写入保留旧 URL 兼容，同时回填主图与图集的 fileId', async () => {
  const schema = await readFile(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
  const migration = await readFile(join(process.cwd(), 'prisma/migrations/20260724130000_add_content_media_file_ids/migration.sql'), 'utf8');
  for (const field of ['coverFileId', 'detailImageFileIds', 'selectionMediaFileId', 'imageFileIds', 'videoFileId', 'galleryFileIds']) {
    assert.match(schema, new RegExp(field));
    assert.match(migration, new RegExp(field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)));
  }
  for (const route of ['src/routes/admin/recipes.ts', 'src/routes/admin/ingredients.ts', 'src/routes/admin/beverages.ts']) {
    const source = await readFile(join(process.cwd(), route), 'utf8');
    assert.match(source, /resolveActiveFileId/);
    assert.match(source, /lockActiveMediaFiles/);
  }
});
