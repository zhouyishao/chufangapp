<template>
  <view class="hm-large-image" v-if="items.length">
    <view class="hm-large-image__header" v-if="module.showTitle !== false && module.title">
      <text class="hm-large-image__title">{{ module.title }}</text>
      <text v-if="module.subtitle" class="hm-large-image__subtitle">{{ module.subtitle }}</text>
    </view>

    <swiper
      v-if="items.length > 1"
      class="hm-large-image__swiper"
      :indicator-dots="false"
      :autoplay="true"
      :interval="4200"
      :circular="true"
      @change="handleChange"
    >
      <swiper-item v-for="item in items" :key="item.id">
        <view class="hm-large-image__card" @tap="handleTap(item)">
          <image class="hm-large-image__image" :src="resolveImage(item.cover)" mode="aspectFill" />
          <view class="hm-large-image__copy" v-if="item.title || item.subtitle">
            <text v-if="item.title" class="hm-large-image__copy-title">{{ item.title }}</text>
            <text v-if="item.subtitle" class="hm-large-image__copy-subtitle">{{ item.subtitle }}</text>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <view v-else class="hm-large-image__card" @tap="handleTap(items[0])">
      <image class="hm-large-image__image" :src="resolveImage(items[0].cover)" mode="aspectFill" />
      <view class="hm-large-image__copy" v-if="items[0].title || items[0].subtitle">
        <text v-if="items[0].title" class="hm-large-image__copy-title">{{ items[0].title }}</text>
        <text v-if="items[0].subtitle" class="hm-large-image__copy-subtitle">{{ items[0].subtitle }}</text>
      </view>
    </view>

    <view class="hm-large-image__dots" v-if="items.length > 1">
      <view
        v-for="item, index in items"
        :key="item.id"
        :class="['hm-large-image__dot', { 'hm-large-image__dot--active': index === current }]"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { HomeModule, HomeModuleItem } from '../../services/public-api';
import { resolveAssetUrl } from '../../services/public-api';

const props = defineProps<{
  module: HomeModule;
}>();

const current = ref(0);
const items = computed(() => props.module.items.filter((item) => item.cover && item.status !== 'DISABLED'));

const resolveImage = (cover: string | null | undefined) => resolveAssetUrl(cover);

const handleChange = (event: { detail: { current: number } }) => {
  current.value = event.detail.current;
};

const handleTap = (item: HomeModuleItem) => {
  if (item.jumpType === 'EXTERNAL_LINK' && item.jumpTarget) {
    uni.navigateTo({ url: `/pages/recommendations/index?url=${encodeURIComponent(item.jumpTarget)}` });
    return;
  }

  const targetId = item.jumpTarget || item.id;
  if ((item.jumpType === 'CONTENT_DETAIL' || item.type === 'recipe') && targetId) {
    if (item.type === 'beverage') {
      uni.navigateTo({ url: `/pages/beverage-detail/index?id=${targetId}` });
      return;
    }
    uni.navigateTo({ url: item.type === 'ingredient' ? `/pages/ingredient-detail/index?id=${targetId}` : `/pages/recipe-detail/index?id=${targetId}` });
  } else if (item.type === 'ingredient' && targetId) {
    uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${targetId}` });
  } else if (item.type === 'beverage' && targetId) {
    uni.navigateTo({ url: `/pages/beverage-detail/index?id=${targetId}` });
  }
};
</script>

<style scoped lang="scss">
.hm-large-image {
  margin: 0 32rpx 32rpx;
}

.hm-large-image__header {
  margin-bottom: 20rpx;
}

.hm-large-image__title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.hm-large-image__subtitle {
  display: block;
  margin-top: 8rpx;
  color: var(--text-placeholder);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.hm-large-image__swiper,
.hm-large-image__card {
  width: 100%;
  height: 248rpx;
}

.hm-large-image__card {
  position: relative;
  overflow: hidden;
  border-radius: 32rpx;
  background: var(--app-surface-strong);
}

.hm-large-image__image {
  width: 100%;
  height: 100%;
}

.hm-large-image__copy {
  position: absolute;
  left: 28rpx;
  right: 28rpx;
  bottom: 24rpx;
}

.hm-large-image__copy-title {
  display: block;
  color: #fffdfc;
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
}

.hm-large-image__copy-subtitle {
  display: block;
  margin-top: 6rpx;
  color: rgba(255, 253, 252, 0.82);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.hm-large-image__dots {
  display: flex;
  justify-content: center;
  gap: 8rpx;
  margin-top: 16rpx;
}

.hm-large-image__dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: var(--app-border-strong);
}

.hm-large-image__dot--active {
  width: 24rpx;
  background: var(--text-brand);
}
</style>
