<template>
  <view class="app-page home-page">
    <!-- ====== 一体化 Hero 区域：轮播图 + 悬浮搜索框 + 悬浮 Tab ====== -->
    <view class="home-hero" :style="{ height: '500px' }">
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

      <view class="home-header-rect" :style="{ opacity: headerOverlayOpacity }" />

      <!-- 搜索框悬浮层 -->
      <view class="home-hero__search">
        <view class="hero-search-bar" @tap="handleSearchTap">
          <app-icon class="hero-search-icon" name="search" size="18px" />
          <text class="hero-search-placeholder">搜索菜谱、食材、做法</text>
        </view>
        <button class="hero-add-btn" @tap="openHeroActionSheet">
          <app-icon class="hero-add-icon" name="plus" size="22px" />
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
        class="top-tabs-scroll"
        @scroll="handleTopTabsScroll"
      >
        <view class="top-tabs-row">
          <view
            v-for="cat in homeHeaderCategories"
            :id="getTopTabId(cat.id)"
            :key="cat.id"
            :class="['top-tab', { active: activeCategoryId === cat.id }]"
            :style="getTopTabStyle(cat.id)"
            @tap="handleCategoryChange(cat.id)"
          >
            {{ cat.label }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- ====== 内容模块区域 ====== -->
    <view class="home-content">
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

      <!-- 后台配置的内容模块（优先展示） -->
      <HomeModuleRenderer :modules="currentNavModules" />

      <section-block
        v-if="isRecommendCategory && !currentNavModules.length"
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
        v-if="isRecommendCategory && !currentNavModules.length"
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

      <view v-if="!isRecommendCategory && !currentNavModules.length" :class="['topic-recipe-list', `topic-recipe-list--${activeCategoryId}`]">
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

    <!-- ====== 加号按钮弹出菜单 ====== -->
    <view v-if="isActionSheetVisible" class="dropdown-mask" @tap="closeActionSheet">
      <view class="action-dropdown" @tap.stop>
        <view class="add-action-list">
          <view class="add-action" @tap="scanCode">
            <view class="add-action__icon">
              <app-icon name="scan" size="28rpx" />
            </view>
            <view>
              <text class="add-action__title">扫一扫</text>
            </view>
          </view>
          <view class="add-action" @tap="addRecipe">
            <view class="add-action__icon">
              <app-icon name="plus" size="28rpx" />
            </view>
            <view>
              <text class="add-action__title">添加菜谱</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { onPageScroll } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import HomeModuleRenderer from '../../components/home-modules/HomeModuleRenderer.vue';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import SectionBlock from '../../components/home/section-block.vue';
import { getHome, getHomeHeroBanners, getHomeModules, getHomeTopNavContents, getHomeTopNavs, listMobileBasketItems, listMobileViewHistories, type ApiHomeHeroBanner, type HomeModule } from '../../services/public-api';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import type { HomeTab, QuickAction, RecipeCard } from '../../types/home';
import type { Ingredient } from '../../types/ingredient';

const activeCategoryId = ref('recommend');
const isScrolled = ref(false);
const headerScrollProgress = ref(0);
let scrollFallbackTimer: ReturnType<typeof setInterval> | undefined;
const isActionSheetVisible = ref(false);
const homeTabs: HomeTab[] = [
  { id: 'home', label: '首页', active: true },
  { id: 'categories', label: '分类', active: false },
  { id: 'basket', label: '菜篮子', active: false },
  { id: 'mine', label: '我的', active: false }
];
const baseQuickActions: QuickAction[] = [
  {
    id: 'basket',
    title: '菜篮子',
    subtitle: '整理当前后端菜篮子',
    badge: '0 项'
  },
  {
    id: 'browse',
    title: '最近浏览',
    subtitle: '查看账号浏览记录',
    badge: '0 条'
  }
];

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
const homeHeroBanners = ref<ApiHomeHeroBanner[]>([]);
const remoteTopNavs = ref<{ id: string; label: string }[]>([]);
const remoteTopNavRecipes = ref<Record<string, RecipeCard[]>>({});
const remoteTopNavMeta = ref<Record<string, { label: string; moreButtonText?: string }>>({});
const quickActionStats = ref<{ basketCount: number; browseCount: number }>({ basketCount: 0, browseCount: 0 });
// categoryId → 实际 navId（用于轮播图 API 请求）
const navIdMap = ref<Record<string, string>>({});
const currentNavModules = ref<HomeModule[]>([]);
const quickActions = computed(() => baseQuickActions.map((action) => {
  if (action.id === 'basket') {
    return { ...action, badge: `${quickActionStats.value.basketCount} 项` };
  }
  if (action.id === 'browse') {
    return { ...action, badge: `${quickActionStats.value.browseCount} 条` };
  }
  return action;
}));

const currentRecipes = computed(() => {
  if (activeCategoryId.value === 'recommend' && remoteRecipes.value) return remoteRecipes.value;
  if (remoteTopNavRecipes.value[activeCategoryId.value]) return remoteTopNavRecipes.value[activeCategoryId.value];
  return [];
});
const currentMenuTitle = computed(() => remoteTopNavMeta.value[activeCategoryId.value]?.label ?? categoryMeta[activeCategoryId.value]?.title ?? '家常菜单');
const currentMenuSubtitle = computed(() => (
  remoteTopNavMeta.value[activeCategoryId.value]
    ? '后台配置的首页顶部导航内容'
    : categoryMeta[activeCategoryId.value]?.subtitle ?? '做法清楚、节奏轻松，适合日常反复使用'
));
const seasonalIngredients = computed(() => {
  if (remoteSeasonalIngredients.value) return remoteSeasonalIngredients.value;
  return [];
});
const isRecommendCategory = computed(() => activeCategoryId.value === 'recommend');
const homeHeaderCategories = computed(() => {
  if (remoteTopNavs.value.length > 0) return remoteTopNavs.value;
  return [{ id: 'recommend', label: '推荐' }, ...remoteHomeCategories.value];
});
const normalizeTabId = (categoryId: string) => categoryId.replace(/[^a-zA-Z0-9_-]/g, '_');
const getTopTabId = (categoryId: string) => `top_tab_${normalizeTabId(categoryId)}`;
const getStickyTabId = (categoryId: string) => `sticky_tab_${normalizeTabId(categoryId)}`;
const activeTopTabIntoView = computed(() => getTopTabId(activeCategoryId.value));
const activeStickyTabIntoView = computed(() => getStickyTabId(activeCategoryId.value));
const headerOverlayOpacity = computed(() => String(headerScrollProgress.value));
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

const mix = (from: number, to: number, progress: number) => Math.round(from + (to - from) * progress);
const getTopTabStyle = (categoryId: string) => {
  const progress = headerScrollProgress.value;
  const isActive = categoryId === activeCategoryId.value;
  const from = isActive
    ? { r: 255, g: 253, b: 252, a: 1 }
    : { r: 255, g: 253, b: 252, a: 0.56 };
  const to = isActive
    ? { r: 122, g: 139, b: 111, a: 1 }
    : { r: 183, g: 174, b: 161, a: 1 };
  return {
    color: `rgba(${mix(from.r, to.r, progress)}, ${mix(from.g, to.g, progress)}, ${mix(from.b, to.b, progress)}, ${(from.a + (to.a - from.a) * progress).toFixed(3)})`
  };
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

const openHeroActionSheet = () => {
  isActionSheetVisible.value = true;
};

const closeActionSheet = () => {
  isActionSheetVisible.value = false;
};

const scanCode = () => {
  closeActionSheet();
  uni.navigateTo({ url: '/pages/scan/index' });
};

const addRecipe = () => {
  closeActionSheet();
  uni.navigateTo({ url: '/pages/my-recipes/index' });
};

// ====== 分类切换 ======
const handleCategoryChange = (categoryId: string) => {
  activeCategoryId.value = categoryId;
  void centerActiveTab('top');
  void centerActiveTab('sticky');
  if (categoryId !== 'recommend' && remoteTopNavMeta.value[categoryId] && !remoteTopNavRecipes.value[categoryId]) {
    void loadTopNavContents(categoryId);
  }
  // 切换Tab时重新加载对应导航的轮播图和内容模块
  const navId = navIdMap.value[categoryId] ?? categoryId;
  if (navId) {
    void getHomeHeroBanners(navId).then((banners) => {
      homeHeroBanners.value = banners;
    }).catch(() => {
      homeHeroBanners.value = [];
    });
    void loadCurrentModules(navId);
  } else {
    currentNavModules.value = [];
  }
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

const updateHeaderScrollState = (scrollTop: number) => {
  const progress = Math.min(Math.max(scrollTop / 80, 0), 1);
  headerScrollProgress.value = Number(progress.toFixed(3));
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
  updateHeaderScrollState(getBrowserScrollTop());
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
  scrollFallbackTimer = setInterval(handleBrowserScroll, 120);
});

onUnmounted(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('scroll', handleBrowserScroll);
  document.removeEventListener('scroll', handleCapturedScroll, true);
  if (scrollFallbackTimer) {
    clearInterval(scrollFallbackTimer);
    scrollFallbackTimer = undefined;
  }
});

// ====== 数据加载 ======
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
    image: item.cover ?? '',
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
    image: item.coverUrl ?? '',
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
    image: item.cover ?? '',
    tags: ['推荐'],
    category: 'recommend',
    month
  } satisfies Ingredient;
};

const loadHome = async () => {
  homeLoading.value = true;
  homeError.value = null;
  try {
    const topNavs = await getHomeTopNavs();
    const defaultNav = topNavs.find((item) => item.isDefault) ?? topNavs[0];
    if (defaultNav) homeHeroBanners.value = await getHomeHeroBanners(defaultNav.id);
    const data = await getHome();
    remoteRecipes.value = data.recommendRecipes.map(mapRecipeCard);
    remoteSeasonalIngredients.value = data.recommendIngredients.map(mapIngredientCard);
    remoteHomeCategories.value = data.recipeCategories.map((category) => ({ id: `category_${category.id}`, label: category.name }));
    remoteTopNavs.value = topNavs.map((item) => ({ id: item.isDefault ? 'recommend' : item.id, label: item.name }));
    navIdMap.value = topNavs.reduce<Record<string, string>>((memo, item) => {
      memo[item.isDefault ? 'recommend' : item.id] = item.id;
      return memo;
    }, {});
    remoteTopNavMeta.value = topNavs.reduce<Record<string, { label: string }>>((memo, item) => {
      memo[item.isDefault ? 'recommend' : item.id] = { label: item.name };
      return memo;
    }, {});
    if (defaultNav) activeCategoryId.value = defaultNav.isDefault ? 'recommend' : defaultNav.id;
    if (defaultNav) void loadTopNavContents(defaultNav.id, defaultNav.isDefault);
    if (defaultNav) void loadCurrentModules(defaultNav.id);
    const user = await syncAuthUserWithBackend(loadAuthUser());
    if (user?.id) {
      const [basketData, viewData] = await Promise.all([
        listMobileBasketItems({ userId: user.id, page: 1, pageSize: 1 }),
        listMobileViewHistories({ userId: user.id, page: 1, pageSize: 1 })
      ]);
      quickActionStats.value = {
        basketCount: basketData.total ?? basketData.list.length,
        browseCount: viewData.total ?? viewData.list.length
      };
    } else {
      quickActionStats.value = { basketCount: 0, browseCount: 0 };
    }
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

const loadCurrentModules = async (navId: string) => {
  try {
    const modules = await getHomeModules(navId);
    currentNavModules.value = modules;
  } catch {
    currentNavModules.value = [];
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

.home-header-rect {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 998;
  width: 100vw;
  height: 152px;
  background: #f5f1ea;
  pointer-events: none;
  transition: opacity 120ms linear;
}

/* ====== Hero 容器 ====== */
.home-hero {
  position: relative;
  width: 100vw;
  margin: 0 -32rpx;
  overflow: hidden;
}

/* ====== 轮播图 ====== */
.home-hero__carousel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 500px;
  z-index: 1;
}

.home-hero__swiper,
.home-hero__item,
.home-hero__image {
  width: 100%;
  height: 500px;
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
  top: 58px;
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
  border-radius: 23px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 253, 252, 0.68);
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

.hero-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 253, 252, 0.68);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  color: var(--text-primary);
  padding: 0;
  transition: background 180ms ease, border-color 180ms ease;
}

.hero-add-btn::after {
  border: 0;
}

.hero-add-icon {
  color: currentColor;
}

/* ====== Tab 悬浮层 ====== */
.top-tabs-scroll {
  position: fixed;
  left: 24px;
  top: 120px;
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
  align-items: flex-start;
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
  width: 393px;
  max-width: 100vw;
  z-index: 999;
  opacity: 0;
  border-bottom: 1px solid rgba(183, 174, 161, 0.18);
  background: rgba(245, 241, 234, 0.88);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  box-shadow: none;
  padding: calc(env(safe-area-inset-top, 0) + 8px) 16px 8px;
  transition: opacity 180ms ease, background 180ms ease, border-color 180ms ease;
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
  height: 36px;
  white-space: nowrap;
  margin-top: 12px;
  overflow: hidden;
}

.sticky-tabs-row {
  display: inline-flex;
  align-items: center;
  gap: 32px;
  min-width: 100%;
  width: max-content;
  height: 36px;
  padding: 0;
}

.sticky-tab {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  height: 36px;
  background: transparent;
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

/* ====== 内容区域 ====== */
.home-content {
  padding-top: 0;
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
