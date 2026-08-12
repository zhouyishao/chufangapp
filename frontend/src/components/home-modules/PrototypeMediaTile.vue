<template>
  <view :class="className">
    <image
      v-if="item?.cover && !failed"
      class="prototype-media-image"
      :src="item.cover"
      mode="aspectFill"
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

watch(
  () => props.item?.cover,
  () => {
    failed.value = false;
  }
);

const handleError = () => {
  failed.value = true;
  emit('failed', props.item);
};
</script>
