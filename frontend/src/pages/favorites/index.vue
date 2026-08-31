<template>
  <view class="app-page list-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="page-title">我的收藏</text>
      <view class="topbar-spacer" />
    </view>

    <view v-if="loading" class="state-card">
      <text class="state-title">正在加载收藏</text>
      <text class="state-desc">正在同步收藏记录。</text>
    </view>

    <view v-else-if="needsLogin" class="state-card">
      <text class="state-title">登录后查看收藏</text>
      <text class="state-desc">收藏会写入后端，换设备也能继续使用。</text>
      <button class="state-action" @tap="goToLogin">去登录</button>
    </view>

    <view v-else-if="error" class="state-card">
      <text class="state-title">收藏加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="state-action" @tap="loadFavorites">重试</button>
    </view>

    <view v-else-if="!favorites.length" class="state-card state-card--empty">
      <text class="state-title">暂无收藏</text>
      <text class="state-desc">看到喜欢的菜谱或食材，点一下收藏就能随时回来查看。</text>
      <button class="state-action" @tap="goExplore">去首页看看</button>
    </view>

    <view v-else class="section-block">
      <text class="section-title">全部收藏</text>
      <view class="recipe-list">
        <view
          v-for="item in favorites"
          :key="item.id"
          class="recipe-card"
          @tap="goToItem(item)"
        >
          <image class="recipe-image" :src="item.image" mode="aspectFill" />
          <view class="recipe-body">
            <text class="recipe-name">{{ item.name }}</text>
            <text class="recipe-desc">{{ item.description }}</text>
            <view class="recipe-meta">
              <text v-for="meta in item.meta" :key="meta">{{ meta }}</text>
            </view>
          </view>
          <button
            class="favorite-remove"
            :disabled="removingIds.includes(item.id)"
            aria-label="取消收藏"
            @tap.stop="removeFavorite(item)"
          >
            <app-icon name="heart-filled" size="22rpx" />
          </button>
        </view>
      </view>
      <view v-if="loadingMore" class="list-status">正在加载更多</view>
      <view v-else-if="!hasMore" class="list-status">已经到底了</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onReachBottom, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import { deleteMobileFavorite, listMobileFavorites } from '../../services/public-api';
import type { ApiMobileFavorite } from '../../services/public-api';

interface FavoriteItem {
  id: number;
  targetType: ApiMobileFavorite['targetType'];
  targetId: string;
  name: string;
  description: string;
  image: string;
  meta: string[];
}

const favorites = ref<FavoriteItem[]>([]);
const loading = ref(false);
const error = ref('');
const needsLogin = ref(false);
const removingIds = ref<number[]>([]);
const totalCount = ref(0);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(false);
const loadingMore = ref(false);

const guardPrivatePage = () => {
  if (loadAuthUser()) return true;
  uni.reLaunch({ url: '/pages/phone-login/index' });
  return false;
};

guardPrivatePage();

const toFavoriteItem = (record: ApiMobileFavorite): FavoriteItem | null => {
  if (record.targetType === 'RECIPE' && record.recipe) {
    return {
      id: record.id,
      targetType: 'RECIPE',
      targetId: String(record.recipe.id),
      name: record.recipe.title,
      description: record.recipe.subtitle || record.recipe.description || '家庭常做菜谱',
      image: record.recipe.cover || '',
      meta: [
        record.recipe.cookTime ? `${record.recipe.cookTime} 分钟` : '菜谱',
        record.recipe.difficulty || '难度待补充'
      ]
    };
  }
  if (
    (record.targetType === 'INGREDIENT' || record.targetType === 'FRUIT' || record.targetType === 'SEASONING')
    && record.ingredient
  ) {
    const typeLabel = record.targetType === 'FRUIT' ? '水果' : record.targetType === 'SEASONING' ? '调料' : '食材';
    return {
      id: record.id,
      targetType: record.targetType,
      targetId: String(record.ingredient.id),
      name: record.ingredient.name,
      description: record.ingredient.seasonMonth ? `时令：${record.ingredient.seasonMonth}` : typeLabel,
      image: record.ingredient.cover || '',
      meta: [
        typeLabel,
        record.ingredient.currentPrice ? `¥${record.ingredient.currentPrice}/${record.ingredient.priceUnit || '斤'}` : '价格待补充'
      ]
    };
  }
  if (record.targetType === 'BEVERAGE' && record.beverage) {
    return {
      id: record.id,
      targetType: 'BEVERAGE',
      targetId: String(record.beverage.id),
      name: record.beverage.name,
      description: record.beverage.beverageType || '饮品',
      image: record.beverage.cover || '',
      meta: ['饮品', record.beverage.alcoholDegree || '基础信息']
    };
  }
  return null;
};

const fetchFavorites = async (nextPage: number, append = false) => {
  if (!guardPrivatePage()) return;
  if (append) loadingMore.value = true;
  else loading.value = true;
  error.value = '';
  needsLogin.value = false;
  try {
    const user = await syncAuthUserWithBackend(loadAuthUser());
    if (!user?.id) {
      favorites.value = [];
      totalCount.value = 0;
      needsLogin.value = true;
      return;
    }
    const data = await listMobileFavorites({ userId: user.id, page: nextPage, pageSize });
    const mapped = data.list.map(toFavoriteItem).filter((item): item is FavoriteItem => item !== null);
    favorites.value = append ? [...favorites.value, ...mapped] : mapped;
    totalCount.value = data.total;
    page.value = data.page;
    hasMore.value = data.page * data.pageSize < data.total;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
    if (!append) {
      favorites.value = [];
      totalCount.value = 0;
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const loadFavorites = () => fetchFavorites(1);

const goBack = () => {
  uni.navigateBack();
};

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' });
};

const goExplore = () => {
  uni.reLaunch({ url: '/pages/index/index' });
};

const goToItem = (item: FavoriteItem) => {
  const routeByType: Record<FavoriteItem['targetType'], string> = {
    RECIPE: '/pages/recipe-detail/index',
    INGREDIENT: '/pages/ingredient-detail/index',
    FRUIT: '/pages/fruit-detail/index',
    BEVERAGE: '/pages/beverage-detail/index',
    SEASONING: '/pages/seasoning-detail/index'
  };
  uni.navigateTo({ url: `${routeByType[item.targetType]}?id=${encodeURIComponent(item.targetId)}` });
};

const removeFavorite = async (item: FavoriteItem) => {
  if (removingIds.value.includes(item.id)) return;
  removingIds.value = [...removingIds.value, item.id];
  try {
    await deleteMobileFavorite(item.id);
    favorites.value = favorites.value.filter((entry) => entry.id !== item.id);
    totalCount.value = Math.max(0, totalCount.value - 1);
    uni.showToast({ title: '已取消收藏', icon: 'none' });
  } catch (err) {
    uni.showToast({ title: err instanceof Error ? err.message : '取消收藏失败', icon: 'none' });
  } finally {
    removingIds.value = removingIds.value.filter((id) => id !== item.id);
  }
};

onShow(() => {
  if (!guardPrivatePage()) return;
  void loadFavorites();
});

onLoad(() => {
  if (!guardPrivatePage()) return;
});

onReachBottom(() => {
  if (!loading.value && !loadingMore.value && hasMore.value) {
    void fetchFavorites(page.value + 1, true);
  }
});
</script>

<style scoped lang="scss">
.list-page {
  min-height: 100vh;
  padding-bottom: calc(80rpx + var(--app-safe-area-bottom));
}

.topbar {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
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

.back-button::after {
  border: 0;
}

.page-title,
.recipe-name,
.recipe-desc {
  display: block;
}

.page-title {
  color: var(--app-text);
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
  text-align: center;
}

.topbar-spacer {
  width: 72rpx;
  height: 72rpx;
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.section-block {
  margin-top: 28rpx;
}

.section-title {
  display: block;
  margin-bottom: 18rpx;
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.recipe-card {
  position: relative;
  display: flex;
  gap: 18rpx;
  padding: 18rpx 76rpx 18rpx 18rpx;
  border: 1rpx solid var(--app-border);
  border-radius: var(--app-radius-card);
  background: var(--app-surface);
}

.recipe-image {
  width: 160rpx;
  height: 160rpx;
  flex: 0 0 auto;
  border-radius: 28rpx;
}

.recipe-body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
}

.recipe-name {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.recipe-desc {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-body-sm);
}

.recipe-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 14rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
}

.favorite-remove {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88rpx;
  min-height: 88rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--app-radius-button);
  background: rgba(255, 253, 252, 0.9);
  color: var(--text-brand);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
  line-height: var(--line-tabbar);
}

.favorite-remove::after {
  border: 0;
}

.state-card {
  margin-top: 28rpx;
  padding: 34rpx;
  border: 1rpx solid var(--app-border);
  border-radius: var(--app-radius-card);
  background: var(--app-surface);
}

.state-card--empty {
  padding: 64rpx 34rpx;
  text-align: center;
}

.state-title,
.state-desc {
  display: block;
}

.state-title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.state-desc {
  margin-top: 12rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.state-action {
  margin-top: 24rpx;
  width: 180rpx;
  height: 64rpx;
  border: 0;
  border-radius: 999rpx;
  background: #7a8b6f;
  color: #fffdfc;
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.state-card--empty .state-action {
  margin-right: auto;
  margin-left: auto;
}

.state-action::after {
  border: 0;
}

.list-status {
  padding: 28rpx 0 10rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
  text-align: center;
}
</style>
