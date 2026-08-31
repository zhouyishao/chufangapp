<template>
  <view class="app-page invite-page">
    <view class="safe-top-spacer" aria-hidden="true" />
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="topbar-title">{{ token && !familyId ? '加入家庭' : '家庭码' }}</text>
      <view class="topbar__spacer" />
    </view>

    <text class="page-title">{{ token && !familyId ? `加入「${family?.name || '家庭'}」` : family?.name || '家庭码' }}</text>
    <text class="page-subtitle">{{ token && !familyId ? '确认后加入这个家庭' : '让家人扫一扫加入家庭' }}</text>

    <view v-if="loading" class="state-card glass-card">
      <text class="state-title">正在准备家庭码</text>
    </view>

    <view v-else-if="loadError" class="state-card glass-card">
      <text class="state-title">家庭邀请暂时不可用</text>
      <text class="state-desc">{{ loadError }}</text>
      <button class="state-action" :disabled="loading" @tap="retryLoad">重新加载</button>
    </view>

    <template v-else>
    <view class="invite-card">
      <view class="qr-wrap">
        <image v-if="qrImageUrl" class="qr-image" :src="qrImageUrl" mode="aspectFit" />
        <view v-else class="qr-loading">
          <text>二维码生成中</text>
        </view>
      </view>
      <text class="hint">扫一扫，加入「{{ family?.name || '家庭' }}」</text>
    </view>

    <view class="invite-actions">
      <nut-button v-if="token" type="primary" block :disabled="joining" @click="joinFamily">
        {{ joining ? '加入中…' : '确认加入' }}
      </nut-button>
      <template v-else>
        <button class="share-action primary" @tap="shareInvite">
          <app-icon name="share" size="22rpx" />
          <text>分享家庭码</text>
        </button>
        <button class="share-action secondary" @tap="copyLink">复制邀请链接</button>
      </template>
    </view>
    </template>
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
const loading = ref(false);
const loadError = ref('');
const joining = ref(false);
const lastOptions = ref<Record<string, string | undefined>>({});

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

const shareInvite = () => {
  uni.setClipboardData({
    data: inviteLink.value,
    success: () => uni.showToast({ title: '邀请链接已复制，可发送给家人', icon: 'none' })
  });
};

const joinFamily = async () => {
  if (!token.value || joining.value) return;
  joining.value = true;
  try {
    const joined = await joinFamilyInvite(token.value);
    uni.showToast({ title: '已加入家庭', icon: 'success' });
    uni.redirectTo({ url: `/pages/family-manage/index?id=${joined.id}` });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '加入失败', icon: 'none' });
  } finally {
    joining.value = false;
  }
};

const loadInvitePage = async (options?: Record<string, string | undefined>) => {
  if (loading.value) return;
  loading.value = true;
  loadError.value = '';
  lastOptions.value = options ?? {};
  const params = readInviteParams(options);
  familyId.value = params.familyId;
  token.value = params.token;
  try {
    if (token.value) {
      const invite = await getFamilyInvite(token.value);
      family.value = {
        id: String(invite.family.id),
        name: invite.family.name,
        avatar: invite.family.avatarSource || invite.family.avatar || '',
        avatarFileId: invite.family.avatarFileId ?? null,
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
    loadError.value = error instanceof Error ? error.message : '邀请加载失败';
  } finally {
    loading.value = false;
  }
};

const retryLoad = () => {
  void loadInvitePage(lastOptions.value);
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
  padding-bottom: calc(80rpx + var(--app-safe-area-bottom));
}

.safe-top-spacer {
  height: calc(var(--app-safe-area-top) + 8rpx);
}

.state-card {
  margin-top: 28rpx;
  padding: 32rpx;
  text-align: center;
}

.state-title,
.state-desc {
  display: block;
}

.state-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.state-desc {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.state-action {
  min-height: 88rpx;
  margin-top: 20rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
}

.topbar {
  display: grid;
  grid-template-columns: 74rpx 1fr 74rpx;
  align-items: center;
  margin-bottom: 18rpx;
}

.topbar-title {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
  text-align: center;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74rpx;
  height: 74rpx;
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
  margin-top: 24rpx;
  color: var(--app-text);
  font-size: var(--font-size-hero);
  font-weight: var(--font-semibold);
  letter-spacing: 0;
}

.page-subtitle {
  margin-top: 8rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.invite-card {
  margin-top: 36rpx;
  padding: 24rpx 0;
}

.qr-wrap {
  display: flex;
  justify-content: center;
  padding: 18rpx 0 10rpx;
}

.qr-image {
  width: 360rpx;
  height: 360rpx;
  padding: 18rpx;
  border: 1rpx solid var(--app-border);
  border-radius: 30rpx;
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

.invite-actions { display: flex; flex-direction: column; gap: 16rpx; margin-top: 24rpx; }
.share-action { display: flex; align-items: center; justify-content: center; gap: 10rpx; width: 100%; min-height: 88rpx; border-radius: var(--app-radius-button); font-size: var(--font-size-body); font-weight: var(--font-medium); }
.share-action::after { border: 0; }
.share-action.primary { border: 0; background: var(--app-primary); color: var(--text-white); }
.share-action.secondary { border: 1rpx solid var(--app-border); background: transparent; color: var(--app-primary); }
</style>
