<template>
  <view class="hero-card glass-card">
    <swiper
      class="hero-card__swiper"
      :current="activeIndex"
      :circular="heroRecipes.length > 1"
      :indicator-dots="false"
      :autoplay="false"
      @change="handleSwiperChange"
    >
      <swiper-item
        v-for="recipe in heroRecipes"
        :key="recipe.id"
        class="hero-card__item"
      >
        <image class="hero-card__image" :src="recipe.image" mode="aspectFill" />
      </swiper-item>
    </swiper>
    <view class="hero-card__shade" />
    <view class="hero-card__content" @tap="handleClick">
      <view />
      <view class="hero-card__body">
        <view v-if="heroRecipes.length > 1" class="hero-card__progress">
          <text
            v-for="(recipe, index) in heroRecipes"
            :key="recipe.id"
            :class="['hero-card__progress-dot', { 'is-active': index === activeIndex }]"
          />
        </view>
        <view class="hero-card__glass">
          <view>
            <text class="hero-card__title">{{ currentRecipe?.name }}</text>
            <text class="hero-card__summary">{{ currentRecipe?.summary }}</text>
          </view>
          <view class="hero-card__footer" @tap.stop="handleMoreClick">
            <svg class="hero-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { RecipeCard } from '../../types/home';

const props = defineProps<{
  recipes: RecipeCard[];
}>();

const emit = defineEmits<{
  click: [recipeId: string];
  'more-click': [];
}>();

interface SwiperChangeEvent {
  detail?: {
    current?: number;
  };
}

const activeIndex = ref(0);
const heroRecipes = computed(() => props.recipes.slice(0, 6));
const currentRecipe = computed(() => heroRecipes.value[activeIndex.value] ?? heroRecipes.value[0]);

watch(
  () => props.recipes,
  () => {
    activeIndex.value = 0;
  }
);

const handleClick = () => {
  if (!currentRecipe.value) {
    return;
  }
  emit('click', currentRecipe.value.id);
};

const handleMoreClick = () => {
  emit('more-click');
};

const handleSwiperChange = (event: SwiperChangeEvent) => {
  const nextIndex = event.detail?.current ?? 0;
  activeIndex.value = Math.min(nextIndex, Math.max(heroRecipes.value.length - 1, 0));
};
</script>

<style scoped lang="scss">
.hero-card {
  position: relative;
  overflow: hidden;
  min-height: 704rpx;
  border: 0;
  border-radius: 0 0 48rpx 48rpx;
  background: var(--app-muted);
  box-shadow: var(--app-shadow);
}

.hero-card__swiper,
.hero-card__item {
  width: 100%;
  height: 704rpx;
}

.hero-card__swiper {
  position: absolute;
  inset: 0;
}

.hero-card__image {
  width: 100%;
  height: 100%;
}

.hero-card__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(47, 47, 47, 0.08) 0%, rgba(47, 47, 47, 0.02) 42%, rgba(47, 47, 47, 0.16) 100%),
    linear-gradient(90deg, rgba(194, 123, 72, 0.08), transparent 58%);
}

.hero-card__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 704rpx;
  padding: 0;
}

.hero-card__body {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-top: 24rpx;
}

.hero-card__progress {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 0 34rpx;
}

.hero-card__progress-dot {
  width: 44rpx;
  height: 5rpx;
  border-radius: var(--app-radius-button);
  background: rgba(255, 253, 252, 0.52);
}

.hero-card__progress-dot.is-active {
  width: 78rpx;
  background: var(--app-surface-strong);
}

.hero-card__glass {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
  min-height: 142rpx;
  padding: 24rpx 34rpx 28rpx;
  border-top: 1rpx solid rgba(255, 253, 252, 0.64);
  background: rgba(255, 253, 252, 0.88);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.hero-card__title {
  display: block;
  color: var(--app-text);
  font-family: var(--app-font-serif);
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.25;
  text-shadow: none;
}

.hero-card__summary {
  display: block;
  overflow: hidden;
  max-width: 500rpx;
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: 24rpx;
  font-weight: 400;
  line-height: 1.55;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-card__footer {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  justify-content: center;
  width: 58rpx;
  height: 58rpx;
  gap: 6rpx;
  border-radius: 50%;
  background: var(--app-accent-soft);
  color: var(--app-accent-warm);
  font-size: 23rpx;
  font-weight: 500;
}

.hero-card__arrow {
  width: 24rpx;
  height: 24rpx;
}
</style>
