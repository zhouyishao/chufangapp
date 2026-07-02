<template>
  <svg
    class="app-icon"
    :class="{ 'app-icon--filled': filled }"
    :style="{ width: normalizedSize, height: normalizedSize }"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.9"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <g v-if="name === 'home'">
      <path d="M4.2 10.4 12 4.1l7.8 6.3" />
      <path d="M6.3 9.7v9.1h11.4V9.7" />
      <path d="M9.8 18.8v-5h4.4v5" />
    </g>
    <g v-else-if="name === 'category'">
      <rect x="4" y="4" width="6" height="6" rx="1.6" />
      <rect x="14" y="4" width="6" height="6" rx="1.6" />
      <rect x="4" y="14" width="6" height="6" rx="1.6" />
      <rect x="14" y="14" width="6" height="6" rx="1.6" />
    </g>
    <g v-else-if="name === 'basket'">
      <path d="M5.6 8.7h12.8l-1.1 10.1H6.7L5.6 8.7Z" />
      <path d="M9 8.6a3 3 0 0 1 6 0" />
      <path d="M9 12.5v2.8" />
      <path d="M15 12.5v2.8" />
    </g>
    <g v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.7 20a6.4 6.4 0 0 1 12.6 0" />
    </g>
    <g v-else-if="name === 'search'">
      <circle cx="10.8" cy="10.8" r="5.8" />
      <path d="m15.2 15.2 4.4 4.4" />
    </g>
    <g v-else-if="name === 'heart'">
      <path d="M19.2 6.5a4.2 4.2 0 0 0-5.9 0L12 7.8l-1.3-1.3a4.2 4.2 0 0 0-5.9 5.9L12 19.6l7.2-7.2a4.2 4.2 0 0 0 0-5.9Z" />
    </g>
    <g v-else-if="name === 'heart-filled'">
      <path
        d="M19.2 6.5a4.2 4.2 0 0 0-5.9 0L12 7.8l-1.3-1.3a4.2 4.2 0 0 0-5.9 5.9L12 19.6l7.2-7.2a4.2 4.2 0 0 0 0-5.9Z"
        fill="currentColor"
        stroke="currentColor"
      />
    </g>
    <g v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="8.1" />
      <path d="M12 7.8v4.7l3 1.8" />
    </g>
    <g v-else-if="name === 'difficulty'">
      <path d="M5 19V9.8" />
      <path d="M12 19V5" />
      <path d="M19 19v-7.2" />
    </g>
    <g v-else-if="name === 'users'">
      <circle cx="9.2" cy="8.5" r="3" />
      <path d="M3.8 19.2a5.6 5.6 0 0 1 10.8 0" />
      <path d="M15.5 6.6a2.8 2.8 0 0 1 0 5.2" />
      <path d="M17 14.3a5.1 5.1 0 0 1 3.2 4.9" />
    </g>
    <g v-else-if="name === 'recipe'">
      <path d="M7.2 4.2h9.6a1.8 1.8 0 0 1 1.8 1.8v13.8H7.2a2.4 2.4 0 0 1-2.4-2.4V6.6a2.4 2.4 0 0 1 2.4-2.4Z" />
      <path d="M8 8.2h7.2" />
      <path d="M8 12h6" />
      <path d="M7.2 19.8a2.4 2.4 0 0 1 0-4.8h11.4" />
    </g>
    <g v-else-if="name === 'history'">
      <path d="M5.8 6.8A8 8 0 1 1 4.4 12" />
      <path d="M4.4 5.3v4.1h4.1" />
      <path d="M12 8.2v4.2l2.7 1.7" />
    </g>
    <g v-else-if="name === 'box'">
      <path d="m12 4.2 7.3 3.8-7.3 3.8L4.7 8 12 4.2Z" />
      <path d="M4.7 8v8l7.3 3.8 7.3-3.8V8" />
      <path d="M12 11.8v8" />
    </g>
    <g v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3.1" />
      <path d="M18.7 13.4a7.5 7.5 0 0 0 .1-2.8l2-1.4-2-3.4-2.4 1a7.5 7.5 0 0 0-2.4-1.4L13.7 3h-3.4L10 5.4a7.5 7.5 0 0 0-2.4 1.4l-2.4-1-2 3.4 2 1.4a7.5 7.5 0 0 0 .1 2.8l-2.1 1.4 2 3.4 2.5-1a7.5 7.5 0 0 0 2.3 1.3l.3 2.5h3.4l.3-2.5a7.5 7.5 0 0 0 2.3-1.3l2.5 1 2-3.4-2.1-1.4Z" />
    </g>
    <g v-else-if="name === 'scan'">
      <path d="M5.4 8V5.8a.8.8 0 0 1 .8-.8H8" />
      <path d="M16 5h1.8a.8.8 0 0 1 .8.8V8" />
      <path d="M18.6 16v2.2a.8.8 0 0 1-.8.8H16" />
      <path d="M8 19H6.2a.8.8 0 0 1-.8-.8V16" />
      <rect x="8.3" y="8.3" width="7.4" height="7.4" rx="1.4" />
    </g>
    <g v-else-if="name === 'plus'">
      <path d="M12 5.2v13.6" />
      <path d="M5.2 12h13.6" />
    </g>
    <g v-else-if="name === 'minus'">
      <path d="M5.2 12h13.6" />
    </g>
    <g v-else-if="name === 'check'">
      <path d="m5.2 12.4 4.2 4.2 9.4-9.2" />
    </g>
    <g v-else-if="name === 'circle'">
      <circle cx="12" cy="12" r="7.2" />
    </g>
    <g v-else-if="name === 'chevron-down'">
      <path d="m6.5 9.2 5.5 5.6 5.5-5.6" />
    </g>
    <g v-else-if="name === 'chevron-right'">
      <path d="m9.2 6.5 5.6 5.5-5.6 5.5" />
    </g>
    <g v-else-if="name === 'arrow-right'">
      <path d="M5 12h13.5" />
      <path d="m13 6 6 6-6 6" />
    </g>
    <g v-else-if="name === 'play'">
      <path d="M9 7.2v9.6L17 12 9 7.2Z" />
    </g>
    <g v-else-if="name === 'arrow-left'">
      <path d="M19 12H5.5" />
      <path d="m11 5.8-6 6.2 6 6.2" />
    </g>
    <g v-else-if="name === 'lightbulb'">
      <path d="M9.2 16.2h5.6" />
      <path d="M10 19.3h4" />
      <path d="M12 4.8a5.2 5.2 0 0 0-3.2 9.3c.6.5 1 1.2 1.2 2h4a4.7 4.7 0 0 1 1.2-2A5.2 5.2 0 0 0 12 4.8Z" />
      <path d="M12 3.2v1.4" />
      <path d="M18.2 6.2l-1 1" />
      <path d="M5.8 6.2l1 1" />
    </g>
    <g v-else-if="name === 'cooking-pot'">
      <path d="M7 10.8h10" />
      <path d="M8.8 10.8c0-2.4 1.4-4 3.2-4s3.2 1.6 3.2 4" />
      <path d="M5.8 12.5h12.4l-1 7.1H6.8l-1-7.1Z" />
      <path d="M9 19.6h6" />
      <path d="M7.2 8.8c0-1.5 1-2.7 2.4-3.2" />
    </g>
    <g v-else-if="name === 'close'">
      <path d="M6.5 6.5 17.5 17.5" />
      <path d="M17.5 6.5 6.5 17.5" />
    </g>
    <g v-else-if="name === 'calendar'">
      <rect x="4.5" y="5.8" width="15" height="14" rx="2.2" />
      <path d="M8.2 4v4" />
      <path d="M15.8 4v4" />
      <path d="M4.5 10h15" />
    </g>
    <g v-else-if="name === 'share'">
      <circle cx="18" cy="5.8" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="18.2" r="2.2" />
      <path d="m7.9 10.9 8.2-4" />
      <path d="m7.9 13.1 8.2 4" />
    </g>
    <g v-else-if="name === 'edit'">
      <path d="M6.8 16.8 17.6 6a1.7 1.7 0 0 1 2.4 0L9.2 16.8l-3.2.8.8-3.2Z" />
      <path d="M14.8 5.2 18.8 9.2" />
    </g>
    <g v-else-if="name === 'trash'">
      <path d="M5.5 7.5h13" />
      <path d="M9.2 7.5V5.8h5.6v1.7" />
      <path d="M7.3 7.5l.6 11h8.2l.6-11" />
      <path d="M10 11v4.2" />
      <path d="M14 11v4.2" />
    </g>
    <g v-else-if="name === 'filter'">
      <path d="M4.8 6.3h14.4l-5.4 5.6v5.7l-3.6 1.8v-7.5L4.8 6.3Z" />
    </g>
    <g v-else-if="name === 'logout'">
      <path d="M10.4 5.4H6.8a1.6 1.6 0 0 0-1.6 1.6v10a1.6 1.6 0 0 0 1.6 1.6h3.6" />
      <path d="M13.8 8.2 17.2 12l-3.4 3.8" />
      <path d="M17 12H9.8" />
    </g>
    <g v-else-if="name === 'qr-code'">
      <rect x="4.8" y="4.8" width="4.8" height="4.8" rx="1.2" />
      <rect x="14.4" y="4.8" width="4.8" height="4.8" rx="1.2" />
      <rect x="4.8" y="14.4" width="4.8" height="4.8" rx="1.2" />
      <path d="M14.6 14.6h1.8v1.8" />
      <path d="M16.4 16.4h2.4" />
      <path d="M14.6 16.4v2.4" />
      <path d="M12 12h2.4" />
    </g>
    <g v-else>
      <circle cx="12" cy="12" r="8" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number | string;
    filled?: boolean;
  }>(),
  {
    size: '24rpx',
    filled: false
  }
);

const normalizeSizeValue = (value: number | string) => {
  if (typeof value === 'number') {
    return `${value}rpx`;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '24rpx';
  }

  if (trimmed.endsWith('rpx')) {
    const numeric = Number.parseFloat(trimmed);
    if (Number.isFinite(numeric) && typeof uni !== 'undefined' && typeof uni.upx2px === 'function') {
      return `${uni.upx2px(numeric)}px`;
    }
    if (Number.isFinite(numeric)) {
      return `${(numeric / 2)}px`;
    }
  }

  return trimmed;
};

const normalizedSize = computed(() => normalizeSizeValue(props.size));
</script>

<style scoped lang="scss">
.app-icon {
  display: block;
  flex: 0 0 auto;
  color: currentColor;
}

.app-icon--filled {
  fill: currentColor;
}
</style>
