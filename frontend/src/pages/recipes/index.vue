<template>
  <view class="page">
    <view class="header">
      <view class="header-top">
        <view class="back-button" @tap="goBack">
          <app-icon class="back-icon" name="arrow-left" size="26rpx" />
        </view>
        <text class="header-title">菜谱</text>
        <view class="header-spacer" />
      </view>
      <view class="search-bar" @tap="handleSearch">
        <app-icon class="search-icon" name="search" size="26rpx" />
        <text class="search-placeholder">搜索菜谱</text>
      </view>
      <view class="category-section">
        <scroll-view class="category-scroll" scroll-x enable-flex>
          <view class="category-row">
            <view
              v-for="category in categories"
              :key="category.id"
              :class="['category-chip', { active: activeCategory === category.id }]"
              @tap="selectCategory(category.id)"
            >
              <text class="category-label">{{ category.label }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <view class="content">
      <view class="filter-section glass-card">
        <view class="filter-row">
          <view class="filter-item" @tap="toggleFilterDropdown('time')">
            <text class="filter-label">{{ timeFilterLabel }}</text>
            <app-icon :class="['filter-arrow', { 'is-open': activeFilterDropdown === 'time' }]" name="chevron-down" size="22rpx" />
          </view>
          <view class="filter-divider" />
          <view class="filter-item" @tap="toggleFilterDropdown('difficulty')">
            <text class="filter-label">{{ difficultyFilterLabel }}</text>
            <app-icon :class="['filter-arrow', { 'is-open': activeFilterDropdown === 'difficulty' }]" name="chevron-down" size="22rpx" />
          </view>
          <view class="filter-divider" />
          <view class="filter-item" @tap="toggleFilterDropdown('servings')">
            <text class="filter-label">{{ servingsFilterLabel }}</text>
            <app-icon :class="['filter-arrow', { 'is-open': activeFilterDropdown === 'servings' }]" name="chevron-down" size="22rpx" />
          </view>
        </view>
        <view v-if="activeFilterDropdown" class="filter-dropdown">
          <button
            v-for="option in activeFilterOptions"
            :key="option.value"
            :class="['filter-option', { 'is-active': option.value === activeFilterValue }]"
            @tap="selectFilterOption(option.value)"
          >
            {{ option.label }}
          </button>
        </view>
      </view>

      <view v-if="remoteLoading" class="remote-banner glass-card">
        <text class="remote-banner__text">正在加载菜谱...</text>
      </view>
      <view v-else-if="remoteError" class="remote-banner glass-card">
        <text class="remote-banner__error">加载失败：{{ remoteError }}</text>
        <button class="remote-banner__retry" @tap="handleRetryRemote">重试</button>
      </view>

      <view class="recipes-list">
        <view
          v-for="recipe in displayRecipes"
          :key="recipe.id"
          class="recipe-card glass-card"
          @tap="goToRecipeDetail(recipe.id)"
        >
          <image class="recipe-image" :src="recipe.image" mode="aspectFill" />
          <view class="recipe-body">
            <view class="recipe-header">
              <text class="recipe-name">{{ recipe.name }}</text>
              <view class="recipe-actions">
                <button class="action-icon" @tap.stop="toggleCollect(recipe.id)">
                  <app-icon :name="recipe.collected ? 'heart-filled' : 'heart'" size="28rpx" />
                </button>
              </view>
            </view>
            <text class="recipe-reason">{{ recipe.reason }}</text>
            <view class="recipe-meta">
              <view class="meta-item">
                <app-icon class="meta-icon" name="clock" size="22rpx" />
                <text class="meta-text">{{ recipe.duration }}</text>
              </view>
              <view class="meta-item">
                <app-icon class="meta-icon" name="difficulty" size="22rpx" />
                <text class="meta-text">{{ recipe.difficulty }}</text>
              </view>
              <view class="meta-item">
                <app-icon class="meta-icon" name="users" size="22rpx" />
                <text class="meta-text">{{ recipe.servings }}</text>
              </view>
            </view>
            <view class="recipe-tags">
              <nut-tag
                v-for="tag in recipe.tags"
                :key="tag"
                size="small"
                plain
              >
                {{ tag }}
              </nut-tag>
            </view>
            <button
              :class="['basket-icon-button', { 'is-added': isRecipeInBasket(recipe) }]"
              @tap.stop="toggleRecipeBasket(recipe)"
            >
              <app-icon class="basket-icon-button__icon" name="basket" size="28rpx" />
            </button>
          </view>
        </view>
      </view>

      <view v-if="!remoteLoading && !remoteError && displayRecipes.length === 0" class="empty-state glass-card">
        <text class="empty-state__title">暂无菜谱</text>
        <text class="empty-state__desc">当前筛选下没有可展示的菜谱，切换到“全部”或稍后再试。</text>
      </view>

      <view v-if="hasMore" class="load-more" @tap="loadMore">
        <text class="load-more-text">加载更多</text>
      </view>
    </view>

    <home-tab-bar :tabs="tabs" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import { addBasketItem, getIngredientPurchaseText, loadBasketItems, removeBasketItem } from '../../services/basket';
import type { BasketItem } from '../../services/basket';
import { addMobileFavorite, deleteMobileFavorite, listMobileFavorites, listRecipes } from '../../services/public-api';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import type { HomeTab } from '../../types/home';

interface Recipe {
  id: string;
  name: string;
  image: string;
  duration: string;
  difficulty: string;
  servings: string;
  reason: string;
  tags: string[];
  collected: boolean;
  favoriteRecordId: number | null;
  legacyId: number | null;
  category: string;
  basketIngredients: BasketIngredient[];
}

interface Category {
  id: string;
  label: string;
}

interface BasketIngredient {
  name: string;
  amount: string;
}

type FilterType = 'time' | 'difficulty' | 'servings';

interface FilterOption {
  label: string;
  value: string;
}

const activeCategory = ref('all');
const timeFilter = ref('all');
const difficultyFilter = ref('all');
const servingsFilter = ref('all');
const activeFilterDropdown = ref<FilterType | ''>('');
const hasMore = ref(true);
const basketItemIds = ref<string[]>([]);
const basketItems = ref<BasketItem[]>([]);
const tabs = ref<HomeTab[]>([
  { id: 'home', label: '首页', active: false },
  { id: 'ingredients', label: '食材', active: true },
  { id: 'basket', label: '菜篮子', active: false },
  { id: 'mine', label: '我的', active: false }
]);

const timeOptions: FilterOption[] = [
  { label: '全部耗时', value: 'all' },
  { label: '30分钟内', value: 'quick' },
  { label: '30-60分钟', value: 'medium' },
  { label: '60分钟以上', value: 'long' }
];

const difficultyOptions: FilterOption[] = [
  { label: '全部难度', value: 'all' },
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
];

const servingsOptions: FilterOption[] = [
  { label: '全部人数', value: 'all' },
  { label: '1-2人', value: 'single' },
  { label: '3-4人', value: 'family' },
  { label: '5人以上', value: 'party' }
];

const categories = ref<Category[]>([{ id: 'all', label: '全部' }]);

const recipes = ref<Recipe[]>([]);

const remoteLoading = ref(false);
const remoteError = ref<string | null>(null);
const remotePage = ref(1);
const remotePageSize = ref(10);
const remoteTotal = ref(0);
const hasRequestedRemote = ref(false);

const mapRemoteRecipe = (item: {
  id: string;
  title: string;
  cover: string | null;
  description: string | null;
  cookTime: number | null;
  difficulty: string | null;
  servings: number | null;
  taste?: string | null;
  scene?: string | null;
  category?: { id: string; name: string; type: string } | null;
  cuisine?: { id: number; name: string } | null;
  legacyId?: number;
}) => {
  const duration = item.cookTime ? `${item.cookTime}分钟` : '—';
  const servingsText = item.servings ? `${item.servings}人` : '—';
  const tags = [item.taste, item.scene].filter(Boolean) as string[];
  const categoryName = item.category?.name ?? '';
  return {
    id: String(item.id),
    name: item.title,
    image: item.cover ?? '',
    duration,
    difficulty: item.difficulty ?? '—',
    servings: servingsText,
    reason: item.description ?? '',
    tags: tags.length > 0 ? tags : ['推荐'],
    collected: false,
    favoriteRecordId: null,
    legacyId: Number.isFinite(Number(item.legacyId)) ? Number(item.legacyId) : null,
    category: categoryName,
    basketIngredients: []
  } satisfies Recipe;
};

const syncRemoteCategories = () => {
  const categoryNames = Array.from(new Set(recipes.value.map((item) => item.category).filter(Boolean)));
  categories.value = [
    { id: 'all', label: '全部' },
    ...categoryNames.map((name) => ({ id: name, label: name }))
  ];
  if (activeCategory.value !== 'all' && !categoryNames.includes(activeCategory.value)) {
    activeCategory.value = 'all';
  }
};

const getLoggedUserId = async () => {
  const user = await syncAuthUserWithBackend(loadAuthUser());
  return user?.id ?? null;
};

const syncRecipeFavoriteStates = async () => {
  const userId = await getLoggedUserId();
  if (!userId) {
    recipes.value = recipes.value.map((item) => ({ ...item, collected: false, favoriteRecordId: null }));
    return;
  }
  const data = await listMobileFavorites({ userId, page: 1, pageSize: 100 });
  recipes.value = recipes.value.map((recipe) => {
    const record = data.list.find((item) => recipe.legacyId !== null && item.recipeId === recipe.legacyId);
    return {
      ...recipe,
      collected: Boolean(record),
      favoriteRecordId: record?.id ?? null
    };
  });
};

const loadRemoteRecipes = async (mode: 'reset' | 'append') => {
  remoteLoading.value = true;
  hasRequestedRemote.value = true;
  remoteError.value = null;
  try {
    const page = mode === 'reset' ? 1 : remotePage.value;
    const data = await listRecipes({ page, pageSize: 10 });
    const next = data.list.map(mapRemoteRecipe);
    recipes.value = mode === 'append' ? [...recipes.value, ...next] : next;
    syncRemoteCategories();
    void syncRecipeFavoriteStates().catch(() => undefined);
    remoteTotal.value = data.total;
    remotePage.value = page;
    hasMore.value = page * remotePageSize.value < data.total;
  } catch (err) {
    remoteError.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    remoteLoading.value = false;
  }
};

const handleRetryRemote = () => {
  if (remoteLoading.value) return;
  remotePage.value = 1;
  void loadRemoteRecipes('reset');
};

const loadFirstPageRecipes = () => {
  if (remoteLoading.value) return;
  remotePage.value = 1;
  void loadRemoteRecipes('reset');
};

const displayRecipes = computed(() => {
  let filtered = recipes.value;

  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(r => r.category === activeCategory.value);
  }

  if (timeFilter.value !== 'all') {
    filtered = filtered.filter((recipe) => matchTimeFilter(recipe.duration));
  }

  if (difficultyFilter.value !== 'all') {
    filtered = filtered.filter((recipe) => matchDifficultyFilter(recipe.difficulty));
  }

  if (servingsFilter.value !== 'all') {
    filtered = filtered.filter((recipe) => matchServingsFilter(recipe.servings));
  }

  return filtered;
});

const activeFilterOptions = computed(() => {
  if (activeFilterDropdown.value === 'time') {
    return timeOptions;
  }

  if (activeFilterDropdown.value === 'difficulty') {
    return difficultyOptions;
  }

  if (activeFilterDropdown.value === 'servings') {
    return servingsOptions;
  }

  return [];
});

const activeFilterValue = computed(() => {
  if (activeFilterDropdown.value === 'time') {
    return timeFilter.value;
  }

  if (activeFilterDropdown.value === 'difficulty') {
    return difficultyFilter.value;
  }

  if (activeFilterDropdown.value === 'servings') {
    return servingsFilter.value;
  }

  return '';
});

const timeFilterLabel = computed(() => {
  const labels: Record<string, string> = {
    all: '耗时',
    quick: '30分钟内',
    medium: '30-60分钟',
    long: '60分钟以上'
  };
  return labels[timeFilter.value];
});

const difficultyFilterLabel = computed(() => {
  const labels: Record<string, string> = {
    all: '难度',
    easy: '简单',
    medium: '中等',
    hard: '困难'
  };
  return labels[difficultyFilter.value];
});

const servingsFilterLabel = computed(() => {
  const labels: Record<string, string> = {
    all: '人数',
    single: '1-2人',
    family: '3-4人',
    party: '5人以上'
  };
  return labels[servingsFilter.value];
});

const selectCategory = (categoryId: string) => {
  activeCategory.value = categoryId;
  activeFilterDropdown.value = '';
};

const goBack = () => {
  uni.reLaunch({ url: '/pages/index/index' });
};

const toggleFilterDropdown = (type: FilterType) => {
  activeFilterDropdown.value = activeFilterDropdown.value === type ? '' : type;
};

const selectFilterOption = (value: string) => {
  if (activeFilterDropdown.value === 'time') {
    timeFilter.value = value;
  }

  if (activeFilterDropdown.value === 'difficulty') {
    difficultyFilter.value = value;
  }

  if (activeFilterDropdown.value === 'servings') {
    servingsFilter.value = value;
  }

  activeFilterDropdown.value = '';
};

const getDurationMinutes = (duration: string) => {
  const minutes = Number.parseInt(duration, 10);
  return Number.isFinite(minutes) ? minutes : 0;
};

const matchTimeFilter = (duration: string) => {
  const minutes = getDurationMinutes(duration);
  if (timeFilter.value === 'quick') {
    return minutes <= 30;
  }

  if (timeFilter.value === 'medium') {
    return minutes > 30 && minutes <= 60;
  }

  if (timeFilter.value === 'long') {
    return minutes > 60;
  }

  return true;
};

const matchDifficultyFilter = (difficulty: string) => {
  const difficultyMap: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  };

  return difficulty === difficultyMap[difficultyFilter.value];
};

const matchServingsFilter = (servings: string) => {
  if (servingsFilter.value === 'single') {
    return servings.includes('1-2') || servings === '2人';
  }

  if (servingsFilter.value === 'family') {
    return servings.includes('3-4');
  }

  if (servingsFilter.value === 'party') {
    const firstNumber = Number.parseInt(servings, 10);
    return Number.isFinite(firstNumber) && firstNumber >= 5;
  }

  return true;
};

const toggleCollect = async (recipeId: string) => {
  const recipe = recipes.value.find(r => r.id === recipeId);
  if (!recipe) return;
  if (!recipe.legacyId) {
    uni.showToast({ title: '真实菜谱加载后可收藏', icon: 'none' });
    return;
  }
  try {
    const userId = await getLoggedUserId();
    if (!userId) {
      uni.showToast({ title: '请先登录后收藏', icon: 'none' });
      return;
    }
    if (recipe.collected && recipe.favoriteRecordId) {
      await deleteMobileFavorite(recipe.favoriteRecordId);
      recipe.collected = false;
      recipe.favoriteRecordId = null;
      uni.showToast({ title: '已取消收藏', icon: 'none' });
      return;
    }
    const record = await addMobileFavorite({ userId, recipeId: recipe.legacyId });
    recipe.collected = true;
    recipe.favoriteRecordId = record.id;
    uni.showToast({ title: '已收藏', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '操作失败', icon: 'none' });
  }
};

const getRecipeBasketItemId = (recipe: Recipe, ingredient: BasketIngredient) => `${recipe.id}-${ingredient.name}`;

const isRecipeInBasket = (recipe: Recipe) => {
  return recipe.basketIngredients.every((ingredient) => basketItemIds.value.includes(getRecipeBasketItemId(recipe, ingredient)));
};

const toggleRecipeBasket = async (recipe: Recipe) => {
  if (isRecipeInBasket(recipe)) {
    await Promise.all(recipe.basketIngredients.map(async (ingredient) => {
      const existing = basketItems.value.find((item) => getRecipeBasketItemId(recipe, ingredient) === getBasketKey(item));
      if (existing) await removeBasketItem(existing.id);
    }));
    await syncBasketState();
    uni.showToast({
      title: '已移出菜篮子',
      icon: 'none'
    });
    return;
  }

  await Promise.all(recipe.basketIngredients
    .filter((ingredient) => !basketItemIds.value.includes(getRecipeBasketItemId(recipe, ingredient)))
    .map((ingredient) =>
      addBasketItem({
        id: getRecipeBasketItemId(recipe, ingredient),
        recipeId: recipe.id,
        recipeName: recipe.name,
        name: ingredient.name,
        amountText: ingredient.amount,
        purchaseText: getIngredientPurchaseText(ingredient.name),
        checked: false
      })
    ));

  await syncBasketState();
  uni.showToast({
    title: '已加入菜篮子',
    icon: 'success'
  });
};

const getBasketKey = (item: BasketItem) => `${item.recipeId}-${item.name}`;

const syncBasketState = async () => {
  basketItems.value = await loadBasketItems();
  basketItemIds.value = basketItems.value.map(getBasketKey);
};

const goToRecipeDetail = (recipeId: string) => {
  uni.navigateTo({
    url: `/pages/recipe-detail/index?id=${recipeId}`
  });
};

const handleSearch = () => {
  uni.navigateTo({ url: '/pages/search/index' });
};

const loadMore = () => {
  if (remoteLoading.value) return;
  if (!hasMore.value) {
    uni.showToast({ title: '没有更多了', icon: 'none' });
    return;
  }
  remotePage.value += 1;
  void loadRemoteRecipes('append');
};

onShow(() => {
  void syncBasketState().catch(() => undefined);
  loadFirstPageRecipes();
});

onMounted(() => {
  if (!hasRequestedRemote.value) {
    loadFirstPageRecipes();
  }
});

</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding-bottom: calc(190rpx + env(safe-area-inset-bottom, 0));
  background: var(--app-bg);
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: calc(var(--status-bar-height) + 20rpx) 30rpx 14rpx;
  background: var(--app-bg);
}

.header-top {
  display: grid;
  grid-template-columns: 72rpx 1fr auto;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(255, 253, 252, 0.9);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
}

.back-icon {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.header-title {
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
}

.header-spacer {
  width: 72rpx;
  height: 72rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 18rpx;
  padding: 24rpx 32rpx;
  border-radius: 48rpx;
  background: rgba(255, 253, 252, 0.9);
  backdrop-filter: blur(20rpx);
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.search-icon {
  font-size: var(--font-size-list-title);
  opacity: 0.4;
}

.search-placeholder {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-body-sm);
}

.content {
  padding: 0 30rpx 30rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  margin-top: 24rpx;
  padding: 48rpx 32rpx;
  text-align: center;
}

.empty-state__title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.empty-state__desc {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.category-section {
  margin: 0 -30rpx;
  padding: 0 30rpx;
  background: var(--app-bg);
}

.category-scroll {
  white-space: nowrap;
}

.category-row {
  display: inline-flex;
  gap: 38rpx;
  min-width: 100%;
  padding: 8rpx 0 14rpx;
}

.category-chip {
  position: relative;
  padding: 10rpx 0 14rpx;
}

.category-chip.active::after {
  position: absolute;
  right: 8rpx;
  bottom: 0;
  left: 8rpx;
  height: 5rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent);
  content: '';
}

.category-label {
  color: var(--app-text-secondary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  white-space: nowrap;
}

.category-chip.active .category-label {
  color: var(--app-accent);
  font-weight: var(--font-semibold);
}

.filter-section {
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
}

.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
}

.filter-label {
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
}

.filter-arrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  transition: transform 160ms ease;
}

.filter-arrow.is-open {
  transform: rotate(180deg);
}

.filter-divider {
  width: 1rpx;
  height: 32rpx;
  background: var(--app-border);
}

.filter-dropdown {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid var(--app-border);
}

.filter-option {
  height: 64rpx;
  margin: 0;
  border: 0;
  border-radius: var(--app-radius-button);
  background: #e9e2d6;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.filter-option::after {
  border: 0;
}

.filter-option.is-active {
  background: var(--app-accent);
  color: var(--text-white);
}

.recipes-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.remote-banner {
  margin: 0 30rpx 18rpx;
  padding: 18rpx 22rpx;
  border-radius: var(--app-radius-card);
}

.remote-banner__text {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

.remote-banner__error {
  color: var(--app-danger);
  font-size: var(--font-size-tag);
  line-height: var(--line-caption);
}

.remote-banner__retry {
  margin-top: 12rpx;
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 253, 252, 0.9);
  color: var(--app-text);
  font-size: var(--font-size-tag);
}

.recipe-card {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
  transition: transform 0.2s ease;
}

.recipe-card:active {
  transform: scale(0.98);
}

.recipe-image {
  width: 200rpx;
  height: 200rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
}

.recipe-body {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12rpx;
}

.recipe-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.recipe-name {
  flex: 1;
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.recipe-actions {
  flex-shrink: 0;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(233, 226, 214, 0.56);
  color: var(--app-danger);
}

.action-icon::after {
  border: 0;
}

.recipe-reason {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-body-sm);
}

.recipe-meta {
  display: flex;
  gap: 24rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.meta-icon {
  color: var(--app-text-tertiary);
  opacity: 0.6;
}

.meta-text {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.recipe-tags {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  padding-right: 58rpx;
}

.basket-icon-button {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50rpx;
  height: 50rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--app-accent-soft);
  color: var(--app-text);
}

.basket-icon-button::after {
  border: 0;
}

.basket-icon-button.is-added {
  background: rgba(107, 163, 104, 0.12);
  color: var(--app-success);
}

.basket-icon-button__icon {
  width: 25rpx;
  height: 25rpx;
}

.load-more {
  padding: 40rpx 0;
  text-align: center;
}

.load-more-text {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
}

</style>
