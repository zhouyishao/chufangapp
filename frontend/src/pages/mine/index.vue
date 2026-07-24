<template>
  <view class="app-page mine-page">
    <view v-if="isLoggedIn" class="mine-shell">
      <view class="profile-head">
        <view class="profile-head__main">
          <image class="profile-head__avatar" :src="profileAvatarUrl" mode="aspectFill" />
          <view class="profile-head__copy">
            <text class="profile-head__name">{{ displayNickname }}</text>
            <text class="profile-head__bio">{{ profile.bio }}</text>
            <button class="profile-edit-button" @click="editProfile">
              <app-icon name="edit" size="16px" />
              <text>编辑资料</text>
            </button>
          </view>
        </view>
      </view>

      <view class="family-paper">
        <view class="family-paper__sheet family-paper__sheet--back" />
        <view class="family-paper__card" @click="goToCurrentFamily">
          <view class="family-paper__icon">
            <app-icon name="home" size="24px" />
          </view>
          <view class="family-paper__main">
            <text class="family-paper__name">{{ currentFamily.name }}</text>
            <view class="family-paper__meta">
              <text>{{ currentFamily.members.length }} 位成员</text>
              <text>·</text>
              <text>{{ currentFamily.commonRecipes }} 道常做菜</text>
              <text>·</text>
              <text>{{ currentFamily.pendingItems }} 项待采购</text>
            </view>
          </view>
          <view class="family-paper__edit">
            <app-icon name="chevron-right" size="22rpx" />
          </view>
        </view>
      </view>

      <view class="mine-recipes">
        <view class="mine-recipes__head">
          <button class="mine-recipes__title" @tap="goToMyRecipes">我的菜谱</button>
          <button class="mine-recipes__add" @tap="goToCreateRecipe">
            <app-icon name="plus" size="18px" />
            <text>添加</text>
          </button>
        </view>
        <scroll-view v-if="myRecipePreviews.length" class="mine-recipes__scroll" scroll-x :show-scrollbar="false">
          <view class="mine-recipes__row">
            <button v-for="recipe in myRecipePreviews" :key="recipe.id" class="mine-recipe-card" @tap="openMyRecipe(recipe.id)">
              <image class="mine-recipe-card__image" :src="recipe.image" mode="aspectFill" />
              <view class="mine-recipe-card__copy">
                <text class="mine-recipe-card__title">{{ recipe.name }}</text>
                <text class="mine-recipe-card__visibility">{{ recipe.visibility }}</text>
              </view>
            </button>
            <button class="mine-recipe-card mine-recipe-card--more" @tap="goToMyRecipes">查看全部</button>
          </view>
        </scroll-view>
        <button v-else class="mine-recipes__empty" @tap="goToCreateRecipe">添加第一道菜谱</button>
      </view>

      <view class="profile-stats">
        <button class="profile-stat" @click="goToFavorites">
          <text class="profile-stat__value">{{ favoriteCount }}</text>
          <text class="profile-stat__label">收藏</text>
        </button>
        <button class="profile-stat" @click="goToRecentViews">
          <text class="profile-stat__value">{{ recentViewCount }}</text>
          <text class="profile-stat__label">浏览</text>
        </button>
        <button class="profile-stat" @click="goToMyRecipes">
          <text class="profile-stat__value">{{ myRecipeCount }}</text>
          <text class="profile-stat__label">菜谱</text>
        </button>
        <button class="profile-stat" @click="goToPurchaseHistory">
          <text class="profile-stat__value">{{ purchaseCount }}</text>
          <text class="profile-stat__label">采购</text>
        </button>
      </view>

      <view class="mine-list">
        <text class="mine-list__group-title">内容</text>
        <view class="mine-list__item" @click="goToMyRecipes">
          <view class="mine-list__icon">
            <app-icon name="recipe" size="34rpx" />
          </view>
          <text class="mine-list__title">我的菜谱</text>
          <app-icon class="mine-list__arrow" name="chevron-right" size="24rpx" />
        </view>
        <view class="mine-list__item" @click="goToFavorites">
          <view class="mine-list__icon">
            <app-icon name="heart" size="34rpx" />
          </view>
          <text class="mine-list__title">收藏</text>
          <app-icon class="mine-list__arrow" name="chevron-right" size="24rpx" />
        </view>
        <view class="mine-list__item" @click="goToRecentViews">
          <view class="mine-list__icon">
            <app-icon name="history" size="34rpx" />
          </view>
          <text class="mine-list__title">最近浏览</text>
          <app-icon class="mine-list__arrow" name="chevron-right" size="24rpx" />
        </view>
        <text class="mine-list__group-title mine-list__group-title--spaced">家庭</text>
        <view class="mine-list__item" @click="goToCurrentFamily">
          <view class="mine-list__icon">
            <app-icon name="users" size="34rpx" />
          </view>
          <text class="mine-list__title">家庭管理</text>
          <app-icon class="mine-list__arrow" name="chevron-right" size="24rpx" />
        </view>
        <view class="mine-list__item mine-list__item--tall">
          <view class="mine-list__icon">
            <app-icon name="calendar" size="34rpx" />
          </view>
          <view class="mine-list__copy">
            <text class="mine-list__title">通知提醒</text>
            <text class="mine-list__desc">菜谱上新与采购提醒</text>
          </view>
          <switch :checked="notificationOn" color="#7a8b6f" @change="toggleNotification" />
        </view>
        <view class="mine-list__item mine-list__item--tall">
          <view class="mine-list__icon">
            <app-icon name="share" size="34rpx" />
          </view>
          <view class="mine-list__copy">
            <text class="mine-list__title">家庭共享</text>
            <text class="mine-list__desc">同步家庭菜篮子</text>
          </view>
          <switch :checked="familyShareOn" color="#7a8b6f" @change="toggleFamilyShare" />
        </view>
        <text class="mine-list__group-title mine-list__group-title--spaced">系统</text>
        <view class="mine-list__item" @click="goToSettings">
          <view class="mine-list__icon">
            <app-icon name="settings" size="34rpx" />
          </view>
          <view class="mine-list__copy">
            <text class="mine-list__title">设置</text>
            <text class="mine-list__desc">账号、隐私与通用设置</text>
          </view>
          <app-icon class="mine-list__arrow" name="chevron-right" size="24rpx" />
        </view>
      </view>

      <button class="logout-button" @click="logout">退出登录</button>
    </view>

    <view v-if="!isLoggedIn" class="guest-card glass-card">
      <view class="guest-header">
        <image class="guest-avatar" :src="avatarPlaceholderUrl" mode="aspectFill" />
        <text class="guest-title">未登录</text>
        <text class="guest-desc">登录后同步收藏、菜篮子与家庭共享</text>
      </view>
      <button class="guest-login-button" @click="goToLogin">
        <app-icon name="user" size="20rpx" />
        <text>手机号登录 / 去登录</text>
      </button>
      <view class="guest-actions">
        <view class="guest-action" @click="goToFavorites">
          <app-icon class="guest-action__icon" name="heart" size="30rpx" />
          <text class="guest-action__label">我的收藏</text>
        </view>
        <view class="guest-action" @click="goToRecentViews">
          <app-icon class="guest-action__icon" name="history" size="30rpx" />
          <text class="guest-action__label">最近浏览</text>
        </view>
        <view class="guest-action" @click="goToMyRecipes">
          <app-icon class="guest-action__icon" name="recipe" size="30rpx" />
          <text class="guest-action__label">我的菜谱</text>
        </view>
        <view class="guest-action" @click="goToPurchaseHistory">
          <app-icon class="guest-action__icon" name="box" size="30rpx" />
          <text class="guest-action__label">采购记录</text>
        </view>
      </view>
      <view class="guest-settings">
        <view class="guest-setting" @click="goToSettings">
          <text>账号设置</text>
          <app-icon name="arrow-right" size="22rpx" />
        </view>
        <view class="guest-setting" @click="goToSettings">
          <text>关于我们</text>
          <app-icon name="arrow-right" size="22rpx" />
        </view>
      </view>
    </view>

    <home-tab-bar :tabs="tabs" />

  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import { clearAuthUser, loadAuthUser } from '../../services/auth';
import { loadBasketItems } from '../../services/basket';
import { loadActiveFamilyId, loadFamilies } from '../../services/family';
import { loadMyRecipes, type MyRecipe } from '../../services/my-recipes';
import { getDefaultUserProfile, getUserProfile } from '../../services/profile';
import { listMobileFavorites, listMobileViewHistories } from '../../services/public-api';
import type { FamilyProfile } from '../../types/family';
import type { UserProfile } from '../../types/profile';

const tabs = [
  { id: 'home', label: '首页', active: false },
  { id: 'categories', label: '分类', active: false },
  { id: 'basket', label: '菜篮', active: false },
  { id: 'mine', label: '我的', active: true }
];

const notificationOn = ref(true);
const familyShareOn = ref(false);
const authUser = ref(loadAuthUser());
const profile = ref<UserProfile>(getDefaultUserProfile());
const avatarPlaceholderUrl =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect width=%22200%22 height=%22200%22 rx=%22100%22 fill=%22%23E9E2D6%22/%3E%3Ccircle cx=%22100%22 cy=%2278%22 r=%2234%22 fill=%22%237A8B6F%22 opacity=%22.72%22/%3E%3Cpath d=%22M42 174c16-38 36-57 58-57s42 19 58 57%22 fill=%22%237A8B6F%22 opacity=%22.72%22/%3E%3C/svg%3E';
const familyOptions = ref<FamilyProfile[]>([]);
const activeFamilyId = ref(loadActiveFamilyId());
const favoriteCount = ref(0);
const recentViewCount = ref(0);
const myRecipeCount = ref(0);
const myRecipePreviews = ref<MyRecipe[]>([]);
const purchaseCount = ref(0);
const mineRequestSequence = ref(0);
const isLoggedIn = computed(() => authUser.value !== null);
const profileAvatarUrl = computed(() => profile.value.avatarUrl || avatarPlaceholderUrl);
const displayNickname = computed(() => {
  const nickname = profile.value.nickname.trim();
  return nickname && !/^1[3-9]\d{2}\*{2,}\d{2,4}$/.test(nickname) ? nickname : '未设置昵称';
});
const currentFamily = computed<FamilyProfile>(() => {
  return familyOptions.value.find((family) => family.id === activeFamilyId.value) ?? familyOptions.value[0] ?? {
    id: '',
    name: '暂未加入家庭',
    avatar: '',
    avatarFileId: null,
    description: '创建或加入家庭后可共享菜篮子',
    commonRecipes: 0,
    pendingItems: 0,
    members: []
  };
});
const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' });
};

const editProfile = () => {
  uni.navigateTo({ url: '/pages/profile-edit/index' });
};

const goToFavorites = () => {
  uni.navigateTo({ url: '/pages/favorites/index' });
};

const goToRecentViews = () => {
  uni.navigateTo({ url: '/pages/recent-views/index' });
};

const goToMyRecipes = () => {
  uni.navigateTo({ url: '/pages/my-recipes/index' });
};

const goToCreateRecipe = () => {
  uni.navigateTo({ url: '/pages/recipe-create/index' });
};

const openMyRecipe = (recipeId: string) => {
  uni.navigateTo({ url: `/pages/my-recipe-detail/index?id=${encodeURIComponent(recipeId)}` });
};

const goToPurchaseHistory = () => {
  uni.navigateTo({ url: '/pages/purchase-history/index' });
};

const goToSettings = () => {
  uni.navigateTo({ url: '/pages/settings/index' });
};

const toggleNotification = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: boolean } };
  notificationOn.value = Boolean(detail.detail?.value);
};

const toggleFamilyShare = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: boolean } };
  familyShareOn.value = Boolean(detail.detail?.value);
};

const logout = () => {
  uni.showModal({
    title: '退出登录',
    content: '退出后将回到未登录状态，收藏和记录会继续保留在后端。',
    confirmText: '退出',
    confirmColor: '#7a8b6f',
    success: (result) => {
      if (!result.confirm) {
        return;
      }

      clearAuthUser();
      mineRequestSequence.value += 1;
      authUser.value = null;
      profile.value = getDefaultUserProfile();
      uni.showToast({ title: '已退出登录', icon: 'none' });
    }
  });
};

const goToCurrentFamily = () => {
  const familyId = activeFamilyId.value || familyOptions.value[0]?.id || '';
  uni.navigateTo({ url: familyId ? `/pages/family-manage/index?id=${encodeURIComponent(familyId)}` : '/pages/family/index' });
};

const refreshUserStats = async (expectedToken: string, sequence: number) => {
  if (!authUser.value?.id || loadAuthUser()?.token !== expectedToken) {
    favoriteCount.value = 0;
    recentViewCount.value = 0;
    myRecipeCount.value = 0;
    myRecipePreviews.value = [];
    purchaseCount.value = 0;
    return;
  }
  const [favorites, recentViews, basketItems, myRecipes] = await Promise.all([
    listMobileFavorites({ userId: authUser.value.id, page: 1, pageSize: 1 }),
    listMobileViewHistories({ userId: authUser.value.id, page: 1, pageSize: 1 }),
    loadBasketItems(),
    loadMyRecipes()
  ]);
  if (sequence !== mineRequestSequence.value || loadAuthUser()?.token !== expectedToken) return;
  favoriteCount.value = favorites.total;
  recentViewCount.value = recentViews.total;
  myRecipeCount.value = myRecipes.length;
  myRecipePreviews.value = myRecipes.slice(0, 6);
  purchaseCount.value = basketItems.length;
};

const refreshMinePage = async () => {
  const sequence = mineRequestSequence.value + 1;
  mineRequestSequence.value = sequence;
  const session = loadAuthUser();
  authUser.value = session;
  profile.value = getDefaultUserProfile();
  try {
    if (session) {
      const [remoteProfile, families] = await Promise.all([
        getUserProfile(),
        loadFamilies()
      ]);
      if (sequence !== mineRequestSequence.value || loadAuthUser()?.token !== session.token) return;
      profile.value = remoteProfile;
      familyOptions.value = families;
      activeFamilyId.value = loadActiveFamilyId();
      await refreshUserStats(session.token, sequence);
    } else {
      familyOptions.value = [];
      activeFamilyId.value = '';
      favoriteCount.value = 0;
      recentViewCount.value = 0;
      myRecipeCount.value = 0;
      myRecipePreviews.value = [];
      purchaseCount.value = 0;
      myRecipePreviews.value = [];
    }
  } catch (error) {
    if (sequence !== mineRequestSequence.value) return;
    if (!loadAuthUser()) {
      authUser.value = null;
      profile.value = getDefaultUserProfile();
      familyOptions.value = [];
      activeFamilyId.value = '';
    }
    uni.showToast({ title: error instanceof Error ? error.message : '我的页面加载失败', icon: 'none' });
  }
};

onShow(() => {
  void refreshMinePage();
});
</script>

<style scoped lang="scss">
.background-tool-button::after,
.join-tab::after,
.panel-primary-button::after {
  border: 0;
}

.join-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  padding: 24rpx 24rpx calc(124rpx + env(safe-area-inset-bottom, 0));
  background: rgba(47, 47, 47, 0.28);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
}

.join-panel {
  width: 100%;
  max-height: 64vh;
  overflow: auto;
  padding: 28rpx;
}

.background-panel {
  max-height: 70vh;
}

.join-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.join-panel__title {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-medium);
}

.join-panel__subtitle {
  display: block;
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

.join-panel__close {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-detail-title);
  line-height: var(--line-tabbar);
}

.join-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx;
  margin-top: 26rpx;
  padding: 8rpx;
  border: 1rpx solid var(--app-border);
  border-radius: var(--app-radius-button);
  background: rgba(255, 253, 252, 0.72);
}

.join-tab {
  height: 62rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.join-tab.is-active {
  background: var(--app-accent);
  color: var(--text-white);
}

.join-section {
  margin-top: 26rpx;
}

.field-label {
  display: block;
  margin-bottom: 12rpx;
  color: var(--app-text);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.field-label--spaced {
  margin-top: 22rpx;
}

.family-form {
  margin-top: 26rpx;
}

.member-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 28rpx;
}

.member-add-button {
  min-width: 104rpx;
  height: 56rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: #7a8b6f;
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.family-invite-card {
  margin-top: 12rpx;
  padding: 20rpx;
  border-radius: 28rpx;
  background: #e9e2d6;
}

.family-invite-title,
.family-invite-desc,
.family-link {
  display: block;
}

.family-invite-title {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.family-invite-desc {
  margin-top: 6rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.family-invite-body {
  display: grid;
  grid-template-columns: 132rpx 1fr;
  gap: 18rpx;
  align-items: center;
  margin-top: 18rpx;
}

.family-qr {
  display: grid;
  grid-template-columns: repeat(3, 24rpx);
  gap: 10rpx;
  justify-content: center;
  padding: 20rpx;
  border-radius: 24rpx;
  background: #fffdfc;
}

.family-qr-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 7rpx;
  background: #7a8b6f;
}

.family-link-box {
  min-width: 0;
}

.family-link {
  overflow: hidden;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.family-link-button,
.share-card-button {
  height: 58rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.family-link-button {
  min-width: 132rpx;
  margin-top: 12rpx;
  background: #fffdfc;
  color: var(--app-text);
}

.share-card-button {
  width: 100%;
  margin-top: 16rpx;
  background: #7a8b6f;
  color: var(--text-white);
}

.invite-input {
  width: 100%;
  height: 76rpx;
  padding: 0 24rpx;
  border: 1rpx solid var(--app-border);
  border-radius: 24rpx;
  background: rgba(255, 253, 252, 0.82);
  color: var(--app-text);
  font-size: var(--font-size-tag);
}

.panel-primary-button {
  width: 100%;
  height: 82rpx;
  margin-top: 28rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-accent);
  color: var(--text-white);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 12rpx;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 18rpx;
  border-radius: 28rpx;
  background: #e9e2d6;
}

.member-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #fffdfc;
}

.member-main {
  flex: 1;
  min-width: 0;
}

.member-name {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.member-role {
  flex: 0 0 auto;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.member-note-input {
  width: 100%;
  height: 48rpx;
  margin-top: 4rpx;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.member-remove-button {
  flex: 0 0 auto;
  min-width: 78rpx;
  height: 50rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: rgba(229, 115, 95, 0.12);
  color: var(--app-danger);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.invite-preview {
  margin: 18rpx 0;
  padding: 18rpx;
  border-radius: 22rpx;
  background: var(--app-accent-soft);
}

.invite-preview__name {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.invite-preview__code {
  display: block;
  margin-top: 6rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.join-help {
  display: block;
  margin: 18rpx 0;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-body-sm);
}

.qr-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 260rpx;
  border-radius: 28rpx;
  background:
    linear-gradient(135deg, rgba(255, 253, 252, 0.92), rgba(233, 226, 214, 0.76));
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(3, 42rpx);
  gap: 16rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: #fffdfc;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.04);
}

.qr-dot {
  width: 42rpx;
  height: 42rpx;
  border-radius: 10rpx;
  background: var(--app-accent);
}

.background-preview {
  position: relative;
  height: 300rpx;
  margin-top: 26rpx;
  overflow: hidden;
  border-radius: var(--app-radius-input);
  background: #e9e2d6;
}

.background-preview__image {
  width: 100%;
  height: 120%;
  transition: transform 0.2s ease;
}

.background-tools {
  margin-top: 22rpx;
}

.background-tool-button {
  width: 100%;
  height: 74rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: #e9e2d6;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.background-slider-row {
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  gap: 10rpx;
  margin-top: 22rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.qr-dot:nth-child(2),
.qr-dot:nth-child(4),
.qr-dot:nth-child(9) {
  background: var(--app-accent-soft);
}

.guest-card {
  margin-top: 20rpx;
  padding: 36rpx 28rpx;
  border-radius: var(--app-radius-card);
  background: #fffdfc;
}

.guest-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.guest-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #e9e2d6;
}

.guest-title {
  display: block;
  margin-top: 20rpx;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.guest-desc {
  display: block;
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
}

.guest-login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  width: 100%;
  height: 82rpx;
  margin-top: 28rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-accent);
  color: var(--text-white);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.guest-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14rpx;
  margin-top: 28rpx;
}

.guest-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding: 18rpx 8rpx;
  border-radius: 22rpx;
  background: var(--app-bg);
}

.guest-action__icon {
  font-size: var(--font-size-section-title);
}

.guest-action__label {
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.guest-settings {
  margin-top: 28rpx;
  border-top: 1rpx solid var(--app-border);
}

.guest-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--app-border);
  color: var(--app-text);
  font-size: var(--font-size-caption);
}

.guest-arrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-list-title);
}

.mine-page {
  position: relative;
  overflow: hidden;
  padding: 0 16px calc(118px + env(safe-area-inset-bottom, 0));
  background:
    radial-gradient(circle at 10% 2%, rgba(255, 253, 252, 0.9), transparent 34%),
    linear-gradient(180deg, rgba(255, 253, 252, 0.82), rgba(245, 241, 234, 0.96) 430rpx, #f5f1ea 100%);
}

.mine-page::before {
  position: absolute;
  top: -20rpx;
  left: -48rpx;
  width: 250rpx;
  height: 318rpx;
  border-radius: 0 0 54rpx 0;
  background:
    linear-gradient(135deg, rgba(255, 253, 252, 0.22), rgba(245, 241, 234, 0.72)),
    var(--app-accent-soft);
  opacity: 0.58;
  content: '';
}

.mine-page::after {
  position: absolute;
  top: 128rpx;
  left: 30rpx;
  width: 132rpx;
  height: 1rpx;
  background: rgba(122, 139, 111, 0.18);
  content: '';
}

.mine-shell {
  position: relative;
  z-index: 1;
}

.mine-scene-bg {
  position: absolute;
  top: 0;
  left: -16px;
  width: calc(100% + 32px);
  height: 230px;
  border-radius: 0;
  opacity: 0.36;
  pointer-events: none;
}

.mine-shell::before {
  position: absolute;
  top: 0;
  right: -16px;
  left: -16px;
  height: 230px;
  background: rgba(255, 253, 252, 0.68);
  content: '';
  pointer-events: none;
}

.profile-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  height: 230px;
  min-height: 230px;
  padding-top: calc(var(--app-safe-area-top) + 16px);
  padding-left: 4px;
}

.profile-head__main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 16px;
  align-items: flex-start;
}

.profile-head__avatar {
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  border: 3px solid rgba(255, 253, 252, 0.92);
  border-radius: 50%;
  background: #e9e2d6;
  box-shadow: 0 14rpx 34rpx rgba(47, 47, 47, 0.05);
}

.profile-head__copy {
  min-width: 0;
  padding-top: 7px;
}

.profile-head__name {
  display: block;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: var(--font-semibold);
  line-height: 30px;
  letter-spacing: 0;
}

.profile-head__bio {
  display: block;
  max-width: 210px;
  margin-top: 6px;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: 14px;
  font-weight: var(--font-regular);
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-head__settings {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(122, 139, 111, 0.16);
  border-radius: 12px;
  background: rgba(255, 253, 252, 0.74);
  color: #66775d;
}

.profile-background-edit {
  position: absolute;
  right: 16px;
  top: calc(var(--app-safe-area-top) + 68px);
  display: flex;
  align-items: center;
  width: 40px;
  height: 40px;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(122, 139, 111, 0.18);
  border-radius: 12px;
  background: rgba(255, 253, 252, 0.8);
  color: #66775d;
  font-size: 0;
}

.camera-icon {
  position: absolute;
  width: 20px;
  height: 15px;
  border: 1.8px solid currentColor;
  border-radius: 3px;
  content: '';
}

.camera-icon::before {
  position: absolute;
  top: -5px;
  left: 3px;
  width: 7px;
  height: 4px;
  border: 1.8px solid currentColor;
  border-bottom: 0;
  border-radius: 2px 2px 0 0;
  content: '';
}

.camera-icon::after {
  position: absolute;
  top: 3px;
  left: 6px;
  width: 5px;
  height: 5px;
  border: 1.8px solid currentColor;
  border-radius: 50%;
  content: '';
}

.profile-edit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 88px;
  height: 32px;
  margin: 10px 0 0;
  padding: 0;
  border: 1px solid rgba(122, 139, 111, 0.16);
  border-radius: 10px;
  background: rgba(255, 253, 252, 0.74);
  color: #66775d;
  font-size: 12px;
  font-weight: var(--font-medium);
  line-height: 16px;
}

.family-paper {
  position: relative;
  z-index: 1;
  height: 116px;
  margin-top: -22px;
  margin-left: 0;
  margin-right: 0;
}

.family-paper__sheet,
.family-paper__card {
  position: absolute;
  right: 0;
  left: 0;
  border: 1px solid rgba(218, 211, 199, 0.84);
  background: rgba(255, 253, 252, 0.94);
}

.family-paper__sheet--back {
  top: 4px;
  height: 112px;
  transform: rotate(-1.8deg);
  transform-origin: left center;
}

.family-paper__card {
  top: 0;
  z-index: 4;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 16px;
  grid-template-rows: 24px 18px;
  align-items: center;
  height: 116px;
  min-height: 116px;
  padding: 16px 20px;
  box-shadow: 0 14rpx 28rpx rgba(85, 69, 43, 0.06);
  overflow: hidden;
}

.family-paper__icon {
  grid-row: 1 / span 2;
  align-self: center;
  color: #6d7f63;
}

.family-paper__main {
  grid-column: 2;
  grid-row: 1 / span 2;
  min-width: 0;
}

.family-paper__name {
  display: block;
  color: var(--text-primary);
  font-size: 17px;
  font-weight: var(--font-semibold);
  line-height: 24px;
}

.family-paper__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: var(--font-regular);
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.family-paper__edit {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  color: #6d7f63;
  white-space: nowrap;
  font-size: 0;
  line-height: 16px;
}

.family-paper__stamp {
  display: none;
}

.family-paper__stamp text {
  position: absolute;
  left: 0;
  bottom: 4rpx;
  width: 72rpx;
  height: 72rpx;
  border: 0;
  font-size: 11px;
  font-weight: var(--font-medium);
  letter-spacing: 0.02em;
  line-height: 72rpx;
  text-align: center;
  transform: scale(0.72);
}

.stamp-line {
  position: absolute;
  right: 0;
  bottom: 36rpx;
  width: 78rpx;
  height: 16rpx;
  border-top: 2rpx solid rgba(210, 186, 142, 0.34);
  border-radius: 50%;
}

.stamp-line--short {
  bottom: 20rpx;
  width: 58rpx;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: 82px;
  margin: 20px 0 0;
}

.mine-recipes {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1rpx solid var(--app-border);
}

.mine-recipes__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--touch-target);
}

.mine-recipes__title,
.mine-recipes__add,
.mine-recipes__empty,
.mine-recipe-card {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.mine-recipes__title {
  color: var(--text-primary);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.mine-recipes__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  color: var(--app-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
}

.mine-recipes__scroll {
  margin: var(--space-2) calc(-1 * var(--space-4)) 0;
  white-space: nowrap;
}

.mine-recipes__row {
  display: inline-flex;
  gap: var(--space-3);
  padding: 0 var(--space-4);
}

.mine-recipe-card {
  display: flex;
  flex: 0 0 248rpx;
  width: 248rpx;
  overflow: hidden;
  flex-direction: column;
  border-radius: var(--radius-md);
  background: var(--app-surface-strong);
  color: var(--text-primary);
  text-align: left;
  white-space: normal;
}

.mine-recipe-card__image {
  width: 100%;
  aspect-ratio: 1;
  background: var(--app-surface);
}

.mine-recipe-card__copy {
  display: flex;
  min-height: 88rpx;
  padding: var(--space-2) var(--space-3);
  flex-direction: column;
  justify-content: center;
}

.mine-recipe-card__title {
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mine-recipe-card__visibility {
  margin-top: 2rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-regular);
  line-height: var(--line-tag);
}

.mine-recipe-card--more,
.mine-recipes__empty {
  align-items: center;
  justify-content: center;
  min-height: 160rpx;
  border: 1rpx dashed var(--app-border-strong);
  color: var(--app-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
  text-align: center;
}

.mine-recipes__empty {
  display: flex;
  width: 100%;
  margin-top: var(--space-2);
  border-radius: var(--radius-md);
}

.profile-stat {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 82px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.profile-stat:not(:last-child)::before {
  position: absolute;
  top: 25px;
  right: 0;
  bottom: 25px;
  width: 1rpx;
  background: rgba(183, 174, 161, 0.26);
  content: '';
}

.profile-stat__value {
  color: var(--text-primary);
  font-size: 22px;
  font-weight: var(--font-medium);
  line-height: 28px;
  font-variant-numeric: tabular-nums;
}

.profile-stat__label {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: var(--font-regular);
  line-height: var(--line-caption);
}

.mine-list {
  margin-top: 20px;
}

.mine-list__group-title {
  display: block;
  margin: 20px 0 8px;
  color: var(--text-tertiary);
  font-size: 14px;
  font-weight: var(--font-semibold);
}

.mine-list__group-title--spaced {
  margin-top: 16px;
}

.mine-list__item {
  display: grid;
  grid-template-columns: 20px 16px minmax(0, 1fr) 16px;
  align-items: center;
  height: 60px;
  min-height: 60px;
  border-bottom: 1rpx solid rgba(233, 226, 214, 0.78);
  color: var(--text-primary);
}

.mine-list__item:last-child {
  border-bottom: 0;
}

.mine-list__item--tall {
  height: 72px;
  min-height: 72px;
}

.mine-list__icon {
  grid-column: 1;
  width: 20px;
  height: 20px;
  color: #6d7f63;
}

.mine-list__item > .mine-list__title,
.mine-list__item > .mine-list__copy {
  grid-column: 3;
}

.mine-list__copy {
  min-width: 0;
}

.mine-list__title {
  display: block;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: var(--font-medium);
  line-height: 22px;
}

.mine-list__desc {
  display: block;
  margin-top: 2px;
  color: var(--text-tertiary);
  font-size: 14px;
  font-weight: var(--font-regular);
  line-height: 20px;
}

.mine-list__item > switch {
  grid-column: 4;
  justify-self: end;
  width: 50px;
  height: 30px;
  transform: none;
  transform-origin: right center;
}

.mine-list__arrow {
  grid-column: 4;
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
}

.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  margin: 24px 0 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--app-danger);
  font-size: 15px;
  font-weight: var(--font-medium);
  line-height: 20px;
}

:deep(.home-tab-bar) {
  right: 16px;
  bottom: 0;
  left: 16px;
  min-height: 64px;
  height: 98px;
  padding: 0 12px env(safe-area-inset-bottom, 0);
  border-radius: 24px;
}

:deep(.home-tab-bar__item) {
  gap: 2rpx;
  height: 64px;
  align-self: start;
  padding: 4px 0;
}

:deep(.home-tab-bar__label) {
  font-size: 11px;
  color: #7a746b;
}

:deep(.home-tab-bar .tab-icon) {
  width: 22px;
  height: 22px;
  color: #7a746b;
}

:deep(.home-tab-bar .icon-wrapper) {
  width: 36px;
  height: 36px;
}

@media screen and (min-width: 390px) and (max-width: 400px) and (min-height: 800px) and (max-height: 900px) {
  .profile-head {
    padding-top: 75px;
  }

  .profile-background-edit {
    top: 127px;
  }
}

.profile-head__settings::after,
.profile-edit-button::after,
.profile-stat::after,
.logout-button::after {
  border: 0;
}
</style>
  grid-column: 3;
  grid-row: 1;
  align-self: center;
