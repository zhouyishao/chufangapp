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
  margin-top: 36rpx;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.section-title,
.section-subtitle,
.section-link {
  display: block;
}

.section-title {
  color: var(--app-text);
  font-size: 32rpx;
  font-weight: 600;
}

.section-subtitle {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: 22rpx;
}

.section-link {
  color: var(--app-text-secondary);
  font-size: 22rpx;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.section-link:active {
  opacity: 0.6;
}
</style>
