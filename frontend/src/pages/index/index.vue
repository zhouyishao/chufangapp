<template>
  <view class="app-page home-page">
    <!-- ====== 一体化 Hero 区域：轮播图 + 悬浮搜索框 + 悬浮 Tab ====== -->
    <view class="home-hero">
      <!-- 轮播图背景层 -->
      <view v-if="homeHeroBanners.length" class="home-hero__carousel">
        <swiper
          class="home-hero__swiper"
          :indicator-dots="homeHeroBanners.length > 1"
          indicator-color="rgba(255,255,255,0.5)"
          indicator-active-color="#fff"
          :autoplay="true"
          :interval="4000"
          :circular="homeHeroBanners.length > 1"
        >
          <swiper-item v-for="banner in homeHeroBanners" :key="banner.id">
            <view class="home-hero__item" @tap="goToHeroBannerTarget(banner)">
              <image
                class="home-hero__image"
                :src="banner.cover"
                mode="aspectFill"
                :style="{ objectPosition: banner.imageFocus === 'left' ? 'left center' : banner.imageFocus === 'right' ? 'right center' : 'center center' }"
              />
              <view class="home-hero__gradient" />
              <!-- 轮播文案覆盖在左下方 -->
              <view class="home-hero__copy">
                <text class="home-hero__title">{{ banner.title }}</text>
                <text v-if="banner.subtitle" class="home-hero__subtitle">{{ banner.subtitle }}</text>
                <button
                  v-if="banner.buttonText"
                  class="home-hero__button"
                  @tap.stop="goToHeroBannerTarget(banner)"
                >
                  {{ banner.buttonText }}
                </button>
              </view>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 空态 / 加载态 -->
      <view v-else class="home-hero__empty">
        <text v-if="homeLoading">正在加载…</text>
        <text v-else>暂无轮播图</text>
      </view>

      <!-- 搜索框悬浮层 -->
      <view v-show="!isScrolled" class="home-hero__search">
        <button class="hero-search-bar" aria-label="搜索菜谱、食材和饮品" @tap="handleSearchTap">
          <app-icon class="hero-search-icon" name="search" size="18px" />
          <text class="hero-search-placeholder">搜索菜谱、食材、做法</text>
        </button>
        <button class="hero-notification-btn" aria-label="消息与提醒" @tap="openNotifications">
          <app-icon class="hero-notification-icon" name="bell" size="22px" />
        </button>
      </view>

      <!-- 顶部导航 Tab 悬浮层 -->
      <scroll-view
        scroll-x
        enable-flex
        :show-scrollbar="false"
        scroll-with-animation
        :scroll-into-view="activeTopTabIntoView"
        :scroll-left="topTabsScrollLeft"
        v-show="!isScrolled"
        class="top-tabs-scroll"
        @scroll="handleTopTabsScroll"
      >
        <view class="top-tabs-row">
          <button
            v-for="cat in homeHeaderCategories"
            :id="getTopTabId(cat.id)"
            :key="cat.id"
            :class="['top-tab', { active: activeCategoryId === cat.id }]"
            :aria-selected="activeCategoryId === cat.id"
            role="tab"
            @tap="handleCategoryChange(cat.id)"
          >
            {{ cat.label }}
          </button>
        </view>
      </scroll-view>
    </view>

    <view v-if="isScrolled" class="home-sticky-bar app-fixed-glass">
      <scroll-view
        scroll-x
        enable-flex
        :show-scrollbar="false"
        :scroll-into-view="activeStickyTabIntoView"
        :scroll-left="stickyTabsScrollLeft"
        class="sticky-tabs-scroll"
        role="tablist"
        @scroll="handleStickyTabsScroll"
      >
        <view class="sticky-tabs-row">
          <button
            v-for="cat in homeHeaderCategories"
            :id="getStickyTabId(cat.id)"
            :key="`sticky-${cat.id}`"
            :class="['sticky-tab', { 'sticky-tab--active': activeCategoryId === cat.id }]"
            :aria-selected="activeCategoryId === cat.id"
            role="tab"
            @tap="handleCategoryChange(cat.id)"
          >{{ cat.label }}</button>
        </view>
      </scroll-view>
    </view>

    <!-- ====== 内容模块区域 ====== -->
    <view class="home-content">
      <app-page-state
        v-if="homeLoading"
        kind="loading"
        title="正在加载推荐内容"
        description="马上为你准备好今天的灵感。"
      />
      <app-page-state
        v-else-if="homeError"
        kind="error"
        title="首页内容加载失败"
        :description="homeError"
        action-text="重新加载"
        @action="loadHome"
      />

      <!-- 后台配置的内容模块，正式首页不再回退到旧静态推荐 -->
      <HomeModuleRenderer v-if="!homeLoading && !homeError" :modules="currentNavModules" />

      <app-page-state
        v-if="!homeLoading && !homeError && !currentNavModules.length"
        kind="empty"
        title="暂时没有推荐内容"
        description="后台发布内容后会自动展示在这里。"
      />

      <home-tab-bar :tabs="homeTabs" />
    </view>

  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { onPageScroll } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import AppPageState from '../../components/app/app-page-state.vue';
import HomeModuleRenderer from '../../components/home-modules/HomeModuleRenderer.vue';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import { getHomeHeroBanners, getHomeModules, getHomeTopNavs, type ApiHomeHeroBanner, type HomeModule } from '../../services/public-api';
import type { HomeTab } from '../../types/home';

const activeCategoryId = ref('recommend');
const isScrolled = ref(false);
let scrollFrame: number | undefined;
const homeTabs: HomeTab[] = [
  { id: 'home', label: '首页', active: true },
  { id: 'categories', label: '分类', active: false },
  { id: 'basket', label: '菜篮', active: false },
  { id: 'mine', label: '我的', active: false }
];
const homeLoading = ref(false);
const homeError = ref<string | null>(null);
const homeHeroBanners = ref<ApiHomeHeroBanner[]>([]);
const remoteTopNavs = ref<{ id: string; label: string }[]>([]);
// categoryId → 实际 navId（用于轮播图 API 请求）
const navIdMap = ref<Record<string, string>>({});
const currentNavModules = ref<HomeModule[]>([]);
let channelRequestSequence = 0;
const homeHeaderCategories = computed(() => {
  if (remoteTopNavs.value.length > 0) return remoteTopNavs.value;
  return [];
});
const normalizeTabId = (categoryId: string) => categoryId.replace(/[^a-zA-Z0-9_-]/g, '_');
const getTopTabId = (categoryId: string) => `top_tab_${normalizeTabId(categoryId)}`;
const getStickyTabId = (categoryId: string) => `sticky_tab_${normalizeTabId(categoryId)}`;
const activeTopTabIntoView = computed(() => getTopTabId(activeCategoryId.value));
const activeStickyTabIntoView = computed(() => getStickyTabId(activeCategoryId.value));
const topTabsScrollLeft = ref(0);
const stickyTabsScrollLeft = ref(0);
const currentTopTabsScrollLeft = ref(0);
const currentStickyTabsScrollLeft = ref(0);

const readScrollLeft = (event: { detail?: { scrollLeft?: number } }) => Number(event.detail?.scrollLeft ?? 0);

const handleTopTabsScroll = (event: { detail?: { scrollLeft?: number } }) => {
  currentTopTabsScrollLeft.value = readScrollLeft(event);
};

const handleStickyTabsScroll = (event: { detail?: { scrollLeft?: number } }) => {
  currentStickyTabsScrollLeft.value = readScrollLeft(event);
};

const centerActiveTab = async (type: 'top' | 'sticky') => {
  await nextTick();
  const tabId = type === 'top' ? getTopTabId(activeCategoryId.value) : getStickyTabId(activeCategoryId.value);
  const containerSelector = type === 'top' ? '.top-tabs-scroll' : '.sticky-tabs-scroll';
  const currentLeft = type === 'top' ? currentTopTabsScrollLeft.value : currentStickyTabsScrollLeft.value;

  uni
    .createSelectorQuery()
    .select(containerSelector)
    .boundingClientRect()
    .select(`#${tabId}`)
    .boundingClientRect()
    .exec((rects) => {
      const container = rects?.[0] as { left?: number; width?: number } | null;
      const tab = rects?.[1] as { left?: number; width?: number } | null;
      if (!container || !tab || typeof container.left !== 'number' || typeof tab.left !== 'number') return;
      const containerWidth = Number(container.width ?? 0);
      const tabWidth = Number(tab.width ?? 0);
      const nextLeft = Math.max(0, currentLeft + tab.left - container.left - containerWidth / 2 + tabWidth / 2);
      if (type === 'top') {
        topTabsScrollLeft.value = nextLeft;
      } else {
        stickyTabsScrollLeft.value = nextLeft;
      }
    });
};

// ====== 搜索 ======
const handleSearchTap = () => {
  uni.navigateTo({ url: '/pages/search/index' });
};

const openNotifications = () => {
  uni.navigateTo({ url: '/pages/notifications/index' });
};

// ====== 分类切换 ======
const handleCategoryChange = (categoryId: string) => {
  if (activeCategoryId.value === categoryId && currentNavModules.value.length) return;
  activeCategoryId.value = categoryId;
  const requestSequence = ++channelRequestSequence;
  void centerActiveTab('top');
  void centerActiveTab('sticky');
  // 切换Tab时重新加载对应导航的轮播图和内容模块
  const navId = navIdMap.value[categoryId] ?? categoryId;
  if (!navId) return;
  uni.pageScrollTo({ scrollTop: 0, duration: 180 });
  void loadChannel(navId, requestSequence);
};

// ====== 轮播图跳转 ======
const goToHeroBannerTarget = (banner: ApiHomeHeroBanner) => {
  if (banner.link) {
    if (banner.link.startsWith('/pages/')) {
      uni.navigateTo({ url: banner.link });
      return;
    }
    uni.showToast({ title: banner.link, icon: 'none' });
    return;
  }
  if (banner.targetType === 'RECIPE' && banner.targetId) {
    uni.navigateTo({ url: `/pages/recipe-detail/index?id=${banner.targetId}` });
    return;
  }
  if (banner.targetType === 'INGREDIENT' && banner.targetId) {
    uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${banner.targetId}` });
    return;
  }
  if (banner.targetType === 'BEVERAGE' && banner.targetId) {
    uni.navigateTo({ url: `/pages/beverage-detail/index?id=${banner.targetId}` });
    return;
  }
  if (banner.targetType === 'CATEGORY' && banner.targetId) {
    uni.navigateTo({ url: `/pages/category-filter/index?id=${banner.targetId}` });
    return;
  }
  if ((banner.targetType === 'TOPIC' || banner.targetType === 'MENU') && banner.targetId) {
    uni.navigateTo({ url: `/pages/recommendations/index?id=${banner.targetId}` });
    return;
  }
  uni.showToast({ title: '暂无可跳转内容', icon: 'none' });
};

const updateHeaderScrollState = (scrollTop: number) => {
  isScrolled.value = scrollTop >= 80;
};

const getBrowserScrollTop = () => {
  if (typeof window === 'undefined') return 0;
  const candidates = [
    window.scrollY,
    document.documentElement?.scrollTop,
    document.body?.scrollTop,
    ...Array.from(document.querySelectorAll('uni-page-body, .uni-page-body, .uni-page-wrapper, uni-page, page, .app-page'))
      .map((node) => Number((node as HTMLElement).scrollTop || 0))
  ];
  return Math.max(...candidates.map((value) => Number(value || 0)));
};

const handleBrowserScroll = () => {
  if (typeof window === 'undefined' || scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = undefined;
    updateHeaderScrollState(getBrowserScrollTop());
  });
};

const handleCapturedScroll = (event: Event) => {
  const target = event.target as HTMLElement | Document | null;
  const elementScrollTop = target && 'scrollTop' in target ? Number(target.scrollTop) : 0;
  updateHeaderScrollState(Math.max(getBrowserScrollTop(), elementScrollTop));
};

// ====== 页面滚动 → 吸顶 ======
onPageScroll((event) => {
  updateHeaderScrollState(event.scrollTop);
});

onMounted(() => {
  if (typeof window === 'undefined') return;
  handleBrowserScroll();
  window.addEventListener('scroll', handleBrowserScroll, { passive: true });
  document.addEventListener('scroll', handleCapturedScroll, { passive: true, capture: true });
});

onUnmounted(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('scroll', handleBrowserScroll);
  document.removeEventListener('scroll', handleCapturedScroll, true);
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
});

const loadHome = async () => {
  homeLoading.value = true;
  homeError.value = null;
  try {
    const topNavs = await getHomeTopNavs();
    const defaultNav = topNavs.find((item) => item.isDefault) ?? topNavs[0];
    const requestSequence = ++channelRequestSequence;
    remoteTopNavs.value = topNavs.map((item) => ({ id: item.isDefault ? 'recommend' : item.id, label: item.name }));
    navIdMap.value = topNavs.reduce<Record<string, string>>((memo, item) => {
      memo[item.isDefault ? 'recommend' : item.id] = item.id;
      return memo;
    }, {});
    if (defaultNav) {
      activeCategoryId.value = defaultNav.isDefault ? 'recommend' : defaultNav.id;
      await loadChannel(defaultNav.id, requestSequence, false);
    }
  } catch (err) {
    homeError.value = err instanceof Error ? err.message : '加载失败';
  } finally {
    homeLoading.value = false;
  }
};

const loadCurrentModules = async (navId: string, requestSequence = channelRequestSequence) => {
  try {
    const modules = await getHomeModules(navId);
    if (requestSequence !== channelRequestSequence) return;
    currentNavModules.value = modules;
  } catch {
    if (requestSequence !== channelRequestSequence) return;
    currentNavModules.value = [];
  }
};

const loadChannel = async (navId: string, requestSequence = channelRequestSequence, showLoading = true) => {
  if (showLoading) homeLoading.value = true;
  homeError.value = null;
  try {
    const [banners] = await Promise.all([
      getHomeHeroBanners(navId),
      loadCurrentModules(navId, requestSequence)
    ]);
    if (requestSequence !== channelRequestSequence) return;
    homeHeroBanners.value = banners;
  } catch (err) {
    if (requestSequence !== channelRequestSequence) return;
    homeHeroBanners.value = [];
    homeError.value = err instanceof Error ? err.message : '频道内容加载失败';
  } finally {
    if (requestSequence === channelRequestSequence && showLoading) homeLoading.value = false;
  }
};

void loadHome();
</script>

<style scoped lang="scss">
/* ====== 页面基座 ====== */
.home-page {
  position: relative;
  padding-top: 0;
}

/* ====== Hero 容器 ====== */
.home-hero {
  position: relative;
  width: 100vw;
  aspect-ratio: 393 / 420;
  margin: 0 -32rpx;
  overflow: hidden;
}

/* ====== 轮播图 ====== */
.home-hero__carousel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.home-hero__swiper,
.home-hero__item,
.home-hero__image {
  width: 100%;
  height: 100%;
}

.home-hero__item {
  position: relative;
  overflow: hidden;
}

.home-hero__gradient {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 180rpx;
  background: linear-gradient(180deg, rgba(17, 17, 17, 0) 0%, rgba(17, 17, 17, 0.42) 100%);
  pointer-events: none;
}

.home-hero__copy {
  position: absolute;
  left: 36rpx;
  right: 36rpx;
  bottom: 96rpx;
  display: flex;
  width: auto;
  max-width: 620rpx;
  flex-direction: column;
  align-items: flex-start;
  z-index: 3;
}

.home-hero__title {
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-white);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
  text-shadow: 0 4rpx 18rpx rgba(0, 0, 0, 0.24);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.home-hero__subtitle {
  display: -webkit-box;
  margin-top: 18rpx;
  overflow: hidden;
  color: rgba(255, 253, 252, 0.9);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
  text-shadow: 0 3rpx 12rpx rgba(0, 0, 0, 0.2);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.home-hero__button {
  margin-top: 28rpx;
  margin-left: 0;
  padding: 0 28rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.38);
  border-radius: 8rpx;
  background: rgba(255, 253, 252, 0.92);
  color: var(--text-primary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  line-height: var(--line-hero);
}

.home-hero__button::after {
  border: 0;
}

.home-hero__empty {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f1ea;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

/* ====== 搜索框悬浮层 ====== */
.home-hero__search {
  position: fixed;
  top: calc(var(--app-safe-area-top) + 16px);
  left: 24px;
  right: 24px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: opacity 180ms ease;
}

.hero-search-bar {
  display: flex;
  align-items: center;
  flex: 1;
  height: 46px;
  padding: 0 18px;
  min-height: var(--touch-target);
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 253, 252, 0.5);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transition: background 180ms ease, border-color 180ms ease;
}

.hero-search-icon {
  margin-right: 8px;
  color: rgba(47, 47, 47, 0.42);
  transition: color 180ms ease;
}

.hero-search-placeholder {
  color: rgba(47, 47, 47, 0.42);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-tabbar);
  transition: color 180ms ease;
}

.hero-notification-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 46px;
  width: var(--touch-target);
  height: var(--touch-target);
  border: 0;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 253, 252, 0.5);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  color: var(--text-primary);
  padding: 0;
  transition:
    background 180ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 180ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hero-notification-btn::after {
  border: 0;
}

.hero-notification-btn:active {
  transform: scale(0.96);
}

.hero-notification-icon {
  color: currentColor;
}

/* ====== Tab 悬浮层 ====== */
.top-tabs-scroll {
  position: fixed;
  left: 24px;
  top: calc(var(--app-safe-area-top) + 78px);
  width: calc(100% - 48px);
  height: 36px;
  z-index: 999;
  overflow: hidden;
  white-space: nowrap;
}

.top-tabs-row {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  width: max-content;
  min-width: 100%;
  height: 36px;
}

.top-tab {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  min-height: var(--touch-target);
  padding: 0;
  border: 0;
  background: transparent;
  position: relative;
  font-size: var(--font-size-list-title);
  line-height: 24px;
  font-weight: var(--font-regular);
  color: rgba(255, 253, 252, 0.56);
  white-space: nowrap;
  text-shadow: none;
  transition: color 180ms ease, font-weight 180ms ease;
}

.top-tab.active {
  color: #FFFDFC;
  font-weight: var(--font-medium);
}

/* ====== 滚动吸顶条 ====== */
.home-sticky-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: var(--z-sticky);
  opacity: 1;
  border-bottom: 1px solid rgba(183, 174, 161, 0.18);
  background: rgba(245, 241, 234, 0.92);
  box-shadow: none;
  padding: calc(var(--app-safe-area-top) + 8px) 16px 8px;
  transition: opacity 180ms ease, border-color 180ms ease;
}

.sticky-bar-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0;
}

.sticky-search-pill {
  display: flex;
  align-items: center;
  flex: 1;
  height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 22px;
  background: rgba(255, 253, 252, 0.92);
  transition: background 180ms ease, border-color 180ms ease;
}

.sticky-search-icon {
  margin-right: 6px;
  color: rgba(47, 47, 47, 0.46);
  transition: color 180ms ease;
}

.sticky-search-placeholder {
  color: rgba(47, 47, 47, 0.46);
  font-size: var(--font-size-caption);
  line-height: var(--line-tabbar);
  transition: color 180ms ease;
}

.sticky-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 253, 252, 0.92);
  color: var(--text-primary);
  padding: 0;
  transition: background 180ms ease, border-color 180ms ease;
}

.sticky-add-btn::after {
  border: 0;
}

.sticky-add-icon {
  color: currentColor;
}

.sticky-tabs-scroll {
  height: var(--touch-target);
  white-space: nowrap;
  margin-top: 0;
  overflow: hidden;
}

.sticky-tabs-row {
  display: inline-flex;
  align-items: center;
  gap: 32px;
  min-width: 100%;
  width: max-content;
  height: var(--touch-target);
  padding: 0;
}

.sticky-tab {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-height: var(--touch-target);
  padding: 0;
  border: 0;
  background: transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
  white-space: nowrap;
}

.sticky-tab__label {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding-bottom: 6px;
  color: rgba(47, 47, 47, 0.52);
  font-size: var(--font-size-body-sm);
  font-weight: 500;
  line-height: var(--line-tabbar);
  white-space: nowrap;
  text-shadow: none;
  transition: color 180ms ease, font-weight 180ms ease;
}

.sticky-tab--active .sticky-tab__label {
  color: #7A8B6F;
  font-weight: 700;
}

.sticky-tab--active {
  color: var(--app-primary);
  font-weight: var(--font-semibold);
}

/* ====== 内容区域 ====== */
.home-content {
  padding-top: 0;
}

.home-empty {
  display: flex;
  min-height: 220rpx;
  margin: 32rpx;
  padding: 48rpx 32rpx;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
}

.home-empty__title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.home-empty__desc {
  margin-top: 12rpx;
  color: var(--text-secondary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

/* ====== 原有样式保留 ====== */

.home-data-banner {
  margin: 0 32rpx 24rpx;
  padding: 20rpx 24rpx;
  border-radius: var(--app-radius-card);
}

.home-data-banner__text {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

.home-data-banner__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.home-data-banner__error {
  flex: 1;
  color: var(--app-danger);
  font-size: var(--font-size-tag);
  line-height: var(--line-caption);
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
  font-size: var(--font-size-tabbar);
  line-height: var(--line-tabbar);
}

.seasonal-card__title {
  margin-top: 12rpx;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seasonal-card__desc {
  display: -webkit-box;
  margin-top: 10rpx;
  overflow: hidden;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-body-sm);
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
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
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
  font-size: var(--font-size-tabbar);
}

.recipe-card__calories {
  flex: 0 0 auto;
  padding: 6rpx 12rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.recipe-card__summary {
  display: block;
  margin-top: 12rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-body-sm);
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
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
}

.topic-recipe-card--quick .topic-recipe-card__title,
.topic-recipe-card--breakfast .topic-recipe-card__title {
  font-size: var(--font-size-body-sm);
}

.topic-recipe-card__tag {
  flex: 0 0 auto;
  max-width: 132rpx;
  padding: 7rpx 12rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent-soft);
  color: var(--app-accent-warm);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.topic-recipe-card--home .topic-recipe-card__tag {
  background: var(--app-primary);
  color: var(--text-white);
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
  font-size: var(--font-size-tabbar);
  line-height: var(--line-body-sm);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.topic-recipe-card--quick .topic-recipe-card__summary,
.topic-recipe-card--breakfast .topic-recipe-card__summary {
  font-size: var(--font-size-tabbar);
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
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
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
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
}

.action-card__badge {
  margin-top: 10rpx;
  padding: 8rpx 14rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.action-card__subtitle {
  margin: 14rpx 0 24rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-body-sm);
}

/* ====== 加号弹出菜单 ====== */
.dropdown-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: transparent;
}

.action-dropdown {
  position: fixed;
  top: 108px;
  right: 16px;
  z-index: 2001;
  width: 278rpx;
  padding: 12rpx;
  border: 1rpx solid var(--app-border);
  border-radius: var(--app-radius-input);
  background: var(--app-surface-strong);
  box-shadow: var(--app-shadow);
}

.add-action-list {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.add-action {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 96rpx;
  padding: 18rpx 16rpx;
  border-radius: 22rpx;
  background: transparent;
  color: var(--app-text);
}

.add-action__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50rpx;
  height: 50rpx;
  flex: 0 0 50rpx;
  border-radius: 16rpx;
  background: var(--app-accent-soft);
  color: var(--app-primary);
}

.add-action__icon svg {
  width: 36rpx;
  height: 36rpx;
}

.add-action__title {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}
</style>
