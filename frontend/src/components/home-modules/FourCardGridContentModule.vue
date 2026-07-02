<template>
  <view class="hm-four-grid" v-if="items.length">
    <view class="hm-four-grid__header" v-if="module.showTitle !== false && module.title">
      <text class="hm-four-grid__title">{{ module.title }}</text>
      <text v-if="module.subtitle" class="hm-four-grid__subtitle">{{ module.subtitle }}</text>
    </view>

    <view class="hm-four-grid__items">
      <view
        v-for="item in items"
        :key="item.id"
        class="hm-four-grid__card"
        @tap="handleTap(item)"
      >
        <image v-if="item.cover" class="hm-four-grid__image" :src="resolveImage(item.cover)" mode="aspectFill" />
        <view v-else class="hm-four-grid__placeholder">
          <text class="hm-four-grid__placeholder-text">{{ getTitle(item).slice(0, 1) }}</text>
        </view>
        <text class="hm-four-grid__name">{{ getTitle(item) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HomeModule, HomeModuleItem } from '../../services/public-api';
import { resolveAssetUrl } from '../../services/public-api';

const props = defineProps<{
  module: HomeModule;
}>();

const items = computed(() => props.module.items.slice(0, 4));

const resolveImage = (cover: string | null | undefined) => resolveAssetUrl(cover);
const getTitle = (item: HomeModuleItem) => item.title || item.name || '';

const handleTap = (item: HomeModuleItem) => {
  if (item.type === 'category') return;
  if (item.type === 'ingredient') {
    uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${item.id}` });
    return;
  }
  if (item.type === 'recipe') {
    uni.navigateTo({ url: `/pages/recipe-detail/index?id=${item.id}` });
  }
};
</script>

<style scoped lang="scss">
.hm-four-grid {
  margin: 0 32rpx 32rpx;
}

.hm-four-grid__header {
  margin-bottom: 20rpx;
}

.hm-four-grid__title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.hm-four-grid__subtitle {
  display: block;
  margin-top: 8rpx;
  color: var(--text-placeholder);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.hm-four-grid__items {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14rpx;
}

.hm-four-grid__card {
  min-width: 0;
}

.hm-four-grid__image,
.hm-four-grid__placeholder {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 20rpx;
  background: var(--app-surface-strong);
}

.hm-four-grid__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hm-four-grid__placeholder-text {
  color: var(--text-brand);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.hm-four-grid__name {
  display: block;
  margin-top: 10rpx;
  color: var(--text-primary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
