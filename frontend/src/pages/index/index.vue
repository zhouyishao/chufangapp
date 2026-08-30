<template>
  <view class="app-page home-page home-prototype">
    <header class="home-hero-shell" aria-label="首页推荐">
      <swiper
        v-if="homeHeroBanners.length"
        class="home-hero-carousel"
        :autoplay="homeHeroBanners.length > 1"
        :circular="homeHeroBanners.length > 1"
        :interval="4200"
        @change="handleHeroChange"
      >
        <swiper-item v-for="banner in homeHeroBanners" :key="banner.id">
          <view class="home-hero-slide" @tap="goToHeroBannerTarget(banner)">
            <image
              class="home-hero-image"
              :src="banner.cover"
              mode="aspectFill"
              :style="{ objectPosition: heroImagePosition(banner.imageFocus) }"
            />
          </view>
        </swiper-item>
      </swiper>
      <view v-else class="home-hero-empty">
        <text>{{ homeLoading ? '正在加载推荐内容' : '暂无 Banner' }}</text>
      </view>

      <view class="home-hero-shade" aria-hidden="true" />

      <view v-show="!isScrolled" class="home-search-layer">
        <button class="home-search-box" type="button" aria-label="搜索" @tap="handleSearchTap">
          <app-icon name="search" size="20px" />
          <text>搜索菜谱、食材、水果、饮品</text>
        </button>
        <button class="home-notification-button" type="button" aria-label="消息与提醒" @tap="openNotifications">
          <app-icon name="bell" size="22px" />
          <view class="home-notification-dot" aria-hidden="true" />
        </button>
      </view>

      <nav v-show="!isScrolled" class="home-channel-bar" aria-label="首页频道">
        <button
          v-for="category in homeHeaderCategories"
          :key="category.id"
          :class="['home-channel', { 'is-active': activeCategoryId === category.id }]"
          type="button"
          role="tab"
          :aria-selected="activeCategoryId === category.id"
          @tap="handleCategoryChange(category.id)"
        >
          {{ category.label }}
        </button>
      </nav>

      <view v-if="activeHeroBanner" class="home-hero-copy">
        <text class="home-hero-title">{{ heroTitle }}</text>
        <text v-if="heroSubtitle" class="home-hero-meta">{{ heroSubtitle }}</text>
      </view>

      <view v-if="homeHeroBanners.length > 1" class="home-hero-dots" aria-label="Banner 轮播位置">
        <view
          v-for="(banner, index) in homeHeroBanners"
          :key="`dot-${banner.id}`"
          :class="['home-hero-dot', { 'is-active': activeHeroIndex === index }]"
        />
      </view>
    </header>

    <view v-if="isScrolled" class="home-sticky-channels app-fixed-glass">
      <nav class="home-sticky-channel-row" aria-label="吸顶频道">
        <button
          v-for="category in homeHeaderCategories"
          :key="`sticky-${category.id}`"
          :class="['home-sticky-channel', { 'is-active': activeCategoryId === category.id }]"
          type="button"
          role="tab"
          :aria-selected="activeCategoryId === category.id"
          @tap="handleCategoryChange(category.id)"
        >
          {{ category.label }}
        </button>
      </nav>
    </view>

    <main class="home-content">
      <app-page-state
        v-if="homeLoading"
        kind="loading"
        title="正在加载推荐内容"
        description="马上为你准备好今天的内容。"
      />
      <app-page-state
        v-else-if="homeError"
        kind="error"
        title="首页内容加载失败"
        :description="homeError"
        action-text="重新加载"
        @action="loadHome"
      />
      <PrototypeHomeModules
        v-else-if="currentNavModules.length"
        :modules="currentNavModules"
      />
      <app-page-state
        v-else
        kind="empty"
        title="暂时没有推荐内容"
        description="新的时令灵感正在准备中，稍后再来看看。"
      />
    </main>

    <home-tab-bar :tabs="homeTabs" />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { onLoad, onPageScroll } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import AppPageState from '../../components/app/app-page-state.vue';
import PrototypeHomeModules from '../../components/home-modules/PrototypeHomeModules.vue';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import {
  getHomeHeroBanners,
  getHomeModules,
  getHomeTopNavs,
  type ApiHomeTopNav,
  type ApiHomeHeroBanner,
  type HomeModule
} from '../../services/public-api';
import type { HomeTab } from '../../types/home';

const activeCategoryId = ref('recommend');
const activeHeroIndex = ref(0);
const isScrolled = ref(false);
const homeLoading = ref(false);
const homeError = ref<string | null>(null);
const homeHeroBanners = ref<ApiHomeHeroBanner[]>([]);
const remoteTopNavs = ref<{ id: string; label: string }[]>([]);
const navIdMap = ref<Record<string, string>>({});
const currentNavModules = ref<HomeModule[]>([]);
const getBrowserPreviewNavId = () => {
  if (typeof window === 'undefined') return '';
  const query = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(query).get('previewNav') ?? '';
};
const requestedPreviewNavId = ref(getBrowserPreviewNavId());
let channelRequestSequence = 0;
let scrollFrame: number | undefined;

const homeTabs: HomeTab[] = [
  { id: 'home', label: '首页', active: true },
  { id: 'categories', label: '分类', active: false },
  { id: 'basket', label: '菜篮', active: false },
  { id: 'mine', label: '我的', active: false }
];

const homeHeaderCategories = computed(() => remoteTopNavs.value.slice(0, 5));
const activeHeroBanner = computed(
  () => homeHeroBanners.value[activeHeroIndex.value] ?? homeHeroBanners.value[0] ?? null
);
const invalidDisplayText = (value?: string | null) =>
  !value || /^\s*\d+\s*$/.test(value) || value.trim().length < 2;
const activeChannelLabel = computed(
  () => homeHeaderCategories.value.find((item) => item.id === activeCategoryId.value)?.label ?? '推荐'
);
const heroTitle = computed(() =>
  invalidDisplayText(activeHeroBanner.value?.title)
    ? `${activeChannelLabel.value}精选`
    : activeHeroBanner.value?.title
);
const heroSubtitle = computed(() =>
  invalidDisplayText(activeHeroBanner.value?.subtitle) ? '' : activeHeroBanner.value?.subtitle
);

const lockedChannels = [
  { id: 'recommend', label: '推荐', keywords: ['recommend', '推荐', '精选'] },
  { id: 'recipe', label: '菜谱', keywords: ['recipe', '菜谱'] },
  { id: 'ingredient', label: '食材', keywords: ['ingredient', '食材'] },
  { id: 'fruit', label: '水果', keywords: ['fruit', '水果'] },
  { id: 'beverage', label: '饮品', keywords: ['beverage', 'drink', '饮品', '酒水'] }
] as const;

const channelSearchText = (item: ApiHomeTopNav) =>
  `${item.code ?? ''} ${item.name} ${item.navType} ${item.contentType ?? ''}`.toLowerCase();

const findChannelSource = (
  topNavs: ApiHomeTopNav[],
  channel: (typeof lockedChannels)[number],
  usedIds: Set<string>
) => {
  if (channel.id === 'recommend') {
    const defaultNav = topNavs.find((item) => item.isDefault && !usedIds.has(item.id));
    if (defaultNav) return defaultNav;
  }
  return topNavs.find((item) =>
    !usedIds.has(item.id) &&
    channel.keywords.some((keyword) => channelSearchText(item).includes(keyword))
  );
};

const buildLockedChannels = (homeNavs: ApiHomeTopNav[], categoryNavs: ApiHomeTopNav[]) => {
  const usedIds = new Set<string>();
  return lockedChannels.flatMap((channel) => {
    const source = channel.id === 'recommend' ? homeNavs : categoryNavs;
    const matched = findChannelSource(source, channel, usedIds);
    if (!matched) return [];
    usedIds.add(matched.id);
    navIdMap.value[channel.id] = matched.id;
    return [{ id: channel.id, label: channel.label }];
  });
};

const heroImagePosition = (focus: string) => {
  if (focus === 'left') return 'left center';
  if (focus === 'right') return 'right center';
  return 'center center';
};

const handleHeroChange = (event: { detail?: { current?: number } }) => {
  activeHeroIndex.value = Number(event.detail?.current ?? 0);
};

const handleSearchTap = () => {
  uni.navigateTo({ url: '/pages/search/index' });
};

const openNotifications = () => {
  uni.navigateTo({ url: '/pages/notifications/index' });
};

const goToHeroBannerTarget = (banner: ApiHomeHeroBanner) => {
  if (banner.link?.startsWith('/pages/')) {
    const link = banner.link.includes('-detail/index')
      ? `${banner.link}${banner.link.includes('?') ? '&' : '?'}from=home`
      : banner.link;
    uni.navigateTo({ url: link });
    return;
  }

  const routes: Record<string, string> = {
    RECIPE: '/pages/recipe-detail/index',
    INGREDIENT: '/pages/ingredient-detail/index',
    FRUIT: '/pages/fruit-detail/index',
    BEVERAGE: '/pages/beverage-detail/index',
    SEASONING: '/pages/seasoning-detail/index'
  };
  const route = routes[banner.targetType];
  if (route && banner.targetId) {
    uni.navigateTo({ url: `${route}?id=${banner.targetId}&from=home` });
  }
};

const handleCategoryChange = (categoryId: string) => {
  if (activeCategoryId.value === categoryId && currentNavModules.value.length) return;
  activeCategoryId.value = categoryId;
  activeHeroIndex.value = 0;
  const requestSequence = ++channelRequestSequence;
  const navId = navIdMap.value[categoryId] ?? categoryId;
  if (!navId) return;
  uni.pageScrollTo({ scrollTop: 0, duration: 180 });
  void loadChannel(navId, requestSequence);
};

const updateScrollState = (scrollTop: number) => {
  isScrolled.value = scrollTop > 330;
};

const browserScrollTop = () => {
  if (typeof window === 'undefined') return 0;
  return Math.max(window.scrollY || 0, document.documentElement?.scrollTop || 0, document.body?.scrollTop || 0);
};

const handleBrowserScroll = () => {
  if (scrollFrame || typeof window === 'undefined') return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = undefined;
    updateScrollState(browserScrollTop());
  });
};

onPageScroll((event) => updateScrollState(event.scrollTop));

onMounted(() => {
  if (typeof window === 'undefined') return;
  handleBrowserScroll();
  window.addEventListener('scroll', handleBrowserScroll, { passive: true });
});

onUnmounted(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('scroll', handleBrowserScroll);
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
});

const loadChannel = async (
  navId: string,
  requestSequence = channelRequestSequence,
  showLoading = true
) => {
  if (showLoading) homeLoading.value = true;
  homeError.value = null;
  try {
    const [banners, modules] = await Promise.all([
      getHomeHeroBanners(navId),
      getHomeModules(navId)
    ]);
    if (requestSequence !== channelRequestSequence) return;
    homeHeroBanners.value = banners;
    currentNavModules.value = modules;
    activeHeroIndex.value = 0;
  } catch (error) {
    if (requestSequence !== channelRequestSequence) return;
    homeHeroBanners.value = [];
    currentNavModules.value = [];
    homeError.value = error instanceof Error ? error.message : '频道内容加载失败';
  } finally {
    if (requestSequence === channelRequestSequence && showLoading) {
      homeLoading.value = false;
    }
  }
};

const loadHome = async () => {
  homeLoading.value = true;
  homeError.value = null;
  try {
    const [topNavs, categoryNavs] = await Promise.all([
      getHomeTopNavs(),
      getHomeTopNavs({ page: 'category' })
    ]);
    const defaultNav = topNavs.find((item) => item.isDefault) ?? topNavs[0];
    navIdMap.value = {};
    remoteTopNavs.value = buildLockedChannels(topNavs, categoryNavs);

    if (!defaultNav) {
      homeHeroBanners.value = [];
      currentNavModules.value = [];
      return;
    }

    const requestedChannelEntry = Object.entries(navIdMap.value)
      .find(([, navId]) => navId === requestedPreviewNavId.value);
    const initialChannelId = requestedChannelEntry?.[0] ?? 'recommend';
    const initialNavId = navIdMap.value[initialChannelId] ?? defaultNav.id;
    activeCategoryId.value = initialChannelId;
    const requestSequence = ++channelRequestSequence;
    await loadChannel(initialNavId, requestSequence, false);
  } catch (error) {
    homeError.value = error instanceof Error ? error.message : '首页加载失败';
  } finally {
    homeLoading.value = false;
  }
};

onLoad((options) => {
  const nextPreviewNavId = typeof options?.previewNav === 'string' ? options.previewNav : '';
  if (nextPreviewNavId && nextPreviewNavId !== requestedPreviewNavId.value) {
    requestedPreviewNavId.value = nextPreviewNavId;
    void loadHome();
  }
});

void loadHome();
</script>

<style scoped lang="scss">
.home-page {
  position: relative;
  padding: 0 0 calc(116px + var(--app-safe-area-bottom));
  overflow-x: hidden;
  background: var(--app-bg);
}

.home-hero-shell {
  position: relative;
  width: 100%;
  aspect-ratio: 393 / 420;
  overflow: hidden;
  background: var(--app-muted);
}

.home-hero-carousel,
.home-hero-slide,
.home-hero-image,
.home-hero-empty {
  width: 100%;
  height: 100%;
}

.home-hero-image {
  display: block;
}

.home-hero-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
}

.home-hero-shade {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(24, 25, 22, 0.24) 0%, rgba(24, 25, 22, 0.04) 46%, rgba(24, 25, 22, 0.38) 100%);
  pointer-events: none;
}

.home-search-layer {
  position: absolute;
  top: max(38px, calc(var(--app-safe-area-top) + 12px));
  right: 20px;
  left: 20px;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 10px;
}

.home-search-box,
.home-notification-button {
  border: 0.5px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.home-search-box {
  display: flex;
  min-width: 0;
  height: 48px;
  margin: 0;
  padding: 0 16px;
  flex: 1;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  color: rgba(255, 253, 252, 0.94);
}

.home-search-box text {
  overflow: hidden;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-regular);
  line-height: var(--line-body-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-notification-button {
  position: relative;
  display: flex;
  width: 48px;
  height: 48px;
  margin: 0;
  padding: 0;
  flex: 0 0 48px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: rgba(255, 253, 252, 0.96);
}

.home-search-box::after,
.home-notification-button::after,
.home-channel::after,
.home-sticky-channel::after {
  border: 0;
}

.home-notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--app-accent-warm);
}

.home-channel-bar {
  position: absolute;
  top: max(96px, calc(var(--app-safe-area-top) + 70px));
  right: 20px;
  left: 20px;
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.home-channel,
.home-sticky-channel {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 44px;
  margin: 0;
  padding: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: rgba(255, 253, 252, 0.72);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-regular);
  line-height: var(--line-body-sm);
  white-space: nowrap;
}

.home-channel.is-active {
  color: var(--text-white);
  font-weight: var(--font-semibold);
}

.home-channel.is-active::before {
  position: absolute;
  bottom: 1px;
  left: 50%;
  width: 20px;
  height: 2px;
  border-radius: 2px;
  background: var(--text-white);
  content: '';
  transform: translateX(-50%);
}

.home-hero-copy {
  position: absolute;
  right: 20px;
  bottom: 38px;
  left: 20px;
  z-index: 3;
  display: flex;
  flex-direction: column;
}

.home-hero-title {
  color: var(--text-white);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
  text-shadow: 0 2px 12px rgba(17, 17, 17, 0.22);
}

.home-hero-meta {
  margin-top: 7px;
  color: rgba(255, 253, 252, 0.86);
  font-size: var(--font-size-caption);
  font-weight: var(--font-regular);
  line-height: var(--line-caption);
}

.home-hero-dots {
  position: absolute;
  right: 14px;
  bottom: 4px;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 0;
}

.home-hero-dot {
  width: 22px;
  height: 44px;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.48);
  clip-path: inset(19.5px 4px round 3px);
  transition: clip-path 180ms cubic-bezier(0.22, 1, 0.36, 1), background 180ms ease;
}

.home-hero-dot.is-active {
  background: var(--text-white);
  clip-path: inset(19.5px 2px round 3px);
}

.home-sticky-channels {
  position: fixed;
  top: var(--app-safe-area-top);
  right: 12px;
  left: 12px;
  z-index: var(--z-sticky);
  height: 52px;
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.54);
  border-radius: 0 0 14px 14px;
}

.home-sticky-channel-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.home-sticky-channel {
  color: var(--text-tertiary);
}

.home-sticky-channel.is-active {
  color: var(--text-brand);
  font-weight: var(--font-semibold);
}

.home-content {
  min-height: 360px;
}

@media (min-width: 430px) {
  .home-page {
    max-width: 430px;
    margin: 0 auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero-dot {
    transition: none;
  }
}
</style>
