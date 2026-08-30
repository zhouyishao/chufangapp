<template>
  <view class="app-page-state" :class="`app-page-state--${kind}`" :aria-busy="kind === 'loading' ? 'true' : undefined">
    <view v-if="kind === 'loading'" class="app-page-state__skeleton" aria-hidden="true">
      <view class="app-page-state__skeleton-line is-wide" />
      <view class="app-page-state__skeleton-line" />
    </view>
    <text class="app-page-state__title">{{ title }}</text>
    <text v-if="description" class="app-page-state__description">{{ description }}</text>
    <button v-if="actionText" class="app-page-state__action app-pressable" :disabled="actionLoading" @tap="$emit('action')">
      {{ actionLoading ? '处理中…' : actionText }}
    </button>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    kind: 'loading' | 'empty' | 'error' | 'offline' | 'end';
    title: string;
    description?: string;
    actionText?: string;
    actionLoading?: boolean;
  }>(),
  {
    description: '',
    actionText: '',
    actionLoading: false
  }
);

defineEmits<{ action: [] }>();
</script>

<style scoped lang="scss">
.app-page-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
  border: 1rpx solid var(--app-border);
  border-radius: var(--radius-lg);
  background: var(--app-surface-strong);
  text-align: center;
}

.app-page-state__title {
  color: var(--text-primary);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
}

.app-page-state__description {
  margin-top: var(--space-2);
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.app-page-state__action {
  min-height: var(--touch-target);
  margin-top: var(--space-4);
  padding: 0 28rpx;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
}

.app-page-state__action::after {
  border: 0;
}

.app-page-state__skeleton {
  width: 100%;
  margin-bottom: var(--space-4);
}

.app-page-state__skeleton-line {
  width: 46%;
  height: 20rpx;
  margin: 0 auto 14rpx;
  border-radius: var(--radius-xs);
  background: rgba(233, 226, 214, 0.78);
}

.app-page-state__skeleton-line.is-wide {
  width: 72%;
}
</style>
