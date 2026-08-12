<template>
  <view class="app-page taste-page">
    <view class="safe-top-spacer" aria-hidden="true" />

    <view class="page-header">
      <button class="icon-button" aria-label="返回" @tap="goBack">
        <app-icon name="arrow-left" size="28rpx" />
      </button>
      <text class="page-title">我的口味</text>
      <view class="header-spacer" />
    </view>

    <view v-if="loading" class="state-card" aria-busy="true">
      <text class="sr-only" role="status">正在加载我的口味</text>
      <view v-for="index in 3" :key="index" class="skeleton-row">
        <view class="skeleton-line skeleton-line--title" />
        <view class="skeleton-line" />
      </view>
    </view>

    <view v-else-if="needsLogin" class="state-card state-card--center">
      <view class="state-icon">
        <app-icon name="user" size="42rpx" />
      </view>
      <text class="state-title">登录后设置口味</text>
      <text class="state-description">你的喜欢、忌口和过敏信息会跟随账号保存。</text>
      <button class="state-action" @tap="goLogin">去登录</button>
    </view>

    <view v-else-if="loadError" class="state-card state-card--center">
      <text class="state-title">口味信息暂时无法加载</text>
      <text class="state-description">{{ loadError }}</text>
      <button class="state-action" :disabled="loading" @tap="loadPreferences">重新加载</button>
    </view>

    <template v-else>
      <view class="intro">
        <text class="intro-title">吃得更合心意</text>
        <text class="intro-copy">共享给家庭的信息，会在采购和做饭时提醒家人。</text>
      </view>

      <view class="preference-sections">
        <view
          v-for="section in sections"
          :key="section.kind"
          class="preference-section"
          role="region"
          :aria-label="section.title"
        >
          <view class="section-heading">
            <view>
              <text class="section-title">{{ section.title }}</text>
              <text class="section-description">{{ section.description }}</text>
            </view>
            <text class="section-count">{{ itemsByKind(section.kind).length }} 项</text>
          </view>

          <view v-if="itemsByKind(section.kind).length" class="preference-list">
            <view
              v-for="item in itemsByKind(section.kind)"
              :key="item.localId"
              class="preference-row"
            >
              <view class="preference-copy">
                <text class="preference-value">{{ item.value }}</text>
                <view class="scope-switch" role="group" :aria-label="`${item.value}的共享范围`">
                  <button
                    :class="['scope-option', { 'is-active': item.shareScope === 'FAMILY' }]"
                    :aria-pressed="item.shareScope === 'FAMILY'"
                    @tap="setScope(item.localId, 'FAMILY')"
                  >
                    共享家庭
                  </button>
                  <button
                    :class="['scope-option', { 'is-active': item.shareScope === 'PRIVATE' }]"
                    :aria-pressed="item.shareScope === 'PRIVATE'"
                    @tap="setScope(item.localId, 'PRIVATE')"
                  >
                    仅自己
                  </button>
                </view>
              </view>
              <button
                class="delete-button"
                :aria-label="`删除${item.value}`"
                @tap="removeItem(item.localId)"
              >
                <app-icon name="trash" size="28rpx" />
              </button>
            </view>
          </view>

          <view v-else class="section-empty">
            <text>还没有添加{{ section.title }}</text>
          </view>

          <view class="add-row">
            <input
              v-model="drafts[section.kind]"
              class="preference-input"
              :placeholder="section.placeholder"
              :aria-label="`新增${section.title}`"
              maxlength="20"
              confirm-type="done"
              @confirm="addItem(section.kind)"
            />
            <button
              class="add-button"
              :disabled="!drafts[section.kind].trim()"
              @tap="addItem(section.kind)"
            >
              添加
            </button>
          </view>
          <text class="add-hint">新增后默认共享家庭，可随时改为仅自己</text>
        </view>
      </view>

      <view class="save-spacer" aria-hidden="true" />
      <view class="save-bar">
        <text class="sr-only" role="status">{{ saveStatus }}</text>
        <button
          class="save-button"
          :disabled="saving || !dirty"
          :aria-busy="saving"
          @tap="savePreferences"
        >
          {{ saving ? '保存中…' : dirty ? '保存修改' : '已保存' }}
        </button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onBackPress, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import {
  ApiError,
  listMobileUserPreferences,
  replaceMobileUserPreferences,
  type ApiUserPreference
} from '../../services/public-api';

type PreferenceKind = ApiUserPreference['kind'];
type ShareScope = ApiUserPreference['shareScope'];
type EditablePreference = Pick<ApiUserPreference, 'kind' | 'value' | 'shareScope'> & {
  localId: string;
};

const sections: Array<{
  kind: PreferenceKind;
  title: string;
  description: string;
  placeholder: string;
}> = [
  { kind: 'LIKE', title: '喜欢', description: '家人可以优先考虑这些口味', placeholder: '例如：清淡、番茄' },
  { kind: 'AVOID', title: '忌口', description: '采购和做饭时会提醒家人避开', placeholder: '例如：香菜、肥肉' },
  { kind: 'ALLERGY', title: '过敏', description: '涉及健康安全，请如实填写', placeholder: '例如：花生、虾' }
];

const items = ref<EditablePreference[]>([]);
const loading = ref(false);
const saving = ref(false);
const needsLogin = ref(false);
const hasLoaded = ref(false);
const loadedUserId = ref<number | null>(null);
const reauthPendingUserId = ref<number | null>(null);
const saveStatus = ref('');
let allowBack = false;
const loadError = ref('');
const savedSnapshot = ref('');
const drafts = reactive<Record<PreferenceKind, string>>({
  LIKE: '',
  AVOID: '',
  ALLERGY: ''
});

const toSnapshot = (value: Array<Pick<ApiUserPreference, 'kind' | 'value' | 'shareScope'>>) =>
  JSON.stringify(
    value
      .map(({ kind, value: itemValue, shareScope }) => ({ kind, value: itemValue, shareScope }))
      .sort((left, right) => `${left.kind}:${left.value}`.localeCompare(`${right.kind}:${right.value}`, 'zh-CN'))
  );

const dirty = computed(() => toSnapshot(items.value) !== savedSnapshot.value);

const itemsByKind = (kind: PreferenceKind) => items.value.filter((item) => item.kind === kind);

const createLocalId = (item: Pick<ApiUserPreference, 'kind' | 'value'>, index: number) =>
  `${item.kind}-${item.value}-${Date.now()}-${index}`;

const setScope = (localId: string, scope: ShareScope) => {
  const item = items.value.find((entry) => entry.localId === localId);
  if (!item || item.shareScope === scope || saving.value) return;
  item.shareScope = scope;
};

const removeItem = (localId: string) => {
  if (saving.value) return;
  items.value = items.value.filter((item) => item.localId !== localId);
};

const addItem = (kind: PreferenceKind) => {
  if (saving.value) return;
  const value = drafts[kind].trim();
  if (!value) return;
  const duplicate = items.value.some(
    (item) => item.kind === kind && item.value.toLocaleLowerCase() === value.toLocaleLowerCase()
  );
  if (duplicate) {
    uni.showToast({ title: '这项已经添加过了', icon: 'none' });
    return;
  }
  items.value = [
    ...items.value,
    {
      localId: createLocalId({ kind, value }, items.value.length),
      kind,
      value,
      shareScope: 'FAMILY'
    }
  ];
  drafts[kind] = '';
};

const loadPreferences = async () => {
  if (loading.value || saving.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    const localUser = loadAuthUser();
    if (!localUser) {
      needsLogin.value = true;
      hasLoaded.value = true;
      loadedUserId.value = null;
      items.value = [];
      savedSnapshot.value = toSnapshot([]);
      return;
    }
    const user = await syncAuthUserWithBackend(localUser);
    if (!user?.token) {
      needsLogin.value = true;
      return;
    }
    const result = await listMobileUserPreferences();
    items.value = result.map((item, index) => ({
      localId: String(item.id || createLocalId(item, index)),
      kind: item.kind,
      value: item.value,
      shareScope: item.shareScope
    }));
    savedSnapshot.value = toSnapshot(items.value);
    needsLogin.value = false;
    hasLoaded.value = true;
    loadedUserId.value = user.id ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.code === 401) {
      needsLogin.value = true;
      items.value = [];
      savedSnapshot.value = toSnapshot([]);
      return;
    }
    loadError.value = error instanceof Error ? error.message : '请稍后再试';
  } finally {
    loading.value = false;
  }
};

const savePreferences = async () => {
  if (saving.value || !dirty.value) return;
  saving.value = true;
  saveStatus.value = '正在保存口味';
  try {
    const remoteItems = await listMobileUserPreferences();
    if (toSnapshot(remoteItems) !== savedSnapshot.value) {
      const shouldOverwrite = await new Promise<boolean>((resolve) => {
        uni.showModal({
          title: '口味信息已更新',
          content: '你的口味已在其他设备修改。继续会以当前页面内容覆盖远端修改。',
          cancelText: '重新加载',
          confirmText: '继续保存',
          success: ({ confirm }) => resolve(confirm),
          fail: () => resolve(false)
        });
      });
      if (!shouldOverwrite) {
        items.value = remoteItems.map((item, index) => ({
          localId: String(item.id || createLocalId(item, index)),
          kind: item.kind,
          value: item.value,
          shareScope: item.shareScope
        }));
        savedSnapshot.value = toSnapshot(items.value);
        saveStatus.value = '已加载最新口味';
        return;
      }
    }
    const result = await replaceMobileUserPreferences(
      items.value.map(({ kind, value, shareScope }) => ({ kind, value, shareScope }))
    );
    items.value = result.map((item, index) => ({
      localId: String(item.id || createLocalId(item, index)),
      kind: item.kind,
      value: item.value,
      shareScope: item.shareScope
    }));
    savedSnapshot.value = toSnapshot(items.value);
    saveStatus.value = '口味已保存';
    uni.showToast({ title: '口味已保存', icon: 'success' });
  } catch (error) {
    if (error instanceof ApiError && error.code === 401) {
      needsLogin.value = true;
      reauthPendingUserId.value = loadedUserId.value;
      saveStatus.value = '登录已过期，修改尚未保存';
      return;
    }
    saveStatus.value = '保存失败';
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败，请重试', icon: 'none' });
  } finally {
    saving.value = false;
  }
};

const goBack = () => {
  if (dirty.value) {
    confirmDiscard();
    return;
  }
  performBack();
};

const confirmDiscard = () => {
  uni.showModal({
    title: '放弃未保存的修改？',
    content: '返回后，本次口味和共享范围的修改不会保留。',
    cancelText: '继续编辑',
    confirmText: '放弃修改',
    success: ({ confirm }) => {
      if (!confirm) return;
      allowBack = true;
      performBack();
    }
  });
};

const performBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.reLaunch({ url: '/pages/mine/index' });
};

const goLogin = () => uni.navigateTo({ url: '/pages/login/index' });

onShow(() => {
  const currentUser = loadAuthUser();
  const currentUserId = currentUser?.id ?? null;
  if (
    reauthPendingUserId.value !== null
    && currentUserId === reauthPendingUserId.value
    && Boolean(currentUser?.token)
  ) {
    needsLogin.value = false;
    hasLoaded.value = true;
    reauthPendingUserId.value = null;
    saveStatus.value = '登录已恢复，请重新保存修改';
    return;
  }
  if (
    reauthPendingUserId.value !== null
    && currentUserId !== null
    && currentUserId !== reauthPendingUserId.value
  ) {
    reauthPendingUserId.value = null;
  }
  if (loadedUserId.value !== currentUserId) {
    items.value = [];
    savedSnapshot.value = toSnapshot([]);
    hasLoaded.value = false;
    loadedUserId.value = currentUserId;
  }
  if (hasLoaded.value && !needsLogin.value) return;
  void loadPreferences();
});

onBackPress(() => {
  if (allowBack || !dirty.value) return false;
  confirmDiscard();
  return true;
});
</script>

<style scoped lang="scss">
.taste-page {
  min-height: 100dvh;
  padding-top: 0;
  padding-bottom: 0;
  background: var(--app-bg);
}

.safe-top-spacer {
  height: var(--app-safe-area-top);
}

.page-header {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
  min-height: 80rpx;
  margin-top: 12rpx;
}

.icon-button,
.state-action,
.scope-option,
.delete-button,
.add-button,
.save-button {
  border: 0;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  padding: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--app-text);
}

.page-title {
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
  text-align: center;
}

.intro {
  margin-top: 36rpx;
  margin-bottom: 30rpx;
}

.intro-title,
.intro-copy,
.section-title,
.section-description,
.section-count,
.preference-value,
.add-hint,
.state-title,
.state-description {
  display: block;
}

.intro-title {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.intro-copy {
  max-width: 620rpx;
  margin-top: 8rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.preference-sections {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.preference-section,
.state-card {
  border-radius: var(--app-radius-card);
  background: var(--app-surface-strong);
  box-shadow: var(--app-shadow);
}

.preference-section {
  overflow: hidden;
  padding: 28rpx;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.section-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
}

.section-description {
  margin-top: 4rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.section-count {
  flex: 0 0 auto;
  padding-top: 2rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
  font-variant-numeric: tabular-nums;
}

.preference-list {
  margin-top: 24rpx;
  border-top: 1rpx solid var(--app-border);
}

.preference-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64rpx;
  align-items: center;
  gap: 16rpx;
  min-height: 116rpx;
  border-bottom: 1rpx solid var(--app-border);
}

.preference-copy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  min-width: 0;
}

.preference-value {
  min-width: 0;
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scope-switch {
  display: flex;
  flex: 0 0 auto;
  padding: 4rpx;
  border-radius: 18rpx;
  background: var(--app-accent-soft);
}

.scope-option {
  min-width: 104rpx;
  min-height: 88rpx;
  padding: 0 14rpx;
  border-radius: 15rpx;
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  line-height: var(--line-tag);
  transition: color 180ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.scope-option.is-active {
  background: var(--app-surface-strong);
  color: var(--app-primary);
  box-shadow: 0 3rpx 12rpx rgba(84, 96, 76, 0.09);
}

.delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  padding: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--app-text-tertiary);
}

.section-empty {
  display: flex;
  align-items: center;
  min-height: 92rpx;
  margin-top: 20rpx;
  padding: 0 20rpx;
  border-radius: var(--app-radius-input);
  background: var(--app-bg);
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.add-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112rpx;
  gap: 12rpx;
  margin-top: 20rpx;
}

.preference-input {
  box-sizing: border-box;
  width: 100%;
  height: 88rpx;
  padding: 0 22rpx;
  border-radius: var(--app-radius-input);
  background: var(--app-bg);
  color: var(--app-text);
  font-size: var(--font-size-body);
  line-height: var(--line-body);
}

.add-button {
  min-height: 88rpx;
  padding: 0;
  border-radius: var(--app-radius-input);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body);
  font-weight: var(--font-medium);
  line-height: var(--line-body);
}

.add-button[disabled] {
  opacity: 0.38;
}

.add-hint {
  margin-top: 10rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.save-spacer {
  height: calc(136rpx + var(--app-safe-area-bottom));
}

.save-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  box-sizing: border-box;
  padding: 18rpx 32rpx calc(18rpx + var(--app-safe-area-bottom));
  background: rgba(245, 241, 234, 0.94);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
}

.save-button {
  width: 100%;
  height: 88rpx;
  padding: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  line-height: var(--line-body);
}

.save-button[disabled] {
  background: var(--app-accent-soft);
  color: var(--app-primary);
  opacity: 1;
}

.state-card {
  margin-top: 36rpx;
  padding: 32rpx;
}

.state-card--center {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 360rpx;
  justify-content: center;
  text-align: center;
}

.state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  margin-bottom: 22rpx;
  border-radius: 28rpx;
  background: var(--app-accent-soft);
  color: var(--app-primary);
}

.state-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
}

.state-description {
  max-width: 520rpx;
  margin-top: 8rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.state-action {
  min-width: 200rpx;
  height: 76rpx;
  margin-top: 28rpx;
  padding: 0 30rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body);
  font-weight: var(--font-medium);
}

.skeleton-row {
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--app-border);
}

.skeleton-row:last-child {
  border-bottom: 0;
}

.skeleton-line {
  width: 66%;
  height: 24rpx;
  margin-top: 14rpx;
  border-radius: 12rpx;
  background: var(--app-accent-soft);
  animation: skeleton-pulse 1.2s ease-in-out infinite alternate;
}

.skeleton-line--title {
  width: 32%;
  height: 30rpx;
  margin-top: 0;
}

.icon-button:active,
.delete-button:active,
.state-action:active,
.add-button:active,
.save-button:active {
  transform: translateY(1rpx);
}

.scope-option:focus-visible,
.icon-button:focus-visible,
.delete-button:focus-visible,
.state-action:focus-visible,
.add-button:focus-visible,
.save-button:focus-visible,
.preference-input:focus-visible {
  outline: 3rpx solid rgba(122, 139, 111, 0.42);
  outline-offset: 3rpx;
}

@keyframes skeleton-pulse {
  from {
    opacity: 0.48;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line {
    animation: none;
  }

  .scope-option {
    transition: none;
  }
}

@media (max-width: 374px) {
  .preference-copy {
    align-items: flex-start;
    flex-direction: column;
    gap: 10rpx;
    padding: 18rpx 0;
  }

  .preference-row {
    min-height: 138rpx;
  }
}
</style>
