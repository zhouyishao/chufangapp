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

      <!-- 内容模块区：遍历 content_module 中每个模块按 displayStyle 渲染 -->
      <template v-for="mod in contentModules" :key="mod.id">
        <!-- LARGE_IMAGE_CAROUSEL / hero_banner 兼容 -->
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
            <swiper-item v-for="img in modImages(mod)" :key="img.id">
              <view class="category-banner__item" @tap="handleBannerTap(img)">
                <image class="category-banner__image" :src="img.cover" mode="aspectFill" />
                <view class="category-banner__copy" v-if="img.title">
                  <text class="category-banner__title">{{ img.title }}</text>
                  <text v-if="img.subtitle" class="category-banner__subtitle">{{ img.subtitle }}</text>
                </view>
              </view>
            </swiper-item>
          </swiper>
          <view class="category-banner__dots" v-if="modImages(mod).length > 1">
            <view v-for="(dot, idx) in modImages(mod)" :key="idx" :class="['category-banner__dot', { 'category-banner__dot--active': idx === bannerCurrent }]" />
          </view>
          <view v-else class="category-banner__single" @tap="handleBannerTap(modImages(mod)[0])">
            <image class="category-banner__image" :src="modImages(mod)[0].cover" mode="aspectFill" />
            <view class="category-banner__copy" v-if="modImages(mod)[0].title">
              <text class="category-banner__title">{{ modImages(mod)[0].title }}</text>
              <text v-if="modImages(mod)[0].subtitle" class="category-banner__subtitle">{{ modImages(mod)[0].subtitle }}</text>
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
              :key="item.key || item.id"
              class="category-grid__card"
              @tap="handleGridTap(item)"
            >
              <text class="category-grid__name">{{ item.name || item.title }}</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 向后兼容：hero_banner 无 content_module 时用旧逻辑 -->
      <view class="category-banner" v-if="!contentModules.length && bannerItems.length">
        <swiper v-if="bannerItems.length > 1" class="category-banner__swiper" :indicator-dots="false" :autoplay="true" :interval="4000" :circular="true" @change="handleBannerSwiperChange">
          <swiper-item v-for="banner in bannerItems" :key="banner.id">
            <view class="category-banner__item" @tap="handleBannerTap(banner)">
              <image class="category-banner__image" :src="banner.cover" mode="aspectFill" />
              <view class="category-banner__copy" v-if="banner.title"><text class="category-banner__title">{{ banner.title }}</text><text v-if="banner.subtitle" class="category-banner__subtitle">{{ banner.subtitle }}</text></view>
            </view>
          </swiper-item>
        </swiper>
        <view class="category-banner__dots" v-if="bannerItems.length > 1"><view v-for="(dot, idx) in bannerItems" :key="idx" :class="['category-banner__dot', { 'category-banner__dot--active': idx === bannerCurrent }]" /></view>
        <view v-else class="category-banner__single" @tap="handleBannerTap(bannerItems[0])"><image class="category-banner__image" :src="bannerItems[0].cover" mode="aspectFill" /><view class="category-banner__copy" v-if="bannerItems[0].title"><text class="category-banner__title">{{ bannerItems[0].title }}</text><text v-if="bannerItems[0].subtitle" class="category-banner__subtitle">{{ bannerItems[0].subtitle }}</text></view></view>
      </view>

      <!-- 空态 -->
      <view v-if="!loading && !topNavItems.length && !filterItems.length && !bannerItems.length && !gridItems.length" class="category-status">
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
import {
  getPageModules,
  type PageModule,
  type PageModuleTopNavItem,
  type PageModuleCategoryFilterItem,
  type PageModuleBanner
} from '../../services/public-api';
import type { HomeTab } from '../../types/home';

// ====== 从接口提取数据的工具函数 ======
type TopNavData = { activeKey: string; items: PageModuleTopNavItem[] };
type FilterData = { activeKey: string; items: PageModuleCategoryFilterItem[] };
type BannerData = { navId: string | null; banners: PageModuleBanner[] };
type GridData = { items: PageModuleCategoryFilterItem[] };

const extractTopNavItems = (mods: PageModule[]): PageModuleTopNavItem[] =>
  (mods.find(m => m.moduleType === 'top_nav')?.data as TopNavData | undefined)?.items ?? [];

const extractFilterItems = (mods: PageModule[]): PageModuleCategoryFilterItem[] =>
  (mods.find(m => m.moduleType === 'category_filter')?.data as FilterData | undefined)?.items ?? [];

const extractBannerItems = (mods: PageModule[]): PageModuleBanner[] =>
  (mods.find(m => m.moduleType === 'hero_banner')?.data as BannerData | undefined)?.banners ?? [];

const extractGridItems = (mods: PageModule[]): PageModuleCategoryFilterItem[] =>
  (mods.find(m => m.moduleType === 'category_grid')?.data as GridData | undefined)?.items ?? [];

// ====== 内容模块提取（从 content_module moduleType） ======
type ContentModuleData = {
  id: number;
  title: string;
  subtitle: string | null;
  displayStyle: string;
  showTitle: boolean;
  items: Array<Record<string, unknown>>;
};

const extractContentModules = (mods: PageModule[]): ContentModuleData[] => {
  const cm = mods.find(m => m.moduleType === 'content_module');
  return (cm?.data as ContentModuleData[]) ?? [];
};

const isLargeImageModule = (mod: ContentModuleData) =>
  mod.displayStyle === 'LARGE_IMAGE_CAROUSEL';

const isFourCardGridModule = (mod: ContentModuleData) =>
  mod.displayStyle === 'FOUR_CARD_GRID';

const modImages = (mod: ContentModuleData): Array<Record<string, unknown>> =>
  (mod.items ?? []).filter((item: Record<string, unknown>) => item.cover);

const modItems = (mod: ContentModuleData): Array<Record<string, unknown>> =>
  (mod.items ?? []).filter((item: Record<string, unknown>) => (item as { type?: string }).type !== 'system');

const extractSearchConfig = (mods: PageModule[]): Record<string, unknown> | null =>
  (mods.find(m => m.moduleType === 'search_bar')?.config as Record<string, unknown>) ?? null;

const extractActiveFilterKey = (mods: PageModule[]): string =>
  (mods.find(m => m.moduleType === 'category_filter')?.data as FilterData | undefined)?.activeKey ?? 'recommend';

// ====== 状态 ======
const modules = ref<PageModule[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const currentType = ref('ingredient');
const currentFilter = ref('recommend');
const currentCategoryId = ref<number | undefined>(undefined);
const bannerCurrent = ref(0);

// ====== 派生数据 ======
const topNavItems = computed(() => extractTopNavItems(modules.value));
const filterItems = computed(() => extractFilterItems(modules.value));
const bannerItems = computed(() => extractBannerItems(modules.value));
const gridItems = computed(() => extractGridItems(modules.value));
const contentModules = computed(() => extractContentModules(modules.value));
const searchConfig = computed(() => extractSearchConfig(modules.value));
const activeFilterKey = computed(() => extractActiveFilterKey(modules.value));

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
  if (item.type === 'system') {
    currentFilter.value = 'recommend';
    currentCategoryId.value = undefined;
  } else {
    currentFilter.value = item.key;
    currentCategoryId.value = item.categoryId;
  }
  void fetchModules();
};

// ====== Banner 切换 ======
const handleBannerSwiperChange = (e: { detail: { current: number } }) => {
  bannerCurrent.value = e.detail.current;
};

// ====== Banner 点击 ======
const handleBannerTap = (banner: PageModuleBanner) => {
  if (banner.link) {
    if (banner.link.startsWith('/pages/')) {
      uni.navigateTo({ url: banner.link });
      return;
    }
    uni.navigateTo({ url: `/pages/recommendations/index?url=${encodeURIComponent(banner.link)}` });
    return;
  }
  if (banner.targetType === 'RECIPE' && banner.targetId) {
    uni.navigateTo({ url: `/pages/recipe-detail/index?id=${banner.targetId}` });
  } else if (banner.targetType === 'INGREDIENT' && banner.targetId) {
    uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${banner.targetId}` });
  } else if (banner.targetType === 'CATEGORY' && banner.targetId) {
    currentCategoryId.value = Number(banner.targetId);
    void fetchModules();
  }
};

// ====== 四宫格点击 ======
const handleGridTap = (item: PageModuleCategoryFilterItem) => {
  handleFilterTap(item);
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
  align-items: center;
  justify-content: center;
  height: 120rpx;
  padding: 16rpx 8rpx;
  border-radius: 24rpx;
  background: var(--app-surface-strong);
  border: 1px solid var(--app-border);
  transition: opacity 150ms ease;
}

.category-grid__card:active {
  opacity: 0.7;
}

.category-grid__card--system {
  background: var(--app-accent-soft);
  border-color: transparent;
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
</style>
