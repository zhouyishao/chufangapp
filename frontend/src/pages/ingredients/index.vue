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

    <view v-if="remoteLoading || remoteError" class="remote-banner glass-card">
      <text v-if="remoteLoading" class="remote-banner__text">正在加载食材...</text>
      <view v-else class="remote-banner__row">
        <text class="remote-banner__error">加载失败：{{ remoteError }}</text>
        <button class="remote-banner__retry" @tap="loadRemoteIngredients">重试</button>
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
        </view>
      </scroll-view>
    </view>

    <home-tab-bar :tabs="tabs" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
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
import { listIngredients } from '../../services/public-api';

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
  categories: string[];
  tags: string[];
}

const activeTopTab = ref('');
const activeMonth = ref('recommend');
const activeRecipeCategory = ref('all');
const currentMonth = new Date().getMonth() + 1;

const topTabs = ref<Tab[]>([
  { id: 'recipes', label: '菜谱' },
  { id: 'vegetables', label: '蔬菜' },
  { id: 'fruits', label: '水果' },
  { id: 'meat', label: '生擒' },
  { id: 'seafood', label: '水产' },
  { id: 'seasoning', label: '调料' }
]);

const months = ref<Tab[]>([
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

const recipeCategories = ref<Tab[]>([
  { id: 'all', label: '全部' },
  { id: 'home', label: '家常菜' },
  { id: 'quick', label: '快手菜' },
  { id: 'soup', label: '汤类' },
  { id: 'breakfast', label: '早餐' },
  { id: 'light', label: '减脂' }
]);

const allIngredients = ref<Ingredient[]>(ingredientCatalog);

const remoteLoading = ref(false);
const remoteError = ref<string | null>(null);

const mapRemoteIngredient = (item: {
  id: number;
  name: string;
  cover: string | null;
  seasonMonth: string | null;
  currentPrice: number | null;
  priceUnit: string | null;
}) => {
  const month = (() => {
    if (!item.seasonMonth) return undefined;
    const first = Number.parseInt(item.seasonMonth.split(',')[0]?.trim() ?? '', 10);
    return Number.isFinite(first) ? first : undefined;
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
    category: 'recommend',
    month
  } satisfies Ingredient;
};

const loadRemoteIngredients = async () => {
  remoteLoading.value = true;
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

const recipes = ref<Recipe[]>([
  {
    id: 'recipe-1',
    name: '芦笋虾仁',
    summary: '清爽快手，适合工作日晚餐',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    duration: '15 分钟',
    difficulty: '简单',
    people: '2-3 人',
    calories: '约260kcal',
    categories: ['quick', 'light'],
    tags: ['快手', '清淡']
  },
  {
    id: 'recipe-2',
    name: '番茄牛腩',
    summary: '番茄酸香，适合全家分食',
    image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=1200&q=80',
    duration: '60 分钟',
    difficulty: '中等',
    people: '3-4 人',
    calories: '约520kcal',
    categories: ['home'],
    tags: ['家常', '下饭']
  },
  {
    id: 'recipe-3',
    name: '菌菇豆腐汤',
    summary: '口味干净，步骤轻松',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
    duration: '25 分钟',
    difficulty: '简单',
    people: '2-3 人',
    calories: '约180kcal',
    categories: ['soup', 'light'],
    tags: ['汤类', '轻负担']
  },
  {
    id: 'recipe-4',
    name: '鸡蛋灌饼',
    summary: '早餐经典，外酥里嫩',
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80',
    duration: '20 分钟',
    difficulty: '中等',
    people: '1-2 人',
    calories: '约380kcal',
    categories: ['breakfast', 'quick'],
    tags: ['早餐', '主食']
  }
]);

const tabs = ref<HomeTab[]>([
  { id: 'home', label: '首页', active: false },
  { id: 'ingredients', label: '食材', active: true },
  { id: 'basket', label: '菜篮子', active: false },
  { id: 'mine', label: '我的', active: false }
]);

const basketIngredientIds = ref<string[]>([]);

const isRecipeMode = computed(() => activeTopTab.value === 'recipes');

const sideNavItems = computed(() => (isRecipeMode.value ? recipeCategories.value : months.value));

const activeSideNav = computed(() => (isRecipeMode.value ? activeRecipeCategory.value : activeMonth.value));

const displayIngredients = computed(() => {
  if (activeMonth.value === 'recommend') {
    return allIngredients.value.filter(item => item.month === currentMonth);
  }

  if (activeMonth.value.startsWith('month-')) {
    const month = parseInt(activeMonth.value.replace('month-', ''));
    return allIngredients.value.filter(item => item.month === month);
  }

  if (activeTopTab.value) {
    return allIngredients.value.filter(item => item.category === activeTopTab.value);
  }

  return allIngredients.value;
});

const displayRecipes = computed(() => {
  if (activeRecipeCategory.value === 'all') {
    return recipes.value;
  }

  return recipes.value.filter(recipe => recipe.categories.includes(activeRecipeCategory.value));
});

const selectTopTab = (tabId: string) => {
  activeTopTab.value = tabId;
  activeMonth.value = '';
  if (tabId === 'recipes') {
    activeRecipeCategory.value = 'all';
  }
};

const selectMonth = (monthId: string) => {
  activeMonth.value = monthId;
  activeTopTab.value = '';
};

const selectRecipeCategory = (categoryId: string) => {
  activeRecipeCategory.value = categoryId;
  activeTopTab.value = 'recipes';
  activeMonth.value = '';
};

const selectSideNav = (itemId: string) => {
  if (isRecipeMode.value) {
    selectRecipeCategory(itemId);
    return;
  }

  selectMonth(itemId);
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
</style>
