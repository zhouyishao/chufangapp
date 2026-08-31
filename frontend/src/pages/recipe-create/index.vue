<template>
  <view class="app-page recipe-create-page">
    <header class="recipe-create-header">
      <button class="app-icon-button recipe-create-header__back" aria-label="返回" @tap="goBack">
        <app-icon name="arrow-left" size="40rpx" />
      </button>
      <text class="page-title">{{ isEditing ? '编辑菜谱' : '添加菜谱' }}</text>
      <view class="recipe-create-header__spacer" aria-hidden="true" />
    </header>

    <nav class="create-progress" :aria-label="isEditing ? '编辑菜谱进度' : '添加菜谱进度'">
      <button
        v-for="stage in createStages"
        :key="stage.id"
        :class="['create-progress__item', { 'is-active': currentStage === stage.id, 'is-complete': currentStage > stage.id }]"
        :aria-label="`${stage.id} / 4 ${stage.label}`"
        :aria-current="currentStage === stage.id ? 'step' : undefined"
        :disabled="stage.id > furthestStage"
        @tap="jumpToStage(stage.id)"
      >
        <view class="create-progress__dot" aria-hidden="true" />
      </button>
    </nav>
    <text class="create-progress-label">{{ currentStage }} / 4　{{ currentStageLabel }}</text>

    <main v-if="isLoadingExisting" class="create-stage edit-loading" aria-live="polite">
      <view class="edit-loading__media" />
      <view class="edit-loading__line edit-loading__line--title" />
      <view class="edit-loading__line" />
      <text>正在读取菜谱内容</text>
    </main>

    <main v-else class="create-stage">
      <section v-if="currentStage === 1" class="form-section">
        <view class="section-head">
          <view>
            <text class="section-title">基本信息与封面</text>
            <text class="section-desc">先写名称，再添加至少一张图片或视频</text>
          </view>
          <text class="media-count">{{ form.coverType ? 1 : 0 }} / 10</text>
        </view>

        <view class="field-block field-block--title">
          <text class="field-label">菜谱名称</text>
          <input v-model="form.name" class="title-input" placeholder="例如：番茄炖牛腩" maxlength="30" />
        </view>

        <view class="media-heading">
          <view>
            <text class="field-label">封面媒体</text>
            <text class="media-spec">图片 JPG / PNG / WebP，最大 5MB；视频 MP4 / MOV / WebM，最大 50MB。</text>
          </view>
        </view>
        <view class="cover-card">
          <image
            v-if="form.coverType === 'image' && form.image"
            class="cover-image"
            :src="form.image"
            mode="aspectFill"
          />
          <view v-else class="cover-placeholder">
            <app-icon :name="form.coverType === 'video' ? 'play' : 'image'" size="34rpx" />
            <text class="cover-title">{{ form.coverType === 'video' ? '成品视频已选择' : '上传成品图或视频' }}</text>
            <text class="cover-desc">建议使用清晰、光线自然的横图</text>
          </view>
          <view class="cover-actions">
            <button
              :class="['cover-action', { 'is-active': form.coverType === 'image' }]"
              :disabled="coverUploadState.uploading"
              @tap="chooseCoverImage"
            >
              <app-icon name="image" size="20rpx" />
              <text>图片</text>
            </button>
            <button
              :class="['cover-action', { 'is-active': form.coverType === 'video' }]"
              :disabled="coverUploadState.uploading"
              @tap="chooseCoverVideo"
            >
              <app-icon name="play" size="20rpx" />
              <text>视频</text>
            </button>
          </view>
        </view>
        <view
          v-if="coverUploadState.uploading || coverUploadState.error"
          class="media-upload-status"
          aria-live="polite"
        >
          <text v-if="coverUploadState.uploading">封面上传中 {{ coverUploadState.progress }}%</text>
          <text v-else class="media-upload-status__error">{{ coverUploadState.error }}</text>
          <button
            v-if="coverUploadState.error"
            class="media-upload-status__retry"
            @tap="retryCoverUpload"
          >
            重试上传
          </button>
        </view>
      </section>

      <section v-else-if="currentStage === 2" class="form-section">
        <view class="section-head">
          <view>
            <text class="section-title">菜谱信息与用料</text>
            <text class="section-desc">补充烹饪信息，并列出需要准备的食材。</text>
          </view>
        </view>
        <view class="field-block">
          <view class="field-label-row">
            <text class="field-label">一句介绍</text>
            <text class="field-count">{{ form.description.length }}/80</text>
          </view>
          <textarea
            v-model="form.description"
            class="intro-input"
            maxlength="80"
            placeholder="写下味道、灵感或适合的场景"
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
        <view class="ingredient-section-head">
          <text class="ingredient-section-title">用料清单</text>
          <text class="ingredient-section-count">{{ completedIngredientCount }} 项</text>
        </view>
        <view class="ingredient-list">
          <view v-for="(ingredient, index) in ingredients" :key="ingredient.id" class="ingredient-row">
            <input v-model="ingredient.name" class="ingredient-name" placeholder="食材名称" />
            <input v-model="ingredient.amount" class="ingredient-amount" placeholder="用量，例如 500g" />
            <button class="row-delete app-icon-button" :aria-label="`删除第 ${index + 1} 项用料`" @tap="removeIngredient(index)">
              <app-icon name="close" size="20rpx" />
            </button>
          </view>
        </view>
        <button class="add-row-button" @tap="addIngredient">
          <app-icon name="plus" size="22rpx" />
          <text>添加用料</text>
        </button>

        <view class="settings-group">
          <view class="setting-row">
            <text class="setting-label">分类</text>
            <picker :range="categoryOptions" @change="changeCategory">
              <view class="setting-value">
                <text>{{ form.category || '请选择' }}</text>
                <app-icon name="chevron-right" size="22rpx" />
              </view>
            </picker>
          </view>
          <view class="setting-row">
            <text class="setting-label">可见范围</text>
            <picker :range="visibilityOptions" @change="changeVisibility">
              <view class="setting-value">
                <text>{{ form.visibility }}</text>
                <app-icon name="chevron-right" size="22rpx" />
              </view>
            </picker>
          </view>
          <view class="note-box">
            <text>试菜心得</text>
            <textarea v-model="form.notes" maxlength="120" placeholder="可选：记录火候、调味或食材替换" />
          </view>
        </view>
      </section>

      <section v-else-if="currentStage === 3" class="form-section">
        <view class="section-head">
          <view>
            <text class="section-title">制作步骤</text>
            <text class="section-desc">每一步都可配图片或视频，媒体加载失败时仍保留文字。</text>
          </view>
        </view>
        <view class="step-list">
          <view v-for="(step, index) in steps" :key="step.id" class="step-card">
            <view class="step-card__header">
              <text class="step-index">步骤 {{ index + 1 }}</text>
              <button class="step-delete-button" @tap="removeStep(index)">删除</button>
            </view>
            <input
              v-model="step.title"
              class="step-title-input"
              placeholder="步骤标题，例如：处理鲈鱼"
            />
            <textarea v-model="step.content" class="step-input" maxlength="140" placeholder="写下这一步的做法" />
            <view v-if="step.image" class="step-media-shell">
              <image class="step-media-preview" :src="step.image" mode="aspectFill" />
              <button
                class="step-media-remove app-icon-button"
                aria-label="删除步骤图片"
                @tap="removeStepMedia(index, 'image')"
              >
                <app-icon name="close" size="20rpx" />
              </button>
            </view>
            <view v-if="step.video" class="step-media-shell">
              <view class="step-video-preview">
                <app-icon name="play" size="30rpx" />
                <text>步骤视频已添加</text>
              </view>
              <button
                class="step-media-remove app-icon-button"
                aria-label="删除步骤视频"
                @tap="removeStepMedia(index, 'video')"
              >
                <app-icon name="close" size="20rpx" />
              </button>
            </view>
            <view class="step-tools">
              <button class="step-image-button" :disabled="step.uploading" @tap="setStepImage(index)">
                <app-icon name="image" size="20rpx" />
                <text>{{ step.image ? '替换图片' : '添加图片' }}</text>
              </button>
              <button class="step-video-button" :disabled="step.uploading" @tap="setStepVideo(index)">
                <app-icon name="play" size="20rpx" />
                <text>{{ step.video ? '替换视频' : '添加视频' }}</text>
              </button>
            </view>
            <view
              v-if="step.uploading || step.uploadError"
              class="media-upload-status media-upload-status--step"
              aria-live="polite"
            >
              <text v-if="step.uploading">媒体上传中 {{ step.uploadProgress }}%</text>
              <text v-else class="media-upload-status__error">{{ step.uploadError }}</text>
              <button
                v-if="step.uploadError"
                class="media-upload-status__retry"
                @tap="retryStepMediaUpload(index)"
              >
                重试上传
              </button>
            </view>
          </view>
        </view>
        <button class="add-row-button" @tap="addStep">
          <app-icon name="plus" size="22rpx" />
          <text>添加步骤</text>
        </button>
      </section>

      <section v-else class="form-section create-preview">
        <view class="section-head">
          <view>
            <text class="section-title">确认发布</text>
            <text class="section-desc">检查标题、用料和步骤，保存后可在“我的菜谱”查看。</text>
          </view>
        </view>
        <view class="preview-hero">
          <image v-if="form.image" class="preview-hero__image" :src="form.image" mode="aspectFill" />
          <view v-else class="preview-hero__placeholder">
            <app-icon name="image" size="32rpx" />
          </view>
          <view class="preview-hero__copy">
            <text class="preview-title">{{ form.name }}</text>
            <text class="preview-description">{{ form.description || '还没有填写介绍' }}</text>
            <text class="preview-meta">{{ form.duration || '未填写耗时' }} · {{ form.difficulty }} · {{ form.visibility }}</text>
          </view>
        </view>
        <view class="preview-summary">
          <view>
            <text>{{ completedIngredientCount }}</text>
            <text>项用料</text>
          </view>
          <view>
            <text>{{ completedStepCount }}</text>
            <text>个步骤</text>
          </view>
          <view>
            <text>{{ form.category || '未分类' }}</text>
            <text>菜谱分类</text>
          </view>
        </view>
        <view class="preview-content-section">
          <view class="preview-content-heading">
            <text>用料</text>
            <text>{{ completedIngredientCount }} 项</text>
          </view>
          <view class="preview-ingredient-list">
            <view
              v-for="ingredient in completedIngredients"
              :key="ingredient.id"
              class="preview-ingredient-row"
            >
              <text>{{ ingredient.name }}</text>
              <text>{{ ingredient.amount || '适量' }}</text>
            </view>
          </view>
        </view>
        <view class="preview-content-section">
          <view class="preview-content-heading">
            <text>步骤</text>
            <text>{{ completedStepCount }} 步</text>
          </view>
          <view class="preview-step-list">
            <view
              v-for="(step, index) in completedSteps"
              :key="step.id"
              class="preview-step"
              :class="{ 'preview-step--text-only': !step.image && !step.video }"
            >
              <image
                v-if="step.image"
                class="preview-step__media"
                :src="step.image"
                mode="aspectFill"
              />
              <view v-else-if="step.video" class="preview-step__media preview-step__video">
                <app-icon name="play" size="28rpx" />
              </view>
              <view class="preview-step__copy">
                <text class="preview-step__index">{{ String(index + 1).padStart(2, '0') }}</text>
                <text class="preview-step__title">{{ step.title || `步骤 ${index + 1}` }}</text>
                <text class="preview-step__description">{{ step.content }}</text>
              </view>
            </view>
          </view>
        </view>
        <button class="preview-edit" @tap="jumpToStage(1)">
          <app-icon name="edit" size="20rpx" />
          <text>返回修改</text>
        </button>
      </section>
    </main>

    <footer v-if="!isLoadingExisting" class="create-bottom-actions app-fixed-glass">
      <button
        v-if="currentStage > 1"
        class="create-bottom-actions__secondary"
        :disabled="isSaving"
        @tap="goPreviousStage"
      >
        上一步
      </button>
      <button
        v-if="currentStage < 4"
        :class="['create-bottom-actions__primary', { 'create-bottom-actions__primary--full': currentStage === 1 }]"
        :disabled="isUploadingMedia"
        @tap="goNextStage"
      >
        下一步
      </button>
      <button
        v-else
        class="create-bottom-actions__primary"
        :disabled="isSaving || isUploadingMedia"
        @tap="saveRecipe"
      >
        {{ isSaving ? '保存中…' : isEditing ? '保存修改' : '保存菜谱' }}
      </button>
    </footer>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { uploadContentFile } from '../../services/file-upload';
import { findMyRecipeById, saveMyRecipe, updateMyRecipe } from '../../services/my-recipes';
import { getHome } from '../../services/public-api';

interface RecipeCreateForm {
  name: string;
  description: string;
  duration: string;
  difficulty: string;
  flavor: string;
  image: string;
  video: string;
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
  title: string;
  content: string;
  image: string;
  video: string;
  imageFileId: number | null;
  videoFileId: number | null;
  pendingMediaPath: string;
  pendingMediaType: 'image' | 'video' | '';
  uploading: boolean;
  uploadProgress: number;
  uploadError: string;
  uploadSequence: number;
}

const difficultyOptions = ['简单', '中等', '进阶'];
const categoryOptions = ref<string[]>([]);
const visibilityOptions = ['仅自己可见', '家庭可见'];
const createStages = [
  { id: 1, label: '基本信息' },
  { id: 2, label: '用料设置' },
  { id: 3, label: '制作步骤' },
  { id: 4, label: '确认发布' }
] as const;
type CreateStage = (typeof createStages)[number]['id'];

const form = reactive<RecipeCreateForm>({
  name: '',
  description: '',
  duration: '',
  difficulty: '简单',
  flavor: '',
  image: '',
  video: '',
  coverType: '',
  category: '',
  visibility: '仅自己可见',
  notes: ''
});

const ingredients = ref<IngredientRow[]>([
  { id: 'ingredient-1', name: '', amount: '' },
  { id: 'ingredient-2', name: '', amount: '' }
]);

const steps = ref<StepRow[]>([
  {
    id: 'step-1',
    title: '',
    content: '',
    image: '',
    video: '',
    imageFileId: null,
    videoFileId: null,
    pendingMediaPath: '',
    pendingMediaType: '',
    uploading: false,
    uploadProgress: 0,
    uploadError: '',
    uploadSequence: 0
  }
]);
const coverFileId = ref<number | null>(null);
const coverVideoFileId = ref<number | null>(null);
const coverUploadState = reactive({
  uploading: false,
  progress: 0,
  error: '',
  pendingMediaPath: '',
  pendingMediaType: '' as 'image' | 'video' | '',
  uploadSequence: 0
});
const isSaving = ref(false);
const isLoadingExisting = ref(false);
const editingRecipeId = ref('');
const initialEditSignature = ref('');
const isEditing = computed(() => Boolean(editingRecipeId.value));
const currentStage = ref<CreateStage>(1);
const furthestStage = ref<CreateStage>(1);
const currentStageLabel = computed(
  () => createStages.find((stage) => stage.id === currentStage.value)?.label ?? ''
);
const completedIngredients = computed(() =>
  ingredients.value.filter((ingredient) => ingredient.name.trim())
);
const completedSteps = computed(() => steps.value.filter((step) => step.content.trim()));
const completedIngredientCount = computed(() => completedIngredients.value.length);
const completedStepCount = computed(() => completedSteps.value.length);
const isUploadingMedia = computed(
  () => coverUploadState.uploading || steps.value.some((step) => step.uploading)
);
const hasMediaUploadError = computed(
  () => Boolean(coverUploadState.error || steps.value.some((step) => step.uploadError))
);
const editableSignature = () =>
  JSON.stringify({
    form,
    coverFileId: coverFileId.value,
    coverVideoFileId: coverVideoFileId.value,
    ingredients: ingredients.value,
    steps: steps.value.map(({ uploadProgress, uploadSequence, uploading, uploadError, pendingMediaPath, pendingMediaType, ...step }) => step)
  });

const hasUnsavedContent = computed(() => {
  if (isEditing.value) {
    return Boolean(initialEditSignature.value && editableSignature() !== initialEditSignature.value);
  }
  return Boolean(
    form.name.trim() ||
    form.description.trim() ||
    form.coverType ||
    ingredients.value.some((ingredient) => ingredient.name.trim() || ingredient.amount.trim()) ||
    steps.value.some((step) => step.title.trim() || step.content.trim() || step.image || step.video)
  );
});

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const uploadErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : '上传失败，请重试';

const uploadCoverMedia = async (filePath: string, type: 'image' | 'video') => {
  const sequence = coverUploadState.uploadSequence + 1;
  coverUploadState.uploadSequence = sequence;
  coverUploadState.uploading = true;
  coverUploadState.progress = 0;
  coverUploadState.error = '';
  coverUploadState.pendingMediaPath = filePath;
  coverUploadState.pendingMediaType = type;
  form.coverType = type;
  if (type === 'image') {
    form.image = filePath;
    form.video = '';
    coverVideoFileId.value = null;
  } else {
    form.video = filePath;
    form.image = '';
    coverFileId.value = null;
  }

  const controller = uploadContentFile(filePath, {
    onProgress: (progress) => {
      if (coverUploadState.uploadSequence === sequence) {
        coverUploadState.progress = progress;
      }
    }
  });

  try {
    const uploaded = await controller.promise;
    if (coverUploadState.uploadSequence !== sequence) return;
    if (type === 'image') {
      form.image = uploaded.url;
      coverFileId.value = uploaded.id;
    } else {
      form.video = uploaded.url;
      coverVideoFileId.value = uploaded.id;
    }
    coverUploadState.pendingMediaPath = '';
    coverUploadState.pendingMediaType = '';
    uni.showToast({ title: type === 'image' ? '封面图上传完成' : '成品视频上传完成', icon: 'none' });
  } catch (error) {
    if (coverUploadState.uploadSequence === sequence) {
      coverUploadState.error = uploadErrorMessage(error);
    }
  } finally {
    if (coverUploadState.uploadSequence === sequence) {
      coverUploadState.uploading = false;
    }
  }
};

const goBack = () => {
  if (!hasUnsavedContent.value) {
    uni.navigateBack();
    return;
  }

  uni.showModal({
    title: isEditing.value ? '放弃本次修改？' : '退出添加菜谱？',
    content: isEditing.value ? '尚未保存的修改将不会保留。' : '当前填写的内容还没有保存，退出后将无法恢复。',
    cancelText: '继续编辑',
    confirmText: '退出',
    success: (result) => {
      if (result.confirm) {
        uni.navigateBack();
      }
    }
  });
};

const chooseCoverImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (result) => {
      const filePath = result.tempFilePaths[0] ?? '';
      if (filePath) void uploadCoverMedia(filePath, 'image');
    }
  });
};

const chooseCoverVideo = () => {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    success: (result) => {
      if (result.tempFilePath) void uploadCoverMedia(result.tempFilePath, 'video');
    }
  });
};

const retryCoverUpload = () => {
  if (coverUploadState.pendingMediaPath && coverUploadState.pendingMediaType) {
    void uploadCoverMedia(coverUploadState.pendingMediaPath, coverUploadState.pendingMediaType);
  }
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
  steps.value.push({
    id: createId('step'),
    title: '',
    content: '',
    image: '',
    video: '',
    imageFileId: null,
    videoFileId: null,
    pendingMediaPath: '',
    pendingMediaType: '',
    uploading: false,
    uploadProgress: 0,
    uploadError: '',
    uploadSequence: 0
  });
};

const removeStep = (index: number) => {
  if (steps.value.length <= 1) {
    uni.showToast({ title: '至少保留 1 个步骤', icon: 'none' });
    return;
  }

  steps.value.splice(index, 1);
};

const uploadStepMedia = async (index: number, filePath: string, type: 'image' | 'video') => {
  const step = steps.value[index];
  if (!step) return;
  const sequence = step.uploadSequence + 1;
  step.uploadSequence = sequence;
  step.uploading = true;
  step.uploadProgress = 0;
  step.uploadError = '';
  step.pendingMediaPath = filePath;
  step.pendingMediaType = type;
  if (type === 'image') {
    step.image = filePath;
    step.imageFileId = null;
    step.video = '';
    step.videoFileId = null;
  } else {
    step.video = filePath;
    step.videoFileId = null;
    step.image = '';
    step.imageFileId = null;
  }

  const controller = uploadContentFile(filePath, {
    onProgress: (progress) => {
      const current = steps.value[index];
      if (current?.uploadSequence === sequence) current.uploadProgress = progress;
    }
  });

  try {
    const uploaded = await controller.promise;
    const current = steps.value[index];
    if (!current || current.uploadSequence !== sequence) return;
    if (type === 'image') {
      current.image = uploaded.url;
      current.imageFileId = uploaded.id;
    } else {
      current.video = uploaded.url;
      current.videoFileId = uploaded.id;
    }
    current.pendingMediaPath = '';
    current.pendingMediaType = '';
    uni.showToast({ title: type === 'image' ? '步骤图上传完成' : '步骤视频上传完成', icon: 'none' });
  } catch (error) {
    const current = steps.value[index];
    if (current?.uploadSequence === sequence) current.uploadError = uploadErrorMessage(error);
  } finally {
    const current = steps.value[index];
    if (current?.uploadSequence === sequence) current.uploading = false;
  }
};

const setStepImage = (index: number) => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (result) => {
      const filePath = result.tempFilePaths[0] ?? '';
      if (filePath) void uploadStepMedia(index, filePath, 'image');
    }
  });
};

const setStepVideo = (index: number) => {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    success: (result) => {
      if (result.tempFilePath) void uploadStepMedia(index, result.tempFilePath, 'video');
    }
  });
};

const removeStepMedia = (index: number, type: 'image' | 'video') => {
  const step = steps.value[index];
  if (!step) return;
  step.uploadSequence += 1;
  step.uploading = false;
  step.uploadError = '';
  step.pendingMediaPath = '';
  step.pendingMediaType = '';
  step[type] = '';
  if (type === 'image') step.imageFileId = null;
  else step.videoFileId = null;
};

const retryStepMediaUpload = (index: number) => {
  const step = steps.value[index];
  if (step?.pendingMediaPath && step.pendingMediaType) {
    void uploadStepMedia(index, step.pendingMediaPath, step.pendingMediaType);
  }
};

const loadCategoryOptions = async () => {
  try {
    const home = await getHome();
    const categories = home.recipeCategories.map((item) => item.name).filter(Boolean);
    if (categories.length) {
      categoryOptions.value = categories;
      if (!form.category && !isEditing.value) {
        form.category = categories[0];
      }
    }
  } catch {
    categoryOptions.value = [];
  }
};

const changeDifficulty = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: number } };
  form.difficulty = difficultyOptions[detail.detail?.value ?? 0];
};

const changeCategory = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: number } };
  form.category = categoryOptions.value[detail.detail?.value ?? 0];
};

const changeVisibility = (event: Event) => {
  const detail = event as unknown as { detail?: { value?: number } };
  form.visibility = visibilityOptions[detail.detail?.value ?? 0];
};

const validateStage = (stage: CreateStage) => {
  if (isUploadingMedia.value) {
    uni.showToast({ title: '媒体正在上传，请稍候', icon: 'none' });
    return false;
  }

  if (hasMediaUploadError.value) {
    uni.showToast({ title: '请先重试上传失败的媒体', icon: 'none' });
    return false;
  }

  if (stage === 1 && !form.name.trim()) {
    uni.showToast({ title: '请填写菜谱名称', icon: 'none' });
    return false;
  }

  if (stage === 1 && !form.coverType) {
    uni.showToast({ title: '请至少添加一张图片或视频', icon: 'none' });
    return false;
  }

  if (stage === 2 && !ingredients.value.some((ingredient) => ingredient.name.trim())) {
    uni.showToast({ title: '请至少填写 1 项用料', icon: 'none' });
    return false;
  }

  if (stage === 3 && !steps.value.some((step) => step.content.trim())) {
    uni.showToast({ title: '请至少填写 1 个步骤', icon: 'none' });
    return false;
  }

  return true;
};

const jumpToStage = (stage: CreateStage) => {
  if (stage <= furthestStage.value) {
    currentStage.value = stage;
  }
};

const goPreviousStage = () => {
  if (currentStage.value > 1) {
    currentStage.value = (currentStage.value - 1) as CreateStage;
  }
};

const goNextStage = () => {
  if (!validateStage(currentStage.value) || currentStage.value >= 4) {
    return;
  }

  const nextStage = (currentStage.value + 1) as CreateStage;
  currentStage.value = nextStage;
  if (nextStage > furthestStage.value) {
    furthestStage.value = nextStage;
  }
};

const validateRequired = () => {
  for (const stage of [1, 2, 3] as CreateStage[]) {
    if (!validateStage(stage)) {
      currentStage.value = stage;
      return false;
    }
  }

  return true;
};

const buildPayload = (isDraft: boolean) => ({
  title: form.name.trim(),
  subtitle: form.description.trim() || null,
  cover: form.coverType === 'image' ? form.image || null : null,
  coverFileId: form.coverType === 'image' ? coverFileId.value : null,
  video: form.coverType === 'video' ? form.video || null : null,
  videoFileId: form.coverType === 'video' ? coverVideoFileId.value : null,
  description: form.description.trim() || null,
  duration: form.duration.trim() || null,
  difficulty: form.difficulty.trim() || null,
  flavor: form.flavor.trim() || null,
  category: form.category.trim() || null,
  visibility: form.visibility.trim() || null,
  notes: form.notes.trim() || null,
  isDraft,
  ingredients: ingredients.value
    .map((ingredient, index) => ({ sortIndex: index + 1, name: ingredient.name.trim(), amount: ingredient.amount.trim() || null }))
    .filter((ingredient) => ingredient.name),
  steps: steps.value
    .map((step, index) => ({
      sortIndex: index + 1,
      title: step.title.trim() || `步骤 ${index + 1}`,
      description: step.content.trim(),
      image: step.image || null,
      video: step.video || null,
      mediaFileId: step.videoFileId ?? step.imageFileId,
      mediaKind: step.videoFileId ? ('VIDEO' as const) : step.imageFileId ? ('IMAGE' as const) : null
    }))
    .filter((step) => step.description)
});

const loadExistingRecipe = async (id: string) => {
  isLoadingExisting.value = true;
  try {
    const existing = await findMyRecipeById(id);
    if (!existing) throw new Error('菜谱不存在或已删除');

    form.name = existing.name;
    form.description = existing.description;
    form.duration = existing.duration === '未填' ? '' : existing.duration;
    form.difficulty = existing.difficulty === '未填' ? '简单' : existing.difficulty;
    form.flavor = existing.flavor === '未填' ? '' : existing.flavor;
    form.category = existing.category === '私房菜' ? '' : existing.category;
    form.visibility = visibilityOptions.includes(existing.visibility) ? existing.visibility : visibilityOptions[0];
    form.notes = existing.note;
    form.image = existing.coverSource;
    form.video = existing.video;
    form.coverType = existing.video ? 'video' : existing.coverSource ? 'image' : '';
    coverFileId.value = existing.coverFileId;
    coverVideoFileId.value = existing.videoFileId;

    ingredients.value = existing.ingredients.length
      ? existing.ingredients.map((item, index) => ({
          id: `ingredient-existing-${index}`,
          name: item.name,
          amount: item.amount
        }))
      : [{ id: 'ingredient-existing-0', name: '', amount: '' }];

    steps.value = existing.steps.length
      ? existing.steps.map((item, index) => ({
          id: `step-existing-${index}`,
          title: item.title,
          content: item.description,
          image: item.image,
          video: item.video,
          imageFileId: item.mediaKind === 'IMAGE' ? item.mediaFileId : null,
          videoFileId: item.mediaKind === 'VIDEO' ? item.mediaFileId : null,
          pendingMediaPath: '',
          pendingMediaType: '',
          uploading: false,
          uploadProgress: 0,
          uploadError: '',
          uploadSequence: 0
        }))
      : [{
          id: 'step-existing-0',
          title: '',
          content: '',
          image: '',
          video: '',
          imageFileId: null,
          videoFileId: null,
          pendingMediaPath: '',
          pendingMediaType: '',
          uploading: false,
          uploadProgress: 0,
          uploadError: '',
          uploadSequence: 0
        }];

    furthestStage.value = 4;
    initialEditSignature.value = editableSignature();
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '菜谱加载失败', icon: 'none' });
    setTimeout(() => uni.navigateBack(), 500);
  } finally {
    isLoadingExisting.value = false;
  }
};

const saveRecipe = async () => {
  if (isSaving.value || !validateRequired()) {
    return;
  }

  isSaving.value = true;
  try {
    const payload = buildPayload(false);
    if (isEditing.value) {
      await updateMyRecipe(editingRecipeId.value, payload);
      initialEditSignature.value = editableSignature();
    } else {
      await saveMyRecipe(payload);
    }
    uni.showToast({ title: isEditing.value ? '修改已保存' : '食谱已保存', icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 500);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' });
  } finally {
    isSaving.value = false;
  }
};

onLoad((query?: Record<string, string | undefined>) => {
  const id = query?.id?.trim() ?? '';
  if (!id) return;
  editingRecipeId.value = id;
  void loadExistingRecipe(id);
});

onMounted(() => {
  void loadCategoryOptions();
});
</script>

<style scoped lang="scss">
.row-delete,
.add-row-button,
.cover-action,
.step-image-button,
.step-video-button,
.step-delete-button {
  border: 0;
}

.edit-loading {
  display: grid;
  gap: 18rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-caption);
}

.edit-loading__media,
.edit-loading__line {
  border-radius: var(--app-radius-card);
  background: var(--app-muted);
}

.edit-loading__media {
  height: 268rpx;
}

.edit-loading__line {
  width: 68%;
  height: 24rpx;
}

.edit-loading__line--title {
  width: 42%;
  height: 34rpx;
}

.row-delete::after,
.add-row-button::after,
.cover-action::after,
.step-image-button::after,
.step-video-button::after,
.step-delete-button::after {
  border: 0;
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
  border: 1rpx solid var(--app-border);
  background: var(--app-surface);
}

.title-input,
.intro-input,
.quick-input,
.ingredient-name,
.ingredient-amount,
.step-title-input,
.step-input,
.note-box textarea {
  box-sizing: border-box;
  width: 100%;
  border: 0;
  color: var(--app-text);
  font-weight: var(--font-medium);
}

.field-block {
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--app-border);
  border-radius: 0;
  background: transparent;
}

.field-block + .field-block {
  margin-top: 14rpx;
}

.field-block--title {
  border: 0;
  border-bottom: 1rpx solid var(--app-border);
  background: transparent;
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
  border: 1rpx solid var(--app-border);
  border-radius: 20rpx;
  background: rgba(122, 139, 111, 0.06);
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
  border-bottom: 1rpx solid var(--app-border);
  border-radius: 0;
  background: transparent;
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
  border: 1rpx solid var(--app-border);
  background: rgba(122, 139, 111, 0.06);
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.step-card {
  display: flex;
  gap: 16rpx;
  padding: 18rpx 16rpx;
  border: 1rpx solid var(--app-border);
  border-radius: 24rpx;
  background: rgba(122, 139, 111, 0.045);
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
  border: 1rpx solid var(--app-border);
  background: rgba(122, 139, 111, 0.045);
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

/* 冻结原型迁移：四阶段添加流程 */
.recipe-create-page {
  padding-top: 0;
  padding-bottom: calc(176rpx + var(--app-safe-area-bottom));
}

.recipe-create-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: grid;
  grid-template-columns: var(--touch-target) 1fr var(--touch-target);
  align-items: center;
  min-height: var(--touch-target);
  margin: 0 calc(var(--space-6) * -1);
  padding: calc(var(--app-safe-area-top) + var(--space-3)) var(--space-6) var(--space-3);
  border-bottom: 1rpx solid var(--app-border);
  background: rgba(245, 241, 234, 0.96);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
}

.recipe-create-header__back {
  border-radius: 50%;
  background: var(--app-surface-strong);
  color: var(--app-text);
}

.recipe-create-header .page-title {
  margin: 0;
  font-size: var(--font-size-section-title);
  line-height: var(--line-section-title);
  text-align: center;
}

.recipe-create-header__spacer {
  width: var(--touch-target);
  height: var(--touch-target);
}

.create-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin: var(--space-5) 0 var(--space-2);
}

.create-progress__item {
  display: inline-flex;
  width: var(--touch-target);
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  margin: 0;
  padding: 0;
  align-items: center;
  justify-content: center;
  appearance: none;
  -webkit-appearance: none;
  border: 0;
  border-radius: 0;
  background: transparent !important;
  color: inherit;
  box-shadow: none;
}

.create-progress__item::after {
  border: 0;
}

.create-progress__item[disabled] {
  opacity: 1;
  background: transparent !important;
}

.create-progress__dot {
  display: block;
  width: 44rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--app-border);
  transform: scaleX(0.318);
  transition: transform 180ms ease, background-color 180ms ease;
}

.create-progress__item.is-active .create-progress__dot {
  border-radius: var(--app-radius-button);
  transform: scaleX(1);
}

.create-progress__item.is-active .create-progress__dot,
.create-progress__item.is-complete .create-progress__dot {
  background: var(--app-primary);
}

.create-progress-label {
  display: block;
  margin-bottom: var(--space-6);
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
  text-align: center;
}

.create-stage {
  display: block;
}

.create-stage .form-section {
  min-height: 0;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.create-stage .section-head {
  align-items: flex-start;
  margin-bottom: var(--space-6);
}

.media-count {
  flex: 0 0 auto;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
}

.create-stage .section-title {
  font-size: var(--font-size-section-title);
  line-height: var(--line-section-title);
}

.create-stage .section-desc {
  max-width: 620rpx;
  margin-top: var(--space-2);
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.field-label,
.media-spec {
  display: block;
}

.field-label-row,
.media-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.field-label {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
}

.field-count {
  flex: 0 0 auto;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.create-stage .field-block {
  padding: var(--space-5) 0;
}

.create-stage .title-input {
  height: 76rpx;
  margin-top: var(--space-2);
  font-size: var(--font-size-card-title);
  line-height: var(--line-card-title);
}

.create-stage .intro-input {
  height: 116rpx;
  margin-top: var(--space-2);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.create-stage .quick-grid {
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.create-stage .quick-field {
  min-height: 106rpx;
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: rgba(122, 139, 111, 0.07);
}

.media-heading {
  margin-top: var(--space-7);
}

.media-spec {
  max-width: 580rpx;
  margin-top: var(--space-1);
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-regular);
  line-height: var(--line-caption);
}

.create-stage .cover-card {
  height: 342rpx;
  margin-top: var(--space-4);
  border: 1rpx dashed var(--app-border);
  border-radius: var(--radius-md);
  box-shadow: none;
}

.create-stage .cover-placeholder {
  gap: var(--space-2);
  background: rgba(255, 253, 252, 0.54);
  color: var(--app-primary);
}

.create-stage .cover-title,
.create-stage .cover-desc {
  margin: 0;
}

.create-stage .cover-desc {
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.create-stage .cover-actions {
  right: var(--space-3);
  bottom: var(--space-3);
  gap: var(--space-2);
  padding: var(--space-1);
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 253, 252, 0.88);
}

.create-stage .cover-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 104rpx;
  min-height: 64rpx;
  gap: var(--space-1);
  padding: 0 var(--space-3);
}

.media-upload-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--touch-min);
  gap: var(--space-3);
  margin-top: var(--space-2);
  color: var(--app-primary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.media-upload-status--step {
  margin: var(--space-2) var(--space-4) 0;
}

.media-upload-status__error {
  color: var(--app-warning);
}

.media-upload-status__retry {
  min-width: 112rpx;
  min-height: var(--touch-min);
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-pill);
  background: rgba(122, 139, 111, 0.1);
  color: var(--app-primary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
}

.media-upload-status__retry::after {
  border: 0;
}

.create-stage .ingredient-list,
.create-stage .step-list {
  gap: 0;
}

.ingredient-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-7);
  padding-bottom: var(--space-2);
}

.ingredient-section-title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
}

.ingredient-section-count {
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.create-stage .ingredient-row {
  grid-template-columns: minmax(0, 1fr) 142rpx var(--touch-target);
  min-height: var(--touch-target);
  gap: var(--space-3);
  padding: 0;
}

.create-stage .ingredient-name,
.create-stage .ingredient-amount {
  height: var(--touch-target);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.create-stage .row-delete {
  width: var(--touch-target);
  height: var(--touch-target);
  background: transparent;
  color: var(--text-tertiary);
}

.create-stage .add-row-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target);
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  color: var(--app-primary);
}

.settings-group {
  margin-top: var(--space-7);
  border-top: 1rpx solid var(--app-border);
}

.create-stage .setting-row {
  min-height: var(--touch-target);
}

.create-stage .setting-value {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  gap: var(--space-2);
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.create-stage .note-box {
  margin-top: var(--space-5);
  padding: var(--space-5);
  border: 0;
  border-radius: var(--radius-md);
  background: rgba(122, 139, 111, 0.06);
}

.create-stage .step-card {
  display: block;
  padding: var(--space-5) 0;
  border: 0;
  border-bottom: 1rpx solid var(--app-border);
  border-radius: 0;
  background: transparent;
}

.step-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.create-stage .step-index {
  width: auto;
  height: auto;
  border-radius: 0;
  background: transparent;
  color: var(--app-primary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.create-stage .step-delete-button {
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  padding: 0 var(--space-3);
  background: transparent;
  color: var(--app-danger);
}

.create-stage .step-title-input {
  height: 64rpx;
  margin-top: var(--space-2);
  background: transparent;
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
}

.create-stage .step-input {
  height: 136rpx;
  margin-top: var(--space-3);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.step-media-shell {
  position: relative;
  margin-top: var(--space-3);
}

.step-media-preview,
.step-video-preview {
  width: 100%;
  height: 280rpx;
  border-radius: var(--radius-md);
  background: var(--app-accent-soft);
}

.step-video-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--app-primary);
  font-size: var(--font-size-caption);
}

.step-media-remove {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: var(--touch-target);
  height: var(--touch-target);
  border: 1rpx solid rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  background: rgba(255, 253, 252, 0.88);
  color: var(--app-text);
}

.create-stage .step-tools {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.create-stage .step-image-button,
.create-stage .step-video-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target);
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border: 1rpx solid var(--app-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--app-primary);
}

.create-preview {
  padding-bottom: var(--space-7);
}

.preview-hero {
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--app-surface-strong);
}

.preview-hero__image,
.preview-hero__placeholder {
  width: 100%;
  height: 360rpx;
}

.preview-hero__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-accent-soft);
  color: var(--app-primary);
}

.preview-hero__copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
}

.preview-title {
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
}

.preview-description,
.preview-meta {
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.preview-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: var(--space-5);
  padding: var(--space-4) 0;
  border-top: 1rpx solid var(--app-border);
  border-bottom: 1rpx solid var(--app-border);
}

.preview-summary > view {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: 0 var(--space-2);
  text-align: center;
}

.preview-summary > view + view {
  border-left: 1rpx solid var(--app-border);
}

.preview-summary text:first-child {
  max-width: 100%;
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-summary text:last-child {
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.preview-content-section {
  margin-top: var(--space-7);
}

.preview-content-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-2);
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
}

.preview-content-heading text:last-child {
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-regular);
  line-height: var(--line-caption);
}

.preview-ingredient-list {
  border-top: 1rpx solid var(--app-border);
}

.preview-ingredient-row {
  display: flex;
  min-height: var(--touch-target);
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  border-bottom: 1rpx solid var(--app-border);
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.preview-ingredient-row text:last-child {
  color: var(--text-tertiary);
}

.preview-step-list {
  border-top: 1rpx solid var(--app-border);
}

.preview-step {
  display: grid;
  grid-template-columns: 132rpx minmax(0, 1fr);
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-bottom: 1rpx solid var(--app-border);
}

.preview-step--text-only {
  grid-template-columns: minmax(0, 1fr);
}

.preview-step__media {
  width: 132rpx;
  height: 132rpx;
  border-radius: var(--radius-sm);
  background: var(--app-accent-soft);
}

.preview-step__video {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-primary);
}

.preview-step__copy {
  display: grid;
  min-width: 0;
  align-content: start;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-1) var(--space-2);
}

.preview-step__index {
  color: var(--app-primary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  line-height: var(--line-tag);
}

.preview-step__title {
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-step__description {
  display: -webkit-box;
  overflow: hidden;
  grid-column: 1 / -1;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.preview-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target);
  gap: var(--space-2);
  margin: var(--space-5) auto 0;
  padding: 0 var(--space-5);
  background: transparent;
  color: var(--app-primary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
}

.create-bottom-actions {
  position: fixed;
  right: 50%;
  bottom: 0;
  left: auto;
  z-index: var(--z-tabbar);
  display: grid;
  width: 100%;
  max-width: var(--app-canvas-width);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6) calc(var(--space-3) + var(--app-safe-area-bottom));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  transform: translateX(50%);
}

.create-bottom-actions__primary,
.create-bottom-actions__secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: var(--touch-target);
  padding: 0 var(--space-4);
  border-radius: var(--app-radius-button);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}

.create-bottom-actions__primary {
  background: var(--app-primary);
  color: var(--text-white);
}

.create-bottom-actions__primary--full {
  grid-column: 1 / -1;
}

.create-bottom-actions__secondary {
  border: 1rpx solid var(--app-border);
  background: var(--app-surface-strong);
  color: var(--app-text);
}

@media (prefers-reduced-motion: reduce) {
  .create-progress__dot {
    transition: none;
  }
}
</style>
