<template>
  <view class="app-page beverage-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="topbar-title">酒水详情</text>
      <view class="topbar-spacer" />
    </view>

    <view v-if="loading" class="state-card glass-card">
      <text class="state-title">正在加载酒水详情</text>
      <text class="state-desc">从后端读取酒水资料。</text>
    </view>

    <view v-else-if="error" class="state-card glass-card">
      <text class="state-title">酒水详情加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="state-action" @tap="loadBeverage">重试</button>
    </view>

    <template v-else-if="beverage">
      <view class="hero glass-card">
        <image class="hero-image" :src="beverage.coverImage" mode="aspectFill" />
        <view class="hero-copy">
          <text class="hero-title">{{ beverage.name }}</text>
          <text class="hero-desc">{{ parsedSummary || '后台已配置酒水资料' }}</text>
        </view>
      </view>

      <view class="section glass-card">
        <view class="section-row">
          <text class="label">类别</text>
          <text class="value">{{ beverage.category?.name || '未配置' }}</text>
        </view>
        <view class="section-row">
          <text class="label">类型</text>
          <text class="value">{{ beverage.beverageType || '未配置' }}</text>
        </view>
        <view class="section-row">
          <text class="label">酒精</text>
          <text class="value">{{ beverage.isAlcoholic ? `含酒精${beverage.alcoholDegree ?? '未标注'}%` : '无酒精' }}</text>
        </view>
      </view>

      <view class="section glass-card">
        <text class="section-title">说明</text>
        <text class="section-desc">{{ parsedDetail || beverage.description || '暂无说明，后续可由后台补充。' }}</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { getBeverage, type ApiBeverageDetail } from '../../services/public-api';

const beverage = ref<ApiBeverageDetail | null>(null);
const loading = ref(false);
const error = ref('');
const beverageId = ref('');

const parseDescription = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as {
      descriptionText?: string;
      mixMethod?: string;
      baseLiquor?: string;
      mixIngredients?: string;
      accessories?: string;
      garnish?: string;
      glassType?: string;
      iceType?: string;
      mixTips?: string;
    };
    return parsed;
  } catch {
    return null;
  }
};

const parsedDescription = computed(() => parseDescription(beverage.value?.description));
const parsedSummary = computed(() => parsedDescription.value?.descriptionText ?? beverage.value?.description ?? '');
const parsedDetail = computed(() => {
  const parsed = parsedDescription.value;
  if (!parsed) return beverage.value?.description ?? '';
  return [
    parsed.mixMethod ? `调制方式：${parsed.mixMethod}` : '',
    parsed.baseLiquor ? `基底：${parsed.baseLiquor}` : '',
    parsed.mixIngredients ? `辅料：${parsed.mixIngredients}` : '',
    parsed.accessories ? `配件：${parsed.accessories}` : '',
    parsed.garnish ? `装饰：${parsed.garnish}` : '',
    parsed.glassType ? `杯型：${parsed.glassType}` : '',
    parsed.iceType ? `冰块：${parsed.iceType}` : '',
    parsed.mixTips ? `提示：${parsed.mixTips}` : ''
  ].filter(Boolean).join(' · ');
});

const readId = (options?: Record<string, string | undefined>) => {
  const direct = options?.id?.trim();
  if (direct) return direct;
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash;
  const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  return new URLSearchParams(queryText).get('id')?.trim() ?? '';
};

const goBack = () => uni.navigateBack();

const loadBeverage = async () => {
  const id = beverageId.value || readId();
  if (!id) {
    error.value = '缺少酒水编号';
    beverage.value = null;
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    beverageId.value = id;
    beverage.value = await getBeverage(id);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
    beverage.value = null;
  } finally {
    loading.value = false;
  }
};

onLoad((options) => {
  beverageId.value = readId(options);
  void loadBeverage();
});

onMounted(() => {
  void loadBeverage();
});
</script>

<style scoped lang="scss">
.beverage-page {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
}

.nav-button,
.state-action {
  border: 0;
}

.nav-button {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--app-surface-strong);
  color: var(--app-text);
}

.topbar-title {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  text-align: center;
}

.state-card,
.hero,
.section {
  margin-top: 24rpx;
  padding: 28rpx;
}

.state-title,
.state-desc,
.hero-title,
.hero-desc,
.section-title,
.section-desc,
.label,
.value {
  display: block;
}

.state-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.state-desc,
.hero-desc,
.section-desc {
  margin-top: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.state-action {
  margin-top: 18rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-tag);
}

.hero {
  display: grid;
  grid-template-columns: 180rpx 1fr;
  gap: 20rpx;
  align-items: center;
}

.hero-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 24rpx;
  background: var(--app-accent-soft);
}

.hero-title {
  color: var(--app-text);
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
}

.section-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.section-row {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid var(--app-border);
}

.section-row:last-child {
  border-bottom: 0;
}

.label {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

.value {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
}
</style>
