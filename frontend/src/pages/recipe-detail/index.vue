<template>
  <view class="page-container">
    <!-- Top Hero Image -->
    <view class="hero-section">
      <image class="hero-image" :src="recipe.image" mode="aspectFill" />
      <view class="hero-gradient-overlay" />
      
      <!-- Header Actions -->
      <view class="floating-header">
        <view class="nav-btn back-btn" @click="goBack">
          <app-icon class="icon-svg" name="arrow-left" size="30rpx" />
        </view>
        <view class="header-right-btns">
          <view class="nav-btn favorite-btn" :class="{ 'is-active': isCollected }" @click="toggleCollectRecipe">
            <app-icon class="icon-svg" :name="isCollected ? 'heart-filled' : 'heart'" size="30rpx" />
          </view>
          <view class="nav-btn share-btn" @click="shareRecipe">
            <app-icon class="icon-svg" name="share" size="30rpx" />
          </view>
        </view>
      </view>
    </view>

    <!-- Error/Loading states -->
    <view v-if="remoteLoading" class="remote-banner">
      <text class="remote-banner__text">正在加载菜谱详情...</text>
    </view>
    <view v-else-if="remoteError" class="remote-banner">
      <text class="remote-banner__error">加载失败：{{ remoteError }}</text>
      <view class="remote-banner__retry" @tap="handleRetryRemote">重试</view>
    </view>

    <template v-else>
      <!-- Content Card (overlaps Hero image) -->
      <view class="recipe-info-card">
        <view class="recipe-title-section">
          <text class="recipe-name">{{ recipe.name }}</text>
          <view class="recipe-tag-chips">
            <text 
              v-for="tag in recipeTags" 
              :key="tag" 
              class="tag-chip"
              :class="{ 'is-warm': tag === '滋补' || tag.includes('补') }"
            >
              {{ tag }}
            </text>
          </view>
        </view>
        
        <text class="recipe-description">{{ recipe.subtitle }}</text>
        
        <view class="divider" />
        
        <!-- Meta Information Row -->
        <view class="recipe-meta-row">
          <view class="meta-col">
            <app-icon class="meta-icon" name="clock" size="32rpx" />
            <view class="meta-info-text">
              <text class="meta-col-value">{{ recipe.duration }}</text>
              <text class="meta-col-label">烹饪时间</text>
            </view>
          </view>
          
          <view class="meta-divider" />
          
          <view class="meta-col">
            <app-icon class="meta-icon" name="users" size="32rpx" />
            <view class="meta-info-text">
              <text class="meta-col-value">{{ recipe.servings }}</text>
              <text class="meta-col-label">适合人数</text>
            </view>
          </view>
          
          <view class="meta-divider" />
          
          <view class="meta-col">
            <app-icon class="meta-icon" name="difficulty" size="32rpx" />
            <view class="meta-info-text">
              <text class="meta-col-value">{{ recipe.difficulty }}</text>
              <text class="meta-col-label">难易程度</text>
            </view>
          </view>
        </view>
      </view>

      <view :class="['recipe-detail-switch', `is-${activeTab}`]">
        <!-- Tab Toggle capsule -->
        <view :class="['tab-toggle-container', `is-${activeTab}`]">
          <view class="tab-active-plate" />
          <view class="tab-item" :class="{ 'is-active': activeTab === 'ingredients' }" @click="activeTab = 'ingredients'">
            <text class="tab-text">食材清单</text>
            <view class="active-indicator" />
          </view>
          <view class="tab-item" :class="{ 'is-active': activeTab === 'steps' }" @click="activeTab = 'steps'">
            <text class="tab-text">制作步骤</text>
            <view class="active-indicator" />
          </view>
        </view>

        <!-- Main Panel Container -->
        <view class="panel-container">
          <!-- Ingredients Panel -->
          <view v-show="activeTab === 'ingredients'" class="ingredients-panel">
            <view class="usage-row">
              <text class="usage-label">用量：</text>
              <view class="stepper-capsule">
                <view class="stepper-btn" :class="{ 'is-disabled': currentServings <= 1 }" @click="decreaseServings">
                  <app-icon class="stepper-icon" name="minus" size="24rpx" />
                </view>
                <text class="stepper-value">{{ servingsDisplayText }}</text>
                <view class="stepper-btn" @click="increaseServings">
                  <app-icon class="stepper-icon" name="plus" size="24rpx" />
                </view>
              </view>
            </view>

            <view class="ingredients-grid">
              <view 
                v-for="item in visibleIngredients" 
                :key="item.name" 
                class="ingredient-card"
                @click="showIngredientGuide(item.name)"
              >
                <view class="card-basket-btn" :class="{ 'is-added': isIngredientInBasket(item) }" @click.stop="toggleIngredientInBasket(item)">
                  <app-icon class="basket-icon-svg" name="basket" size="24rpx" />
                </view>
                <image class="ingredient-img" :src="item.cover" mode="aspectFill" />
                <text class="ingredient-name-label">{{ item.name }}</text>
                <text class="ingredient-amount-label">{{ scaleAmountText(item.amount, servingsScale) }}</text>
              </view>
            </view>

            <!-- Expand / Collapse -->
            <view v-if="recipe.ingredients.length > 8" class="toggle-fold-btn" @click="isIngredientsExpanded = !isIngredientsExpanded">
              <text>{{ isIngredientsExpanded ? '收起全部' : '展开全部' }}</text>
              <app-icon class="fold-arrow" :class="{ 'is-flipped': isIngredientsExpanded }" name="chevron-down" size="22rpx" />
            </view>
          </view>

          <!-- Cooking Steps Panel -->
          <view v-show="activeTab === 'steps'" class="steps-panel steps-section-anchor">
            <view class="panel-header">
              <text class="panel-title">制作步骤</text>
            </view>
            
            <view v-if="recipe.steps.length === 0" class="empty-steps-block">
              <text class="empty-steps-text">暂无制作步骤</text>
            </view>
            <view v-else class="steps-timeline-list">
              <view v-for="(step, index) in recipe.steps" :key="index" class="timeline-step-item">
                <!-- Left timeline axis -->
                <view class="timeline-axis">
                  <view class="step-num-circle">{{ index + 1 }}</view>
                  <view v-if="index < recipe.steps.length - 1" class="timeline-line-dashed" />
                </view>
                
                <!-- Right step details with left image and right text layout -->
                <view class="step-detail-card">
                  <view class="step-content-layout">
                    <!-- Step Image on the left of content -->
                    <image v-if="step.image" class="step-img-left" :src="step.image" mode="aspectFill" />
                    
                    <!-- Step Text & Tag on the right of content -->
                    <view class="step-text-right" :class="{ 'no-image': !step.image }">
                      <text class="step-desc-text">{{ step.text }}</text>
                      <view v-if="step.duration" class="step-duration-capsule">
                        <app-icon class="duration-icon" name="clock" size="22rpx" />
                        <text class="duration-text">{{ step.duration }}</text>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Related Recipes section -->
      <view class="related-section">
        <view class="related-header">
          <text class="section-title">相关菜谱</text>
          <view class="more-link-btn" @click="goToRecipesCategory">
            <text class="more-text">查看更多</text>
            <app-icon class="more-arrow" name="chevron-right" size="22rpx" />
          </view>
        </view>
        
        <view v-if="relatedRecipesList.length === 0" class="empty-related-block">
          <text class="empty-related-text">暂无相关菜谱推荐</text>
        </view>
        <view v-else class="related-list">
          <view v-for="item in relatedRecipesList" :key="item.id" class="related-item-row" @click="goToRecipe(item.id)">
            <image class="related-thumb" :src="item.cover" mode="aspectFill" />
            <view class="related-info-col">
              <text class="related-title-text">{{ item.title }}</text>
              <text class="related-desc-text">{{ item.subtitle || item.description }}</text>
              <view class="related-meta-row">
                <text class="related-meta-label">{{ item.cookTime ? `${item.cookTime}分钟` : '—' }}</text>
                <text class="related-meta-dot">·</text>
                <text class="related-meta-label">{{ item.servings ? `${item.servings}人` : '—' }}</text>
                <view v-if="item.difficulty" class="related-diff-badge">{{ item.difficulty }}</view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Tips Card section -->
      <view v-if="recipe.tips && recipe.tips.length > 0" class="tips-section-wrapper">
        <view class="tips-outer-card" :class="'layout-' + activeTab">
          <view class="tips-inner-content">
            <text class="tips-title-text">小贴士</text>
            <view class="tips-bullet-list">
              <view v-for="(tip, idx) in recipe.tips" :key="idx" class="tip-bullet-row">
                <view class="tip-bullet-dot" />
                <text class="tip-bullet-text">{{ tip }}</text>
              </view>
            </view>
          </view>
          
          <!-- Elegant Pot line-art SVG graphic -->
          <view class="cooking-pot-graphic">
            <app-icon class="pot-svg" name="cooking-pot" size="112rpx" />
          </view>
        </view>
      </view>

      <!-- Beverages matching section (if exists) -->
      <view v-if="recipe.beverages && recipe.beverages.length > 0" class="beverages-card-section">
        <view class="section-header-box">
          <text class="section-title">推荐搭配饮品</text>
        </view>
        <view class="beverage-cards-list">
          <view
            v-for="item in recipe.beverages"
            :key="item.id"
            class="beverage-item-card"
            :class="{ 'is-interactive': hasMixMethod(item) }"
            @click="showBeverageMixMethod(item)"
          >
            <image v-if="item.coverImage" class="beverage-thumb-img" :src="item.coverImage" mode="aspectFill" />
            <view class="beverage-info-details">
              <text class="beverage-title-label">{{ item.name }}</text>
              <text class="beverage-meta-label">
                {{ item.beverageType || '饮品' }} · {{ item.isAlcoholic ? `含酒精 ${item.alcoholDegree || 0}%` : '无酒精' }}
              </text>
              <text v-if="item.recommendReason" class="beverage-reason-label">{{ item.recommendReason }}</text>
              <view v-if="hasMixMethod(item)" class="beverage-guide-badge">
                <app-icon class="beverage-bulb" name="lightbulb" size="22rpx" />
                <text>点击查看调制方法</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Fixed Bottom Action Bar -->
      <view class="bottom-fixed-bar">
        <view class="bottom-bar-inner">
        <button 
          class="bar-btn secondary-bar-btn" 
          :disabled="isAddingToBasket"
          @click="toggleMainIngredientsInBasket"
        >
            <app-icon class="btn-icon-svg" name="basket" size="24rpx" />
            <text>{{ areMainIngredientsInBasket ? '已在菜篮子' : '加入菜篮子' }}</text>
        </button>
        <button 
          class="bar-btn primary-bar-btn" 
          @click="startCooking"
        >
            <app-icon class="btn-icon-svg" name="recipe" size="24rpx" />
            <text>开始烹饪</text>
        </button>
        </view>
      </view>
    </template>

    <!-- Ingredient Guide Modal popup (pantry/selection tips) -->
    <view v-if="activeGuide" class="guide-modal-mask" @click="closeIngredientGuide">
      <view class="guide-modal-panel" @click.stop>
        <view class="guide-modal-header">
          <view>
            <text class="guide-modal-title">{{ activeGuide.name }}怎么挑</text>
            <text class="guide-modal-subtitle">买菜时看这几处就够了</text>
          </view>
          <text class="guide-modal-close-x" @click="closeIngredientGuide">×</text>
        </view>
        <image class="guide-modal-img" :src="activeGuide.image" mode="aspectFill" />
        <view class="guide-modal-tips-list">
          <view v-for="tip in activeGuide.tips" :key="tip" class="guide-modal-tip-row">
            <view class="guide-modal-tip-dot" />
            <text class="guide-modal-tip-text">{{ tip }}</text>
          </view>
        </view>
        <view class="guide-modal-ok-btn" @click="closeIngredientGuide">知道了</view>
      </view>
    </view>

    <!-- Beverage Mixing details popup -->
    <view v-if="activeBeverage" class="guide-modal-mask" @click="closeBeverageMixMethod">
      <view class="guide-modal-panel mix-details-panel" @click.stop>
        <view class="guide-modal-header">
          <view>
            <text class="guide-modal-title">{{ activeBeverage.name }}调制方法</text>
            <text class="guide-modal-subtitle">{{ activeBeverage.beverageType }} · {{ activeBeverage.mixMethod }}</text>
          </view>
          <text class="guide-modal-close-x" @click="closeBeverageMixMethod">×</text>
        </view>
        
        <scroll-view scroll-y class="mix-scroll-container">
          <image class="guide-modal-img" :src="activeBeverage.coverImage || activeBeverage.cover" mode="aspectFill" />
          
          <view class="mix-info-box">
            <view v-if="activeBeverage.baseLiquor" class="mix-kv-row">
              <text class="mix-key">基酒/主料：</text>
              <text class="mix-val">{{ activeBeverage.baseLiquor }}</text>
            </view>
            <view v-if="activeBeverage.mixIngredients" class="mix-kv-row">
              <text class="mix-key">辅料：</text>
              <text class="mix-val">{{ activeBeverage.mixIngredients }}</text>
            </view>
            <view v-if="activeBeverage.accessories" class="mix-kv-row">
              <text class="mix-key">额外配件：</text>
              <text class="mix-val">{{ activeBeverage.accessories }}</text>
            </view>
            <view v-if="activeBeverage.garnish" class="mix-kv-row">
              <text class="mix-key">装饰物：</text>
              <text class="mix-val">{{ activeBeverage.garnish }}</text>
            </view>
            <view v-if="activeBeverage.glassType || activeBeverage.iceType" class="mix-kv-row">
              <text class="mix-key">杯型/冰块：</text>
              <text class="mix-val">
                {{ [activeBeverage.glassType, activeBeverage.iceType].filter(Boolean).join(' / ') }}
              </text>
            </view>
          </view>
          
          <view v-if="activeBeverage.mixSteps && activeBeverage.mixSteps.length" class="mix-steps-block">
            <text class="mix-steps-header-title">调制步骤</text>
            <view class="mix-step-item-list">
              <view v-for="(step, idx) in activeBeverage.mixSteps" :key="idx" class="mix-step-detail-row">
                <view class="mix-step-index-dot">{{ step.stepNo }}</view>
                <view class="mix-step-main-text">
                  <text class="mix-step-desc">{{ step.description }}</text>
                  <text v-if="step.estimatedTime" class="mix-step-time-label">预计用时：{{ step.estimatedTime }}秒</text>
                  <image v-if="step.image" class="mix-step-inline-img" :src="step.image" mode="aspectFill" />
                </view>
              </view>
            </view>
          </view>
          
          <view v-if="activeBeverage.mixTips" class="mix-tips-callout">
            <text class="mix-tips-header">调制小贴士</text>
            <text class="mix-tips-body">{{ activeBeverage.mixTips }}</text>
          </view>
        </scroll-view>
        
        <view class="guide-modal-ok-btn" @click="closeBeverageMixMethod">知道了</view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onLoad, onPageScroll, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import { addBasketItem, getIngredientPurchaseText, loadBasketItems, removeBasketItem } from '../../services/basket';
import type { BasketItem } from '../../services/basket';
import { loadAuthUser, syncAuthUserWithBackend } from '../../services/auth';
import {
  addMobileFavorite,
  addMobileViewHistory,
  deleteMobileFavorite,
  getRecipe,
  listMobileFavorites,
  listRecipes,
  resolveAssetUrl
} from '../../services/public-api';

interface Ingredient {
  id?: number | string;
  name: string;
  amount: string;
  cover?: string;
}

interface Step {
  id?: number;
  text: string;
  image?: string;
  duration?: string;
}

interface Recipe {
  id: string;
  name: string;
  subtitle: string;
  description?: string;
  image: string;
  tags?: string[];
  tag: {
    type: string;
    label: string;
  };
  duration: string;
  difficulty: string;
  taste: string;
  calories: string;
  servings: string;
  ingredients: Ingredient[];
  steps: Step[];
  tips: string[];
  beverages: {
    id: string;
    name: string;
    coverImage: string | null;
    beverageType: string | null;
    isAlcoholic: boolean;
    alcoholDegree: number | null;
    recommendReason: string | null;
    description: string | null;
  }[];
}

interface IngredientGuide {
  name: string;
  image: string;
  tips: string[];
}

const emptyRecipeDetail: Recipe = {
  id: '',
  name: '',
  subtitle: '',
  image: '',
  tag: { type: 'success', label: '' },
  duration: '',
  difficulty: '',
  taste: '',
  calories: '',
  servings: '',
  ingredients: [],
  steps: [],
  tips: [],
  beverages: []
};

const recipe = ref<Recipe>({ ...emptyRecipeDetail });

const remoteLoading = ref(false);
const remoteError = ref<string | null>(null);
const currentRecipeId = ref<string | null>(null);
const currentRecipeLegacyId = ref<number | null>(null);
const favoriteRecordId = ref<number | null>(null);
const favoriteChanging = ref(false);

const activeTab = ref<'ingredients' | 'steps'>('ingredients');

const currentServings = ref(2);

const readRecipeIdFromRoute = (query?: Record<string, string | undefined>) => {
  const fromQuery = query?.id?.trim();
  if (fromQuery) return fromQuery;
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1] as { options?: Record<string, string | undefined> } | undefined;
  const fromPage = currentPage?.options?.id?.trim();
  return fromPage || null;
};

const getBaseServingsCount = (servingsStr: any): number => {
  if (!servingsStr) return 2;
  const num = parseInt(String(servingsStr).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) || num <= 0 ? 2 : num;
};

const baseServingsCount = computed(() => getBaseServingsCount(recipe.value.servings));
const servingsScale = computed(() => {
  const base = baseServingsCount.value;
  return base > 0 ? currentServings.value / base : 1;
});

const servingsDisplayText = computed(() => {
  if (currentServings.value === baseServingsCount.value) {
    return recipe.value.servings || '—';
  }
  return `${currentServings.value}人`;
});

const decreaseServings = () => {
  if (currentServings.value > 1) {
    currentServings.value--;
  }
};
const increaseServings = () => {
  currentServings.value++;
};

const scaleAmountText = (amount: string | null | undefined, scale: number): string => {
  if (!amount) return '';
  const valStr = String(amount).trim();
  if (!valStr) return '';
  return valStr.replace(/([0-9.]+)/g, (match) => {
    const val = parseFloat(match);
    if (isNaN(val)) return match;
    const scaledVal = val * scale;
    return Number(scaledVal.toFixed(1)).toString();
  });
};

const isIngredientsExpanded = ref(false);
const visibleIngredients = computed(() => {
  const list = recipe.value.ingredients || [];
  if (list.length <= 8 || isIngredientsExpanded.value) {
    return list;
  }
  return list.slice(0, 8);
});

const recipeTags = computed(() => {
  const list: string[] = [];
  if (recipe.value.tag?.label) {
    list.push(recipe.value.tag.label);
  }
  if (recipe.value.difficulty && recipe.value.difficulty !== '—') {
    list.push(recipe.value.difficulty);
  }
  if (recipe.value.taste && recipe.value.taste !== '—') {
    list.push(recipe.value.taste);
  }
  return list.slice(0, 3);
});

const relatedRecipesList = ref<any[]>([]);

const fetchRelatedRecipes = async () => {
  try {
    const res = await listRecipes({ page: 1, pageSize: 4 });
    relatedRecipesList.value = res.list
      .filter((item) => String(item.id) !== String(currentRecipeId.value))
      .slice(0, 3);
  } catch (e) {
    console.error('Failed to load related recipes', e);
  }
};

const goToRecipesCategory = () => {
  uni.reLaunch({ url: '/pages/ingredients/index?tab=recipes' });
};

const goToRecipe = (id: string | number) => {
  uni.navigateTo({
    url: `/pages/recipe-detail/index?id=${id}`
  });
};

const shareRecipe = () => {
  uni.showToast({
    title: '链接已复制，快去分享给好友吧',
    icon: 'none'
  });
};

const loadRemoteRecipe = async (id: string) => {
  remoteLoading.value = true;
  remoteError.value = null;
  try {
    const data = (await getRecipe(id)) as any;
    
    // 1. Title / Name mapping
    const titleVal = data.title ?? data.name ?? '';
    
    // 2. Cover image mapping
    const coverVal = resolveAssetUrl(data.cover ?? data.image ?? data.coverUrl, '');
    
    // 3. Subtitle / Description mapping
    const subtitleVal = data.subtitle ?? data.description ?? data.summary ?? '';
    
    // 4. Tags mapping
    let tagsList: string[] = [];
    if (data.tags) {
      if (Array.isArray(data.tags)) {
        tagsList = data.tags;
      } else if (typeof data.tags === 'string') {
        tagsList = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      }
    } else if (data.category?.name) {
      tagsList = [data.category.name];
    } else if (data.categoryName) {
      tagsList = [data.categoryName];
    }
    // 5. Cooking Time mapping
    let durationVal = '—';
    if (data.cookTime) {
      durationVal = `${data.cookTime}分钟`;
    } else if (data.cookMinutes) {
      durationVal = `${data.cookMinutes}分钟`;
    } else if (data.duration) {
      durationVal = data.duration;
    }
    
    // 6. Servings mapping
    const servingsVal = data.servings ? String(data.servings) : (data.people ? String(data.people) : '');
    
    // 7. Difficulty mapping
    const difficultyVal = data.difficulty ?? '';

    // 8. Ingredients list mapping
    const rawIngs = data.ingredients ?? (data.ingredientItems ?? []);
    const mappedIngredients = rawIngs.map((item: any) => {
      const name = item.name;
      const coverUrl = item.ingredient?.cover ? resolveAssetUrl(item.ingredient.cover) : '';
      return {
        id: item.id,
        name: item.name,
        amount: item.amount ?? '',
        cover: coverUrl
      };
    });

    // 9. Steps timeline mapping
    const rawSteps = data.steps ?? (data.cookingSteps ?? []);
    const mappedSteps = rawSteps && rawSteps.length > 0
      ? rawSteps.map((s: any) => ({
          text: s.description ?? (s.content ?? s.text),
          image: s.image ? resolveAssetUrl(s.image) : '',
          duration: s.duration ? `约${s.duration}分钟` : ''
        }))
      : [];

    // 10. Tips mapping
    let mappedTips: string[] = [];
    if (data.tips) {
      mappedTips = data.tips.split('\n').map((t: string) => t.trim()).filter(Boolean);
    }

    recipe.value = {
      id: String(data.id),
      name: titleVal,
      subtitle: subtitleVal,
      image: coverVal,
      tag: { type: 'success', label: data.category?.name ?? data.scene ?? '' },
      duration: durationVal,
      difficulty: difficultyVal,
      taste: data.taste ?? '',
      calories: data.calories ? `约${data.calories}kcal` : '',
      servings: servingsVal,
      ingredients: mappedIngredients,
      steps: mappedSteps,
      tips: mappedTips,
      beverages: (data.beverages ?? []).map((entry: any) => ({
        id: entry.beverage.id,
        name: entry.beverage.name,
        coverImage: resolveAssetUrl(entry.beverage.coverImage),
        beverageType: entry.beverage.beverageType,
        isAlcoholic: entry.beverage.isAlcoholic,
        alcoholDegree: entry.beverage.alcoholDegree,
        recommendReason: entry.recommendReason,
        description: entry.beverage.description
      }))
    };

    currentServings.value = getBaseServingsCount(recipe.value.servings);
    void fetchRelatedRecipes();
    const numericRecipeId = Number.parseInt(String(data.legacyId ?? data.id), 10);
    if (Number.isFinite(numericRecipeId)) {
      currentRecipeLegacyId.value = numericRecipeId;
      void recordRecipeViewHistory(numericRecipeId);
      void syncRecipeFavoriteState(numericRecipeId).catch(() => undefined);
    }
  } catch (err) {
    currentRecipeLegacyId.value = null;
    remoteError.value = err instanceof Error ? err.message : '加载失败';
    recipe.value = { ...emptyRecipeDetail };
    currentServings.value = getBaseServingsCount(recipe.value.servings);
  } finally {
    remoteLoading.value = false;
  }
};

onLoad((query?: Record<string, string | undefined>) => {
  const id = readRecipeIdFromRoute(query);
  if (id) {
    currentRecipeId.value = id;
    void loadRemoteRecipe(id);
  } else {
    recipe.value = { ...emptyRecipeDetail };
    remoteError.value = '缺少菜谱 ID';
  }
});

onMounted(() => {
  if (currentRecipeId.value) return;
  const id = readRecipeIdFromRoute();
  if (!id) return;
  currentRecipeId.value = id;
  void loadRemoteRecipe(id);
});

onShow(() => {
  if (currentRecipeId.value) return;
  const id = readRecipeIdFromRoute();
  if (!id) return;
  currentRecipeId.value = id;
  void loadRemoteRecipe(id);
});

const handleRetryRemote = () => {
  if (!currentRecipeId.value) return;
  void loadRemoteRecipe(currentRecipeId.value);
};

const activeGuideName = ref('');
const basketItemIds = ref<string[]>([]);
const basketItems = ref<BasketItem[]>([]);
const isCollected = ref(false);
const pantrySeasonings = ['盐', '糖', '白糖', '酱油', '生抽', '老抽', '蚝油', '料酒', '醋', '食用油', '香油', '胡椒粉', '白胡椒粉', '淀粉'];

const ingredientGuides: Record<string, IngredientGuide> = {};

const activeGuide = computed(() => ingredientGuides[activeGuideName.value]);
const mainIngredients = computed(() => recipe.value.ingredients.filter((item) => !isPantrySeasoning(item.name)));
const areMainIngredientsInBasket = computed(() => {
  if (mainIngredients.value.length === 0) return false;
  return mainIngredients.value.every((item) => basketItemIds.value.includes(getRecipeIngredientBasketId(item)));
});

const goBack = () => {
  if (getCurrentPages().length <= 1) {
    uni.reLaunch({ url: '/pages/ingredients/index?tab=recipes' });
    return;
  }
  uni.navigateBack();
};

const getLoggedUserId = async () => {
  const user = await syncAuthUserWithBackend(loadAuthUser());
  return user?.id ?? null;
};

const syncRecipeFavoriteState = async (recipeId: number) => {
  const userId = await getLoggedUserId();
  if (!userId) {
    isCollected.value = false;
    favoriteRecordId.value = null;
    return;
  }
  const data = await listMobileFavorites({ userId, page: 1, pageSize: 100 });
  const record = data.list.find((item) => item.recipeId === recipeId);
  isCollected.value = Boolean(record);
  favoriteRecordId.value = record?.id ?? null;
};

const recordRecipeViewHistory = async (recipeId: number) => {
  try {
    const userId = await getLoggedUserId();
    if (!userId) return;
    await addMobileViewHistory({ userId, recipeId });
  } catch {
    // 浏览历史写入失败不阻断详情页阅读。
  }
};

const toggleCollectRecipe = async () => {
  if (favoriteChanging.value) return;
  const recipeId = currentRecipeLegacyId.value;
  if (!recipeId) {
    uni.showToast({ title: '真实菜谱加载后可收藏', icon: 'none' });
    return;
  }
  favoriteChanging.value = true;
  try {
    const userId = await getLoggedUserId();
    if (!userId) {
      uni.showToast({ title: '请先登录后收藏', icon: 'none' });
      return;
    }
    if (isCollected.value && favoriteRecordId.value) {
      await deleteMobileFavorite(favoriteRecordId.value);
      isCollected.value = false;
      favoriteRecordId.value = null;
      uni.showToast({ title: '已取消收藏', icon: 'none' });
      return;
    }
    const record = await addMobileFavorite({ userId, recipeId });
    isCollected.value = true;
    favoriteRecordId.value = record.id;
    uni.showToast({ title: '已收藏', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: err instanceof Error ? err.message : '操作失败', icon: 'none' });
  } finally {
    favoriteChanging.value = false;
  }
};

const isPantrySeasoning = (name: string) => pantrySeasonings.includes(name);

const getRecipeIngredientBasketId = (item: Ingredient) => `${recipe.value.id}-${item.name}`;

const isIngredientInBasket = (item: Ingredient) => basketItemIds.value.includes(getRecipeIngredientBasketId(item));

const addIngredientToBasket = async (item: Ingredient, showToast = true) => {
  if (isIngredientInBasket(item)) {
    if (showToast) {
      uni.showToast({
        title: `${item.name}已在菜篮子`,
        icon: 'none'
      });
    }
    return;
  }

  const scaledAmt = scaleAmountText(item.amount, servingsScale.value);

  await addBasketItem({
    id: getRecipeIngredientBasketId(item),
    recipeId: currentRecipeLegacyId.value ? String(currentRecipeLegacyId.value) : recipe.value.id,
    recipeName: recipe.value.name,
    name: item.name,
    amountText: scaledAmt,
    purchaseText: getIngredientPurchaseText(item.name),
    checked: false
  });
  await syncBasketState();
  if (showToast) {
    uni.showToast({
      title: `${item.name}已加入菜篮子`,
      icon: 'success'
    });
  }
};

const removeIngredientFromBasket = async (item: Ingredient, showToast = true) => {
  if (!isIngredientInBasket(item)) {
    return;
  }

  const basketItem = basketItems.value.find((entry) => getRecipeIngredientBasketId(item) === getBasketKey(entry));
  if (basketItem) {
    await removeBasketItem(basketItem.id);
  }
  await syncBasketState();
  if (showToast) {
    uni.showToast({
      title: `${item.name}已移出菜篮子`,
      icon: 'none'
    });
  }
};

const toggleIngredientInBasket = async (item: Ingredient) => {
  if (isIngredientInBasket(item)) {
    await removeIngredientFromBasket(item);
    return;
  }
  await addIngredientToBasket(item);
};

const isAddingToBasket = ref(false);

const toggleMainIngredientsInBasket = async () => {
  if (isAddingToBasket.value) return;
  isAddingToBasket.value = true;
  
  try {
    if (areMainIngredientsInBasket.value) {
      await Promise.all(mainIngredients.value.map(async (item) => {
        const basketItem = basketItems.value.find((entry) => getRecipeIngredientBasketId(item) === getBasketKey(entry));
        if (basketItem) await removeBasketItem(basketItem.id);
      }));
      await syncBasketState();
      uni.showToast({
        title: '主食材已从菜篮子中移除',
        icon: 'none'
      });
    } else {
      const pendingIngredients = mainIngredients.value.filter((item) => !isIngredientInBasket(item));
      await Promise.all(pendingIngredients.map((item) => addIngredientToBasket(item, false)));
      uni.showToast({
        title: pendingIngredients.length ? '主食材已全部加入菜篮子' : '主食材已在菜篮子',
        icon: pendingIngredients.length ? 'success' : 'none'
      });
    }
  } catch (e) {
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
  } finally {
    setTimeout(() => {
      isAddingToBasket.value = false;
    }, 300);
  }
};

const getBasketKey = (item: BasketItem) => `${item.recipeId}-${item.name}`;

const syncBasketState = async () => {
  basketItems.value = await loadBasketItems();
  basketItemIds.value = basketItems.value.map(getBasketKey);
};

const showIngredientGuide = (name: string) => {
  if (ingredientGuides[name]) {
    activeGuideName.value = name;
  }
};

const closeIngredientGuide = () => {
  activeGuideName.value = '';
};

const startCooking = () => {
  const targetId = currentRecipeId.value || recipe.value.id || (currentRecipeLegacyId.value ? String(currentRecipeLegacyId.value) : '');
  if (!targetId) {
    uni.showToast({ title: '菜谱 ID 缺失，无法开始烹饪', icon: 'none' });
    return;
  }
  uni.navigateTo({
    url: `/pages/cooking/index?id=${encodeURIComponent(targetId)}`
  });
};

const activeBeverage = ref<any>(null);

const hasMixMethod = (beverage: any) => {
  if (!beverage || !beverage.description) return false;
  try {
    if (beverage.description.startsWith('{')) {
      const parsed = JSON.parse(beverage.description);
      return parsed.showMixMethod === true && (parsed.mixMethod || parsed.baseLiquor || (parsed.mixSteps && parsed.mixSteps.length));
    }
  } catch (e) {}
  return false;
};

const showBeverageMixMethod = (beverage: any) => {
  if (!hasMixMethod(beverage)) {
    return;
  }
  try {
    const descObj = JSON.parse(beverage.description);
    activeBeverage.value = {
      name: beverage.name,
      coverImage: beverage.coverImage,
      beverageType: beverage.beverageType,
      isAlcoholic: beverage.isAlcoholic,
      alcoholDegree: beverage.alcoholDegree,
      ...descObj
    };
  } catch (e) {
    uni.showToast({ title: '配置解析失败', icon: 'none' });
  }
};

const closeBeverageMixMethod = () => {
  activeBeverage.value = null;
};

onShow(() => {
  void syncBasketState().catch(() => undefined);
  if (currentRecipeLegacyId.value) {
    void syncRecipeFavoriteState(currentRecipeLegacyId.value).catch(() => undefined);
  }
});
</script>

<style scoped lang="scss">
.page-container {
  width: 100%;
  max-width: none;
  margin: 0;
  min-height: 100vh;
  background: var(--app-bg);
  padding-bottom: calc(180rpx + env(safe-area-inset-bottom, 0));
  position: relative;
  overflow-x: hidden;
}

.hero-section {
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  height: 720rpx;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  display: block;
}

.hero-gradient-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 220rpx;
  background: linear-gradient(180deg, rgba(245, 241, 234, 0) 0%, rgba(245, 241, 234, 0.72) 68%, var(--app-bg) 100%);
  pointer-events: none;
}

.floating-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: calc(env(safe-area-inset-top, 0) + 24rpx) 24rpx 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #FFFDFC;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  color: var(--text-primary);
  border: 1rpx solid rgba(183, 174, 161, 0.15);
  transition: all 0.2s ease;
}

.nav-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.95);
}

.header-right-btns {
  display: flex;
  gap: 20rpx;
}

.icon-svg {
  width: 40rpx;
  height: 40rpx;
}

.favorite-btn.is-active {
  background: rgba(229, 115, 95, 0.1);
  border-color: rgba(229, 115, 95, 0.2);
}

.remote-banner {
  margin: 24rpx;
  padding: 40rpx;
  border-radius: var(--app-radius-card);
  text-align: center;
  background: var(--app-surface-strong);
  border: 1rpx solid var(--app-border);
  box-shadow: var(--app-shadow);
}
.remote-banner__text {
  font-size: var(--font-size-body-sm);
  color: var(--text-secondary);
}
.remote-banner__error {
  font-size: var(--font-size-body-sm);
  color: var(--app-danger);
}
.remote-banner__retry {
  margin: 20rpx auto 0;
  padding: 10rpx 40rpx;
  border-radius: 999rpx;
  background: var(--text-brand);
  color: #FFFDFC;
  font-size: var(--font-size-caption);
  width: fit-content;
}

.recipe-info-card {
  position: relative;
  z-index: 5;
  margin: -96rpx 20rpx 0;
  padding: 44rpx 32rpx;
  background: #FFFDFC;
  border: 1rpx solid rgba(183, 174, 161, 0.22);
  border-radius: 36rpx;
  box-shadow: 0 22rpx 60rpx rgba(122, 116, 107, 0.08);
}

.recipe-title-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.recipe-name {
  font-family: var(--font-system);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
  color: var(--text-primary);
}

.recipe-tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag-chip {
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  line-height: var(--line-tag);
  color: var(--text-brand);
  background: rgba(122, 139, 111, 0.1);
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
}

.tag-chip.is-warm {
  background: rgba(217, 138, 74, 0.1);
  color: var(--text-warm);
}

.recipe-description {
  font-family: var(--font-system);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
  color: var(--text-secondary);
}

.divider {
  height: 1rpx;
  background-color: var(--app-border);
  margin: 32rpx 0;
}

.recipe-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-col {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.meta-icon {
  width: 36rpx;
  height: 36rpx;
  color: var(--text-brand);
  flex-shrink: 0;
}

.meta-info-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.meta-col-value {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  line-height: 1.2;
}

.meta-col-label {
  font-size: var(--font-size-tabbar);
  color: var(--text-placeholder);
  line-height: 1.2;
}

.meta-divider {
  width: 1rpx;
  height: 48rpx;
  background-color: var(--app-border);
  margin: 0 24rpx;
}

.recipe-detail-switch {
  margin: 32rpx 20rpx 0;
  overflow: hidden;
  background: #FFFDFC;
  border: 1rpx solid rgba(183, 174, 161, 0.2);
  border-radius: 36rpx;
  box-shadow: 0 22rpx 60rpx rgba(122, 116, 107, 0.06);
  position: relative;
  padding: 10rpx;
}

.tab-toggle-container {
  margin: 0;
  height: 88rpx;
  background: rgba(233, 226, 214, 0.46);
  padding: 6rpx;
  border-radius: 30rpx;
  display: flex;
  position: relative;
  border: 0;
  overflow: hidden;
  z-index: 2;
}

.tab-active-plate {
  position: absolute;
  top: 6rpx;
  bottom: 6rpx;
  width: calc(50% - 6rpx);
  background: #FFFDFC;
  border-radius: 26rpx;
  box-shadow: 0 8rpx 24rpx rgba(122, 139, 111, 0.08);
  pointer-events: none;
  transition: left 220ms cubic-bezier(0.32, 0.72, 0, 1), right 220ms cubic-bezier(0.32, 0.72, 0, 1);
  z-index: 1;
}

.tab-toggle-container.is-ingredients .tab-active-plate {
  left: 6rpx;
  right: auto;
}

.tab-toggle-container.is-steps .tab-active-plate {
  right: 6rpx;
  left: auto;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 76rpx;
  padding: 0;
  border-radius: 30rpx;
  transition: color 180ms ease;
  position: relative;
  cursor: pointer;
  z-index: 2;
  overflow: visible;
}

.tab-item:not(.is-active) {
  background: transparent;
}

.tab-text {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  color: var(--text-placeholder);
  transition: color 0.2s ease;
  position: relative;
  z-index: 3;
}

.tab-item.is-active {
  z-index: 3;
}

.tab-item.is-active .tab-text {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
}

.active-indicator {
  width: 34rpx;
  height: 4rpx;
  background: var(--text-brand);
  border-radius: 2rpx;
  margin-top: 6rpx;
  opacity: 0;
  transform: scaleX(0.5);
  transition: all 0.2s ease;
  position: relative;
  z-index: 3;
}

.tab-item.is-active .active-indicator {
  opacity: 1;
  transform: scaleX(1);
}

.panel-container {
  position: relative;
  z-index: 3;
  margin-top: 0;
  padding: 34rpx 22rpx 26rpx;
  background: #FFFDFC;
  box-shadow: none;
  min-height: 260rpx;
}

.recipe-detail-switch.is-ingredients .panel-container {
  border-radius: 0;
}

.recipe-detail-switch.is-steps .panel-container {
  border-radius: 0;
}

.ingredients-panel,
.steps-panel {
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28rpx;
  gap: 16rpx;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.panel-title {
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.panel-subtitle {
  font-size: var(--font-size-tag);
  color: var(--text-placeholder);
}

.stepper-capsule {
  display: flex;
  align-items: center;
  background: rgba(233, 226, 214, 0.4);
  border-radius: 999rpx;
  padding: 6rpx;
  border: 1rpx solid rgba(183, 174, 161, 0.15);
}

.stepper-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: #FFFDFC;
  color: var(--text-brand);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);
  transition: all 0.15s ease;
}

.stepper-btn:active {
  transform: scale(0.9);
  background: var(--app-accent-soft);
}

.stepper-btn.is-disabled {
  opacity: 0.4;
  pointer-events: none;
}

.stepper-icon {
  width: 24rpx;
  height: 24rpx;
}

.stepper-value {
  padding: 0 20rpx;
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.ingredients-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.ingredient-card {
  position: relative;
  background: var(--app-surface-strong);
  border: 1rpx solid var(--app-border);
  border-radius: 24rpx;
  padding: 20rpx 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.01);
  transition: all 0.2s ease;
}

.ingredient-card:active {
  transform: translateY(2rpx);
  background: var(--app-bg);
}

.card-basket-btn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
  background: rgba(245, 241, 234, 0.7);
  color: var(--text-brand);
  border: 1rpx solid rgba(183, 174, 161, 0.15);
  transition: all 0.2s ease;
}

.card-basket-btn.is-added {
  background: var(--text-brand);
  color: #FFFDFC;
  border-color: var(--text-brand);
}

.basket-icon-svg {
  width: 22rpx;
  height: 22rpx;
}

.ingredient-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 20rpx;
  background: #FAF7F1;
  margin-bottom: 12rpx;
}

.ingredient-name-label {
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ingredient-amount-label {
  font-size: var(--font-size-tabbar);
  color: var(--text-tertiary);
  margin-top: 6rpx;
}

.toggle-fold-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin: 32rpx auto 16rpx;
  padding: 12rpx 36rpx;
  border-radius: 999rpx;
  background: rgba(233, 226, 214, 0.4);
  color: var(--text-brand);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  width: fit-content;
  transition: all 0.15s ease;
}

.toggle-fold-btn:active {
  background: var(--app-accent-soft);
}

.fold-arrow {
  width: 28rpx;
  height: 28rpx;
  transition: transform 0.25s ease;
}

.fold-arrow.is-flipped {
  transform: rotate(180deg);
}

.empty-steps-block,
.empty-related-block {
  padding: 40rpx 0;
  text-align: center;
}

.empty-steps-text,
.empty-related-text {
  font-size: var(--font-size-body-sm);
  color: var(--text-placeholder);
}

.steps-timeline-list {
  display: flex;
  flex-direction: column;
  gap: 36rpx;
  margin-top: 16rpx;
}

.timeline-step-item {
  display: flex;
  gap: 24rpx;
}

.timeline-axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  position: relative;
}

.step-num-circle {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: rgba(122, 139, 111, 0.1);
  border: 3rpx solid var(--text-brand);
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.timeline-line-dashed {
  position: absolute;
  top: 48rpx;
  bottom: -48rpx;
  width: 0;
  border-left: 3rpx dashed var(--text-brand);
  opacity: 0.35;
  z-index: 1;
}

.step-detail-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--app-surface-strong);
  border: 1rpx solid var(--app-border);
  border-radius: 28rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.01);
}

.step-content-layout {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
  flex: 1;
}

.step-img-left {
  width: 180rpx;
  height: 135rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
  background: var(--app-bg);
}

.step-text-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 135rpx;
}

.step-text-right.no-image {
  min-height: auto;
}

.step-desc-text {
  font-size: var(--font-size-body-sm);
  color: var(--text-primary);
  line-height: var(--line-body-sm);
}

.step-duration-capsule {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(122, 139, 111, 0.1);
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  width: fit-content;
  margin-top: 12rpx;
}

.duration-icon {
  width: 24rpx;
  height: 24rpx;
}

.related-section {
  margin: 44rpx 24rpx;
  background: #FFFDFC;
  border: 1rpx solid var(--app-border);
  border-radius: 36rpx;
  padding: 32rpx;
  box-shadow: var(--app-shadow);
}

.related-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.more-link-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  color: var(--text-placeholder);
  cursor: pointer;
}

.more-text {
  font-size: var(--font-size-caption);
}

.more-arrow {
  width: 24rpx;
  height: 24rpx;
}

.related-list {
  display: flex;
  flex-direction: column;
}

.related-item-row {
  display: flex;
  gap: 24rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--app-border);
}

.related-item-row:last-child {
  border-bottom: none;
}

.related-thumb {
  width: 200rpx;
  height: 150rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.related-info-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.related-title-text {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-desc-text {
  font-size: var(--font-size-tag);
  color: var(--text-tertiary);
  line-height: 1.4;
  margin: 8rpx 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-meta-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.related-meta-label {
  font-size: var(--font-size-tabbar);
  color: var(--text-placeholder);
}

.related-meta-dot {
  color: var(--text-placeholder);
}

.related-diff-badge {
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-medium);
  background: rgba(122, 139, 111, 0.1);
  color: var(--text-brand);
  padding: 2rpx 12rpx;
  border-radius: 999rpx;
  margin-left: 8rpx;
}

.tips-section-wrapper {
  margin: 32rpx 24rpx;
}

.tips-outer-card {
  position: relative;
  background: #FFFDFC;
  border: 1rpx solid var(--app-border);
  border-radius: 36rpx;
  padding: 32rpx;
  box-shadow: var(--app-shadow);
  overflow: hidden;
}

.tips-inner-content {
  position: relative;
  z-index: 2;
}

.tips-title-text {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  display: block;
  margin-bottom: 20rpx;
}

.tips-bullet-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.tip-bullet-row {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.tip-bullet-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--text-brand);
  flex-shrink: 0;
  margin-top: 10rpx;
}

.tip-bullet-text {
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
  color: var(--text-secondary);
}

.cooking-pot-graphic {
  position: absolute;
  pointer-events: none;
  transition: all 0.3s ease;
}

.layout-ingredients .cooking-pot-graphic {
  top: 24rpx;
  right: 28rpx;
  opacity: 0.15;
}

.layout-steps .cooking-pot-graphic {
  bottom: 24rpx;
  right: 28rpx;
  opacity: 0.15;
}

.pot-svg {
  width: 96rpx;
  height: 96rpx;
  color: var(--text-brand);
}

.beverages-card-section {
  margin: 40rpx 24rpx;
}

.section-header-box {
  margin-bottom: 20rpx;
}

.beverage-cards-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.beverage-item-card {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 32rpx;
  background: rgba(245, 241, 234, 0.5);
  border: 1rpx solid var(--app-border);
}

.beverage-item-card.is-interactive:active {
  background: rgba(245, 241, 234, 0.85);
}

.beverage-thumb-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.beverage-info-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.beverage-title-label {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.beverage-meta-label {
  font-size: var(--font-size-tag);
  color: var(--text-secondary);
}

.beverage-reason-label {
  font-size: var(--font-size-tag);
  color: var(--text-tertiary);
  line-height: 1.4;
}

.beverage-guide-badge {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.beverage-bulb {
  width: 24rpx;
  height: 24rpx;
}

.bottom-fixed-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  max-width: none;
  background: rgba(255, 253, 252, 0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1rpx solid rgba(183, 174, 161, 0.2);
  padding: 24rpx 24rpx calc(24rpx + env(safe-area-inset-bottom, 0));
  z-index: 100;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.02);
}

.bottom-bar-inner {
  display: flex;
  gap: 20rpx;
}

.bar-btn {
  flex: 1;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  transition: all 0.2s ease;
  border: none;
}

.bar-btn::after {
  border: none;
}

.bar-btn:active {
  transform: scale(0.97);
}

.secondary-bar-btn {
  background: #FFFDFC;
  border: 2rpx solid var(--text-brand) !important;
  color: var(--text-brand);
}

.primary-bar-btn {
  background: var(--text-brand);
  color: #FFFDFC;
}

.btn-icon-svg {
  width: 36rpx;
  height: 36rpx;
}

.guide-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: flex-end;
  background: rgba(47, 47, 47, 0.4);
}

.guide-modal-panel {
  width: 100%;
  max-width: 393px;
  margin: 0 auto;
  background: #FFFDFC;
  border-radius: 48rpx 48rpx 0 0;
  padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom, 0));
  box-shadow: 0 -8rpx 36rpx rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  animation: slide-up 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.guide-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28rpx;
}

.guide-modal-title {
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  display: block;
}

.guide-modal-subtitle {
  font-size: var(--font-size-tag);
  color: var(--text-placeholder);
  display: block;
  margin-top: 4rpx;
}

.guide-modal-close-x {
  font-size: 40rpx;
  color: var(--text-placeholder);
  line-height: 1;
  cursor: pointer;
}

.guide-modal-img {
  width: 100%;
  height: 300rpx;
  border-radius: 28rpx;
  margin-bottom: 28rpx;
}

.guide-modal-tips-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 36rpx;
}

.guide-modal-tip-row {
  display: flex;
  gap: 12rpx;
  align-items: flex-start;
}

.guide-modal-tip-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: var(--text-brand);
  flex-shrink: 0;
  margin-top: 10rpx;
}

.guide-modal-tip-text {
  font-size: var(--font-size-caption);
  line-height: var(--line-body);
  color: var(--text-secondary);
}

.guide-modal-ok-btn {
  background: var(--text-brand);
  color: #FFFDFC;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
}

.guide-modal-ok-btn:active {
  opacity: 0.9;
}

.mix-details-panel {
  max-height: 85vh;
}

.mix-scroll-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 28rpx;
}

.mix-info-box {
  background: rgba(245, 241, 234, 0.4);
  border-radius: 28rpx;
  padding: 24rpx;
  margin-bottom: 28rpx;
  border: 1rpx solid var(--app-border);
}

.mix-kv-row {
  display: flex;
  margin-bottom: 12rpx;
  font-size: var(--font-size-caption);
}

.mix-kv-row:last-child {
  margin-bottom: 0;
}

.mix-key {
  color: var(--text-tertiary);
  width: 160rpx;
  flex-shrink: 0;
}

.mix-val {
  color: var(--text-primary);
  font-weight: var(--font-medium);
  flex: 1;
}

.mix-steps-block {
  margin-bottom: 28rpx;
}

.mix-steps-header-title {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  display: block;
  margin-bottom: 16rpx;
}

.mix-step-item-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.mix-step-detail-row {
  display: flex;
  gap: 16rpx;
}

.mix-step-index-dot {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(122, 139, 111, 0.1);
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mix-step-main-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.mix-step-desc {
  font-size: var(--font-size-caption);
  color: var(--text-secondary);
  line-height: var(--line-body);
}

.mix-step-time-label {
  font-size: var(--font-size-tag);
  color: var(--text-placeholder);
}

.mix-step-inline-img {
  width: 240rpx;
  height: 150rpx;
  border-radius: 16rpx;
  margin-top: 8rpx;
}

.mix-tips-callout {
  background: rgba(239, 243, 236, 0.8);
  border-left: 6rpx solid var(--text-brand);
  padding: 24rpx;
  border-radius: 4rpx 24rpx 24rpx 4rpx;
  margin-bottom: 28rpx;
}

.mix-tips-header {
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  color: var(--text-brand);
  display: block;
  margin-bottom: 8rpx;
}

.mix-tips-body {
  font-size: var(--font-size-tag);
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Animations and fading styles */
.fade-in {
  animation: fade-in 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

/* Product Design refresh: premium, minimal recipe detail */
.page-container {
  background:
    radial-gradient(circle at 10% 8%, rgba(255, 253, 252, 0.92), transparent 36%),
    linear-gradient(180deg, #f5f1ea 0%, #fffdfc 48%, #f5f1ea 100%);
  color: var(--text-primary);
  font-family: var(--font-system);
  padding-bottom: calc(172rpx + env(safe-area-inset-bottom, 0));
}

.hero-section {
  height: 704rpx;
  border-radius: 0;
  background: #f5f1ea;
}

.hero-image {
  object-fit: cover;
  transform: scale(1.01);
}

.hero-gradient-overlay {
  height: 300rpx;
  background: linear-gradient(
    180deg,
    rgba(245, 241, 234, 0) 0%,
    rgba(245, 241, 234, 0.12) 32%,
    rgba(245, 241, 234, 0.82) 78%,
    #f5f1ea 100%
  );
}

.floating-header {
  padding: calc(env(safe-area-inset-top, 0) + 28rpx) 28rpx 18rpx;
}

.nav-btn {
  width: 76rpx;
  height: 76rpx;
  border: 0;
  border-radius: 38rpx;
  background: rgba(255, 253, 252, 0.94);
  color: var(--text-primary);
  box-shadow: 0 14rpx 38rpx rgba(122, 116, 107, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), background-color 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-btn:active {
  transform: scale(0.94);
}

.header-right-btns {
  gap: 16rpx;
}

.icon-svg {
  width: 34rpx;
  height: 34rpx;
  stroke-width: 1.8;
}

.recipe-info-card {
  margin: -118rpx 20rpx 0;
  padding: 42rpx 32rpx 34rpx;
  border: 0;
  border-radius: 34rpx;
  background: rgba(255, 253, 252, 0.98);
  box-shadow: 0 24rpx 72rpx rgba(122, 116, 107, 0.1);
}

.recipe-title-section {
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.recipe-name {
  font-size: var(--font-size-hero);
  font-weight: var(--font-semibold);
  line-height: var(--line-hero);
  letter-spacing: 0;
  color: var(--text-primary);
}

.recipe-tag-chips {
  gap: 10rpx;
}

.tag-chip {
  padding: 6rpx 18rpx;
  border-radius: 18rpx;
  background: rgba(122, 139, 111, 0.1);
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  line-height: var(--line-tag);
}

.recipe-description {
  display: block;
  font-size: var(--font-size-body);
  font-weight: var(--font-regular);
  line-height: var(--line-body);
  color: var(--text-secondary);
}

.divider {
  margin: 28rpx 0;
  background: rgba(183, 174, 161, 0.22);
}

.recipe-meta-row {
  align-items: stretch;
}

.meta-col {
  justify-content: center;
  gap: 14rpx;
}

.meta-icon {
  width: 34rpx;
  height: 34rpx;
  color: var(--text-brand);
  stroke-width: 1.8;
}

.meta-col-value {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
  color: var(--text-primary);
}

.meta-col-label {
  font-size: var(--font-size-tag);
  font-weight: var(--font-regular);
  line-height: var(--line-tag);
  color: var(--text-placeholder);
}

.meta-divider {
  height: auto;
  min-height: 52rpx;
  margin: 0 18rpx;
  background: rgba(183, 174, 161, 0.22);
}

.recipe-detail-switch {
  margin: 34rpx 20rpx 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 34rpx;
  background: rgba(255, 253, 252, 0.98);
  box-shadow: 0 22rpx 68rpx rgba(122, 116, 107, 0.08);
}

.tab-toggle-container {
  height: 96rpx;
  padding: 8rpx;
  border: 0;
  border-radius: 34rpx 34rpx 0 0;
  background: rgba(235, 228, 217, 0.72);
  box-shadow: inset 0 -1rpx 0 rgba(183, 174, 161, 0.16);
}

.tab-active-plate {
  top: 8rpx;
  bottom: 0;
  width: calc(50% - 8rpx);
  border-radius: 28rpx 28rpx 0 0;
  background: #fffdfc;
  box-shadow: 0 12rpx 34rpx rgba(122, 116, 107, 0.08);
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.tab-toggle-container.is-ingredients .tab-active-plate {
  left: 8rpx;
  right: auto;
  transform: translateX(0);
}

.tab-toggle-container.is-steps .tab-active-plate {
  left: 8rpx;
  right: auto;
  transform: translateX(100%);
}

.tab-item {
  height: 88rpx;
  border-radius: 28rpx 28rpx 0 0;
}

.tab-text {
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
  color: var(--text-placeholder);
}

.tab-item.is-active .tab-text {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
}

.active-indicator {
  width: 32rpx;
  height: 4rpx;
  margin-top: 6rpx;
  border-radius: 4rpx;
  background: var(--text-brand);
}

.panel-container {
  padding: 34rpx 28rpx 36rpx;
  min-height: 298rpx;
  background: #fffdfc;
}

.panel-header {
  margin-bottom: 30rpx;
  align-items: flex-start;
}

.panel-title {
  font-size: var(--font-size-detail-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-detail-title);
}

.panel-subtitle {
  margin-top: 4rpx;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-regular);
  line-height: var(--line-body-sm);
  color: var(--text-placeholder);
}

.stepper-capsule {
  padding: 6rpx;
  border: 0;
  border-radius: 32rpx;
  background: rgba(245, 241, 234, 0.92);
  box-shadow: inset 0 0 0 1rpx rgba(183, 174, 161, 0.18);
}

.stepper-btn {
  width: 54rpx;
  height: 54rpx;
  border: 0;
  border-radius: 27rpx;
  background: #fffdfc;
  color: var(--text-brand);
  box-shadow: 0 4rpx 16rpx rgba(122, 116, 107, 0.06);
}

.stepper-value {
  min-width: 74rpx;
  padding: 0 14rpx;
  text-align: center;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}

.ingredients-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16rpx;
}

.ingredient-card {
  min-height: 198rpx;
  padding: 18rpx 10rpx 16rpx;
  border: 0;
  border-radius: 24rpx;
  background: rgba(245, 241, 234, 0.46);
  box-shadow: inset 0 0 0 1rpx rgba(183, 174, 161, 0.12);
}

.ingredient-img {
  width: 92rpx;
  height: 92rpx;
  border-radius: 22rpx;
  margin-bottom: 12rpx;
  background: rgba(255, 253, 252, 0.82);
}

.ingredient-name-label {
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
}

.ingredient-amount-label {
  margin-top: 2rpx;
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
  color: var(--text-tertiary);
}

.card-basket-btn {
  width: 36rpx;
  height: 36rpx;
  top: 10rpx;
  right: 10rpx;
  border: 0;
  background: rgba(255, 253, 252, 0.9);
}

.basket-icon-svg {
  width: 20rpx;
  height: 20rpx;
  stroke-width: 1.9;
}

.toggle-fold-btn {
  margin: 30rpx auto 2rpx;
  padding: 10rpx 30rpx;
  border-radius: 22rpx;
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.steps-timeline-list {
  gap: 30rpx;
  margin-top: 4rpx;
}

.timeline-step-item {
  gap: 18rpx;
}

.step-num-circle {
  width: 48rpx;
  height: 48rpx;
  border: 0;
  border-radius: 24rpx;
  background: var(--text-brand);
  color: #fffdfc;
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  line-height: var(--line-tag);
}

.timeline-line-dashed {
  top: 52rpx;
  bottom: -34rpx;
  border-left: 2rpx solid rgba(122, 139, 111, 0.22);
}

.step-detail-card {
  padding: 0;
  border: 0;
  border-radius: 26rpx;
  background: transparent;
  box-shadow: none;
}

.step-content-layout {
  gap: 18rpx;
  padding: 18rpx;
  border-radius: 26rpx;
  background: rgba(245, 241, 234, 0.42);
}

.step-img-left {
  width: 172rpx;
  height: 132rpx;
  border-radius: 20rpx;
}

.step-desc-text {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-regular);
  line-height: var(--line-body-sm);
  color: var(--text-primary);
}

.step-duration-capsule {
  padding: 5rpx 16rpx;
  border-radius: 18rpx;
  background: rgba(122, 139, 111, 0.1);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.related-section,
.tips-outer-card,
.beverage-item-card {
  border: 0;
  background: rgba(255, 253, 252, 0.96);
  box-shadow: 0 18rpx 54rpx rgba(122, 116, 107, 0.06);
}

.related-section {
  margin: 34rpx 20rpx;
  padding: 30rpx;
  border-radius: 34rpx;
}

.section-title {
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
  color: var(--text-primary);
}

.related-thumb {
  width: 188rpx;
  height: 132rpx;
  border-radius: 20rpx;
}

.related-title-text {
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
}

.related-desc-text {
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
  color: var(--text-tertiary);
}

.tips-section-wrapper,
.beverages-card-section {
  margin: 32rpx 20rpx;
}

.tips-outer-card {
  border-radius: 34rpx;
  padding: 32rpx;
}

.bottom-fixed-bar {
  border-top: 0;
  background: rgba(255, 253, 252, 0.96);
  box-shadow: 0 -18rpx 52rpx rgba(122, 116, 107, 0.08);
  padding: 22rpx 20rpx calc(22rpx + env(safe-area-inset-bottom, 0));
}

.bottom-bar-inner {
  gap: 14rpx;
}

.bar-btn {
  height: 84rpx;
  border-radius: 28rpx;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}

.secondary-bar-btn {
  border: 2rpx solid rgba(122, 139, 111, 0.86) !important;
  background: rgba(255, 253, 252, 0.9);
}

.primary-bar-btn {
  background: var(--text-brand);
  box-shadow: 0 14rpx 34rpx rgba(122, 139, 111, 0.22);
}

/* Option 2 implementation: calm cookbook detail layout */
.page-container {
  background: #f5f1ea;
  padding-bottom: calc(172rpx + env(safe-area-inset-bottom, 0));
}

.hero-section {
  height: 430rpx;
  background: #f5f1ea;
}

.hero-image {
  transform: none;
}

.hero-gradient-overlay {
  height: 156rpx;
  background: linear-gradient(
    180deg,
    rgba(245, 241, 234, 0) 0%,
    rgba(245, 241, 234, 0.32) 56%,
    #f5f1ea 100%
  );
}

.floating-header {
  padding: calc(env(safe-area-inset-top, 0) + 26rpx) 28rpx 16rpx;
}

.nav-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: rgba(255, 253, 252, 0.92);
  box-shadow: 0 10rpx 28rpx rgba(122, 116, 107, 0.1);
}

.recipe-info-card {
  margin: 0 34rpx;
  padding: 34rpx 0 28rpx;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.recipe-name {
  font-size: var(--font-size-hero);
  line-height: var(--line-hero);
  font-weight: var(--font-semibold);
}

.recipe-tag-chips {
  margin-top: 2rpx;
}

.tag-chip {
  border-radius: 16rpx;
  background: rgba(122, 139, 111, 0.09);
}

.recipe-description {
  max-width: 620rpx;
  color: var(--text-tertiary);
}

.divider {
  margin: 26rpx 0 20rpx;
  background: rgba(183, 174, 161, 0.2);
}

.recipe-meta-row {
  padding: 18rpx 0 2rpx;
}

.meta-col {
  justify-content: flex-start;
}

.meta-icon {
  width: 30rpx;
  height: 30rpx;
}

.meta-col-value {
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.meta-col-label {
  margin-top: -2rpx;
}

.recipe-detail-switch {
  margin: 14rpx 24rpx 0;
  border-radius: 34rpx;
  background: rgba(255, 253, 252, 0.8);
  box-shadow: none;
}

.tab-toggle-container {
  height: 82rpx;
  padding: 0 22rpx;
  border-radius: 34rpx 34rpx 0 0;
  background: transparent;
  box-shadow: none;
}

.tab-active-plate {
  display: none;
}

.tab-item {
  height: 82rpx;
  border-radius: 0;
  align-items: flex-start;
}

.tab-item:nth-of-type(3) {
  align-items: flex-end;
}

.tab-text {
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
}

.tab-item.is-active .tab-text {
  color: var(--text-primary);
}

.active-indicator {
  width: 42rpx;
  height: 4rpx;
  margin-top: 8rpx;
}

.panel-container {
  padding: 26rpx 24rpx 30rpx;
  border-radius: 32rpx;
  background: rgba(255, 253, 252, 0.94);
}

.panel-header {
  margin-bottom: 22rpx;
}

.panel-title {
  font-size: var(--font-size-section-title);
  line-height: var(--line-section-title);
}

.panel-subtitle {
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.stepper-capsule {
  background: rgba(245, 241, 234, 0.88);
}

.stepper-btn {
  width: 48rpx;
  height: 48rpx;
}

.stepper-value {
  min-width: 78rpx;
}

.ingredients-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.ingredient-card {
  min-height: 104rpx;
  padding: 14rpx 46rpx 14rpx 14rpx;
  border-radius: 24rpx;
  display: grid;
  grid-template-columns: 58rpx minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 14rpx;
  align-items: center;
  text-align: left;
  background: rgba(245, 241, 234, 0.48);
  box-shadow: none;
}

.ingredient-img {
  grid-row: 1 / 3;
  width: 58rpx;
  height: 58rpx;
  margin: 0;
  border-radius: 50%;
}

.ingredient-name-label {
  align-self: end;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
}

.ingredient-amount-label {
  align-self: start;
  margin-top: -2rpx;
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
  color: var(--text-placeholder);
}

.card-basket-btn {
  top: 50%;
  right: 12rpx;
  width: 34rpx;
  height: 34rpx;
  transform: translateY(-50%);
  color: var(--text-brand);
}

.card-basket-btn.is-added {
  background: rgba(122, 139, 111, 0.14);
  color: var(--text-brand);
}

.basket-icon-svg {
  width: 18rpx;
  height: 18rpx;
}

.steps-timeline-list {
  gap: 18rpx;
}

.step-content-layout {
  background: rgba(245, 241, 234, 0.42);
  box-shadow: none;
}

.related-section {
  margin: 30rpx 24rpx;
  padding: 30rpx 28rpx;
  border-radius: 32rpx;
  background: rgba(255, 253, 252, 0.84);
  box-shadow: none;
}

.related-list {
  gap: 0;
}

.related-item-row {
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom-color: rgba(183, 174, 161, 0.14);
}

.related-thumb {
  width: 156rpx;
  height: 112rpx;
  border-radius: 18rpx;
}

.tips-section-wrapper,
.beverages-card-section {
  margin-left: 24rpx;
  margin-right: 24rpx;
}

.tips-outer-card,
.beverage-item-card {
  background: rgba(255, 253, 252, 0.84);
  box-shadow: none;
}

.bottom-fixed-bar {
  background: rgba(255, 253, 252, 0.94);
  box-shadow: 0 -12rpx 42rpx rgba(122, 116, 107, 0.07);
}

.bar-btn {
  height: 82rpx;
  border-radius: 26rpx;
}

.secondary-bar-btn {
  border: 0 !important;
  background: rgba(245, 241, 234, 0.86);
  color: var(--text-brand);
}

/* Option 1 implementation: image-led editorial detail layout */
.page-container {
  background:
    radial-gradient(circle at 14% 4%, rgba(255, 253, 252, 0.9), transparent 34%),
    linear-gradient(180deg, #f5f1ea 0%, #fffdfc 48%, #f5f1ea 100%);
  padding-bottom: calc(172rpx + env(safe-area-inset-bottom, 0));
}

.hero-section {
  height: 704rpx;
  background: #f5f1ea;
}

.hero-image {
  transform: scale(1.01);
}

.hero-gradient-overlay {
  height: 300rpx;
  background: linear-gradient(
    180deg,
    rgba(245, 241, 234, 0) 0%,
    rgba(245, 241, 234, 0.1) 32%,
    rgba(245, 241, 234, 0.82) 78%,
    #f5f1ea 100%
  );
}

.floating-header {
  padding: calc(env(safe-area-inset-top, 0) + 28rpx) 28rpx 18rpx;
}

.nav-btn {
  width: 76rpx;
  height: 76rpx;
  border-radius: 38rpx;
  background: rgba(255, 253, 252, 0.94);
  box-shadow: 0 14rpx 38rpx rgba(122, 116, 107, 0.12);
}

.recipe-info-card {
  position: relative;
  z-index: 5;
  margin: -118rpx 20rpx 0;
  padding: 42rpx 32rpx 34rpx;
  border-radius: 34rpx;
  background: rgba(255, 253, 252, 0.98);
  box-shadow: 0 24rpx 72rpx rgba(122, 116, 107, 0.1);
}

.recipe-name {
  font-size: var(--font-size-hero);
  line-height: var(--line-hero);
  font-weight: var(--font-semibold);
}

.recipe-description {
  display: block;
  max-width: none;
  font-size: var(--font-size-body);
  line-height: var(--line-body);
  color: var(--text-secondary);
}

.divider {
  margin: 28rpx 0;
}

.recipe-meta-row {
  padding: 0;
  align-items: stretch;
}

.meta-col {
  justify-content: center;
}

.recipe-detail-switch {
  margin: 34rpx 20rpx 0;
  border-radius: 34rpx;
  background: rgba(255, 253, 252, 0.98);
  box-shadow: 0 22rpx 68rpx rgba(122, 116, 107, 0.08);
}

.tab-toggle-container {
  height: 94rpx;
  padding: 8rpx 24rpx 0;
  border-radius: 34rpx 34rpx 0 0;
  background: rgba(235, 228, 217, 0.62);
}

.tab-item {
  height: 86rpx;
  align-items: center;
}

.tab-item:nth-of-type(3) {
  align-items: center;
}

.tab-text {
  font-size: var(--font-size-list-title);
  line-height: var(--line-list-title);
}

.active-indicator {
  width: 36rpx;
}

.panel-container {
  padding: 34rpx 28rpx 36rpx;
  border-radius: 0 0 34rpx 34rpx;
  background: #fffdfc;
}

.panel-header {
  margin-bottom: 30rpx;
}

.panel-title {
  font-size: var(--font-size-detail-title);
  line-height: var(--line-detail-title);
}

.panel-subtitle {
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
}

.stepper-btn {
  width: 54rpx;
  height: 54rpx;
}

.ingredients-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16rpx;
}

.ingredient-card {
  min-height: 198rpx;
  padding: 18rpx 10rpx 16rpx;
  border-radius: 24rpx;
  display: flex;
  grid-template-columns: none;
  grid-template-rows: none;
  column-gap: 0;
  align-items: center;
  text-align: center;
  background: rgba(245, 241, 234, 0.46);
  box-shadow: inset 0 0 0 1rpx rgba(183, 174, 161, 0.1);
}

.ingredient-img {
  width: 92rpx;
  height: 92rpx;
  margin: 0 0 12rpx;
  border-radius: 22rpx;
}

.ingredient-name-label {
  align-self: auto;
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
  font-weight: var(--font-medium);
}

.ingredient-amount-label {
  align-self: auto;
  margin-top: 2rpx;
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.card-basket-btn {
  top: 10rpx;
  right: 10rpx;
  width: 36rpx;
  height: 36rpx;
  transform: none;
  background: rgba(255, 253, 252, 0.9);
}

.related-section {
  margin: 34rpx 20rpx;
  padding: 30rpx;
  border-radius: 34rpx;
  background: rgba(255, 253, 252, 0.96);
  box-shadow: 0 18rpx 54rpx rgba(122, 116, 107, 0.06);
}

.tips-section-wrapper,
.beverages-card-section {
  margin-left: 20rpx;
  margin-right: 20rpx;
}

/* Selected reference implementation: image + continuous cookbook sheet */
.page-container {
  width: 100%;
  min-height: 100vh;
  background: #fffdfc;
  padding-bottom: calc(150rpx + env(safe-area-inset-bottom, 0));
  overflow-x: hidden;
}

.hero-section {
  width: 100vw;
  height: 568rpx;
  margin-left: calc(50% - 50vw);
  overflow: hidden;
  background: #f5f1ea;
}

.hero-image {
  width: 100%;
  height: 100%;
  display: block;
  transform: none;
}

.hero-gradient-overlay {
  display: none;
}

.floating-header {
  padding: calc(env(safe-area-inset-top, 0) + 28rpx) 44rpx 0;
}

.nav-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(255, 253, 252, 0.86);
  color: #2f2f2f;
  border: 0;
  box-shadow: 0 10rpx 28rpx rgba(80, 67, 51, 0.12);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.header-right-btns {
  gap: 18rpx;
}

.icon-svg {
  width: 34rpx;
  height: 34rpx;
  stroke-width: 1.9;
}

.remote-banner {
  margin: 24rpx 44rpx;
}

.recipe-info-card {
  position: relative;
  z-index: 4;
  margin: -44rpx 0 0;
  padding: 64rpx 44rpx 0;
  border: 0;
  border-radius: 38rpx 38rpx 0 0;
  background: #fffdfc;
  box-shadow: none;
  overflow: visible;
}

.recipe-info-card::before {
  content: "";
  position: absolute;
  top: -38rpx;
  left: 0;
  width: 100%;
  height: 78rpx;
  border-radius: 54% 46% 0 0 / 78% 70% 0 0;
  background: #fffdfc;
  z-index: -1;
}

.recipe-info-card::after {
  content: "";
  position: absolute;
  top: -34rpx;
  right: 0;
  width: 112rpx;
  height: 64rpx;
  border-radius: 0 0 0 54rpx;
  background: transparent;
  box-shadow: -38rpx 26rpx 0 #fffdfc;
  z-index: -1;
}

.recipe-title-section {
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.recipe-name {
  display: block;
  font-size: 54rpx;
  font-weight: var(--font-semibold);
  line-height: 70rpx;
  letter-spacing: 0;
  color: var(--text-primary);
}

.recipe-tag-chips {
  gap: 16rpx;
  margin-top: 2rpx;
}

.tag-chip {
  padding: 7rpx 24rpx;
  border-radius: 22rpx;
  background: rgba(122, 139, 111, 0.1);
  color: var(--text-brand);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
}

.tag-chip.is-warm {
  background: rgba(217, 138, 74, 0.12);
  color: var(--text-warm);
}

.recipe-description {
  display: block;
  font-size: var(--font-size-body);
  font-weight: var(--font-regular);
  line-height: var(--line-body);
  color: var(--text-tertiary);
}

.divider {
  height: 1rpx;
  margin: 32rpx 0 26rpx;
  background: rgba(183, 174, 161, 0.28);
}

.recipe-meta-row {
  display: flex;
  align-items: center;
  padding: 0 0 30rpx;
}

.meta-col {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
}

.meta-icon {
  width: 38rpx;
  height: 38rpx;
  color: var(--text-brand);
  stroke-width: 1.8;
}

.meta-col-value {
  display: block;
  font-size: var(--font-size-body);
  font-weight: var(--font-medium);
  line-height: var(--line-body);
  color: var(--text-primary);
}

.meta-col-label {
  display: block;
  margin-top: -2rpx;
  font-size: var(--font-size-caption);
  font-weight: var(--font-regular);
  line-height: var(--line-caption);
  color: var(--text-placeholder);
}

.meta-divider {
  width: 1rpx;
  height: 58rpx;
  margin: 0 20rpx;
  background: rgba(183, 174, 161, 0.24);
}

.recipe-detail-switch {
  margin: 0;
  padding: 0 44rpx 34rpx;
  border: 0;
  border-radius: 0;
  background: #fffdfc;
  box-shadow: none;
  overflow: visible;
}

.tab-toggle-container {
  height: 96rpx;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  border-radius: 0;
  background: #fffdfc;
  box-shadow:
    inset 0 1rpx 0 rgba(183, 174, 161, 0.24),
    inset 0 -1rpx 0 rgba(183, 174, 161, 0.24);
}

.tab-active-plate {
  display: none;
}

.tab-item {
  height: 96rpx;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
}

.tab-item:nth-of-type(3) {
  align-items: center;
}

.tab-text {
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
  line-height: var(--line-list-title);
  color: var(--text-placeholder);
}

.tab-item.is-active .tab-text {
  color: var(--text-brand);
  font-weight: var(--font-semibold);
}

.active-indicator {
  width: 38rpx;
  height: 5rpx;
  margin-top: 9rpx;
  border-radius: 5rpx;
  background: var(--text-brand);
}

.panel-container {
  min-height: 0;
  padding: 34rpx 0 0;
  border-radius: 0;
  background: #fffdfc;
  box-shadow: none;
}

.ingredients-panel,
.steps-panel {
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.usage-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 26rpx;
}

.usage-label {
  font-size: var(--font-size-body);
  font-weight: var(--font-regular);
  line-height: var(--line-body);
  color: var(--text-secondary);
}

.stepper-capsule {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 6rpx;
  border: 0;
  border-radius: 999rpx;
  background: rgba(245, 241, 234, 0.82);
  box-shadow: inset 0 0 0 1rpx rgba(183, 174, 161, 0.16);
}

.stepper-btn {
  width: 54rpx;
  height: 54rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fffdfc;
  color: var(--text-brand);
  box-shadow: 0 4rpx 16rpx rgba(122, 116, 107, 0.05);
}

.stepper-value {
  min-width: 76rpx;
  padding: 0 2rpx;
  text-align: center;
  font-size: var(--font-size-body);
  font-weight: var(--font-medium);
  line-height: var(--line-body);
  color: var(--text-primary);
}

.ingredients-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18rpx;
}

.ingredient-card {
  position: relative;
  min-height: 214rpx;
  padding: 18rpx 10rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 0;
  border-radius: 18rpx;
  background: rgba(245, 241, 234, 0.44);
  box-shadow: none;
}

.ingredient-img {
  width: 112rpx;
  height: 96rpx;
  margin: 0 0 12rpx;
  border-radius: 16rpx;
  background: rgba(255, 253, 252, 0.85);
}

.ingredient-name-label {
  display: block;
  max-width: 100%;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
  color: var(--text-primary);
}

.ingredient-amount-label {
  display: block;
  margin-top: 2rpx;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-regular);
  line-height: var(--line-body-sm);
  color: var(--text-tertiary);
}

.card-basket-btn {
  display: none;
}

.toggle-fold-btn {
  margin: 28rpx auto 0;
}

.steps-timeline-list {
  gap: 24rpx;
}

.related-section,
.tips-section-wrapper,
.beverages-card-section {
  margin-left: 44rpx;
  margin-right: 44rpx;
}

.bottom-fixed-bar {
  padding: 22rpx 44rpx calc(22rpx + env(safe-area-inset-bottom, 0));
  border-top: 1rpx solid rgba(183, 174, 161, 0.16);
  background: rgba(255, 253, 252, 0.96);
  box-shadow: 0 -10rpx 36rpx rgba(122, 116, 107, 0.06);
}

.bottom-bar-inner {
  gap: 32rpx;
}

.bar-btn {
  height: 84rpx;
  border-radius: 42rpx;
  font-size: var(--font-size-body);
  font-weight: var(--font-medium);
  line-height: var(--line-body);
}

.secondary-bar-btn {
  border: 2rpx solid var(--text-brand) !important;
  background: rgba(255, 253, 252, 0.92);
  color: var(--text-brand);
}

.primary-bar-btn {
  border: 0 !important;
  background: var(--text-brand);
  color: #fffdfc;
  box-shadow: none;
}

/* Final full-page reference pass: apply the selected image language to every section. */
.page-container {
  --detail-cream: #f5f1ea;
  --detail-paper: #fffdfc;
  --detail-sage: #7a8b6f;
  --detail-ink: #2f2f2f;
  --detail-muted: #b7aea1;
  --detail-line: rgba(183, 174, 161, 0.26);
  background: var(--detail-paper);
  color: var(--detail-ink);
  padding-bottom: calc(154rpx + env(safe-area-inset-bottom, 0));
}

.hero-section {
  height: 568rpx;
}

.hero-image {
  object-fit: cover;
}

.floating-header {
  padding: calc(env(safe-area-inset-top, 0) + 28rpx) 44rpx 0;
}

.nav-btn {
  width: 72rpx;
  height: 72rpx;
  background: rgba(255, 253, 252, 0.86);
  color: var(--detail-ink);
  box-shadow: 0 10rpx 30rpx rgba(71, 56, 38, 0.12);
}

.recipe-info-card {
  margin: -46rpx 0 0;
  padding: 66rpx 44rpx 0;
  border-radius: 40rpx 40rpx 0 0;
  background: var(--detail-paper);
  box-shadow: none;
}

.recipe-info-card::before {
  top: -38rpx;
  height: 82rpx;
  border-radius: 54% 46% 0 0 / 84% 72% 0 0;
}

.recipe-name {
  font-size: 54rpx;
  font-weight: var(--font-semibold);
  line-height: 70rpx;
}

.recipe-tag-chips {
  gap: 16rpx;
}

.tag-chip {
  padding: 7rpx 24rpx;
  border-radius: 22rpx;
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.recipe-description {
  color: var(--text-tertiary);
}

.divider {
  margin: 32rpx 0 26rpx;
  background: var(--detail-line);
}

.recipe-meta-row {
  padding-bottom: 30rpx;
}

.meta-divider {
  background: var(--detail-line);
}

.recipe-detail-switch {
  margin: 0;
  padding: 0 44rpx 34rpx;
  border-radius: 0;
  background: var(--detail-paper);
}

.tab-toggle-container {
  height: 96rpx;
  padding: 0;
  background: var(--detail-paper);
  box-shadow:
    inset 0 1rpx 0 var(--detail-line),
    inset 0 -1rpx 0 var(--detail-line);
}

.tab-item {
  height: 96rpx;
}

.tab-item.is-active .tab-text {
  color: var(--detail-sage);
}

.active-indicator {
  width: 38rpx;
  height: 5rpx;
  background: var(--detail-sage);
}

.panel-container {
  padding: 34rpx 0 0;
}

.usage-row {
  margin-bottom: 26rpx;
}

.usage-label {
  font-size: var(--font-size-body);
  line-height: var(--line-body);
  color: var(--text-secondary);
}

.stepper-capsule {
  background: rgba(245, 241, 234, 0.82);
  box-shadow: inset 0 0 0 1rpx rgba(183, 174, 161, 0.16);
}

.ingredients-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18rpx;
}

.ingredient-card {
  min-height: 214rpx;
  border-radius: 18rpx;
  background: rgba(245, 241, 234, 0.44);
}

.ingredient-img {
  width: 112rpx;
  height: 96rpx;
  border-radius: 16rpx;
}

.steps-panel .panel-header {
  margin-bottom: 28rpx;
}

.steps-panel .panel-title {
  font-size: var(--font-size-section-title);
  line-height: var(--line-section-title);
}

.steps-timeline-list {
  gap: 22rpx;
}

.timeline-step-item {
  gap: 18rpx;
}

.step-num-circle {
  width: 46rpx;
  height: 46rpx;
  border-radius: 50%;
  background: rgba(122, 139, 111, 0.12);
  color: var(--detail-sage);
  font-size: var(--font-size-caption);
  box-shadow: inset 0 0 0 1rpx rgba(122, 139, 111, 0.2);
}

.timeline-line-dashed {
  top: 52rpx;
  bottom: -28rpx;
  border-left: 2rpx solid rgba(122, 139, 111, 0.18);
}

.step-content-layout {
  padding: 18rpx;
  border-radius: 20rpx;
  background: rgba(245, 241, 234, 0.44);
}

.step-img-left {
  width: 158rpx;
  height: 122rpx;
  border-radius: 16rpx;
}

.step-desc-text {
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
  color: var(--detail-ink);
}

.step-duration-capsule {
  background: rgba(122, 139, 111, 0.1);
  color: var(--detail-sage);
}

.related-section,
.tips-section-wrapper,
.beverages-card-section {
  margin: 0;
  padding: 0 44rpx 34rpx;
  background: var(--detail-paper);
}

.related-section {
  border-radius: 0;
  box-shadow: none;
}

.related-header,
.section-header-box {
  padding-top: 34rpx;
  margin-bottom: 22rpx;
  border-top: 1rpx solid var(--detail-line);
}

.section-title,
.tips-title-text {
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
  color: var(--detail-ink);
}

.more-link-btn {
  color: var(--detail-sage);
}

.related-list {
  border-radius: 22rpx;
  background: rgba(245, 241, 234, 0.3);
  overflow: hidden;
}

.related-item-row {
  padding: 18rpx;
  gap: 18rpx;
  border-bottom: 1rpx solid rgba(183, 174, 161, 0.16);
}

.related-item-row:last-child {
  border-bottom: 0;
}

.related-thumb {
  width: 150rpx;
  height: 108rpx;
  border-radius: 16rpx;
}

.related-title-text {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
}

.related-desc-text,
.related-meta-label {
  color: var(--text-tertiary);
}

.related-diff-badge {
  background: rgba(122, 139, 111, 0.1);
  color: var(--detail-sage);
}

.tips-outer-card {
  padding: 30rpx 0 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.tips-inner-content {
  padding: 28rpx;
  border-radius: 24rpx;
  background: rgba(245, 241, 234, 0.34);
}

.tips-title-text {
  margin-bottom: 18rpx;
}

.tip-bullet-dot {
  width: 8rpx;
  height: 8rpx;
  margin-top: 12rpx;
  background: var(--detail-sage);
}

.tip-bullet-text {
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
  color: var(--text-secondary);
}

.cooking-pot-graphic {
  display: none;
}

.beverage-cards-list {
  gap: 16rpx;
}

.beverage-item-card {
  padding: 18rpx;
  border: 0;
  border-radius: 22rpx;
  background: rgba(245, 241, 234, 0.34);
  box-shadow: none;
}

.beverage-thumb-img {
  width: 112rpx;
  height: 112rpx;
  border-radius: 16rpx;
}

.beverage-title-label {
  color: var(--detail-ink);
}

.beverage-meta-label,
.beverage-reason-label {
  color: var(--text-tertiary);
}

.beverage-guide-badge {
  color: var(--detail-sage);
}

.empty-steps-block,
.empty-related-block {
  padding: 54rpx 0;
  border-radius: 22rpx;
  background: rgba(245, 241, 234, 0.34);
}

.bottom-fixed-bar {
  padding: 22rpx 44rpx calc(22rpx + env(safe-area-inset-bottom, 0));
  border-top: 1rpx solid rgba(183, 174, 161, 0.16);
  background: rgba(255, 253, 252, 0.96);
  box-shadow: 0 -10rpx 36rpx rgba(122, 116, 107, 0.06);
}

.bottom-bar-inner {
  gap: 32rpx;
}

.bar-btn {
  height: 84rpx;
  border-radius: 42rpx;
  font-size: var(--font-size-body);
  font-weight: var(--font-medium);
}

.secondary-bar-btn {
  border: 2rpx solid var(--detail-sage) !important;
  background: rgba(255, 253, 252, 0.92);
  color: var(--detail-sage);
}

.primary-bar-btn {
  background: var(--detail-sage);
  color: var(--detail-paper);
  box-shadow: none;
}

.guide-modal-mask {
  background: rgba(47, 47, 47, 0.28);
}

.guide-modal-panel {
  max-width: none;
  padding: 38rpx 44rpx calc(36rpx + env(safe-area-inset-bottom, 0));
  border-radius: 38rpx 38rpx 0 0;
  background: var(--detail-paper);
  box-shadow: 0 -18rpx 52rpx rgba(71, 56, 38, 0.12);
}

.guide-modal-title,
.mix-steps-header-title {
  color: var(--detail-ink);
}

.guide-modal-img {
  border-radius: 22rpx;
}

.mix-info-box,
.mix-tips-callout {
  border: 0;
  border-radius: 22rpx;
  background: rgba(245, 241, 234, 0.42);
}

.mix-step-index-dot {
  background: rgba(122, 139, 111, 0.12);
  color: var(--detail-sage);
}

.guide-modal-ok-btn {
  border-radius: 42rpx;
  background: var(--detail-sage);
}
</style>
