<template>
  <view class="app-page seasonal-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view>
        <text class="eyebrow">时令食材</text>
        <text class="page-title">本季推荐</text>
      </view>
    </view>

    <view v-if="loading" class="state-card glass-card">
      <text class="state-title">正在加载时令食材</text>
      <text class="state-desc">从首页聚合数据同步当前季节推荐。</text>
    </view>

    <view v-else-if="error" class="state-card glass-card">
      <text class="state-title">时令食材加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="state-action" @tap="loadSeasonalFoods">重试</button>
    </view>

    <view v-else-if="!seasonalFoods.length" class="state-card glass-card">
      <text class="state-title">暂无时令食材</text>
      <text class="state-desc">后台还没有配置可展示的时令内容。</text>
    </view>

    <view v-else class="section-block">
      <text class="section-title">当前月份推荐</text>
      <view class="card-list">
        <view v-for="item in seasonalFoods" :key="item.id" class="food-card glass-card" @tap="goToItem(item)">
          <image class="food-image" :src="item.cover" mode="aspectFill" />
          <view class="food-body">
            <view class="food-meta">
              <text class="food-tag">M{{ item.month }}</text>
              <text v-if="item.priceText" class="food-tag food-tag--soft">{{ item.priceText }}</text>
            </view>
            <text class="food-name">{{ item.name }}</text>
            <text class="food-desc">{{ item.reason }}</text>
          </view>
          <app-icon class="arrow" name="chevron-right" size="22rpx" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { getHome, type ApiHome } from '../../services/public-api';
import { resolveAssetUrl } from '../../services/public-api';

interface SeasonalFoodItem {
  id: string;
  name: string;
  reason: string;
  month: number;
  cover: string;
  priceText: string | null;
  ingredientId: number | null;
}

const loading = ref(false);
const error = ref('');
const seasonalFoods = ref<SeasonalFoodItem[]>([]);

const loadSeasonalFoods = async () => {
  loading.value = true;
  error.value = '';
  try {
    const home = await getHome();
    seasonalFoods.value = home.recommendIngredients.map((item, index) => ({
      id: String(item.id || index),
      name: item.name,
      reason: item.seasonMonth ? `当前季节适合搭配 ${item.seasonMonth}` : '当前季节推荐',
      month: Number(item.seasonMonth || new Date().getMonth() + 1),
      cover: resolveAssetUrl(item.cover),
      priceText: item.currentPrice ? `¥${item.currentPrice}/${item.priceUnit || '份'}` : null,
      ingredientId: item.id
    }));
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
    seasonalFoods.value = [];
  } finally {
    loading.value = false;
  }
};

const goBack = () => uni.navigateBack();

const goToItem = (item: SeasonalFoodItem) => {
  if (!item.ingredientId) return;
  uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${item.ingredientId}` });
};

onMounted(() => {
  void loadSeasonalFoods();
});

onShow(() => {
  void loadSeasonalFoods();
});
</script>

<style scoped lang="scss">
.seasonal-page {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border: 0;
  border-radius: 50%;
  background: #fffdfc;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
}

.back-button::after,
.state-action::after {
  border: 0;
}

.eyebrow,
.page-title,
.state-title,
.state-desc,
.section-title,
.food-name,
.food-desc {
  display: block;
}

.eyebrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.page-title {
  margin-top: 4rpx;
  color: var(--app-text);
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
}

.state-card {
  padding: 28rpx;
}

.state-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.state-desc {
  margin-top: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.state-action {
  margin-top: 18rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: #7a8b6f;
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.section-block {
  margin-top: 8rpx;
}

.section-title {
  margin: 18rpx 2rpx 12rpx;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.card-list {
  display: grid;
  gap: 16rpx;
}

.food-card {
  display: grid;
  grid-template-columns: 146rpx 1fr 28rpx;
  gap: 18rpx;
  align-items: center;
  padding: 16rpx;
}

.food-image {
  width: 146rpx;
  height: 146rpx;
  border-radius: 24rpx;
  background: var(--app-surface-strong);
}

.food-body {
  min-width: 0;
}

.food-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.food-tag {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(122, 139, 111, 0.14);
  color: var(--app-text);
  font-size: var(--font-size-tag);
}

.food-tag--soft {
  background: rgba(183, 174, 161, 0.16);
}

.food-name {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.food-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.arrow {
  color: var(--app-text-tertiary);
  font-size: 36rpx;
}
</style>
