<template>
  <view class="hm-grid" v-if="module && module.items.length">
    <view class="hm-grid__header" v-if="module.title">
      <text class="hm-grid__title">{{ module.title }}</text>
      <text v-if="module.subtitle" class="hm-grid__subtitle">{{ module.subtitle }}</text>
    </view>
    <view class="hm-grid__items">
      <view
        v-for="item in module.items"
        :key="item.id"
        class="hm-grid__card"
        @tap="goToRecipe(item.id)"
      >
        <image
          class="hm-grid__image"
          :src="resolveImage(item.cover)"
          mode="aspectFill"
        />
        <view class="hm-grid__body">
          <text class="hm-grid__name">{{ item.title }}</text>
          <text v-if="item.description" class="hm-grid__desc">{{ item.description }}</text>
          <view class="hm-grid__tags">
            <text v-if="item.duration" class="hm-grid__tag">{{ item.duration }}</text>
            <text v-if="item.difficulty" class="hm-grid__tag">{{ item.difficulty }}</text>
            <text v-if="item.servings" class="hm-grid__tag">{{ item.servings }}人份</text>
          </view>
        </view>
      </view>
    </view>
    <view
      v-if="module.showMore && module.moreLink"
      class="hm-grid__more"
      @tap="handleMore"
    >
      <text>更多</text>
      <app-icon name="chevron-right" size="20rpx" />
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from '../app/app-icon.vue';
import type { HomeModule } from '../../services/public-api';
import { resolveAssetUrl } from '../../services/public-api';

defineProps<{
  module: HomeModule;
}>();

const resolveImage = (cover: string | null | undefined) => resolveAssetUrl(cover);

const goToRecipe = (id: string) => {
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${id}` });
};

const handleMore = () => {
  // handled by parent
};
</script>

<style scoped lang="scss">
.hm-grid {
  margin: 0 32rpx 32rpx;
}

.hm-grid__header {
  margin-bottom: 20rpx;
}

.hm-grid__title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.hm-grid__subtitle {
  display: block;
  margin-top: 8rpx;
  color: var(--text-placeholder);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.hm-grid__items {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.hm-grid__card {
  overflow: hidden;
  border-radius: 24rpx;
  background: var(--app-surface-strong);
}

.hm-grid__image {
  width: 100%;
  height: 280rpx;
}

.hm-grid__body {
  padding: 18rpx;
}

.hm-grid__name {
  display: block;
  color: var(--text-primary);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-grid__desc {
  display: -webkit-box;
  margin-top: 8rpx;
  overflow: hidden;
  color: var(--text-placeholder);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.hm-grid__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.hm-grid__tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 10rpx;
  border-radius: var(--app-radius-button, 8rpx);
  background: var(--app-accent-soft);
  color: var(--text-placeholder);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-tabbar);
}

.hm-grid__more {
  margin-top: 20rpx;
  text-align: right;
  color: var(--text-brand);
  font-size: var(--font-size-caption);
}
</style>
