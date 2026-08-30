<template>
  <view class="detail-page">
    <content-detail-hero
      :src="ingredient?.cover || ''"
      :alt="`${ingredient?.name || '水果'}主图`"
      :favorite="isFavorite"
      @back="goBack"
      @favorite="toggleFavorite"
      @share="shareContent"
    />

    <content-detail-state v-if="loading" state="loading" />
    <content-detail-state
      v-else-if="error"
      state="error"
      title="水果内容不可用"
      :description="error"
      @action="loadIngredient"
    />
    <content-detail-state
      v-else-if="!ingredient"
      state="empty"
      title="没有找到这份水果资料"
      description="内容可能已下架或编号无效。"
      @action="goBack"
    />

    <template v-else>
      <main class="detail-content">
        <section class="identity-section">
          <text class="detail-title">{{ ingredient.name }}</text>
          <text class="detail-subtitle">{{ ingredient.category?.name || '水果' }}</text>
          <view class="fact-row">
            <view class="fact-item">
              <text class="fact-value">{{ ingredient.seasonMonth || '待补充' }}</text>
              <text class="fact-label">当季时间</text>
            </view>
            <view class="fact-item">
              <text class="fact-value">{{ priceText }}</text>
              <text class="fact-label">约多少钱一斤</text>
            </view>
          </view>
        </section>

        <section class="guide-section">
          <view class="guide-tabs" role="tablist" aria-label="水果使用指南">
            <button
              v-for="tab in guideTabs"
              :key="tab.id"
              :class="['guide-tab', { 'is-active': activeGuide === tab.id }]"
              role="tab"
              :aria-selected="activeGuide === tab.id"
              @tap="activeGuide = tab.id"
            >
              {{ tab.label }}
            </button>
          </view>
          <view class="guide-copy" role="tabpanel">
            <text class="guide-title">{{ activeGuideCopy.title }}</text>
            <text v-if="activeGuideCopy.body" class="guide-description">{{ activeGuideCopy.body }}</text>
            <text v-else class="guide-description guide-description--empty">暂无这部分说明</text>
          </view>
        </section>

        <section class="related-section">
          <text class="section-title">适合做</text>
          <scroll-view v-if="relatedRecipes.length" class="related-scroll" scroll-x enhanced>
            <view class="related-row">
              <button
                v-for="recipe in relatedRecipes"
                :key="recipe.id"
                class="related-card"
                @tap="goToRecipe(recipe.id)"
              >
                <image
                  v-if="recipe.cover && !failedRelated.has(recipe.id)"
                  class="related-image"
                  :src="recipe.cover"
                  :alt="recipe.title"
                  mode="aspectFill"
                  lazy-load
                  @error="markRelatedFailed(recipe.id)"
                />
                <view v-else class="related-image related-image--fallback">图片暂不可用</view>
                <text class="related-title">{{ recipe.title }}</text>
              </button>
            </view>
          </scroll-view>
          <view v-else class="related-empty">暂无相关菜谱</view>
        </section>
      </main>

      <content-detail-bottom-bar
        :primary-label="isInBasket ? '已加入菜篮' : '加入菜篮'"
        :primary-icon="isInBasket ? 'check' : 'basket-action'"
        :primary-disabled="basketChanging"
        :primary-pressed="isInBasket"
        @primary="toggleBasket"
      />
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import ContentDetailBottomBar from '../../components/content-detail-bottom-bar.vue';
import ContentDetailHero from '../../components/content-detail-hero.vue';
import ContentDetailState from '../../components/content-detail-state.vue';
import { getDetailPreviewFixture } from '../../dev/detail-preview-fixtures';
import { useContentActions } from '../../composables/use-content-actions';
import { getIngredient, resolveAssetUrl, type ApiIngredientDetail } from '../../services/public-api';
import { getContentDetailErrorMessage } from '../../utils/content-detail-error';
import { navigateBackFromContentDetail, resolveDetailEntryOrigin } from '../../utils/content-detail-navigation';

type GuideId = 'select' | 'store' | 'eat';
type RelatedRecipe = { id: string; title: string; cover: string };

const ingredient = ref<ApiIngredientDetail | null>(null);
const ingredientId = ref('');
const detailEntryOrigin = ref('');
const previewRouteOptions = ref<Record<string, string | undefined>>({});
const loading = ref(true);
const error = ref('');
const failedRelated = ref(new Set<string>());
const activeGuide = ref<GuideId>('select');
const actionTargetId = computed(() => ingredient.value?.id ?? ingredientId.value);
const actionName = computed(() => ingredient.value?.name ?? '');
const actionIngredientId = computed(() => ingredient.value?.id);
const {
  isFavorite,
  isInBasket,
  basketChanging,
  sync: syncActions,
  toggleFavorite,
  toggleBasket
} = useContentActions({
  targetType: 'FRUIT',
  targetId: actionTargetId,
  name: actionName,
  ingredientId: actionIngredientId
});

const guideTabs: Array<{ id: GuideId; label: string }> = [
  { id: 'select', label: '怎么挑' },
  { id: 'store', label: '怎么放' },
  { id: 'eat', label: '怎么吃' }
];

const activeGuideCopy = computed(() => {
  const data = ingredient.value;
  if (activeGuide.value === 'store') return { title: '保存方法', body: data?.storageMethod || '' };
  if (activeGuide.value === 'eat') return { title: '食用建议', body: data?.nutrition || data?.taboo || '' };
  return { title: '挑选方法', body: data?.selectionTips || '' };
});

const priceText = computed(() => {
  if (!ingredient.value?.currentPrice) return '待补充';
  return `约 ¥${ingredient.value.currentPrice}/${ingredient.value.priceUnit || '斤'}`;
});

const relatedRecipes = computed<RelatedRecipe[]>(() => {
  const source = ingredient.value?.relatedRecipes;
  if (!Array.isArray(source)) return [];
  return source.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const value = item as Record<string, unknown>;
    const id = String(value.id ?? value.recipeId ?? '');
    const title = String(value.title ?? value.name ?? '');
    if (!id || !title) return [];
    return [{ id, title, cover: resolveAssetUrl(typeof value.cover === 'string' ? value.cover : null) }];
  });
});

const readId = (options?: Record<string, string | undefined>) => {
  const direct = options?.id?.trim();
  if (direct) return direct;
  if (typeof window === 'undefined') return '';
  const query = window.location.hash.split('?')[1] || '';
  return new URLSearchParams(query).get('id')?.trim() || '';
};

const loadIngredient = async () => {
  const id = ingredientId.value || readId();
  if (!id) {
    error.value = '缺少有效的水果编号';
    ingredient.value = null;
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    ingredientId.value = id;
    ingredient.value = getDetailPreviewFixture('fruit', id, previewRouteOptions.value) ?? await getIngredient(id);
    void syncActions().catch(() => undefined);
  } catch (reason) {
    error.value = getContentDetailErrorMessage(reason);
    ingredient.value = null;
  } finally {
    loading.value = false;
  }
};

const markRelatedFailed = (id: string) => {
  failedRelated.value = new Set([...failedRelated.value, id]);
};
const goBack = () =>
  navigateBackFromContentDetail(
    detailEntryOrigin.value || resolveDetailEntryOrigin(),
    '/pages/ingredients/index?type=fruit'
  );
const shareContent = () => uni.showToast({ title: '已准备分享内容', icon: 'none' });
const goToRecipe = (id: string) =>
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${encodeURIComponent(id)}` });

onLoad((options) => {
  previewRouteOptions.value = options ?? {};
  detailEntryOrigin.value = resolveDetailEntryOrigin(options?.from);
  ingredientId.value = readId(options);
  void loadIngredient();
});
onMounted(() => {
  if (!ingredient.value && !error.value) void loadIngredient();
});
</script>

<style scoped lang="scss">
.detail-page {
  min-height: 100dvh;
  padding-bottom: calc(156rpx + var(--app-safe-area-bottom));
  background: var(--app-bg);
  color: var(--app-text);
}

.detail-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 852 / 844;
  overflow: hidden;
  background: var(--app-surface-soft);
}

.detail-cover {
  width: 100%;
  height: 100%;
}

.detail-cover--fallback,
.related-image--fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-caption);
}

.hero-back {
  position: absolute;
  top: calc(var(--app-safe-area-top) + 20rpx);
  left: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.62);
  border-radius: 50%;
  background: rgba(255, 253, 252, 0.82);
  color: var(--app-text);
}

.hero-back::after,
.state-action::after,
.guide-tab::after,
.related-card::after {
  border: 0;
}

.state-panel,
.identity-section,
.guide-section,
.related-section {
  margin: 28rpx 32rpx 0;
}

.state-panel {
  padding: 36rpx;
  border-radius: var(--app-radius-card);
  background: var(--app-surface-strong);
}

.state-title,
.state-description,
.detail-title,
.detail-subtitle,
.fact-value,
.fact-label,
.guide-title,
.guide-description,
.section-title,
.related-title {
  display: block;
}

.state-title,
.section-title {
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.state-description,
.detail-subtitle,
.guide-description {
  margin-top: 10rpx;
  color: var(--app-text-secondary);
  font-size: var(--font-size-body);
  line-height: var(--line-body);
}

.state-action {
  min-height: 88rpx;
  margin-top: 24rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  background: var(--app-primary);
  color: var(--text-white);
  font-size: var(--font-size-body);
}

.state-action--quiet {
  background: var(--app-surface-soft);
  color: var(--app-primary);
}

.state-skeleton {
  height: 26rpx;
  margin-top: 20rpx;
  border-radius: 12rpx;
  background: var(--app-surface-soft);
}

.state-skeleton--title {
  width: 52%;
  height: 42rpx;
  margin-top: 0;
}

.state-skeleton--short {
  width: 68%;
}

.identity-section {
  margin-top: 0;
  padding: 36rpx 0 8rpx;
}

.detail-title {
  font-size: var(--font-size-hero-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-hero-title);
}

.fact-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 28rpx;
  padding: 24rpx 0;
  border-top: 1rpx solid var(--app-border);
  border-bottom: 1rpx solid var(--app-border);
}

.fact-item {
  min-width: 0;
  padding: 0 20rpx;
  text-align: center;
}

.fact-item + .fact-item {
  border-left: 1rpx solid var(--app-border);
}

.fact-value {
  color: var(--app-primary);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.fact-label {
  margin-top: 6rpx;
  color: var(--app-text-tertiary);
  font-size: var(--font-size-tag);
}

.guide-section {
  overflow: hidden;
  border-radius: var(--app-radius-card);
  background: var(--app-surface-strong);
}

.guide-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1rpx solid var(--app-border);
}

.guide-tab {
  min-height: 88rpx;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-body);
}

.guide-tab.is-active {
  color: var(--app-primary);
  font-weight: var(--font-semibold);
}

.guide-copy {
  min-height: 180rpx;
  padding: 30rpx;
}

.guide-title {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
}

.guide-description--empty,
.related-empty {
  color: var(--app-text-tertiary);
}

.section-title {
  margin-bottom: 18rpx;
}

.related-scroll {
  width: 100%;
  white-space: nowrap;
}

.related-row {
  display: inline-flex;
  gap: 18rpx;
  padding-right: 32rpx;
}

.related-card {
  width: 244rpx;
  padding: 0 0 18rpx;
  overflow: hidden;
  border: 0;
  border-radius: var(--app-radius-card-sm);
  background: var(--app-surface-strong);
  text-align: left;
}

.related-image {
  width: 244rpx;
  height: 244rpx;
  border-radius: 0;
  background: var(--app-surface-soft);
}

.related-title {
  padding: 16rpx 18rpx 0;
  overflow: hidden;
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-empty {
  padding: 30rpx 0;
  font-size: var(--font-size-body);
}

.detail-page {
  padding-bottom: calc(144rpx + var(--app-safe-area-bottom));
  overflow-x: hidden;
}

.detail-content {
  padding: 0 40rpx;
}

.identity-section,
.guide-section,
.related-section {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.identity-section {
  padding: 32rpx 0 26rpx;
  border-bottom: 1rpx solid var(--app-border);
}

.detail-title {
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-detail-title);
}

.detail-subtitle {
  margin-top: 4rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.fact-row {
  margin-top: 22rpx;
  border-top: 1rpx solid var(--app-border);
  border-bottom: 0;
}

.fact-item {
  padding: 20rpx 12rpx 0;
}

.fact-value {
  color: var(--app-primary);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
  line-height: var(--line-body);
}

.fact-label {
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.guide-tabs {
  min-height: var(--touch-target);
  border-bottom: 1rpx solid var(--app-border);
}

.guide-tab {
  min-height: var(--touch-target);
  border: 0;
  border-radius: 0;
  color: var(--text-secondary);
  background: transparent;
  font-size: var(--font-size-body);
  font-weight: var(--font-medium);
  line-height: var(--line-body);
}

.guide-tab::after {
  border: 0;
}

.guide-tab.is-active {
  color: var(--app-primary);
  background: transparent;
  box-shadow: inset 0 -4rpx var(--app-primary);
}

.guide-copy {
  min-height: 166rpx;
  padding: 26rpx 2rpx 30rpx;
  border-bottom: 1rpx solid var(--app-border);
}

.guide-title {
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.guide-description {
  margin-top: 8rpx;
  color: var(--text-secondary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-regular);
  line-height: var(--line-body);
}

.related-section {
  padding-top: 40rpx;
}

.related-scroll {
  margin-top: 22rpx;
  margin-inline: -40rpx;
  padding-inline: 40rpx;
}

.related-row {
  gap: 20rpx;
}

.related-card {
  width: 286rpx;
  padding: 0 0 16rpx;
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--app-surface-strong);
}

.related-card::after {
  border: 0;
}

.related-image {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  border-radius: 0;
}

.related-title {
  padding: 14rpx 16rpx 0;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}

.detail-bottom-action {
  position: fixed;
  z-index: var(--z-tabbar);
  right: 0;
  bottom: 0;
  left: 0;
  width: min(100%, 393px);
  margin: 0 auto;
  padding: 16rpx 24rpx calc(16rpx + var(--app-safe-area-bottom));
  background: rgba(245, 241, 234, 0.88);
  backdrop-filter: blur(18px) saturate(112%);
  -webkit-backdrop-filter: blur(18px) saturate(112%);
}

.basket-button {
  display: flex;
  width: 100%;
  min-height: 96rpx;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border: 0;
  border-radius: var(--app-radius-button);
  color: var(--text-white);
  background: var(--app-primary);
  font-size: var(--font-size-body);
  font-weight: var(--font-semibold);
}

.basket-button::after {
  border: 0;
}

@media (max-width: 375px) {
  .detail-content {
    padding-inline: 32rpx;
  }

  .related-scroll {
    margin-inline: -32rpx;
    padding-inline: 32rpx;
  }
}
</style>
<style scoped lang="scss" src="../../styles/content-detail-canonical.scss"></style>
