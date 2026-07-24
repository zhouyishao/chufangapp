<template>
  <view class="prototype-modules">
    <section
      v-for="module in visibleModules"
      :key="module.id"
      :class="['prototype-section', sectionClass(module)]"
    >
      <view v-if="module.showTitle !== false && module.title" class="prototype-section__heading">
        <text class="prototype-section__title">{{ module.title }}</text>
        <button
          v-if="module.showMore"
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
            <view class="seasonal-item__media">
              <image
                v-if="hasUsableCover(item)"
                class="seasonal-item__image"
                :src="item.cover || ''"
                mode="aspectFill"
                lazy-load
                @error="markImageFailed(item)"
              />
              <text v-else class="seasonal-item__fallback">{{ itemInitial(item) }}</text>
            </view>
            <text class="seasonal-item__name">{{ item.name || item.title }}</text>
          </button>
        </view>
      </scroll-view>

      <button
        v-else-if="isGuide(module)"
        class="knowledge-card"
        type="button"
        @tap="openItem(module.items[0])"
      >
        <view class="knowledge-card__media">
          <image
            v-if="hasUsableCover(module.items[0])"
            class="knowledge-card__image"
            :src="module.items[0]?.cover || ''"
            mode="aspectFill"
            lazy-load
            @error="markImageFailed(module.items[0])"
          />
          <text v-else class="knowledge-card__fallback">{{ itemInitial(module.items[0]) }}</text>
        </view>
        <view class="knowledge-card__copy">
          <text class="knowledge-card__eyebrow">{{ guideLabel(module) }}</text>
          <text class="knowledge-card__title">{{ module.items[0]?.name || module.items[0]?.title }}</text>
          <text v-if="module.items[0]?.description" class="knowledge-card__summary">
            {{ module.items[0]?.description }}
          </text>
        </view>
      </button>

      <scroll-view
        v-else
        class="recipe-rail"
        scroll-x
        enable-flex
        :show-scrollbar="false"
      >
        <view class="recipe-rail__inner">
          <view
            v-for="item in module.items"
            :key="item.id"
            class="recipe-card"
            role="button"
            tabindex="0"
            @tap="openItem(item)"
          >
            <view class="recipe-card__media">
              <image
                v-if="hasUsableCover(item)"
                class="recipe-card__image"
                :src="item.cover || ''"
                mode="aspectFill"
                lazy-load
                @error="markImageFailed(item)"
              />
              <text v-else class="recipe-card__fallback">{{ itemInitial(item) }}</text>
              <button
                v-if="item.type === 'recipe'"
                class="recipe-card__favorite"
                type="button"
                aria-label="查看菜谱并收藏"
                @tap.stop="openItem(item)"
              >
                <app-icon name="bookmark" size="18px" />
              </button>
            </view>
            <view class="recipe-card__body">
              <text class="recipe-card__title">{{ item.title || item.name }}</text>
              <text class="recipe-card__meta">{{ itemMeta(item) }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </section>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import AppIcon from '../app/app-icon.vue';
import type { HomeModule, HomeModuleItem } from '../../services/public-api';

const props = defineProps<{
  modules: HomeModule[];
}>();

const failedImageIds = reactive(new Set<string>());

const visibleModules = computed(() =>
  props.modules
    .filter((module) => module.status === 'ENABLED' && module.items.length)
    .sort((left, right) => left.sortOrder - right.sortOrder)
);

const isSeasonal = (module: HomeModule) => module.displayStyle === 'SEASONAL_INGREDIENT_CARD';
const isGuide = (module: HomeModule) =>
  module.displayStyle === 'IMAGE_TEXT_LIST' || module.contentType === 'GUIDE';

const sectionClass = (module: HomeModule) => ({
  'prototype-section--seasonal': isSeasonal(module),
  'prototype-section--knowledge': isGuide(module)
});

const guideLabel = (module: HomeModule) =>
  module.title.includes('挑') ? '挑选指南' : module.title.includes('食材') ? '当季食材' : module.title;

const hasUsableCover = (item?: HomeModuleItem) =>
  Boolean(item?.cover && !failedImageIds.has(item.id));

const markImageFailed = (item?: HomeModuleItem) => {
  if (item) failedImageIds.add(item.id);
};

const itemInitial = (item?: HomeModuleItem) =>
  (item?.name || item?.title || '图').trim().slice(0, 1);

const itemMeta = (item: HomeModuleItem) => {
  const values = [item.duration, item.difficulty].filter(Boolean);
  return values.length ? values.join(' · ') : item.subtitle || item.description || '查看详情';
};

const inferRoute = (item: HomeModuleItem) => {
  if (item.jumpTarget?.startsWith('/pages/')) return item.jumpTarget;
  if (item.type === 'recipe') return `/pages/recipe-detail/index?id=${item.id}`;
  if (item.type === 'ingredient') return `/pages/ingredient-detail/index?id=${item.id}`;
  if (item.type === 'beverage') return `/pages/beverage-detail/index?id=${item.id}`;
  return '/pages/ingredients/index';
};

const openItem = (item?: HomeModuleItem) => {
  if (!item) return;
  uni.navigateTo({ url: inferRoute(item) });
};

const openMore = (module: HomeModule) => {
  if (module.moreLink?.startsWith('/pages/')) {
    uni.navigateTo({ url: module.moreLink });
    return;
  }
  const firstType = module.items[0]?.type;
  const routes: Record<string, string> = {
    recipe: '/pages/recipes/index',
    ingredient: '/pages/ingredients/index',
    beverage: '/pages/ingredients/index?type=beverage'
  };
  uni.navigateTo({ url: routes[firstType] || '/pages/ingredients/index' });
};
</script>

<style scoped lang="scss">
.prototype-modules {
  display: flex;
  flex-direction: column;
}

.prototype-section {
  padding: 28px 0 4px;
}

.prototype-section--seasonal {
  padding-top: 26px;
  background: var(--app-surface-strong);
}

.prototype-section__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 20px 14px;
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
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.prototype-section__more::after,
.seasonal-item::after,
.recipe-card::after,
.recipe-card__favorite::after,
.knowledge-card::after {
  border: 0;
}

.seasonal-rail,
.recipe-rail {
  width: 100%;
  white-space: nowrap;
}

.seasonal-rail__inner,
.recipe-rail__inner {
  display: inline-flex;
  padding: 0 20px 24px;
}

.seasonal-rail__inner {
  gap: 12px;
}

.seasonal-item {
  display: inline-flex;
  width: 68px;
  min-height: 98px;
  margin: 0;
  padding: 0;
  flex: 0 0 68px;
  flex-direction: column;
  align-items: center;
  border: 0;
  background: transparent;
}

.seasonal-item__image {
  width: 100%;
  height: 100%;
}

.seasonal-item__media {
  display: flex;
  width: 68px;
  height: 68px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 14px;
  background: var(--app-muted);
}

.seasonal-item__fallback,
.recipe-card__fallback,
.knowledge-card__fallback {
  color: var(--text-brand);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
}

.seasonal-item__name {
  display: block;
  width: 100%;
  margin-top: 7px;
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-rail__inner {
  gap: 12px;
}

.recipe-card {
  display: inline-flex;
  width: calc((100vw - 64px) / 2.5);
  min-width: 128px;
  max-width: 142px;
  margin: 0;
  padding: 0;
  flex: 0 0 calc((100vw - 64px) / 2.5);
  flex-direction: column;
  overflow: hidden;
  border: 0;
  border-radius: 14px;
  background: var(--app-surface-strong);
  text-align: left;
  white-space: normal;
}

.recipe-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.recipe-card__image {
  width: 100%;
  height: 100%;
  background: var(--app-muted);
}

.recipe-card__fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-muted);
}

.recipe-card__favorite {
  position: absolute;
  top: 9px;
  right: 9px;
  display: flex;
  width: 40px;
  height: 40px;
  margin: 0;
  padding: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 253, 252, 0.9);
  color: var(--text-brand);
}

.recipe-card__body {
  display: flex;
  min-height: 72px;
  padding: 10px 11px 12px;
  flex-direction: column;
  justify-content: center;
}

.recipe-card__title {
  display: block;
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-card__meta {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-regular);
  line-height: var(--line-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prototype-section--knowledge {
  padding: 26px 20px 0;
}

.prototype-section--knowledge .prototype-section__heading {
  padding-right: 0;
  padding-left: 0;
}

.knowledge-card {
  display: grid;
  width: 100%;
  min-height: 128px;
  margin: 0;
  padding: 0;
  grid-template-columns: 128px minmax(0, 1fr);
  overflow: hidden;
  border: 0;
  border-radius: 16px;
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
  background: var(--app-muted);
}

.knowledge-card__image {
  width: 100%;
  height: 100%;
}

.knowledge-card__copy {
  display: flex;
  min-width: 0;
  padding: 20px 18px;
  flex-direction: column;
  justify-content: flex-start;
}

.knowledge-card__eyebrow {
  align-self: flex-end;
  margin-bottom: 10px;
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  line-height: var(--line-tag);
}

.knowledge-card__title {
  color: var(--text-primary);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.knowledge-card__summary {
  display: -webkit-box;
  margin-top: 4px;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (min-width: 430px) {
  .recipe-card {
    width: 142px;
    flex-basis: 142px;
  }
}
</style>
