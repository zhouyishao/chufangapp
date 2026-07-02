<template>
  <view class="hm-seasonal" v-if="module && module.items.length">
    <view class="hm-seasonal__header" v-if="module.title">
      <text class="hm-seasonal__title">{{ module.title }}</text>
      <text v-if="module.subtitle" class="hm-seasonal__subtitle">{{ module.subtitle }}</text>
    </view>
    <scroll-view class="hm-seasonal__scroll" scroll-x enable-flex :show-scrollbar="false">
      <view
        v-for="item in module.items"
        :key="item.id"
        class="hm-seasonal__card"
        @tap="goToIngredient(item.id)"
      >
        <image
          class="hm-seasonal__image"
          :src="resolveImage(item.cover)"
          mode="aspectFill"
        />
        <view class="hm-seasonal__body">
          <text class="hm-seasonal__name">{{ item.name }}</text>
          <view class="hm-seasonal__price" v-if="item.currentPrice">
            <text class="hm-seasonal__price-value">¥{{ item.currentPrice }}</text>
            <text v-if="item.priceUnit" class="hm-seasonal__price-unit">/{{ item.priceUnit }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
    <view
      v-if="module.showMore && module.moreLink"
      class="hm-seasonal__more"
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

const goToIngredient = (id: string) => {
  uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${id}` });
};

const handleMore = () => {
  // handled by parent
};
</script>

<style scoped lang="scss">
.hm-seasonal {
  margin: 0 32rpx 32rpx;
}

.hm-seasonal__header {
  margin-bottom: 20rpx;
}

.hm-seasonal__title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.hm-seasonal__subtitle {
  display: block;
  margin-top: 8rpx;
  color: var(--text-placeholder);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.hm-seasonal__scroll {
  white-space: nowrap;
}

.hm-seasonal__card {
  display: inline-flex;
  flex-direction: column;
  width: 220rpx;
  margin-right: 20rpx;
  overflow: hidden;
  vertical-align: top;
  white-space: normal;
  border-radius: 24rpx;
  background: var(--app-surface-strong);
}

.hm-seasonal__card:last-child {
  margin-right: 0;
}

.hm-seasonal__image {
  width: 220rpx;
  height: 180rpx;
  border-radius: 24rpx 24rpx 0 0;
}

.hm-seasonal__body {
  padding: 16rpx 16rpx 20rpx;
}

.hm-seasonal__name {
  display: block;
  color: var(--text-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-seasonal__price {
  margin-top: 8rpx;
}

.hm-seasonal__price-value {
  color: var(--text-warm);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.hm-seasonal__price-unit {
  color: var(--text-placeholder);
  font-size: var(--font-size-tabbar);
}

.hm-seasonal__more {
  margin-top: 20rpx;
  text-align: right;
  color: var(--text-brand);
  font-size: var(--font-size-caption);
}
</style>
