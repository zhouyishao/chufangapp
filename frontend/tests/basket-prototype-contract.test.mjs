import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const basketSource = await readFile(new URL('../src/pages/basket/index.vue', import.meta.url), 'utf8');

test('basket keeps the confirmed family-first header and scan entry', () => {
  assert.match(basketSource, /class="family-selector"/);
  assert.match(basketSource, /class="scan-button"[^>]*aria-label="扫一扫加入家庭"/);
  assert.match(basketSource, /const goToScan = \(\) =>[\s\S]*pages\/scan\/index/);
  assert.doesNotMatch(basketSource, /meal-ready-button/);
});

test('basket guide opens from an ingredient name and uses the compact acknowledgement flow', () => {
  assert.match(basketSource, /@tap\.stop="openMergedIngredientGuide\(item\)"/);
  assert.match(basketSource, /@tap\.stop="openIngredientGuide\(item\)"/);
  assert.match(basketSource, /挑选要点/);
  assert.match(basketSource, /我知道了/);
  assert.match(basketSource, /getIngredient\(item\.ingredientId\)/);
  assert.doesNotMatch(basketSource, /guide-tabs|guide-tab/);
});

test('basket keeps real family and purchase interactions with the prototype single completion action', () => {
  assert.match(basketSource, /loadFamilies\(\)/);
  assert.match(basketSource, /loadBasketItems\(targetFamilyId\)/);
  assert.match(basketSource, /class="basket-complete-action"/);
  assert.match(basketSource, /完成本次采购 · \$\{checkedCount\} 项/);
  assert.match(basketSource, /@tap="completePurchase"/);
  assert.doesNotMatch(basketSource, /class="action-dock/);
  assert.doesNotMatch(basketSource, /class="dock-button/);
});

test('basket family preference summary enters the current family preference page', () => {
  assert.match(basketSource, /@tap="openPreferencePanel"/);
  assert.match(basketSource, /v-if="isPreferencePanelVisible"/);
  assert.match(basketSource, /class="preference-panel"/);
  assert.match(basketSource, /谁有这些口味/);
  assert.doesNotMatch(basketSource, /pages\/family-preferences\/index\?familyId=/);
  assert.ok(
    basketSource.indexOf('class="mode-switch"') < basketSource.indexOf('class="basket-preferences"'),
    'the view switch must stay above the family preference summary'
  );
});

test('basket matches the compact prototype information hierarchy', () => {
  assert.match(basketSource, /\{\{ basketSummaryText \}\}/);
  assert.match(basketSource, /待采购 \$\{pendingCount\.value\} 项/);
  assert.match(basketSource, /参考约 ¥/);
  assert.match(basketSource, /class="purchase-panel"/);
  assert.match(basketSource, /class="ingredient-source"/);
  assert.match(basketSource, /sourceText:/);
  assert.match(basketSource, /:aria-selected="viewMode === 'merged'"/);
  assert.match(basketSource, /:aria-selected="viewMode === 'recipe'"/);
});

test('basket distinguishes loading and retryable error from a real empty list', () => {
  assert.match(basketSource, /v-if="isLoading"/);
  assert.match(basketSource, /v-else-if="loadError"/);
  assert.match(basketSource, /@tap="loadBasketPage"/);
  assert.match(basketSource, /withBasketDeadline\(loadFamilies\(\)\)/);
  assert.match(basketSource, /同步超时，请检查网络后重试/);
  assert.match(basketSource, /服务暂时不可用，请稍后重试/);
  assert.match(basketSource, /onShow\(\(\) =>[\s\S]*loadBasketPage\(\)/);
  assert.match(basketSource, /onMounted\(\(\) =>[\s\S]*loadBasketPage\(\)/);
  assert.match(basketSource, /if \(activeBasketLoad\) return activeBasketLoad/);
  assert.doesNotMatch(basketSource, /看外观：|看触感：|闻气味：|看边角：|过硬可能未熟/);
});

test('basket write operations prevent duplicate taps and reconcile after failure', () => {
  assert.match(basketSource, /const isMutating = ref\(false\)/);
  assert.match(basketSource, /const runBasketMutation = async/);
  assert.match(basketSource, /rollback\(\)/);
  assert.match(basketSource, /void loadBasketPage\(\)/);
  assert.match(basketSource, /:aria-busy="isMutating"/);
});

test('basket keeps compact phone-sized controls inside the capped H5 canvas', () => {
  assert.match(basketSource, /\.basket-page\s*\{[\s\S]*padding:\s*0 40rpx calc\(344rpx \+ var\(--app-safe-area-bottom\)\)/);
  assert.match(basketSource, /\.scan-button\s*\{[\s\S]*width:\s*44px;[\s\S]*height:\s*44px;/);
  assert.match(basketSource, /\.mode-button\s*\{[\s\S]*min-height:\s*88rpx;/);
  assert.match(basketSource, /\.basket-state\s*\{[\s\S]*min-height:\s*240px;/);
  assert.match(basketSource, /\.basket-state__retry\s*\{[\s\S]*min-width:\s*112px;[\s\S]*min-height:\s*44px;/);
});
