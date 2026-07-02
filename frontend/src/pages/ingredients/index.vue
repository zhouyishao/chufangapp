<template>
  <view class="app-page category-page">
    <!-- 搜索框 -->
    <view class="category-search" v-if="searchConfig">
      <view class="category-search__bar" @tap="handleSearchTap">
        <text class="category-search__icon" />
        <text class="category-search__placeholder">{{ searchConfig.placeholder ?? '搜索菜谱、食材、水果、调料、酒水' }}</text>
      </view>
    </view>

    <!-- 顶部导航（动态，来自接口 top_nav） -->
    <view class="category-topnav" v-if="topNavItems.length">
      <scroll-view scroll-x enable-flex :show-scrollbar="false" class="category-topnav__scroll">
        <view class="category-topnav__row">
          <view
            v-for="item in topNavItems"
            :key="item.id"
            :class="['category-topnav__tab', { 'category-topnav__tab--active': item.active }]"
            @tap="handleTopNavTap(item)"
          >
            {{ item.name }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 加载态 -->
    <view v-if="loading" class="category-status">
      <text class="category-status__text">加载中...</text>
    </view>

    <!-- 错误态 -->
    <view v-else-if="error" class="category-status">
      <text class="category-status__text category-status__text--error">{{ error }}</text>
      <view class="category-status__retry" @tap="fetchModules">重试</view>
    </view>

    <!-- 正常内容 -->
    <template v-else>
      <!-- 分类筛选（动态，来自接口 category_filter） -->
      <view class="category-filter" v-if="filterItems.length">
        <scroll-view scroll-x enable-flex :show-scrollbar="false" class="category-filter__scroll">
          <view class="category-filter__row">
            <view
              v-for="item in filterItems"
              :key="item.key"
              :class="['category-filter__chip', { 'category-filter__chip--active': item.key === activeFilterKey }]"
              @tap="handleFilterTap(item)"
            >
              {{ item.name }}
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 内容区：只渲染后台配置的 content_module，并按分类分组 -->
      <view
        v-for="section in contentSections"
        :id="section.anchorId"
        :key="section.key"
        class="category-section"
      >
        <view v-if="section.title" class="category-section__header">
          <text class="category-section__title">{{ section.title }}</text>
        </view>

        <template v-for="mod in section.modules" :key="mod.id">
          <HomeModuleRenderer v-if="isLegacyContentModule(mod)" :modules="toHomeModuleList(mod)" />

          <!-- LARGE_IMAGE_CAROUSEL -->
          <view class="category-banner" v-if="isLargeImageModule(mod) && modImages(mod).length">
            <view v-if="mod.showTitle !== false" class="category-banner__header">
              <text class="category-banner__header-title">{{ mod.title }}</text>
              <text v-if="mod.subtitle" class="category-banner__header-subtitle">{{ mod.subtitle }}</text>
            </view>
            <swiper
              v-if="modImages(mod).length > 1"
              class="category-banner__swiper"
              :indicator-dots="false"
              :autoplay="true"
              :interval="4000"
              :circular="true"
              @change="handleBannerSwiperChange"
            >
              <swiper-item v-for="img in modImages(mod)" :key="getItemKey(img)">
                <view class="category-banner__item" @tap="handleBannerTap(img)">
                  <image class="category-banner__image" :src="getItemCover(img)" mode="aspectFill" />
                  <view class="category-banner__copy" v-if="getItemTitle(img)">
                    <text class="category-banner__title">{{ getItemTitle(img) }}</text>
                    <text v-if="getItemSubtitle(img)" class="category-banner__subtitle">{{ getItemSubtitle(img) }}</text>
                  </view>
                </view>
              </swiper-item>
            </swiper>
            <view class="category-banner__dots" v-if="modImages(mod).length > 1">
              <view v-for="(dot, idx) in modImages(mod)" :key="getItemKey(dot)" :class="['category-banner__dot', { 'category-banner__dot--active': idx === bannerCurrent }]" />
            </view>
            <view v-else class="category-banner__single" @tap="handleBannerTap(modImages(mod)[0])">
              <image class="category-banner__image" :src="getItemCover(modImages(mod)[0])" mode="aspectFill" />
              <view class="category-banner__copy" v-if="getItemTitle(modImages(mod)[0])">
                <text class="category-banner__title">{{ getItemTitle(modImages(mod)[0]) }}</text>
                <text v-if="getItemSubtitle(modImages(mod)[0])" class="category-banner__subtitle">{{ getItemSubtitle(modImages(mod)[0]) }}</text>
              </view>
            </view>
          </view>

          <!-- FOUR_CARD_GRID -->
          <view class="category-grid" v-if="isFourCardGridModule(mod) && modItems(mod).length">
            <view v-if="mod.showTitle !== false" class="category-grid__header">
              <text class="category-grid__header-title">{{ mod.title }}</text>
              <text v-if="mod.subtitle" class="category-grid__header-subtitle">{{ mod.subtitle }}</text>
            </view>
            <view class="category-grid__items">
              <view
                v-for="item in modItems(mod)"
                :key="getItemKey(item)"
                class="category-grid__card"
                @tap="handleGridTap(item)"
              >
                <image v-if="getItemCover(item)" class="category-grid__image" :src="getItemCover(item)" mode="aspectFill" />
                <view class="category-grid__body">
                  <text class="category-grid__name">{{ getItemTitle(item) }}</text>
                  <text v-if="getItemSubtitle(item)" class="category-grid__subtitle">{{ getItemSubtitle(item) }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>
      </view>

      <view v-if="!contentSections.length && (topNavItems.length || filterItems.length)" class="category-status category-status--content">
        <text class="category-status__text">暂无当前分类内容</text>
      </view>

      <!-- 空态 -->
      <view v-if="!loading && !topNavItems.length && !filterItems.length && !contentSections.length" class="category-status">
        <text class="category-status__text">暂无内容</text>
      </view>
    </template>

    <!-- 底部导航 -->
    <home-tab-bar :tabs="bottomTabs" />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import HomeModuleRenderer from '../../components/home-modules/HomeModuleRenderer.vue';
import {
  getPageModules,
  type PageModule,
  type PageModuleTopNavItem,
  type PageModuleCategoryFilterItem,
  type HomeModule
} from '../../services/public-api';
import type { HomeTab } from '../../types/home';

// ====== 从接口提取数据的工具函数 ======
type TopNavData = { activeKey: string; items: PageModuleTopNavItem[] };
type FilterData = { activeKey: string; items: PageModuleCategoryFilterItem[] };

const extractTopNavItems = (mods: PageModule[]): PageModuleTopNavItem[] =>
  (mods.find(m => m.moduleType === 'top_nav')?.data as TopNavData | undefined)?.items ?? [];

const extractFilterItems = (mods: PageModule[]): PageModuleCategoryFilterItem[] =>
  (mods.find(m => m.moduleType === 'category_filter')?.data as FilterData | undefined)?.items ?? [];

// ====== 内容模块提取（从 content_module moduleType） ======
type ContentModuleData = {
  id: number;
  navId: number;
  title: string;
  subtitle: string | null;
  displayStyle: string;
  contentType: string;
  contentSource: string;
  categoryId: number | null;
  categoryName: string | null;
  showTitle: boolean;
  sortOrder: number;
  items: Array<Record<string, unknown>>;
};

type ContentSection = {
  key: string;
  anchorId: string;
  title: string;
  modules: ContentModuleData[];
};

type TapTarget = Record<string, unknown> & {
  link?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  jumpType?: string | null;
  jumpTarget?: string | null;
  type?: string | null;
  id?: string | number;
};

const extractContentModules = (mods: PageModule[]): ContentModuleData[] => {
  const cm = mods.find(m => m.moduleType === 'content_module');
  return (cm?.data as unknown as ContentModuleData[]) ?? [];
};

const isLargeImageModule = (mod: ContentModuleData) =>
  mod.displayStyle === 'LARGE_IMAGE_CAROUSEL';

const isFourCardGridModule = (mod: ContentModuleData) =>
  mod.displayStyle === 'FOUR_CARD_GRID';

const isLegacyContentModule = (mod: ContentModuleData) =>
  ['HORIZONTAL_RECIPE_CARD', 'SEASONAL_INGREDIENT_CARD', 'IMAGE_TEXT_LIST', 'TWO_COLUMN_RECIPE_GRID'].includes(mod.displayStyle);

const isSupportedContentModule = (mod: ContentModuleData) =>
  isLegacyContentModule(mod) || isLargeImageModule(mod) || isFourCardGridModule(mod);

const toHomeModuleList = (mod: ContentModuleData): HomeModule[] => [mod as unknown as HomeModule];

const modImages = (mod: ContentModuleData): Array<Record<string, unknown>> =>
  (mod.items ?? []).filter((item: Record<string, unknown>) => item.cover);

const modItems = (mod: ContentModuleData): Array<Record<string, unknown>> =>
  (mod.items ?? []).filter((item: Record<string, unknown>) => (item as { type?: string }).type !== 'system');

const extractSearchConfig = (mods: PageModule[]): Record<string, unknown> | null =>
  (mods.find(m => m.moduleType === 'search_bar')?.config as Record<string, unknown>) ?? null;

const toText = (value: unknown) => (typeof value === 'string' ? value : '');
const toNullableNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const getItemKey = (item: Record<string, unknown>) => String(item.id ?? item.key ?? item.title ?? item.name ?? item.sortOrder ?? 'item');
const getItemCover = (item: Record<string, unknown>) => toText(item.cover);
const getItemTitle = (item: Record<string, unknown>) => toText(item.title) || toText(item.name);
const getItemSubtitle = (item: Record<string, unknown>) => toText(item.subtitle) || toText(item.description);

// ====== 状态 ======
const modules = ref<PageModule[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const currentType = ref('recipe');
const currentFilter = ref('recommend');
const currentCategoryId = ref<number | undefined>(undefined);
const bannerCurrent = ref(0);

// ====== 派生数据 ======
const topNavItems = computed(() => extractTopNavItems(modules.value));
const filterItems = computed(() => extractFilterItems(modules.value));
const contentModules = computed(() => extractContentModules(modules.value));
const searchConfig = computed(() => extractSearchConfig(modules.value));
const activeFilterKey = computed(() => currentFilter.value);
const renderableContentModules = computed(() =>
  contentModules.value
    .filter((mod) => isSupportedContentModule(mod) && mod.items.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder)
);
const contentSections = computed<ContentSection[]>(() => {
  if (!currentCategoryId.value) {
    const recommendedModules = renderableContentModules.value.filter((mod) => !mod.categoryId);
    return recommendedModules.length
      ? [{ key: 'recommend', anchorId: 'section-recommend', title: '', modules: recommendedModules }]
      : [];
  }

  const categoryModules = renderableContentModules.value.filter((mod) => mod.categoryId === currentCategoryId.value);

  return categoryModules.length
    ? [{
        key: String(currentCategoryId.value),
        anchorId: `section-category-${currentCategoryId.value}`,
        title: '',
        modules: categoryModules
      }]
    : [];
});

// ====== 底部导航 ======
const bottomTabs = ref<HomeTab[]>([
  { id: 'home', label: '首页', active: false },
  { id: 'categories', label: '分类', active: true },
  { id: 'basket', label: '菜篮子', active: false },
  { id: 'mine', label: '我的', active: false }
]);

// ====== 数据加载 ======
const fetchModules = async () => {
  loading.value = true;
  error.value = null;
  try {
    const params: Record<string, string | number> = {
      page: 'category',
      type: currentType.value,
      filter: currentFilter.value
    };
    if (currentCategoryId.value) {
      params.categoryId = currentCategoryId.value;
    }
    const result = await getPageModules(params as { page?: string; type?: string; filter?: string; categoryId?: number });
    modules.value = result;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败';
    modules.value = [];
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
};

// ====== 顶部导航点击 ======
const handleTopNavTap = (item: PageModuleTopNavItem) => {
  const nextType = item.contentType ?? item.name;
  if (nextType === currentType.value) return;
  currentType.value = nextType;
  currentFilter.value = 'recommend';
  currentCategoryId.value = undefined;
  void fetchModules();
};

// ====== 分类筛选点击 ======
const handleFilterTap = (item: PageModuleCategoryFilterItem) => {
  currentFilter.value = item.type === 'system' ? 'recommend' : item.key;
  currentCategoryId.value = item.type === 'category' ? item.categoryId : undefined;
  void fetchModules();
};

// ====== Banner 切换 ======
const handleBannerSwiperChange = (e: { detail: { current: number } }) => {
  bannerCurrent.value = e.detail.current;
};

// ====== Banner 点击 ======
const handleBannerTap = (banner: TapTarget) => {
  const link = banner.link ?? (banner.jumpType === 'EXTERNAL_LINK' ? banner.jumpTarget : null);
  if (typeof link === 'string' && link) {
    if (link.startsWith('/pages/')) {
      uni.navigateTo({ url: link });
      return;
    }
    uni.navigateTo({ url: `/pages/recommendations/index?url=${encodeURIComponent(link)}` });
    return;
  }

  const targetType = banner.targetType ?? banner.jumpType;
  const targetId = banner.targetId ?? banner.jumpTarget ?? banner.id;
  if ((targetType === 'RECIPE' || banner.type === 'recipe') && targetId) {
    uni.navigateTo({ url: `/pages/recipe-detail/index?id=${targetId}` });
  } else if ((targetType === 'INGREDIENT' || banner.type === 'ingredient') && targetId) {
    uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${targetId}` });
  } else if ((targetType === 'CONTENT_DETAIL') && targetId) {
    const type = toText(banner.type);
    uni.navigateTo({ url: type === 'recipe' ? `/pages/recipe-detail/index?id=${targetId}` : `/pages/ingredient-detail/index?id=${targetId}` });
  } else if ((targetType === 'CATEGORY' || targetType === 'CATEGORY_PAGE') && targetId) {
    const categoryId = toNullableNumber(targetId);
    const item = filterItems.value.find((filter) => filter.categoryId === categoryId);
    if (item) handleFilterTap(item);
  } else if (targetType === 'BASKET') {
    uni.switchTab({ url: '/pages/basket/index' });
  }
};

// ====== 四宫格点击 ======
const handleGridTap = (item: Record<string, unknown>) => {
  handleBannerTap(item as TapTarget);
};

// ====== 搜索 ======
const handleSearchTap = () => {
  uni.navigateTo({ url: '/pages/search/index' });
};

// ====== 生命周期 ======
onMounted(() => {
  void fetchModules();
});

onShow(() => {
  void fetchModules();
});

onPullDownRefresh(() => {
  void fetchModules();
});
</script>

<style scoped lang="scss">
.category-page {
  min-height: 100vh;
  background: var(--app-bg);
  padding-top: env(safe-area-inset-top);
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom, 0));
}

// ====== 搜索框 ======
.category-search {
  padding: 20rpx 32rpx 12rpx;
}

.category-search__bar {
  display: flex;
  align-items: center;
  height: 80rpx;
  padding: 0 28rpx;
  border-radius: 40rpx;
  background: var(--app-surface-strong);
  border: 1px solid var(--app-border);
}

.category-search__icon {
  display: block;
  width: 32rpx;
  height: 32rpx;
  margin-right: 16rpx;
  background: currentColor;
  color: var(--text-placeholder);
  -webkit-mask: url('../../assets/icons/icon_search.svg') center / contain no-repeat;
  mask: url('../../assets/icons/icon_search.svg') center / contain no-repeat;
}

.category-search__placeholder {
  color: var(--text-placeholder);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-tabbar);
}

// ====== 顶部导航 ======
.category-topnav {
  padding: 0 32rpx;
}

.category-topnav__scroll {
  white-space: nowrap;
}

.category-topnav__row {
  display: flex;
  align-items: center;
  gap: 40rpx;
  width: max-content;
  min-width: 100%;
  padding: 8rpx 0 12rpx;
}

.category-topnav__tab {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  padding-bottom: 8rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-tabbar);
  white-space: nowrap;
  transition: color 180ms ease;
}

.category-topnav__tab--active {
  color: var(--text-brand);
  font-weight: var(--font-semibold);
  border-bottom: 4rpx solid var(--text-brand);
}

// ====== 状态 ======
.category-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  padding: 48rpx 32rpx;
}

.category-status__text {
  color: var(--text-placeholder);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.category-status__text--error {
  color: var(--app-danger);
}

.category-status__retry {
  margin-top: 24rpx;
  padding: 16rpx 40rpx;
  border-radius: 28rpx;
  background: var(--text-brand);
  color: var(--text-white);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
}

// ====== 分类筛选 ======
.category-filter {
  padding: 16rpx 32rpx;
}

.category-filter__scroll {
  white-space: nowrap;
}

.category-filter__row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: max-content;
  min-width: 100%;
}

.category-filter__chip {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 28rpx;
  background: var(--app-surface-strong);
  border: 1px solid var(--app-border);
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-tabbar);
  white-space: nowrap;
  transition: all 180ms ease;
}

.category-filter__chip--active {
  background: var(--text-brand);
  border-color: var(--text-brand);
  color: var(--text-white);
}

// ====== 内容分组 ======
.category-section {
  scroll-margin-top: 24rpx;
}

.category-section__header {
  padding: 24rpx 32rpx 4rpx;
}

.category-section__title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

// ====== 大矩形图片模块 ======
.category-banner {
  margin: 20rpx 32rpx 24rpx;
  position: relative;
}

.category-banner__header {
  margin-bottom: 16rpx;
  padding: 0;
}

.category-banner__header-title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.category-banner__header-subtitle {
  display: block;
  margin-top: 6rpx;
  color: var(--text-placeholder);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.category-banner__swiper {
  width: 100%;
  height: 248rpx;
  border-radius: 32rpx;
  overflow: hidden;
}

.category-banner__single {
  width: 100%;
  height: 248rpx;
  border-radius: 32rpx;
  overflow: hidden;
  position: relative;
}

.category-banner__item {
  position: relative;
  width: 100%;
  height: 248rpx;
}

.category-banner__image {
  width: 100%;
  height: 248rpx;
}

.category-banner__dots {
  position: absolute;
  bottom: 16rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10rpx;
  z-index: 5;
}

.category-banner__dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  transition: all 200ms ease;
}

.category-banner__dot--active {
  background: #fff;
  width: 20rpx;
  border-radius: 5rpx;
}

.category-banner__copy {
  position: absolute;
  left: 28rpx;
  right: 28rpx;
  bottom: 28rpx;
  display: flex;
  flex-direction: column;
  z-index: 3;
}

.category-banner__title {
  color: var(--text-white);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
  text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.22);
}

.category-banner__subtitle {
  margin-top: 10rpx;
  color: rgba(255, 253, 252, 0.88);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
  text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.16);
}

// ====== 四宫格模块 ======
.category-grid {
  padding: 8rpx 32rpx 32rpx;
}

.category-grid__header {
  margin-bottom: 16rpx;
}

.category-grid__header-title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.category-grid__header-subtitle {
  display: block;
  margin-top: 6rpx;
  color: var(--text-placeholder);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.category-grid__items {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16rpx;
}

.category-grid__card {
  display: flex;
  flex-direction: column;
  min-height: 188rpx;
  overflow: hidden;
  border-radius: 24rpx;
  background: var(--app-surface-strong);
  border: 1px solid var(--app-border);
  transition: opacity 150ms ease;
}

.category-grid__card:active {
  opacity: 0.7;
}

.category-grid__image {
  width: 100%;
  height: 92rpx;
  background: var(--app-surface);
}

.category-grid__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  min-width: 0;
  padding: 12rpx 10rpx;
}

.category-grid__name {
  color: var(--text-primary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-grid__subtitle {
  display: block;
  margin-top: 4rpx;
  color: var(--text-placeholder);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-regular);
  line-height: var(--line-tabbar);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
