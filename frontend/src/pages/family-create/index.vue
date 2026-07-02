<template>
  <view class="app-page create-page">
    <view class="topbar">
      <button class="nav-button" @tap="goBack">
        <app-icon name="arrow-left" size="26rpx" />
      </button>
      <text class="topbar-title">创建家庭</text>
      <view class="topbar-spacer" />
    </view>

    <view class="hero glass-card">
      <text class="hero-title">给家里的菜篮子起个名字</text>
      <text class="hero-desc">创建后会在后端生成家庭和创建者成员记录，家人可通过邀请二维码加入。</text>
    </view>

    <view class="form-card glass-card">
      <text class="field-label">家庭名称</text>
      <input v-model="name" class="field-input" placeholder="例如：周末小家" maxlength="24" />

      <text class="field-label">所在城市</text>
      <input v-model="city" class="field-input" placeholder="可选，例如：上海" maxlength="20" />

      <text class="field-label">所在区县</text>
      <input v-model="district" class="field-input" placeholder="可选，例如：浦东新区" maxlength="20" />

      <text class="field-label">家庭说明</text>
      <textarea v-model="description" class="field-textarea" placeholder="可选，例如：晚餐少油少盐" maxlength="80" />

      <button class="primary-button" :disabled="submitting" @tap="submit">{{ submitting ? '创建中' : '创建家庭' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '../../components/app/app-icon.vue';
import { createFamily } from '../../services/family';

const name = ref('');
const city = ref('');
const district = ref('');
const description = ref('');
const submitting = ref(false);

const goBack = () => {
  uni.navigateBack();
};

const submit = async () => {
  const trimmedName = name.value.trim();
  if (!trimmedName) {
    uni.showToast({ title: '请填写家庭名称', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    const family = await createFamily(trimmedName, {
      city: city.value,
      district: district.value,
      description: description.value
    });
    uni.showToast({ title: '家庭已创建', icon: 'success' });
    uni.redirectTo({ url: `/pages/family-manage/index?id=${family.id}` });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '创建失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.create-page {
  padding-bottom: calc(90rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: grid;
  grid-template-columns: 72rpx 1fr 72rpx;
  align-items: center;
}

.nav-button,
.primary-button {
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

.hero,
.form-card {
  margin-top: 24rpx;
  padding: 30rpx;
}

.hero-title,
.hero-desc,
.field-label {
  display: block;
}

.hero-title {
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
}

.hero-desc {
  margin-top: 14rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.field-label {
  margin-top: 22rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
}

.field-label:first-child {
  margin-top: 0;
}

.field-input,
.field-textarea {
  width: 100%;
  margin-top: 12rpx;
  padding: 0 24rpx;
  border-radius: var(--app-radius-input);
  background: var(--app-accent-soft);
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
}

.field-input {
  height: 84rpx;
}

.field-textarea {
  min-height: 150rpx;
  padding-top: 22rpx;
  line-height: var(--line-body-sm);
}

.primary-button {
  width: 100%;
  height: 88rpx;
  margin-top: 30rpx;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}
</style>
