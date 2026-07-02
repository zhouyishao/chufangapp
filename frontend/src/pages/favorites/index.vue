<template>
  <view class="app-page list-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view>
        <text class="eyebrow">个人菜谱库</text>
        <text class="page-title">我的收藏</text>
      </view>
    </view>

    <view class="summary-card glass-card">
      <text class="summary-title">收藏列表</text>
      <text class="summary-desc">把常做、想试、家人喜欢的菜谱和食材放在这里。</text>
      <text class="summary-count">{{ totalCount }} 项</text>
    </view>

    <view v-if="loading" class="state-card glass-card">
      <text class="state-title">正在加载收藏</text>
      <text class="state-desc">从后端同步你的菜谱和食材收藏。</text>
    </view>

    <view v-else-if="needsLogin" class="state-card glass-card">
      <text class="state-title">登录后查看收藏</text>
      <text class="state-desc">收藏会写入后端，换设备也能继续使用。</text>
      <button class="state-action" @tap="goToLogin">去登录</button>
    </view>

    <view v-else-if="error" class="state-card glass-card">
      <text class="state-title">收藏加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="state-action" @tap="loadFavorites">重试</button>
    </view>

    <view v-else-if="!favorites.length" class="state-card glass-card">
      <text class="state-title">暂无收藏</text>
      <text class="state-desc">在菜谱或食材详情里点收藏后，会出现在这里。</text>
    </view>

    <view v-else class="section-block">
      <text class="section-title">全部收藏</text>
      <view class="recipe-list">
        <view
          v-for="item in favorites"
          :key="item.id"
          class="recipe-card glass-card"
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
          <text class="favorite-badge">已收藏</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import { listMobileFavorites } from '../../services/public-api';
import type { ApiMobileFavorite } from '../../services/public-api';

interface FavoriteItem {
  id: number;
  targetType: 'recipe' | 'ingredient';
  targetId: number;
  name: string;
  description: string;
  image: string;
  meta: string[];
}

const favorites = ref<FavoriteItem[]>([]);
const loading = ref(false);
const error = ref('');
const needsLogin = ref(false);
const totalCount = computed(() => favorites.value.length);

const toFavoriteItem = (record: ApiMobileFavorite): FavoriteItem | null => {
  if (record.recipe) {
    return {
      id: record.id,
      targetType: 'recipe',
      targetId: record.recipe.id,
      name: record.recipe.title,
      description: record.recipe.subtitle || record.recipe.description || '家庭常做菜谱',
      image: record.recipe.cover || '',
      meta: [
        record.recipe.cookTime ? `${record.recipe.cookTime} 分钟` : '菜谱',
        record.recipe.difficulty || '难度待补充'
      ]
    };
  }
  if (record.ingredient) {
    return {
      id: record.id,
      targetType: 'ingredient',
      targetId: record.ingredient.id,
      name: record.ingredient.name,
      description: record.ingredient.seasonMonth ? `时令：${record.ingredient.seasonMonth}` : '家庭常备食材',
      image: record.ingredient.cover || '',
      meta: [
        '食材',
        record.ingredient.currentPrice ? `¥${record.ingredient.currentPrice}/${record.ingredient.priceUnit || '斤'}` : '价格待补充'
      ]
    };
  }
  return null;
};

const loadFavorites = async () => {
  loading.value = true;
  error.value = '';
  needsLogin.value = false;
  try {
    const user = await syncAuthUserWithBackend(loadAuthUser());
    if (!user?.id) {
      favorites.value = [];
      needsLogin.value = true;
      return;
    }
    const data = await listMobileFavorites({ userId: user.id, page: 1, pageSize: 50 });
    favorites.value = data.list.map(toFavoriteItem).filter((item): item is FavoriteItem => item !== null);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
    favorites.value = [];
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  uni.navigateBack();
};

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' });
};

const goToItem = (item: FavoriteItem) => {
  if (item.targetType === 'recipe') {
    uni.navigateTo({ url: `/pages/recipe-detail/index?id=${item.targetId}` });
    return;
  }
  uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${item.targetId}` });
};

onShow(() => {
  void loadFavorites();
});
</script>

<style scoped lang="scss">
.list-page {
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

.back-button::after {
  border: 0;
}

.eyebrow,
.page-title,
.summary-title,
.summary-desc,
.summary-count,
.recipe-name,
.recipe-desc {
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

.summary-card {
  position: relative;
  padding: 28rpx;
  overflow: hidden;
}

.summary-title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.summary-desc {
  margin-top: 10rpx;
  padding-right: 140rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-body-sm);
}

.summary-count {
  position: absolute;
  right: 28rpx;
  bottom: 28rpx;
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
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

.favorite-badge {
  position: absolute;
  top: 24rpx;
  right: 28rpx;
  color: #7a8b6f;
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.state-card {
  margin-top: 28rpx;
  padding: 34rpx;
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

.state-action::after {
  border: 0;
}
</style>
