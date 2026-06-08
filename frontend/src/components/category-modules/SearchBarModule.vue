<template>
  <view class="cm-searchbar" v-if="config">
    <view class="cm-searchbar__bar" @tap="emit('tap')">
      <text class="cm-searchbar__icon" />
      <text class="cm-searchbar__placeholder">{{ config.placeholder ?? '搜索' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  config?: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  tap: [];
}>();
</script>

<style scoped lang="scss">
.cm-searchbar {
  padding: 20rpx 32rpx;
}

.cm-searchbar__bar {
  display: flex;
  align-items: center;
  height: 80rpx;
  padding: 0 28rpx;
  border-radius: 40rpx;
  background: var(--app-surface-strong);
  border: 1px solid var(--app-border);
}

.cm-searchbar__icon {
  display: block;
  width: 32rpx;
  height: 32rpx;
  margin-right: 16rpx;
  background: currentColor;
  color: var(--text-placeholder);
  -webkit-mask: url('../../assets/icons/icon_search.svg') center / contain no-repeat;
  mask: url('../../assets/icons/icon_search.svg') center / contain no-repeat;
}

.cm-searchbar__placeholder {
  color: var(--text-placeholder);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-tabbar);
}
</style>
