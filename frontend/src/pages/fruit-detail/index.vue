<template>
  <view class="app-page detail-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="topbar-title">水果详情</text>
      <view class="topbar-spacer" />
    </view>

    <view v-if="loading" class="state-card glass-card">
      <text class="state-title">正在加载水果详情</text>
      <text class="state-desc">从后端读取水果资料。</text>
    </view>

    <view v-else-if="error" class="state-card glass-card">
      <text class="state-title">水果详情加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="state-action" @tap="loadIngredient">重试</button>
    </view>

    <template v-else-if="ingredient">
      <view class="hero glass-card">
        <image class="hero-image" :src="ingredient.cover || fallbackImage" mode="aspectFill" />
        <view class="hero-copy">
          <text class="hero-title">{{ ingredient.name }}</text>
          <text class="hero-desc">{{ ingredient.category?.name || '后台已配置水果资料' }}</text>
        </view>
      </view>

      <view class="section glass-card">
        <view class="section-row">
          <text class="label">类别</text>
          <text class="value">{{ ingredient.category?.name || '未配置' }}</text>
        </view>
        <view class="section-row">
          <text class="label">季节</text>
          <text class="value">{{ ingredient.seasonMonth || '未配置' }}</text>
        </view>
        <view class="section-row">
          <text class="label">价格</text>
          <text class="value">{{ ingredient.currentPrice ? `¥${ingredient.currentPrice}/${ingredient.priceUnit || '斤'}` : '待补充' }}</text>
        </view>
      </view>

      <view class="section glass-card">
        <text class="section-title">说明</text>
        <text class="section-desc">{{ ingredient.selectionTips || ingredient.storageMethod || ingredient.nutrition || '暂无说明，后续可由后台补充。' }}</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { getIngredient, resolveAssetUrl, type ApiIngredientDetail } from '../../services/public-api';

const fallbackImage =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 900 600%22%3E%3Crect width=%22900%22 height=%22600%22 fill=%22%23F5F1EA%22/%3E%3Cpath d=%22M210 382c78-96 155-144 231-144 74 0 137 44 249 144%22 fill=%22none%22 stroke=%22%237A8B6F%22 stroke-width=%2228%22 stroke-linecap=%22round%22/%3E%3Ccircle cx=%22648%22 cy=%22182%22 r=%2250%22 fill=%22%23E9E2D6%22/%3E%3Crect x=%22218%22 y=%22416%22 width=%22464%22 height=%2232%22 rx=%2216%22 fill=%22%23E9E2D6%22/%3E%3C/svg%3E';

const ingredient = ref<ApiIngredientDetail | null>(null);
const loading = ref(false);
const error = ref('');
const ingredientId = ref('');

const readId = (options?: Record<string, string | undefined>) => {
  const direct = options?.id?.trim();
  if (direct) return direct;
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash;
  const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  return new URLSearchParams(queryText).get('id')?.trim() ?? '';
};

const goBack = () => uni.navigateBack();

const loadIngredient = async () => {
  const id = ingredientId.value || readId();
  if (!id) {
    error.value = '缺少水果编号';
    ingredient.value = null;
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    ingredientId.value = id;
    const data = await getIngredient(Number(id));
    ingredient.value = {
      ...data,
      cover: resolveAssetUrl(data.cover, fallbackImage)
    };
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
    ingredient.value = null;
  } finally {
    loading.value = false;
  }
};

onLoad((options) => {
  ingredientId.value = readId(options);
  void loadIngredient();
});

onMounted(() => {
  void loadIngredient();
});
</script>

<style scoped lang="scss">
.detail-page {
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
