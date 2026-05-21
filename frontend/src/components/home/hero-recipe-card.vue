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
  min-height: 740rpx;
  background: #111111;
  border-radius: 0 0 26rpx 26rpx;
  box-shadow: 0 28rpx 80rpx rgba(15, 23, 42, 0.12);
}

.hero-card__swiper,
.hero-card__item {
  width: 100%;
  height: 740rpx;
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
    linear-gradient(180deg, rgba(7, 12, 18, 0.18) 0%, rgba(7, 12, 18, 0.06) 36%, rgba(7, 12, 18, 0.2) 100%),
    linear-gradient(90deg, rgba(7, 12, 18, 0.12), transparent 54%);
}

.hero-card__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 740rpx;
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
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.38);
}

.hero-card__progress-dot.is-active {
  width: 78rpx;
  background: #ffffff;
}

.hero-card__glass {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
  min-height: 142rpx;
  padding: 24rpx 34rpx 28rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.14);
  background: rgba(20, 22, 28, 0.48);
  backdrop-filter: blur(28rpx);
  -webkit-backdrop-filter: blur(28rpx);
}

.hero-card__title {
  display: block;
  color: #ffffff;
  font-size: 35rpx;
  font-weight: 600;
  line-height: 1.12;
  text-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.28);
}

.hero-card__summary {
  display: block;
  overflow: hidden;
  max-width: 500rpx;
  margin-top: 10rpx;
  color: rgba(255, 255, 255, 0.82);
  font-size: 23rpx;
  font-weight: 400;
  line-height: 1.45;
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
  background: rgba(255, 255, 255, 0.12);
  color: #b8e24b;
  font-size: 23rpx;
  font-weight: 850;
}

.hero-card__arrow {
  width: 24rpx;
  height: 24rpx;
}
</style>
