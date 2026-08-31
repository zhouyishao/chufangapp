import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('家庭头像使用独立上传用途并支持替换失败清理', async () => {
  const page = await readSource('../src/pages/family-manage/index.vue');
  const upload = await readSource('../src/services/file-upload.ts');

  assert.match(page, /chooseImage/);
  assert.match(page, /'family-avatar'/);
  assert.match(page, /enqueuePendingFileCleanup/);
  assert.match(page, /handlePendingFileCleanupFailure/);
  assert.match(page, /deleteUploadedFile/);
  assert.match(page, /更换家庭头像/);
  assert.match(upload, /UploadPurpose = 'avatar' \| 'family-avatar'/);
});

test('家庭头像区域有空态、预览和上传中的防重复状态', async () => {
  const page = await readSource('../src/pages/family-manage/index.vue');

  assert.match(page, /v-if="currentFamily\.avatar"/);
  assert.match(page, /family-avatar--empty/);
  assert.match(page, /isUploadingAvatar/);
  assert.match(page, /if \(!currentFamily\.value\.id \|\| isUploadingAvatar\.value\) return/);
});
