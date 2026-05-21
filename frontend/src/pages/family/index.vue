<template>
  <view class="app-page family-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">←</button>
      <button class="nav-button" @tap="createAndOpen">＋</button>
    </view>

    <text class="page-title">家庭管理</text>

    <view class="family-list">
      <view
        v-for="family in families"
        :key="family.id"
        class="family-card glass-card"
        @tap="openFamily(family.id)"
      >
        <view class="family-card__main">
          <text class="family-card__name">{{ family.name }}</text>
          <text class="family-card__desc">{{ family.members.length }} 位成员 · {{ family.commonRecipes }} 道常做菜</text>
        </view>
        <text class="family-card__arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { createFamily, loadFamilies } from '../../services/family';
import type { FamilyProfile } from '../../types/family';

const families = ref<FamilyProfile[]>(loadFamilies());

const goBack = () => {
  uni.navigateBack();
};

const openFamily = (familyId: string) => {
  uni.navigateTo({ url: `/pages/family-manage/index?id=${encodeURIComponent(familyId)}` });
};

const createAndOpen = () => {
  const family = createFamily('新的家庭');
  families.value = loadFamilies();
  openFamily(family.id);
};

onShow(() => {
  families.value = loadFamilies();
});
</script>

<style scoped lang="scss">
.family-page {
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74rpx;
  height: 74rpx;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: var(--app-text);
  font-size: 38rpx;
  font-weight: 800;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.06);
}

.nav-button::after {
  border: 0;
}

.page-title {
  display: block;
  margin-top: 6rpx;
  color: var(--app-text);
  font-size: 68rpx;
  font-weight: 950;
  letter-spacing: -1.2rpx;
}

.family-list {
  margin-top: 26rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.family-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 26rpx;
  border-radius: 34rpx;
  background: rgba(255, 255, 255, 0.92);
}

.family-card__main {
  min-width: 0;
  flex: 1;
}

.family-card__name,
.family-card__desc,
.family-card__arrow {
  display: block;
}

.family-card__name {
  overflow: hidden;
  color: var(--app-text);
  font-size: 32rpx;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.family-card__desc {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: 22rpx;
  font-weight: 700;
}

.family-card__arrow {
  color: var(--app-text-tertiary);
  font-size: 44rpx;
  font-weight: 700;
}
</style>

