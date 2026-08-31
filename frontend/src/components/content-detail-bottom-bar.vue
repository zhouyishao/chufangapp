<template>
  <view :class="['content-detail-bottom-bar', { 'is-dual': Boolean(secondaryLabel) }]">
    <view class="content-detail-bottom-bar__inner">
      <button
        v-if="secondaryLabel"
        class="content-detail-bottom-bar__button is-secondary"
        :disabled="secondaryDisabled"
        :aria-pressed="secondaryPressed"
        @tap="$emit('secondary')"
      >
        <app-icon v-if="secondaryIcon" :name="secondaryIcon" size="27rpx" />
        <text>{{ secondaryLabel }}</text>
      </button>
      <button
        class="content-detail-bottom-bar__button is-primary"
        :disabled="primaryDisabled"
        :aria-pressed="primaryPressed"
        @tap="$emit('primary')"
      >
        <app-icon v-if="primaryIcon" :name="primaryIcon" size="27rpx" />
        <text>{{ primaryLabel }}</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppIcon from './app/app-icon.vue';

withDefaults(defineProps<{
  primaryLabel: string;
  primaryIcon?: string;
  primaryDisabled?: boolean;
  primaryPressed?: boolean;
  secondaryLabel?: string;
  secondaryIcon?: string;
  secondaryDisabled?: boolean;
  secondaryPressed?: boolean;
}>(), {
  primaryIcon: '',
  primaryDisabled: false,
  primaryPressed: false,
  secondaryLabel: '',
  secondaryIcon: '',
  secondaryDisabled: false,
  secondaryPressed: false
});

defineEmits<{
  primary: [];
  secondary: [];
}>();
</script>

<style scoped lang="scss">
.content-detail-bottom-bar {
  position: fixed;
  z-index: var(--z-tabbar);
  right: 50%;
  bottom: 0;
  left: auto;
  width: 100%;
  max-width: var(--app-canvas-width);
  padding: var(--space-3) var(--app-page-padding)
    calc(var(--space-3) + var(--app-safe-area-bottom));
  background: linear-gradient(to bottom, transparent, color-mix(in srgb, var(--app-bg) 94%, transparent) 28%);
  transform: translateX(50%);
}

.content-detail-bottom-bar__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-3);
}

.content-detail-bottom-bar.is-dual .content-detail-bottom-bar__inner {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.content-detail-bottom-bar__button {
  display: flex;
  width: 100%;
  min-height: 104rpx;
  margin: 0;
  padding: 0 var(--space-4);
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1rpx solid color-mix(in srgb, var(--app-primary) 22%, var(--app-border));
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.content-detail-bottom-bar__button::after {
  border: 0;
}

.content-detail-bottom-bar__button.is-secondary {
  color: var(--app-primary);
  background: color-mix(in srgb, var(--app-primary) 7%, var(--app-surface-strong));
}

.content-detail-bottom-bar__button.is-primary {
  color: var(--text-white);
  background: var(--app-primary);
}

.content-detail-bottom-bar__button[disabled] {
  opacity: 0.48;
}

</style>
