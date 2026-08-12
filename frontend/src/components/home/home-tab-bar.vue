<template>
  <view class="home-tab-bar app-fixed-glass" role="navigation" aria-label="主导航">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="['home-tab-bar__item', { 'is-active': tab.active }]"
      :aria-current="tab.active ? 'page' : undefined"
      @tap="handleTabClick(tab.id)"
    >
      <view class="icon-wrapper">
        <app-icon class="tab-icon" :name="getTabIcon(tab.id)" :filled="tab.active" size="24px" />
      </view>
      <text class="home-tab-bar__label">{{ tab.label }}</text>
    </button>
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
  bottom: max(10px, var(--app-safe-area-bottom));
  left: 50%;
  z-index: 30;
  display: grid;
  width: calc(100% - 24px);
  max-width: 369px;
  height: 70px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 6px 8px;
  border-radius: 18px;
  transform: translateX(-50%);
}

.home-tab-bar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 64px;
  min-height: 58px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 180ms cubic-bezier(0.32, 0.72, 0, 1), opacity 180ms ease;
}

.home-tab-bar__item::after {
  border: 0;
}

.home-tab-bar__item:active {
  opacity: 0.78;
  transform: scale(0.96);
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-icon {
  width: 24px;
  height: 24px;
  color: var(--app-text-secondary);
  transition: color 180ms ease;
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
