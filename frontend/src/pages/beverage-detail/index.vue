<template>
  <view class="detail-page">
    <content-detail-hero
      :src="beverage?.coverImage || ''"
      :alt="`${beverage?.name || '饮品'}主图`"
      :favorite="isFavorite"
      @back="goBack"
      @favorite="toggleFavorite"
      @share="shareContent"
    />

    <content-detail-state v-if="loading" state="loading" />
    <content-detail-state
      v-else-if="error"
      state="error"
      title="饮品内容不可用"
      :description="error"
      @action="loadBeverage"
    />
    <content-detail-state
      v-else-if="!beverage"
      state="empty"
      title="没有找到这份饮品资料"
      description="内容可能已下架或编号无效。"
      @action="goBack"
    />

    <template v-else>
      <main class="detail-content">
        <section class="identity-section">
          <view class="identity-heading">
            <text class="detail-title">{{ beverage.name }}</text>
            <text class="kind-badge">{{ isMixable ? '可调制' : '饮品' }}</text>
          </view>
          <text class="detail-subtitle">{{ identityMeta }}</text>
          <text v-if="parsedSummary" class="detail-description">{{ parsedSummary }}</text>
        </section>

        <section v-if="isMixable" class="mix-section">
          <view class="detail-tabs" role="tablist" aria-label="饮品详情">
            <button
              v-for="tab in mixTabs"
              :key="tab.id"
              :class="['detail-tab', { 'is-active': activeTab === tab.id }]"
              role="tab"
              :aria-selected="activeTab === tab.id"
              @tap="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </view>

          <view v-if="activeTab === 'ingredients'" class="tab-panel" role="tabpanel">
            <text class="panel-title">基酒与辅料</text>
            <view v-if="mixIngredients.length" class="ingredient-grid">
              <view v-for="item in mixIngredients" :key="item.key" class="ingredient-item">
                <view class="ingredient-heading">
                  <text class="ingredient-name">{{ item.name }}</text>
                  <text v-if="item.isBase" class="ingredient-role">基酒</text>
                </view>
                <text class="ingredient-amount">{{ item.amount || '适量' }}</text>
              </view>
            </view>
            <text v-else class="panel-empty">暂无原料说明</text>
          </view>

          <view v-else-if="activeTab === 'tools'" class="tab-panel" role="tabpanel">
            <text class="panel-title">器具</text>
            <view v-if="beverage.tools.length" class="tool-list">
              <text v-for="tool in beverage.tools" :key="tool.id" class="tool-chip">{{ tool.name }}</text>
            </view>
            <text v-else class="panel-empty">这杯饮品不需要特殊器具。</text>
          </view>

          <view v-else class="tab-panel step-panel" role="tabpanel">
            <view class="panel-heading">
              <text class="panel-title">制作步骤</text>
              <text class="step-count">共 {{ beverage.steps.length }} 步</text>
            </view>
            <view v-if="beverage.steps.length" class="step-list">
              <view v-for="(step, index) in beverage.steps" :key="step.id" class="step-item">
                <text class="step-index">{{ String(index + 1).padStart(2, '0') }}</text>
                <view class="step-copy">
                  <text class="step-title">{{ step.title }}</text>
                  <text class="step-description">{{ step.description }}</text>
                  <text v-if="step.timerSeconds" class="step-timer">
                    约 {{ formatTimer(step.timerSeconds) }}
                  </text>
                  <text v-if="step.tip" class="step-tip">{{ step.tip }}</text>
                </view>
              </view>
            </view>
            <text v-else class="panel-empty">暂无分步制作说明</text>
          </view>
        </section>

        <section v-else class="ordinary-section">
          <text class="section-title">饮用信息</text>
          <view class="ordinary-facts">
            <view class="ordinary-fact">
              <text class="fact-label">类别</text>
              <text class="fact-value">{{ beverage.category?.name || beverage.beverageType || '饮品' }}</text>
            </view>
            <view class="ordinary-fact">
              <text class="fact-label">酒精</text>
              <text class="fact-value">{{ alcoholText }}</text>
            </view>
            <view v-if="beverage.glassType" class="ordinary-fact">
              <text class="fact-label">杯型</text>
              <text class="fact-value">{{ beverage.glassType }}</text>
            </view>
          </view>
          <text v-if="parsedDetail" class="ordinary-description">{{ parsedDetail }}</text>
        </section>
      </main>

      <content-detail-bottom-bar
        :primary-label="isMixable ? '去制作' : (isInBasket ? '已加入菜篮' : '加入菜篮')"
        :primary-icon="isMixable ? 'recipe' : (isInBasket ? 'check' : 'basket-action')"
        :primary-disabled="isMixable ? !beverage.steps.length : basketChanging"
        :primary-pressed="!isMixable && isInBasket"
        :secondary-label="isMixable ? (isInBasket ? '已加入菜篮' : '加入菜篮') : ''"
        :secondary-icon="isInBasket ? 'check' : 'basket-action'"
        :secondary-disabled="basketChanging"
        :secondary-pressed="isInBasket"
        @primary="isMixable ? startMaking() : toggleBasket()"
        @secondary="toggleBasket"
      />
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import ContentDetailBottomBar from '../../components/content-detail-bottom-bar.vue';
import ContentDetailHero from '../../components/content-detail-hero.vue';
import ContentDetailState from '../../components/content-detail-state.vue';
import { getDetailPreviewFixture } from '../../dev/detail-preview-fixtures';
import { useContentActions } from '../../composables/use-content-actions';
import { getBeverage, type ApiBeverageDetail } from '../../services/public-api';
import { getContentDetailErrorMessage } from '../../utils/content-detail-error';
import { navigateBackFromContentDetail, resolveDetailEntryOrigin } from '../../utils/content-detail-navigation';

type MixTab = 'ingredients' | 'tools' | 'steps';

const beverage = ref<ApiBeverageDetail | null>(null);
const loading = ref(true);
const error = ref('');
const beverageId = ref('');
const detailEntryOrigin = ref('');
const previewRouteOptions = ref<Record<string, string | undefined>>({});
const activeTab = ref<MixTab>('ingredients');
const isMixable = computed(() => beverage.value?.kind === 'MIXED');
const actionTargetId = computed(() => beverage.value?.id ?? beverageId.value);
const actionName = computed(() => beverage.value?.name ?? '');
const {
  isFavorite,
  isInBasket,
  basketChanging,
  sync: syncActions,
  toggleFavorite,
  toggleBasket
} = useContentActions({
  targetType: 'BEVERAGE',
  targetId: actionTargetId,
  name: actionName
});

const mixTabs: Array<{ id: MixTab; label: string }> = [
  { id: 'ingredients', label: '原料' },
  { id: 'tools', label: '器具' },
  { id: 'steps', label: '步骤' }
];

const parseDescription = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, string | undefined>;
  } catch {
    return null;
  }
};

const parsedDescription = computed(() => parseDescription(beverage.value?.description));
const parsedSummary = computed(
  () => parsedDescription.value?.descriptionText ?? (parsedDescription.value ? '' : beverage.value?.description ?? '')
);
const parsedDetail = computed(() => {
  const parsed = parsedDescription.value;
  if (!parsed) return beverage.value?.instructions || beverage.value?.description || '';
  return [
    parsed.mixMethod ? `调制方式：${parsed.mixMethod}` : '',
    parsed.garnish ? `装饰：${parsed.garnish}` : '',
    parsed.iceType ? `冰块：${parsed.iceType}` : '',
    parsed.mixTips ? `提示：${parsed.mixTips}` : ''
  ].filter(Boolean).join(' · ');
});

const identityMeta = computed(() => {
  const data = beverage.value;
  if (!data) return '';
  return [
    data.category?.name || data.beverageType || '饮品',
    data.isAlcoholic ? `${data.alcoholDegree ?? '未标注'}%vol` : '无酒精',
    data.cocktailMethod || ''
  ].filter(Boolean).join(' · ');
});

const alcoholText = computed(() => {
  const data = beverage.value;
  if (!data?.isAlcoholic) return '无酒精';
  return data.alcoholDegree == null ? '含酒精' : `${data.alcoholDegree}%vol`;
});

const mixIngredients = computed(() => {
  const data = beverage.value;
  if (!data) return [];
  const items = data.ingredientsV2.map((item) => ({
    key: `ingredient-${item.id}`,
    name: item.name,
    amount: item.amount,
    isBase: item.isBase
  }));
  if (data.baseSpirit && !items.some((item) => item.isBase || item.name === data.baseSpirit)) {
    items.unshift({ key: 'base-spirit', name: data.baseSpirit, amount: null, isBase: true });
  }
  return items;
});

const formatTimer = (seconds: number) => {
  if (seconds < 60) return `${seconds} 秒`;
  return `${Math.ceil(seconds / 60)} 分钟`;
};

const readId = (options?: Record<string, string | undefined>) => {
  const direct = options?.id?.trim();
  if (direct) return direct;
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.hash.split('?')[1] || '').get('id')?.trim() || '';
};

const loadBeverage = async () => {
  const id = beverageId.value || readId();
  if (!id) {
    error.value = '缺少有效的饮品编号';
    beverage.value = null;
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    beverageId.value = id;
    beverage.value = getDetailPreviewFixture('beverage', id, previewRouteOptions.value) ?? await getBeverage(id);
    void syncActions().catch(() => undefined);
  } catch (reason) {
    error.value = getContentDetailErrorMessage(reason);
    beverage.value = null;
  } finally {
    loading.value = false;
  }
};

const goBack = () =>
  navigateBackFromContentDetail(
    detailEntryOrigin.value || resolveDetailEntryOrigin(),
    '/pages/ingredients/index?type=beverage'
  );
const shareContent = () => uni.showToast({ title: '已准备分享内容', icon: 'none' });
const startMaking = () =>
  uni.navigateTo({ url: `/pages/cooking/index?type=beverage&id=${encodeURIComponent(beverageId.value)}` });

onLoad((options) => {
  previewRouteOptions.value = options ?? {};
  detailEntryOrigin.value = resolveDetailEntryOrigin(options?.from);
  beverageId.value = readId(options);
  void loadBeverage();
});
onMounted(() => {
  if (!beverage.value && !error.value) void loadBeverage();
});
</script>

<style scoped lang="scss">
.detail-page {
  min-height: 100dvh;
  padding-bottom: calc(152rpx + var(--app-safe-area-bottom));
  background: var(--app-bg);
  color: var(--app-text);
}

.detail-content {
  padding: 0 32rpx;
}

.identity-section {
  padding: 34rpx 0 28rpx;
  border-bottom: 1rpx solid var(--app-border);
}

.identity-heading,
.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.detail-title,
.detail-subtitle,
.detail-description,
.panel-title,
.panel-empty,
.ingredient-name,
.ingredient-amount,
.step-count,
.step-title,
.step-description,
.step-timer,
.step-tip,
.section-title,
.fact-label,
.fact-value,
.ordinary-description,
.state-title,
.state-description {
  display: block;
}

.detail-title {
  min-width: 0;
  font-size: var(--font-size-hero-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-hero-title);
}

.kind-badge {
  flex: 0 0 auto;
  padding: 7rpx 16rpx;
  border-radius: 999rpx;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.detail-subtitle,
.detail-description,
.ordinary-description {
  color: var(--app-text-secondary);
  font-size: var(--font-size-body);
  line-height: var(--line-body);
}

.detail-subtitle {
  margin-top: 8rpx;
}

.detail-description {
  margin-top: 18rpx;
}

.mix-section,
.ordinary-section {
  margin-top: 28rpx;
}

.detail-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1rpx solid var(--app-border);
}

.detail-tab {
  position: relative;
  min-height: 88rpx;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-body);
}

.detail-tab::after,
.state-action::after,
.basket-button::after,
.make-button::after {
  border: 0;
}

.detail-tab.is-active {
  color: var(--app-text);
  font-weight: var(--font-semibold);
}

.detail-tab.is-active::before {
  position: absolute;
  right: 32%;
  bottom: 0;
  left: 32%;
  height: 4rpx;
  border-radius: 999rpx;
  background: var(--app-primary);
  content: '';
}

.tab-panel {
  padding: 30rpx 0 8rpx;
}

.panel-title,
.section-title {
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.panel-empty {
  padding: 32rpx 0;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-body);
}

.ingredient-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rpx;
  margin-top: 20rpx;
  overflow: hidden;
  border-radius: var(--app-radius-card-sm);
  background: var(--app-border);
}

.ingredient-item {
  min-width: 0;
  padding: 22rpx 24rpx;
  background: var(--app-surface-strong);
}

.mix-section .ingredient-grid {
  gap: 0 var(--space-4);
  overflow: visible;
  border-top: 1rpx solid var(--app-border);
  border-bottom: 1rpx solid var(--app-border);
  border-radius: 0;
  background: transparent;
}

.mix-section .ingredient-item {
  min-height: 88rpx;
  padding: var(--space-3) 0;
  border: 0;
  border-bottom: 1rpx solid var(--app-border);
  border-radius: 0;
  background: transparent;
}

.mix-section .ingredient-item:nth-last-child(-n + 2) {
  border-bottom: 0;
}

.ingredient-name,
.step-title,
.fact-value {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
}

.ingredient-amount,
.step-description,
.fact-label {
  margin-top: 4rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.tool-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 20rpx;
}

.tool-chip {
  padding: 14rpx 22rpx;
  border: 1rpx solid var(--app-border);
  border-radius: 999rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
}

.step-count {
  color: var(--app-primary);
  font-size: var(--font-size-caption);
}

.step-list {
  margin-top: 12rpx;
}

.step-item {
  display: grid;
  grid-template-columns: 54rpx minmax(0, 1fr);
  gap: 18rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--app-border);
}

.step-index {
  color: var(--app-primary);
  font-size: var(--font-size-caption);
}

.step-timer,
.step-tip {
  width: fit-content;
  margin-top: 10rpx;
  color: var(--app-primary);
  font-size: var(--font-size-tag);
}

.step-tip {
  color: var(--app-text-secondary);
}

.ordinary-facts {
  margin-top: 18rpx;
  overflow: hidden;
  border-top: 1rpx solid var(--app-border);
  border-bottom: 1rpx solid var(--app-border);
}

.ordinary-fact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-height: 88rpx;
  border-bottom: 1rpx solid var(--app-border);
}

.ordinary-fact:last-child {
  border-bottom: 0;
}

.ordinary-description {
  margin-top: 24rpx;
}

.state-panel {
  margin: 32rpx;
  padding: 34rpx;
  border-radius: var(--app-radius-card);
  background: var(--app-surface-strong);
}

.state-title {
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.state-description {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-body);
}

.state-action {
  min-height: 88rpx;
  margin-top: 24rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body);
}

.state-action--quiet {
  background: var(--app-surface-soft);
  color: var(--app-primary);
}

.state-skeleton {
  height: 26rpx;
  margin-top: 20rpx;
  border-radius: 12rpx;
  background: var(--app-surface-soft);
}

.state-skeleton--title {
  width: 52%;
  height: 42rpx;
  margin-top: 0;
}

.state-skeleton--short {
  width: 68%;
}

.detail-bottom-action {
  position: fixed;
  z-index: var(--z-tabbar);
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16rpx;
  padding: 18rpx 32rpx calc(18rpx + var(--app-safe-area-bottom));
  border-top: 1rpx solid rgba(122, 139, 111, 0.14);
  background: rgba(245, 241, 234, 0.92);
  backdrop-filter: blur(22px) saturate(120%);
}

.detail-bottom-action.is-dual {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.basket-button,
.make-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  min-height: 92rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.basket-button {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.basket-button.is-added {
  background: var(--app-surface-soft);
}

.make-button {
  background: var(--app-primary);
  color: var(--text-white);
}

.make-button[disabled] {
  opacity: 0.48;
}
</style>
<style scoped lang="scss" src="../../styles/content-detail-canonical.scss"></style>
