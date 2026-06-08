<template>
  <view class="cm-grid" v-if="items.length">
    <view class="cm-grid__items">
      <view
        v-for="item in items"
        :key="item.key"
        :class="['cm-grid__card', { 'cm-grid__card--system': item.type === 'system' }]"
        @tap="emit('tap', item)"
      >
        <text class="cm-grid__name">{{ item.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { PageModuleCategoryFilterItem } from '../../services/public-api';

defineProps<{
  items: PageModuleCategoryFilterItem[];
}>();

const emit = defineEmits<{
  tap: [item: PageModuleCategoryFilterItem];
}>();
</script>

<style scoped lang="scss">
.cm-grid {
  padding: 0 32rpx 32rpx;
}

.cm-grid__items {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16rpx;
}

.cm-grid__card {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120rpx;
  border-radius: 24rpx;
  background: var(--app-surface-strong);
  border: 1px solid var(--app-border);
  padding: 16rpx 8rpx;
}

.cm-grid__card--system {
  background: var(--app-accent-soft);
  border-color: transparent;
}

.cm-grid__name {
  color: var(--text-primary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
