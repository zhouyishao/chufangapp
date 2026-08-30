import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./index.vue', import.meta.url), 'utf8');

const rule = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
  assert.ok(match, `missing ${selector}`);
  return match[1];
};

test('profile editor uses a compact settings list instead of a large hero card', () => {
  assert.doesNotMatch(source, /class="profile-hero/);
  assert.match(source, /class="profile-card/);
  assert.match(source, /class="profile-avatar-row/);
  assert.match(rule('.profile-avatar-row'), /min-height:\s*164rpx/);
});

test('avatar guidance stays beside the avatar control without an overlapping badge', () => {
  assert.doesNotMatch(source, /class="avatar-action/);
  assert.match(source, /JPG、PNG、WebP · 512×512 以上 · 不超过 5MB/);
  assert.match(rule('.avatar'), /width:\s*120rpx/);
  assert.match(rule('.avatar'), /height:\s*120rpx/);
});

test('nickname and bio share the same list vocabulary', () => {
  assert.match(source, /class="profile-field-row/);
  assert.match(rule('.profile-field-row'), /border-top:\s*1rpx solid var\(--app-border\)/);
  assert.match(rule('.text-input'), /text-align:\s*right/);
});
