<template>
  <view class="app-page home-page">
    <view class="recommend-stage">
      <hero-recipe-card
        :recipes="currentHeroRecipes"
        @click="goToRecipeDetail"
        @more-click="goToRecipesPage"
      />
      <home-header
        :active-category-id="activeCategoryId"
        immersive
        :pinned="isHomeHeaderPinned"
        :pinned-progress="homeHeaderPinnedProgress"
        @search="handleSearch"
        @category-change="handleCategoryChange"
      />
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

const currentRecipes = computed(() => homeCategoryRecipes[activeCategoryId.value] ?? featuredRecipes);
const currentHeroRecipes = computed(() => {
  const recipes = currentRecipes.value.length > 0 ? currentRecipes.value : featuredRecipes;
  return recipes.slice(0, 6);
});
const currentMenuTitle = computed(() => categoryMeta[activeCategoryId.value]?.title ?? '家常菜单');
const currentMenuSubtitle = computed(() => categoryMeta[activeCategoryId.value]?.subtitle ?? '做法清楚、节奏轻松，适合日常反复使用');
const seasonalIngredients = computed(() => {
  const monthlyIngredients = ingredientCatalog.filter((ingredient) => ingredient.month === currentMonth);
  return monthlyIngredients.length > 0 ? monthlyIngredients : ingredientCatalog.slice(0, 8);
});
const isRecommendCategory = computed(() => activeCategoryId.value === 'recommend');

const handleSearch = async (keyword: string) => {
  const message = keyword ? `搜索：${keyword}` : '请输入想找的食材或菜谱';
  uni.showToast({
    title: message,
    icon: 'none'
  });
};

const handleCategoryChange = (categoryId: string) => {
  activeCategoryId.value = categoryId;
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
</script>

<style scoped lang="scss">
.home-page {
  position: relative;
  padding-top: 0;
}

.recommend-stage {
  position: relative;
  margin: 0 -24rpx;
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
  margin-right: 20rpx;
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
  padding: 16rpx 18rpx 18rpx;
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
  border-radius: 999rpx;
  background: #f0f3f7;
  color: var(--app-text-tertiary);
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
  gap: 20rpx;
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
  font-size: 30rpx;
  font-weight: 600;
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
  border-radius: 999rpx;
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
  border-radius: 34rpx;
  background: #ffffff;
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
  border: 1rpx solid rgba(87, 132, 105, 0.12);
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
  font-size: 31rpx;
  font-weight: 950;
  line-height: 1.2;
}

.topic-recipe-card--quick .topic-recipe-card__title,
.topic-recipe-card--breakfast .topic-recipe-card__title {
  font-size: 27rpx;
}

.topic-recipe-card__tag {
  flex: 0 0 auto;
  max-width: 132rpx;
  padding: 7rpx 12rpx;
  border-radius: 999rpx;
  background: #f0f3f7;
  color: var(--app-text-secondary);
  font-size: 19rpx;
  font-weight: 850;
}

.topic-recipe-card--home .topic-recipe-card__tag {
  background: #111111;
  color: #ffffff;
}

.topic-recipe-card--soup .topic-recipe-card__tag {
  background: #fff2df;
  color: #8a5a20;
}

.topic-recipe-card--light .topic-recipe-card__tag {
  background: #eef7ef;
  color: #3f6b4c;
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
  border-radius: 999rpx;
  background: #f5f7fa;
  color: var(--app-text-secondary);
  font-size: 19rpx;
  font-weight: 800;
}

.topic-recipe-card--quick .topic-recipe-card__meta {
  padding-top: 12rpx;
}

.topic-recipe-card--breakfast .topic-recipe-card__meta text:nth-child(3) {
  display: none;
}

.topic-recipe-card--light .topic-recipe-card__meta text {
  background: #f0f7f2;
  color: #51705a;
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
  font-size: 30rpx;
  font-weight: 600;
}

.action-card__badge {
  margin-top: 10rpx;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
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
</style>
