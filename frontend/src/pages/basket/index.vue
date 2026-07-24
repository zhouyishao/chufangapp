<template>
  <view class="app-page basket-page">
    <view class="basket-shell">
      <view class="basket-heading">
        <button
          class="family-selector"
          :aria-expanded="isFamilySelectorVisible"
          aria-label="切换家庭"
          @tap="toggleFamilySelector"
        >
          <text class="family-selector__name">{{ basketScopeName }}</text>
          <app-icon :class="['family-selector__arrow', { 'is-open': isFamilySelectorVisible }]" name="chevron-down" size="22rpx" />
        </button>
        <button
          v-if="canSendMealReady"
          class="meal-ready-button"
          :disabled="sendingMealReady"
          :aria-busy="sendingMealReady"
          @tap="confirmMealReady"
        >
          <app-icon name="bell" size="22rpx" />
          <text>{{ sendingMealReady ? '发送中' : '开饭提醒' }}</text>
        </button>
        <text class="basket-summary">{{ pendingCount }} 项待采购 · 家庭共享清单</text>
      </view>

      <view v-if="activeFamilyId" class="basket-preferences" @tap="goToFamilyManage">
        <text class="basket-preferences__title">家庭口味</text>
        <view class="basket-preferences__tags">
          <text class="basket-preference-tag">忌口 {{ activeFamily.preferences?.avoidItems.length ?? 0 }}</text>
          <text class="basket-preference-tag">喜欢 {{ activeFamily.preferences?.preferences.length ?? 0 }}</text>
          <text class="basket-preference-tag is-warning">过敏 {{ activeFamily.preferences?.allergies.length ?? 0 }}</text>
        </view>
      </view>

      <view v-if="isFamilySelectorVisible" class="family-mask" @tap="closeFamilySelector">
        <view class="family-sheet glass-card" @tap.stop>
          <button
            v-for="family in families"
            :key="family.id"
            :class="['family-option', { 'is-active': family.id === activeFamilyId }]"
            @tap="selectFamilyScope(family.id)"
          >
            <text class="family-option__name">{{ family.name }}</text>
            <app-icon v-if="family.id === activeFamilyId" class="family-option__check" name="check" size="20rpx" />
          </button>

          <view class="family-sheet__divider" />

          <button class="family-manage-row" @tap="goToFamilyManage">
            <text class="family-manage-row__name">家庭管理</text>
            <app-icon class="family-manage-row__icon" name="arrow-right" size="22rpx" />
          </button>
        </view>
      </view>

      <view class="basket-board glass-card">
        <view class="board-head">
          <view class="board-copy">
            <text class="board-title">本次采购</text>
            <text class="board-desc">{{ boardDescription }}</text>
          </view>
          <view class="mode-switch">
            <button :class="['mode-button', { 'is-active': viewMode === 'merged' }]" @tap="setViewMode('merged')">
              食材
            </button>
            <button :class="['mode-button', { 'is-active': viewMode === 'recipe' }]" @tap="setViewMode('recipe')">
              菜谱
            </button>
          </view>
        </view>

        <view v-if="items.length" class="content">
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
      </view>
    </view>

    <view v-if="items.length" class="action-dock glass-card">
      <button class="dock-button" @tap="selectAll">
        <app-icon :name="allChecked ? 'check' : 'circle'" size="24rpx" />
        <text>{{ allChecked ? '取消全选' : '全选' }}</text>
      </button>
      <button class="dock-button" @tap="clearChecked">
        <app-icon name="trash" size="24rpx" />
        <text>删除已购</text>
      </button>
      <button class="dock-button is-primary" @tap="completePurchase">完成采购</button>
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
            <view class="guide-tabs">
              <button
                v-for="tab in guideTabs"
                :key="tab.id"
                :class="['guide-tab', { 'is-active': activeGuideTab === tab.id }]"
                @tap="activeGuideTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </view>
            <view v-if="activeGuideTab === 'select'" class="guide-tips">
              <view v-for="(tip, index) in guideSelectionTips" :key="tip" class="guide-tip">
                <text class="guide-tip__index">{{ index + 1 }}</text>
                <text class="guide-tip__text">{{ tip }}</text>
              </view>
            </view>
            <view v-else-if="activeGuideTab === 'storage'" class="guide-storage">
              <app-icon name="lightbulb" size="24rpx" />
              <text>{{ guideStorageText }}</text>
            </view>
            <view v-else class="guide-storage">
              <text>{{ guidePriceText }}</text>
            </view>
          </view>
        </view>
        <button class="guide-primary" :disabled="!activeGuideItem.ingredientId" @tap="goToGuideIngredientDetail">查看食材详情</button>
        <button class="guide-secondary" @tap="closeIngredientGuide">关闭</button>
      </view>
    </view>

    <view v-if="isPricePanelVisible" class="sheet-mask" @tap="closePricePanel">
      <view class="price-panel" @tap.stop>
        <view class="price-panel__head">
          <view>
            <text class="price-panel__title">记录本次价格</text>
            <text class="price-panel__desc">采购完成后记录价格，之后可在食材详情查看走势。</text>
          </view>
          <text class="price-panel__close" @tap="closePricePanel">×</text>
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
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app/app-icon.vue';
import HomeTabBar from '../../components/home/home-tab-bar.vue';
import { loadBasketItems, removeBasketItem, updateBasketItemChecked } from '../../services/basket';
import type { BasketItem } from '../../services/basket';
import { loadActiveFamilyId, loadFamilies, saveActiveFamilyId } from '../../services/family';
import type { FamilyProfile } from '../../types/family';
import { addPriceRecords } from '../../services/price';
import { loadAuthUser } from '../../services/auth';
import { getIngredient, sendMobileMealReady } from '../../services/public-api';
import type { ApiIngredientDetail } from '../../services/public-api';

type BasketViewMode = 'recipe' | 'merged';
type BasketScopeId = string | null;
type GuideTabId = 'select' | 'storage' | 'price';

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
  ingredientId?: string;
  priceText?: string;
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
const sendingMealReady = ref(false);
const requestedFamilyId = ref('');
const mealReadyIdempotencyKey = ref('');
const expandedRecipeIds = ref<string[]>([]);
const priceInputs = ref<PriceInputItem[]>([]);
const activeGuideItem = ref<BasketItem | null>(null);
const activeGuideDetail = ref<ApiIngredientDetail | null>(null);
const activeGuideTab = ref<GuideTabId>('select');
const guideTabs: { id: GuideTabId; label: string }[] = [
  { id: 'select', label: '怎么挑' },
  { id: 'storage', label: '怎么保存' },
  { id: 'price', label: '参考价格' }
];

const pendingCount = computed(() => items.value.filter((item) => !item.checked).length);
const allChecked = computed(() => items.value.length > 0 && items.value.every((item) => item.checked));
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
const canSendMealReady = computed(() => {
  const userId = loadAuthUser()?.id;
  if (!userId || !activeFamilyId.value) return false;
  return activeFamily.value.members.some((member) => member.userId === userId && member.role === '管理员');
});

const createIdempotencyKey = () => `meal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
let basketLoadRequestId = 0;

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
      priceText: primaryItem ? formatPriceText(primaryItem) : ''
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
  if (item.purchaseText?.includes('元/')) {
    return item.purchaseText;
  }
  return '';
};

const setViewMode = (mode: BasketViewMode) => {
  viewMode.value = mode;
  openedItemId.value = '';
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
  try {
    const nextItems = familyId ? await loadBasketItems(familyId) : [];
    if (requestId !== basketLoadRequestId) return;
    activeFamilyId.value = familyId;
    if (familyId) saveActiveFamilyId(familyId);
    items.value = nextItems;
    openedItemId.value = '';
    expandedRecipeIds.value = [];
  } catch (error) {
    if (requestId !== basketLoadRequestId) return;
    uni.showToast({ title: error instanceof Error ? error.message : '家庭菜篮加载失败', icon: 'none' });
  }
};

const goToFamilyManage = () => {
  closeFamilySelector();
  uni.navigateTo({ url: '/pages/family/index' });
};

const sendMealReady = async () => {
  if (!activeFamilyId.value || sendingMealReady.value) return;
  sendingMealReady.value = true;
  try {
    mealReadyIdempotencyKey.value ||= createIdempotencyKey();
    await sendMobileMealReady(Number(activeFamilyId.value), { idempotencyKey: mealReadyIdempotencyKey.value });
    mealReadyIdempotencyKey.value = '';
    uni.showToast({ title: '已提醒家人开饭', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '提醒发送失败', icon: 'none' });
  } finally {
    sendingMealReady.value = false;
  }
};

const confirmMealReady = () => {
  if (!activeFamilyId.value || sendingMealReady.value) return;
  uni.showModal({
    title: '发送开饭提醒',
    content: `将通知${basketScopeName.value}的所有成员现在可以开饭了。`,
    confirmText: '发送提醒',
    success: ({ confirm }) => {
      if (confirm) void sendMealReady();
    }
  });
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
  const target = items.value.find((item) => item.id === id);
  if (!target) return;
  items.value = items.value.map((item) => {
    if (item.id !== id) {
      return item;
    }

    return { ...item, checked: !item.checked };
  });
  await updateBasketItemChecked(id, !target.checked);
};

const toggleMergedItem = async (itemIds: string[]) => {
  const targetItems = items.value.filter((item) => itemIds.includes(item.id));
  const nextChecked = !targetItems.every((item) => item.checked);

  items.value = items.value.map((item) => {
    if (!itemIds.includes(item.id)) {
      return item;
    }
    return { ...item, checked: nextChecked };
  });
  await Promise.all(itemIds.map((id) => updateBasketItemChecked(id, nextChecked)));
};

const removeItem = async (id: string) => {
  items.value = items.value.filter((item) => item.id !== id);
  if (openedItemId.value === id) {
    openedItemId.value = '';
  }
  await removeBasketItem(id);
};

const removeMergedItem = async (itemIds: string[]) => {
  items.value = items.value.filter((item) => !itemIds.includes(item.id));
  openedItemId.value = '';
  await Promise.all(itemIds.map(removeBasketItem));
};

const removeRecipeGroup = async (recipeId: string) => {
  const removedIds = items.value.filter((item) => item.recipeId === recipeId).map((item) => item.id);
  items.value = items.value.filter((item) => item.recipeId !== recipeId);
  expandedRecipeIds.value = expandedRecipeIds.value.filter((id) => id !== recipeId);
  openedItemId.value = '';
  await Promise.all(removedIds.map(removeBasketItem));
};

const clearChecked = async () => {
  const checkedIds = items.value.filter((item) => item.checked).map((item) => item.id);
  items.value = items.value.filter((item) => !item.checked);
  await Promise.all(checkedIds.map(removeBasketItem));
};

const selectAll = async () => {
  const nextChecked = !allChecked.value;
  items.value = items.value.map((item) => ({ ...item, checked: nextChecked }));
  await Promise.all(items.value.map((item) => updateBasketItemChecked(item.id, nextChecked)));
};

const completePurchase = async () => {
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
  if (detailTips.length) return detailTips;
  const name = activeGuideItem.value?.name || '食材';
  return [
    `看外观：${name}色泽自然、表面完整更稳妥`,
    '看触感：手感紧实，避免明显发软或出水',
    '闻气味：选择自然清香，没有酸败异味',
    '看边角：切口或根部不过度干缩',
    '避坑：过硬可能未熟，过软可能不够新鲜'
  ];
});

const guideStorageText = computed(() => {
  return activeGuideDetail.value?.storageMethod || '买回后按食材属性冷藏或阴凉保存，尽量 2-3 天内食用。';
});

const guidePriceText = computed(() => {
  if (!activeGuideItem.value) return '暂无价格参考。';
  return formatPriceText(activeGuideItem.value) || '后台暂未配置参考价格，可在采购完成时记录本次价格。';
});

const guideImage = computed(() => {
  return activeGuideDetail.value?.cover || (activeGuideItem.value ? getItemImage(activeGuideItem.value) : '');
});

const openIngredientGuide = async (item: BasketItem) => {
  activeGuideItem.value = item;
  activeGuideDetail.value = null;
  activeGuideTab.value = 'select';
  if (!item.ingredientId) return;
  try {
    activeGuideDetail.value = await getIngredient(Number(item.ingredientId));
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
    if (!item.checked && !itemMap.has(item.name)) {
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

  if (records.length) {
    await addPriceRecords(records);
  }

  items.value = items.value.map((item) => ({ ...item, checked: true }));
  await awaitPersistItems();
  closePricePanel();
  uni.showToast({ title: records.length ? '价格已记录' : '已完成采购', icon: 'success' });
};

const goHome = () => {
  uni.reLaunch({ url: '/pages/index/index' });
};

const goToRecipes = () => {
  uni.navigateTo({ url: '/pages/ingredients/index?tab=recipes' });
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

const loadBasketPage = async () => {
  const requestId = ++basketLoadRequestId;
  try {
    const nextFamilies = await loadFamilies();
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
    const nextItems = await loadBasketItems(targetFamilyId);
    if (requestId !== basketLoadRequestId) return;
    activeFamilyId.value = targetFamilyId;
    saveActiveFamilyId(targetFamilyId);
    items.value = nextItems;
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '菜篮子加载失败', icon: 'none' });
  }
};

onLoad((options) => {
  requestedFamilyId.value = typeof options?.familyId === 'string' ? options.familyId.trim() : '';
});

onShow(() => {
  void loadBasketPage();
});
</script>

<style scoped lang="scss">
.basket-page {
  min-height: 100vh;
  padding: 0 26rpx calc(318rpx + env(safe-area-inset-bottom, 0));
  background:
    radial-gradient(circle at 12% 0, rgba(255, 253, 252, 0.96), transparent 36%),
    radial-gradient(circle at 86% 8%, rgba(233, 226, 214, 0.72), transparent 30%),
    #f5f1ea;
}

.basket-shell {
  max-width: 750rpx;
  margin: 0 auto;
  padding-top: calc(var(--app-safe-area-top) + 16px);
}

.mode-button::after,
.dock-button::after,
.family-selector::after,
.family-option::after,
.family-manage-row::after,
.meal-ready-button::after,
.guide-close::after,
.guide-tab::after,
.guide-primary::after,
.guide-secondary::after,
.empty-button::after,
.save-price-button::after {
  border: 0;
}

.basket-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 24rpx;
  margin: 4rpx 0 24rpx;
}

.basket-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin: 0 0 4rpx;
}

.basket-title {
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
}

.basket-summary {
  flex: 0 0 100%;
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
  gap: 20rpx;
  margin: 20rpx 0 6rpx;
  padding: 20rpx 22rpx;
  border: 1rpx solid rgba(233, 226, 214, 0.84);
  border-radius: 24rpx;
  background: rgba(255, 253, 252, 0.68);
}

.basket-preferences__title {
  flex: 0 0 auto;
  color: var(--app-text);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-semibold);
  line-height: var(--line-body-sm);
}

.basket-preferences__tags {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  gap: 10rpx;
  min-width: 0;
}

.basket-preference-tag {
  padding: 8rpx 12rpx;
  border-radius: 14rpx;
  background: rgba(122, 139, 111, 0.1);
  color: var(--text-brand);
  font-size: var(--font-size-tag);
  line-height: var(--line-tag);
  white-space: nowrap;
}

.basket-preference-tag.is-warning {
  background: rgba(212, 126, 83, 0.1);
  color: #b86e4a;
}

.family-selector {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
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
  max-width: 390rpx;
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--font-size-page-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-page-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meal-ready-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-width: 164rpx;
  min-height: 68rpx;
  margin: 0;
  padding: 0 20rpx;
  border: 1rpx solid var(--app-border-strong);
  border-radius: 999rpx;
  background: rgba(255, 253, 252, 0.78);
  color: var(--app-primary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-medium);
  line-height: var(--line-tag);
}

.meal-ready-button:active {
  transform: scale(0.97);
}

.meal-ready-button[disabled] {
  opacity: 0.58;
}

.family-selector:focus-visible,
.family-option:focus-visible,
.family-manage-row:focus-visible,
.meal-ready-button:focus-visible {
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
  padding: 128rpx 26rpx 26rpx;
  background: rgba(47, 47, 47, 0.18);
}

.family-sheet {
  overflow: hidden;
  border: 1rpx solid rgba(233, 226, 214, 0.72);
  border-radius: 32rpx;
  background: #fffdfc;
  box-shadow: 0 26rpx 70rpx rgba(47, 47, 47, 0.08);
}

.family-option,
.family-manage-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.family-option__name,
.family-manage-row__name {
  display: block;
  color: var(--app-text);
  font-size: var(--font-size-list-title);
  font-weight: var(--font-semibold);
  line-height: var(--line-list-title);
}

.family-option.is-active .family-option__name,
.family-option__check {
  color: var(--text-brand);
}

.family-manage-row__icon {
  color: var(--app-text-secondary);
}

.family-sheet__divider {
  height: 1rpx;
  margin: 0 32rpx;
  background: rgba(233, 226, 214, 0.9);
}

.basket-board {
  margin-top: 22rpx;
  padding: 26rpx 24rpx 20rpx;
  border: 1rpx solid rgba(255, 253, 252, 0.8);
  border-radius: 34rpx;
  background: rgba(255, 253, 252, 0.9);
  box-shadow: 0 24rpx 66rpx rgba(47, 47, 47, 0.05);
}

.board-head {
  display: grid;
  grid-template-columns: 1fr 196rpx;
  align-items: start;
  gap: 20rpx;
  margin-bottom: 22rpx;
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
  margin-top: 8rpx;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6rpx;
  padding: 6rpx;
  border: 1rpx solid rgba(233, 226, 214, 0.82);
  border-radius: 34rpx;
  background: #eee8df;
}

.mode-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 58rpx;
  padding: 0;
  border: 0;
  border-radius: 28rpx;
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  line-height: var(--line-caption);
  white-space: nowrap;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), background 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.mode-button.is-active {
  background: var(--app-accent);
  color: var(--text-white);
  box-shadow: 0 12rpx 26rpx rgba(122, 139, 111, 0.18);
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
  border-radius: 28rpx;
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
  grid-template-columns: 48rpx 96rpx minmax(0, 1fr) 150rpx;
  align-items: center;
  gap: 16rpx;
  min-height: 122rpx;
  padding: 12rpx 4rpx;
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
  width: 92rpx;
  height: 82rpx;
  overflow: hidden;
  border-radius: 18rpx;
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
  margin-bottom: 18rpx;
  border: 1rpx solid rgba(233, 226, 214, 0.82);
  border-radius: 28rpx;
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
  grid-template-columns: 116rpx minmax(0, 1fr) 44rpx;
  align-items: center;
  gap: 18rpx;
  min-height: 138rpx;
  padding: 18rpx;
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
  width: 112rpx;
  height: 100rpx;
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

.action-dock {
  position: fixed;
  right: 28rpx;
  bottom: calc(164rpx + env(safe-area-inset-bottom, 0));
  left: 28rpx;
  z-index: 29;
  display: grid;
  grid-template-columns: 1fr 1.15fr 1.35fr;
  gap: 12rpx;
  max-width: 694rpx;
  margin: 0 auto;
  padding: 14rpx;
  border: 1rpx solid rgba(233, 226, 214, 0.82);
  border-radius: 34rpx;
  background: rgba(255, 253, 252, 0.96);
  box-shadow: 0 18rpx 54rpx rgba(47, 47, 47, 0.07);
}

.dock-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  height: 66rpx;
  min-width: 0;
  border: 0;
  border-radius: 28rpx;
  background: #eee8df;
  color: var(--app-text);
  font-size: var(--font-size-caption);
  font-weight: var(--font-semibold);
  line-height: var(--line-caption);
}

.dock-button.is-primary {
  background: var(--app-accent);
  color: var(--text-white);
  box-shadow: 0 12rpx 28rpx rgba(122, 139, 111, 0.2);
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
.price-panel {
  width: 100%;
  max-width: 750rpx;
  max-height: 84vh;
  padding: 18rpx 26rpx calc(28rpx + env(safe-area-inset-bottom, 0));
  overflow-y: auto;
  border-radius: 38rpx 38rpx 0 0;
  background: rgba(255, 253, 252, 0.98);
  box-shadow: 0 -20rpx 70rpx rgba(47, 47, 47, 0.14);
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
  width: 54rpx;
  height: 54rpx;
  border: 0;
  border-radius: 18rpx;
  background: transparent;
  color: var(--app-text-secondary);
}

.guide-body {
  display: grid;
  grid-template-columns: 168rpx minmax(0, 1fr);
  gap: 24rpx;
  margin-top: 22rpx;
}

.guide-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 168rpx;
  height: 160rpx;
  overflow: hidden;
  border-radius: 24rpx;
  background: #efe8dd;
}

.guide-content {
  min-width: 0;
}

.guide-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border-radius: 18rpx;
  background: #eee8df;
}

.guide-tab {
  height: 52rpx;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--font-size-tag);
  font-weight: var(--font-semibold);
}

.guide-tab.is-active {
  color: var(--text-brand);
  box-shadow: inset 0 -4rpx 0 var(--text-brand);
}

.guide-tips {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 20rpx;
}

.guide-tip {
  display: grid;
  grid-template-columns: 34rpx minmax(0, 1fr);
  align-items: start;
  gap: 10rpx;
}

.guide-tip__index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  background: var(--app-accent);
  color: var(--text-white);
  font-size: var(--font-size-tabbar);
  font-weight: var(--font-semibold);
  line-height: var(--line-tabbar);
}

.guide-tip__text,
.guide-storage {
  color: var(--app-text);
  font-size: var(--font-size-caption);
  line-height: var(--line-caption);
}

.guide-storage {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 22rpx;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: #f2ece3;
}

.guide-primary,
.guide-secondary,
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
  margin-top: 28rpx;
  background: var(--app-accent);
  color: var(--text-white);
}

.guide-secondary {
  margin-top: 14rpx;
  background: #eee8df;
  color: var(--app-text);
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
  grid-template-columns: 1fr 240rpx;
  align-items: center;
  gap: 18rpx;
  padding: 18rpx;
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
  height: 62rpx;
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
}

.save-price-button {
  margin-top: 24rpx;
  background: var(--app-accent);
  color: var(--text-white);
}
</style>
