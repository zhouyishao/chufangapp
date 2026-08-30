<template>
  <view class="app-page my-recipes-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view>
        <text class="eyebrow">美食研究家</text>
        <text class="page-title">我的食谱</text>
      </view>
      <button class="create-button" @tap="createRecipe">
        <app-icon name="plus" size="26rpx" />
      </button>
    </view>

    <view class="recipe-toolbar">
      <view>
        <text class="recipe-toolbar__title">全部菜谱</text>
        <text class="recipe-toolbar__count">{{ recipes.length }} 道</text>
      </view>
      <button class="recipe-toolbar__add" @tap="createRecipe">
        <app-icon name="plus" size="22rpx" />
        <text>添加菜谱</text>
      </button>
    </view>

    <view v-if="loading" class="empty-tip glass-card">
      <text class="empty-tip__title">正在加载菜谱</text>
      <text class="empty-tip__desc">正在从后端读取你的原创菜谱。</text>
    </view>

    <view v-else-if="error" class="empty-tip glass-card">
      <text class="empty-tip__title">加载失败</text>
      <text class="empty-tip__desc">{{ error }}</text>
      <button class="retry-button" @tap="loadRecipes">重试</button>
    </view>

    <view v-else class="recipe-list">
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
            <text class="status-pill">{{ recipe.visibility }}</text>
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

    <view v-if="!loading && !error" class="empty-tip glass-card">
      <text class="empty-tip__title">下一步可以做什么？</text>
      <text class="empty-tip__desc">点击右上角加号，记录食材、步骤、图片和试菜笔记。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadMyRecipes } from '../../services/my-recipes';

const recipes = ref<Awaited<ReturnType<typeof loadMyRecipes>>>([]);
const loading = ref(true);
const error = ref('');

const goBack = () => {
  uni.navigateBack();
};

const createRecipe = () => {
  uni.navigateTo({ url: '/pages/recipe-create/index' });
};

const openRecipe = (recipeId: string) => {
  uni.navigateTo({ url: `/pages/my-recipe-detail/index?id=${recipeId}` });
};

const loadRecipes = async () => {
  loading.value = true;
  error.value = '';
  try {
    recipes.value = (await loadMyRecipes()).filter((recipe) => recipe.status === 'published');
  } catch (err) {
    recipes.value = [];
    error.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void loadRecipes();
});

onShow(() => {
  void loadRecipes();
});
</script>

<style scoped lang="scss">
.my-recipes-page {
  min-height: 100vh;
  padding-bottom: calc(80rpx + var(--app-safe-area-bottom));
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
.recipe-toolbar__title,
.recipe-toolbar__count,
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

.recipe-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 8rpx;
}

.recipe-toolbar__title {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.recipe-toolbar__count {
  margin-top: 2rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-tabbar);
}

.recipe-toolbar__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  min-height: 88rpx;
  margin: 0;
  padding: 0 18rpx;
  border: 0;
  background: transparent;
  color: var(--text-brand);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
}

.recipe-toolbar__add::after {
  border: 0;
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

.retry-button {
  width: 100%;
  height: 76rpx;
  margin-top: 16rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.retry-button::after {
  border: 0;
}
</style>
