<template>
  <view class="app-page list-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">←</button>
      <view>
        <text class="eyebrow">个人菜谱库</text>
        <text class="page-title">我的收藏</text>
      </view>
    </view>

    <view class="summary-card glass-card">
      <text class="summary-title">收藏列表</text>
      <text class="summary-desc">把常做、想试、家人喜欢的菜谱和食材放在这里。</text>
      <text class="summary-count">{{ totalCount }} 项</text>
    </view>

    <view v-if="favoriteIngredients.length" class="section-block">
      <text class="section-title">收藏的食材</text>
      <view class="recipe-list">
        <view
          v-for="ingredient in favoriteIngredients"
          :key="ingredient.id"
          class="recipe-card glass-card"
          @tap="goToIngredient(ingredient.id)"
        >
          <image class="recipe-image" :src="ingredient.image" mode="aspectFill" />
          <view class="recipe-body">
            <text class="recipe-name">{{ ingredient.name }}</text>
            <text class="recipe-desc">{{ ingredient.description }}</text>
            <view class="recipe-meta">
              <text>{{ ingredient.tag }}</text>
              <text>食材</text>
            </view>
          </view>
          <text class="heart">★</text>
        </view>
      </view>
    </view>

    <view class="section-block">
      <text class="section-title">收藏的菜谱</text>
      <view class="recipe-list">
        <view
          v-for="recipe in recipes"
          :key="recipe.id"
          class="recipe-card glass-card"
          @tap="goToRecipe(recipe.id)"
        >
          <image class="recipe-image" :src="recipe.image" mode="aspectFill" />
          <view class="recipe-body">
            <text class="recipe-name">{{ recipe.name }}</text>
            <text class="recipe-desc">{{ recipe.description }}</text>
            <view class="recipe-meta">
              <text>{{ recipe.duration }}</text>
              <text>{{ recipe.difficulty }}</text>
              <text>{{ recipe.tag }}</text>
            </view>
          </view>
          <text class="heart">♥</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { loadFavoriteIngredients } from '../../services/favorites';
import type { FavoriteIngredient } from '../../services/favorites';

interface FavoriteRecipe {
  id: string;
  name: string;
  description: string;
  image: string;
  duration: string;
  difficulty: string;
  tag: string;
}

const recipes: FavoriteRecipe[] = [
  {
    id: 'recipe-1',
    name: '芦笋虾仁',
    description: '清爽快手，适合工作日晚餐',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
    duration: '15 分钟',
    difficulty: '简单',
    tag: '清淡'
  },
  {
    id: 'recipe-2',
    name: '番茄牛腩',
    description: '番茄酸香，适合全家分食',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    duration: '60 分钟',
    difficulty: '中等',
    tag: '家常'
  }
];

const favoriteIngredients = ref<FavoriteIngredient[]>([]);
const totalCount = computed(() => recipes.length + favoriteIngredients.value.length);

const goBack = () => {
  uni.navigateBack();
};

const goToRecipe = (recipeId: string) => {
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${recipeId}` });
};

const goToIngredient = (ingredientId: string) => {
  uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${ingredientId}` });
};

onShow(() => {
  favoriteIngredients.value = loadFavoriteIngredients();
});
</script>

<style scoped lang="scss">
.list-page {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border: 0;
  border-radius: 50%;
  background: #fffdfc;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
}

.back-button::after {
  border: 0;
}

.eyebrow,
.page-title,
.summary-title,
.summary-desc,
.summary-count,
.recipe-name,
.recipe-desc {
  display: block;
}

.eyebrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.page-title {
  margin-top: 4rpx;
  color: var(--app-text);
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
}

.summary-card {
  position: relative;
  padding: 28rpx;
  overflow: hidden;
}

.summary-title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.summary-desc {
  margin-top: 10rpx;
  padding-right: 140rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-body-sm);
}

.summary-count {
  position: absolute;
  right: 28rpx;
  bottom: 28rpx;
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.section-block {
  margin-top: 28rpx;
}

.section-title {
  display: block;
  margin-bottom: 18rpx;
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.recipe-card {
  position: relative;
  display: flex;
  gap: 18rpx;
  padding: 18rpx 76rpx 18rpx 18rpx;
}

.recipe-image {
  width: 160rpx;
  height: 160rpx;
  flex: 0 0 auto;
  border-radius: 28rpx;
}

.recipe-body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
}

.recipe-name {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.recipe-desc {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-body-sm);
}

.recipe-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 14rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
}

.heart {
  position: absolute;
  top: 24rpx;
  right: 28rpx;
  color: var(--app-danger);
  font-size: var(--font-size-card-title);
}
</style>
