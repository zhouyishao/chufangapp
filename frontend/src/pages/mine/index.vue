<template>
  <view class="app-page mine-page">
    <view v-if="isLoggedIn" class="mine-hero glass-card">
      <image class="mine-hero__bg" :src="profileBackgroundUrl" mode="aspectFill" />
      <view class="mine-hero__shade" />
      <view class="mine-hero__content">
        <view class="hero-top">
          <image class="profile__avatar" :src="profileAvatarUrl" mode="aspectFill" />
          <view class="hero-actions">
            <button class="profile__edit" @click="changeBackground">
              <app-icon name="edit" size="18rpx" />
              <text>换背景</text>
            </button>
            <button class="profile__edit profile__edit--dark" @click="editProfile">
              <app-icon name="edit" size="18rpx" />
              <text>编辑资料</text>
            </button>
          </view>
        </view>
        <text class="profile__name">{{ profile.nickname }}</text>
        <text class="profile__desc">{{ profile.bio }}</text>

        <view class="profile-actions">
          <button class="profile-action" @click="goToFavorites">
            <text class="profile-action__value">{{ favoriteCount }}</text>
            <text class="profile-action__label">收藏</text>
          </button>
          <button class="profile-action" @click="goToRecentViews">
            <text class="profile-action__value">{{ recentViewCount }}</text>
            <text class="profile-action__label">浏览</text>
          </button>
          <button class="profile-action" @click="goToMyRecipes">
            <text class="profile-action__value">{{ myRecipeCount }}</text>
            <text class="profile-action__label">菜谱</text>
          </button>
          <button class="profile-action" @click="goToPurchaseHistory">
            <text class="profile-action__value">{{ purchaseCount }}</text>
            <text class="profile-action__label">采购</text>
          </button>
        </view>
      </view>
    </view>

    <view v-if="isLoggedIn" class="family-module glass-card">
      <view class="family-module__content" @click="goToCurrentFamily">
        <view class="family-copy">
          <view class="family-name-wrap">
            <text class="family-card__name">{{ currentFamily.name }}</text>
          </view>
          <view class="family-summary">
            <text>{{ currentFamily.members.length }} 位成员</text>
            <text>{{ currentFamily.commonRecipes }} 道常做菜</text>
            <text>{{ currentFamily.pendingItems }} 项待采购</text>
          </view>
        </view>
        <view class="family-actions">
          <view class="family-members">
            <image
              v-for="member in familyPreviewMembers"
              :key="member.id"
              class="family-member-avatar"
              :src="member.avatar"
              mode="aspectFill"
            />
            <button class="family-add-button" @click.stop="goToFamilyInvite">
              <app-icon name="plus" size="24rpx" />
            </button>
          </view>
        </view>
      </view>
    </view>

    <view v-if="isLoggedIn" class="settings-card glass-card">
      <view class="settings-item">
        <view>
          <text class="settings-title">通知提醒</text>
          <text class="settings-desc">采购和菜谱提醒</text>
        </view>
        <switch :checked="notificationOn" color="#7a8b6f" @change="toggleNotification" />
      </view>
      <view class="settings-item">
        <view>
          <text class="settings-title">家庭共享</text>
          <text class="settings-desc">同步家庭菜篮子</text>
        </view>
        <switch :checked="familyShareOn" color="#7a8b6f" @change="toggleFamilyShare" />
      </view>
      <view class="settings-item settings-item--link" @click="goToSettings">
        <view>
          <text class="settings-title">设置</text>
          <text class="settings-desc">账号、家庭偏好和关于信息</text>
        </view>
        <app-icon name="chevron-right" size="26rpx" />
      </view>
      <button class="logout-button" @click="logout">
        <app-icon name="logout" size="20rpx" />
        <text>退出登录</text>
      </button>
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

    <view v-if="isBackgroundEditorVisible" class="join-mask" @click="closeBackgroundEditor">
      <view class="join-panel background-panel glass-card" @click.stop>
        <view class="join-panel__header">
          <view>
            <text class="join-panel__title">更换背景</text>
            <text class="join-panel__subtitle">上传长图后调整展示位置</text>
          </view>
          <text class="join-panel__close" @click="closeBackgroundEditor">×</text>
        </view>

        <view class="background-preview">
          <image
            class="background-preview__image"
            :src="backgroundDraftUrl"
            mode="aspectFill"
            :style="{ transform: `translateY(${backgroundDraftOffset}rpx)` }"
          />
        </view>
        <view class="background-tools">
          <button class="background-tool-button" @click="chooseBackgroundImage">上传图片</button>
          <view class="background-slider-row">
            <text>上移</text>
            <slider
              :value="backgroundSliderValue"
              min="0"
              max="100"
              block-size="22"
              activeColor="#7a8b6f"
              backgroundColor="#e9e2d6"
              @change="changeBackgroundOffset"
            />
            <text>下移</text>
          </view>
          <button class="panel-primary-button" @click="saveBackground">保存背景</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import { clearAuthUser, loadAuthUser } from '../../services/auth';
import { loadBasketItems } from '../../services/basket';
import { loadActiveFamilyId, loadFamilies } from '../../services/family';
import { loadMyRecipes } from '../../services/my-recipes';
import { loadUserProfile } from '../../services/profile';
import { listMobileFavorites, listMobileViewHistories } from '../../services/public-api';
import type { FamilyProfile } from '../../types/family';
import type { UserProfile } from '../../types/profile';

const tabs = [
  { id: 'home', label: '首页', active: false },
  { id: 'ingredients', label: '食材', active: false },
  { id: 'basket', label: '菜篮子', active: false },
  { id: 'mine', label: '我的', active: true }
];

const notificationOn = ref(true);
const familyShareOn = ref(false);
const isBackgroundEditorVisible = ref(false);
const authUser = ref(loadAuthUser());
const profile = ref<UserProfile>(loadUserProfile());
const avatarPlaceholderUrl =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect width=%22200%22 height=%22200%22 rx=%22100%22 fill=%22%23E9E2D6%22/%3E%3Ccircle cx=%22100%22 cy=%2278%22 r=%2234%22 fill=%22%237A8B6F%22 opacity=%22.72%22/%3E%3Cpath d=%22M42 174c16-38 36-57 58-57s42 19 58 57%22 fill=%22%237A8B6F%22 opacity=%22.72%22/%3E%3C/svg%3E';
const profileBackgroundPlaceholderUrl =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 900 520%22%3E%3Crect width=%22900%22 height=%22520%22 fill=%22%23FFFDFC%22/%3E%3Cpath d=%22M0 338c120-66 235-94 346-84 151 13 240 99 390 86 65-6 119-25 164-58v238H0V338Z%22 fill=%22%23E9E2D6%22/%3E%3Cpath d=%22M98 144c92-48 178-52 258-12 76 39 143 39 202 2%22 fill=%22none%22 stroke=%22%237A8B6F%22 stroke-width=%2224%22 stroke-linecap=%22round%22 opacity=%22.56%22/%3E%3C/svg%3E';
const profileBackgroundUrl = ref(profileBackgroundPlaceholderUrl);
const backgroundDraftUrl = ref(profileBackgroundUrl.value);
const backgroundDraftOffset = ref(0);
const backgroundSliderValue = ref(50);
const familyOptions = ref<FamilyProfile[]>([]);
const activeFamilyId = ref(loadActiveFamilyId());
const favoriteCount = ref(0);
const recentViewCount = ref(0);
const myRecipeCount = ref(0);
const purchaseCount = ref(0);
const isLoggedIn = computed(() => authUser.value !== null);
const profileAvatarUrl = computed(() => profile.value.avatarUrl || avatarPlaceholderUrl);
const currentFamily = computed<FamilyProfile>(() => {
  return familyOptions.value.find((family) => family.id === activeFamilyId.value) ?? familyOptions.value[0] ?? {
    id: '',
    name: '暂未加入家庭',
    description: '创建或加入家庭后可共享菜篮子',
    commonRecipes: 0,
    pendingItems: 0,
    members: []
  };
});
const familyPreviewMembers = computed(() => currentFamily.value.members.slice(0, 2));

const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' });
};

const editProfile = () => {
  uni.navigateTo({ url: '/pages/profile-edit/index' });
};

const changeBackground = () => {
  backgroundDraftUrl.value = profileBackgroundUrl.value;
  isBackgroundEditorVisible.value = true;
};

const closeBackgroundEditor = () => {
  isBackgroundEditorVisible.value = false;
};

const chooseBackgroundImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (result) => {
      backgroundDraftUrl.value = result.tempFilePaths[0] ?? profileBackgroundPlaceholderUrl;
      uni.showToast({ title: '已选择图片', icon: 'none' });
    }
  });
};

const changeBackgroundOffset = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: number } };
  const value = detail.detail?.value ?? 50;
  backgroundSliderValue.value = value;
  backgroundDraftOffset.value = Math.round((value - 50) * 1.6);
};

const saveBackground = () => {
  profileBackgroundUrl.value = backgroundDraftUrl.value;
  closeBackgroundEditor();
  uni.showToast({ title: '背景已保存', icon: 'success' });
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
      authUser.value = null;
      uni.showToast({ title: '已退出登录', icon: 'none' });
    }
  });
};

const goToCurrentFamily = () => {
  const familyId = activeFamilyId.value || familyOptions.value[0]?.id || '';
  uni.navigateTo({ url: familyId ? `/pages/family-manage/index?id=${encodeURIComponent(familyId)}` : '/pages/family/index' });
};

const goToFamilyInvite = () => {
  const familyId = activeFamilyId.value || familyOptions.value[0]?.id || '';
  if (!familyId) {
    uni.showToast({ title: '请先创建家庭', icon: 'none' });
    uni.navigateTo({ url: '/pages/family/index' });
    return;
  }
  uni.navigateTo({ url: `/pages/family-invite/index?familyId=${encodeURIComponent(familyId)}` });
};

const refreshUserStats = async () => {
  if (!authUser.value?.id) {
    favoriteCount.value = 0;
    recentViewCount.value = 0;
    myRecipeCount.value = 0;
    purchaseCount.value = 0;
    return;
  }
  const [favorites, recentViews, basketItems, myRecipes] = await Promise.all([
    listMobileFavorites({ userId: authUser.value.id, page: 1, pageSize: 1 }),
    listMobileViewHistories({ userId: authUser.value.id, page: 1, pageSize: 1 }),
    loadBasketItems(),
    loadMyRecipes()
  ]);
  favoriteCount.value = favorites.total;
  recentViewCount.value = recentViews.total;
  myRecipeCount.value = myRecipes.length;
  purchaseCount.value = basketItems.length;
};

const refreshMinePage = async () => {
  authUser.value = loadAuthUser();
  profile.value = loadUserProfile();
  try {
    if (authUser.value) {
      familyOptions.value = await loadFamilies();
      activeFamilyId.value = loadActiveFamilyId();
      await refreshUserStats();
    } else {
      familyOptions.value = [];
      activeFamilyId.value = '';
      await refreshUserStats();
    }
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '我的页面加载失败', icon: 'none' });
  }
};

onMounted(() => {
  void refreshMinePage();
});

onShow(() => {
  void refreshMinePage();
});
</script>

<style scoped lang="scss">
.mine-page {
  padding-bottom: calc(220rpx + env(safe-area-inset-bottom, 0));
}

.mine-hero {
  position: relative;
  min-height: 520rpx;
  overflow: hidden;
  padding: 0;
  border-radius: 44rpx;
  background: #fffdfc;
  box-shadow: 0 24rpx 80rpx rgba(0, 0, 0, 0.04);
}

.mine-hero__bg,
.mine-hero__shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.mine-hero__shade {
  background:
    linear-gradient(180deg, rgba(255, 253, 252, 0.3), rgba(255, 253, 252, 0.96) 48%, #fffdfc 100%),
    linear-gradient(90deg, rgba(255, 253, 252, 0.92), rgba(255, 253, 252, 0.58));
}

.mine-hero__content {
  position: relative;
  z-index: 1;
  padding: 36rpx 34rpx 32rpx;
}

.hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.profile__avatar {
  width: 142rpx;
  height: 142rpx;
  border: 6rpx solid #fffdfc;
  border-radius: 50%;
  background: #e9e2d6;
  box-shadow: 0 24rpx 56rpx rgba(0, 0, 0, 0.06);
}

.hero-actions {
  display: flex;
  gap: 12rpx;
}

.profile__edit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-width: 132rpx;
  height: 64rpx;
  margin-top: 2rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: rgba(255, 253, 252, 0.86);
  color: var(--app-text);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  box-shadow: 0 14rpx 34rpx rgba(0, 0, 0, 0.04);
}

.profile__edit--dark {
  background: #7a8b6f;
  color: var(--text-white);
}

.profile__name {
  display: block;
  margin-top: 42rpx;
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
  letter-spacing: 0;
}

.profile__desc {
  display: block;
  margin-top: 14rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}

.family-module {
  margin-top: 20rpx;
  padding: 28rpx;
  border: 1rpx solid rgba(233, 226, 214, 0.9);
  border-radius: var(--app-radius-card);
  background:
    linear-gradient(135deg, rgba(255, 253, 252, 0.96), rgba(255, 253, 252, 0.9)),
    #fffdfc;
  box-shadow: 0 18rpx 58rpx rgba(0, 0, 0, 0.04);
}

.family-module__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.family-copy {
  flex: 1;
  min-width: 0;
}

.family-name-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.family-actions {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 22rpx;
}

.family-members {
  display: flex;
  align-items: center;
  padding-left: 30rpx;
}

.family-member-avatar,
.family-add-button {
  width: 72rpx;
  height: 72rpx;
  margin-left: -20rpx;
  border: 4rpx solid #fffdfc;
  border-radius: 50%;
  background: #e9e2d6;
  box-shadow: 0 10rpx 26rpx rgba(0, 0, 0, 0.04);
}

.family-add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--app-text-secondary);
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-tabbar);
}

.profile-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  margin-top: 22rpx;
  padding: 10rpx;
  border: 1rpx solid rgba(255, 253, 252, 0.72);
  border-radius: var(--app-radius-input);
  background: rgba(255, 253, 252, 0.68);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 253, 252, 0.88),
    0 18rpx 44rpx rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(18rpx);
  -webkit-backdrop-filter: blur(18rpx);
}

.profile-action {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 92rpx;
  margin: 0;
  padding: 10rpx 8rpx;
  border: 0;
  border-radius: 22rpx;
  background: transparent;
  text-align: center;
  transition: transform 0.18s ease, background 0.18s ease;
}

.profile-action::after {
  border: 0;
}

.profile-action:not(:last-child)::before {
  position: absolute;
  top: 20rpx;
  right: 0;
  bottom: 20rpx;
  width: 1rpx;
  background: rgba(183, 174, 161, 0.22);
  content: '';
}

.profile-action:active {
  transform: scale(0.98);
  background: rgba(241, 244, 247, 0.9);
}

.profile-action__value,
.profile-action__label,
.section-title,
.section-desc,
.settings-title,
.settings-desc {
  display: block;
}

.profile-action__value {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  line-height: var(--line-tabbar);
}

.profile-action__label {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.family-card__name {
  display: inline-block;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.family-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.family-summary text {
  padding: 7rpx 12rpx;
  border-radius: var(--app-radius-button);
  background: rgba(233, 226, 214, 0.72);
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.family-add-button::after,
.member-add-button::after,
.member-remove-button::after,
.family-link-button::after,
.share-card-button::after,
.background-tool-button::after,
.join-tab::after,
.panel-primary-button::after,
.profile__edit::after,
.logout-button::after {
  border: 0;
}

.settings-card {
  margin-top: 20rpx;
  padding: 28rpx;
  border-radius: var(--app-radius-card);
  background: #fffdfc;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 98rpx;
  border-bottom: 1rpx solid var(--app-border);
}

.settings-title {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.settings-desc {
  margin-top: 6rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  width: 100%;
  height: 82rpx;
  margin-top: 22rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: rgba(229, 115, 95, 0.12);
  color: var(--app-danger);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
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
</style>
