<template>
  <view
    :class="['content-detail-state', `is-${state}`]"
    :aria-live="state === 'error' ? 'assertive' : 'polite'"
    :aria-busy="state === 'loading'"
  >
    <template v-if="state === 'loading'">
      <view class="content-detail-state__skeleton is-title" />
      <view class="content-detail-state__skeleton" />
      <view class="content-detail-state__skeleton is-short" />
    </template>
    <template v-else>
      <view class="content-detail-state__icon" aria-hidden="true">
        <app-icon :name="state === 'empty' ? 'search' : 'image'" size="34rpx" />
      </view>
      <text class="content-detail-state__title">{{ title }}</text>
      <text v-if="description" class="content-detail-state__description">{{ description }}</text>
      <button class="content-detail-state__action" @tap="$emit('action')">
        {{ state === 'empty' ? '返回上一页' : '重新加载' }}
      </button>
    </template>
  </view>
</template>

<script setup lang="ts">
import AppIcon from './app/app-icon.vue';

withDefaults(defineProps<{
  state: 'loading' | 'error' | 'empty';
  title?: string;
  description?: string;
}>(), {
  title: '内容暂时不可用',
  description: ''
});

defineEmits<{ action: [] }>();
</script>

<style scoped lang="scss">
.content-detail-state {
  display: flex;
  min-height: 340rpx;
  margin: var(--space-6) var(--app-page-padding);
  padding: var(--space-8) var(--space-6);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--space-3);
  border: 1rpx solid var(--app-border);
  border-radius: var(--app-radius-card);
  color: var(--text-secondary);
  background: var(--app-surface-strong);
}

.content-detail-state.is-loading {
  align-items: stretch;
  justify-content: flex-start;
}

.content-detail-state__icon {
  display: grid;
  width: var(--touch-target);
  height: var(--touch-target);
  margin-bottom: var(--space-1);
  place-items: center;
  border-radius: 50%;
  color: var(--app-primary);
  background: color-mix(in srgb, var(--app-primary) 12%, var(--app-surface-strong));
}

.content-detail-state__title {
  color: var(--text-primary);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
  text-align: center;
}

.content-detail-state__description {
  max-width: 520rpx;
  color: var(--text-secondary);
  font-size: var(--font-size-body);
  line-height: var(--line-body);
  text-align: center;
}

.content-detail-state__action {
  min-width: 192rpx;
  min-height: var(--touch-target);
  margin-top: var(--space-2);
  padding: 0 var(--space-5);
  border: 1rpx solid var(--app-border);
  border-radius: var(--app-radius-button);
  color: var(--app-primary);
  font-size: var(--font-size-body);
  font-weight: var(--font-medium);
  line-height: var(--line-body);
  background: transparent;
}

.content-detail-state__action::after {
  border: 0;
}

.content-detail-state__skeleton {
  width: 100%;
  height: 28rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-muted);
  animation: detail-state-pulse 1.4s ease-in-out infinite;
}

.content-detail-state__skeleton.is-title {
  width: 52%;
  height: 42rpx;
}

.content-detail-state__skeleton.is-short {
  width: 68%;
}

@keyframes detail-state-pulse {
  50% {
    opacity: 0.48;
  }
}
</style>
