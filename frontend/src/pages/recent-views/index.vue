<template>
  <view class="app-page list-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view>
        <text class="eyebrow">浏览轨迹</text>
        <text class="page-title">最近浏览</text>
      </view>
    </view>

    <view v-if="loading" class="state-card glass-card">
      <text class="state-title">正在加载浏览记录</text>
      <text class="state-desc">从后端同步最近看过的菜谱和食材。</text>
    </view>

    <view v-else-if="needsLogin" class="state-card glass-card">
      <text class="state-title">登录后查看最近浏览</text>
      <text class="state-desc">浏览记录会写入后端，方便继续做饭和采购。</text>
      <button class="state-action" @tap="goToLogin">去登录</button>
    </view>

    <view v-else-if="error" class="state-card glass-card">
      <text class="state-title">浏览记录加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="state-action" @tap="loadRecentViews">重试</button>
    </view>

    <view v-else-if="!recentItems.length" class="state-card glass-card">
      <text class="state-title">暂无浏览记录</text>
      <text class="state-desc">打开菜谱或食材详情后，这里会显示最近看过的内容。</text>
    </view>

    <view v-else class="timeline-card glass-card">
      <view
        v-for="group in viewGroups"
        :key="group.date"
        class="timeline-group"
      >
        <text class="timeline-date">{{ group.date }}</text>
        <view
          v-for="item in group.items"
          :key="item.id"
          class="recipe-row"
          @tap="goToItem(item)"
        >
          <image class="recipe-image" :src="item.image" mode="aspectFill" />
          <view class="recipe-body">
            <text class="recipe-name">{{ item.name }}</text>
            <text class="recipe-desc">{{ item.description }}</text>
            <text class="recipe-time">{{ item.viewedAt }}</text>
          </view>
          <app-icon class="arrow" name="chevron-right" size="22rpx" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import { listMobileViewHistories } from '../../services/public-api';
import type { ApiMobileViewHistory } from '../../services/public-api';

interface RecentItem {
  id: number;
  targetType: 'recipe' | 'ingredient';
  targetId: number;
  name: string;
  description: string;
  image: string;
  viewedAt: string;
  viewedDate: string;
}

interface ViewGroup {
  date: string;
  items: RecentItem[];
}

const recentItems = ref<RecentItem[]>([]);
const loading = ref(false);
const error = ref('');
const needsLogin = ref(false);

const formatDateGroup = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '较早';
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startToday - startTarget) / 86400000);
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const toRecentItem = (record: ApiMobileViewHistory): RecentItem | null => {
  const viewedDate = formatDateGroup(record.updatedAt || record.createdAt);
  const viewedAt = formatTime(record.updatedAt || record.createdAt);
  if (record.recipe) {
    return {
      id: record.id,
      targetType: 'recipe',
      targetId: record.recipe.id,
      name: record.recipe.title,
      description: record.recipe.subtitle || record.recipe.description || '家庭常做菜谱',
      image: record.recipe.cover || '',
      viewedAt,
      viewedDate
    };
  }
  if (record.ingredient) {
    return {
      id: record.id,
      targetType: 'ingredient',
      targetId: record.ingredient.id,
      name: record.ingredient.name,
      description: record.ingredient.seasonMonth ? `时令：${record.ingredient.seasonMonth}` : '家庭常备食材',
      image: record.ingredient.cover || '',
      viewedAt,
      viewedDate
    };
  }
  return null;
};

const viewGroups = computed<ViewGroup[]>(() => {
  const groups: ViewGroup[] = [];
  for (const item of recentItems.value) {
    const group = groups.find((entry) => entry.date === item.viewedDate);
    if (group) {
      group.items.push(item);
    } else {
      groups.push({ date: item.viewedDate, items: [item] });
    }
  }
  return groups;
});

const loadRecentViews = async () => {
  loading.value = true;
  error.value = '';
  needsLogin.value = false;
  try {
    const user = await syncAuthUserWithBackend(loadAuthUser());
    if (!user?.id) {
      recentItems.value = [];
      needsLogin.value = true;
      return;
    }
    const data = await listMobileViewHistories({ userId: user.id, page: 1, pageSize: 50 });
    recentItems.value = data.list.map(toRecentItem).filter((item): item is RecentItem => item !== null);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
    recentItems.value = [];
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  uni.navigateBack();
};

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' });
};

const goToItem = (item: RecentItem) => {
  if (item.targetType === 'recipe') {
    uni.navigateTo({ url: `/pages/recipe-detail/index?id=${item.targetId}` });
    return;
  }
  uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${item.targetId}` });
};

onShow(() => {
  void loadRecentViews();
});
</script>

<style scoped lang="scss">
.list-page {
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

.back-button::after {
  border: 0;
}

.eyebrow,
.page-title,
.timeline-date,
.recipe-name,
.recipe-desc,
.recipe-time {
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

.timeline-card {
  padding: 24rpx;
}

.state-card {
  padding: 34rpx;
}

.state-title,
.state-desc {
  display: block;
}

.state-title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.state-desc {
  margin-top: 12rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.state-action {
  margin-top: 24rpx;
  width: 180rpx;
  height: 64rpx;
  border: 0;
  border-radius: 999rpx;
  background: #7a8b6f;
  color: #fffdfc;
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.state-action::after {
  border: 0;
}

.timeline-group + .timeline-group {
  margin-top: 28rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid var(--app-border);
}

.timeline-date {
  margin-bottom: 16rpx;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.recipe-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 138rpx;
}

.recipe-row + .recipe-row {
  margin-top: 18rpx;
}

.recipe-image {
  width: 118rpx;
  height: 118rpx;
  flex: 0 0 auto;
  border-radius: 24rpx;
}

.recipe-body {
  min-width: 0;
  flex: 1;
}

.recipe-name {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.recipe-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-body-sm);
}

.recipe-time {
  margin-top: 8rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
}

.arrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-detail-title);
}
</style>
