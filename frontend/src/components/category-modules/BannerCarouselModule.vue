<template>
  <view class="cm-banner" v-if="banners.length">
    <swiper
      class="cm-banner__swiper"
      :indicator-dots="banners.length > 1"
      indicator-color="rgba(255,255,255,0.5)"
      indicator-active-color="#fff"
      :autoplay="true"
      :interval="4000"
      :circular="banners.length > 1"
    >
      <swiper-item v-for="banner in banners" :key="banner.id">
        <view class="cm-banner__item" @tap="emit('tap', banner)">
          <image
            class="cm-banner__image"
            :src="banner.cover"
            mode="aspectFill"
            :style="{ objectPosition: banner.imageFocus === 'left' ? 'left center' : banner.imageFocus === 'right' ? 'right center' : 'center center' }"
          />
          <view class="cm-banner__gradient" />
          <view class="cm-banner__copy" v-if="banner.title">
            <text class="cm-banner__title">{{ banner.title }}</text>
            <text v-if="banner.subtitle" class="cm-banner__subtitle">{{ banner.subtitle }}</text>
          </view>
        </view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script setup lang="ts">
import type { PageModuleBanner } from '../../services/public-api';

defineProps<{
  banners: PageModuleBanner[];
}>();

const emit = defineEmits<{
  tap: [banner: PageModuleBanner];
}>();
</script>

<style scoped lang="scss">
.cm-banner {
  margin: 0 32rpx 24rpx;
  border-radius: 32rpx;
  overflow: hidden;
}

.cm-banner__swiper {
  width: 100%;
  height: 340rpx;
}

.cm-banner__item {
  position: relative;
  width: 100%;
  height: 340rpx;
  overflow: hidden;
}

.cm-banner__image {
  width: 100%;
  height: 340rpx;
}

.cm-banner__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(17, 17, 17, 0.15) 0%, rgba(17, 17, 17, 0.05) 40%, rgba(17, 17, 17, 0.55) 100%);
  pointer-events: none;
}

.cm-banner__copy {
  position: absolute;
  left: 28rpx;
  right: 28rpx;
  bottom: 60rpx;
  display: flex;
  flex-direction: column;
  z-index: 3;
}

.cm-banner__title {
  color: var(--text-white);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
  text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
}

.cm-banner__subtitle {
  margin-top: 12rpx;
  color: rgba(255, 253, 252, 0.88);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
  text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.16);
}
</style>
