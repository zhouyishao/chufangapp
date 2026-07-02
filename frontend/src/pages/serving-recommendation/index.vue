<template>
  <view class="app-page serving-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view>
        <text class="eyebrow">场景推荐</text>
        <text class="page-title">几人用餐推荐</text>
      </view>
    </view>

    <view class="filter-row glass-card">
      <button
        v-for="option in servingsOptions"
        :key="option.key"
        :class="['filter-chip', { 'is-active': option.key === activeServingsFilter }]"
        @tap="activeServingsFilter = option.key"
      >
        {{ option.label }}
      </button>
    </view>

    <view v-if="loading" class="state-card glass-card">
      <text class="state-title">正在加载场景推荐</text>
      <text class="state-desc">从真实菜谱列表中按份量筛选。</text>
    </view>

    <view v-else-if="error" class="state-card glass-card">
      <text class="state-title">场景推荐加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="state-action" @tap="loadServingRecipes">重试</button>
    </view>

    <view v-else-if="!filteredRecipes.length" class="state-card glass-card">
      <text class="state-title">暂无匹配菜谱</text>
      <text class="state-desc">当前份量筛选下没有找到合适的菜谱。</text>
    </view>

    <view v-else class="section-block">
      <text class="section-title">推荐菜谱</text>
      <view class="card-list">
        <view v-for="recipe in filteredRecipes" :key="recipe.id" class="recipe-card glass-card" @tap="goToRecipe(recipe.id)">
          <image class="recipe-image" :src="recipe.cover" mode="aspectFill" />
          <view class="recipe-body">
            <text class="recipe-title">{{ recipe.title }}</text>
            <text class="recipe-desc">{{ recipe.desc }}</text>
            <view class="recipe-meta">
              <text v-for="meta in recipe.meta" :key="meta">{{ meta }}</text>
            </view>
          </view>
          <app-icon class="arrow" name="chevron-right" size="22rpx" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { listRecipes, type ApiRecipeListItem } from '../../services/public-api';
import { resolveAssetUrl } from '../../services/public-api';

type ServingsFilter = 'all' | 'two' | 'family' | 'party';

interface ServingRecipe {
  id: string;
  title: string;
  desc: string;
  cover: string;
  servings: number | null;
  meta: string[];
}

const loading = ref(false);
const error = ref('');
const activeServingsFilter = ref<ServingsFilter>('all');
const recipes = ref<ServingRecipe[]>([]);

const servingsOptions = [
  { key: 'all', label: '全部' },
  { key: 'two', label: '1-2 人' },
  { key: 'family', label: '3-4 人' },
  { key: 'party', label: '5 人以上' }
] as const;

const filteredRecipes = computed(() => {
  if (activeServingsFilter.value === 'all') return recipes.value;
  return recipes.value.filter((recipe) => {
    const servings = recipe.servings ?? 0;
    if (activeServingsFilter.value === 'two') return servings > 0 && servings <= 2;
    if (activeServingsFilter.value === 'family') return servings >= 3 && servings <= 4;
    return servings >= 5;
  });
});

const toServingRecipe = (item: ApiRecipeListItem): ServingRecipe => ({
  id: item.id,
  title: item.title,
  desc: item.subtitle || item.description || '场景推荐菜谱',
  cover: resolveAssetUrl(item.cover),
  servings: item.servings,
  meta: [
    item.servings ? `${item.servings} 人份` : '份量待补充',
    item.difficulty || '难度待补充'
  ]
});

const loadServingRecipes = async () => {
  loading.value = true;
  error.value = '';
  try {
    const data = await listRecipes({ page: 1, pageSize: 20 });
    recipes.value = data.list.map(toServingRecipe);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
    recipes.value = [];
  } finally {
    loading.value = false;
  }
};

const goBack = () => uni.navigateBack();
const goToRecipe = (id: string) => uni.navigateTo({ url: `/pages/recipe-detail/index?id=${encodeURIComponent(id)}` });

onLoad((options) => {
  const servings = typeof options?.servings === 'string' ? options.servings : '';
  if (servings === '2' || servings === 'two') activeServingsFilter.value = 'two';
  if (servings === '3' || servings === 'family') activeServingsFilter.value = 'family';
  if (servings === 'party') activeServingsFilter.value = 'party';
  void loadServingRecipes();
});

onMounted(() => {
  void loadServingRecipes();
});

onShow(() => {
  void loadServingRecipes();
});
</script>

<style scoped lang="scss">
.serving-page {
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
.filter-chip::after,
.state-action::after {
  border: 0;
}

.eyebrow,
.page-title,
.section-title,
.state-title,
.state-desc,
.recipe-title,
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

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 18rpx;
}

.filter-chip {
  border: 0;
  border-radius: 999rpx;
  background: rgba(245, 241, 234, 0.8);
  color: var(--app-text);
  font-size: var(--font-size-tag);
}

.filter-chip.is-active {
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
  border: 0;
  border-radius: var(--app-radius-button);
  background: #7a8b6f;
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
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

.recipe-card {
  display: grid;
  grid-template-columns: 146rpx 1fr 28rpx;
  gap: 18rpx;
  align-items: center;
  padding: 16rpx;
}

.recipe-image {
  width: 146rpx;
  height: 146rpx;
  border-radius: 24rpx;
  background: var(--app-surface-strong);
}

.recipe-body {
  min-width: 0;
}

.recipe-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.recipe-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.recipe-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
}

.arrow {
  color: var(--app-text-tertiary);
  font-size: 36rpx;
}
</style>
