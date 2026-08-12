import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const uploadService = fs.readFileSync(path.join(root, 'src/services/file-upload.ts'), 'utf8');
const recipeCreate = fs.readFileSync(path.join(root, 'src/pages/recipe-create/index.vue'), 'utf8');

test('内容媒体复用统一鉴权上传服务，而不是把临时路径当成持久资源', () => {
  assert.match(uploadService, /export type UploadPurpose = [^;]*'content'/);
  assert.match(uploadService, /export const uploadContentFile/);
  assert.match(uploadService, /uploadAvatarFile\(filePath,\s*options,\s*'content'\)/);
});

test('添加菜谱封面和步骤媒体保存上传结果，并保留文件 ID', () => {
  assert.match(recipeCreate, /uploadContentFile/);
  assert.match(recipeCreate, /coverFileId/);
  assert.match(recipeCreate, /imageFileId/);
  assert.match(recipeCreate, /videoFileId/);
  assert.match(recipeCreate, /uploaded\.url/);
  assert.match(recipeCreate, /uploaded\.id/);
  assert.doesNotMatch(recipeCreate, /steps\.value\[index\]\.video\s*=\s*result\.tempFilePath/);
});

test('上传中阻止进入下一阶段，失败后提供原文件重试', () => {
  assert.match(recipeCreate, /isUploadingMedia/);
  assert.match(recipeCreate, /pendingMediaPath/);
  assert.match(recipeCreate, /retryCoverUpload/);
  assert.match(recipeCreate, /retryStepMediaUpload/);
  assert.match(recipeCreate, /媒体正在上传，请稍候/);
});
