<template>
  <view class="home-tab-bar glass-card">
    <view
      v-for="tab in tabs"
      :key="tab.id"
      :class="['home-tab-bar__item', { 'is-active': tab.active }]"
      @tap="handleTabClick(tab.id)"
    >
      <view class="icon-wrapper">
        <app-icon class="tab-icon" :name="getTabIcon(tab.id)" size="24rpx" />
      </view>
      <text class="home-tab-bar__label">{{ tab.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from '../app/app-icon.vue';
import type { HomeTab } from '../../types/home';

defineProps<{
  tabs: HomeTab[];
}>();

const getTabIcon = (tabId: string) => {
  if (tabId === 'home') return 'home';
  if (tabId === 'basket') return 'basket';
  if (tabId === 'mine') return 'user';
  return 'category';
};

const handleTabClick = (tabId: string) => {
  const routes: Record<string, string> = {
    home: '/pages/index/index',
    ingredients: '/pages/ingredients/index',
    categories: '/pages/ingredients/index',
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
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-regular);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.is-active .home-tab-bar__label {
  color: var(--app-primary);
  font-weight: var(--font-semibold);
}
</style>
