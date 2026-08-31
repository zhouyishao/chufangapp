<template>
  <svg
    class="app-icon"
    :class="{ 'app-icon--filled': filled }"
    :style="{ width: normalizedSize, height: normalizedSize }"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <g v-if="name === 'home'">
      <path class="fillable" d="M4 10.5 12 4l8 6.5v8.25A1.25 1.25 0 0 1 18.75 20H5.25A1.25 1.25 0 0 1 4 18.75Z" />
      <path d="M9 20v-6h6v6" />
    </g>
    <g v-else-if="name === 'category'">
      <rect class="fillable" x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2" />
      <rect class="fillable" x="14" y="3.5" width="6.5" height="6.5" rx="1.2" />
      <rect class="fillable" x="3.5" y="14" width="6.5" height="6.5" rx="1.2" />
      <rect class="fillable" x="14" y="14" width="6.5" height="6.5" rx="1.2" />
    </g>
    <g v-else-if="name === 'basket'">
      <path class="fillable" d="M4 9h16l-1.3 10H5.3Z" />
      <path d="m8.2 9 2.1-5m5.5 5-2.1-5" />
    </g>
    <g v-else-if="name === 'basket-action'">
      <path class="fillable" d="M4.5 9.75h15l-1.1 7.85a2 2 0 0 1-2 1.7H7.6a2 2 0 0 1-2-1.7L4.5 9.75Z" />
      <path d="M7.8 10 9.95 5.8a2.25 2.25 0 0 1 4.1 0L16.2 10" />
    </g>
    <g v-else-if="name === 'user'">
      <circle class="fillable" cx="12" cy="7.5" r="3.5" />
      <path class="fillable" d="M5 20c.35-4 2.7-6 7-6s6.65 2 7 6Z" />
    </g>
    <g v-else-if="name === 'search'">
      <circle cx="10.8" cy="10.8" r="5.8" />
      <path d="m15.2 15.2 4.4 4.4" />
    </g>
    <g v-else-if="name === 'bell'">
      <path class="iconify-fill" transform="scale(.09375)" d="M221.8 175.94c-5.55-9.56-13.8-36.61-13.8-71.94a80 80 0 1 0-160 0c0 35.34-8.26 62.38-13.81 71.94A16 16 0 0 0 48 200h40.81a40 40 0 0 0 78.38 0H208a16 16 0 0 0 13.8-24.06M128 216a24 24 0 0 1-22.62-16h45.24A24 24 0 0 1 128 216m-80-32c7.7-13.24 16-43.92 16-80a64 64 0 1 1 128 0c0 36.05 8.28 66.73 16 80Z" />
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
    <g v-else-if="name === 'bookmark'">
      <path d="M7 4.5h10a1 1 0 0 1 1 1v14l-6-3.8-6 3.8v-14a1 1 0 0 1 1-1Z" />
    </g>
    <g v-else-if="name === 'lock-simple'">
      <path class="iconify-fill" transform="scale(.09375)" d="M208 80h-32V56a48 48 0 0 0-96 0v24H48a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16M96 56a32 32 0 0 1 64 0v24H96Zm112 152H48V96h160z" />
    </g>
    <g v-else-if="name === 'clock'">
      <path class="iconify-fill" transform="scale(.09375)" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m64-88a8 8 0 0 1-8 8h-56a8 8 0 0 1-8-8V72a8 8 0 0 1 16 0v48h48a8 8 0 0 1 8 8" />
    </g>
    <g v-else-if="name === 'difficulty'">
      <path d="M5 19V9.8" />
      <path d="M12 19V5" />
      <path d="M19 19v-7.2" />
    </g>
    <g v-else-if="name === 'users'">
      <path class="iconify-fill" transform="scale(.09375)" d="M244.8 150.4a8 8 0 0 1-11.2-1.6A51.6 51.6 0 0 0 192 128a8 8 0 0 1-7.37-4.89a8 8 0 0 1 0-6.22A8 8 0 0 1 192 112a24 24 0 1 0-23.24-30a8 8 0 1 1-15.5-4A40 40 0 1 1 219 117.51a67.94 67.94 0 0 1 27.43 21.68a8 8 0 0 1-1.63 11.21M190.92 212a8 8 0 1 1-13.84 8a57 57 0 0 0-98.16 0a8 8 0 1 1-13.84-8a72.06 72.06 0 0 1 33.74-29.92a48 48 0 1 1 58.36 0A72.06 72.06 0 0 1 190.92 212M128 176a32 32 0 1 0-32-32a32 32 0 0 0 32 32m-56-56a8 8 0 0 0-8-8a24 24 0 1 1 23.24-30a8 8 0 1 0 15.5-4A40 40 0 1 0 37 117.51a67.94 67.94 0 0 0-27.4 21.68a8 8 0 1 0 12.8 9.61A51.6 51.6 0 0 1 64 128a8 8 0 0 0 8-8" />
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
    <g v-else-if="name === 'sliders-horizontal'">
      <path class="iconify-fill" transform="scale(.09375)" d="M40 88h33a32 32 0 0 0 62 0h81a8 8 0 0 0 0-16h-81a32 32 0 0 0-62 0H40a8 8 0 0 0 0 16m64-24a16 16 0 1 1-16 16a16 16 0 0 1 16-16m112 104h-17a32 32 0 0 0-62 0H40a8 8 0 0 0 0 16h97a32 32 0 0 0 62 0h17a8 8 0 0 0 0-16m-48 24a16 16 0 1 1 16-16a16 16 0 0 1-16 16" />
    </g>
    <g v-else-if="name === 'user-focus'">
      <path class="iconify-fill" transform="scale(.09375)" d="M224 40v36a8 8 0 0 1-16 0V48h-28a8 8 0 0 1 0-16h36a8 8 0 0 1 8 8m-8 132a8 8 0 0 0-8 8v28h-28a8 8 0 0 0 0 16h36a8 8 0 0 0 8-8v-36a8 8 0 0 0-8-8M76 208H48v-28a8 8 0 0 0-16 0v36a8 8 0 0 0 8 8h36a8 8 0 0 0 0-16M40 84a8 8 0 0 0 8-8V48h28a8 8 0 0 0 0-16H40a8 8 0 0 0-8 8v36a8 8 0 0 0 8 8m136 92a8 8 0 0 1-6.41-3.19a52 52 0 0 0-83.2 0a8 8 0 1 1-12.8-9.62A67.94 67.94 0 0 1 101 141.51a40 40 0 1 1 53.94 0a67.94 67.94 0 0 1 27.43 21.68A8 8 0 0 1 176 176m-48-40a24 24 0 1 0-24-24a24 24 0 0 0 24 24" />
    </g>
    <g v-else-if="name === 'scan'">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3M6 12h12" />
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
    <g v-else-if="name === 'bowl-food'">
      <path class="iconify-fill" transform="scale(.09375)" d="M224 104h-8.37a88 88 0 0 0-175.26 0H32a8 8 0 0 0-8 8a104.35 104.35 0 0 0 56 92.28V208a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16v-3.72A104.35 104.35 0 0 0 232 112a8 8 0 0 0-8-8m-24.46 0h-51.42a71.84 71.84 0 0 1 41.27-29.57A71.45 71.45 0 0 1 199.54 104m-26.06-47.77q2.75 2.25 5.27 4.75a87.92 87.92 0 0 0-49.15 43h-29.5A72.26 72.26 0 0 1 168 56c1.83 0 3.66.09 5.48.23M128 40a72 72 0 0 1 19 2.57A88.36 88.36 0 0 0 83.33 104H56.46A72.08 72.08 0 0 1 128 40m36.66 152a8 8 0 0 0-4.66 7.3v8.7H96v-8.7a8 8 0 0 0-4.66-7.3a88.29 88.29 0 0 1-51-72h175.29a88.29 88.29 0 0 1-50.97 72" />
    </g>
    <g v-else-if="name === 'star'">
      <path class="iconify-fill" transform="scale(.09375)" d="M239.18 97.26A16.38 16.38 0 0 0 224.92 86l-59-4.76l-22.78-55.09a16.36 16.36 0 0 0-30.27 0L90.11 81.23L31.08 86a16.46 16.46 0 0 0-9.37 28.86l45 38.83L53 211.75a16.38 16.38 0 0 0 24.5 17.82l50.5-31.08l50.53 31.08A16.4 16.4 0 0 0 203 211.75l-13.76-58.07l45-38.83a16.43 16.43 0 0 0 4.94-17.59m-15.34 5.47l-48.7 42a8 8 0 0 0-2.56 7.91l14.88 62.8a.37.37 0 0 1-.17.48c-.18.14-.23.11-.38 0l-54.72-33.65a8 8 0 0 0-8.38 0l-54.72 33.67c-.15.09-.19.12-.38 0a.37.37 0 0 1-.17-.48l14.88-62.8a8 8 0 0 0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16a8 8 0 0 0 6.72-4.94l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153 91.86a8 8 0 0 0 6.75 4.92l63.92 5.16c.15 0 .24 0 .33.29s0 .4-.16.5" />
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
    <g v-else-if="name === 'image'">
      <rect x="3.8" y="4.5" width="16.4" height="15" rx="2.2" />
      <circle cx="9" cy="9.5" r="1.5" />
      <path d="m5.5 17 4.2-4.3 2.8 2.7 2.2-2.1 3.8 3.7" />
    </g>
    <g v-else-if="name === 'share'">
      <circle cx="18" cy="5.8" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="18.2" r="2.2" />
      <path d="m7.9 10.9 8.2-4" />
      <path d="m7.9 13.1 8.2 4" />
    </g>
    <g v-else-if="name === 'edit'">
      <path class="iconify-fill" transform="scale(.09375)" d="m229.66 58.34l-32-32a8 8 0 0 0-11.32 0l-96 96A8 8 0 0 0 88 128v32a8 8 0 0 0 8 8h32a8 8 0 0 0 5.66-2.34l96-96a8 8 0 0 0 0-11.32M124.69 152H104v-20.69l64-64L188.69 88ZM200 76.69L179.31 56L192 43.31L212.69 64ZM224 128v80a16 16 0 0 1-16 16H48a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h80a8 8 0 0 1 0 16H48v160h160v-80a8 8 0 0 1 16 0" />
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
      <path class="iconify-fill" transform="scale(.09375)" d="M104 40H56a16 16 0 0 0-16 16v48a16 16 0 0 0 16 16h48a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16m0 64H56V56h48zm0 32H56a16 16 0 0 0-16 16v48a16 16 0 0 0 16 16h48a16 16 0 0 0 16-16v-48a16 16 0 0 0-16-16m0 64H56v-48h48zm96-160h-48a16 16 0 0 0-16 16v48a16 16 0 0 0 16 16h48a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16m0 64h-48V56h48zm-64 72v-32a8 8 0 0 1 16 0v32a8 8 0 0 1-16 0m80-16a8 8 0 0 1-8 8h-24v40a8 8 0 0 1-8 8h-32a8 8 0 0 1 0-16h24v-56a8 8 0 0 1 16 0v8h24a8 8 0 0 1 8 8m0 32v16a8 8 0 0 1-16 0v-16a8 8 0 0 1 16 0" />
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

.app-icon--filled .fillable {
  fill: currentColor;
}

.iconify-fill {
  fill: currentColor;
  stroke: none;
}
</style>
