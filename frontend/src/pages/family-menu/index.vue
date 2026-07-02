<template>
  <view class="app-page family-menu-page">
    <view class="topbar">
      <button class="back-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view>
        <text class="eyebrow">家庭菜单</text>
        <text class="page-title">家庭招待菜单</text>
      </view>
    </view>

    <view v-if="loading" class="state-card glass-card">
      <text class="state-title">正在加载家庭菜单</text>
      <text class="state-desc">从真实家庭和菜谱数据里生成建议。</text>
    </view>

    <view v-else-if="needsLogin" class="state-card glass-card">
      <text class="state-title">登录后查看家庭菜单</text>
      <text class="state-desc">家庭偏好与共享菜谱会从后端读取。</text>
      <button class="state-action" @tap="goToLogin">去登录</button>
    </view>

    <view v-else-if="error" class="state-card glass-card">
      <text class="state-title">家庭菜单加载失败</text>
      <text class="state-desc">{{ error }}</text>
      <button class="state-action" @tap="loadFamilyMenu">重试</button>
    </view>

    <view v-else>
      <view class="summary-card glass-card">
        <text class="summary-title">{{ familyName }}</text>
        <text class="summary-desc">{{ summaryText }}</text>
        <view class="summary-meta">
          <text>{{ memberCount }} 位成员</text>
          <text>{{ preferenceCount }} 条偏好</text>
          <text>{{ recipeCount }} 道推荐菜</text>
        </view>
      </view>

      <view class="section-block">
        <text class="section-title">家庭偏好</text>
        <view class="chip-list">
          <view v-for="chip in preferenceChips" :key="chip" class="chip-card glass-card">
            <text class="chip-text">{{ chip }}</text>
          </view>
        </view>
      </view>

      <view class="section-block">
        <text class="section-title">菜单建议</text>
        <view class="card-list">
          <view v-for="recipe in menuRecipes" :key="recipe.id" class="recipe-card glass-card" @tap="goToRecipe(recipe.id)">
            <image class="recipe-image" :src="recipe.cover" mode="aspectFill" />
            <view class="recipe-body">
              <text class="recipe-title">{{ recipe.title }}</text>
              <text class="recipe-desc">{{ recipe.desc }}</text>
              <view class="recipe-meta">
                <text v-for="meta in recipe.meta" :key="meta">{{ meta }}</text>
              </view>
            </view>
            <app-icon class="arrow" name="chevron-right" size="22rpx" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import { loadFamilies } from '../../services/family';
import { getHome, type ApiRecipeListItem } from '../../services/public-api';
import { resolveAssetUrl } from '../../services/public-api';

interface MenuRecipe {
  id: string;
  title: string;
  desc: string;
  cover: string;
  meta: string[];
}

const loading = ref(false);
const error = ref('');
const needsLogin = ref(false);
const familyName = ref('家庭菜单');
const memberCount = ref(0);
const preferenceCount = ref(0);
const recipeCount = ref(0);
const summaryText = ref('从当前家庭偏好与时令推荐里生成一份更合适的菜单。');
const preferenceChips = ref<string[]>([]);
const menuRecipes = ref<MenuRecipe[]>([]);

const toMenuRecipe = (item: ApiRecipeListItem): MenuRecipe => ({
  id: String(item.id),
  title: item.title,
  desc: item.subtitle || item.description || '家庭菜单推荐',
  cover: resolveAssetUrl(item.cover),
  meta: [
    item.cookTime ? `${item.cookTime} 分钟` : '菜单建议',
    item.servings ? `${item.servings} 人份` : '份量待补充'
  ]
});

const loadFamilyMenu = async () => {
  loading.value = true;
  error.value = '';
  needsLogin.value = false;
  try {
    const user = await syncAuthUserWithBackend(loadAuthUser());
    if (!user?.id) {
      needsLogin.value = true;
      menuRecipes.value = [];
      return;
    }

    const families = await loadFamilies();
    const family = families[0];
    if (!family) {
      familyName.value = '家庭菜单';
      memberCount.value = 0;
      preferenceCount.value = 0;
      preferenceChips.value = [];
      menuRecipes.value = [];
      summaryText.value = '先创建或加入家庭，再根据家庭偏好生成菜单。';
      return;
    }

    familyName.value = family.name;
    memberCount.value = family.members.length;
    const preference = family.preferences;
    const chips = [
      ...(preference?.avoidItems ?? []),
      ...(preference?.allergies ?? []),
      ...(preference?.preferences ?? [])
    ].filter(Boolean);
    preferenceChips.value = chips;
    preferenceCount.value = chips.length;
    summaryText.value = family.rules || preference?.note || family.description || '从当前家庭偏好与时令推荐里生成一份更合适的菜单。';

    const home = await getHome();
    menuRecipes.value = home.recommendRecipes.slice(0, 5).map((item) => toMenuRecipe({
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
    recipeCount.value = menuRecipes.value.length;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '请稍后再试';
    menuRecipes.value = [];
  } finally {
    loading.value = false;
  }
};

const goBack = () => uni.navigateBack();
const goToLogin = () => uni.navigateTo({ url: '/pages/login/index' });
const goToRecipe = (id: string) => uni.navigateTo({ url: `/pages/recipe-detail/index?id=${encodeURIComponent(id)}` });

onMounted(() => {
  void loadFamilyMenu();
});

onShow(() => {
  void loadFamilyMenu();
});
</script>

<style scoped lang="scss">
.family-menu-page {
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
.recipe-title,
.recipe-desc,
.chip-text {
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

.summary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 18rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

.state-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

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

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.chip-card {
  padding: 14rpx 18rpx;
  border-radius: 22rpx;
}

.chip-text {
  color: var(--app-text);
  font-size: var(--font-size-tag);
}

.card-list {
  display: grid;
  gap: 16rpx;
}

.recipe-card {
  display: grid;
  grid-template-columns: 146rpx 1fr 28rpx;
  gap: 18rpx;
  align-items: center;
  padding: 16rpx;
}

.recipe-image {
  width: 146rpx;
  height: 146rpx;
  border-radius: 24rpx;
  background: var(--app-surface-strong);
}

.recipe-body {
  min-width: 0;
}

.recipe-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.recipe-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.recipe-meta {
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
