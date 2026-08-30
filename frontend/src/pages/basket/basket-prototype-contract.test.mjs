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

test('basket header follows the frozen compact vertical rhythm', () => {
  assert.match(rule('.basket-shell'), /padding-top:\s*calc\(var\(--app-safe-area-top\) \+ 12px\)/);
  assert.match(rule('.basket-heading'), /margin:\s*0 0 8rpx/);
  assert.match(rule('.basket-summary'), /margin-top:\s*0/);
});

test('basket mode switch fills both columns and keeps the active half-width background', () => {
  assert.match(rule('.mode-button'), /width:\s*100%/);
  assert.match(rule('.mode-button'), /min-height:\s*88rpx/);
  assert.match(rule('.mode-button'), /margin:\s*0/);
  assert.match(rule('.mode-button:first-child.is-active'), /border-radius:\s*20rpx 0 0 20rpx/);
  assert.match(rule('.mode-button:last-child.is-active'), /border-radius:\s*0 20rpx 20rpx 0/);
});

test('family preferences remain visible directly below the mode switch', () => {
  assert.match(rule('.mode-switch'), /margin-bottom:\s*0/);
  assert.match(rule('.basket-preferences'), /min-height:\s*104rpx/);
});

test('purchase completion stays above the bottom navigation without covering content', () => {
  assert.match(rule('.basket-page'), /padding:\s*0 40rpx calc\(344rpx \+ var\(--app-safe-area-bottom\)\)/);
  assert.match(rule('.basket-complete-action'), /position:\s*fixed/);
  assert.match(rule('.basket-complete-action'), /bottom:\s*calc\(var\(--app-safe-area-bottom\) \+ 88px\)/);
  assert.match(rule('.basket-complete-action'), /left:\s*50%/);
  assert.match(rule('.basket-complete-action'), /max-width:\s*353px/);
  assert.match(rule('.basket-complete-action'), /transform:\s*translateX\(-50%\)/);
});

test('price sheet keeps names, inputs and controls on stable baselines', () => {
  assert.match(source, /<button class="price-panel__close"[^>]*aria-label="关闭价格记录"/);
  assert.match(rule('.price-panel__close'), /width:\s*88rpx/);
  assert.match(rule('.price-panel__close'), /height:\s*88rpx/);
  assert.match(rule('.price-row'), /grid-template-columns:\s*minmax\(0, 1fr\) 260rpx/);
  assert.match(rule('.price-row__field'), /box-sizing:\s*border-box/);
  assert.match(rule('.price-row__field'), /width:\s*100%/);
  assert.match(rule('.price-input'), /text-align:\s*right/);
});
