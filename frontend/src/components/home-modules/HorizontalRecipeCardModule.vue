<template>
  <view class="hm-horizontal" v-if="module && module.items.length">
    <view class="hm-horizontal__header" v-if="module.title">
      <text class="hm-horizontal__title">{{ module.title }}</text>
      <text v-if="module.subtitle" class="hm-horizontal__subtitle">{{ module.subtitle }}</text>
    </view>
    <scroll-view class="hm-horizontal__scroll" scroll-x enable-flex :show-scrollbar="false">
      <view
        v-for="item in module.items"
        :key="item.id"
        class="hm-horizontal__card"
        @tap="goToRecipe(item.id)"
      >
        <image
          class="hm-horizontal__image"
          :src="resolveImage(item.cover)"
          mode="aspectFill"
        />
        <view class="hm-horizontal__body">
          <text class="hm-horizontal__name">{{ item.title }}</text>
          <view class="hm-horizontal__tags" v-if="item.difficulty || item.duration">
            <text v-if="item.duration" class="hm-horizontal__tag">{{ item.duration }}</text>
            <text v-if="item.difficulty" class="hm-horizontal__tag">{{ item.difficulty }}</text>
            <text v-if="item.servings" class="hm-horizontal__tag">{{ item.servings }}人份</text>
          </view>
          <view class="hm-horizontal__meta" v-if="item.favoriteCount">
            <view class="hm-horizontal__fav">
              <app-icon name="heart" size="18rpx" />
              <text>{{ item.favoriteCount }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
    <view
      v-if="module.showMore && module.moreLink"
      class="hm-horizontal__more"
      @tap="handleMore"
    >
      <text>更多</text>
      <app-icon name="chevron-right" size="20rpx" />
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from '../app/app-icon.vue';
import type { HomeModule, HomeModuleItem } from '../../services/public-api';
import { resolveAssetUrl } from '../../services/public-api';

defineProps<{
  module: HomeModule;
}>();

const resolveImage = (cover: string | null | undefined) => resolveAssetUrl(cover);

const goToRecipe = (id: string) => {
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${id}` });
};

const handleMore = () => {
  // handled by parent or navigate
};
</script>

<style scoped lang="scss">
.hm-horizontal {
  margin: 0 32rpx 32rpx;
}

.hm-horizontal__header {
  margin-bottom: 20rpx;
}

.hm-horizontal__title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.hm-horizontal__subtitle {
  display: block;
  margin-top: 8rpx;
  color: var(--text-placeholder);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.hm-horizontal__scroll {
  white-space: nowrap;
}

.hm-horizontal__card {
  display: inline-flex;
  flex-direction: column;
  width: 260rpx;
  margin-right: 20rpx;
  overflow: hidden;
  vertical-align: top;
  white-space: normal;
}

.hm-horizontal__card:last-child {
  margin-right: 0;
}

.hm-horizontal__image {
  width: 260rpx;
  height: 180rpx;
  border-radius: 24rpx;
}

.hm-horizontal__body {
  padding: 14rpx 8rpx 0;
}

.hm-horizontal__name {
  display: block;
  color: var(--text-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-horizontal__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 8rpx;
}

.hm-horizontal__tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 10rpx;
  border-radius: var(--app-radius-button, 8rpx);
  background: var(--app-accent-soft);
  color: var(--text-placeholder);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-tabbar);
}

.hm-horizontal__meta {
  margin-top: 8rpx;
}

.hm-horizontal__fav {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  color: var(--text-placeholder);
  font-size: var(--font-size-tabbar);
}

.hm-horizontal__more {
  margin-top: 20rpx;
  text-align: right;
  color: var(--text-brand);
  font-size: var(--font-size-caption);
}
</style>
