<template>
  <view :class="[className, { 'is-media-fallback': !mediaSource || failed }]">
    <image
      v-if="mediaSource && !failed"
      class="prototype-media-image"
      :src="mediaSource"
      :mode="usesCompactImage ? 'aspectFit' : 'aspectFill'"
      lazy-load
      @error="handleError"
    />
    <text v-else class="prototype-media-fallback">{{ itemInitial }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { HomeModuleItem } from '../../services/public-api';

const props = defineProps<{
  item?: HomeModuleItem;
  className: string;
}>();

const emit = defineEmits<{
  failed: [item?: HomeModuleItem];
}>();

const failed = ref(false);
const itemInitial = computed(() => (props.item?.name || props.item?.title || '').trim().slice(0, 1));
const mediaSource = computed(() =>
  props.item?.transparentImage || props.item?.displayImage || props.item?.cover || ''
);
const usesCompactImage = computed(() => Boolean(props.item?.transparentImage));

watch(
  mediaSource,
  () => {
    failed.value = false;
  }
);

const handleError = () => {
  failed.value = true;
  emit('failed', props.item);
};
</script>
