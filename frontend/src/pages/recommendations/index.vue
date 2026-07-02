<template>
  <view class="app-page rec-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view>
        <text class="eyebrow">推荐内容</text>
        <text class="page-title">{{ pageTitle }}</text>
      </view>
    </view>

    <view v-if="loading" class="state-card glass-card">
      <text class="state-title">正在加载推荐</text>
      <text class="state-desc">从后端获取推荐内容与菜谱列表。</text>
    </view>

    <view v-else-if="externalUrl" class="summary-card glass-card">
      <text class="summary-title">{{ externalTitle }}</text>
      <text class="summary-desc">这是外部跳转内容，当前页面保留一个可直接打开的入口。</text>
      <button class="summary-action" @tap="openExternalUrl">打开链接</button>
    </view>

    <view v-else-if="error" class="state-card glass-card">
      <text class="state-title">推荐加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="state-action" @tap="loadRecommendations">重试</button>
    </view>

    <view v-else-if="!items.length" class="state-card glass-card">
      <text class="state-title">暂无推荐内容</text>
      <text class="state-desc">当前导航下还没有配置内容。</text>
    </view>

    <view v-else class="section-block">
      <text class="section-title">内容列表</text>
      <view class="card-list">
        <view v-for="item in items" :key="item.id" class="content-card glass-card" @tap="goToItem(item)">
          <image class="content-image" :src="item.cover" mode="aspectFill" />
          <view class="content-body">
            <text class="content-title">{{ item.title }}</text>
            <text class="content-desc">{{ item.desc }}</text>
            <view class="content-meta">
              <text v-for="meta in item.meta" :key="meta">{{ meta }}</text>
            </view>
          </view>
          <app-icon class="arrow" name="chevron-right" size="22rpx" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { getHome, getHomeTopNavContents, listRecipes, type ApiHomeTopNavContent, type ApiRecipeListItem } from '../../services/public-api';
import { resolveAssetUrl } from '../../services/public-api';

type RecommendationItem =
  | { id: string; type: 'recipe'; title: string; desc: string; cover: string; meta: string[]; targetId: string }
  | { id: string; type: 'link'; title: string; desc: string; cover: string; meta: string[]; targetUrl: string };

const loading = ref(false);
const error = ref('');
const navId = ref('');
const externalUrl = ref('');
const externalTitle = ref('推荐链接');
const items = ref<RecommendationItem[]>([]);

const pageTitle = computed(() => {
  if (externalUrl.value) return externalTitle.value;
  return navId.value ? '栏目推荐' : '今日推荐';
});

const parseLocation = () => {
  if (typeof window === 'undefined') return {};
  const hash = window.location.hash;
  const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  const params = new URLSearchParams(queryText);
  return {
    id: params.get('id') ?? '',
    navId: params.get('navId') ?? '',
    url: params.get('url') ?? '',
    title: params.get('title') ?? ''
  };
};

const normalizeRecipe = (item: ApiRecipeListItem): RecommendationItem => ({
  id: String(item.id),
  type: 'recipe',
  title: item.title,
  desc: item.subtitle || item.description || '推荐菜谱',
  cover: resolveAssetUrl(item.cover),
  meta: [
    item.cookTime ? `${item.cookTime} 分钟` : '时令推荐',
    item.difficulty || '难度待补充'
  ],
  targetId: item.id
});

const normalizeTopNavContent = (content: ApiHomeTopNavContent): RecommendationItem[] => {
  return content.items.map((item) => ({
    id: String(item.id),
    type: 'recipe',
    title: item.title,
    desc: [item.duration, item.difficulty, item.calorie].filter(Boolean).join(' · ') || content.navName,
    cover: resolveAssetUrl(item.coverUrl),
    meta: [content.navName, content.moreButtonText],
    targetId: item.id
  }));
};

const loadRecommendations = async () => {
  loading.value = true;
  error.value = '';
  try {
    const parsed = parseLocation();
    navId.value = String(parsed.id || parsed.navId || '');
    externalUrl.value = String(parsed.url || '');
    externalTitle.value = String(parsed.title || '推荐内容');
    if (externalUrl.value && !externalUrl.value.startsWith('/pages/')) {
      items.value = [];
      return;
    }

    if (navId.value) {
      const content = await getHomeTopNavContents(navId.value, { page: 1, pageSize: 20 });
      items.value = normalizeTopNavContent(content);
      return;
    }

    const home = await getHome();
    items.value = home.recommendRecipes.slice(0, 8).map((item) => normalizeRecipe({
      id: String(item.id),
      legacyId: item.id,
      title: item.title,
      subtitle: item.subtitle,
      cover: item.cover,
      description: item.description,
      cookTime: item.cookTime,
      servings: null,
      difficulty: item.difficulty,
      taste: null,
      scene: null,
      viewCount: item.viewCount,
      favoriteCount: item.favoriteCount,
      commentCount: 0,
      createdAt: item.updatedAt,
      updatedAt: item.updatedAt
    }));
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const goBack = () => uni.navigateBack();

const openExternalUrl = () => {
  if (!externalUrl.value) return;
  if (typeof window !== 'undefined') window.location.href = externalUrl.value;
};

const goToItem = (item: RecommendationItem) => {
  if (item.type === 'recipe') {
    uni.navigateTo({ url: `/pages/recipe-detail/index?id=${encodeURIComponent(item.targetId)}` });
    return;
  }
  if (item.targetUrl.startsWith('/pages/')) {
    uni.navigateTo({ url: item.targetUrl });
  } else if (typeof window !== 'undefined') {
    window.location.href = item.targetUrl;
  }
};

onLoad(() => {
  void loadRecommendations();
});

onMounted(() => {
  void loadRecommendations();
});
</script>

<style scoped lang="scss">
.rec-page {
  min-height: 100vh;
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border: 0;
  border-radius: 50%;
  background: #fffdfc;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
}

.back-button::after,
.summary-action::after,
.state-action::after {
  border: 0;
}

.eyebrow,
.page-title,
.summary-title,
.summary-desc,
.state-title,
.state-desc,
.section-title,
.content-title,
.content-desc {
  display: block;
}

.eyebrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.page-title {
  margin-top: 4rpx;
  color: var(--app-text);
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
}

.summary-card,
.state-card {
  padding: 28rpx;
}

.summary-title {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.summary-desc,
.state-desc {
  margin-top: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.summary-action,
.state-action {
  margin-top: 18rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: #7a8b6f;
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.section-block {
  margin-top: 8rpx;
}

.section-title {
  margin: 18rpx 2rpx 12rpx;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.card-list {
  display: grid;
  gap: 16rpx;
}

.content-card {
  display: grid;
  grid-template-columns: 160rpx 1fr 28rpx;
  gap: 18rpx;
  align-items: center;
  padding: 16rpx;
}

.content-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 26rpx;
  background: var(--app-surface-strong);
}

.content-body {
  min-width: 0;
}

.content-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.content-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.content-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
}

.arrow {
  color: var(--app-text-tertiary);
  font-size: 36rpx;
}
</style>
