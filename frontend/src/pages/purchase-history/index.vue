<template>
  <view class="app-page history-page">
    <view class="history-topbar">
      <view class="back-button" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view>
        <text class="eyebrow">家庭采购归档</text>
        <text class="page-title">采购记录</text>
      </view>
    </view>

    <view class="summary-card glass-card">
      <view>
        <text class="summary-label">历史订单</text>
        <text class="summary-value">{{ purchaseHistories.length }}</text>
      </view>
      <view>
        <text class="summary-label">累计菜谱</text>
        <text class="summary-value">{{ totalRecipeCount }}</text>
      </view>
      <view>
        <text class="summary-label">累计食材</text>
        <text class="summary-value">{{ totalItemCount }}</text>
      </view>
    </view>

    <view class="history-card glass-card">
      <view class="history-list">
        <view
          v-for="group in groupedPurchaseHistories"
          :key="group.year"
          class="history-year-group"
        >
          <text class="history-year">{{ group.year }}</text>
          <view
            v-for="history in group.items"
            :key="history.id"
            class="history-item"
            @click="toggleHistoryExpanded(history.id)"
          >
            <view class="history-item__main">
              <view>
                <text class="history-date">{{ getHistoryDateLabel(history) }}</text>
                <text class="history-meta">
                  {{ history.recipeCount }} 道菜 · {{ history.itemCount }} 项食材 · {{ history.status }}
                </text>
              </view>
              <text :class="['history-arrow', { 'is-expanded': isHistoryExpanded(history.id) }]">›</text>
            </view>
            <view v-if="isHistoryExpanded(history.id)" class="history-detail">
              <text class="history-recipes">{{ history.recipeNames.join('、') }}</text>
              <text class="history-items">{{ history.itemSummary }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface PurchaseHistory {
  id: string;
  year: number;
  month: number;
  day: number;
  recipeCount: number;
  itemCount: number;
  recipeNames: string[];
  itemSummary: string;
  status: string;
}

interface PurchaseHistoryGroup {
  year: number;
  items: PurchaseHistory[];
}

const expandedHistoryIds = ref<string[]>([]);
const currentYear = new Date().getFullYear();
const purchaseHistories = ref<PurchaseHistory[]>([
  {
    id: 'history-2026-05-18',
    year: 2026,
    month: 5,
    day: 18,
    recipeCount: 2,
    itemCount: 8,
    recipeNames: ['芦笋虾仁', '番茄牛腩'],
    itemSummary: '芦笋、虾仁、番茄、牛腩、生姜等',
    status: '已完成'
  },
  {
    id: 'history-2026-05-17',
    year: 2026,
    month: 5,
    day: 17,
    recipeCount: 3,
    itemCount: 11,
    recipeNames: ['初夏蔬菜沙拉', '菌菇豆腐汤', '白灼芦笋'],
    itemSummary: '生菜、黄瓜、菌菇、豆腐、芦笋等',
    status: '已完成'
  },
  {
    id: 'history-2025-12-28',
    year: 2025,
    month: 12,
    day: 28,
    recipeCount: 2,
    itemCount: 9,
    recipeNames: ['冬笋烧肉', '萝卜牛腩汤'],
    itemSummary: '冬笋、五花肉、白萝卜、牛腩、葱姜等',
    status: '已完成'
  }
]);

const totalRecipeCount = computed(() =>
  purchaseHistories.value.reduce((total, item) => total + item.recipeCount, 0)
);
const totalItemCount = computed(() =>
  purchaseHistories.value.reduce((total, item) => total + item.itemCount, 0)
);
const groupedPurchaseHistories = computed<PurchaseHistoryGroup[]>(() => {
  const groupMap = new Map<number, PurchaseHistory[]>();

  purchaseHistories.value.forEach((history) => {
    const histories = groupMap.get(history.year) ?? [];
    groupMap.set(history.year, [...histories, history]);
  });

  return Array.from(groupMap.entries())
    .sort(([yearA], [yearB]) => yearB - yearA)
    .map(([year, items]) => ({
      year,
      items: [...items].sort((a, b) => {
        if (a.month !== b.month) {
          return b.month - a.month;
        }
        return b.day - a.day;
      })
    }));
});

const getHistoryDateLabel = (history: PurchaseHistory) => {
  if (history.year === currentYear) {
    return `${history.month}月${history.day}日`;
  }

  return `${history.year}年${history.month}月${history.day}日`;
};

const isHistoryExpanded = (historyId: string) => expandedHistoryIds.value.includes(historyId);

const toggleHistoryExpanded = (historyId: string) => {
  if (isHistoryExpanded(historyId)) {
    expandedHistoryIds.value = expandedHistoryIds.value.filter((id) => id !== historyId);
    return;
  }

  expandedHistoryIds.value = [...expandedHistoryIds.value, historyId];
};

const goBack = () => {
  uni.navigateBack({
    fail: () => {
      uni.reLaunch({ url: '/pages/mine/index' });
    }
  });
};
</script>

<style scoped lang="scss">
.history-page {
  padding-bottom: 80rpx;
}

.history-topbar {
  display: grid;
  grid-template-columns: 72rpx 1fr;
  gap: 18rpx;
  align-items: center;
  margin-bottom: 24rpx;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 16rpx 36rpx rgba(18, 24, 40, 0.08);
}

.back-icon {
  color: var(--app-text);
  font-size: 38rpx;
  font-weight: 700;
}

.eyebrow {
  display: block;
  color: var(--app-text-tertiary);
  font-size: 22rpx;
  font-weight: 600;
}

.page-title {
  display: block;
  margin-top: 6rpx;
  color: var(--app-text);
  font-size: 44rpx;
  font-weight: 800;
}

.summary-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20rpx;
  padding: 28rpx;
}

.summary-label {
  display: block;
  color: var(--app-text-secondary);
  font-size: 22rpx;
}

.summary-value {
  display: block;
  margin-top: 8rpx;
  color: var(--app-text);
  font-size: 44rpx;
  font-weight: 800;
}

.history-card {
  margin-top: 20rpx;
  padding: 28rpx 26rpx 18rpx;
}

.history-item__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.history-list {
  margin-top: 0;
}

.history-year-group + .history-year-group {
  margin-top: 24rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid var(--app-border);
}

.history-year {
  display: block;
  margin-bottom: 8rpx;
  color: var(--app-text-tertiary);
  font-size: 24rpx;
  font-weight: 800;
}

.history-item {
  padding: 20rpx 0;
  border-top: 1rpx solid var(--app-border);
}

.history-year + .history-item {
  border-top: 0;
}

.history-date {
  display: block;
  color: var(--app-text);
  font-size: 30rpx;
  font-weight: 800;
}

.history-meta {
  display: block;
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: 23rpx;
}

.history-arrow {
  color: var(--app-text);
  font-size: 44rpx;
  line-height: 1;
  transition: transform 0.2s ease;
}

.history-arrow.is-expanded {
  transform: rotate(90deg);
}

.history-detail {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 16rpx;
  padding: 18rpx;
  border-radius: 24rpx;
  background: var(--app-accent-soft);
}

.history-recipes {
  color: var(--app-text);
  font-size: 24rpx;
  font-weight: 700;
}

.history-items {
  color: var(--app-text-secondary);
  font-size: 23rpx;
  line-height: 1.5;
}
</style>
