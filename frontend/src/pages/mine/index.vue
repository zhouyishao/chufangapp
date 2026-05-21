<template>
  <view class="app-page mine-page">
    <view v-if="isLoggedIn" class="mine-hero glass-card">
      <image class="mine-hero__bg" :src="profileBackgroundUrl" mode="aspectFill" />
      <view class="mine-hero__shade" />
      <view class="mine-hero__content">
        <view class="hero-top">
          <image class="profile__avatar" :src="profile.avatarUrl" mode="aspectFill" />
          <view class="hero-actions">
            <button class="profile__edit" @click="changeBackground">换背景</button>
            <button class="profile__edit profile__edit--dark" @click="editProfile">编辑资料</button>
          </view>
        </view>
        <text class="profile__name">{{ profile.nickname }}</text>
        <text class="profile__desc">{{ profile.bio }}</text>

        <view class="profile-actions">
          <button class="profile-action" @click="goToFavorites">
            <text class="profile-action__value">12</text>
            <text class="profile-action__label">收藏</text>
          </button>
          <button class="profile-action" @click="goToRecentViews">
            <text class="profile-action__value">8</text>
            <text class="profile-action__label">浏览</text>
          </button>
          <button class="profile-action" @click="goToMyRecipes">
            <text class="profile-action__value">5</text>
            <text class="profile-action__label">菜谱</text>
          </button>
          <button class="profile-action" @click="goToPurchaseHistory">
            <text class="profile-action__value">2</text>
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
            <button class="family-add-button" @click.stop="goToFamilyInvite">＋</button>
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
        <switch :checked="notificationOn" color="#111111" @change="toggleNotification" />
      </view>
      <view class="settings-item">
        <view>
          <text class="settings-title">家庭共享</text>
          <text class="settings-desc">同步家庭菜篮子</text>
        </view>
        <switch :checked="familyShareOn" color="#111111" @change="toggleFamilyShare" />
      </view>
      <button class="logout-button" @click="logout">退出登录</button>
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
              activeColor="#111111"
              backgroundColor="#e8ecf1"
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
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import { clearAuthUser, loadAuthUser } from '../../services/auth';
import { getDefaultFamilies, loadActiveFamilyId, loadFamilies } from '../../services/family';
import { loadUserProfile } from '../../services/profile';
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
const profileBackgroundUrl = ref('https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=1200&q=80');
const backgroundDraftUrl = ref(profileBackgroundUrl.value);
const backgroundDraftOffset = ref(0);
const backgroundSliderValue = ref(50);
const familyOptions = ref<FamilyProfile[]>(loadFamilies());
const activeFamilyId = ref(loadActiveFamilyId());
const isLoggedIn = computed(() => authUser.value !== null);
const currentFamily = computed<FamilyProfile>(() => {
  return familyOptions.value.find((family) => family.id === activeFamilyId.value) ?? familyOptions.value[0] ?? getDefaultFamilies()[0];
});
const familyPreviewMembers = computed(() => currentFamily.value.members.slice(0, 2));

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
  backgroundDraftUrl.value = 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80';
  uni.showToast({ title: '已选择图片', icon: 'none' });
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
    content: '退出后将回到未登录状态，本地收藏和记录不会删除。',
    confirmText: '退出',
    confirmColor: '#111111',
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
  uni.navigateTo({ url: `/pages/family-manage/index?id=${encodeURIComponent(activeFamilyId.value)}` });
};

const goToFamilyInvite = () => {
  uni.navigateTo({ url: `/pages/family-invite/index?familyId=${encodeURIComponent(activeFamilyId.value)}` });
};

onShow(() => {
  authUser.value = loadAuthUser();
  profile.value = loadUserProfile();
  familyOptions.value = loadFamilies();
  activeFamilyId.value = loadActiveFamilyId();
  if (!authUser.value) {
    uni.redirectTo({ url: '/pages/login/index' });
  }
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
  background: #ffffff;
  box-shadow: 0 24rpx 80rpx rgba(15, 23, 42, 0.06);
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.96) 48%, #ffffff 100%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.58));
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
  border: 6rpx solid #ffffff;
  border-radius: 50%;
  background: #eef2f6;
  box-shadow: 0 24rpx 56rpx rgba(15, 23, 42, 0.12);
}

.hero-actions {
  display: flex;
  gap: 12rpx;
}

.profile__edit {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 132rpx;
  height: 64rpx;
  margin-top: 2rpx;
  border: 0;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.86);
  color: var(--app-text);
  font-size: 23rpx;
  font-weight: 900;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.08);
}

.profile__edit--dark {
  background: #111111;
  color: #ffffff;
}

.profile__name {
  display: block;
  margin-top: 42rpx;
  color: var(--app-text);
  font-size: 48rpx;
  font-weight: 950;
  line-height: 1.12;
  letter-spacing: -1rpx;
}

.profile__desc {
  display: block;
  margin-top: 14rpx;
  color: var(--app-text-secondary);
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1.42;
}

.family-module {
  margin-top: 20rpx;
  padding: 28rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.74);
  border-radius: 36rpx;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(250, 252, 255, 0.9)),
    #ffffff;
  box-shadow: 0 18rpx 58rpx rgba(15, 23, 42, 0.07);
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
  border: 4rpx solid #ffffff;
  border-radius: 50%;
  background: #eef2f6;
  box-shadow: 0 10rpx 26rpx rgba(15, 23, 42, 0.08);
}

.family-add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--app-text-secondary);
  font-size: 42rpx;
  font-weight: 700;
  line-height: 1;
}

.profile-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  margin-top: 22rpx;
  padding: 10rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.68);
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.88),
    0 18rpx 44rpx rgba(15, 23, 42, 0.06);
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
  background: rgba(148, 163, 184, 0.18);
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
  font-size: 30rpx;
  font-weight: 950;
  line-height: 1;
}

.profile-action__label {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: 19rpx;
  font-weight: 900;
}

.family-card__name {
  display: inline-block;
  color: var(--app-text);
  font-size: 34rpx;
  font-weight: 950;
}

.family-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.family-summary text {
  padding: 7rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(243, 245, 248, 0.9);
  color: var(--app-text-secondary);
  font-size: 19rpx;
  font-weight: 800;
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
  border-radius: 38rpx;
  background: #ffffff;
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
  font-size: 27rpx;
  font-weight: 900;
}

.settings-desc {
  margin-top: 6rpx;
  color: var(--app-text-secondary);
  font-size: 21rpx;
}

.logout-button {
  width: 100%;
  height: 82rpx;
  margin-top: 22rpx;
  border: 0;
  border-radius: 999rpx;
  background: #fff1f0;
  color: #d92d20;
  font-size: 26rpx;
  font-weight: 900;
}

.join-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  padding: 24rpx 24rpx calc(124rpx + env(safe-area-inset-bottom, 0));
  background: rgba(16, 17, 20, 0.28);
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
  font-size: 34rpx;
  font-weight: 800;
}

.join-panel__subtitle {
  display: block;
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: 23rpx;
}

.join-panel__close {
  color: var(--app-text-tertiary);
  font-size: 42rpx;
  line-height: 1;
}

.join-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx;
  margin-top: 26rpx;
  padding: 8rpx;
  border: 1rpx solid var(--app-border);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.72);
}

.join-tab {
  height: 62rpx;
  border: 0;
  border-radius: 999rpx;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: 24rpx;
  font-weight: 700;
}

.join-tab.is-active {
  background: var(--app-accent);
  color: #ffffff;
}

.join-section {
  margin-top: 26rpx;
}

.field-label {
  display: block;
  margin-bottom: 12rpx;
  color: var(--app-text);
  font-size: 24rpx;
  font-weight: 700;
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
  border-radius: 999rpx;
  background: #111111;
  color: #ffffff;
  font-size: 23rpx;
  font-weight: 900;
}

.family-invite-card {
  margin-top: 12rpx;
  padding: 20rpx;
  border-radius: 28rpx;
  background: #f3f5f8;
}

.family-invite-title,
.family-invite-desc,
.family-link {
  display: block;
}

.family-invite-title {
  color: var(--app-text);
  font-size: 28rpx;
  font-weight: 950;
}

.family-invite-desc {
  margin-top: 6rpx;
  color: var(--app-text-secondary);
  font-size: 22rpx;
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
  background: #ffffff;
}

.family-qr-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 7rpx;
  background: #111111;
}

.family-link-box {
  min-width: 0;
}

.family-link {
  overflow: hidden;
  color: var(--app-text-secondary);
  font-size: 21rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.family-link-button,
.share-card-button {
  height: 58rpx;
  border: 0;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 900;
}

.family-link-button {
  min-width: 132rpx;
  margin-top: 12rpx;
  background: #ffffff;
  color: var(--app-text);
}

.share-card-button {
  width: 100%;
  margin-top: 16rpx;
  background: #111111;
  color: #ffffff;
}

.invite-input {
  width: 100%;
  height: 76rpx;
  padding: 0 24rpx;
  border: 1rpx solid var(--app-border);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.82);
  color: var(--app-text);
  font-size: 24rpx;
}

.panel-primary-button {
  width: 100%;
  height: 82rpx;
  margin-top: 28rpx;
  border: 0;
  border-radius: 999rpx;
  background: var(--app-accent);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 900;
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
  background: #f3f5f8;
}

.member-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #ffffff;
}

.member-main {
  flex: 1;
  min-width: 0;
}

.member-name {
  display: block;
  color: var(--app-text);
  font-size: 27rpx;
  font-weight: 900;
}

.member-role {
  flex: 0 0 auto;
  color: var(--app-text-secondary);
  font-size: 21rpx;
  font-weight: 800;
}

.member-note-input {
  width: 100%;
  height: 48rpx;
  margin-top: 4rpx;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: 22rpx;
}

.member-remove-button {
  flex: 0 0 auto;
  min-width: 78rpx;
  height: 50rpx;
  border: 0;
  border-radius: 999rpx;
  background: #fff1f0;
  color: #d92d20;
  font-size: 21rpx;
  font-weight: 800;
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
  font-size: 26rpx;
  font-weight: 700;
}

.invite-preview__code {
  display: block;
  margin-top: 6rpx;
  color: var(--app-text-secondary);
  font-size: 22rpx;
}

.join-help {
  display: block;
  margin: 18rpx 0;
  color: var(--app-text-secondary);
  font-size: 23rpx;
  line-height: 1.6;
}

.qr-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 260rpx;
  border-radius: 28rpx;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(238, 242, 246, 0.86));
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(3, 42rpx);
  gap: 16rpx;
  padding: 28rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 40rpx rgba(15, 23, 42, 0.08);
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
  border-radius: 30rpx;
  background: #eef2f6;
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
  border-radius: 999rpx;
  background: #f1f3f6;
  color: var(--app-text);
  font-size: 25rpx;
  font-weight: 900;
}

.background-slider-row {
  display: grid;
  grid-template-columns: 64rpx 1fr 64rpx;
  align-items: center;
  gap: 10rpx;
  margin-top: 22rpx;
  color: var(--app-text-secondary);
  font-size: 22rpx;
  font-weight: 800;
}

.qr-dot:nth-child(2),
.qr-dot:nth-child(4),
.qr-dot:nth-child(9) {
  background: var(--app-accent-soft);
}
</style>
