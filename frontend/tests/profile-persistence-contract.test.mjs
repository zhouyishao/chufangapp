import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('avatar upload uses authenticated cancellable upload task with progress and timeout', async () => {
  const source = await readSource('../src/services/file-upload.ts');

  assert.match(source, /uni\.uploadFile\(/);
  assert.match(source, /\/files\?purpose=\$\{purpose\}/);
  assert.match(source, /Authorization:\s*`Bearer \$\{token\}`/);
  assert.match(source, /timeout:\s*purpose === 'content' \? 120000 : 20000/);
  assert.match(source, /\.onProgressUpdate\(/);
  assert.match(source, /abort:\s*\(\)\s*=>\s*task\?\.abort\(\)/);
  assert.match(source, /handleAuthExpired\(\)/);
});

test('profile service reads and patches remote profile without local profile storage', async () => {
  const source = await readSource('../src/services/profile.ts');

  assert.match(source, /\/mobile\/profile/);
  assert.match(source, /method:\s*'PATCH'/);
  assert.doesNotMatch(source, /getStorageSync|setStorageSync|PROFILE_STORAGE_KEY/);
  assert.doesNotMatch(source, /周末小家|一起把一日三餐/);
});

test('profile pages reload server profile and expose upload retry state', async () => {
  const editSource = await readSource('../src/pages/profile-edit/index.vue');
  const mineSource = await readSource('../src/pages/mine/index.vue');

  assert.match(editSource, /onShow\(/);
  assert.match(editSource, /uploadAvatarFile/);
  assert.match(editSource, /retryAvatarUpload/);
  assert.match(editSource, /avatarFileId/);
  assert.match(mineSource, /getUserProfile\(\)/);
});

test('profile editor isolates load, upload and save state by auth token', async () => {
  const source = await readSource('../src/pages/profile-edit/index.vue');

  assert.match(source, /getAuthToken/);
  assert.match(source, /loadedToken/);
  assert.match(source, /loadingToken/);
  assert.match(source, /requestSequence/);
  assert.match(source, /uploadSequence/);
  assert.match(source, /activeUpload\.value\?\.abort\(\)/);
  assert.match(source, /getAuthToken\(\)\s*!==\s*expectedToken/);
  assert.match(source, /getAuthToken\(\)\s*!==\s*loadedToken\.value/);
  assert.match(source, /draft\.value\s*=\s*getDefaultUserProfile\(\)/);
  assert.match(source, /uploadError\.value\s*=\s*''/);
  assert.match(source, /uploadProgress\.value\s*=\s*0/);
  assert.match(source, /hasLoaded\.value\s*=\s*false/);
});

test('temporary avatar files are deleted on replacement and unload but committed avatar is retained', async () => {
  const uploadSource = await readSource('../src/services/file-upload.ts');
  const editSource = await readSource('../src/pages/profile-edit/index.vue');

  assert.match(uploadSource, /deleteUploadedFile/);
  assert.match(uploadSource, /`\/files\/\$\{fileId\}`/);
  assert.match(uploadSource, /method:\s*'DELETE'/);
  assert.match(editSource, /onUnload/);
  assert.match(editSource, /originalAvatarFileId/);
  assert.match(editSource, /temporaryAvatarFiles/);
  assert.match(editSource, /deleteUploadedFile/);
  assert.match(editSource, /fileId\s*===\s*originalFileId/);
  assert.match(editSource, /temporaryAvatarFiles\.delete\(submittedAvatarFileId\)/);
});

test('temporary avatars retain their upload token across replacement unload and account switch cleanup', async () => {
  const uploadSource = await readSource('../src/services/file-upload.ts');
  const editSource = await readSource('../src/pages/profile-edit/index.vue');

  assert.match(uploadSource, /deleteUploadedFile\s*=\s*async\s*\(\s*fileId:\s*number,\s*tokenOverride\?:\s*string/);
  assert.match(uploadSource, /authToken:\s*tokenOverride/);
  assert.match(editSource, /Map<number,\s*\{\s*token:\s*string;\s*userId:\s*number\s*\}>/);
  assert.match(editSource, /temporaryAvatarFiles\.set\(fileId,\s*\{\s*token,\s*userId\s*\}\)/);
  assert.match(editSource, /deleteUploadedFile\(fileId,\s*owner\.token\)/);
  assert.doesNotMatch(editSource, /console\.(?:log|info|warn|error).*token/i);
});

test('stale upload responses are registered and cleaned without updating the current account UI', async () => {
  const source = await readSource('../src/pages/profile-edit/index.vue');

  assert.match(source, /const file = await controller\.promise/);
  assert.match(source, /registerTemporaryAvatar\(\s*file\.id,\s*expectedToken,\s*expectedUserId/s);
  assert.match(source, /if\s*\(sequence !== uploadSequence\.value \|\| getAuthToken\(\) !== expectedToken\)\s*\{\s*void cleanupTemporaryAvatar\(file\.id\);\s*return;/s);
});

test('failed cleanup persists only non-secret cleanup metadata and retries for the same user', async () => {
  const uploadSource = await readSource('../src/services/file-upload.ts');
  const editSource = await readSource('../src/pages/profile-edit/index.vue');

  assert.match(uploadSource, /PENDING_FILE_CLEANUP_STORAGE_KEY/);
  assert.match(
    uploadSource,
    /type PendingFileCleanupItem = \{\s*userId:\s*number;\s*fileId:\s*number;\s*attempts:\s*number;\s*createdAt:\s*number;\s*\}/s
  );
  assert.match(uploadSource, /enqueuePendingFileCleanup/);
  assert.match(uploadSource, /retryPendingFileCleanup/);
  assert.doesNotMatch(uploadSource, /PendingFileCleanupItem[\s\S]{0,120}token:/);
  assert.match(editSource, /enqueuePendingFileCleanup\(owner\.userId,\s*fileId\)/);
  assert.match(editSource, /retryPendingFileCleanup\(authUser\.id,\s*authUser\.token\)/);
});

test('temporary cleanup is durably queued before delete and dequeued only after success', async () => {
  const source = await readSource('../src/pages/profile-edit/index.vue');
  const cleanupStart = source.indexOf('const cleanupTemporaryAvatar');
  const cleanupEnd = source.indexOf('const cleanupAllTemporaryAvatars', cleanupStart);
  const cleanupSource = source.slice(cleanupStart, cleanupEnd);
  const enqueueIndex = cleanupSource.indexOf('enqueuePendingFileCleanup(owner.userId, fileId)');
  const deleteIndex = cleanupSource.indexOf('await deleteUploadedFile(fileId, owner.token)');
  const removeIndex = cleanupSource.indexOf('removePendingFileCleanup(owner.userId, fileId)');

  assert.ok(cleanupStart >= 0 && cleanupEnd > cleanupStart);
  assert.ok(enqueueIndex >= 0, 'cleanup must persist the file before starting DELETE');
  assert.ok(deleteIndex > enqueueIndex, 'DELETE must start only after the durable queue write');
  assert.ok(removeIndex > deleteIndex, 'queue entry must be removed only after DELETE succeeds');
});

test('uploaded temporary avatars are queued immediately and dequeued immediately after profile save', async () => {
  const source = await readSource('../src/pages/profile-edit/index.vue');
  const registerStart = source.indexOf('const registerTemporaryAvatar');
  const registerEnd = source.indexOf('const cleanupTemporaryAvatar', registerStart);
  const registerSource = source.slice(registerStart, registerEnd);
  const saveStart = source.indexOf('const save = async');
  const saveEnd = source.indexOf('onLoad(', saveStart);
  const saveSource = source.slice(saveStart, saveEnd);

  assert.match(registerSource, /temporaryAvatarFiles\.set\(fileId,\s*\{\s*token,\s*userId\s*\}\)/);
  assert.match(registerSource, /enqueuePendingFileCleanup\(userId,\s*fileId\)/);
  assert.match(saveSource, /removePendingFileCleanup\(submittedAvatarOwner\.userId,\s*submittedAvatarFileId\)/);
});

test('cleanup queue records attempts and age without persisting tokens', async () => {
  const source = await readSource('../src/services/file-upload.ts');

  assert.match(source, /attempts:\s*number/);
  assert.match(source, /createdAt:\s*number/);
  assert.match(source, /MAX_FILE_CLEANUP_ATTEMPTS\s*=\s*[3-9]/);
  assert.match(source, /FILE_CLEANUP_MAX_AGE_MS\s*=\s*7\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  assert.doesNotMatch(source, /type PendingFileCleanupItem[\s\S]{0,180}token:/);
});

test('cleanup queue removes terminal responses and expires repeatedly failing items', async () => {
  const source = await readSource('../src/services/file-upload.ts');

  assert.match(source, /error\.code\s*===\s*404\s*\|\|\s*error\.code\s*===\s*409/);
  assert.match(source, /incrementPendingFileCleanupAttempts/);
  assert.match(source, /item\.attempts\s*<\s*MAX_FILE_CLEANUP_ATTEMPTS/);
  assert.match(source, /now\s*-\s*item\.createdAt\s*<\s*FILE_CLEANUP_MAX_AGE_MS/);
});

test('mine statistics ignore stale account requests using token and request sequence', async () => {
  const source = await readSource('../src/pages/mine/index.vue');

  assert.match(source, /mineRequestSequence/);
  assert.match(source, /refreshUserStats\s*=\s*async\s*\(\s*expectedToken:\s*string,\s*sequence:\s*number/);
  assert.match(source, /loadAuthUser\(\)\?\.token\s*!==\s*expectedToken/);
  assert.match(source, /sequence\s*!==\s*mineRequestSequence\.value/);
});

test('mine page keeps successful personal assets when one summary request fails', async () => {
  const source = await readSource('../src/pages/mine/index.vue');

  assert.match(source, /Promise\.allSettled\(/);
  assert.match(source, /recipesResult\.status\s*===\s*['"]fulfilled['"]/);
  assert.match(source, /myRecipePreviews\.value\s*=\s*recipesResult\.value\.slice\(0,\s*6\)/);
});

test('mine page refreshes personal assets on direct entry and when returning to the page', async () => {
  const source = await readSource('../src/pages/mine/index.vue');

  assert.match(source, /onMounted\(\(\)\s*=>\s*\{\s*void refreshMinePage\(\);?\s*\}\)/);
  assert.match(source, /onShow\(\(\)\s*=>\s*\{\s*void refreshMinePage\(\);?\s*\}\)/);
});

test('upload abort is safe when upload task creation throws synchronously', async () => {
  const source = await readSource('../src/services/file-upload.ts');

  assert.match(source, /let task:\s*UniApp\.UploadTask\s*\|\s*undefined/);
  assert.match(source, /abort:\s*\(\)\s*=>\s*task\?\.abort\(\)/);
});
