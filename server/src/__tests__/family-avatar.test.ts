import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const readProjectFile = (path: string) => readFile(join(process.cwd(), path), 'utf8');

test('家庭头像使用独立 fileId 关联并通过增量 migration 建立外键', async () => {
  const schema = await readProjectFile('prisma/schema.prisma');
  const migration = await readProjectFile('prisma/migrations/20260724123000_add_family_avatar_file/migration.sql');

  assert.match(schema, /avatarFileId\s+Int\?\s+@map\("avatar_file_id"\)/);
  assert.match(schema, /avatarFile\s+File\?\s+@relation\("FamilyAvatar"/);
  assert.match(schema, /familyAvatars\s+Family\[\]\s+@relation\("FamilyAvatar"\)/);
  assert.match(migration, /ADD COLUMN "avatar_file_id" INTEGER/);
  assert.match(migration, /FOREIGN KEY \("avatar_file_id"\) REFERENCES "files"\("id"\)/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/i);
});

test('家庭头像更新只接受当前用户上传的有效图片并校验至少 512 像素', async () => {
  const source = await readProjectFile('src/routes/api/mobile.ts');

  assert.match(source, /member\.role === 'MEMBER'/);
  assert.match(source, /uploaderId:\s*userId/);
  assert.match(source, /mimeType:\s*\{\s*startsWith:\s*'image\/'\s*\}/);
  assert.match(source, /width:\s*\{\s*gte:\s*512\s*\}/);
  assert.match(source, /height:\s*\{\s*gte:\s*512\s*\}/);
  assert.match(source, /家庭头像文件无效或无权使用/);
});

test('被家庭头像引用的文件不能被删除', async () => {
  const source = await readProjectFile('src/routes/files.ts');

  assert.match(source, /familyAvatars:\s*true/);
  assert.match(source, /_count\.familyAvatars/);
});
