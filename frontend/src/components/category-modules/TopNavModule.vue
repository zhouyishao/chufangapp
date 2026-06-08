<template>
  <view class="cm-topnav" v-if="items.length">
    <scroll-view scroll-x enable-flex :show-scrollbar="false" class="cm-topnav__scroll">
      <view class="cm-topnav__row">
        <view
          v-for="item in items"
          :key="item.id"
          :class="['cm-topnav__tab', { 'cm-topnav__tab--active': item.active }]"
          @tap="emit('change', item)"
        >
          {{ item.name }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import type { PageModuleTopNavItem } from '../../services/public-api';

defineProps<{
  items: PageModuleTopNavItem[];
}>();

const emit = defineEmits<{
  change: [item: PageModuleTopNavItem];
}>();
</script>

<style scoped lang="scss">
.cm-topnav {
  padding: 0 32rpx;
}

.cm-topnav__scroll {
  white-space: nowrap;
}

.cm-topnav__row {
  display: flex;
  align-items: center;
  gap: 40rpx;
  width: max-content;
  min-width: 100%;
  padding: 12rpx 0;
}

.cm-topnav__tab {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  padding-bottom: 8rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-tabbar);
  white-space: nowrap;
  transition: color 180ms ease;
}

.cm-topnav__tab--active {
  color: var(--text-brand);
  font-weight: var(--font-semibold);
  border-bottom: 4rpx solid var(--text-brand);
}
</style>
