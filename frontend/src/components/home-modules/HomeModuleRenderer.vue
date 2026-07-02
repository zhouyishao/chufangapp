<template>
  <view v-if="modules.length">
    <component
      v-for="mod in enabledModules"
      :key="mod.id"
      :is="resolveComponent(mod.displayStyle)"
      :module="mod"
    />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HomeModule } from '../../services/public-api';
import HorizontalRecipeCardModule from './HorizontalRecipeCardModule.vue';
import SeasonalIngredientCardModule from './SeasonalIngredientCardModule.vue';
import ImageTextListModule from './ImageTextListModule.vue';
import TwoColumnRecipeGridModule from './TwoColumnRecipeGridModule.vue';
import LargeImageCarouselModule from './LargeImageCarouselModule.vue';
import FourCardGridContentModule from './FourCardGridContentModule.vue';

const props = defineProps<{
  modules: HomeModule[];
}>();

const componentMap: Record<string, unknown> = {
  HORIZONTAL_RECIPE_CARD: HorizontalRecipeCardModule,
  SEASONAL_INGREDIENT_CARD: SeasonalIngredientCardModule,
  IMAGE_TEXT_LIST: ImageTextListModule,
  TWO_COLUMN_RECIPE_GRID: TwoColumnRecipeGridModule,
  LARGE_IMAGE_CAROUSEL: LargeImageCarouselModule,
  FOUR_CARD_GRID: FourCardGridContentModule
};

const enabledModules = computed(() =>
  props.modules.filter(m => m.status === 'ENABLED').sort((a, b) => a.sortOrder - b.sortOrder)
);

const resolveComponent = (displayStyle: string) => {
  return componentMap[displayStyle] ?? null;
};
</script>
