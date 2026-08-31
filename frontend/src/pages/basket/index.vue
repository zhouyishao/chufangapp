<template>
  <view class="app-page basket-page">
    <view class="basket-shell">
      <view class="basket-heading">
        <view class="basket-heading__top">
          <button
            class="family-selector"
            :aria-expanded="isFamilySelectorVisible"
            aria-label="切换家庭"
            @tap="toggleFamilySelector"
          >
            <text class="family-selector__name">{{ basketScopeName }}</text>
            <app-icon :class="['family-selector__arrow', { 'is-open': isFamilySelectorVisible }]" name="chevron-down" size="14px" />
          </button>
          <button class="scan-button" aria-label="扫一扫加入家庭" @tap="goToScan">
            <app-icon name="scan" size="24px" />
          </button>
        </view>
        <text class="basket-summary">{{ basketSummaryText }}</text>
      </view>

      <view v-if="isFamilySelectorVisible" class="family-mask" @tap="closeFamilySelector">
        <view class="family-sheet glass-card" @tap.stop>
          <button
            v-for="family in families"
            :key="family.id"
            :class="['family-option', { 'is-active': family.id === activeFamilyId }]"
            @tap="selectFamilyScope(family.id)"
          >
            <view class="family-option__avatar">{{ family.name.slice(0, 1) }}</view>
            <view class="family-option__copy">
              <text class="family-option__name">{{ family.name }}</text>
              <text class="family-option__meta">{{ family.pendingItems }} 项待采购</text>
            </view>
            <app-icon v-if="family.id === activeFamilyId" class="family-option__check" name="check" size="20rpx" />
          </button>

          <view class="family-sheet__divider" />

          <button class="family-manage-row" @tap="goToFamilyManage">
            <text class="family-manage-row__name">家庭管理</text>
            <app-icon class="family-manage-row__icon" name="arrow-right" size="22rpx" />
          </button>
        </view>
      </view>

      <view class="mode-switch" aria-label="菜篮视图">
        <button
          :class="['mode-button', { 'is-active': viewMode === 'merged' }]"
          :aria-selected="viewMode === 'merged'"
          @tap="setViewMode('merged')"
        >
          食材
        </button>
        <button
          :class="['mode-button', { 'is-active': viewMode === 'recipe' }]"
          :aria-selected="viewMode === 'recipe'"
          @tap="setViewMode('recipe')"
        >
          菜谱
        </button>
      </view>

      <button
        v-if="activeFamilyId"
        class="basket-preferences"
        :aria-expanded="isPreferencePanelVisible"
        @tap="openPreferencePanel"
      >
        <text class="basket-preferences__title">家庭口味</text>
        <view class="basket-preferences__tags">
          <text class="basket-preference-tag">忌口 {{ activeFamily.preferences?.avoidItems.length ?? 0 }}</text>
          <text class="basket-preference-tag">喜欢 {{ activeFamily.preferences?.preferences.length ?? 0 }}</text>
          <text class="basket-preference-tag is-warning">过敏 {{ activeFamily.preferences?.allergies.length ?? 0 }}</text>
        </view>
      </button>

      <view v-if="isLoading" class="basket-state" aria-live="polite">
        <view class="basket-state__spinner" />
        <text class="basket-state__title">正在同步家庭菜篮</text>
        <text class="basket-state__desc">家人刚刚添加的内容也会一起出现。</text>
      </view>

      <view v-else-if="loadError" class="basket-state basket-state--error" aria-live="assertive">
        <text class="basket-state__title">菜篮暂时没有加载出来</text>
        <text class="basket-state__desc">{{ loadError }}</text>
        <button class="basket-state__retry" @tap="loadBasketPage">重新加载</button>
      </view>

      <view v-else class="basket-board">
        <view v-if="items.length" class="purchase-panel">
          <view class="board-head">
            <view class="board-copy">
              <text class="board-title">本次采购</text>
              <text class="board-desc">{{ boardDescription }}</text>
            </view>
            <text class="board-progress">已买 {{ checkedCount }}/{{ items.length }}</text>
          </view>

          <view class="content">
          <view v-if="viewMode === 'recipe'" class="recipe-list">
            <view v-if="recipeGroups.length">
              <view v-for="group in recipeGroups" :key="group.recipeId" class="recipe-card">
                <view
                  class="recipe-swipe-row"
                  @touchstart="handleTouchStart($event, getRecipeKey(group.recipeId))"
                  @touchend="handleTouchEnd($event, getRecipeKey(group.recipeId))"
                >
                  <view
                    :class="['recipe-header', { 'is-open': openedItemId === getRecipeKey(group.recipeId) }]"
                    @tap="toggleRecipeExpanded(group.recipeId)"
                  >
                    <view class="recipe-cover">
                      <image v-if="getRecipeCover(group)" class="recipe-cover__image" :src="getRecipeCover(group)" mode="aspectFill" />
                      <text v-else class="recipe-cover__fallback">{{ group.recipeName.slice(0, 1) }}</text>
                    </view>
                    <view class="recipe-copy">
                      <text class="recipe-title">{{ group.recipeName }}</text>
                      <text class="recipe-subtitle">{{ group.checkedCount }}/{{ group.items.length }} 已采购</text>
                    </view>
                    <app-icon :class="['recipe-arrow', { 'is-expanded': isRecipeExpanded(group.recipeId) }]" name="chevron-down" size="24rpx" />
                  </view>
                  <view class="swipe-remove recipe-remove" @tap="removeRecipeGroup(group.recipeId)">删除</view>
                </view>

                <view v-if="isRecipeExpanded(group.recipeId)" class="recipe-ingredient-list">
                  <view
                    v-for="item in group.items"
                    :key="item.id"
                    class="swipe-row"
                    @touchstart="handleTouchStart($event, item.id)"
                    @touchend="handleTouchEnd($event, item.id)"
                  >
                    <view :class="['ingredient-row', { 'is-open': openedItemId === item.id, 'is-checked': item.checked }]">
                      <view class="check-hit" @tap="toggleItem(item.id)">
                        <app-icon :class="['check', { 'is-checked': item.checked }]" :name="item.checked ? 'check' : 'circle'" size="18rpx" />
                      </view>
                      <view class="ingredient-thumb">
                        <image v-if="getItemImage(item)" class="ingredient-thumb__image" :src="getItemImage(item)" mode="aspectFill" />
                        <text v-else class="ingredient-thumb__fallback">{{ item.name.slice(0, 1) }}</text>
                      </view>
                      <view class="ingredient-copy">
                        <button :class="['ingredient-name', { 'is-checked': item.checked }]" @tap.stop="openIngredientGuide(item)">{{ item.name }}</button>
                        <text class="ingredient-source">{{ getItemSourceText(item) }}</text>
                      </view>
                      <view class="ingredient-side" @tap="toggleItem(item.id)">
                        <text :class="['ingredient-amount', { 'is-checked': item.checked }]">{{ getBasketDisplayText(item) }}</text>
                        <text v-if="formatPriceText(item)" class="ingredient-price">{{ formatPriceText(item) }}</text>
                      </view>
                    </view>
                    <view class="swipe-remove" @tap="removeItem(item.id)">删除</view>
                  </view>
                </view>
              </view>
            </view>

            <view v-else class="recipe-empty">
              <text class="recipe-empty__title">当前都是单独食材</text>
              <text class="recipe-empty__desc">切回食材模式查看合并后的采购清单。</text>
            </view>
          </view>

          <view v-else class="merged-card">
            <view
              v-for="item in mergedItems"
              :key="item.name"
              class="swipe-row"
              @touchstart="handleTouchStart($event, getMergedKey(item.name))"
              @touchend="handleTouchEnd($event, getMergedKey(item.name))"
            >
              <view :class="['ingredient-row', { 'is-open': openedItemId === getMergedKey(item.name), 'is-checked': item.checked }]">
                <view class="check-hit" @tap="toggleMergedItem(item.itemIds)">
                  <app-icon :class="['check', { 'is-checked': item.checked }]" :name="item.checked ? 'check' : 'circle'" size="18rpx" />
                </view>
                <view class="ingredient-thumb">
                  <image v-if="item.imageUrl" class="ingredient-thumb__image" :src="item.imageUrl" mode="aspectFill" />
                  <text v-else class="ingredient-thumb__fallback">{{ item.name.slice(0, 1) }}</text>
                </view>
                <view class="ingredient-copy">
                  <button :class="['ingredient-name', { 'is-checked': item.checked }]" @tap.stop="openMergedIngredientGuide(item)">{{ item.name }}</button>
                  <text class="ingredient-source">{{ item.sourceText }}</text>
                </view>
                <view class="ingredient-side" @tap="toggleMergedItem(item.itemIds)">
                  <text :class="['ingredient-amount', { 'is-checked': item.checked }]">{{ item.amountText }}</text>
                  <text v-if="item.priceText" class="ingredient-price">{{ item.priceText }}</text>
                </view>
              </view>
              <view class="swipe-remove" @tap="removeMergedItem(item.itemIds)">删除</view>
            </view>
          </view>
        </view>
        </view>

        <view v-else class="empty-card">
          <view class="empty-illustration">
            <app-icon name="basket" size="82rpx" />
          </view>
          <text class="empty-kicker">{{ families.length ? '清单已整理干净' : '家庭共享菜篮' }}</text>
          <text class="empty-title">{{ families.length ? '菜篮子空了' : '还没有加入家庭' }}</text>
          <text class="empty-desc">
            {{ families.length
              ? '从菜谱详情页加入食材后，会自动按菜谱和合并食材整理成本次采购清单。'
              : '创建家庭或扫码加入后，家人就能共同查看采购清单。' }}
          </text>
          <view class="empty-actions">
            <button v-if="families.length" class="empty-button is-primary" @click="goHome">去首页看看</button>
            <button v-if="families.length" class="empty-button" @click="goToRecipes">浏览菜谱</button>
            <button v-else class="empty-button is-primary" @click="goToFamilyManage">创建或加入家庭</button>
          </view>
        </view>

        <button
          v-if="items.length"
          class="basket-complete-action"
          :disabled="!checkedCount || isMutating"
          :aria-busy="isMutating"
          @tap="completePurchase"
        >
          <text>{{ isMutating ? '正在保存' : checkedCount ? `完成本次采购 · ${checkedCount} 项` : '勾选已购食材' }}</text>
          <app-icon name="arrow-right" size="22rpx" />
        </button>
      </view>
    </view>

    <home-tab-bar :tabs="tabs" />

    <view v-if="activeGuideItem" class="guide-mask" @tap="closeIngredientGuide">
      <view class="guide-panel" @tap.stop>
        <view class="guide-handle" />
        <view class="guide-head">
          <text class="guide-title">{{ activeGuideItem.name }}怎么挑</text>
          <button class="guide-close" @tap="closeIngredientGuide">
            <app-icon name="close" size="28rpx" />
          </button>
        </view>
        <view class="guide-body">
          <view class="guide-image-wrap">
            <image v-if="guideImage" class="guide-image" :src="guideImage" mode="aspectFill" />
            <text v-else class="guide-image__fallback">{{ activeGuideItem.name.slice(0, 1) }}</text>
          </view>
          <view class="guide-content">
            <text class="guide-eyebrow">挑选要点</text>
            <view class="guide-tips">
              <text v-for="tip in guideSelectionTips.slice(0, 3)" :key="tip" class="guide-tip">{{ tip }}</text>
              <text v-if="!guideSelectionTips.length" class="guide-tip is-empty">暂无挑选要点，可进入详情了解更多。</text>
            </view>
            <text v-if="guidePriceText" class="guide-price">{{ guidePriceText }}</text>
          </view>
        </view>
        <view class="guide-actions">
          <button
            v-if="activeGuideItem.ingredientId"
            class="guide-detail-link"
            @tap="goToGuideIngredientDetail"
          >查看详情</button>
          <button class="guide-primary" @tap="closeIngredientGuide">我知道了</button>
        </view>
      </view>
    </view>

    <view v-if="isPreferencePanelVisible" class="preference-mask" @tap="closePreferencePanel">
      <view class="preference-panel" @tap.stop>
        <view class="guide-handle" />
        <view class="preference-panel__head">
          <view>
            <text class="preference-panel__title">谁有这些口味</text>
            <text class="preference-panel__members">已共享：{{ preferenceMemberNames }}</text>
          </view>
          <button class="guide-close" aria-label="关闭家庭口味" @tap="closePreferencePanel">
            <app-icon name="close" size="28rpx" />
          </button>
        </view>
        <view class="preference-tabs" aria-label="口味类型">
          <button
            v-for="tab in preferenceTabs"
            :key="tab.id"
            :class="['preference-tab', { 'is-active': activePreferenceType === tab.id }]"
            :aria-selected="activePreferenceType === tab.id"
            @tap="setPreferenceType(tab.id)"
          >
            {{ tab.label }} {{ tab.count }}
          </button>
        </view>
        <view class="preference-record">
          <text class="preference-record__label">家庭记录</text>
          <view v-if="activePreferenceItems.length" class="preference-record__tags">
            <text
              v-for="item in activePreferenceItems"
              :key="item"
              :class="['preference-record__tag', { 'is-warning': activePreferenceType === 'allergy' }]"
            >
              {{ item }}
            </text>
          </view>
          <text v-else class="preference-record__empty">暂时没有记录</text>
        </view>
        <button class="preference-primary" @tap="closePreferencePanel">完成</button>
      </view>
    </view>

    <view v-if="isPricePanelVisible" class="sheet-mask" @tap="closePricePanel">
      <view class="price-panel" @tap.stop>
        <view class="price-panel__head">
          <view>
            <text class="price-panel__title">记录本次价格</text>
            <text class="price-panel__desc">采购完成后记录价格，之后可在食材详情查看走势。</text>
          </view>
          <button class="price-panel__close" aria-label="关闭价格记录" @tap="closePricePanel">×</button>
        </view>
        <view class="price-list">
          <view v-for="item in priceInputs" :key="item.id" class="price-row">
            <text class="price-row__name">{{ item.name }}</text>
            <view class="price-row__field">
              <text class="price-row__prefix">¥</text>
              <input
                v-model="item.priceText"
                class="price-input"
                type="digit"
                placeholder="价格"
              />
              <text class="price-row__unit">/{{ item.unit }}</text>
            </view>
          </view>
        </view>
        <button class="save-price-button" @tap="savePurchasePrices">保存价格并完成</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import { loadBasketItems, removeBasketItem, updateBasketItemChecked } from '../../services/basket';
import type { BasketItem } from '../../services/basket';
import { loadActiveFamilyId, loadFamilies, saveActiveFamilyId } from '../../services/family';
import type { FamilyProfile } from '../../types/family';
import { addPriceRecords } from '../../services/price';
import { getIngredient } from '../../services/public-api';
import type { ApiIngredientDetail } from '../../services/public-api';

type BasketViewMode = 'recipe' | 'merged';
type BasketScopeId = string | null;
type PreferenceType = 'avoid' | 'like' | 'allergy';

interface BasketRecipeGroup {
  recipeId: string;
  recipeName: string;
  items: BasketItem[];
  checkedCount: number;
}

interface MergedBasketItem {
  name: string;
  amountText: string;
  checked: boolean;
  itemIds: string[];
  imageUrl?: string | null;
  ingredientId?: string | number;
  priceText?: string;
  sourceText: string;
}

interface PriceInputItem {
  id: string;
  ingredientId: number;
  name: string;
  unit: string;
  priceText: string;
}

const tabs = [
  { id: 'home', label: '首页', active: false },
  { id: 'categories', label: '分类', active: false },
  { id: 'basket', label: '菜篮', active: true },
  { id: 'mine', label: '我的', active: false }
];

const items = ref<BasketItem[]>([]);
const families = ref<FamilyProfile[]>([]);
const activeFamilyId = ref<BasketScopeId>(null);

const viewMode = ref<BasketViewMode>('merged');
const openedItemId = ref('');
const touchStartX = ref(0);
const isPricePanelVisible = ref(false);
const isFamilySelectorVisible = ref(false);
const isPreferencePanelVisible = ref(false);
const activePreferenceType = ref<PreferenceType>('avoid');
const requestedFamilyId = ref('');
const expandedRecipeIds = ref<string[]>([]);
const priceInputs = ref<PriceInputItem[]>([]);
const activeGuideItem = ref<BasketItem | null>(null);
const activeGuideDetail = ref<ApiIngredientDetail | null>(null);
const isLoading = ref(true);
const isMutating = ref(false);
const loadError = ref('');

const pendingCount = computed(() => items.value.filter((item) => !item.checked).length);
const checkedCount = computed(() => items.value.filter((item) => item.checked).length);
const estimatedTotal = computed(() => {
  const prices = new Map<string, number>();
  items.value.forEach((item) => {
    if (item.checked || typeof item.currentPrice !== 'number' || !Number.isFinite(item.currentPrice) || item.currentPrice <= 0) {
      return;
    }
    if (!prices.has(item.name)) prices.set(item.name, item.currentPrice);
  });
  return Array.from(prices.values()).reduce((total, price) => total + price, 0);
});
const basketSummaryText = computed(() => {
  const base = `待采购 ${pendingCount.value} 项`;
  if (!estimatedTotal.value) return `${base} · 参考价待补充`;
  const total = Number.isInteger(estimatedTotal.value) ? String(estimatedTotal.value) : estimatedTotal.value.toFixed(1);
  return `${base} · 参考约 ¥${total}`;
});
const boardDescription = computed(() => {
  if (!items.value.length) {
    return '清单为空，去首页或食材页添加想买的食材';
  }

  if (viewMode.value === 'merged') {
    return '合并相同食材，单独添加的食材也在这里';
  }

  return '按菜谱分组展示，展开查看每道菜所需食材';
});
const activeFamily = computed<FamilyProfile>(() => {
  if (activeFamilyId.value === null) {
    return {
      id: '',
      name: '选择家庭',
      avatar: '',
      avatarFileId: null,
      description: '',
      commonRecipes: 0,
      pendingItems: 0,
      members: []
    };
  }

  return families.value.find((family) => family.id === activeFamilyId.value) ?? {
    id: '',
    name: '选择家庭',
    avatar: '',
    avatarFileId: null,
    description: '',
    commonRecipes: 0,
    pendingItems: 0,
    members: []
  };
});
const basketScopeName = computed(() => activeFamily.value.name);
const preferenceTabs = computed(() => [
  { id: 'avoid' as const, label: '忌口', count: activeFamily.value.preferences?.avoidItems.length ?? 0 },
  { id: 'like' as const, label: '喜欢', count: activeFamily.value.preferences?.preferences.length ?? 0 },
  { id: 'allergy' as const, label: '过敏', count: activeFamily.value.preferences?.allergies.length ?? 0 }
]);
const activePreferenceItems = computed(() => {
  if (activePreferenceType.value === 'avoid') return activeFamily.value.preferences?.avoidItems ?? [];
  if (activePreferenceType.value === 'like') return activeFamily.value.preferences?.preferences ?? [];
  return activeFamily.value.preferences?.allergies ?? [];
});
const preferenceMemberNames = computed(() => {
  const names = activeFamily.value.members.map((member) => member.name).filter(Boolean);
  return names.length ? names.join('、') : basketScopeName.value;
});
let basketLoadRequestId = 0;

const withBasketDeadline = <T>(operation: Promise<T>, timeoutMs = 12000) => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('同步超时，请检查网络后重试'));
    }, timeoutMs);

    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
};

const getBasketLoadErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message.trim() : '';
  if (!message || /internal server error|network error|request:fail/i.test(message)) {
    return '服务暂时不可用，请稍后重试';
  }
  return message;
};

const recipeGroups = computed<BasketRecipeGroup[]>(() => {
  const groupMap = new Map<string, BasketRecipeGroup>();

  items.value.forEach((item) => {
    if (item.recipeId === 'ingredient') {
      return;
    }

    const existingGroup = groupMap.get(item.recipeId);
    if (existingGroup) {
      existingGroup.items.push(item);
      existingGroup.checkedCount = existingGroup.items.filter((groupItem) => groupItem.checked).length;
      return;
    }

    groupMap.set(item.recipeId, {
      recipeId: item.recipeId,
      recipeName: item.recipeName,
      items: [item],
      checkedCount: item.checked ? 1 : 0
    });
  });

  return Array.from(groupMap.values());
});

const mergedItems = computed<MergedBasketItem[]>(() => {
  const mergedMap = new Map<string, BasketItem[]>();

  items.value.forEach((item) => {
    const sameNameItems = mergedMap.get(item.name) ?? [];
    mergedMap.set(item.name, [...sameNameItems, item]);
  });

  return Array.from(mergedMap.entries()).map(([name, sameNameItems]) => {
    const primaryItem = sameNameItems.find((item) => item.imageUrl || item.ingredientId) ?? sameNameItems[0];
    return {
      name,
      amountText: mergeAmountText(sameNameItems.map((item) => getBasketDisplayText(item))),
      checked: sameNameItems.every((item) => item.checked),
      itemIds: sameNameItems.map((item) => item.id),
      imageUrl: primaryItem?.imageUrl ?? null,
      ingredientId: primaryItem?.ingredientId,
      priceText: primaryItem ? formatPriceText(primaryItem) : '',
      sourceText: getMergedSourceText(sameNameItems)
    };
  });
});

const mergeAmountText = (amounts: string[]) => {
  const uniqueAmounts = Array.from(new Set(amounts));
  if (uniqueAmounts.length === 1) {
    return uniqueAmounts[0] ?? '';
  }
  return uniqueAmounts.join(' + ');
};

const getMergedKey = (name: string) => `merged-${name}`;
const getRecipeKey = (recipeId: string) => `recipe-${recipeId}`;
const getBasketDisplayText = (item: BasketItem) => item.purchaseText ?? item.amountText;
const getItemSourceText = (item: BasketItem) => item.recipeId && item.recipeId !== 'ingredient'
  ? '来自 1 道菜'
  : '单独加入';
const getMergedSourceText = (sameNameItems: BasketItem[]) => {
  const recipeIds = new Set(
    sameNameItems
      .map((item) => item.recipeId)
      .filter((recipeId) => recipeId && recipeId !== 'ingredient')
  );
  return recipeIds.size ? `来自 ${recipeIds.size} 道菜` : '单独加入';
};
const getItemImage = (item: BasketItem) => item.imageUrl || item.recipeCoverUrl || '';
const getRecipeCover = (group: BasketRecipeGroup) => {
  const coverItem = group.items.find((item) => item.recipeCoverUrl || item.imageUrl);
  return coverItem?.recipeCoverUrl || coverItem?.imageUrl || '';
};
const formatPriceText = (item: BasketItem) => {
  if (typeof item.currentPrice === 'number' && Number.isFinite(item.currentPrice) && item.currentPrice > 0) {
    const price = Number.isInteger(item.currentPrice) ? String(item.currentPrice) : item.currentPrice.toFixed(1);
    return `约${price}元/${item.priceUnit || '斤'}`;
  }
  return '';
};

const setViewMode = (mode: BasketViewMode) => {
  viewMode.value = mode;
  openedItemId.value = '';
};

const runBasketMutation = async (
  operation: () => Promise<unknown>,
  rollback: () => void,
  failureMessage = '操作没有保存，请重试'
) => {
  if (isMutating.value) return false;
  isMutating.value = true;
  try {
    await operation();
    return true;
  } catch {
    rollback();
    uni.showToast({ title: failureMessage, icon: 'none' });
    void loadBasketPage();
    return false;
  } finally {
    isMutating.value = false;
  }
};

const toggleFamilySelector = () => {
  isFamilySelectorVisible.value = !isFamilySelectorVisible.value;
};

const closeFamilySelector = () => {
  isFamilySelectorVisible.value = false;
};

const selectFamilyScope = async (familyId: BasketScopeId) => {
  requestedFamilyId.value = '';
  const requestId = ++basketLoadRequestId;
  closeFamilySelector();
  isLoading.value = true;
  loadError.value = '';
  try {
    const nextItems = familyId ? await withBasketDeadline(loadBasketItems(familyId)) : [];
    if (requestId !== basketLoadRequestId) return;
    activeFamilyId.value = familyId;
    if (familyId) saveActiveFamilyId(familyId);
    items.value = nextItems;
    openedItemId.value = '';
    expandedRecipeIds.value = [];
  } catch (error) {
    if (requestId !== basketLoadRequestId) return;
    loadError.value = getBasketLoadErrorMessage(error);
  } finally {
    if (requestId === basketLoadRequestId) {
      isLoading.value = false;
    }
  }
};

const goToFamilyManage = () => {
  closeFamilySelector();
  uni.navigateTo({ url: '/pages/family/index' });
};

const openPreferencePanel = () => {
  if (!activeFamilyId.value) {
    goToFamilyManage();
    return;
  }
  activePreferenceType.value = 'avoid';
  isPreferencePanelVisible.value = true;
};

const closePreferencePanel = () => {
  isPreferencePanelVisible.value = false;
};

const setPreferenceType = (type: PreferenceType) => {
  activePreferenceType.value = type;
};

const isRecipeExpanded = (recipeId: string) => expandedRecipeIds.value.includes(recipeId);

const toggleRecipeExpanded = (recipeId: string) => {
  openedItemId.value = '';
  if (isRecipeExpanded(recipeId)) {
    expandedRecipeIds.value = expandedRecipeIds.value.filter((id) => id !== recipeId);
    return;
  }

  expandedRecipeIds.value = [...expandedRecipeIds.value, recipeId];
};

const toggleItem = async (id: string) => {
  if (isMutating.value) return;
  const target = items.value.find((item) => item.id === id);
  if (!target) return;
  const previousItems = items.value;
  items.value = items.value.map((item) => {
    if (item.id !== id) {
      return item;
    }

    return { ...item, checked: !item.checked };
  });
  await runBasketMutation(
    () => updateBasketItemChecked(id, !target.checked),
    () => {
      items.value = previousItems;
    }
  );
};

const toggleMergedItem = async (itemIds: string[]) => {
  if (isMutating.value) return;
  const targetItems = items.value.filter((item) => itemIds.includes(item.id));
  const nextChecked = !targetItems.every((item) => item.checked);
  const previousItems = items.value;

  items.value = items.value.map((item) => {
    if (!itemIds.includes(item.id)) {
      return item;
    }
    return { ...item, checked: nextChecked };
  });
  await runBasketMutation(
    () => Promise.all(itemIds.map((id) => updateBasketItemChecked(id, nextChecked))),
    () => {
      items.value = previousItems;
    }
  );
};

const removeItem = async (id: string) => {
  if (isMutating.value) return;
  const previousItems = items.value;
  items.value = items.value.filter((item) => item.id !== id);
  if (openedItemId.value === id) {
    openedItemId.value = '';
  }
  await runBasketMutation(
    () => removeBasketItem(id),
    () => {
      items.value = previousItems;
    },
    '删除失败，请重试'
  );
};

const removeMergedItem = async (itemIds: string[]) => {
  if (isMutating.value) return;
  const previousItems = items.value;
  items.value = items.value.filter((item) => !itemIds.includes(item.id));
  openedItemId.value = '';
  await runBasketMutation(
    () => Promise.all(itemIds.map(removeBasketItem)),
    () => {
      items.value = previousItems;
    },
    '删除失败，请重试'
  );
};

const removeRecipeGroup = async (recipeId: string) => {
  if (isMutating.value) return;
  const previousItems = items.value;
  const removedIds = items.value.filter((item) => item.recipeId === recipeId).map((item) => item.id);
  items.value = items.value.filter((item) => item.recipeId !== recipeId);
  expandedRecipeIds.value = expandedRecipeIds.value.filter((id) => id !== recipeId);
  openedItemId.value = '';
  await runBasketMutation(
    () => Promise.all(removedIds.map(removeBasketItem)),
    () => {
      items.value = previousItems;
    },
    '删除失败，请重试'
  );
};

const completePurchase = async () => {
  if (!checkedCount.value) return;
  const purchasableItems = getUniquePurchasableItems();
  if (purchasableItems.length) {
    priceInputs.value = purchasableItems.map((item) => ({
      id: item.id,
      ingredientId: item.ingredientId ? Number(item.ingredientId) : 0,
      name: item.name,
      unit: getPriceUnit(item),
      priceText: ''
    }));
    isPricePanelVisible.value = true;
    return;
  }

  items.value = items.value.map((item) => ({ ...item, checked: true }));
  await awaitPersistItems();
  uni.showToast({ title: '已完成采购', icon: 'success' });
};

const splitGuideText = (value?: string | null) => {
  if (!value?.trim()) return [];
  return value
    .split(/[\n。；;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
};

const guideSelectionTips = computed(() => {
  const detailTips = splitGuideText(activeGuideDetail.value?.selectionTips);
  return detailTips;
});

const guidePriceText = computed(() => {
  if (!activeGuideItem.value) return '暂无价格参考。';
  return formatPriceText(activeGuideItem.value) || '暂无价格参考，可在采购完成时记录本次价格。';
});

const guideImage = computed(() => {
  return activeGuideDetail.value?.cover || (activeGuideItem.value ? getItemImage(activeGuideItem.value) : '');
});

const openIngredientGuide = async (item: BasketItem) => {
  activeGuideItem.value = item;
  activeGuideDetail.value = null;
  if (!item.ingredientId) return;
  try {
    activeGuideDetail.value = await getIngredient(item.ingredientId);
  } catch {
    activeGuideDetail.value = null;
  }
};

const openMergedIngredientGuide = async (item: MergedBasketItem) => {
  const sourceItem = items.value.find((entry) => item.itemIds.includes(entry.id) && entry.ingredientId) ??
    items.value.find((entry) => item.itemIds.includes(entry.id));
  if (sourceItem) {
    await openIngredientGuide(sourceItem);
  }
};

const closeIngredientGuide = () => {
  activeGuideItem.value = null;
  activeGuideDetail.value = null;
};

const goToGuideIngredientDetail = () => {
  const ingredientId = activeGuideItem.value?.ingredientId;
  if (!ingredientId) return;
  closeIngredientGuide();
  uni.navigateTo({ url: `/pages/ingredient-detail/index?id=${ingredientId}` });
};

const getUniquePurchasableItems = () => {
  const itemMap = new Map<string, BasketItem>();
  items.value.forEach((item) => {
    if (item.checked && !itemMap.has(item.name)) {
      itemMap.set(item.name, item);
    }
  });
  return Array.from(itemMap.values());
};

const getPriceUnit = (item: BasketItem) => {
  const purchaseText = item.purchaseText ?? '';
  const unitMatch = purchaseText.match(/\/(.+)$/);
  return unitMatch?.[1] ?? '斤';
};

const closePricePanel = () => {
  isPricePanelVisible.value = false;
};

const savePurchasePrices = async () => {
  if (isMutating.value) return;
  const today = new Date().toISOString().slice(0, 10);
  const records = priceInputs.value
    .map((item) => ({
      id: `${item.id}-${Date.now()}`,
      ingredientId: item.ingredientId,
      ingredientName: item.name,
      price: Number(item.priceText),
      unit: item.unit,
      date: today
    }))
    .filter((record) => Number.isFinite(record.price) && record.price > 0);

  const saved = await runBasketMutation(
    async () => {
      if (records.length) {
        await addPriceRecords(records);
      }
      await awaitPersistItems();
    },
    () => undefined,
    '采购记录保存失败，请重试'
  );
  if (!saved) return;

  closePricePanel();
  uni.showToast({ title: records.length ? '价格已记录' : '已完成采购', icon: 'success' });
};

const goHome = () => {
  uni.reLaunch({ url: '/pages/index/index' });
};

const goToRecipes = () => {
  uni.navigateTo({ url: '/pages/ingredients/index?tab=recipes' });
};

const goToScan = () => {
  uni.navigateTo({ url: '/pages/scan/index' });
};

const handleTouchStart = (event: TouchEvent, id: string) => {
  touchStartX.value = event.changedTouches[0]?.clientX ?? 0;
  if (openedItemId.value && openedItemId.value !== id) {
    openedItemId.value = '';
  }
};

const handleTouchEnd = (event: TouchEvent, id: string) => {
  const endX = event.changedTouches[0]?.clientX ?? 0;
  const diffX = endX - touchStartX.value;

  if (diffX < -40) {
    openedItemId.value = id;
    return;
  }

  if (diffX > 40) {
    openedItemId.value = '';
  }
};

const awaitPersistItems = async () => {
  await Promise.all(items.value.map((item) => updateBasketItemChecked(item.id, item.checked)));
};

let activeBasketLoad: Promise<void> | null = null;

const performBasketLoad = async () => {
  const requestId = ++basketLoadRequestId;
  isLoading.value = true;
  loadError.value = '';
  try {
    const nextFamilies = await withBasketDeadline(loadFamilies());
    if (requestId !== basketLoadRequestId) return;
    families.value = nextFamilies;
    const preferredFamilyId = requestedFamilyId.value || activeFamilyId.value || loadActiveFamilyId();
    const requestedFamilyMissing = Boolean(requestedFamilyId.value)
      && !families.value.some((family) => family.id === requestedFamilyId.value);
    if (requestedFamilyMissing) {
      activeFamilyId.value = null;
      items.value = [];
      requestedFamilyId.value = '';
      uni.showToast({ title: '无法访问该家庭，请重新选择', icon: 'none' });
      return;
    }
    const targetFamilyId = families.value.some((family) => family.id === preferredFamilyId)
      ? preferredFamilyId
      : families.value[0]?.id ?? null;
    if (!targetFamilyId) {
      activeFamilyId.value = null;
      items.value = [];
      return;
    }
    const nextItems = await withBasketDeadline(loadBasketItems(targetFamilyId));
    if (requestId !== basketLoadRequestId) return;
    activeFamilyId.value = targetFamilyId;
    saveActiveFamilyId(targetFamilyId);
    items.value = nextItems;
  } catch (error) {
    if (requestId !== basketLoadRequestId) return;
    loadError.value = getBasketLoadErrorMessage(error);
    items.value = [];
  } finally {
    if (requestId === basketLoadRequestId) {
      isLoading.value = false;
    }
  }
};

const loadBasketPage = () => {
  if (activeBasketLoad) return activeBasketLoad;

  activeBasketLoad = (async () => {
    try {
      await performBasketLoad();
    } finally {
      activeBasketLoad = null;
    }
  })();

  return activeBasketLoad;
};

onLoad((options) => {
  requestedFamilyId.value = typeof options?.familyId === 'string' ? options.familyId.trim() : '';
});

onMounted(() => {
  void loadBasketPage();
});

onShow(() => {
  void loadBasketPage();
});
</script>

<style scoped lang="scss">
.basket-page {
  min-height: 100vh;
  padding: 0 40rpx calc(344rpx + var(--app-safe-area-bottom));
  background: var(--app-bg);
}

.basket-shell {
  max-width: 100%;
  margin: 0 auto;
  padding-top: calc(var(--app-safe-area-top) + 12px);
}

.mode-button::after,
.basket-complete-action::after,
.basket-preferences::after,
.family-selector::after,
.family-option::after,
.family-manage-row::after,
.scan-button::after,
.guide-close::after,
.guide-detail-link::after,
.guide-primary::after,
.preference-tab::after,
.preference-primary::after,
.empty-button::after,
.save-price-button::after {
  border: 0;
}

.basket-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin: 0 0 8rpx;
}

.basket-heading__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
}

.basket-summary {
  flex: 0 0 100%;
  margin-top: 0;
  min-width: 0;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.basket-preferences {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  width: 100%;
  min-height: 104rpx;
  margin: 0 0 16rpx;
  padding: 12rpx 0;
  border: 0;
  border-bottom: 1rpx solid rgba(47, 47, 47, 0.08);
  border-radius: 0;
  background: transparent;
  text-align: left;
}

.basket-preferences__title {
  flex: 0 0 auto;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
}

.basket-preferences__tags {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  gap: 8rpx;
  min-width: 0;
}

.basket-preference-tag {
  padding: 6rpx 10rpx;
  border: 1rpx solid rgba(122, 139, 111, 0.28);
  border-radius: 16rpx;
  background: rgba(255, 253, 252, 0.48);
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
  white-space: nowrap;
}

.basket-preference-tag.is-warning {
  border-color: rgba(212, 126, 83, 0.46);
  background: rgba(255, 253, 252, 0.48);
  color: #b86e4a;
}

.family-selector {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-text);
  text-align: left;
}

.family-selector__name {
  display: block;
  max-width: 240px;
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scan-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--app-primary);
}

.scan-button:active {
  transform: scale(0.97);
}

.family-selector:focus-visible,
.family-option:focus-visible,
.family-manage-row:focus-visible,
.scan-button:focus-visible {
  outline: 2px solid var(--app-primary);
  outline-offset: 2px;
}

.family-selector__arrow {
  color: var(--app-text-secondary);
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.family-selector__arrow.is-open {
  transform: rotate(180deg);
}

.family-mask {
  position: fixed;
  inset: 0;
  z-index: 36;
  padding: calc(var(--app-safe-area-top) + 78px) 26rpx 26rpx;
  background: transparent;
}

.family-sheet {
  width: 470rpx;
  max-width: calc(100vw - 52rpx);
  overflow: hidden;
  border: 1rpx solid rgba(233, 226, 214, 0.72);
  border-radius: 24rpx;
  background: #fffdfc;
  box-shadow: 0 18rpx 52rpx rgba(47, 47, 47, 0.12);
}

.family-option,
.family-manage-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 18rpx;
  min-height: 96rpx;
  width: 100%;
  margin: 0;
  padding: 0 32rpx;
  border: 0;
  border-radius: 0;
  background: #fffdfc;
  text-align: left;
}

.family-option.is-active {
  background: rgba(122, 139, 111, 0.11);
}

.family-option__avatar {
  display: grid;
  place-items: center;
  flex: 0 0 64rpx;
  width: 64rpx;
  height: 64rpx;
  border: 1rpx solid rgba(122, 139, 111, 0.3);
  border-radius: 18rpx;
  background: #fffdfc;
  color: var(--text-brand);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-medium);
}

.family-option.is-active .family-option__avatar {
  background: var(--app-accent);
  color: var(--text-white);
}

.family-option__copy {
  min-width: 0;
}

.family-option__name,
.family-option__meta,
.family-manage-row__name {
  display: block;
}

.family-option__name,
.family-manage-row__name {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.family-option__meta {
  margin-top: 2rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.family-option.is-active .family-option__name,
.family-option__check {
  color: var(--text-brand);
}

.family-option__check {
  margin-left: auto;
}

.family-manage-row {
  justify-content: center;
  min-height: 82rpx;
}

.family-manage-row__icon {
  display: none;
}

.family-sheet__divider {
  height: 1rpx;
  margin: 0 32rpx;
  background: rgba(233, 226, 214, 0.9);
}

.basket-board {
  margin-top: 16rpx;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.board-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 30rpx 30rpx 20rpx;
}

.board-copy {
  min-width: 0;
}

.board-title,
.board-desc {
  display: block;
}

.board-title {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.board-desc {
  margin-top: 2rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.board-progress {
  flex: 0 0 auto;
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  line-height: var(--line-tag);
  white-space: nowrap;
}

.purchase-panel {
  overflow: hidden;
  border: 1rpx solid rgba(233, 226, 214, 0.72);
  border-radius: 32rpx;
  background: #fffdfc;
  box-shadow: 0 14rpx 36rpx rgba(67, 58, 45, 0.045);
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
  margin-bottom: 0;
  padding: 0;
  border: 1px solid rgba(122, 139, 111, 0.34);
  border-radius: 12px;
  background: rgba(255, 253, 252, 0.72);
  overflow: hidden;
}

.mode-button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  min-height: 88rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  line-height: var(--line-caption);
  white-space: nowrap;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), background 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.basket-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 240px;
  padding: 32px 16px;
  text-align: center;
}

.basket-state__spinner {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  border: 2px solid rgba(122, 139, 111, 0.16);
  border-top-color: var(--app-primary);
  border-radius: 50%;
  animation: basket-spin 900ms linear infinite;
}

.basket-state__title,
.basket-state__desc {
  display: block;
}

.basket-state__title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.basket-state__desc {
  max-width: 280px;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.basket-state__retry {
  min-width: 112px;
  min-height: 44px;
  margin-top: 8px;
  padding: 0 20px;
  border: 0;
  border-radius: 22px;
  background: var(--app-accent);
  color: var(--text-white);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.basket-state__retry::after {
  border: 0;
}

@keyframes basket-spin {
  to {
    transform: rotate(360deg);
  }
}

.mode-button.is-active {
  background: var(--app-accent);
  color: var(--text-white);
  box-shadow: none;
}

.mode-button:first-child.is-active {
  border-radius: 20rpx 0 0 20rpx;
}

.mode-button:last-child.is-active {
  border-radius: 0 20rpx 20rpx 0;
}

.content,
.merged-card,
.recipe-list {
  display: flex;
  flex-direction: column;
}

.merged-card,
.recipe-list {
  overflow: hidden;
  border-radius: 0;
}

.swipe-row {
  position: relative;
  overflow: hidden;
  border-bottom: 1rpx solid rgba(233, 226, 214, 0.72);
}

.swipe-row:last-child {
  border-bottom: 0;
}

.ingredient-row {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 56rpx 112rpx minmax(0, 1fr) 142rpx;
  align-items: center;
  gap: 16rpx;
  min-height: 156rpx;
  padding: 14rpx 24rpx 14rpx 18rpx;
  background: rgba(255, 253, 252, 0.96);
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), background 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.ingredient-row.is-open {
  transform: translateX(-132rpx);
}

.ingredient-row.is-checked {
  background: rgba(247, 249, 244, 0.92);
}

.check-hit {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 48rpx;
  min-height: 72rpx;
}

.check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  border: 1rpx solid rgba(183, 174, 161, 0.46);
  border-radius: 50%;
  color: transparent;
}

.check.is-checked {
  border-color: var(--app-accent);
  background: var(--app-accent);
  color: var(--text-white);
}

.ingredient-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 112rpx;
  height: 112rpx;
  overflow: hidden;
  border-radius: 16rpx;
  background: #efe8dd;
}

.ingredient-thumb__image,
.recipe-cover__image,
.guide-image {
  display: block;
  width: 100%;
  height: 100%;
}

.ingredient-thumb__fallback,
.recipe-cover__fallback,
.guide-image__fallback {
  color: var(--text-brand);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
}

.ingredient-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4rpx;
  min-width: 0;
}

.ingredient-name {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ingredient-name::after {
  border: 0;
}

.ingredient-name.is-checked,
.ingredient-amount.is-checked {
  color: var(--app-text-tertiary);
  text-decoration: line-through;
}

.ingredient-source {
  display: block;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ingredient-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
  min-width: 0;
}

.ingredient-amount {
  display: block;
  max-width: 150rpx;
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-body-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ingredient-price {
  display: block;
  max-width: 150rpx;
  overflow: hidden;
  color: var(--app-text-secondary);
  font-size: var(--font-size-tabbar);
  line-height: var(--line-tabbar);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.swipe-remove {
  position: absolute;
  top: 30rpx;
  right: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 116rpx;
  height: 62rpx;
  border-radius: 24rpx;
  background: var(--app-danger);
  color: var(--text-white);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.recipe-card {
  overflow: hidden;
  margin: 0 18rpx 12rpx;
  border: 1rpx solid rgba(233, 226, 214, 0.74);
  border-radius: 24rpx;
  background: rgba(255, 253, 252, 0.94);
}

.recipe-card:last-child {
  margin-bottom: 0;
}

.recipe-swipe-row {
  position: relative;
  overflow: hidden;
}

.recipe-header {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 96rpx minmax(0, 1fr) 40rpx;
  align-items: center;
  gap: 18rpx;
  min-height: 116rpx;
  padding: 14rpx;
  background: #fffdfc;
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.recipe-header.is-open {
  transform: translateX(-132rpx);
}

.recipe-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  overflow: hidden;
  border-radius: 18rpx;
  background: #efe8dd;
}

.recipe-copy {
  min-width: 0;
}

.recipe-title,
.recipe-subtitle {
  display: block;
}

.recipe-title {
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-card-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-card-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recipe-subtitle {
  margin-top: 8rpx;
  color: var(--text-warm);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.recipe-arrow {
  color: var(--app-text);
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.recipe-arrow.is-expanded {
  transform: rotate(180deg);
}

.recipe-ingredient-list {
  overflow: hidden;
  margin: 0 18rpx 18rpx 66rpx;
  border-radius: 24rpx;
  background: #fffdfc;
}

.recipe-empty {
  padding: 62rpx 28rpx;
  border-radius: 28rpx;
  background: rgba(233, 226, 214, 0.36);
  text-align: center;
}

.recipe-empty__title,
.recipe-empty__desc {
  display: block;
}

.recipe-empty__title {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
}

.recipe-empty__desc {
  margin-top: 8rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.basket-complete-action {
  position: fixed;
  bottom: calc(var(--app-safe-area-bottom) + 88px);
  left: 50%;
  z-index: 29;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(100% - 40px);
  max-width: 353px;
  min-height: 48px;
  margin: 0;
  padding: 0 18px;
  border: 0;
  border-radius: 24px;
  background: var(--app-accent);
  box-shadow: 0 10rpx 30rpx rgba(82, 95, 74, 0.18);
  color: var(--text-white);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  line-height: var(--line-caption);
  transform: translateX(-50%);
}

.basket-complete-action:disabled {
  background: rgba(122, 139, 111, 0.14);
  color: var(--text-tertiary);
}

.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  min-height: 548rpx;
  padding: 62rpx 24rpx 40rpx;
  border-radius: 28rpx;
  background: rgba(233, 226, 214, 0.34);
  text-align: center;
}

.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 168rpx;
  height: 168rpx;
  margin-bottom: 10rpx;
  border-radius: 44rpx;
  background: #fffdfc;
  color: var(--text-brand);
}

.empty-kicker,
.empty-title,
.empty-desc {
  display: block;
}

.empty-kicker {
  padding: 8rpx 18rpx;
  border-radius: 18rpx;
  background: rgba(122, 139, 111, 0.1);
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  line-height: var(--line-tag);
}

.empty-title {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.empty-desc {
  max-width: 500rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.empty-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  width: 100%;
  margin-top: 18rpx;
}

.empty-button {
  height: 72rpx;
  border: 0;
  border-radius: 28rpx;
  background: #eee8df;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.empty-button.is-primary {
  background: var(--app-accent);
  color: var(--text-white);
}

.guide-mask,
.preference-mask,
.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(47, 47, 47, 0.5);
}

.guide-panel,
.preference-panel,
.price-panel {
  width: 100%;
  max-width: 750rpx;
  max-height: 84vh;
  padding: 18rpx 26rpx calc(28rpx + var(--app-safe-area-bottom));
  overflow-y: auto;
  border-radius: 38rpx 38rpx 0 0;
  background: rgba(255, 253, 252, 0.98);
  box-shadow: 0 -20rpx 70rpx rgba(47, 47, 47, 0.14);
}

.preference-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.preference-panel__title,
.preference-panel__members {
  display: block;
}

.preference-panel__title {
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.preference-panel__members {
  margin-top: 6rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.preference-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10rpx;
  margin-top: 24rpx;
  padding: 6rpx;
  border-radius: 24rpx;
  background: rgba(233, 226, 214, 0.5);
}

.preference-tab {
  min-height: 76rpx;
  margin: 0;
  padding: 0 12rpx;
  border: 0;
  border-radius: 20rpx;
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  line-height: var(--line-caption);
}

.preference-tab.is-active {
  background: #fffdfc;
  color: var(--text-brand);
  box-shadow: 0 4rpx 16rpx rgba(67, 58, 45, 0.06);
}

.preference-record {
  min-height: 190rpx;
  margin-top: 20rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: rgba(245, 241, 234, 0.78);
}

.preference-record__label,
.preference-record__empty {
  display: block;
}

.preference-record__label {
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.preference-record__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.preference-record__tag {
  padding: 9rpx 16rpx;
  border: 1rpx solid rgba(122, 139, 111, 0.28);
  border-radius: 18rpx;
  background: #fffdfc;
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  line-height: var(--line-tag);
}

.preference-record__tag.is-warning {
  border-color: rgba(212, 126, 83, 0.4);
  color: #b86e4a;
}

.preference-record__empty {
  margin-top: 22rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.preference-primary {
  width: 100%;
  min-height: 88rpx;
  margin-top: 22rpx;
  border: 0;
  border-radius: 28rpx;
  background: var(--app-accent);
  color: var(--text-white);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}

.guide-handle {
  width: 104rpx;
  height: 6rpx;
  margin: 0 auto 22rpx;
  border-radius: 999rpx;
  background: rgba(183, 174, 161, 0.42);
}

.guide-head,
.price-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.guide-title,
.price-panel__title {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-section-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-section-title);
}

.guide-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  border: 0;
  border-radius: 18rpx;
  background: transparent;
  color: var(--app-text-secondary);
}

.guide-body {
  display: grid;
  grid-template-columns: 152rpx minmax(0, 1fr);
  gap: 20rpx;
  margin-top: 18rpx;
}

.guide-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 152rpx;
  height: 152rpx;
  overflow: hidden;
  border-radius: 24rpx;
  background: #efe8dd;
}

.guide-content {
  min-width: 0;
}

.guide-eyebrow,
.guide-price {
  display: block;
}

.guide-eyebrow {
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
  line-height: var(--line-tag);
}

.guide-tips {
  display: flex;
  flex-direction: column;
  gap: 7rpx;
  margin-top: 10rpx;
}

.guide-tip {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.guide-tip.is-empty {
  color: var(--text-tertiary);
}

.guide-price {
  margin-top: 10rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
}

.guide-primary,
.save-price-button {
  width: 100%;
  height: 76rpx;
  border: 0;
  border-radius: 24rpx;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}

.guide-primary {
  flex: 1;
  margin: 0;
  background: var(--app-accent);
  color: var(--text-white);
}

.guide-actions {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 24rpx;
}

.guide-detail-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 132rpx;
  height: 76rpx;
  padding: 0 18rpx;
  border: 0;
  border-radius: 24rpx;
  background: #eee8df;
  color: var(--text-brand);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}

.price-panel__desc,
.price-row__name {
  display: block;
}

.price-panel__desc {
  margin-top: 8rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.price-panel__close {
  display: flex;
  flex: 0 0 88rpx;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  margin: -12rpx -10rpx 0 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font-size: var(--font-size-detail-title);
  line-height: var(--line-detail-title);
}

.price-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 24rpx;
}

.price-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260rpx;
  align-items: center;
  gap: 14rpx;
  min-height: 98rpx;
  padding: 16rpx 18rpx;
  border-radius: 24rpx;
  background: #eee8df;
}

.price-row__name {
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-medium);
  line-height: var(--line-body-sm);
}

.price-row__field {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: 62rpx;
  gap: 6rpx;
  padding: 0 18rpx;
  border-radius: 22rpx;
  background: #fffdfc;
}

.price-row__prefix,
.price-row__unit {
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
}

.price-input {
  min-width: 0;
  flex: 1;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-medium);
  text-align: right;
}

.save-price-button {
  height: 88rpx;
  margin-top: 24rpx;
  background: var(--app-accent);
  color: var(--text-white);
}

@media (max-width: 375px) {
  .basket-page {
    padding-right: 24rpx;
    padding-left: 24rpx;
  }

  .ingredient-row {
    grid-template-columns: 52rpx 104rpx minmax(0, 1fr) 126rpx;
    gap: 12rpx;
    padding-right: 18rpx;
    padding-left: 12rpx;
  }

  .ingredient-thumb {
    width: 104rpx;
    height: 104rpx;
  }

  .basket-preferences__tags {
    gap: 5rpx;
  }

  .basket-preference-tag {
    padding-right: 7rpx;
    padding-left: 7rpx;
  }
}
</style>
