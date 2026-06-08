<template>
  <view class="app-page my-recipes-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">←</button>
      <view>
        <text class="eyebrow">美食研究家</text>
        <text class="page-title">我的食谱</text>
      </view>
      <button class="create-button" @tap="createRecipe">＋</button>
    </view>

    <view class="studio-card glass-card">
      <view>
        <text class="studio-card__label">原创菜谱库</text>
        <text class="studio-card__title">记录你的创新味道</text>
        <text class="studio-card__desc">把每次试菜、调味和灵感沉淀成自己的家庭菜谱。</text>
      </view>
      <view class="studio-mark">私房</view>
    </view>

    <view class="stats-card glass-card">
      <view class="stat-item">
        <text class="stat-value">{{ recipes.length }}</text>
        <text class="stat-label">原创</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value">{{ draftCount }}</text>
        <text class="stat-label">草稿</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-value">{{ publishedCount }}</text>
        <text class="stat-label">已整理</text>
      </view>
    </view>

    <view class="recipe-list">
      <view
        v-for="recipe in recipes"
        :key="recipe.id"
        class="recipe-card glass-card"
        @tap="openRecipe(recipe.id)"
      >
        <image class="recipe-image" :src="recipe.image" mode="aspectFill" />
        <view class="recipe-body">
          <view class="recipe-head">
            <text class="recipe-name">{{ recipe.name }}</text>
            <text :class="['status-pill', { 'is-draft': recipe.status === 'draft' }]">
              {{ recipe.status === 'draft' ? '草稿' : '已整理' }}
            </text>
          </view>
          <text class="recipe-desc">{{ recipe.description }}</text>
          <view class="recipe-meta">
            <text>{{ recipe.duration }}</text>
            <text>{{ recipe.flavor }}</text>
            <text>{{ recipe.updatedAt }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty-tip glass-card">
      <text class="empty-tip__title">下一步可以做什么？</text>
      <text class="empty-tip__desc">点击右上角加号，记录食材、步骤、图片和试菜笔记。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { loadMyRecipes } from '../../services/my-recipes';

const recipes = ref(loadMyRecipes());

const draftCount = computed(() => recipes.value.filter((recipe) => recipe.status === 'draft').length);
const publishedCount = computed(() => recipes.value.filter((recipe) => recipe.status === 'published').length);

const goBack = () => {
  uni.navigateBack();
};

const createRecipe = () => {
  uni.navigateTo({ url: '/pages/recipe-create/index' });
};

const openRecipe = (recipeId: string) => {
  uni.navigateTo({ url: `/pages/my-recipe-detail/index?id=${recipeId}` });
};
</script>

<style scoped lang="scss">
.my-recipes-page {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.back-button,
.create-button {
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

.back-button::after,
.create-button::after {
  border: 0;
}

.create-button {
  margin-left: auto;
}

.eyebrow,
.page-title,
.studio-card__label,
.studio-card__title,
.studio-card__desc,
.stat-value,
.stat-label,
.recipe-name,
.recipe-desc,
.empty-tip__title,
.empty-tip__desc {
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

.studio-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  padding: 30rpx;
  background:
    radial-gradient(circle at 88% 18%, rgba(0, 0, 0, 0.06), transparent 30%),
    linear-gradient(135deg, #fffdfc, #e9e2d6);
}

.studio-card__label {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.studio-card__title {
  margin-top: 10rpx;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.studio-card__desc {
  margin-top: 12rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-body-sm);
}

.studio-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 92rpx;
  height: 92rpx;
  flex: 0 0 auto;
  border-radius: 28rpx;
  background: #7a8b6f;
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.stats-card {
  display: grid;
  grid-template-columns: 1fr 1rpx 1fr 1rpx 1fr;
  align-items: center;
  margin-top: 18rpx;
  padding: 24rpx;
}

.stat-item {
  text-align: center;
}

.stat-value {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.stat-label {
  margin-top: 6rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.stat-divider {
  width: 1rpx;
  height: 54rpx;
  background: var(--app-border);
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 22rpx;
}

.recipe-card {
  display: flex;
  gap: 18rpx;
  padding: 18rpx;
}

.recipe-image {
  width: 168rpx;
  height: 168rpx;
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

.recipe-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.recipe-name {
  min-width: 0;
  flex: 1;
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.status-pill {
  padding: 7rpx 12rpx;
  border-radius: var(--app-radius-button);
  background: #7a8b6f;
  color: var(--text-white);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.status-pill.is-draft {
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
}

.recipe-desc {
  margin-top: 12rpx;
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

.empty-tip {
  margin-top: 20rpx;
  padding: 24rpx;
}

.empty-tip__title {
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
}

.empty-tip__desc {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-body-sm);
}
</style>
