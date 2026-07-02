<template>
  <view class="app-page my-recipe-detail-page">
    <view v-if="loading" class="empty-card glass-card">
      <text class="empty-card__title">正在加载食谱</text>
      <text class="empty-card__desc">正在从后端读取你的原创菜谱。</text>
    </view>

    <view v-else-if="error" class="empty-card glass-card">
      <text class="empty-card__title">加载失败</text>
      <text class="empty-card__desc">{{ error }}</text>
      <button class="empty-card__button" @tap="loadRecipe">重试</button>
    </view>

    <view v-else-if="recipe" class="header-image">
      <image class="header-image__bg" :src="recipe.image" mode="aspectFill" />
      <view class="header-overlay">
        <button class="round-button" @tap="goBack">
          <app-icon name="arrow-left" size="26rpx" />
        </button>
        <button class="round-button" @tap="editRecipe">编辑</button>
      </view>
    </view>

    <view v-if="recipe" class="content">
      <view class="recipe-title-card glass-card">
        <view>
          <view class="title-row">
            <text class="recipe-name">{{ recipe.name }}</text>
            <text :class="['status-pill', { 'is-draft': recipe.status === 'draft' }]">
              {{ recipe.status === 'draft' ? '草稿' : '已整理' }}
            </text>
          </view>
          <text class="recipe-desc">{{ recipe.description }}</text>
        </view>
        <view class="meta-grid">
          <view class="meta-item">
            <text class="meta-label">耗时</text>
            <text class="meta-value">{{ recipe.duration }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-label">难度</text>
            <text class="meta-value">{{ recipe.difficulty }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-label">口味</text>
            <text class="meta-value">{{ recipe.flavor }}</text>
          </view>
        </view>
      </view>

      <view class="detail-card glass-card">
        <view class="section-head">
          <text class="section-title">用料</text>
          <text class="section-note">{{ recipe.ingredients.length }} 项</text>
        </view>
        <view class="ingredient-list">
          <view v-for="ingredient in recipe.ingredients" :key="ingredient.name" class="ingredient-row">
            <text class="ingredient-name">{{ ingredient.name }}</text>
            <text class="ingredient-amount">{{ ingredient.amount }}</text>
          </view>
        </view>
      </view>

      <view class="detail-card glass-card">
        <view class="section-head">
          <text class="section-title">步骤</text>
          <text class="section-note">{{ recipe.steps.length }} 步</text>
        </view>
        <view class="step-list">
          <view v-for="(step, index) in recipe.steps" :key="step.title" class="step-item">
            <view class="step-index">{{ index + 1 }}</view>
            <view class="step-main">
              <text class="step-title">{{ step.title }}</text>
              <text class="step-desc">{{ step.description }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="detail-card glass-card">
        <view class="section-head">
          <text class="section-title">试菜笔记</text>
          <text class="section-note">{{ recipe.updatedAt }}</text>
        </view>
        <text class="note-text">{{ recipe.note }}</text>
        <view class="setting-tags">
          <text>{{ recipe.category }}</text>
          <text>{{ recipe.visibility }}</text>
        </view>
      </view>
    </view>
    <view v-else class="empty-card glass-card">
      <text class="empty-card__title">未找到食谱</text>
      <text class="empty-card__desc">当前没有可展示的原创食谱记录。</text>
      <button class="empty-card__button" @tap="goBack">返回</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { findMyRecipeById } from '../../services/my-recipes';
import type { MyRecipe } from '../../services/my-recipes';

const recipe = ref<MyRecipe | null>(null);
const loading = ref(true);
const error = ref('');

const readRecipeId = (query?: Record<string, string | undefined>) => {
  const fromQuery = query?.id?.trim();
  if (fromQuery) return fromQuery;
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash;
  const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  return new URLSearchParams(queryText).get('id')?.trim() ?? '';
};

const loadRecipe = async (query?: Record<string, string | undefined>) => {
  const nextRecipeId = readRecipeId(query);
  if (!nextRecipeId) {
    recipe.value = null;
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    recipe.value = await findMyRecipeById(nextRecipeId);
  } catch (err) {
    recipe.value = null;
    error.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  uni.navigateBack();
};

const editRecipe = () => {
  uni.navigateTo({ url: '/pages/recipe-create/index' });
};

onLoad((query?: Record<string, string | undefined>) => {
  void loadRecipe(query);
});

onShow(() => {
  void loadRecipe();
});

onMounted(() => {
  if (recipe.value) return;
  void loadRecipe();
});
</script>

<style scoped lang="scss">
.my-recipe-detail-page {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.empty-card {
  display: grid;
  gap: 16rpx;
  margin-top: calc(var(--status-bar-height) + 40rpx);
  padding: 34rpx;
}

.empty-card__title,
.empty-card__desc {
  display: block;
}

.empty-card__title {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.empty-card__desc {
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.empty-card__button {
  width: 180rpx;
  height: 72rpx;
  margin: 8rpx 0 0;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.empty-card__button::after {
  border: 0;
}

.header-image {
  position: relative;
  height: 500rpx;
  margin: -32rpx -32rpx 0;
  overflow: hidden;
  background: #e9e2d6;
}

.header-image__bg {
  width: 100%;
  height: 100%;
}

.header-overlay {
  position: absolute;
  top: calc(32rpx + env(safe-area-inset-top, 0));
  right: 32rpx;
  left: 32rpx;
  display: flex;
  justify-content: space-between;
}

.round-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 76rpx;
  height: 76rpx;
  padding: 0 24rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: rgba(255, 253, 252, 0.92);
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  backdrop-filter: blur(14rpx);
}

.round-button::after {
  border: 0;
}

.content {
  position: relative;
  z-index: 1;
  margin-top: -54rpx;
}

.recipe-title-card,
.detail-card {
  padding: 30rpx;
  border-radius: var(--app-radius-card);
  background: #fffdfc;
}

.detail-card {
  margin-top: 20rpx;
}

.title-row,
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.recipe-name,
.recipe-desc,
.meta-label,
.meta-value,
.section-title,
.section-note,
.ingredient-name,
.ingredient-amount,
.step-title,
.step-desc,
.note-text {
  display: block;
}

.recipe-name {
  color: var(--app-text);
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-detail-title);
}

.status-pill {
  flex: 0 0 auto;
  padding: 10rpx 16rpx;
  border-radius: var(--app-radius-button);
  background: #7a8b6f;
  color: var(--text-white);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.status-pill.is-draft {
  background: #e9e2d6;
  color: var(--app-text-secondary);
}

.recipe-desc {
  margin-top: 16rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 26rpx;
}

.meta-item {
  padding: 18rpx;
  border-radius: 24rpx;
  background: #e9e2d6;
}

.meta-label {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.meta-value {
  margin-top: 8rpx;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.section-title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.section-note {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.ingredient-list {
  margin-top: 18rpx;
  border-radius: 26rpx;
  overflow: hidden;
  background: #e9e2d6;
}

.ingredient-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 82rpx;
  padding: 0 22rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
}

.ingredient-row:last-child {
  border-bottom: 0;
}

.ingredient-name {
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.ingredient-amount {
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 20rpx;
}

.step-item {
  display: flex;
  gap: 18rpx;
  padding: 20rpx;
  border-radius: 28rpx;
  background: #e9e2d6;
}

.step-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54rpx;
  height: 54rpx;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #7a8b6f;
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.step-main {
  flex: 1;
  min-width: 0;
}

.step-title {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.step-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.note-text {
  margin-top: 18rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.setting-tags {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
}

.setting-tags text {
  padding: 10rpx 16rpx;
  border-radius: var(--app-radius-button);
  background: #e9e2d6;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}
</style>
