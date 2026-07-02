<template>
  <view class="app-page history-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view>
        <text class="eyebrow">家庭采购归档</text>
        <text class="page-title">采购记录</text>
      </view>
    </view>

    <view class="summary-card glass-card">
      <view class="summary-item">
        <text class="summary-label">已归档</text>
        <text class="summary-value">{{ groupedHistories.length }}</text>
      </view>
      <view class="summary-item">
        <text class="summary-label">采购项</text>
        <text class="summary-value">{{ checkedItemCount }}</text>
      </view>
      <view class="summary-item">
        <text class="summary-label">家庭</text>
        <text class="summary-value">{{ familyCount }}</text>
      </view>
    </view>

    <view v-if="loading" class="state-card glass-card">
      <text class="state-title">正在加载采购记录</text>
      <text class="state-desc">从后端同步已勾选的菜篮子条目。</text>
    </view>

    <view v-else-if="needsLogin" class="state-card glass-card">
      <text class="state-title">登录后查看采购记录</text>
      <text class="state-desc">采购记录会跟随你的账号同步到后端。</text>
      <button class="state-action" @tap="goToLogin">去登录</button>
    </view>

    <view v-else-if="error" class="state-card glass-card">
      <text class="state-title">采购记录加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="state-action" @tap="loadPurchaseHistory">重试</button>
    </view>

    <view v-else-if="!groupedHistories.length" class="state-card glass-card">
      <text class="state-title">暂无采购记录</text>
      <text class="state-desc">把菜篮子条目标记为已购买后，这里会按日期归档显示。</text>
    </view>

    <view v-else class="history-card glass-card">
      <view v-for="group in groupedHistories" :key="group.dateKey" class="history-group">
        <view class="history-group__header">
          <view>
            <text class="history-date">{{ group.label }}</text>
            <text class="history-meta">{{ group.items.length }} 项 · {{ group.familyNames.join('、') }}</text>
          </view>
          <text class="history-total">{{ group.totalQuantityText }}</text>
        </view>

        <view v-for="item in group.items" :key="item.id" class="history-item">
          <view class="history-item__main">
            <view class="history-item__copy">
              <text class="history-item__name">{{ item.name }}</text>
              <text class="history-item__desc">{{ item.recipeName }} · {{ item.amountText || item.quantityText }}</text>
            </view>
            <view class="history-item__right">
              <text class="history-item__checked">已购买</text>
              <text class="history-item__time">{{ item.timeLabel }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import { loadBasketItems, type BasketItem } from '../../services/basket';

type HistoryItem = BasketItem & {
  dateKey: string;
  label: string;
  timeLabel: string;
  quantityText: string;
};

type PurchaseHistoryGroup = {
  dateKey: string;
  label: string;
  familyNames: string[];
  totalQuantityText: string;
  items: HistoryItem[];
};

const loading = ref(false);
const error = ref('');
const needsLogin = ref(false);
const items = ref<HistoryItem[]>([]);

const formatDateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知日期';
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startToday - startTarget) / 86400000);
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatTimeLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatQuantityText = (item: BasketItem) => {
  if (item.amountText) return item.amountText;
  if (item.quantity !== undefined && item.quantity !== null) return `${item.quantity}${item.purchaseText ? '' : ''}`;
  return '';
};

const normalizedItems = computed<HistoryItem[]>(() =>
  [...items.value]
    .sort((a, b) => (b.checkedAt || b.updatedAt || '').localeCompare(a.checkedAt || a.updatedAt || ''))
);

const groupedHistories = computed<PurchaseHistoryGroup[]>(() => {
  const groupMap = new Map<string, HistoryItem[]>();
  for (const item of normalizedItems.value) {
    const timestamp = item.checkedAt || item.updatedAt || item.createdAt || '';
    const dateKey = formatDateKey(timestamp);
    const list = groupMap.get(dateKey) ?? [];
    groupMap.set(dateKey, [...list, item]);
  }

  return Array.from(groupMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, list]) => {
      const first = list[0];
      const familyNames = Array.from(new Set(list.map((entry) => entry.familyName).filter(Boolean) as string[]));
      const totalQuantity = list.reduce((sum, entry) => sum + (Number(entry.quantity) || 1), 0);
      return {
        dateKey,
        label: formatDateLabel(first?.checkedAt || first?.updatedAt || first?.createdAt || ''),
        familyNames: familyNames.length ? familyNames : ['未绑定家庭'],
        totalQuantityText: `${totalQuantity} 件`,
        items: list.map((entry) => ({
          ...entry,
          label: formatDateLabel(entry.checkedAt || entry.updatedAt || entry.createdAt || ''),
          timeLabel: formatTimeLabel(entry.checkedAt || entry.updatedAt || entry.createdAt || ''),
          quantityText: formatQuantityText(entry)
        }))
      };
    });
});

const checkedItemCount = computed(() => normalizedItems.value.length);
const familyCount = computed(() => {
  const ids = new Set(normalizedItems.value.map((item) => item.familyId).filter(Boolean));
  return ids.size;
});

const goBack = () => {
  uni.navigateBack({
    fail: () => {
      uni.reLaunch({ url: '/pages/mine/index' });
    }
  });
};

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' });
};

const loadPurchaseHistory = async () => {
  loading.value = true;
  error.value = '';
  needsLogin.value = false;
  try {
    const user = await syncAuthUserWithBackend(loadAuthUser());
    if (!user?.id) {
      items.value = [];
      needsLogin.value = true;
      return;
    }
    const data = await loadBasketItems(null);
    items.value = data
      .filter((item) => item.checked)
      .map((item) => ({
        ...item,
        dateKey: '',
        label: '',
        timeLabel: '',
        quantityText: formatQuantityText(item)
      }));
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
    items.value = [];
  } finally {
    loading.value = false;
  }
};

onShow(() => {
  void loadPurchaseHistory();
});

onMounted(() => {
  void loadPurchaseHistory();
});
</script>

<style scoped lang="scss">
.history-page {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.back-button,
.state-action {
  border: 0;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #fffdfc;
  color: var(--app-text);
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
}

.eyebrow,
.page-title,
.summary-label,
.summary-value,
.state-title,
.state-desc,
.history-date,
.history-meta,
.history-total,
.history-item__name,
.history-item__desc,
.history-item__checked,
.history-item__time {
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

.summary-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
  padding: 28rpx;
}

.summary-item {
  min-width: 0;
}

.summary-label {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.summary-value {
  margin-top: 8rpx;
  color: var(--app-text);
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
}

.state-card,
.history-card {
  margin-top: 20rpx;
  padding: 28rpx;
}

.state-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.state-desc,
.history-meta,
.history-item__desc,
.history-item__time {
  margin-top: 10rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.state-action {
  margin-top: 18rpx;
  width: 100%;
  height: 84rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.history-group + .history-group {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid var(--app-border);
}

.history-group__header,
.history-item__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.history-date {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.history-meta {
  margin-top: 8rpx;
}

.history-total {
  color: var(--app-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  white-space: nowrap;
}

.history-item {
  margin-top: 16rpx;
  padding: 20rpx 18rpx;
  border-radius: 24rpx;
  background: var(--app-accent-soft);
}

.history-item__main {
  align-items: center;
}

.history-item__copy {
  min-width: 0;
  flex: 1;
}

.history-item__name {
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item__desc {
  margin-top: 6rpx;
}

.history-item__right {
  flex-shrink: 0;
  text-align: right;
}

.history-item__checked {
  color: var(--app-primary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.history-item__time {
  margin-top: 4rpx;
}
</style>
