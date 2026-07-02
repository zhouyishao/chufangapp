<template>
  <view class="app-page search-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view class="search-box">
        <input v-model="keyword" class="search-input" placeholder="搜索菜谱、食材" confirm-type="search" @confirm="runSearch" />
      </view>
      <button class="search-button" @tap="runSearch">搜索</button>
    </view>

    <view v-if="!hasSearched" class="section glass-card">
      <view class="section-head">
        <text class="section-title">搜索历史</text>
        <button v-if="histories.length" class="clear-button" @tap="clearHistories">清空</button>
      </view>
      <view v-if="histories.length" class="history-list">
        <button v-for="item in histories" :key="item.id" class="history-chip" @tap="searchHistory(item.keyword)">
          {{ item.keyword }}
        </button>
      </view>
      <view v-else class="empty-block">
        <text>暂无搜索历史</text>
      </view>
    </view>

    <view v-if="loading" class="section glass-card">
      <text class="state-text">正在搜索...</text>
    </view>
    <view v-else-if="error" class="section glass-card">
      <text class="state-text is-error">{{ error }}</text>
      <button class="retry-button" @tap="runSearch">重试</button>
    </view>

    <template v-else-if="hasSearched">
      <view class="section glass-card">
        <text class="section-title">菜谱</text>
        <view v-if="recipes.length" class="result-list">
          <view v-for="item in recipes" :key="item.id" class="result-row" @tap="goRecipe(item.id)">
            <image class="result-image" :src="item.cover || ''" mode="aspectFill" />
            <view class="result-main">
              <text class="result-title">{{ item.title }}</text>
              <text class="result-desc">{{ item.subtitle || item.description || '查看做法和用料' }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-block"><text>没有匹配菜谱</text></view>
      </view>

      <view class="section glass-card">
        <text class="section-title">食材</text>
        <view v-if="ingredients.length" class="result-list">
          <view v-for="item in ingredients" :key="item.id" class="result-row" @tap="goIngredient(item.id)">
            <image class="result-image" :src="item.cover || ''" mode="aspectFill" />
            <view class="result-main">
              <text class="result-title">{{ item.name }}</text>
              <text class="result-desc">{{ item.seasonMonth ? `${item.seasonMonth}月时令` : '查看营养、挑选和储存建议' }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-block"><text>没有匹配食材</text></view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import {
  clearMobileSearchHistories,
  listMobileSearchHistories,
  searchMobileContent,
  type ApiIngredientListItem,
  type ApiRecipeListItem,
  type ApiSearchHistory
} from '../../services/public-api';

const keyword = ref('');
const histories = ref<ApiSearchHistory[]>([]);
const recipes = ref<ApiRecipeListItem[]>([]);
const ingredients = ref<ApiIngredientListItem[]>([]);
const loading = ref(false);
const error = ref('');
const hasSearched = ref(false);

const getUserId = async () => {
  const user = await syncAuthUserWithBackend(loadAuthUser());
  return user?.id ?? null;
};

const loadHistories = async () => {
  const userId = await getUserId();
  if (!userId) {
    histories.value = [];
    return;
  }
  const data = await listMobileSearchHistories({ userId, page: 1, pageSize: 20 });
  histories.value = data.list;
};

const runSearch = async () => {
  const q = keyword.value.trim();
  if (!q) {
    uni.showToast({ title: '请输入关键词', icon: 'none' });
    return;
  }
  loading.value = true;
  error.value = '';
  hasSearched.value = true;
  try {
    const userId = await getUserId();
    const data = await searchMobileContent({ q, userId: userId ?? undefined });
    recipes.value = data.recipes;
    ingredients.value = data.ingredients;
    await loadHistories();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '搜索失败';
  } finally {
    loading.value = false;
  }
};

const searchHistory = (value: string) => {
  keyword.value = value;
  void runSearch();
};

const clearHistories = async () => {
  const userId = await getUserId();
  if (!userId) return;
  await clearMobileSearchHistories(userId);
  histories.value = [];
};

const goBack = () => {
  uni.navigateBack();
};

const goRecipe = (id: string) => {
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${id}` });
};

const goIngredient = (id: number) => {
  uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${id}` });
};

onShow(() => {
  void loadHistories().catch(() => undefined);
});
</script>

<style scoped lang="scss">
.search-page {
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: grid;
  grid-template-columns: 72rpx 1fr 96rpx;
  align-items: center;
  gap: 14rpx;
}

.nav-button,
.search-button,
.clear-button,
.history-chip,
.retry-button {
  border: 0;
}

.nav-button {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--app-surface-strong);
  color: var(--app-text);
}

.search-box {
  height: 72rpx;
  padding: 0 24rpx;
  border: 1rpx solid var(--app-border);
  border-radius: 28rpx;
  background: var(--app-surface-strong);
}

.search-input {
  width: 100%;
  height: 72rpx;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
}

.search-button {
  height: 72rpx;
  border-radius: 24rpx;
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-tag);
}

.section {
  margin-top: 22rpx;
  padding: 26rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.clear-button {
  background: transparent;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 20rpx;
}

.history-chip {
  height: 58rpx;
  padding: 0 22rpx;
  border-radius: 20rpx;
  background: var(--app-accent-soft);
  color: var(--app-text);
  font-size: var(--font-size-tag);
}

.result-list {
  display: grid;
  gap: 18rpx;
  margin-top: 20rpx;
}

.result-row {
  display: flex;
  gap: 18rpx;
}

.result-image {
  width: 132rpx;
  height: 104rpx;
  border-radius: 22rpx;
  background: var(--app-accent-soft);
}

.result-main {
  min-width: 0;
  flex: 1;
}

.result-title,
.result-desc,
.state-text,
.empty-block {
  display: block;
}

.result-title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
}

.result-desc,
.empty-block,
.state-text {
  margin-top: 8rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.is-error {
  color: var(--app-danger);
}

.retry-button {
  margin-top: 18rpx;
  background: var(--app-accent-soft);
  color: var(--app-text);
}
</style>
