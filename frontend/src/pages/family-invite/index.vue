<template>
  <view class="app-page invite-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <view class="topbar__spacer" />
    </view>

    <text class="page-title">{{ token ? '加入家庭' : '选择邀请方式' }}</text>
    <text class="page-subtitle">{{ token ? '确认后加入这个家庭' : '二维码扫码邀请' }}</text>

    <view class="invite-card glass-card">
      <view class="qr-wrap">
        <image v-if="qrImageUrl" class="qr-image" :src="qrImageUrl" mode="aspectFit" />
        <view v-else class="qr-loading">
          <text>二维码生成中</text>
        </view>
      </view>
      <text class="hint">使用手机扫码加入「{{ family?.name || '家庭' }}」</text>
    </view>

    <view class="link-card glass-card">
      <text class="link-title">邀请链接</text>
      <text class="link-value">{{ inviteLink }}</text>
      <nut-button v-if="token" type="primary" block @click="joinFamily">确认加入</nut-button>
      <nut-button v-else type="primary" block @click="copyLink">复制链接</nut-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import QRCode from 'qrcode';
import AppIcon from '../../components/app/app-icon.vue';
import { createFamilyInvite, getFamilyById, getFamilyInvite, joinFamilyInvite } from '../../services/family';
import type { FamilyProfile } from '../../types/family';

const familyId = ref('');
const token = ref('');
const inviteLinkValue = ref('');
const family = ref<FamilyProfile | null>(null);
const qrImageUrl = ref('');

const inviteLink = computed(() => {
  return inviteLinkValue.value || `/pages/family-invite/index?token=${encodeURIComponent(token.value)}`;
});

const readInviteParams = (options?: Record<string, string | undefined>) => {
  const familyIdValue = options?.familyId?.trim();
  const tokenValue = options?.token?.trim();
  if (familyIdValue || tokenValue) {
    return { familyId: familyIdValue ?? '', token: tokenValue ?? '' };
  }
  if (typeof window === 'undefined') {
    return { familyId: '', token: '' };
  }
  const hash = window.location.hash;
  const queryText = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  const params = new URLSearchParams(queryText);
  return {
    familyId: params.get('familyId') ?? '',
    token: params.get('token') ?? ''
  };
};

const buildQrCode = async () => {
  const value = inviteLink.value.trim();
  if (!value) {
    qrImageUrl.value = '';
    return;
  }
  try {
    qrImageUrl.value = await QRCode.toDataURL(value, {
      margin: 1,
      width: 320,
      color: {
        dark: '#2F2F2F',
        light: '#FFFDFC'
      }
    });
  } catch {
    qrImageUrl.value = '';
  }
};

watch(inviteLink, () => {
  void buildQrCode();
}, { immediate: true });

const goBack = () => {
  uni.navigateBack();
};

const copyLink = () => {
  uni.setClipboardData({
    data: inviteLink.value,
    success: () => {
      uni.showToast({ title: '邀请链接已复制', icon: 'none' });
    }
  });
};

const joinFamily = async () => {
  if (!token.value) return;
  try {
    const joined = await joinFamilyInvite(token.value);
    uni.showToast({ title: '已加入家庭', icon: 'success' });
    uni.redirectTo({ url: `/pages/family-manage/index?id=${joined.id}` });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '加入失败', icon: 'none' });
  }
};

const loadInvitePage = async (options?: Record<string, string | undefined>) => {
  const params = readInviteParams(options);
  familyId.value = params.familyId;
  token.value = params.token;
  try {
    if (token.value) {
      const invite = await getFamilyInvite(token.value);
      family.value = {
        id: String(invite.family.id),
        name: invite.family.name,
        description: invite.family.description || '',
        commonRecipes: 0,
        pendingItems: invite.family.pendingItems,
        members: []
      };
      inviteLinkValue.value = invite.url || inviteLink.value;
      return;
    }
    family.value = await getFamilyById(familyId.value);
    if (family.value) {
      const invite = await createFamilyInvite(family.value.id);
      token.value = invite.token ?? '';
      inviteLinkValue.value = invite.url || `/pages/family-invite/index?token=${token.value}`;
    }
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '邀请加载失败', icon: 'none' });
  }
};

onLoad((options) => {
  void loadInvitePage(options);
});

onShow(() => {
  void loadInvitePage(readInviteParams());
});

onMounted(() => {
  if (family?.value || token.value) return;
  void loadInvitePage().catch(() => undefined);
});
</script>

<style scoped lang="scss">
.invite-page {
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
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

.topbar__spacer {
  width: 74rpx;
  height: 74rpx;
}

.page-title,
.page-subtitle,
.hint,
.link-title,
.link-value {
  display: block;
}

.page-title {
  margin-top: 6rpx;
  color: var(--app-text);
  font-size: var(--font-size-hero);
  font-weight: var(--font-semibold);
  letter-spacing: 0;
}

.page-subtitle {
  margin-top: 14rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.invite-card {
  margin-top: 28rpx;
  padding: 28rpx;
  border-radius: var(--app-radius-card);
  background: rgba(255, 253, 252, 0.92);
}

.qr-wrap {
  display: flex;
  justify-content: center;
  padding: 18rpx 0 10rpx;
}

.qr-image {
  width: 320rpx;
  height: 320rpx;
  padding: 16rpx;
  border-radius: 28rpx;
  background: #fffdfc;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.04);
}

.qr-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 320rpx;
  height: 320rpx;
  border-radius: 28rpx;
  background: #fffdfc;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.04);
}

.hint {
  margin-top: 18rpx;
  text-align: center;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  line-height: var(--line-body-sm);
}

.link-card {
  margin-top: 18rpx;
  padding: 26rpx;
  border-radius: var(--app-radius-card);
  background: rgba(255, 253, 252, 0.92);
}

.link-title {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.link-value {
  margin-top: 12rpx;
  padding: 18rpx;
  border-radius: 26rpx;
  background: var(--app-accent-soft);
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-body-sm);
  word-break: break-all;
}
</style>
