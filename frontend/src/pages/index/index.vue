<template>
  <view class="app-page home-page">
    <view v-if="remoteBanners.length" class="banner-stage">
      <swiper
        class="banner-swiper"
        :indicator-dots="remoteBanners.length > 1"
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#fff"
        :autoplay="true"
        :interval="4000"
        :circular="remoteBanners.length > 1"
      >
        <swiper-item v-for="banner in remoteBanners" :key="banner.id">
          <image
            class="banner-image"
            :src="banner.image"
            mode="aspectFill"
            @click="goToBannerTarget(banner)"
          />
        </swiper-item>
      </swiper>
    </view>

    <view class="recommend-stage">
      <hero-recipe-card
        :recipes="currentHeroRecipes"
        @click="goToRecipeDetail"
        @more-click="goToRecipesPage"
      />
      <home-header
        :active-category-id="activeCategoryId"
        :categories="homeHeaderCategories"
        immersive
        :pinned="isHomeHeaderPinned"
        :pinned-progress="homeHeaderPinnedProgress"
        @search="handleSearch"
        @category-change="handleCategoryChange"
      />
    </view>

    <view
      v-if="isRecommendCategory && (homeLoading || homeError)"
      class="glass-card home-data-banner"
    >
      <text v-if="homeLoading" class="home-data-banner__text">正在加载首页数据...</text>
      <view v-else class="home-data-banner__row">
        <text class="home-data-banner__error">加载失败：{{ homeError }}</text>
        <nut-button size="small" type="primary" plain @click="loadHome">重试</nut-button>
      </view>
    </view>

    <section-block
      v-if="isRecommendCategory"
      title="时令食材"
      subtitle="这个月份，更值得优先放进厨房的食材"
      :show-action="false"
    >
      <scroll-view class="seasonal-scroll" scroll-x enable-flex>
        <view
          v-for="ingredient in seasonalIngredients"
          :key="ingredient.id"
          class="seasonal-card glass-card"
          @click="goToIngredientDetail(ingredient.id)"
        >
          <image class="seasonal-card__image" :src="ingredient.image" mode="aspectFill" />
          <view class="seasonal-card__body">
            <view class="seasonal-card__tags">
              <text
                v-for="tag in ingredient.tags"
                :key="tag"
                class="seasonal-card__tag"
              >
                {{ tag }}
              </text>
            </view>
            <text class="seasonal-card__title">{{ ingredient.name }}</text>
            <text class="seasonal-card__desc">{{ ingredient.description }}</text>
          </view>
        </view>
      </scroll-view>
    </section-block>

    <section-block
      v-if="isRecommendCategory"
      :title="currentMenuTitle"
      :subtitle="currentMenuSubtitle"
      action-text="更多菜谱"
      @action-click="goToRecipesPage"
    >
      <view class="recipe-list">
        <view
          v-for="recipe in currentRecipes"
          :key="recipe.id"
          class="recipe-card glass-card"
          @click="goToRecipeDetail(recipe.id)"
        >
          <image class="recipe-card__image" :src="recipe.image" mode="aspectFill" />
          <view class="recipe-card__body">
            <view class="recipe-card__header">
              <text class="recipe-card__title">{{ recipe.name }}</text>
              <nut-tag plain>{{ recipe.tag }}</nut-tag>
            </view>
            <view class="recipe-card__meta-row">
              <text class="recipe-card__meta">{{ recipe.duration }} · {{ recipe.difficulty }}</text>
              <text class="recipe-card__calories">{{ recipe.calories }}</text>
            </view>
            <text class="recipe-card__summary">{{ recipe.summary }}</text>
          </view>
        </view>
      </view>
    </section-block>

    <view v-else :class="['topic-recipe-list', `topic-recipe-list--${activeCategoryId}`]">
      <view
        v-for="recipe in currentRecipes"
        :key="recipe.id"
        :class="['topic-recipe-card', `topic-recipe-card--${activeCategoryId}`, 'glass-card']"
        @click="goToRecipeDetail(recipe.id)"
      >
        <image class="topic-recipe-card__image" :src="recipe.image" mode="aspectFill" />
        <view class="topic-recipe-card__body">
          <view class="topic-recipe-card__top">
            <text class="topic-recipe-card__title">{{ recipe.name }}</text>
            <text class="topic-recipe-card__tag">{{ recipe.tag }}</text>
          </view>
          <text class="topic-recipe-card__summary">{{ recipe.summary }}</text>
          <view class="topic-recipe-card__meta">
            <text>{{ recipe.duration }}</text>
            <text>{{ recipe.difficulty }}</text>
            <text>{{ recipe.calories }}</text>
          </view>
        </view>
      </view>
    </view>

    <section-block v-if="isRecommendCategory" title="快捷入口" subtitle="把高频动作留在更顺手的位置" action-text="管理">
      <view class="action-grid">
        <view
          v-for="action in quickActions"
          :key="action.id"
          class="action-card glass-card"
          @click="handleQuickAction(action.id)"
        >
          <text class="action-card__title">{{ action.title }}</text>
          <text class="action-card__badge">{{ action.badge }}</text>
          <text class="action-card__subtitle">{{ action.subtitle }}</text>
          <nut-button size="small" type="primary" plain>
            进入
          </nut-button>
        </view>
      </view>
    </section-block>

    <home-tab-bar :tabs="homeTabs" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onPageScroll } from '@dcloudio/uni-app';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import HomeHeader from '../../components/home/home-header.vue';
import HeroRecipeCard from '../../components/home/hero-recipe-card.vue';
import SectionBlock from '../../components/home/section-block.vue';
import { ingredientCatalog } from '../../constants/ingredients';
import {
  featuredRecipes,
  homeCategoryRecipes,
  homeTabs,
  quickActions
} from '../../constants/home';
import { getHome, getHomeTopNavContents, getHomeTopNavs } from '../../services/public-api';
import type { RecipeCard } from '../../types/home';
import type { Ingredient } from '../../types/ingredient';

const activeCategoryId = ref('recommend');
const isHomeHeaderPinned = ref(false);
const homeHeaderPinnedProgress = ref(0);
const currentMonth = new Date().getMonth() + 1;
const categoryMeta: Record<string, { title: string; subtitle: string }> = {
  recommend: {
    title: '家常菜单',
    subtitle: '做法清楚、节奏轻松，适合日常反复使用'
  },
  home: {
    title: '家常菜',
    subtitle: '适合一家人反复吃的稳定菜谱'
  },
  quick: {
    title: '快手菜',
    subtitle: '少步骤、短时间，适合工作日'
  },
  soup: {
    title: '汤类',
    subtitle: '一碗热汤，把餐桌补完整'
  },
  breakfast: {
    title: '早餐',
    subtitle: '早上不慌，吃得简单但认真'
  },
  light: {
    title: '减脂',
    subtitle: '轻负担、好执行，适合日常控制热量'
  }
};

const homeLoading = ref(false);
const homeError = ref<string | null>(null);
const remoteRecipes = ref<RecipeCard[] | null>(null);
const remoteSeasonalIngredients = ref<Ingredient[] | null>(null);
const remoteHomeCategories = ref<{ id: string; label: string }[]>([]);
const remoteBanners = ref<{ id: number; title: string; image: string; targetType: string; targetUrl: string | null; recipeId: number | null }[]>([]);
const remoteTopNavs = ref<{ id: string; label: string }[]>([]);
const remoteTopNavRecipes = ref<Record<string, RecipeCard[]>>({});
const remoteTopNavMeta = ref<Record<string, { label: string; moreButtonText?: string }>>({});

const currentRecipes = computed(() => {
  if (activeCategoryId.value === 'recommend' && remoteRecipes.value) return remoteRecipes.value;
  if (remoteTopNavRecipes.value[activeCategoryId.value]) return remoteTopNavRecipes.value[activeCategoryId.value];
  return homeCategoryRecipes[activeCategoryId.value] ?? featuredRecipes;
});
const currentHeroRecipes = computed(() => {
  const recipes = currentRecipes.value.length > 0 ? currentRecipes.value : featuredRecipes;
  return recipes.slice(0, 6);
});
const currentMenuTitle = computed(() => remoteTopNavMeta.value[activeCategoryId.value]?.label ?? categoryMeta[activeCategoryId.value]?.title ?? '家常菜单');
const currentMenuSubtitle = computed(() => (
  remoteTopNavMeta.value[activeCategoryId.value]
    ? '后台配置的首页顶部导航内容'
    : categoryMeta[activeCategoryId.value]?.subtitle ?? '做法清楚、节奏轻松，适合日常反复使用'
));
const seasonalIngredients = computed(() => {
  if (remoteSeasonalIngredients.value) return remoteSeasonalIngredients.value;
  const monthlyIngredients = ingredientCatalog.filter((ingredient) => ingredient.month === currentMonth);
  return monthlyIngredients.length > 0 ? monthlyIngredients : ingredientCatalog.slice(0, 8);
});
const isRecommendCategory = computed(() => activeCategoryId.value === 'recommend');
const homeHeaderCategories = computed(() => {
  if (remoteTopNavs.value.length > 0) return remoteTopNavs.value;
  return [{ id: 'recommend', label: '推荐' }, ...remoteHomeCategories.value];
});

const handleSearch = async (keyword: string) => {
  const message = keyword ? `搜索：${keyword}` : '请输入想找的食材或菜谱';
  uni.showToast({
    title: message,
    icon: 'none'
  });
};

const handleCategoryChange = (categoryId: string) => {
  activeCategoryId.value = categoryId;
  if (categoryId !== 'recommend' && remoteTopNavMeta.value[categoryId] && !remoteTopNavRecipes.value[categoryId]) {
    void loadTopNavContents(categoryId);
  }
};

const goToBannerTarget = (banner: { recipeId: number | null; targetUrl: string | null }) => {
  if (banner.recipeId) {
    uni.navigateTo({ url: `/pages/recipe-detail/index?id=${banner.recipeId}` });
  } else if (banner.targetUrl) {
    // External URL - show toast for now
    uni.showToast({ title: banner.targetUrl, icon: 'none' });
  }
};

const goToRecipesPage = () => {
  uni.navigateTo({ url: '/pages/recipes/index' });
};

const goToIngredientDetail = (id: string) => {
  uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${id}` });
};

const goToRecipeDetail = (id: string) => {
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${id}` });
};

const handleQuickAction = (actionId: string) => {
  if (actionId === 'basket') {
    uni.navigateTo({ url: '/pages/basket/index' });
    return;
  }
  if (actionId === 'browse') {
    uni.navigateTo({ url: '/pages/recipes/index' });
  }
};

onPageScroll((event) => {
  const progress = Math.min(Math.max(event.scrollTop / 460, 0), 1);
  homeHeaderPinnedProgress.value = Number(progress.toFixed(2));
  isHomeHeaderPinned.value = progress > 0.88;
});

const mapRecipeCard = (item: {
  id: number | string;
  title: string;
  cover: string | null;
  description: string | null;
  cookTime: number | null;
  difficulty: string | null;
}) => {
  return {
    id: String(item.id),
    name: item.title,
    duration: item.cookTime ? `${item.cookTime} 分钟` : '—',
    difficulty: item.difficulty ?? '—',
    calories: '',
    tag: '推荐',
    image:
      item.cover ??
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    summary: item.description ?? ''
  } satisfies RecipeCard;
};

const mapTopNavRecipeCard = (item: {
  id: string;
  title: string;
  coverUrl: string | null;
  duration: string | null;
  difficulty: string | null;
  calorie: string | null;
}) => {
  return {
    id: item.id,
    name: item.title,
    duration: item.duration ?? '—',
    difficulty: item.difficulty ?? '—',
    calories: item.calorie ?? '',
    tag: '导航内容',
    image:
      item.coverUrl ??
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    summary: ''
  } satisfies RecipeCard;
};

const mapIngredientCard = (item: { id: number; name: string; cover: string | null; seasonMonth: string | null }) => {
  const month = (() => {
    if (!item.seasonMonth) return undefined;
    const first = Number.parseInt(item.seasonMonth.split(',')[0]?.trim() ?? '', 10);
    return Number.isFinite(first) ? first : undefined;
  })();
  return {
    id: String(item.id),
    name: item.name,
    description: item.seasonMonth ? `时令：${item.seasonMonth}` : '时令食材',
    image:
      item.cover ??
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    tags: ['推荐'],
    category: 'recommend',
    month
  } satisfies Ingredient;
};

const loadHome = async () => {
  homeLoading.value = true;
  homeError.value = null;
  try {
    const [data, topNavs] = await Promise.all([getHome(), getHomeTopNavs()]);
    remoteRecipes.value = data.recommendRecipes.map(mapRecipeCard);
    remoteSeasonalIngredients.value = data.recommendIngredients.map(mapIngredientCard);
    remoteHomeCategories.value = data.recipeCategories.map((category) => ({ id: `category_${category.id}`, label: category.name }));
    remoteBanners.value = data.banners;
    remoteTopNavs.value = topNavs.map((item) => ({ id: item.isDefault ? 'recommend' : item.id, label: item.name }));
    remoteTopNavMeta.value = topNavs.reduce<Record<string, { label: string }>>((memo, item) => {
      memo[item.isDefault ? 'recommend' : item.id] = { label: item.name };
      return memo;
    }, {});
    const defaultNav = topNavs.find((item) => item.isDefault) ?? topNavs[0];
    if (defaultNav) activeCategoryId.value = defaultNav.isDefault ? 'recommend' : defaultNav.id;
    if (defaultNav) void loadTopNavContents(defaultNav.id, defaultNav.isDefault);
  } catch (err) {
    homeError.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    homeLoading.value = false;
  }
};

const loadTopNavContents = async (navId: string, isDefault = false) => {
  try {
    const data = await getHomeTopNavContents(navId, { page: 1, pageSize: 10 });
    const recipes = data.items.map(mapTopNavRecipeCard);
    const meta = { label: data.navName, moreButtonText: data.moreButtonText };
    const update: Record<string, RecipeCard[]> = { [navId]: recipes };
    const metaUpdate: Record<string, { label: string; moreButtonText?: string }> = { [navId]: meta };
    if (isDefault) {
      update.recommend = recipes;
      metaUpdate.recommend = meta;
    }
    remoteTopNavRecipes.value = { ...remoteTopNavRecipes.value, ...update };
    remoteTopNavMeta.value = { ...remoteTopNavMeta.value, ...metaUpdate };
  } catch (err) {
    uni.showToast({
      title: err instanceof Error ? err.message : '导航内容加载失败',
      icon: 'none'
    });
  }
};

void loadHome();
</script>

<style scoped lang="scss">
.home-page {
  position: relative;
  padding-top: 0;
}

.banner-stage {
  margin: 0 -32rpx;
}

.banner-swiper {
  height: 360rpx;
  border-radius: 0 0 48rpx 48rpx;
  overflow: hidden;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.recommend-stage {
  position: relative;
  margin: 0 -32rpx;
  padding: 0;
  background: transparent;
}

.seasonal-scroll {
  white-space: nowrap;
}

.seasonal-card {
  display: inline-flex;
  flex-direction: column;
  width: 260rpx;
  height: 408rpx;
  margin-right: 24rpx;
  overflow: hidden;
  vertical-align: top;
  white-space: normal;
}

.seasonal-card:last-child {
  margin-right: 0;
}

.seasonal-card__image {
  flex: 0 0 204rpx;
  width: 100%;
  height: 204rpx;
}

.seasonal-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 18rpx 20rpx 20rpx;
}

.seasonal-card__title {
  display: block;
}

.seasonal-card__tags {
  display: flex;
  flex: 0 0 36rpx;
  flex-wrap: nowrap;
  gap: 8rpx;
  overflow: hidden;
}

.seasonal-card__tag {
  display: inline-flex;
  align-items: center;
  padding: 5rpx 10rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent-soft);
  color: var(--app-accent-warm);
  font-size: 18rpx;
  line-height: 1;
}

.seasonal-card__title {
  margin-top: 12rpx;
  color: var(--app-text);
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seasonal-card__desc {
  display: -webkit-box;
  margin-top: 10rpx;
  overflow: hidden;
  color: var(--app-text-secondary);
  font-size: 22rpx;
  line-height: 1.42;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.recipe-card {
  overflow: hidden;
}

.recipe-card__image {
  width: 100%;
  height: 260rpx;
}

.recipe-card__body {
  padding: 22rpx 24rpx;
}

.recipe-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.recipe-card__title {
  color: var(--app-text);
  font-size: 32rpx;
  font-weight: 500;
  line-height: 48rpx;
}

.recipe-card__meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 12rpx;
}

.recipe-card__meta {
  color: var(--app-text-secondary);
  font-size: 22rpx;
}

.recipe-card__calories {
  flex: 0 0 auto;
  padding: 6rpx 12rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
  font-size: 20rpx;
}

.recipe-card__summary {
  display: block;
  margin-top: 12rpx;
  color: var(--app-text-secondary);
  font-size: 22rpx;
  line-height: 1.6;
}

.topic-recipe-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 20rpx;
}

.topic-recipe-list--quick {
  gap: 14rpx;
}

.topic-recipe-list--breakfast {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.topic-recipe-card {
  display: grid;
  grid-template-columns: 204rpx 1fr;
  gap: 20rpx;
  padding: 18rpx;
  border-radius: var(--app-radius-card);
  background: var(--app-surface-strong);
}

.topic-recipe-card--home {
  grid-template-columns: 230rpx 1fr;
  padding: 20rpx;
}

.topic-recipe-card--quick {
  grid-template-columns: 150rpx 1fr;
  min-height: 168rpx;
  padding: 14rpx;
  border-radius: 28rpx;
}

.topic-recipe-card--soup {
  display: block;
  overflow: hidden;
  padding: 0;
}

.topic-recipe-card--breakfast {
  display: block;
  overflow: hidden;
  padding: 0;
}

.topic-recipe-card--light {
  grid-template-columns: 176rpx 1fr;
  border: 1rpx solid rgba(122, 139, 111, 0.14);
}

.topic-recipe-card__image {
  width: 204rpx;
  height: 204rpx;
  border-radius: 26rpx;
}

.topic-recipe-card--home .topic-recipe-card__image {
  width: 230rpx;
  height: 190rpx;
}

.topic-recipe-card--quick .topic-recipe-card__image {
  width: 150rpx;
  height: 150rpx;
  border-radius: 22rpx;
}

.topic-recipe-card--soup .topic-recipe-card__image {
  width: 100%;
  height: 270rpx;
  border-radius: 0;
}

.topic-recipe-card--breakfast .topic-recipe-card__image {
  width: 100%;
  height: 190rpx;
  border-radius: 0;
}

.topic-recipe-card--light .topic-recipe-card__image {
  width: 176rpx;
  height: 176rpx;
  border-radius: 50%;
}

.topic-recipe-card__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 4rpx 0;
}

.topic-recipe-card--soup .topic-recipe-card__body,
.topic-recipe-card--breakfast .topic-recipe-card__body {
  padding: 20rpx;
}

.topic-recipe-card--quick .topic-recipe-card__body {
  padding: 2rpx 0;
}

.topic-recipe-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14rpx;
}

.topic-recipe-card__title {
  color: var(--app-text);
  font-size: 32rpx;
  font-weight: 500;
  line-height: 44rpx;
}

.topic-recipe-card--quick .topic-recipe-card__title,
.topic-recipe-card--breakfast .topic-recipe-card__title {
  font-size: 27rpx;
}

.topic-recipe-card__tag {
  flex: 0 0 auto;
  max-width: 132rpx;
  padding: 7rpx 12rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent-soft);
  color: var(--app-accent-warm);
  font-size: 19rpx;
  font-weight: 500;
}

.topic-recipe-card--home .topic-recipe-card__tag {
  background: var(--app-primary);
  color: #fffdfc;
}

.topic-recipe-card--soup .topic-recipe-card__tag {
  background: rgba(194, 123, 72, 0.14);
  color: var(--app-accent-warm);
}

.topic-recipe-card--light .topic-recipe-card__tag {
  background: rgba(122, 139, 111, 0.14);
  color: var(--app-primary);
}

.topic-recipe-card__summary {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 14rpx;
  color: var(--app-text-secondary);
  font-size: 22rpx;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.topic-recipe-card--quick .topic-recipe-card__summary,
.topic-recipe-card--breakfast .topic-recipe-card__summary {
  font-size: 20rpx;
}

.topic-recipe-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: auto;
  padding-top: 16rpx;
}

.topic-recipe-card__meta text {
  padding: 7rpx 12rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-bg);
  color: var(--app-text-secondary);
  font-size: 19rpx;
  font-weight: 500;
}

.topic-recipe-card--quick .topic-recipe-card__meta {
  padding-top: 12rpx;
}

.topic-recipe-card--breakfast .topic-recipe-card__meta text:nth-child(3) {
  display: none;
}

.topic-recipe-card--light .topic-recipe-card__meta text {
  background: rgba(122, 139, 111, 0.14);
  color: var(--app-primary);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 200rpx;
  padding: 24rpx;
}

.action-card__title {
  color: var(--app-text);
  font-size: 32rpx;
  font-weight: 500;
  line-height: 44rpx;
}

.action-card__badge {
  margin-top: 10rpx;
  padding: 8rpx 14rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
  font-size: 20rpx;
}

.action-card__subtitle {
  margin: 14rpx 0 24rpx;
  color: var(--app-text-secondary);
  font-size: 22rpx;
  line-height: 1.5;
}

.home-data-banner {
  margin: 0 32rpx 24rpx;
  padding: 20rpx 24rpx;
  border-radius: var(--app-radius-card);
}

.home-data-banner__text {
  color: var(--app-text-secondary);
  font-size: 24rpx;
}

.home-data-banner__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.home-data-banner__error {
  flex: 1;
  color: #dc2626;
  font-size: 24rpx;
  line-height: 1.4;
}
</style>
