<template>
  <view class="page">
    <view class="header">
      <view class="header-top">
        <view class="back-button" @tap="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="header-title">菜谱</text>
        <view class="header-spacer" />
      </view>
      <view class="search-bar" @tap="handleSearch">
        <view class="search-icon">🔍</view>
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
            <text :class="['filter-arrow', { 'is-open': activeFilterDropdown === 'time' }]">⌄</text>
          </view>
          <view class="filter-divider" />
          <view class="filter-item" @tap="toggleFilterDropdown('difficulty')">
            <text class="filter-label">{{ difficultyFilterLabel }}</text>
            <text :class="['filter-arrow', { 'is-open': activeFilterDropdown === 'difficulty' }]">⌄</text>
          </view>
          <view class="filter-divider" />
          <view class="filter-item" @tap="toggleFilterDropdown('servings')">
            <text class="filter-label">{{ servingsFilterLabel }}</text>
            <text :class="['filter-arrow', { 'is-open': activeFilterDropdown === 'servings' }]">⌄</text>
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
                <text class="action-icon" @tap.stop="toggleCollect(recipe.id)">
                  {{ recipe.collected ? '❤️' : '🤍' }}
                </text>
              </view>
            </view>
            <text class="recipe-reason">{{ recipe.reason }}</text>
            <view class="recipe-meta">
              <view class="meta-item">
                <text class="meta-icon">⏱</text>
                <text class="meta-text">{{ recipe.duration }}</text>
              </view>
              <view class="meta-item">
                <text class="meta-icon">📊</text>
                <text class="meta-text">{{ recipe.difficulty }}</text>
              </view>
              <view class="meta-item">
                <text class="meta-icon">👥</text>
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
              <svg
                class="basket-icon-button__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </button>
          </view>
        </view>
      </view>

      <view v-if="hasMore" class="load-more" @tap="loadMore">
        <text class="load-more-text">加载更多</text>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { addBasketItem, getIngredientPurchaseText, loadBasketItems, removeBasketItem } from '../../services/basket';

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

const categories = ref<Category[]>([
  { id: 'all', label: '全部' },
  { id: 'home', label: '家常菜' },
  { id: 'quick', label: '快手菜' },
  { id: 'soup', label: '汤类' },
  { id: 'breakfast', label: '早餐' },
  { id: 'diet', label: '减脂餐' },
  { id: 'rice', label: '下饭菜' },
  { id: 'snack', label: '夜宵' }
]);

const recipes = ref<Recipe[]>([
  {
    id: '1',
    name: '芦笋虾仁',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    duration: '15分钟',
    difficulty: '简单',
    servings: '2-3人',
    reason: '清爽快手，适合工作日晚餐',
    tags: ['快手', '清淡'],
    collected: false,
    category: 'quick',
    basketIngredients: [
      { name: '芦笋', amount: '200g' },
      { name: '虾仁', amount: '150g' },
      { name: '大蒜', amount: '3瓣' },
      { name: '生姜', amount: '3片' }
    ]
  },
  {
    id: '2',
    name: '番茄牛腩',
    image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=800&q=80',
    duration: '60分钟',
    difficulty: '中等',
    servings: '3-4人',
    reason: '番茄酸香，适合全家分食',
    tags: ['家常', '下饭'],
    collected: true,
    category: 'home',
    basketIngredients: [
      { name: '番茄', amount: '4个' },
      { name: '牛腩', amount: '500g' },
      { name: '生姜', amount: '4片' },
      { name: '大蒜', amount: '2瓣' }
    ]
  },
  {
    id: '3',
    name: '菌菇豆腐汤',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    duration: '25分钟',
    difficulty: '简单',
    servings: '2-3人',
    reason: '口味干净，步骤轻松',
    tags: ['汤类', '轻负担'],
    collected: false,
    category: 'soup',
    basketIngredients: [
      { name: '豆腐', amount: '1盒' },
      { name: '菌菇', amount: '250g' },
      { name: '小葱', amount: '2根' }
    ]
  },
  {
    id: '4',
    name: '蒜蓉西兰花',
    image: 'https://images.unsplash.com/photo-1628773822503-930a7eaecf80?auto=format&fit=crop&w=800&q=80',
    duration: '10分钟',
    difficulty: '简单',
    servings: '2人',
    reason: '快手素菜，营养丰富',
    tags: ['快手', '减脂'],
    collected: false,
    category: 'diet',
    basketIngredients: [
      { name: '西兰花', amount: '1颗' },
      { name: '大蒜', amount: '3瓣' }
    ]
  },
  {
    id: '5',
    name: '红烧肉',
    image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=80',
    duration: '90分钟',
    difficulty: '中等',
    servings: '4-5人',
    reason: '经典家常，肥而不腻',
    tags: ['家常', '下饭'],
    collected: false,
    category: 'home',
    basketIngredients: [
      { name: '五花肉', amount: '500g' },
      { name: '冰糖', amount: '30g' },
      { name: '生姜', amount: '4片' }
    ]
  },
  {
    id: '6',
    name: '鸡蛋灌饼',
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80',
    duration: '20分钟',
    difficulty: '中等',
    servings: '1-2人',
    reason: '早餐经典，外酥里嫩',
    tags: ['早餐', '主食'],
    collected: false,
    category: 'breakfast',
    basketIngredients: [
      { name: '面粉', amount: '200g' },
      { name: '鸡蛋', amount: '2个' },
      { name: '生菜', amount: '2片' }
    ]
  }
]);

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

const toggleCollect = (recipeId: string) => {
  const recipe = recipes.value.find(r => r.id === recipeId);
  if (recipe) {
    recipe.collected = !recipe.collected;
    uni.showToast({
      title: recipe.collected ? '已收藏' : '取消收藏',
      icon: 'none'
    });
  }
};

const getRecipeBasketItemId = (recipe: Recipe, ingredient: BasketIngredient) => `${recipe.id}-${ingredient.name}`;

const isRecipeInBasket = (recipe: Recipe) => {
  return recipe.basketIngredients.every((ingredient) => basketItemIds.value.includes(getRecipeBasketItemId(recipe, ingredient)));
};

const toggleRecipeBasket = (recipe: Recipe) => {
  if (isRecipeInBasket(recipe)) {
    recipe.basketIngredients.forEach((ingredient) => {
      removeBasketItem(getRecipeBasketItemId(recipe, ingredient));
    });
    syncBasketState();
    uni.showToast({
      title: '已移出菜篮子',
      icon: 'none'
    });
    return;
  }

  recipe.basketIngredients
    .filter((ingredient) => !basketItemIds.value.includes(getRecipeBasketItemId(recipe, ingredient)))
    .forEach((ingredient) => {
      addBasketItem({
        id: getRecipeBasketItemId(recipe, ingredient),
        recipeId: recipe.id,
        recipeName: recipe.name,
        name: ingredient.name,
        amountText: ingredient.amount,
        purchaseText: getIngredientPurchaseText(ingredient.name),
        checked: false
      });
    });

  syncBasketState();
  uni.showToast({
    title: '已加入菜篮子',
    icon: 'success'
  });
};

const syncBasketState = () => {
  basketItemIds.value = loadBasketItems().map((item) => item.id);
};

const goToRecipeDetail = (recipeId: string) => {
  uni.navigateTo({
    url: `/pages/recipe-detail/index?id=${recipeId}`
  });
};

const handleSearch = () => {
  uni.showToast({
    title: '搜索功能开发中',
    icon: 'none'
  });
};

const loadMore = () => {
  uni.showToast({
    title: '加载更多',
    icon: 'none'
  });
};

onShow(() => {
  syncBasketState();
});

</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom, 0);
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
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.06);
}

.back-icon {
  color: var(--app-text);
  font-size: 38rpx;
  font-weight: 700;
}

.header-title {
  color: var(--app-text);
  font-size: 48rpx;
  font-weight: 600;
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.search-icon {
  font-size: 32rpx;
  opacity: 0.4;
}

.search-placeholder {
  color: var(--app-text-tertiary);
  font-size: 28rpx;
}

.content {
  padding: 0 30rpx 30rpx;
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
  border-radius: 999rpx;
  background: var(--app-accent);
  content: '';
}

.category-label {
  color: var(--app-text-secondary);
  font-size: 27rpx;
  font-weight: 700;
  white-space: nowrap;
}

.category-chip.active .category-label {
  color: var(--app-accent);
  font-weight: 950;
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
  font-size: 26rpx;
}

.filter-arrow {
  color: var(--app-text-tertiary);
  font-size: 20rpx;
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
  border-radius: 999rpx;
  background: #f4f6f8;
  color: var(--app-text-secondary);
  font-size: 24rpx;
  font-weight: 800;
}

.filter-option::after {
  border: 0;
}

.filter-option.is-active {
  background: var(--app-accent);
  color: #ffffff;
}

.recipes-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
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
  font-size: 30rpx;
  font-weight: 600;
}

.recipe-actions {
  flex-shrink: 0;
}

.action-icon {
  font-size: 36rpx;
}

.recipe-reason {
  color: var(--app-text-secondary);
  font-size: 24rpx;
  line-height: 1.5;
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
  font-size: 24rpx;
  opacity: 0.6;
}

.meta-text {
  color: var(--app-text-secondary);
  font-size: 22rpx;
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
  background: rgba(61, 122, 87, 0.12);
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
  font-size: 26rpx;
}

</style>
