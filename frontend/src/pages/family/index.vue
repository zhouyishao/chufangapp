<template>
  <view class="app-page family-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <button class="nav-button" @tap="createAndOpen">
        <app-icon name="plus" size="26rpx" />
      </button>
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
        <app-icon class="family-card__arrow" name="chevron-right" size="22rpx" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadFamilies } from '../../services/family';
import type { FamilyProfile } from '../../types/family';

const families = ref<FamilyProfile[]>([]);

const goBack = () => {
  uni.navigateBack();
};

const openFamily = (familyId: string) => {
  uni.navigateTo({ url: `/pages/family-manage/index?id=${encodeURIComponent(familyId)}` });
};

const createAndOpen = () => {
  uni.navigateTo({ url: '/pages/family-create/index' });
};

const refreshFamilies = async () => {
  try {
    families.value = await loadFamilies();
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '家庭加载失败', icon: 'none' });
  }
};

onMounted(() => {
  void refreshFamilies();
});

onShow(() => {
  void refreshFamilies();
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
  margin-top: calc(-32rpx + env(safe-area-inset-top, 0));
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
  background: rgba(255, 253, 252, 0.92);
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-medium);
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.04);
}

.nav-button::after {
  border: 0;
}

.page-title {
  display: block;
  margin-top: 6rpx;
  color: var(--app-text);
  font-size: var(--font-size-hero);
  font-weight: var(--font-semibold);
  letter-spacing: 0;
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
  border-radius: var(--app-radius-card);
  background: rgba(255, 253, 252, 0.92);
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
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.family-card__desc {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.family-card__arrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
}
</style>
