<template>
  <view class="hm-list" v-if="module && module.items.length">
    <view class="hm-list__header" v-if="module.title">
      <text class="hm-list__title">{{ module.title }}</text>
      <text v-if="module.subtitle" class="hm-list__subtitle">{{ module.subtitle }}</text>
    </view>
    <view class="hm-list__items">
      <view
        v-for="item in module.items"
        :key="item.id"
        class="hm-list__card"
        @tap="goToRecipe(item.id)"
      >
        <image
          class="hm-list__image"
          :src="resolveImage(item.cover)"
          mode="aspectFill"
        />
        <view class="hm-list__body">
          <text class="hm-list__name">{{ item.title }}</text>
          <text v-if="item.description" class="hm-list__desc">{{ item.description }}</text>
          <view class="hm-list__tags">
            <text v-if="item.duration" class="hm-list__tag">{{ item.duration }}</text>
            <text v-if="item.difficulty" class="hm-list__tag">{{ item.difficulty }}</text>
            <text v-if="item.servings" class="hm-list__tag">{{ item.servings }}人份</text>
            <text v-if="item.favoriteCount" class="hm-list__fav">♡ {{ item.favoriteCount }}</text>
          </view>
        </view>
      </view>
    </view>
    <view
      v-if="module.showMore && module.moreLink"
      class="hm-list__more"
      @tap="handleMore"
    >
      <text>更多 ›</text>
    </view>
  </view>
</template>

<script setup lang="ts">
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
.hm-list {
  margin: 0 32rpx 32rpx;
}

.hm-list__header {
  margin-bottom: 20rpx;
}

.hm-list__title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.hm-list__subtitle {
  display: block;
  margin-top: 8rpx;
  color: var(--text-placeholder);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.hm-list__items {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.hm-list__card {
  display: flex;
  gap: 20rpx;
  padding: 16rpx;
  border-radius: 24rpx;
  background: var(--app-surface-strong);
  overflow: hidden;
}

.hm-list__image {
  flex: 0 0 200rpx;
  width: 200rpx;
  height: 160rpx;
  border-radius: 18rpx;
}

.hm-list__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hm-list__name {
  display: block;
  color: var(--text-primary);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-list__desc {
  display: -webkit-box;
  margin-top: 8rpx;
  overflow: hidden;
  color: var(--text-placeholder);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.hm-list__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.hm-list__tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 10rpx;
  border-radius: var(--app-radius-button, 8rpx);
  background: var(--app-accent-soft);
  color: var(--text-placeholder);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-tabbar);
}

.hm-list__fav {
  color: var(--text-placeholder);
  font-size: var(--font-size-tabbar);
  margin-left: auto;
}

.hm-list__more {
  margin-top: 20rpx;
  text-align: right;
  color: var(--text-brand);
  font-size: var(--font-size-caption);
}
</style>
