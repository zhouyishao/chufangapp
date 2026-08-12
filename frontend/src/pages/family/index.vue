<template>
  <view class="app-page family-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="topbar-title">家庭管理</text>
      <view class="topbar-spacer" />
    </view>

    <text class="family-count">{{ families.length }} 个家庭</text>

    <view v-if="loading" class="family-state">
      <text class="family-state__title">正在加载家庭</text>
    </view>

    <view v-else-if="error" class="family-state">
      <text class="family-state__title">家庭暂时没有加载出来</text>
      <text class="family-state__desc">{{ error }}</text>
      <button class="state-button" @tap="refreshFamilies">重新加载</button>
    </view>

    <view v-else-if="!families.length" class="family-state">
      <text class="family-state__title">还没有家庭</text>
      <text class="family-state__desc">创建家庭，或扫描家人的家庭码加入。</text>
    </view>

    <view v-else class="family-list">
      <view
        v-for="family in families"
        :key="family.id"
        class="family-card glass-card"
        @tap="openFamily(family.id)"
      >
        <view class="family-card__avatar">
          <image
            v-if="family.avatar && !failedAvatarIds.includes(family.id)"
            class="family-card__avatar-image"
            :src="family.avatar"
            mode="aspectFill"
            @error="markAvatarFailed(family.id)"
          />
          <text v-else>{{ family.name.slice(0, 1) }}</text>
        </view>
        <view class="family-card__main">
          <text class="family-card__name">{{ family.name }}</text>
          <text class="family-card__desc">{{ family.members.length }} 位成员 · {{ family.commonRecipes }} 道常做菜</text>
        </view>
        <app-icon class="family-card__arrow" name="chevron-right" size="22rpx" />
      </view>
    </view>

    <view class="family-actions">
      <button class="family-action" @tap="createAndOpen">
        <app-icon name="plus" size="24rpx" />
        <text>创建家庭</text>
      </button>
      <button class="family-action" @tap="scanAndJoin">
        <app-icon name="scan" size="24rpx" />
        <text>扫一扫加入家庭</text>
      </button>
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
const loading = ref(true);
const error = ref('');
const failedAvatarIds = ref<string[]>([]);

const goBack = () => {
  uni.navigateBack();
};

const openFamily = (familyId: string) => {
  uni.navigateTo({ url: `/pages/family-manage/index?id=${encodeURIComponent(familyId)}` });
};

const createAndOpen = () => {
  uni.navigateTo({ url: '/pages/family-create/index' });
};

const scanAndJoin = () => {
  uni.navigateTo({ url: '/pages/scan/index' });
};

const markAvatarFailed = (familyId: string) => {
  if (!failedAvatarIds.value.includes(familyId)) {
    failedAvatarIds.value = [...failedAvatarIds.value, familyId];
  }
};

const refreshFamilies = async () => {
  loading.value = true;
  error.value = '';
  try {
    families.value = await loadFamilies();
  } catch (err) {
    families.value = [];
    error.value = err instanceof Error ? err.message : '家庭加载失败';
  } finally {
    loading.value = false;
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
  padding-bottom: calc(80rpx + var(--app-safe-area-bottom));
}

.safe-top-spacer {
  height: calc(var(--app-safe-area-top) + 8rpx);
}

.topbar {
  display: grid;
  grid-template-columns: 88rpx 1fr 88rpx;
  align-items: center;
  margin-bottom: 24rpx;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
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

.topbar-title {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
  text-align: center;
}

.family-count {
  display: block;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
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

.family-card__avatar {
  display: flex;
  width: 88rpx;
  height: 88rpx;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1rpx solid var(--app-border);
  border-radius: 24rpx;
  background: var(--app-primary-soft);
  color: var(--text-brand);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.family-card__avatar-image {
  width: 100%;
  height: 100%;
}

.family-card__name,
.family-card__desc,
.family-card__arrow {
  display: block;
}

.family-state {
  display: flex;
  min-height: 360rpx;
  margin-top: 26rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  text-align: center;
}

.family-state__title,
.family-state__desc {
  display: block;
}

.family-state__title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.family-state__desc {
  max-width: 480rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.family-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 24rpx;
}

.family-action,
.state-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-height: 88rpx;
  margin: 0;
  border: 1rpx solid var(--app-border);
  border-radius: var(--app-radius-button);
  background: var(--app-surface);
  color: var(--text-brand);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
}

.state-button {
  min-width: 190rpx;
  margin-top: 10rpx;
}

.family-action::after,
.state-button::after {
  border: 0;
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
