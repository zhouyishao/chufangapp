<template>
  <view class="app-page recipe-create-page">
    <view class="topbar glass-card">
      <button class="icon-button" @tap="goBack">
        <text>←</text>
      </button>
      <view>
        <text class="eyebrow">传菜谱</text>
        <text class="page-title">添加食谱</text>
      </view>
      <button class="draft-button" @tap="saveDraft">草稿</button>
    </view>

    <view class="cover-card">
      <image v-if="form.image" class="cover-image" :src="form.image" mode="aspectFill" />
      <view v-else class="cover-placeholder">
        <text class="cover-icon">{{ form.coverType === 'video' ? '▶' : '＋' }}</text>
        <text class="cover-title">{{ form.coverType === 'video' ? '已添加成品视频' : '添加成品图或视频' }}</text>
        <text class="cover-desc">突出完成状态</text>
      </view>
      <view class="cover-actions">
        <button :class="['cover-action', { 'is-active': form.coverType === 'image' }]" @tap="chooseCoverImage">
          图片
        </button>
        <button :class="['cover-action', { 'is-active': form.coverType === 'video' }]" @tap="chooseCoverVideo">
          视频
        </button>
      </view>
    </view>

    <view class="form-section glass-card">
      <view class="field-block field-block--title">
        <input v-model="form.name" class="title-input" placeholder="菜谱标题" maxlength="24" />
      </view>
      <view class="field-block">
        <textarea
          v-model="form.description"
          class="intro-input"
          maxlength="80"
          placeholder="介绍这道菜的味道、灵感或适合场景"
        />
      </view>
      <view class="quick-grid">
        <view class="quick-field">
          <text class="quick-label">耗时</text>
          <input v-model="form.duration" class="quick-input" placeholder="20 分钟" />
        </view>
        <view class="quick-field">
          <text class="quick-label">难度</text>
          <picker :range="difficultyOptions" @change="changeDifficulty">
            <view class="picker-value">{{ form.difficulty }}</view>
          </picker>
        </view>
        <view class="quick-field">
          <text class="quick-label">口味</text>
          <input v-model="form.flavor" class="quick-input" placeholder="清爽" />
        </view>
      </view>
    </view>

    <view class="form-section glass-card">
      <view class="section-head">
        <view>
          <text class="section-title">用料</text>
          <text class="section-desc">食材和用量分开填写</text>
        </view>
      </view>
      <view class="ingredient-list">
        <view v-for="(ingredient, index) in ingredients" :key="ingredient.id" class="ingredient-row">
          <input v-model="ingredient.name" class="ingredient-name" placeholder="食材" />
          <input v-model="ingredient.amount" class="ingredient-amount" placeholder="用量" />
          <button class="row-delete" @tap="removeIngredient(index)">×</button>
        </view>
      </view>
      <button class="add-row-button" @tap="addIngredient">＋ 添加用料</button>
    </view>

    <view class="form-section glass-card">
      <view class="section-head">
        <view>
          <text class="section-title">步骤</text>
          <text class="section-desc">按烹饪顺序逐步记录</text>
        </view>
      </view>
      <view class="step-list">
        <view v-for="(step, index) in steps" :key="step.id" class="step-card">
          <view class="step-index">{{ index + 1 }}</view>
          <view class="step-main">
            <textarea v-model="step.content" class="step-input" maxlength="140" placeholder="写下这一步的做法" />
            <view v-if="step.image || step.video" class="media-state">
              <text v-if="step.image">已添加图片</text>
              <text v-if="step.video">已添加视频</text>
            </view>
            <view class="step-tools">
              <button class="step-image-button" @tap="setStepImage(index)">添加图片</button>
              <button class="step-video-button" @tap="setStepVideo(index)">添加视频</button>
              <button class="step-delete-button" @tap="removeStep(index)">删除</button>
            </view>
          </view>
        </view>
      </view>
      <button class="add-row-button" @tap="addStep">＋ 添加步骤</button>
    </view>

    <view class="form-section glass-card">
      <view class="section-head">
        <view>
          <text class="section-title">发布设置</text>
          <text class="section-desc">当前 MVP 先保存到本地食谱库</text>
        </view>
      </view>
      <view class="setting-row">
        <text class="setting-label">分类</text>
        <picker :range="categoryOptions" @change="changeCategory">
          <view class="setting-value">{{ form.category }} ›</view>
        </picker>
      </view>
      <view class="setting-row">
        <text class="setting-label">可见范围</text>
        <picker :range="visibilityOptions" @change="changeVisibility">
          <view class="setting-value">{{ form.visibility }} ›</view>
        </picker>
      </view>
      <view class="note-box">
        <text>试菜心得</text>
        <textarea v-model="form.notes" maxlength="120" placeholder="记录下次想调整的火候、调味或食材替换" />
      </view>
    </view>

    <view class="bottom-actions glass-card">
      <button class="secondary-button" @tap="previewRecipe">预览</button>
      <button class="primary-button" @tap="saveRecipe">保存食谱</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

interface RecipeCreateForm {
  name: string;
  description: string;
  duration: string;
  difficulty: string;
  flavor: string;
  image: string;
  coverType: 'image' | 'video' | '';
  category: string;
  visibility: string;
  notes: string;
}

interface IngredientRow {
  id: string;
  name: string;
  amount: string;
}

interface StepRow {
  id: string;
  content: string;
  image: string;
  video: string;
}

const difficultyOptions = ['简单', '中等', '进阶'];
const categoryOptions = ['家常菜', '快手菜', '汤类', '早餐', '减脂', '私房菜'];
const visibilityOptions = ['仅自己可见', '家庭可见'];

const form = reactive<RecipeCreateForm>({
  name: '',
  description: '',
  duration: '',
  difficulty: '简单',
  flavor: '',
  image: '',
  coverType: '',
  category: '私房菜',
  visibility: '仅自己可见',
  notes: ''
});

const ingredients = ref<IngredientRow[]>([
  { id: 'ingredient-1', name: '', amount: '' },
  { id: 'ingredient-2', name: '', amount: '' }
]);

const steps = ref<StepRow[]>([
  { id: 'step-1', content: '', image: '', video: '' }
]);

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const goBack = () => {
  uni.navigateBack();
};

const chooseCoverImage = () => {
  form.image = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80';
  form.coverType = 'image';
  uni.showToast({ title: '已添加封面图', icon: 'none' });
};

const chooseCoverVideo = () => {
  form.image = '';
  form.coverType = 'video';
  uni.showToast({ title: '已添加成品视频', icon: 'none' });
};

const addIngredient = () => {
  ingredients.value.push({ id: createId('ingredient'), name: '', amount: '' });
};

const removeIngredient = (index: number) => {
  if (ingredients.value.length <= 1) {
    uni.showToast({ title: '至少保留 1 项用料', icon: 'none' });
    return;
  }

  ingredients.value.splice(index, 1);
};

const addStep = () => {
  steps.value.push({ id: createId('step'), content: '', image: '', video: '' });
};

const removeStep = (index: number) => {
  if (steps.value.length <= 1) {
    uni.showToast({ title: '至少保留 1 个步骤', icon: 'none' });
    return;
  }

  steps.value.splice(index, 1);
};

const setStepImage = (index: number) => {
  steps.value[index].image = '已添加图片';
  uni.showToast({ title: '步骤图已添加', icon: 'none' });
};

const setStepVideo = (index: number) => {
  steps.value[index].video = '已添加视频';
  uni.showToast({ title: '步骤视频已添加', icon: 'none' });
};

const changeDifficulty = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: number } };
  form.difficulty = difficultyOptions[detail.detail?.value ?? 0];
};

const changeCategory = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: number } };
  form.category = categoryOptions[detail.detail?.value ?? 0];
};

const changeVisibility = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: number } };
  form.visibility = visibilityOptions[detail.detail?.value ?? 0];
};

const validateRequired = () => {
  if (!form.name.trim()) {
    uni.showToast({ title: '请填写菜谱标题', icon: 'none' });
    return false;
  }

  if (!ingredients.value.some((ingredient) => ingredient.name.trim())) {
    uni.showToast({ title: '请至少填写 1 项用料', icon: 'none' });
    return false;
  }

  if (!steps.value.some((step) => step.content.trim())) {
    uni.showToast({ title: '请至少填写 1 个步骤', icon: 'none' });
    return false;
  }

  return true;
};

const saveDraft = () => {
  uni.showToast({ title: '草稿已保存', icon: 'success' });
};

const previewRecipe = () => {
  if (!validateRequired()) {
    return;
  }

  uni.showToast({ title: '预览功能待接入', icon: 'none' });
};

const saveRecipe = () => {
  if (!validateRequired()) {
    return;
  }

  uni.showToast({ title: '食谱已保存', icon: 'success' });
  setTimeout(() => {
    uni.navigateBack();
  }, 500);
};
</script>

<style scoped lang="scss">
.recipe-create-page {
  min-height: 100vh;
  padding-top: 20rpx;
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom, 0));
}

.topbar {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 18rpx;
  padding: 18rpx 22rpx;
  border-radius: 32rpx;
  background: rgba(255, 253, 252, 0.94);
  backdrop-filter: blur(18rpx);
}

.icon-button,
.draft-button,
.row-delete,
.add-row-button,
.cover-action,
.step-image-button,
.step-video-button,
.step-delete-button,
.primary-button,
.secondary-button {
  border: 0;
}

.icon-button::after,
.draft-button::after,
.row-delete::after,
.add-row-button::after,
.cover-action::after,
.step-image-button::after,
.step-video-button::after,
.step-delete-button::after,
.primary-button::after,
.secondary-button::after {
  border: 0;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #e9e2d6;
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
}

.icon-button text {
  line-height: var(--line-tabbar);
}

.draft-button {
  min-width: 104rpx;
  height: 60rpx;
  margin-left: auto;
  border-radius: var(--app-radius-button);
  background: #7a8b6f;
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.eyebrow,
.page-title,
.cover-icon,
.cover-title,
.cover-desc,
.section-title,
.section-desc,
.quick-label,
.setting-label {
  display: block;
}

.eyebrow {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.page-title {
  margin-top: 2rpx;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.cover-card {
  position: relative;
  height: 268rpx;
  overflow: hidden;
  border-radius: var(--app-radius-card);
  background: #fffdfc;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.04);
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background:
    linear-gradient(135deg, rgba(255, 253, 252, 0.9), rgba(233, 226, 214, 0.78)),
    #fffdfc;
}

.cover-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #7a8b6f;
  color: var(--text-white);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-hero);
  text-align: center;
}

.cover-title {
  margin-top: 16rpx;
  color: var(--app-text);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.cover-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
}

.cover-actions {
  position: absolute;
  right: 18rpx;
  bottom: 18rpx;
  display: flex;
  gap: 12rpx;
  padding: 8rpx;
  border-radius: var(--app-radius-button);
  background: rgba(255, 253, 252, 0.9);
  backdrop-filter: blur(14rpx);
}

.cover-action {
  min-width: 92rpx;
  height: 54rpx;
  border-radius: var(--app-radius-button);
  background: #e9e2d6;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.cover-action.is-active {
  background: #7a8b6f;
  color: var(--text-white);
}

.form-section {
  margin-top: 20rpx;
  padding: 26rpx;
  border-radius: var(--app-radius-card);
  background: #fffdfc;
}

.title-input,
.intro-input,
.quick-input,
.ingredient-name,
.ingredient-amount,
.step-input,
.note-box textarea {
  box-sizing: border-box;
  width: 100%;
  border: 0;
  color: var(--app-text);
  font-weight: var(--font-medium);
}

.field-block {
  padding: 22rpx;
  border-radius: 26rpx;
  background: #e9e2d6;
}

.field-block + .field-block {
  margin-top: 14rpx;
}

.field-block--title {
  background: #fffdfc;
  border: 1rpx solid var(--app-border);
}

.title-input {
  height: 64rpx;
  padding: 0;
  background: transparent;
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.intro-input {
  height: 108rpx;
  padding: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 20rpx;
}

.quick-field {
  min-height: 98rpx;
  padding: 16rpx;
  border-radius: 24rpx;
  background: #e9e2d6;
}

.quick-label {
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.quick-input,
.picker-value {
  margin-top: 8rpx;
  color: var(--app-text);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.quick-input {
  height: 42rpx;
  padding: 0;
  background: transparent;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 22rpx;
}

.section-title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.section-desc {
  margin-top: 8rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-caption);
}

.ingredient-list,
.step-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.ingredient-row {
  display: grid;
  grid-template-columns: 1fr 154rpx 48rpx;
  align-items: center;
  gap: 12rpx;
  min-height: 78rpx;
  padding: 0 16rpx;
  border-radius: 24rpx;
  background: #e9e2d6;
}

.ingredient-name,
.ingredient-amount {
  height: 76rpx;
  padding: 0;
  background: transparent;
  font-size: var(--font-size-caption);
}

.ingredient-amount {
  text-align: right;
}

.row-delete {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #fffdfc;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-body);
  line-height: var(--line-body-sm);
}

.add-row-button {
  width: 100%;
  height: 74rpx;
  margin-top: 16rpx;
  border-radius: 22rpx;
  background: #e9e2d6;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.step-card {
  display: flex;
  gap: 16rpx;
  padding: 18rpx 16rpx;
  border-radius: 28rpx;
  background: #e9e2d6;
}

.step-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #7a8b6f;
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.step-main {
  flex: 1;
  min-width: 0;
}

.step-input {
  height: 122rpx;
  padding: 0;
  background: transparent;
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.step-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 14rpx;
}

.step-image-button,
.step-video-button,
.step-delete-button {
  height: 58rpx;
  padding: 0 20rpx;
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
}

.step-image-button {
  background: #fffdfc;
  color: var(--app-text);
}

.step-video-button {
  background: #7a8b6f;
  color: var(--text-white);
}

.step-delete-button {
  background: rgba(229, 115, 95, 0.12);
  color: var(--app-danger);
}

.media-state {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 12rpx;
}

.media-state text {
  padding: 8rpx 14rpx;
  border-radius: var(--app-radius-button);
  background: #fffdfc;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 78rpx;
  border-bottom: 1rpx solid var(--app-border);
}

.setting-label {
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.setting-value {
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
}

.note-box {
  margin-top: 22rpx;
  padding: 22rpx;
  border-radius: 26rpx;
  background: #e9e2d6;
}

.note-box text {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.note-box textarea {
  height: 126rpx;
  margin-top: 14rpx;
  padding: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
  line-height: var(--line-body-sm);
}

.bottom-actions {
  position: fixed;
  right: 32rpx;
  bottom: calc(28rpx + env(safe-area-inset-bottom, 0));
  left: 32rpx;
  z-index: 20;
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 18rpx;
  padding: 18rpx;
  border-radius: var(--app-radius-card);
  background: rgba(255, 253, 252, 0.94);
  backdrop-filter: blur(18rpx);
}

.primary-button,
.secondary-button {
  height: 82rpx;
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.primary-button {
  background: #7a8b6f;
  color: var(--text-white);
}

.secondary-button {
  background: #e9e2d6;
  color: var(--app-text);
}
</style>
