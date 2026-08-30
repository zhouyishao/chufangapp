<template>
  <view :class="['content-detail-hero', { 'has-fixed-actions': fixedActions }]">
    <image
      v-if="src && !failed"
      class="content-detail-hero__image"
      :src="src"
      :alt="alt"
      mode="aspectFill"
      @error="failed = true"
    />
    <view v-else class="content-detail-hero__fallback">
      <app-icon name="image" size="40rpx" />
      <text>主图暂时无法显示</text>
    </view>

    <view class="content-detail-hero__actions">
      <button v-if="showBack" class="content-detail-hero__action" :aria-label="backLabel" @tap="$emit('back')">
        <app-icon name="arrow-left" size="30rpx" />
      </button>
      <view class="content-detail-hero__actions-right">
        <button
          v-if="showFavorite"
          :class="['content-detail-hero__action', { 'is-active': favorite }]"
          :aria-label="favorite ? '取消收藏' : '收藏'"
          :aria-pressed="favorite"
          @tap="$emit('favorite')"
        >
          <app-icon :name="favorite ? 'heart-filled' : 'heart'" size="30rpx" />
        </button>
        <button
          v-if="showShare"
          class="content-detail-hero__action"
          aria-label="分享"
          @tap="$emit('share')"
        >
          <app-icon name="share" size="30rpx" />
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppIcon from './app/app-icon.vue';

const props = withDefaults(defineProps<{
  src?: string | null;
  alt: string;
  favorite?: boolean;
  showFavorite?: boolean;
  showShare?: boolean;
  showBack?: boolean;
  backLabel?: string;
  fixedActions?: boolean;
}>(), {
  src: '',
  favorite: false,
  showFavorite: true,
  showShare: true,
  showBack: true,
  backLabel: '返回',
  fixedActions: false
});

defineEmits<{
  back: [];
  favorite: [];
  share: [];
}>();

const failed = ref(false);
watch(() => props.src, () => {
  failed.value = false;
});
</script>

<style scoped lang="scss">
.content-detail-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 852 / 844;
  overflow: hidden;
  background: #ede8df;
}

.content-detail-hero.has-fixed-actions {
  overflow: visible;
}

.content-detail-hero__image,
.content-detail-hero__fallback {
  display: block;
  width: 100%;
  height: 100%;
}

.content-detail-hero__image {
  object-fit: cover;
}

.content-detail-hero__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.content-detail-hero__actions {
  position: absolute;
  z-index: var(--z-sticky);
  top: calc(var(--app-safe-area-top) + var(--space-4));
  right: var(--space-5);
  left: var(--space-5);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.content-detail-hero.has-fixed-actions .content-detail-hero__actions {
  position: fixed;
  z-index: calc(var(--z-tabbar) + 2);
  top: calc(var(--app-safe-area-top) + var(--space-3));
  right: max(var(--space-5), calc((100vw - var(--app-canvas-width)) / 2 + var(--space-5)));
  left: max(var(--space-5), calc((100vw - var(--app-canvas-width)) / 2 + var(--space-5)));
}

.content-detail-hero__actions-right {
  display: flex;
  gap: var(--space-3);
}

.content-detail-hero__action {
  display: grid;
  width: var(--touch-target);
  min-width: var(--touch-target);
  height: var(--touch-target);
  min-height: var(--touch-target);
  margin: 0;
  padding: 0;
  place-items: center;
  border: 1rpx solid rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  color: var(--text-primary);
  background: rgba(255, 253, 252, 0.68);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.8), 0 8rpx 24rpx rgba(47, 47, 47, 0.08);
  backdrop-filter: blur(12px) saturate(112%);
  -webkit-backdrop-filter: blur(12px) saturate(112%);
}

.content-detail-hero__action::after {
  border: 0;
}

.content-detail-hero__action.is-active {
  color: var(--app-primary);
}
</style>
