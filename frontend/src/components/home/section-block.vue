<template>
  <view class="section-block">
    <view v-if="showHeader" class="section-header">
      <view>
        <text class="section-title">{{ title }}</text>
        <text v-if="subtitle" class="section-subtitle">{{ subtitle }}</text>
      </view>
      <text v-if="showAction" class="section-link" @tap="handleAction">{{ actionText }}</text>
    </view>
    <slot />
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    actionText?: string;
    showAction?: boolean;
    showHeader?: boolean;
  }>(),
  {
    subtitle: '',
    actionText: '查看全部',
    showAction: true,
    showHeader: true
  }
);

const emit = defineEmits<{
  'action-click': [];
}>();

const handleAction = () => {
  emit('action-click');
};
</script>

<style scoped lang="scss">
.section-block {
  margin-top: 40rpx;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.section-title,
.section-subtitle,
.section-link {
  display: block;
}

.section-title {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-medium);
  line-height: var(--line-section-title);
}

.section-subtitle {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.section-link {
  color: var(--app-primary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.section-link:active {
  opacity: 0.6;
}
</style>
