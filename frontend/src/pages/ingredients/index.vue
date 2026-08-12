<template>
  <view class="app-page category-page category-prototype">
    <header class="category-header">
      <button
        class="category-search"
        type="button"
        aria-label="搜索菜谱、食材、水果、饮品和调料"
        @tap="handleSearchTap"
      >
        <app-icon name="search" size="20px" />
        <text>{{ searchPlaceholder }}</text>
      </button>

      <nav v-if="primaryNavItems.length" class="category-primary-nav" aria-label="内容大分类">
        <button
          v-for="item in primaryNavItems"
          :key="item.id"
          :class="['category-primary-nav__item', { 'is-active': isPrimaryActive(item) }]"
          type="button"
          role="tab"
          :aria-selected="isPrimaryActive(item)"
          @tap="handleTopNavTap(item)"
        >
          {{ primaryLabel(item) }}
        </button>
      </nav>
    </header>

    <app-page-state v-if="loading" kind="loading" title="正在加载分类内容" />
    <app-page-state
      v-else-if="error"
      kind="error"
      title="分类内容加载失败"
      :description="error"
      action-text="重新加载"
      @action="fetchModules"
    />

    <main v-else class="category-workspace">
      <aside class="category-secondary-rail" aria-label="二级分类">
        <button
          v-for="item in secondaryItems"
          :key="item.key"
          :class="['category-secondary-rail__item', { 'is-active': item.key === activeFilterKey }]"
          type="button"
          :aria-pressed="item.key === activeFilterKey"
          @tap="handleFilterTap(item)"
        >
          {{ item.name }}
        </button>
      </aside>

      <section class="category-content-pane">
        <view class="category-content-pane__summary">
          <text>{{ activeSecondaryLabel }}</text>
          <text>{{ contentItems.length }}项</text>
        </view>

        <view v-if="contentItems.length" :class="['category-result-list', { 'is-recipe': isRecipeType }]">
          <article
            v-for="item in contentItems"
            :key="itemKey(item)"
            :class="['category-content-card', { 'category-content-card--recipe': isRecipeType }]"
            role="button"
            tabindex="0"
            @tap="openItem(item)"
          >
            <view class="category-content-card__media">
              <image
                v-if="hasUsableCover(item)"
                class="category-content-card__image"
                :src="itemCover(item)"
                mode="aspectFill"
                lazy-load
                @error="markImageFailed(item)"
              />
              <text v-else class="category-content-card__fallback">{{ itemInitial(item) }}</text>
            </view>

            <view class="category-content-card__body">
              <view class="category-content-card__heading">
                <text class="category-content-card__name">{{ itemTitle(item) }}</text>
                <text v-if="!isRecipeType && itemSeason(item)" class="category-content-card__season">
                  {{ itemSeason(item) }}
                </text>
              </view>

              <text v-if="isRecipeType && itemDescription(item)" class="category-content-card__description">
                {{ itemDescription(item) }}
              </text>

              <view class="category-content-card__footer">
                <text class="category-content-card__meta">{{ itemMeta(item) }}</text>
                <button
                  v-if="canAddToBasket(item)"
                  class="category-basket-button"
                  :class="{ 'is-added': basketAddedIds.has(itemKey(item)) }"
                  type="button"
                  :aria-label="basketAddedIds.has(itemKey(item)) ? `已加入菜篮：${itemTitle(item)}` : `加入菜篮：${itemTitle(item)}`"
                  :aria-pressed="basketAddedIds.has(itemKey(item))"
                  @tap.stop="addItemToBasket(item)"
                >
                  <app-icon name="basket-action" size="19px" :filled="basketAddedIds.has(itemKey(item))" />
                </button>
              </view>
            </view>
          </article>
        </view>

        <app-page-state
          v-else
          kind="empty"
          title="暂无当前分类内容"
          description="这个分类暂时还没有内容，试试其他分类。"
        />
      </section>
    </main>

    <home-tab-bar :tabs="bottomTabs" />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import AppPageState from '../../components/app/app-page-state.vue';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import { addBasketItem, getIngredientBasketItemId } from '../../services/basket';
import {
  getPageModules,
  type PageModule,
  type PageModuleCategoryFilterItem,
  type PageModuleTopNavItem
} from '../../services/public-api';
import type { HomeTab } from '../../types/home';

type TopNavData = { activeKey: string; items: PageModuleTopNavItem[] };
type FilterData = { activeKey: string; items: PageModuleCategoryFilterItem[] };
type ContentModuleData = {
  id: number;
  title: string;
  displayStyle: string;
  contentType: string;
  categoryId: number | null;
  sortOrder: number;
  status?: string;
  items: CategoryItem[];
};
type CategoryItem = Record<string, unknown> & {
  id?: string | number;
  type?: string | null;
  title?: string | null;
  name?: string | null;
  cover?: string | null;
  subtitle?: string | null;
  description?: string | null;
  duration?: string | null;
  difficulty?: string | null;
  seasonMonth?: string | null;
  currentPrice?: number | null;
  priceUnit?: string | null;
};

const modules = ref<PageModule[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const currentType = ref('recipe');
const currentFilter = ref('recommend');
const currentCategoryId = ref<number | undefined>();
const failedImageIds = reactive(new Set<string>());
const basketAddedIds = reactive(new Set<string>());
let requestSequence = 0;

const bottomTabs: HomeTab[] = [
  { id: 'home', label: '首页', active: false },
  { id: 'categories', label: '分类', active: true },
  { id: 'basket', label: '菜篮', active: false },
  { id: 'mine', label: '我的', active: false }
];

const extractTopNavItems = (mods: PageModule[]) =>
  (mods.find((item) => item.moduleType === 'top_nav')?.data as TopNavData | undefined)?.items ?? [];

const extractFilterItems = (mods: PageModule[]) =>
  (mods.find((item) => item.moduleType === 'category_filter')?.data as FilterData | undefined)?.items ?? [];

const extractContentModules = (mods: PageModule[]) =>
  ((mods.find((item) => item.moduleType === 'content_module')?.data as unknown as ContentModuleData[]) ?? []);

const primaryOrder = ['菜谱', '食材', '水果', '饮品', '调料'];
const normalizedPrimaryType = (item: PageModuleTopNavItem) =>
  String(item.contentType ?? item.code ?? item.name).toLowerCase();
const primaryLabel = (item: PageModuleTopNavItem) => {
  const type = normalizedPrimaryType(item);
  if (type.includes('recipe') || item.name.includes('菜谱')) return '菜谱';
  if (type.includes('fruit') || item.name.includes('水果')) return '水果';
  if (type.includes('beverage') || type.includes('drink') || /饮品|酒水/.test(item.name)) return '饮品';
  if (type.includes('season') || item.name.includes('调料')) return '调料';
  return '食材';
};
const primaryNavItems = computed(() =>
  [...extractTopNavItems(modules.value)]
    .sort((left, right) =>
      primaryOrder.indexOf(primaryLabel(left)) - primaryOrder.indexOf(primaryLabel(right))
    )
    .slice(0, 5)
);
const secondaryItems = computed(() => extractFilterItems(modules.value));
const activeFilterKey = computed(() => currentFilter.value);
const activeSecondaryLabel = computed(
  () => secondaryItems.value.find((item) => item.key === activeFilterKey.value)?.name ?? '全部'
);
const searchPlaceholder = computed(() => {
  const config = modules.value.find((item) => item.moduleType === 'search_bar')?.config;
  return typeof config?.placeholder === 'string'
    ? config.placeholder.replace('酒水', '饮品')
    : '搜索菜谱、食材、水果、饮品、调料';
});
const isRecipeType = computed(() => currentType.value.toLowerCase().includes('recipe'));
const getItemLabel = (item: CategoryItem) => String(item.title ?? item.name ?? '').trim();
const isRenderableContentItem = (item: CategoryItem) => {
  const type = String(item.type ?? currentType.value).toLowerCase();
  return Boolean(item.id && getItemLabel(item) && !/^\d+$/.test(getItemLabel(item)) && !['system', 'image'].includes(type));
};
const contentItems = computed(() =>
  extractContentModules(modules.value)
    .filter((module) => module.status !== 'DISABLED')
    .filter((module) => !currentCategoryId.value || module.categoryId === currentCategoryId.value)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .flatMap((module) => module.items ?? [])
    .filter(isRenderableContentItem)
);

const itemKey = (item: CategoryItem) => String(item.id ?? item.title ?? item.name ?? 'item');
const itemTitle = (item: CategoryItem) => getItemLabel(item);
const itemCover = (item: CategoryItem) => typeof item.cover === 'string' ? item.cover : '';
const itemDescription = (item: CategoryItem) => String(item.subtitle ?? item.description ?? '');
const itemSeason = (item: CategoryItem) => String(item.seasonMonth ?? '');
const itemInitial = (item: CategoryItem) => itemTitle(item).trim().slice(0, 1);
const hasUsableCover = (item: CategoryItem) => Boolean(itemCover(item) && !failedImageIds.has(itemKey(item)));
const markImageFailed = (item: CategoryItem) => failedImageIds.add(itemKey(item));
const itemMeta = (item: CategoryItem) => {
  if (isRecipeType.value) {
    return [item.duration, item.difficulty].filter(Boolean).join(' · ') || '查看做法';
  }
  if (typeof item.currentPrice === 'number') {
    const unit = item.priceUnit ? `/${String(item.priceUnit).replace('500g', '斤')}` : '/斤';
    return `约 ¥${item.currentPrice}${unit}`;
  }
  return itemDescription(item) || '查看详情';
};
const canAddToBasket = (item: CategoryItem) =>
  item.type !== 'image' && Boolean(item.id);

const topNavType = (item: PageModuleTopNavItem) => normalizedPrimaryType(item);
const isPrimaryActive = (item: PageModuleTopNavItem) => topNavType(item) === currentType.value;

const fetchModules = async () => {
  const sequence = ++requestSequence;
  loading.value = true;
  error.value = null;
  try {
    const params: { page: string; type: string; filter: string; categoryId?: number } = {
      page: 'category',
      type: currentType.value,
      filter: currentFilter.value
    };
    if (currentCategoryId.value) params.categoryId = currentCategoryId.value;
    const result = await getPageModules(params);
    if (sequence === requestSequence) modules.value = result;
  } catch (reason) {
    if (sequence !== requestSequence) return;
    modules.value = [];
    error.value = reason instanceof Error ? reason.message : '加载失败';
  } finally {
    if (sequence === requestSequence) loading.value = false;
    uni.stopPullDownRefresh();
  }
};

const handleTopNavTap = (item: PageModuleTopNavItem) => {
  const nextType = topNavType(item);
  if (nextType === currentType.value) return;
  currentType.value = nextType;
  currentFilter.value = 'recommend';
  currentCategoryId.value = undefined;
  void fetchModules();
};

const handleFilterTap = (item: PageModuleCategoryFilterItem) => {
  currentFilter.value = item.type === 'system' ? 'recommend' : item.key;
  currentCategoryId.value = item.type === 'category' ? item.categoryId : undefined;
  void fetchModules();
};

const handleSearchTap = () => uni.navigateTo({ url: '/pages/search/index' });

const openItem = (item: CategoryItem) => {
  const id = itemKey(item);
  const type = String(item.type ?? currentType.value).toLowerCase();
  if (type.includes('recipe')) {
    uni.navigateTo({ url: `/pages/recipe-detail/index?id=${id}` });
  } else if (type.includes('beverage') || type.includes('drink')) {
    uni.navigateTo({ url: `/pages/beverage-detail/index?id=${id}` });
  } else if (type.includes('fruit')) {
    uni.navigateTo({ url: `/pages/fruit-detail/index?id=${id}` });
  } else if (type.includes('season')) {
    uni.navigateTo({ url: `/pages/seasoning-detail/index?id=${id}` });
  } else {
    uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${id}` });
  }
};

const addItemToBasket = async (item: CategoryItem) => {
  const key = itemKey(item);
  if (basketAddedIds.has(key)) {
    uni.showToast({ title: '已在菜篮中', icon: 'none' });
    return;
  }
  try {
    const recipe = isRecipeType.value;
    await addBasketItem({
      id: recipe ? `recipe-${key}` : getIngredientBasketItemId(key),
      recipeId: recipe ? key : 'ingredient',
      recipeName: recipe ? itemTitle(item) : '单独添加',
      name: itemTitle(item),
      amountText: '适量',
      checked: false,
      ingredientId: recipe ? undefined : key
    });
    basketAddedIds.add(key);
    uni.showToast({ title: '已加入菜篮', icon: 'success' });
  } catch (reason) {
    uni.showToast({ title: reason instanceof Error ? reason.message : '加入失败', icon: 'none' });
  }
};

onLoad((query?: Record<string, string | undefined>) => {
  if (query?.type) currentType.value = query.type;
  if (query?.filter) currentFilter.value = query.filter;
  const categoryId = Number(query?.categoryId);
  if (Number.isFinite(categoryId)) currentCategoryId.value = categoryId;
});

onShow(() => {
  void fetchModules();
});

onMounted(() => {
  if (!modules.value.length && loading.value) {
    void fetchModules();
  }
});

onPullDownRefresh(() => {
  void fetchModules();
});
</script>

<style scoped lang="scss">
.category-page {
  min-height: 100vh;
  padding: 0 0 calc(116px + var(--app-safe-area-bottom));
  overflow-x: hidden;
  background: var(--app-bg);
}

.category-header {
  padding: calc(var(--app-safe-area-top) + 10px) 20px 0;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-bg);
}

.category-search {
  display: flex;
  width: 100%;
  height: 46px;
  margin: 0;
  padding: 0 14px;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(183, 174, 161, 0.22);
  border-radius: 14px;
  background: rgba(255, 253, 252, 0.72);
  color: var(--text-tertiary);
  text-align: left;
}

.category-search::after,
.category-primary-nav__item::after,
.category-secondary-rail__item::after,
.category-basket-button::after {
  border: 0;
}

.category-search text {
  overflow: hidden;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-regular);
  line-height: var(--line-body-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-primary-nav {
  display: grid;
  margin: 14px -20px 0;
  padding: 0 20px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.category-primary-nav__item {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 52px;
  margin: 0;
  padding: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
  white-space: nowrap;
}

.category-primary-nav__item.is-active {
  color: var(--text-brand);
  font-weight: var(--font-semibold);
}

.category-primary-nav__item.is-active::before {
  position: absolute;
  bottom: 0;
  left: 50%;
  right: 20px;
  left: 20px;
  width: auto;
  height: 3px;
  border-radius: 3px;
  background: var(--text-brand);
  content: '';
  transform: none;
}

.category-workspace {
  display: grid;
  min-height: calc(100vh - 190px);
  grid-template-columns: 76px minmax(0, 1fr);
}

.category-secondary-rail {
  display: flex;
  padding: 12px 0 112px;
  flex-direction: column;
  border-right: 1px solid var(--app-border);
  background: rgba(239, 235, 227, 0.66);
}

.category-secondary-rail__item {
  display: flex;
  width: 100%;
  min-height: 48px;
  margin: 0;
  padding: 6px 8px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
  text-align: center;
}

.category-secondary-rail__item.is-active {
  background: rgba(122, 139, 111, 0.075);
  color: var(--text-brand);
  font-weight: var(--font-semibold);
}

.category-content-pane {
  min-width: 0;
  padding: 10px 12px 118px;
}

.category-content-pane__summary {
  display: flex;
  min-height: 40px;
  padding: 10px 0 5px;
  align-items: center;
  justify-content: space-between;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
}

.category-result-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 10px;
}

.category-result-list.is-recipe {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
}

.category-content-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  background: var(--app-surface-strong);
}

.category-content-card--recipe {
  display: grid;
  min-height: 108px;
  grid-template-columns: 84px minmax(0, 1fr);
  align-items: center;
  border-bottom: 1px solid var(--app-border);
  border-radius: 0;
  background: transparent;
}

.category-content-card__media {
  position: relative;
  display: flex;
  width: 100%;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--app-muted);
}

.category-content-card--recipe .category-content-card__media {
  width: 84px;
  height: 84px;
  border-radius: 12px;
}

.category-content-card__image {
  width: 100%;
  height: 100%;
}

.category-content-card__fallback {
  color: var(--text-brand);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
}

.category-content-card__body {
  display: flex;
  min-width: 0;
  min-height: 82px;
  padding: 10px 10px 11px;
  flex-direction: column;
}

.category-content-card--recipe .category-content-card__body {
  min-height: 108px;
  padding: 12px 0 12px 11px;
  justify-content: center;
}

.category-content-card__heading {
  display: flex;
  min-width: 0;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}

.category-content-card__name {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-content-card__season {
  flex: 0 0 auto;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-regular);
  line-height: var(--line-tag);
}

.category-content-card__description {
  display: -webkit-box;
  margin-top: 2px;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-regular);
  line-height: var(--line-caption);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.category-content-card__footer {
  display: flex;
  min-width: 0;
  margin-top: auto;
  padding-top: 4px;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.category-content-card__meta {
  min-width: 0;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-regular);
  line-height: var(--line-tag);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-basket-button {
  display: flex;
  width: 44px;
  height: 44px;
  min-height: 44px;
  margin: -8px -4px -8px 0;
  padding: 0;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text-brand);
}

.category-basket-button.is-added {
  background: rgba(122, 139, 111, 0.12);
}

@media (max-width: 374px) {
  .category-header {
    padding-right: 16px;
    padding-left: 16px;
  }

  .category-workspace {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .category-content-pane {
    padding-right: 10px;
    padding-left: 10px;
  }

  .category-content-card--recipe {
    grid-template-columns: 78px minmax(0, 1fr);
  }

  .category-content-card--recipe .category-content-card__media {
    width: 78px;
    height: 78px;
  }
}

@media (min-width: 430px) {
  .category-page {
    max-width: 430px;
    margin: 0 auto;
  }
}
</style>
