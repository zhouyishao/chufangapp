<template>
  <view class="app-page settings-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="topbar-title">{{ isPrivacySection ? '隐私与家庭共享' : '设置' }}</text>
      <view class="topbar-spacer" />
    </view>

    <template v-if="isPrivacySection">
      <view class="privacy-intro">
        <text class="privacy-intro__title">由你决定家人能看到什么</text>
        <text class="privacy-intro__desc">口味用于采购与做饭提醒；个人菜谱可逐道选择仅自己或家庭可见。</text>
      </view>

      <view class="section glass-card">
        <text class="section-label">家庭共享</text>
        <view class="cell cell-link" @tap="goPreferences">
          <view>
            <text class="cell-title">个人口味与忌口</text>
            <text class="cell-desc">管理喜欢、忌口与过敏信息</text>
          </view>
          <app-icon class="cell-value" name="chevron-right" size="22rpx" />
        </view>
        <view class="cell cell-link" @tap="goMyRecipes">
          <view>
            <text class="cell-title">个人菜谱共享</text>
            <text class="cell-desc">在每道菜谱中单独设置共享范围</text>
          </view>
          <app-icon class="cell-value" name="chevron-right" size="22rpx" />
        </view>
      </view>

      <view class="section glass-card">
        <text class="section-label">个人信息</text>
        <view class="cell cell-link" @tap="goProfile">
          <view>
            <text class="cell-title">个人资料</text>
            <text class="cell-desc">头像、昵称等资料默认仅用于你的账号</text>
          </view>
          <app-icon class="cell-value" name="chevron-right" size="22rpx" />
        </view>
      </view>
    </template>

    <template v-else>
    <view class="section glass-card">
      <text class="section-label">账号</text>
      <view class="cell">
        <text class="cell-title">登录手机号</text>
        <text class="cell-value">{{ authUser?.phone || '未登录' }}</text>
      </view>
      <view class="cell">
        <text class="cell-title">昵称</text>
        <text class="cell-value">{{ authUser?.nickname || '未设置' }}</text>
      </view>
    </view>

    <view class="section glass-card">
      <text class="section-label">家庭与采购</text>
      <view class="cell cell-link" @tap="goFamily">
        <text class="cell-title">家庭管理</text>
        <app-icon class="cell-value" name="chevron-right" size="22rpx" />
      </view>
      <view class="cell cell-link" @tap="goPreferences">
        <text class="cell-title">家庭偏好</text>
        <app-icon class="cell-value" name="chevron-right" size="22rpx" />
      </view>
      <view class="cell cell-link" @tap="goPurchaseHistory">
        <text class="cell-title">采购记录</text>
        <app-icon class="cell-value" name="chevron-right" size="22rpx" />
      </view>
      <view class="cell">
        <view>
          <text class="cell-title">采购提醒</text>
          <text class="cell-desc">完成采购后保留价格记录入口</text>
        </view>
        <switch :checked="purchaseNotice" color="#7A8B6F" @change="togglePurchaseNotice" />
      </view>
    </view>

    <view class="section glass-card">
      <text class="section-label">隐私与安全</text>
      <view class="cell cell-link" @tap="goAccountSecurity">
        <text class="cell-title">账号与安全</text>
        <app-icon class="cell-value" name="chevron-right" size="22rpx" />
      </view>
      <view class="cell cell-link" @tap="goPrivacySharing">
        <text class="cell-title">隐私与家庭共享</text>
        <app-icon class="cell-value" name="chevron-right" size="22rpx" />
      </view>
      <view class="cell cell-link" @tap="goNotificationSettings">
        <text class="cell-title">消息与提醒</text>
        <app-icon class="cell-value" name="chevron-right" size="22rpx" />
      </view>
    </view>

    <view class="section glass-card">
      <text class="section-label">关于</text>
      <view class="cell cell-link" @tap="goAbout">
        <text class="cell-title">关于产品</text>
        <app-icon class="cell-value" name="chevron-right" size="22rpx" />
      </view>
    </view>

    <button v-if="authUser" class="logout-button" @tap="logout">
      <app-icon name="logout" size="20rpx" />
      <text>退出登录</text>
    </button>
    <button v-else class="login-button" @tap="goLogin">
      <app-icon name="user" size="20rpx" />
      <text>去登录</text>
    </button>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { clearAuthUser, loadAuthUser, type AuthUser } from '../../services/auth';
import { loadActiveFamilyId } from '../../services/family';

const authUser = ref<AuthUser | null>(loadAuthUser());
const purchaseNotice = ref(true);
const isPrivacySection = ref(false);

const goBack = () => {
  uni.navigateBack();
};

const goLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' });
};

const goFamily = () => {
  const familyId = loadActiveFamilyId();
  uni.navigateTo({ url: familyId ? `/pages/family-manage/index?id=${familyId}` : '/pages/family/index' });
};

const goPreferences = () => {
  const familyId = loadActiveFamilyId();
  uni.navigateTo({ url: familyId ? `/pages/family-preferences/index?familyId=${familyId}` : '/pages/family/index' });
};

const goMyRecipes = () => {
  uni.navigateTo({ url: '/pages/my-recipes/index' });
};

const goProfile = () => {
  uni.navigateTo({ url: '/pages/profile-edit/index' });
};

const goAccountSecurity = () => uni.navigateTo({ url: '/pages/account-security/index' });
const goPrivacySharing = () => uni.navigateTo({ url: '/pages/privacy-sharing/index' });
const goNotificationSettings = () => uni.navigateTo({ url: '/pages/notification-settings/index' });
const goAbout = () => uni.navigateTo({ url: '/pages/about/index' });
const goPurchaseHistory = () => uni.navigateTo({ url: '/pages/purchase-history/index' });

const togglePurchaseNotice = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: boolean } };
  purchaseNotice.value = Boolean(detail.detail?.value);
};

const logout = () => {
  uni.showModal({
    title: '退出登录',
    content: '退出后需要重新登录才能同步家庭、收藏和菜篮子。',
    confirmText: '退出',
    confirmColor: '#7A8B6F',
    success: (result) => {
      if (!result.confirm) return;
      clearAuthUser();
      authUser.value = null;
      uni.reLaunch({ url: '/pages/mine/index' });
    }
  });
};

onShow(() => {
  authUser.value = loadAuthUser();
});

onLoad((query) => {
  isPrivacySection.value = query?.section === 'privacy';
});
</script>

<style scoped lang="scss">
.settings-page {
  padding-bottom: calc(90rpx + var(--app-safe-area-bottom));
}

.topbar {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
}

.nav-button,
.logout-button,
.login-button {
  border: 0;
}

.nav-button {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--app-surface-strong);
  color: var(--app-text);
  font-size: var(--font-size-card-title);
}

.topbar-title {
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  text-align: center;
}

.section {
  margin-top: 24rpx;
  padding: 26rpx;
}

.privacy-intro {
  margin-top: 30rpx;
  padding: 0 8rpx;
}

.privacy-intro__title,
.privacy-intro__desc {
  display: block;
}

.privacy-intro__title {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.privacy-intro__desc {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.section-label,
.cell-title,
.cell-desc,
.cell-value {
  display: block;
}

.section-label {
  margin-bottom: 8rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  min-height: 88rpx;
  border-bottom: 1rpx solid rgba(233, 226, 214, 0.72);
}

.cell:last-child {
  border-bottom: 0;
}

.cell-link {
  cursor: pointer;
}

.cell-title {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
}

.cell-desc,
.cell-value {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
}

.logout-button,
.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  width: 100%;
  height: 88rpx;
  margin-top: 28rpx;
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.logout-button {
  background: rgba(229, 115, 95, 0.12);
  color: var(--app-danger);
}

.login-button {
  background: var(--app-primary);
  color: var(--text-white);
}
</style>
