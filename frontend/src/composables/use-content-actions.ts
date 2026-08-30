import { onMounted, ref, type Ref } from 'vue';
import { addBasketItem, getIngredientBasketItemId, loadBasketItems, removeBasketItem } from '../services/basket';
import { loadAuthUser, syncAuthUserWithBackend } from '../services/auth';
import {
  addMobileFavorite,
  deleteMobileFavorite,
  listMobileFavorites,
  type MobileContentTarget
} from '../services/public-api';

type ContentActionOptions = {
  targetType: MobileContentTarget['targetType'];
  targetId: Ref<string | number>;
  name: Ref<string>;
  ingredientId?: Ref<string | number | undefined>;
};

export const useContentActions = (options: ContentActionOptions) => {
  const isFavorite = ref(false);
  const favoriteRecordId = ref<number | null>(null);
  const favoriteChanging = ref(false);
  const isInBasket = ref(false);
  const basketItemId = ref<string | null>(null);
  const basketChanging = ref(false);

  const getUser = async (): Promise<{ id: number }> => {
    const user = await syncAuthUserWithBackend(loadAuthUser());
    if (!user?.id) throw new Error('请先登录');
    return { id: user.id };
  };

  const sync = async () => {
    if (!String(options.targetId.value || '').trim()) return;
    const user = await syncAuthUserWithBackend(loadAuthUser());
    if (!user?.id) {
      favoriteRecordId.value = null;
      isFavorite.value = false;
      basketItemId.value = null;
      isInBasket.value = false;
      return;
    }
    const [favorites, basket] = await Promise.all([
      listMobileFavorites({ userId: user.id, page: 1, pageSize: 100 }),
      loadBasketItems()
    ]);
    const favorite = favorites.list.find(
      (item) =>
        item.targetType === options.targetType &&
        item.targetId === String(options.targetId.value)
    );
    favoriteRecordId.value = favorite?.id ?? null;
    isFavorite.value = Boolean(favorite);

    const ingredientId = options.ingredientId?.value
      ? String(options.ingredientId.value)
      : null;
    const basketItem = basket.find((item) =>
      ingredientId ? item.ingredientId === ingredientId : item.name === options.name.value
    );
    basketItemId.value = basketItem?.id ?? null;
    isInBasket.value = Boolean(basketItem);
  };

  const toggleFavorite = async () => {
    if (favoriteChanging.value) return;
    favoriteChanging.value = true;
    try {
      const user = await getUser();
      if (isFavorite.value && favoriteRecordId.value) {
        await deleteMobileFavorite(favoriteRecordId.value);
        favoriteRecordId.value = null;
        isFavorite.value = false;
        uni.showToast({ title: '已取消收藏', icon: 'none' });
      } else {
        const record = await addMobileFavorite({
          userId: user.id,
          targetType: options.targetType,
          targetId: options.targetId.value
        });
        favoriteRecordId.value = record.id;
        isFavorite.value = true;
        uni.showToast({ title: '已加入收藏', icon: 'success' });
      }
    } catch (reason) {
      uni.showToast({
        title: reason instanceof Error ? reason.message : '收藏失败',
        icon: 'none'
      });
    } finally {
      favoriteChanging.value = false;
    }
  };

  const toggleBasket = async () => {
    if (basketChanging.value) return;
    basketChanging.value = true;
    try {
      if (isInBasket.value && basketItemId.value) {
        await removeBasketItem(basketItemId.value);
        basketItemId.value = null;
        isInBasket.value = false;
        uni.showToast({ title: '已移出菜篮', icon: 'none' });
      } else {
        const ingredientId = options.ingredientId?.value
          ? String(options.ingredientId.value)
          : undefined;
        const items = await addBasketItem({
          id: ingredientId
            ? getIngredientBasketItemId(ingredientId)
            : `${options.targetType.toLowerCase()}-${options.targetId.value}`,
          recipeId: 'ingredient',
          recipeName: '单独添加',
          name: options.name.value,
          amountText: '适量',
          checked: false,
          ingredientId
        });
        const item = items.find((entry) =>
          ingredientId
            ? entry.ingredientId === ingredientId
            : entry.name === options.name.value
        );
        basketItemId.value = item?.id ?? null;
        isInBasket.value = true;
        uni.showToast({ title: '已加入菜篮', icon: 'success' });
      }
    } catch (reason) {
      uni.showToast({
        title: reason instanceof Error ? reason.message : '菜篮操作失败',
        icon: 'none'
      });
    } finally {
      basketChanging.value = false;
    }
  };

  onMounted(() => {
    void sync().catch(() => undefined);
  });

  return {
    isFavorite,
    favoriteChanging,
    isInBasket,
    basketChanging,
    sync,
    toggleFavorite,
    toggleBasket
  };
};
