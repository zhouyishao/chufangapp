<template>
  <view class="app-page today-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view>
        <text class="eyebrow">今日安排</text>
        <text class="page-title">今天吃什么</text>
      </view>
    </view>

    <view v-if="loading" class="state-card glass-card">
      <text class="state-title">正在加载今日推荐</text>
      <text class="state-desc">同步首页推荐、时令食材和菜谱列表。</text>
    </view>

    <view v-else-if="error" class="state-card glass-card">
      <text class="state-title">今日推荐加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="state-action" @tap="loadToday">重试</button>
    </view>

    <view v-else>
      <view class="hero-card glass-card">
        <text class="hero-kicker">{{ todayLabel }}</text>
        <text class="hero-title">{{ heroTitle }}</text>
        <text class="hero-desc">{{ heroDesc }}</text>
        <view class="hero-actions">
          <button class="hero-button hero-button--primary" @tap="goToRandomRecipe">看看菜谱</button>
          <button class="hero-button" @tap="goToSeasonal">时令食材</button>
        </view>
      </view>

      <view v-if="!recommendRecipes.length && !seasonalIngredients.length" class="state-card glass-card">
        <text class="state-title">暂无今日内容</text>
        <text class="state-desc">后台推荐还没有返回数据。</text>
      </view>

      <view v-else class="section-block">
        <text class="section-title">推荐菜谱</text>
        <view class="card-list">
          <view v-for="recipe in recommendRecipes" :key="recipe.id" class="item-card glass-card" @tap="goToRecipe(recipe.id)">
            <image class="item-image" :src="recipe.cover" mode="aspectFill" />
            <view class="item-body">
              <text class="item-title">{{ recipe.title }}</text>
              <text class="item-desc">{{ recipe.desc }}</text>
              <view class="item-meta">
                <text v-for="meta in recipe.meta" :key="meta">{{ meta }}</text>
              </view>
            </view>
            <app-icon class="arrow" name="chevron-right" size="22rpx" />
          </view>
        </view>

        <text class="section-title">时令食材</text>
        <view class="chip-list">
          <view
            v-for="ingredient in seasonalIngredients"
            :key="ingredient.id"
            class="chip-card glass-card"
            @tap="goToIngredient(ingredient.id)"
          >
            <image class="chip-image" :src="ingredient.cover" mode="aspectFill" />
            <text class="chip-title">{{ ingredient.name }}</text>
            <text class="chip-desc">{{ ingredient.reason }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { getHome } from '../../services/public-api';
import { resolveAssetUrl } from '../../services/public-api';

interface TodayRecipe {
  id: string;
  title: string;
  desc: string;
  cover: string;
  meta: string[];
}

interface TodayIngredient {
  id: number;
  name: string;
  reason: string;
  cover: string;
}

const loading = ref(false);
const error = ref('');
const recommendRecipes = ref<TodayRecipe[]>([]);
const seasonalIngredients = ref<TodayIngredient[]>([]);

const todayLabel = computed(() => new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }));
const heroTitle = computed(() => recommendRecipes.value[0]?.title || seasonalIngredients.value[0]?.name || '从今天开始，做一顿顺手的饭');
const heroDesc = computed(() => recommendRecipes.value[0]?.desc || seasonalIngredients.value[0]?.reason || '从真实后端推荐里挑一顿合适的饭。');

const loadToday = async () => {
  loading.value = true;
  error.value = '';
  try {
    const home = await getHome();
    recommendRecipes.value = home.recommendRecipes.slice(0, 6).map((item) => ({
      id: String(item.id),
      title: item.title,
      desc: item.subtitle || item.description || '今日推荐菜谱',
      cover: resolveAssetUrl(item.cover),
      meta: [
        item.cookTime ? `${item.cookTime} 分钟` : '顺手能做',
        item.difficulty || '难度待补充'
      ]
    }));
    seasonalIngredients.value = home.recommendIngredients.slice(0, 6).map((item) => ({
      id: item.id,
      name: item.name,
      reason: item.seasonMonth ? `适合 ${item.seasonMonth} 月` : '时令推荐',
      cover: resolveAssetUrl(item.cover)
    }));
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
    recommendRecipes.value = [];
    seasonalIngredients.value = [];
  } finally {
    loading.value = false;
  }
};

const goBack = () => uni.navigateBack();
const goToRecipe = (id: string) => uni.navigateTo({ url: `/pages/recipe-detail/index?id=${encodeURIComponent(id)}` });
const goToIngredient = (id: number) => uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${id}` });
const goToSeasonal = () => uni.navigateTo({ url: '/pages/seasonal/index' });
const goToRandomRecipe = () => {
  const first = recommendRecipes.value[0];
  if (first) goToRecipe(first.id);
};

onMounted(() => {
  void loadToday();
});

onShow(() => {
  void loadToday();
});
</script>

<style scoped lang="scss">
.today-page {
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

.back-button::after,
.hero-button::after,
.state-action::after {
  border: 0;
}

.eyebrow,
.page-title,
.hero-kicker,
.hero-title,
.hero-desc,
.section-title,
.state-title,
.state-desc,
.item-title,
.item-desc {
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

.hero-card {
  padding: 30rpx;
  background:
    linear-gradient(135deg, rgba(255, 253, 252, 0.98), rgba(245, 241, 234, 0.92)),
    #fffdfc;
}

.hero-kicker {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

.hero-title {
  margin-top: 10rpx;
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
}

.hero-desc {
  margin-top: 12rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-body);
  line-height: var(--line-body);
}

.hero-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 22rpx;
}

.hero-button,
.state-action {
  border: 0;
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.hero-button {
  background: rgba(255, 253, 252, 0.88);
  color: var(--app-text);
}

.hero-button--primary {
  background: #7a8b6f;
  color: var(--text-white);
}

.state-card {
  padding: 28rpx;
}

.state-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.state-desc {
  margin-top: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.state-action {
  margin-top: 18rpx;
  background: #7a8b6f;
  color: var(--text-white);
}

.section-block {
  margin-top: 8rpx;
}

.section-title {
  margin: 18rpx 2rpx 12rpx;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.card-list {
  display: grid;
  gap: 16rpx;
}

.item-card {
  display: grid;
  grid-template-columns: 146rpx 1fr 28rpx;
  gap: 18rpx;
  align-items: center;
  padding: 16rpx;
}

.item-image {
  width: 146rpx;
  height: 146rpx;
  border-radius: 24rpx;
  background: var(--app-surface-strong);
}

.item-body {
  min-width: 0;
}

.item-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.item-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
}

.chip-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.chip-card {
  padding: 16rpx;
}

.chip-image {
  width: 100%;
  height: 160rpx;
  border-radius: 22rpx;
  background: var(--app-surface-strong);
}

.chip-title {
  display: block;
  margin-top: 12rpx;
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.chip-desc {
  display: block;
  margin-top: 8rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.arrow {
  color: var(--app-text-tertiary);
  font-size: 36rpx;
}
</style>
