import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readPage = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('family directory keeps the frozen grouped-list geometry', async () => {
  const source = await readPage('./index.vue');

  assert.ok(/class="family-list"/.test(source), 'family list should exist');
  assert.ok(/grid-template-columns:\s*80rpx minmax\(0,\s*1fr\) auto 28rpx/.test(source), 'family row should keep frozen columns');
  assert.ok(/min-height:\s*144rpx/.test(source), 'family row should keep frozen height');
  assert.ok(/padding:\s*24rpx 28rpx/.test(source), 'family row should keep frozen padding');
  assert.ok(/background:\s*var\(--app-surface\)/.test(source), 'family list should use the shared surface');
});

test('family member management follows the frozen summary-directory-action structure', async () => {
  const source = await readPage('../family-manage/index.vue');

  assert.ok(!/class="family-profile"/.test(source), 'member page should not duplicate family profile');
  assert.ok(!/class="family-settings"/.test(source), 'member page should not mix in family settings');
  assert.ok(/class="family-member-summary"/.test(source), 'member summary should exist');
  assert.ok(/class="family-member-directory"/.test(source), 'member directory should exist');
  assert.ok(/class="family-danger-zone"/.test(source), 'danger zone should exist');
  assert.ok(/class="invite-action"/.test(source), 'invite action should exist');
});
