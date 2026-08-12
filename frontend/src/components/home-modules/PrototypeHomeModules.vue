<template>
  <view class="prototype-modules">
    <view v-if="!visibleModules.length" class="prototype-empty">
      <app-icon name="image" size="28px" />
      <text class="prototype-empty__title">当前频道暂无完整内容</text>
      <text class="prototype-empty__description">内容图片补齐后会在这里展示，也可以先浏览分类。</text>
      <button class="prototype-empty__action" type="button" @tap="openCategory">去分类看看</button>
    </view>
    <section
      v-for="(module, moduleIndex) in visibleModules"
      :key="module.id"
      :class="['prototype-section', sectionClass(module)]"
    >
      <view v-if="module.showTitle !== false" class="prototype-section__heading">
        <text class="prototype-section__title">{{ moduleTitle(module, moduleIndex) }}</text>
        <button
          v-if="shouldShowMore(module)"
          class="prototype-section__more"
          type="button"
          @tap="openMore(module)"
        >
          <text>查看更多</text>
          <app-icon name="chevron-right" size="16px" />
        </button>
      </view>

      <scroll-view
        v-if="isSeasonal(module)"
        class="seasonal-rail"
        scroll-x
        enable-flex
        :show-scrollbar="false"
      >
        <view class="seasonal-rail__inner">
          <button
            v-for="item in module.items"
            :key="item.id"
            class="seasonal-item"
            type="button"
            @tap="openItem(item)"
          >
            <PrototypeMediaTile :item="item" class-name="seasonal-item__media" />
            <text class="seasonal-item__name">{{ itemName(item) }}</text>
          </button>
        </view>
      </scroll-view>

      <swiper
        v-else-if="isLargeImageCarousel(module)"
        class="large-image-carousel"
        :autoplay="module.items.length > 1"
        :circular="module.items.length > 1"
        :indicator-dots="module.items.length > 1"
        :interval="4200"
      >
        <swiper-item v-for="item in module.items" :key="item.id">
          <button class="large-image-carousel__item" type="button" @tap="openItem(item)">
            <PrototypeMediaTile :item="item" class-name="large-image-carousel__media" />
            <view v-if="itemName(item) || itemSummary(item)" class="large-image-carousel__copy">
              <text v-if="itemName(item)" class="large-image-carousel__title">{{ itemName(item) }}</text>
              <text v-if="itemSummary(item)" class="large-image-carousel__summary">
                {{ itemSummary(item) }}
              </text>
            </view>
          </button>
        </swiper-item>
      </swiper>

      <button
        v-else-if="isGuide(module)"
        class="knowledge-card"
        type="button"
        @tap="openItem(module.items[0])"
      >
        <PrototypeMediaTile :item="module.items[0]" class-name="knowledge-card__media" />
        <view class="knowledge-card__copy">
          <text class="knowledge-card__eyebrow">{{ guideLabel(module) }}</text>
          <text class="knowledge-card__title">{{ itemName(module.items[0]) }}</text>
          <text v-if="itemSummary(module.items[0])" class="knowledge-card__summary">
            {{ itemSummary(module.items[0]) }}
          </text>
        </view>
      </button>

      <view v-else-if="isRecipeGrid(module)" class="recipe-grid">
        <article
          v-for="item in module.items"
          :key="item.id"
          class="grid-card"
          role="button"
          tabindex="0"
          @tap="openItem(item)"
        >
          <PrototypeMediaTile :item="item" class-name="grid-card__media" />
          <view class="grid-card__copy">
            <text class="grid-card__title">{{ itemName(item) }}</text>
            <text class="grid-card__meta">{{ itemMeta(item) }}</text>
          </view>
        </article>
      </view>

      <view v-else-if="isCompactList(module)" class="compact-list">
        <article
          v-for="item in module.items"
          :key="item.id"
          class="compact-row"
          role="button"
          tabindex="0"
          @tap="openItem(item)"
        >
          <PrototypeMediaTile :item="item" class-name="compact-row__media" />
          <view class="compact-row__copy">
            <text class="compact-row__title">{{ itemName(item) }}</text>
            <text class="compact-row__meta">{{ itemMeta(item) }}</text>
          </view>
          <app-icon name="chevron-right" size="16px" />
        </article>
      </view>

      <scroll-view
        v-else
        class="recipe-rail"
        scroll-x
        enable-flex
        :show-scrollbar="false"
      >
        <view :class="['recipe-rail__inner', { 'is-drink': isDrinkModule(module) }]">
          <article
            v-for="item in module.items"
            :key="item.id"
            :class="['recipe-card', { 'is-drink': isDrinkModule(module) }]"
            role="button"
            tabindex="0"
            @tap="openItem(item)"
          >
            <view class="recipe-card__media">
              <PrototypeMediaTile :item="item" class-name="recipe-card__media-inner" />
              <button
                v-if="item.type === 'recipe'"
                class="recipe-card__favorite"
                type="button"
                aria-label="查看菜谱并收藏"
                @tap.stop="openItem(item)"
              >
                <app-icon name="bookmark" size="16px" />
              </button>
            </view>
            <view class="recipe-card__body">
              <text class="recipe-card__title">{{ itemName(item) }}</text>
              <text class="recipe-card__meta">{{ itemMeta(item) }}</text>
            </view>
          </article>
        </view>
      </scroll-view>
    </section>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '../app/app-icon.vue';
import PrototypeMediaTile from './PrototypeMediaTile.vue';
import type { HomeModule, HomeModuleItem } from '../../services/public-api';

const props = defineProps<{
  modules: HomeModule[];
}>();

const moduleLabels: Record<string, string> = {
  SEASONAL_PRODUCE: '时令果蔬', HOME_RECIPES: '家常精选', SELECTION_GUIDE: '挑选指南',
  LIGHT_MEAL: '清爽一餐', INGREDIENT_INSPIRATION: '食材灵感', DRINK_PAIRING: '饮品搭配',
  WEEKLY_HOT: '本周热门', TODAY_RECIPES: '今天吃什么', MEAL_OCCASIONS: '按一餐来选',
  MORE_HOME_RECIPES: '更多家常菜', SEASONAL_INGREDIENTS: '当季食材',
  INGREDIENT_SELECTION_GUIDE: '今天怎么挑', ONE_INGREDIENT_MANY_DISHES: '一材多吃',
  SEASONAL_FRUITS: '本月正当季', FRUIT_STORAGE_GUIDE: '怎么挑 · 怎么放',
  FRUIT_IN_RECIPES: '水果也能入菜', REFRESHING_DRINKS: '清爽饮品',
  MEAL_DRINK_PAIRING: '搭配这一餐', WINE_BASICS: '酒水基础', MIXOLOGY_ENTRY: '调饮配方'
};
const guideModuleKeys = new Set(['SELECTION_GUIDE', 'INGREDIENT_INSPIRATION', 'INGREDIENT_SELECTION_GUIDE', 'ONE_INGREDIENT_MANY_DISHES']);
const seasonalModuleKeys = new Set(['SEASONAL_PRODUCE', 'SEASONAL_INGREDIENTS', 'SEASONAL_FRUITS']);
const gridModuleKeys = new Set(['LIGHT_MEAL', 'MEAL_OCCASIONS', 'FRUIT_IN_RECIPES', 'WINE_BASICS']);
const compactModuleKeys = new Set(['WEEKLY_HOT', 'MORE_HOME_RECIPES', 'MEAL_DRINK_PAIRING']);
const drinkModuleKeys = new Set(['DRINK_PAIRING', 'REFRESHING_DRINKS', 'MEAL_DRINK_PAIRING', 'WINE_BASICS', 'MIXOLOGY_ENTRY']);
const itemLabel = (item?: HomeModuleItem) => (item?.name || item?.title || '').trim();
const supportsTextMediaFallback = (item?: HomeModuleItem) =>
  Boolean(item && ['ingredient', 'fruit', 'seasoning', 'category'].includes(item.type));
const isRenderableItem = (module: HomeModule, item?: HomeModuleItem) => {
  if (item && item.type === 'image' && item.cover?.trim()) {
    return module.displayStyle === 'LARGE_IMAGE_CAROUSEL';
  }
  return Boolean(
    item?.id &&
    itemLabel(item) &&
    !/^\d+$/.test(itemLabel(item)) &&
    (item.cover?.trim() || supportsTextMediaFallback(item))
  );
};

const expectedItemType = (module: HomeModule): HomeModuleItem['type'] | null => {
  if (module.displayStyle === 'LARGE_IMAGE_CAROUSEL') return 'image';
  if (module.contentSource === 'CATEGORY_GROUP') return 'category';
  if (module.moduleKey === 'SEASONAL_PRODUCE') return null;
  const contentType = module.contentType?.toUpperCase();
  const title = module.title || '';

  if (contentType === 'FRUIT') return 'fruit';
  if (contentType === 'SEASONING') return 'seasoning';
  if (
    module.displayStyle === 'SEASONAL_INGREDIENT_CARD' ||
    contentType === 'INGREDIENT' ||
    contentType === 'GUIDE' ||
    /时令|果蔬|食材|挑选|指南/.test(title)
  ) {
    return 'ingredient';
  }
  if (contentType === 'BEVERAGE' || /饮品|酒水/.test(title)) {
    return 'beverage';
  }
  if (
    contentType === 'RECIPE' ||
    module.displayStyle === 'TWO_COLUMN_RECIPE_GRID' ||
    module.displayStyle === 'FOUR_CARD_GRID' ||
    /菜谱|家常|一餐|今晚|热门/.test(title)
  ) {
    return 'recipe';
  }
  return null;
};

const isItemCompatibleWithModule = (module: HomeModule, item: HomeModuleItem) => {
  const expectedType = expectedItemType(module);
  return !expectedType || item.type === expectedType;
};

const sanitizedModules = computed(() =>
  props.modules
    .map((module) => ({
      ...module,
      items: module.items.filter(
        (item) => isRenderableItem(module, item) && isItemCompatibleWithModule(module, item)
      )
    }))
    .filter((module) => module.items.length)
);
const visibleModules = computed(() =>
  sanitizedModules.value
    .filter((module) => module.status === 'ENABLED' && module.items.length)
    .sort((left, right) => left.sortOrder - right.sortOrder)
);

const itemName = (item?: HomeModuleItem) => itemLabel(item);
const itemSummary = (item?: HomeModuleItem) => item?.description || item?.subtitle || '';

const openCategory = () => {
  uni.switchTab({ url: '/pages/ingredients/index' });
};

const isSeasonal = (module: HomeModule) =>
  Boolean(module.moduleKey && seasonalModuleKeys.has(module.moduleKey)) ||
  module.displayStyle === 'SEASONAL_INGREDIENT_CARD';
const shouldShowMore = (module: HomeModule) => module.showMore || isSeasonal(module);
const isLargeImageCarousel = (module: HomeModule) =>
  module.displayStyle === 'LARGE_IMAGE_CAROUSEL';
const isGuide = (module: HomeModule) =>
  Boolean(module.moduleKey && guideModuleKeys.has(module.moduleKey)) ||
  module.contentType === 'GUIDE' ||
  /挑选|指南|灵感/.test(module.title);
const isRecipeGrid = (module: HomeModule) =>
  Boolean(module.moduleKey && gridModuleKeys.has(module.moduleKey)) ||
  module.displayStyle === 'TWO_COLUMN_RECIPE_GRID' ||
  module.displayStyle === 'FOUR_CARD_GRID';
const isCompactList = (module: HomeModule) =>
  Boolean(module.moduleKey && compactModuleKeys.has(module.moduleKey)) ||
  /热门/.test(module.title) ||
  (module.displayStyle === 'IMAGE_TEXT_LIST' && !isGuide(module));
const isDrinkModule = (module: HomeModule) =>
  Boolean(module.moduleKey && drinkModuleKeys.has(module.moduleKey)) ||
  module.contentType === 'BEVERAGE' || /饮品|酒水/.test(module.title);
const invalidTitle = (title?: string | null) => !title || /^\s*\d+\s*$/.test(title);

const moduleTitle = (module: HomeModule, index: number) => {
  if (module.moduleKey && moduleLabels[module.moduleKey]) return moduleLabels[module.moduleKey];
  if (!invalidTitle(module.title)) return module.title;
  if (isSeasonal(module)) return '时令果蔬';
  if (isGuide(module)) return '挑选指南';
  if (isDrinkModule(module)) return '饮品搭配';
  if (isRecipeGrid(module)) return '清爽一餐';
  if (isCompactList(module)) return '本周热门';
  return index === 0 ? '今日推荐' : '家常精选';
};

const sectionClass = (module: HomeModule) => ({
  'prototype-section--seasonal': isSeasonal(module),
  'prototype-section--knowledge': isGuide(module),
  'prototype-section--grid': isRecipeGrid(module),
  'prototype-section--compact': isCompactList(module)
});

const guideLabel = (module: HomeModule) =>
  module.moduleKey === 'INGREDIENT_INSPIRATION' || module.moduleKey === 'ONE_INGREDIENT_MANY_DISHES'
    ? '当季食材'
    : '挑选指南';

const itemMeta = (item: HomeModuleItem) => {
  const values = [item.duration, item.difficulty].filter(Boolean);
  return values.length ? values.join(' · ') : item.subtitle || item.description || '查看详情';
};

const inferRoute = (item: HomeModuleItem) => {
  if (item.jumpTarget?.startsWith('/pages/')) {
    if (item.jumpTarget.includes('-detail/index')) {
      return `${item.jumpTarget}${item.jumpTarget.includes('?') ? '&' : '?'}from=home`;
    }
    return item.jumpTarget;
  }
  if (item.type === 'recipe') return `/pages/recipe-detail/index?id=${item.id}&from=home`;
  if (item.type === 'ingredient') return `/pages/ingredient-detail/index?id=${item.id}&from=home`;
  if (item.type === 'fruit') return `/pages/fruit-detail/index?id=${item.id}&from=home`;
  if (item.type === 'seasoning') return `/pages/seasoning-detail/index?id=${item.id}&from=home`;
  if (item.type === 'beverage') return `/pages/beverage-detail/index?id=${item.id}&from=home`;
  if (item.type === 'category') return `/pages/ingredients/index?categoryId=${item.id}`;
  return '/pages/ingredients/index';
};

const openItem = (item?: HomeModuleItem) => {
  if (item) uni.navigateTo({ url: inferRoute(item) });
};

const openMore = (module: HomeModule) => {
  if (module.moreLink?.startsWith('/pages/')) {
    uni.navigateTo({ url: module.moreLink });
    return;
  }
  const routes: Record<string, string> = {
    recipe: '/pages/recipes/index',
    ingredient: '/pages/ingredients/index',
    fruit: '/pages/ingredients/index?type=fruit',
    seasoning: '/pages/ingredients/index?type=seasoning',
    beverage: '/pages/ingredients/index?type=beverage'
  };
  uni.navigateTo({ url: routes[module.items[0]?.type] || '/pages/ingredients/index' });
};
</script>

<style scoped lang="scss">
.prototype-modules {
  display: flex;
  flex-direction: column;
}

.prototype-empty {
  display: flex;
  min-height: 240px;
  padding: 36px 28px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--text-tertiary);
  text-align: center;
}

.prototype-empty__title {
  margin-top: 14px;
  color: var(--text-primary);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
}

.prototype-empty__description {
  max-width: 280px;
  margin-top: 6px;
  font-size: var(--font-size-body);
  line-height: var(--line-body);
}

.prototype-empty__action {
  display: inline-flex;
  min-height: 44px;
  margin-top: 18px;
  padding: 0 18px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 22px;
  background: transparent;
  color: var(--text-brand);
  font-size: var(--font-size-body);
  font-weight: var(--font-medium);
  line-height: var(--line-body);
}

.prototype-empty__action::after {
  border: 0;
}

.prototype-section {
  padding: 28px 0 0;
}

.prototype-section--seasonal {
  background: transparent;
}

.prototype-section__heading {
  display: flex;
  min-height: 44px;
  margin-bottom: 18px;
  padding: 0 20px;
  align-items: center;
  justify-content: space-between;
}

.prototype-section__title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.prototype-section__more {
  display: inline-flex;
  min-height: 44px;
  margin: 0;
  padding: 0;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.prototype-section__more::after,
.seasonal-item::after,
.recipe-card__favorite::after,
.knowledge-card::after,
.large-image-carousel__item::after {
  border: 0;
}

.large-image-carousel {
  width: calc(100% - 40px);
  height: 210px;
  margin: 0 20px 18px;
  overflow: hidden;
  border-radius: 14px;
  background: var(--app-muted);
}

.large-image-carousel__item {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 14px;
  background: var(--app-muted);
  text-align: left;
}

.large-image-carousel__media {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.large-image-carousel__copy {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  padding: 42px 16px 14px;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(47, 47, 47, 0), rgba(47, 47, 47, 0.62));
  color: var(--app-surface-strong);
}

.large-image-carousel__title {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
}

.large-image-carousel__summary {
  margin-top: 2px;
  overflow: hidden;
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seasonal-rail,
.recipe-rail {
  width: 100%;
  white-space: nowrap;
}

.seasonal-rail__inner,
.recipe-rail__inner {
  display: inline-flex;
  padding: 0 20px 18px;
}

.seasonal-rail__inner {
  padding: 0 20px 2px;
  gap: 12px;
}

.seasonal-item {
  display: inline-flex;
  width: 68px;
  margin: 0;
  padding: 0;
  flex: 0 0 68px;
  flex-direction: column;
  align-items: center;
  border: 0;
  background: transparent;
}

.seasonal-item__media {
  display: flex;
  width: 68px;
  height: 68px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9px;
  background: var(--app-muted);
}

.seasonal-item__name {
  display: block;
  width: 100%;
  margin-top: 6px;
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-rail__inner {
  gap: 12px;
}

.recipe-card {
  display: inline-flex;
  width: calc((100vw - 64px) / 2.2);
  max-width: 166px;
  margin: 0;
  padding: 0;
  flex: 0 0 calc((100vw - 64px) / 2.2);
  flex-direction: column;
  overflow: hidden;
  border: 0;
  border-radius: 12px;
  background: var(--app-surface-strong);
  text-align: left;
  white-space: normal;
}

.recipe-card.is-drink {
  width: 112px;
  flex-basis: 112px;
}

.recipe-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.recipe-card__media-inner {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--app-muted);
}

.grid-card__media,
.compact-row__media {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--app-muted);
}

:deep(.prototype-media-image) {
  display: block;
  width: 100%;
  height: 100%;
}

:deep(.prototype-media-fallback) {
  color: var(--text-brand);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
}

.recipe-card__favorite {
  position: absolute;
  top: 7px;
  right: 7px;
  display: flex;
  width: 30px;
  height: 30px;
  margin: 0;
  padding: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9px;
  background: rgba(255, 253, 252, 0.92);
  color: var(--text-brand);
}

.recipe-card__body {
  display: flex;
  min-height: 58px;
  padding: 8px 9px 10px;
  flex-direction: column;
}

.recipe-card__title,
.grid-card__title,
.compact-row__title {
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  line-height: var(--line-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-card__meta,
.grid-card__meta,
.compact-row__meta {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-regular);
  line-height: var(--line-tag);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prototype-section--knowledge {
  padding-right: 20px;
  padding-left: 20px;
}

.prototype-section--knowledge .prototype-section__heading {
  padding-right: 0;
  padding-left: 0;
}

.knowledge-card {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 128px;
  margin: 0;
  padding: 0;
  grid-template-columns: 128px minmax(0, 1fr);
  overflow: hidden;
  border: 0;
  border-radius: 14px;
  background: var(--app-surface-strong);
  text-align: left;
}

.knowledge-card__media {
  display: flex;
  width: 128px;
  height: 128px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 14px 0 0 14px;
  background: var(--app-muted);
}

.knowledge-card__copy {
  position: relative;
  display: flex;
  min-width: 0;
  padding: 36px 14px 14px 16px;
  flex-direction: column;
}

.knowledge-card__eyebrow {
  position: absolute;
  top: 11px;
  right: 11px;
  padding: 2px 7px;
  border-radius: 8px;
  background: rgba(122, 139, 111, 0.1);
  color: var(--text-brand);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
  line-height: var(--line-tabbar);
}

.knowledge-card__title {
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.knowledge-card__summary {
  margin-top: 3px;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-grid {
  display: grid;
  padding: 0 20px 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.grid-card {
  min-width: 0;
  overflow: hidden;
  border-radius: 12px;
  background: var(--app-surface-strong);
}

.grid-card__media {
  aspect-ratio: 1;
}

.grid-card__copy {
  padding: 8px 10px 10px;
}

.compact-list {
  margin: 0 20px 18px;
  overflow: hidden;
  border-radius: 14px;
  background: var(--app-surface-strong);
}

.compact-row {
  display: grid;
  min-height: 76px;
  padding: 10px 12px;
  grid-template-columns: 56px minmax(0, 1fr) 20px;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--app-border);
}

.compact-row:last-child {
  border-bottom: 0;
}

.compact-row__media {
  width: 56px;
  height: 56px;
  border-radius: 10px;
}

.compact-row__copy {
  min-width: 0;
}

@media (min-width: 430px) {
  .recipe-card {
    width: 166px;
    flex-basis: 166px;
  }

  .recipe-card.is-drink {
    width: 112px;
    flex-basis: 112px;
  }
}
</style>
