<template>
  <view class="page">
    <view class="header">
      <view class="search-bar" @tap="handleSearch">
        <view class="search-icon">🔍</view>
        <text class="search-placeholder">搜索食材</text>
      </view>
    </view>

    <view class="top-tabs">
      <scroll-view class="tabs-scroll" scroll-x enable-flex>
        <view class="tabs-row">
          <view
            v-for="tab in topTabs"
            :key="tab.id"
            :class="['tab-item', { active: activeTopTab === tab.id }]"
            @tap="selectTopTab(tab.id)"
          >
            <text class="tab-label">{{ tab.label }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="activeLoading || activeError" class="remote-banner glass-card">
      <text v-if="activeLoading" class="remote-banner__text">{{ isRecipeMode ? '正在加载菜谱...' : '正在加载食材...' }}</text>
      <view v-else class="remote-banner__row">
        <text class="remote-banner__error">加载失败：{{ activeError }}</text>
        <button class="remote-banner__retry" @tap="retryActiveLoad">重试</button>
      </view>
    </view>

    <view class="content-wrapper">
      <scroll-view class="left-nav" scroll-y>
        <view
          v-for="item in sideNavItems"
          :key="item.id"
          :class="['nav-item', { active: activeSideNav === item.id }]"
          @tap="selectSideNav(item.id)"
        >
          <text class="nav-label">{{ item.label }}</text>
          <view v-if="activeSideNav === item.id" class="nav-indicator" />
        </view>
      </scroll-view>

      <scroll-view class="right-content" scroll-y>
        <view v-if="!isRecipeMode" class="ingredient-list">
          <view
            v-for="item in displayIngredients"
            :key="item.id"
            :class="['ingredient-card', { 'ingredient-card--in-basket': isInBasket(item.id) }]"
            @tap="goToIngredientDetail(item.id)"
          >
            <image class="ingredient-image" :src="item.image" mode="aspectFill" />
            <view class="ingredient-info">
              <text class="ingredient-name">{{ item.name }}</text>
              <text class="ingredient-desc">{{ item.description }}</text>
              <text class="ingredient-price">{{ getEstimatedPrice(item.name) }}</text>
              <view class="ingredient-tags">
                <text
                  v-for="tag in item.tags"
                  :key="tag"
                  class="ingredient-tag"
                >
                  {{ tag }}
                </text>
              </view>
            </view>
            <view
              v-if="isInBasket(item.id)"
              class="basket-added"
              @tap.stop="removeIngredientFromBasket(item)"
            >
              <svg
                class="basket-added__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </view>
            <view
              v-if="!isInBasket(item.id)"
              class="basket-action"
              @tap.stop="addIngredientToBasket(item)"
            >
              <svg
                class="basket-action__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </view>
          </view>
        </view>
        <view v-else class="recipe-list">
          <view
            v-for="recipe in displayRecipes"
            :key="recipe.id"
            class="recipe-card"
            @tap="goToRecipeDetail(recipe.id)"
          >
            <image class="recipe-image" :src="recipe.image" mode="aspectFill" />
            <view class="recipe-info">
              <view class="recipe-head">
                <text class="recipe-name">{{ recipe.name }}</text>
                <text class="recipe-calories">{{ recipe.calories }}</text>
              </view>
              <text class="recipe-summary">{{ recipe.summary }}</text>
              <view class="recipe-meta">
                <text>{{ recipe.duration }}</text>
                <text>{{ recipe.difficulty }}</text>
                <text>{{ recipe.people }}</text>
              </view>
              <view class="recipe-tags">
                <text v-for="tag in recipe.tags" :key="tag" class="recipe-tag">{{ tag }}</text>
              </view>
            </view>
          </view>
          <view v-if="!recipeLoading && !recipeError && displayRecipes.length === 0" class="empty-state">
            <text class="empty-state__title">暂无菜谱</text>
            <text class="empty-state__desc">后台已发布菜谱会显示在这里。</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <home-tab-bar :tabs="tabs" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import { ingredientCatalog } from '../../constants/ingredients';
import {
  addBasketItem,
  getIngredientBasketItemId,
  getIngredientPurchaseText,
  loadBasketItems,
  removeBasketItem
} from '../../services/basket';
import type { HomeTab } from '../../types/home';
import type { Ingredient } from '../../types/ingredient';
import { listIngredients, listRecipes } from '../../services/public-api';

interface Tab {
  id: string;
  label: string;
}

interface Recipe {
  id: string;
  name: string;
  summary: string;
  image: string;
  duration: string;
  difficulty: string;
  people: string;
  calories: string;
  category: string;
  tags: string[];
}

const activeTopTab = ref('recipes');
const activeIngredientFilter = ref('recommend');
const activeRecipeCategory = ref('all');
const currentMonth = new Date().getMonth() + 1;

const topTabs = ref<Tab[]>([
  { id: 'recipes', label: '菜谱' },
  { id: 'vegetables', label: '蔬菜' },
  { id: 'fruits', label: '水果' },
  { id: 'meat', label: '生禽' },
  { id: 'seafood', label: '水产' },
  { id: 'seasoning', label: '调料' }
]);

const ingredientSideItems = ref<Tab[]>([
  { id: 'recommend', label: '推荐' },
  { id: 'month-1', label: '1月' },
  { id: 'month-2', label: '2月' },
  { id: 'month-3', label: '3月' },
  { id: 'month-4', label: '4月' },
  { id: 'month-5', label: '5月' },
  { id: 'month-6', label: '6月' },
  { id: 'month-7', label: '7月' },
  { id: 'month-8', label: '8月' },
  { id: 'month-9', label: '9月' },
  { id: 'month-10', label: '10月' },
  { id: 'month-11', label: '11月' },
  { id: 'month-12', label: '12月' }
]);

const recipeSideItems = ref<Tab[]>([
  { id: 'all', label: '推荐' },
  { id: '家常菜', label: '家常菜' },
  { id: '快手菜', label: '快手菜' },
  { id: '早餐', label: '早餐' },
  { id: '晚餐', label: '晚餐' },
  { id: '减脂餐', label: '减脂餐' },
  { id: '下饭菜', label: '下饭菜' }
]);

const allIngredients = ref<Ingredient[]>(ingredientCatalog);
const recipes = ref<Recipe[]>([]);

const remoteLoading = ref(false);
const remoteError = ref<string | null>(null);
const hasRequestedIngredients = ref(false);
const recipeLoading = ref(false);
const recipeError = ref<string | null>(null);
const hasRequestedRecipes = ref(false);

const mapRemoteIngredient = (item: {
  id: number;
  name: string;
  cover: string | null;
  seasonMonth: string | null;
  currentPrice: number | null;
  priceUnit: string | null;
  category?: { id: number; name: string; type: 'INGREDIENT' } | null;
}) => {
  const months = (() => {
    if (!item.seasonMonth) return undefined;
    const parsed = item.seasonMonth
      .split(/[,，/\s]+/)
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 12);
    return parsed.length > 0 ? parsed : undefined;
  })();
  const priceText =
    item.currentPrice !== null && item.currentPrice !== undefined
      ? `${item.currentPrice}${item.priceUnit ?? ''}`
      : '';
  return {
    id: String(item.id),
    name: item.name,
    description: priceText ? `当前价格：${priceText}` : '时令食材',
    image:
      item.cover ??
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    tags: ['推荐'],
    category: normalizeIngredientCategory(item.category?.name),
    month: months?.[0],
    months
  } satisfies Ingredient;
};

const normalizeIngredientCategory = (name?: string | null) => {
  const categoryMap: Record<string, string> = {
    蔬菜: 'vegetables',
    水果: 'fruits',
    时令水果: 'fruits',
    生禽: 'meat',
    肉禽蛋: 'meat',
    肉类: 'meat',
    水产: 'seafood',
    海鲜: 'seafood',
    水产海鲜: 'seafood',
    调料: 'seasoning',
    调味: 'seasoning',
    基础调料: 'seasoning',
    应季食材: 'vegetables'
  };
  return name ? categoryMap[name] ?? 'all' : 'all';
};

const loadRemoteIngredients = async () => {
  remoteLoading.value = true;
  hasRequestedIngredients.value = true;
  remoteError.value = null;
  try {
    const data = await listIngredients({ page: 1, pageSize: 50 });
    allIngredients.value = data.list.map(mapRemoteIngredient);
  } catch (err) {
    remoteError.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    remoteLoading.value = false;
  }
};

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
}) => {
  const tags = [item.taste, item.scene].filter(Boolean) as string[];
  return {
    id: String(item.id),
    name: item.title,
    summary: item.description ?? '',
    image:
      item.cover ??
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    duration: item.cookTime ? `${item.cookTime}分钟` : '—',
    difficulty: item.difficulty ?? '—',
    people: item.servings ? `${item.servings}人` : '—',
    calories: '—',
    category: item.category?.name ?? '',
    tags: tags.length > 0 ? tags : ['推荐']
  } satisfies Recipe;
};

const loadRemoteRecipes = async () => {
  recipeLoading.value = true;
  hasRequestedRecipes.value = true;
  recipeError.value = null;
  try {
    console.log('[ingredients recipes tab] request /api/recipes');
    const data = await listRecipes({ page: 1, pageSize: 10 });
    console.log('[ingredients recipes tab] raw response', data);
    recipes.value = data.list.map(mapRemoteRecipe);
    console.log('[ingredients recipes tab] final recipes', recipes.value);
  } catch (err) {
    recipeError.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    recipeLoading.value = false;
  }
};

const tabs = ref<HomeTab[]>([
  { id: 'home', label: '首页', active: false },
  { id: 'ingredients', label: '食材', active: true },
  { id: 'basket', label: '菜篮子', active: false },
  { id: 'mine', label: '我的', active: false }
]);

const basketIngredientIds = ref<string[]>([]);

const isRecipeMode = computed(() => activeTopTab.value === 'recipes');

const activeLoading = computed(() => (isRecipeMode.value ? recipeLoading.value : remoteLoading.value));

const activeError = computed(() => (isRecipeMode.value ? recipeError.value : remoteError.value));

const sideNavItems = computed(() => (isRecipeMode.value ? recipeSideItems.value : ingredientSideItems.value));

const activeSideNav = computed(() => (isRecipeMode.value ? activeRecipeCategory.value : activeIngredientFilter.value));

const displayIngredients = computed(() => {
  let list = allIngredients.value;

  if (activeTopTab.value !== 'recipes') {
    list = list.filter(item => item.category === activeTopTab.value);
  }

  if (activeIngredientFilter.value === 'recommend') {
    const monthly = list.filter(item => hasIngredientMonth(item, currentMonth));
    return monthly.length > 0 ? monthly : list;
  }

  if (activeIngredientFilter.value.startsWith('month-')) {
    const month = parseInt(activeIngredientFilter.value.replace('month-', ''), 10);
    return list.filter(item => hasIngredientMonth(item, month));
  }

  return list;
});

const hasIngredientMonth = (item: Ingredient, month: number) => {
  if (item.months?.length) {
    return item.months.includes(month);
  }

  return item.month === month;
};

const displayRecipes = computed(() => {
  if (activeRecipeCategory.value === 'all') {
    return recipes.value;
  }

  return recipes.value.filter(recipe => recipe.category === activeRecipeCategory.value);
});

const selectTopTab = (tabId: string) => {
  activeTopTab.value = tabId;
  if (tabId === 'recipes') {
    activeRecipeCategory.value = 'all';
    if (recipes.value.length === 0) {
      void loadRemoteRecipes();
    }
    return;
  }

  activeIngredientFilter.value = 'recommend';
};

const selectSideNav = (itemId: string) => {
  if (isRecipeMode.value) {
    activeRecipeCategory.value = itemId;
    return;
  }

  activeIngredientFilter.value = itemId;
};

const retryActiveLoad = () => {
  if (isRecipeMode.value) {
    void loadRemoteRecipes();
    return;
  }

  void loadRemoteIngredients();
};

const handleSearch = () => {
  uni.showToast({
    title: '搜索功能开发中',
    icon: 'none'
  });
};

const goToIngredientDetail = (ingredientId: string) => {
  uni.navigateTo({
    url: `/pages/ingredient-detail/index?id=${ingredientId}`
  });
};

const goToRecipeDetail = (recipeId: string) => {
  uni.navigateTo({
    url: `/pages/recipe-detail/index?id=${recipeId}`
  });
};

const isInBasket = (ingredientId: string) => basketIngredientIds.value.includes(ingredientId);

const getEstimatedPrice = (name: string) => getIngredientPurchaseText(name) ?? '参考价待补充';

const addIngredientToBasket = (ingredient: Ingredient) => {
  if (isInBasket(ingredient.id)) {
    return;
  }

  addBasketItem({
    id: getIngredientBasketItemId(ingredient.id),
    recipeId: 'ingredient',
    recipeName: '单买食材',
    name: ingredient.name,
    amountText: '适量',
    purchaseText: getIngredientPurchaseText(ingredient.name),
    checked: false
  });
  syncBasketIngredientIds();
  uni.showToast({
    title: `${ingredient.name}已加入菜篮子`,
    icon: 'success'
  });
};

const removeIngredientFromBasket = (ingredient: Ingredient) => {
  removeBasketItem(getIngredientBasketItemId(ingredient.id));
  syncBasketIngredientIds();
  uni.showToast({
    title: `${ingredient.name}已移出菜篮子`,
    icon: 'none'
  });
};

const syncBasketIngredientIds = () => {
  basketIngredientIds.value = loadBasketItems()
    .filter((item) => item.id.startsWith('ingredient-'))
    .map((item) => item.id.replace('ingredient-', ''));
};

onShow(() => {
  syncBasketIngredientIds();
  void loadRemoteIngredients();
  if (isRecipeMode.value) {
    void loadRemoteRecipes();
  }
});

onLoad((query) => {
  if (query?.tab === 'recipes') {
    activeTopTab.value = 'recipes';
    activeRecipeCategory.value = 'all';
    void loadRemoteRecipes();
  }
});

onMounted(() => {
  if (!hasRequestedIngredients.value) {
    void loadRemoteIngredients();
  }
  if (isRecipeMode.value && !hasRequestedRecipes.value) {
    void loadRemoteRecipes();
  }
});
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--app-bg);
}

.header {
  padding: calc(var(--status-bar-height) + 20rpx) 30rpx 20rpx;
  background: #fffdfc;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.remote-banner {
  margin: 16rpx 30rpx 0;
  padding: 18rpx 22rpx;
  border-radius: var(--app-radius-card);
}

.remote-banner__text {
  color: var(--app-text-secondary);
  font-size: 24rpx;
}

.remote-banner__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.remote-banner__error {
  flex: 1;
  color: #dc2626;
  font-size: 24rpx;
  line-height: 1.4;
}

.remote-banner__retry {
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 253, 252, 0.9);
  color: var(--app-text);
  font-size: 24rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 28rpx;
  border-radius: 48rpx;
  background: rgba(0, 0, 0, 0.04);
}

.search-icon {
  font-size: 32rpx;
  opacity: 0.4;
}

.search-placeholder {
  color: var(--app-text-tertiary);
  font-size: 28rpx;
}

.top-tabs {
  background: #fffdfc;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
}

.tabs-scroll {
  white-space: nowrap;
}

.tabs-row {
  display: inline-flex;
  padding: 0 30rpx;
}

.tab-item {
  position: relative;
  padding: 24rpx 32rpx;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.tab-label {
  color: var(--app-text-secondary);
  font-size: 28rpx;
  font-weight: 500;
  white-space: nowrap;
}

.tab-item.active .tab-label {
  color: var(--app-text);
  font-weight: 600;
}

.tab-item.active::after {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 40rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: var(--app-accent);
  content: '';
  transform: translateX(-50%);
}

.content-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-nav {
  width: 150rpx;
  flex-shrink: 0;
  padding-bottom: calc(300rpx + env(safe-area-inset-bottom, 0));
  background: rgba(255, 253, 252, 0.68);
  border-right: 1rpx solid rgba(0, 0, 0, 0.04);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 86rpx;
  padding-left: 30rpx;
}

.nav-label {
  color: var(--app-text-secondary);
  font-size: 25rpx;
  font-weight: 600;
}

.nav-item.active {
  background: #fffdfc;
}

.nav-item.active .nav-label {
  color: var(--app-text);
  font-weight: 500;
}

.nav-indicator {
  position: absolute;
  top: 24rpx;
  left: 0;
  width: 6rpx;
  height: 38rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent);
}

.right-content {
  flex: 1;
  min-width: 0;
  background: var(--app-bg);
}

.ingredient-list,
.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 22rpx 22rpx calc(360rpx + env(safe-area-inset-bottom, 0));
}

.ingredient-card {
  position: relative;
  display: flex;
  gap: 18rpx;
  padding: 18rpx 90rpx 18rpx 18rpx;
  border-radius: var(--app-radius-input);
  background: #fffdfc;
  box-shadow: 0 14rpx 34rpx rgba(0, 0, 0, 0.04);
}

.ingredient-card--in-basket {
  border: 2rpx solid rgba(0, 0, 0, 0.04);
  background: linear-gradient(135deg, rgba(230, 238, 250, 0.98), rgba(244, 247, 251, 0.96));
  box-shadow: inset 0 0 0 1rpx rgba(255, 253, 252, 0.72), 0 18rpx 38rpx rgba(0, 0, 0, 0.04);
}

.ingredient-image {
  width: 150rpx;
  height: 150rpx;
  flex-shrink: 0;
  border-radius: 24rpx;
}

.ingredient-info {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 10rpx;
}

.ingredient-name {
  color: var(--app-text);
  font-size: 30rpx;
  font-weight: 500;
}

.ingredient-desc {
  color: var(--app-text-secondary);
  font-size: 23rpx;
  line-height: 1.45;
}

.ingredient-price {
  width: fit-content;
  padding: 6rpx 12rpx;
  border-radius: var(--app-radius-button);
  background: rgba(0, 0, 0, 0.04);
  color: var(--app-text);
  font-size: 21rpx;
  font-weight: 500;
}

.ingredient-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.ingredient-tag {
  padding: 6rpx 12rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
  font-size: 20rpx;
  font-weight: 650;
}

.basket-action {
  position: absolute;
  top: 50%;
  right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  background: #e9e2d6;
  color: var(--app-text);
  box-shadow: inset 0 0 0 1rpx rgba(0, 0, 0, 0.04);
  transform: translateY(-50%);
}

.basket-action__icon {
  width: 26rpx;
  height: 26rpx;
}

.basket-added {
  position: absolute;
  top: 50%;
  right: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  background: rgba(47, 47, 47, 0.78);
  color: #fffdfc;
  box-shadow: 0 12rpx 26rpx rgba(0, 0, 0, 0.08);
  transform: translateY(-50%);
}

.basket-added__icon {
  width: 27rpx;
  height: 27rpx;
}

.recipe-card {
  overflow: hidden;
  border-radius: 32rpx;
  background: #fffdfc;
  box-shadow: 0 14rpx 34rpx rgba(0, 0, 0, 0.04);
}

.recipe-image {
  display: block;
  width: 100%;
  height: 220rpx;
  background: #e9e2d6;
}

.recipe-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 22rpx;
}

.recipe-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.recipe-name {
  color: var(--app-text);
  font-size: 31rpx;
  font-weight: 600;
  line-height: 1.25;
}

.recipe-calories {
  flex-shrink: 0;
  padding: 6rpx 12rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
  font-size: 20rpx;
  font-weight: 500;
}

.recipe-summary {
  color: var(--app-text-secondary);
  font-size: 24rpx;
  line-height: 1.45;
}

.recipe-meta,
.recipe-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.recipe-meta text {
  color: var(--app-text-secondary);
  font-size: 22rpx;
  font-weight: 700;
}

.recipe-tag {
  padding: 6rpx 12rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  border-radius: 10rpx;
  color: var(--app-text);
  font-size: 20rpx;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 48rpx 24rpx;
  border-radius: var(--app-radius-card);
  background: #fffdfc;
  text-align: center;
}

.empty-state__title {
  color: var(--app-text);
  font-size: 30rpx;
  font-weight: 600;
}

.empty-state__desc {
  color: var(--app-text-secondary);
  font-size: 23rpx;
}

</style>
