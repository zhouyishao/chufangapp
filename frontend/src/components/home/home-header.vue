<template>
  <view
    :class="['home-header', 'glass-card', { 'is-immersive': immersive, 'is-pinned': pinned }]"
    :style="headerStyle"
  >
    <view class="search-top">
      <nut-searchbar
        v-model="keyword"
        shape="round"
        placeholder="搜索菜谱、食材、做法"
        @search="emitSearch"
      />
      <button class="add-button" @tap="openActionSheet">
        <svg class="add-button__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>
    </view>

    <scroll-view class="category-scroll" scroll-x enable-flex>
      <view class="category-row">
        <button
          v-for="category in categories"
          :key="category.id"
          :class="['category-tab', { 'is-active': selectedCategoryId === category.id }]"
          @tap="selectCategory(category.id)"
        >
          <text class="category-label">{{ category.label }}</text>
        </button>
      </view>
    </scroll-view>

    <view v-if="isActionSheetVisible" class="dropdown-mask" @tap="closeActionSheet">
      <view class="action-dropdown" @tap.stop>
        <view class="add-action-list">
          <view class="add-action" @tap="scanCode">
            <view class="add-action__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 7V5a1 1 0 0 1 1-1h2" />
                <path d="M17 4h2a1 1 0 0 1 1 1v2" />
                <path d="M20 17v2a1 1 0 0 1-1 1h-2" />
                <path d="M7 20H5a1 1 0 0 1-1-1v-2" />
                <path d="M8 8h8v8H8z" />
              </svg>
            </view>
            <view>
              <text class="add-action__title">扫一扫</text>
            </view>
          </view>
          <view class="add-action" @tap="addRecipe">
            <view class="add-action__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </view>
            <view>
              <text class="add-action__title">添加菜谱</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    activeCategoryId?: string;
    immersive?: boolean;
    pinned?: boolean;
    pinnedProgress?: number;
  }>(),
  {
    activeCategoryId: 'recommend',
    immersive: false,
    pinned: false,
    pinnedProgress: 0
  }
);

const emit = defineEmits<{
  search: [value: string];
  'category-change': [categoryId: string];
}>();

const keyword = ref('');
const isActionSheetVisible = ref(false);
const internalActiveCategoryId = ref(props.activeCategoryId);
const categories = [
  { id: 'recommend', label: '推荐' },
  { id: 'home', label: '家常菜' },
  { id: 'quick', label: '快手菜' },
  { id: 'soup', label: '汤类' },
  { id: 'breakfast', label: '早餐' },
  { id: 'light', label: '减脂' }
];

const selectedCategoryId = computed(() => props.activeCategoryId || internalActiveCategoryId.value);
const headerStyle = computed(() => ({
  '--header-bg-progress': String(props.pinnedProgress)
}));

const emitSearch = () => {
  emit('search', keyword.value.trim());
};

const openActionSheet = () => {
  isActionSheetVisible.value = true;
};

const closeActionSheet = () => {
  isActionSheetVisible.value = false;
};

const selectCategory = (categoryId: string) => {
  internalActiveCategoryId.value = categoryId;
  emit('category-change', categoryId);
};

const scanCode = () => {
  closeActionSheet();
  uni.showToast({ title: '扫一扫功能开发中', icon: 'none' });
};

const addRecipe = () => {
  closeActionSheet();
  uni.navigateTo({ url: '/pages/my-recipes/index' });
};
</script>

<style scoped lang="scss">
.home-header {
  position: sticky;
  top: 0;
  z-index: 30;
  margin: -32rpx -24rpx 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: rgba(245, 247, 250, 0.94);
  box-shadow: none;
  backdrop-filter: blur(24rpx);
  -webkit-backdrop-filter: blur(24rpx);
}

.home-header.is-immersive {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 35;
  margin: 0;
  border-radius: 0;
  background: transparent;
  color: #ffffff;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  overflow: hidden;
  transition:
    box-shadow 0.2s ease;
}

.home-header.is-immersive::before {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;
  height: 100%;
  border-radius: inherit;
  background: #ffffff;
  opacity: var(--header-bg-progress, 0);
  content: '';
}

.home-header.is-immersive.is-pinned {
  background: transparent;
  box-shadow: 0 16rpx 44rpx rgba(15, 23, 42, 0.1);
  color: var(--app-text);
}

.search-top {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 28rpx 24rpx 0;
}

.home-header.is-immersive .search-top {
  padding: calc(var(--status-bar-height) + 24rpx) 34rpx 0;
}

.add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 78rpx;
  height: 78rpx;
  flex: 0 0 78rpx;
  border: 0;
  border-radius: 50%;
  background: var(--app-accent);
  color: #ffffff;
  box-shadow: 0 16rpx 36rpx rgba(17, 17, 17, 0.16);
}

.add-button::after,
.category-tab::after {
  border: 0;
}

.add-button__icon {
  width: 34rpx;
  height: 34rpx;
}

.category-scroll {
  height: 92rpx;
  margin-top: 22rpx;
  white-space: nowrap;
}

.category-row {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 46rpx;
  min-width: 100%;
  height: 92rpx;
  padding: 0 24rpx 14rpx;
}

.category-tab {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  height: 78rpx;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: 29rpx;
  font-weight: 420;
}

.category-tab.is-active {
  color: var(--app-text);
  font-size: 32rpx;
  font-weight: 620;
}

.home-header.is-immersive .category-tab {
  color: rgba(255, 255, 255, 0.5);
  font-size: 30rpx;
  font-weight: 420;
}

.home-header.is-immersive.is-pinned .category-tab {
  color: var(--app-text-secondary);
}

.home-header.is-immersive .category-tab.is-active {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 620;
}

.home-header.is-immersive.is-pinned .category-tab.is-active {
  color: var(--app-text);
}

.home-header.is-immersive .category-row {
  padding: 0 32rpx 14rpx;
}

.category-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding-bottom: 14rpx;
  line-height: 1;
  white-space: nowrap;
}

.category-tab.is-active .category-label::after {
  position: absolute;
  right: 10rpx;
  bottom: 0;
  left: 10rpx;
  height: 5rpx;
  border-radius: 999rpx;
  background: var(--app-accent);
  content: '';
}

.home-header.is-immersive .category-tab.is-active .category-label::after {
  background: #ffffff;
}

.home-header.is-immersive.is-pinned .category-tab.is-active .category-label::after {
  background: var(--app-accent);
}

:deep(.nut-searchbar) {
  flex: 1;
  padding: 0;
  background: transparent;
}

:deep(.nut-searchbar__search-input) {
  min-height: 82rpx;
  border-radius: 999rpx;
  background: #f4f5f7;
}

.home-header.is-immersive :deep(.nut-searchbar__search-input) {
  background: rgba(255, 255, 255, 0.3);
  color: #ffffff;
  backdrop-filter: blur(22rpx);
  -webkit-backdrop-filter: blur(22rpx);
}

.home-header.is-immersive.is-pinned :deep(.nut-searchbar__search-input) {
  background: #f4f5f7;
  color: var(--app-text);
}

.home-header.is-immersive .add-button {
  background: transparent;
  box-shadow: none;
}

.home-header.is-immersive.is-pinned .add-button {
  background: var(--app-accent-soft);
  color: var(--app-text);
}

.home-header.is-immersive :deep(.nut-searchbar__input),
.home-header.is-immersive :deep(.nut-searchbar__input::placeholder) {
  color: rgba(255, 255, 255, 0.82);
  font-weight: 400;
}

.home-header.is-immersive.is-pinned :deep(.nut-searchbar__input),
.home-header.is-immersive.is-pinned :deep(.nut-searchbar__input::placeholder) {
  color: var(--app-text-secondary);
}

.dropdown-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: transparent;
}

.action-dropdown {
  position: fixed;
  top: calc(var(--status-bar-height) + 92rpx);
  right: 24rpx;
  z-index: 61;
  width: 278rpx;
  padding: 12rpx;
  border-radius: 30rpx;
  background: rgba(17, 17, 17, 0.96);
  box-shadow: 0 24rpx 64rpx rgba(0, 0, 0, 0.28);
}

.add-action__title {
  display: block;
}

.add-action-list {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.add-action {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 96rpx;
  padding: 18rpx 16rpx;
  border-radius: 22rpx;
  background: transparent;
  color: #ffffff;
}

.add-action__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50rpx;
  height: 50rpx;
  flex: 0 0 50rpx;
  border-radius: 16rpx;
  color: #ffffff;
}

.add-action__icon svg {
  width: 36rpx;
  height: 36rpx;
}

.add-action__title {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 950;
}
</style>
