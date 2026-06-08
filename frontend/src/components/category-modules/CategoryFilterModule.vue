<template>
  <view class="cm-filter" v-if="items.length">
    <scroll-view scroll-x enable-flex :show-scrollbar="false" class="cm-filter__scroll">
      <view class="cm-filter__row">
        <view
          v-for="item in items"
          :key="item.key"
          :class="['cm-filter__chip', { 'cm-filter__chip--active': item.key === activeKey }]"
          @tap="emit('change', item)"
        >
          {{ item.name }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import type { PageModuleCategoryFilterItem } from '../../services/public-api';

defineProps<{
  items: PageModuleCategoryFilterItem[];
  activeKey: string;
}>();

const emit = defineEmits<{
  change: [item: PageModuleCategoryFilterItem];
}>();
</script>

<style scoped lang="scss">
.cm-filter {
  padding: 16rpx 32rpx;
}

.cm-filter__scroll {
  white-space: nowrap;
}

.cm-filter__row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: max-content;
  min-width: 100%;
}

.cm-filter__chip {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 28rpx;
  background: var(--app-surface-strong);
  border: 1px solid var(--app-border);
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-tabbar);
  white-space: nowrap;
  transition: all 180ms ease;
}

.cm-filter__chip--active {
  background: var(--text-brand);
  border-color: var(--text-brand);
  color: var(--text-white);
}
</style>
