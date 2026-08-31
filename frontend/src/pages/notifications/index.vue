<template>
  <view class="app-page notifications-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="page-header">
      <button class="back-button" aria-label="返回" @tap="goBack">
        <app-icon name="arrow-left" size="28rpx" />
      </button>
      <text class="page-title">消息与提醒</text>
      <view class="header-spacer" />
    </view>

    <view v-if="loading && !items.length" class="state-panel" aria-busy="true">
      <text class="sr-only" role="status">正在加载消息</text>
      <view class="state-lines">
        <view class="state-line state-line--strong" />
        <view class="state-line" />
      </view>
      <view class="state-lines">
        <view class="state-line state-line--strong" />
        <view class="state-line" />
      </view>
    </view>

    <view v-else-if="error && !items.length" class="state-panel state-panel--center">
      <text class="state-title">消息暂时无法加载</text>
      <text class="state-description">{{ error }}</text>
      <button class="state-action" @tap="reload">重新加载</button>
    </view>

    <view v-else-if="needsLogin" class="state-panel state-panel--center">
      <view class="empty-icon">
        <app-icon name="bell" size="42rpx" />
      </view>
      <text class="state-title">登录后查看消息</text>
      <text class="state-description">家庭提醒和与你有关的通知会保存在账号中。</text>
      <button class="state-action" @tap="goLogin">去登录</button>
    </view>

    <view v-else-if="!items.length" class="state-panel state-panel--center">
      <view class="empty-icon">
        <app-icon name="bell" size="42rpx" />
      </view>
      <text class="state-title">暂时没有新消息</text>
      <text class="state-description">家庭开饭提醒和产品通知会显示在这里。</text>
    </view>

    <view v-else class="notification-list">
      <button
        v-for="item in items"
        :key="item.id"
        :class="['notification-row', { 'is-unread': !item.readAt }]"
        :aria-label="`${item.readAt ? '' : '未读，'}${item.notification.title}，${item.notification.body}`"
        @tap="openItem(item)"
      >
        <view class="notification-mark">
          <app-icon :name="item.notification.type === 'MEAL_READY' ? 'cooking-pot' : 'bell'" size="34rpx" />
        </view>
        <view class="notification-copy">
          <view class="notification-heading">
            <text class="notification-title">{{ item.notification.title }}</text>
            <text class="notification-time">{{ formatTime(item.notification.createdAt) }}</text>
          </view>
          <text class="notification-body">{{ item.notification.body }}</text>
        </view>
        <view v-if="!item.readAt" class="unread-dot" aria-hidden="true" />
      </button>

      <view class="list-footer">
        <text v-if="loading">正在加载</text>
        <button v-else-if="error" class="footer-retry" @tap="loadNextPage">加载失败，点击重试</button>
        <text v-else-if="hasMore">继续上滑加载</text>
        <text v-else>没有更多消息了</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onReachBottom, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import {
  ApiError,
  listMobileNotifications,
  markMobileNotificationRead,
  type ApiNotificationReceipt
} from '../../services/public-api';

const PAGE_SIZE = 20;
const items = ref<ApiNotificationReceipt[]>([]);
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const error = ref('');
const needsLogin = ref(false);
const hasMore = computed(() => items.value.length < total.value);

const loadPage = async (targetPage: number, replace = false) => {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    const result = await listMobileNotifications({ page: targetPage, pageSize: PAGE_SIZE });
    items.value = replace ? result.list : [...items.value, ...result.list];
    total.value = result.total;
    page.value = targetPage;
  } catch (err) {
    if (err instanceof ApiError && err.code === 401) {
      needsLogin.value = true;
      items.value = [];
      total.value = 0;
      return;
    }
    error.value = err instanceof Error ? err.message : '请稍后再试';
  } finally {
    loading.value = false;
  }
};

const reload = () => loadPage(1, true);

const loadForCurrentUser = async () => {
  const localUser = loadAuthUser();
  needsLogin.value = !localUser;
  if (needsLogin.value) {
    items.value = [];
    total.value = 0;
    error.value = '';
    return;
  }
  try {
    const user = await syncAuthUserWithBackend(localUser);
    needsLogin.value = !user?.token;
    if (!needsLogin.value) await reload();
  } catch (err) {
    needsLogin.value = err instanceof ApiError && err.code === 401;
    if (!needsLogin.value) error.value = err instanceof Error ? err.message : '登录状态校验失败';
  }
};

const loadNextPage = () => {
  if (!hasMore.value || loading.value) return;
  void loadPage(page.value + 1);
};

const openItem = async (item: ApiNotificationReceipt) => {
  if (!item.readAt) {
    try {
      const updated = await markMobileNotificationRead(item.notificationId);
      item.readAt = updated.readAt;
    } catch (err) {
      uni.showToast({ title: err instanceof Error ? err.message : '标记已读失败', icon: 'none' });
      return;
    }
  }
  if (item.notification.familyId) {
    uni.navigateTo({ url: `/pages/basket/index?familyId=${item.notification.familyId}` });
    return;
  }
  uni.showModal({
    title: item.notification.title,
    content: item.notification.body,
    showCancel: false,
    confirmText: '知道了'
  });
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
};

const goBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.reLaunch({ url: '/pages/index/index' });
};
const goLogin = () => uni.navigateTo({ url: '/pages/login/index' });

onShow(() => {
  void loadForCurrentUser();
});

onReachBottom(loadNextPage);
</script>

<style scoped lang="scss">
.notifications-page {
  min-height: 100dvh;
  padding-top: 0;
  padding-bottom: calc(64rpx + var(--app-safe-area-bottom));
}

.safe-top-spacer {
  height: var(--app-safe-area-top);
}

.page-header {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  min-height: 80rpx;
  margin-top: 16rpx;
  margin-bottom: 28rpx;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--app-text);
}

.back-button::after,
.notification-row::after,
.state-action::after,
.footer-retry::after {
  border: 0;
}

.back-button:active,
.notification-row:active,
.state-action:active {
  transform: scale(0.98);
}

.page-title {
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
  text-align: center;
}

.state-panel {
  padding: 12rpx 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.state-panel--center {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-top: 180rpx;
  text-align: center;
}

.state-lines {
  padding: 30rpx 0;
  border-bottom: 1rpx solid var(--app-border);
}

.state-line {
  width: 72%;
  height: 22rpx;
  margin-top: 14rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-muted);
  animation: pulse 1.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

.state-line--strong {
  width: 42%;
  height: 28rpx;
  margin-top: 0;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  margin-bottom: 24rpx;
  border-radius: 50%;
  background: var(--app-accent-soft);
  color: var(--app-primary);
}

.state-title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.state-description {
  max-width: 520rpx;
  margin-top: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.state-action {
  min-width: 200rpx;
  min-height: 80rpx;
  margin-top: 28rpx;
  padding: 0 30rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
}

.notification-list {
  border-top: 1rpx solid var(--app-border);
}

.notification-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-height: 148rpx;
  padding: 28rpx 12rpx;
  border: 0;
  border-bottom: 1rpx solid var(--app-border);
  border-radius: 0;
  background: transparent;
  color: var(--app-text);
  text-align: left;
  transition:
    background 180ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.notification-row.is-unread {
  background: rgba(122, 139, 111, 0.06);
}

.notification-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  flex: 0 0 72rpx;
  border-radius: 20rpx;
  background: var(--app-accent-soft);
  color: var(--app-primary);
}

.notification-copy {
  min-width: 0;
  flex: 1;
  margin-left: 22rpx;
}

.notification-heading {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}

.notification-title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  flex: 0 0 auto;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-regular);
  line-height: var(--line-tag);
  font-variant-numeric: tabular-nums;
}

.notification-body {
  display: -webkit-box;
  margin-top: 8rpx;
  overflow: hidden;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-regular);
  line-height: var(--line-body-sm);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.unread-dot {
  width: 12rpx;
  height: 12rpx;
  flex: 0 0 12rpx;
  margin: 12rpx 0 0 16rpx;
  border-radius: 50%;
  background: var(--app-warning);
}

.list-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 112rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.footer-retry {
  min-height: 72rpx;
  padding: 0 24rpx;
  border: 0;
  background: transparent;
  color: var(--app-primary);
  font-size: var(--font-size-tag);
}

.back-button:focus-visible,
.notification-row:focus-visible,
.state-action:focus-visible,
.footer-retry:focus-visible {
  outline: 2px solid var(--app-primary);
  outline-offset: 2px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .state-line {
    animation: none;
  }

  .back-button,
  .notification-row,
  .state-action {
    transition: none;
  }
}
</style>
