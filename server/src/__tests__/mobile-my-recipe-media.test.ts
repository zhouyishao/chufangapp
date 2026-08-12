import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const readProjectFile = (path: string) => readFile(join(process.cwd(), path), 'utf8');

test('我的菜谱接口接收封面、视频和步骤媒体文件 ID', async () => {
  const source = await readProjectFile('src/routes/api/mobile.ts');

  assert.match(source, /coverFileId:\s*z\.coerce\.number\(\)\.int\(\)\.positive\(\)/);
  assert.match(source, /videoFileId:\s*z\.coerce\.number\(\)\.int\(\)\.positive\(\)/);
  assert.match(source, /mediaFileId:\s*z\.coerce\.number\(\)\.int\(\)\.positive\(\)/);
  assert.match(source, /mediaKind:\s*z\.enum\(\['IMAGE',\s*'VIDEO'\]\)/);
});

test('我的菜谱在事务中锁定当前用户上传的媒体并建立数据库引用', async () => {
  const source = await readProjectFile('src/routes/api/mobile.ts');

  assert.match(source, /prisma\.\$transaction/);
  assert.match(source, /lockOwnedActiveMediaFiles\(transaction,\s*mediaFileIds,\s*userId\)/);
  assert.match(source, /coverFileId:\s*parsed\.data\.coverFileId/);
  assert.match(source, /videoFileId:\s*parsed\.data\.videoFileId/);
  assert.match(source, /mediaFileId:\s*step\.mediaFileId/);
  assert.match(source, /mediaKind:\s*step\.mediaKind/);
});

test('我的菜谱支持仅限作者的更新和软删除', async () => {
  const source = await readProjectFile('src/routes/api/mobile.ts');

  assert.match(source, /apiMobileRouter\.patch\('\/my-recipes\/:id',\s*requireAppAuth/);
  assert.match(source, /apiMobileRouter\.delete\('\/my-recipes\/:id',\s*requireAppAuth/);
  assert.match(source, /authorId:\s*userId/);
  assert.match(source, /transaction\.recipe\.update/);
  assert.match(source, /deletedAt:\s*new Date\(\)/);
});

test('更新菜谱会重新校验媒体并原子替换用料和步骤', async () => {
  const source = await readProjectFile('src/routes/api/mobile.ts');

  assert.match(source, /lockOwnedActiveMediaFiles\(transaction,\s*mediaFileIds,\s*userId\)/);
  assert.match(source, /transaction\.recipeIngredient\.deleteMany/);
  assert.match(source, /transaction\.recipeStep\.deleteMany/);
  assert.match(source, /ingredients:\s*\{\s*create:/s);
  assert.match(source, /steps:\s*\{\s*create:/s);
});
