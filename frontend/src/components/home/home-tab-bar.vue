<template>
  <view class="home-tab-bar glass-card">
    <view
      v-for="tab in tabs"
      :key="tab.id"
      :class="['home-tab-bar__item', { 'is-active': tab.active }]"
      @tap="handleTabClick(tab.id)"
    >
      <view class="icon-wrapper">
        <svg
          v-if="tab.id === 'home'"
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <svg
          v-else-if="tab.id === 'ingredients'"
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M12 12v10" />
          <path d="M8 22h8" />
        </svg>
        <svg
          v-else-if="tab.id === 'basket'"
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <svg
          v-else-if="tab.id === 'mine'"
          class="tab-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </view>
      <text class="home-tab-bar__label">{{ tab.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { HomeTab } from '../../types/home';

defineProps<{
  tabs: HomeTab[];
}>();

const handleTabClick = (tabId: string) => {
  const routes: Record<string, string> = {
    home: '/pages/index/index',
    ingredients: '/pages/ingredients/index',
    basket: '/pages/basket/index',
    mine: '/pages/mine/index'
  };

  const url = routes[tabId];
  if (url) {
    const pages = getCurrentPages();
    const currentPath = pages.length ? pages[pages.length - 1].route : '';
    if (currentPath === url.replace(/^\//, '')) {
      return;
    }
    uni.reLaunch({ url });
  }
};
</script>

<style scoped lang="scss">
.home-tab-bar {
  position: fixed;
  right: 32rpx;
  bottom: 18rpx;
  left: 32rpx;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8rpx;
  padding: 18rpx 14rpx calc(18rpx + env(safe-area-inset-bottom, 0));
  background: rgba(255, 253, 252, 0.94);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: var(--app-shadow);
}

.home-tab-bar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 0 6rpx;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.home-tab-bar__item:active {
  opacity: 0.72;
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.is-active .icon-wrapper {
  background: var(--app-accent-soft);
  box-shadow: none;
}

.tab-icon {
  width: 24rpx;
  height: 24rpx;
  color: var(--app-text-secondary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.is-active .tab-icon {
  color: var(--app-primary);
}

.home-tab-bar__label {
  color: var(--app-text-secondary);
  font-size: 20rpx;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.is-active .home-tab-bar__label {
  color: var(--app-primary);
  font-weight: 600;
}
</style>
