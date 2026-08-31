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
        class="family-card"
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
          <text class="family-card__desc">{{ family.members.length }} 位成员 · 我的身份：{{ getCurrentRole(family) }}</text>
        </view>
        <text v-if="family.id === activeFamilyId" class="family-card__badge">当前家庭</text>
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
import { loadAuthUser } from '../../services/auth';
import { loadActiveFamilyId, loadFamilies } from '../../services/family';
import type { FamilyProfile } from '../../types/family';

const families = ref<FamilyProfile[]>([]);
const loading = ref(true);
const error = ref('');
const failedAvatarIds = ref<string[]>([]);
const activeFamilyId = ref(loadActiveFamilyId());

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

const getCurrentRole = (family: FamilyProfile) => {
  const user = loadAuthUser();
  if (!user) return '成员';
  return family.members.find((member) => member.userId === user.id || member.accountId === user.phone)?.role ?? '成员';
};

const refreshFamilies = async () => {
  loading.value = true;
  error.value = '';
  try {
    families.value = await loadFamilies();
    activeFamilyId.value = loadActiveFamilyId();
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
  padding-right: 40rpx;
  padding-bottom: calc(80rpx + var(--app-safe-area-bottom));
  padding-left: 40rpx;
}

.safe-top-spacer {
  height: calc(var(--app-safe-area-top) + 8rpx);
}

.topbar {
  position: sticky;
  z-index: var(--z-sticky);
  top: 0;
  display: grid;
  grid-template-columns: 128rpx 1fr 128rpx;
  align-items: center;
  min-height: 112rpx;
  margin-bottom: 48rpx;
  border-bottom: 1rpx solid var(--app-border);
  background: rgba(245, 241, 234, 0.92);
  backdrop-filter: blur(18px);
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-medium);
  box-shadow: none;
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
  margin: 4rpx 4rpx 20rpx;
}

.family-list {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  border: 1rpx solid var(--app-border);
  border-radius: 30rpx;
  background: var(--app-surface);
}

.family-card {
  display: grid;
  grid-template-columns: 80rpx minmax(0, 1fr) auto 28rpx;
  align-items: center;
  gap: 24rpx;
  min-height: 144rpx;
  padding: 24rpx 28rpx;
  border-radius: 0;
  background: transparent;
}

.family-card + .family-card {
  border-top: 1rpx solid var(--app-border);
}

.family-card__main {
  min-width: 0;
  flex: 1;
}

.family-card__avatar {
  display: flex;
  width: 80rpx;
  height: 80rpx;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1rpx solid var(--app-border);
  border-radius: 20rpx;
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

.family-card__badge {
  flex: 0 0 auto;
  padding: 4rpx 12rpx;
  border-radius: var(--radius-pill);
  background: var(--app-primary-soft);
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  line-height: var(--line-tag);
}

.family-state {
  display: flex;
  min-height: 360rpx;
  margin-top: 20rpx;
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
  gap: 20rpx;
  margin-top: 28rpx;
}

.family-action,
.state-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-height: 96rpx;
  margin: 0;
  border: 1rpx solid var(--app-border);
  border-radius: 24rpx;
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
  margin-top: 6rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-regular);
  line-height: var(--line-caption);
}

.family-card__arrow {
  color: var(--text-placeholder);
}

@media (max-width: 375px) {
  .family-card { grid-template-columns: 80rpx minmax(0, 1fr) 28rpx; }
  .family-card__badge { display: none; }
}

</style>
