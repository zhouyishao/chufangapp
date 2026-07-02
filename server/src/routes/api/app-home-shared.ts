import { prisma } from '../../prisma';
import { buildPublicIdWhere, getPublicCode, getPublicId } from '../../lib/business-id';

const publicRecipeWhere = { deletedAt: null, status: 'ACTIVE' as const, isPublish: true, auditStatus: 'APPROVED' as const };

type AppImageModuleItem = {
  id?: unknown;
  type?: unknown;
  cover?: unknown;
  title?: unknown;
  subtitle?: unknown;
  buttonText?: unknown;
  jumpType?: unknown;
  jumpTarget?: unknown;
  sortOrder?: unknown;
  status?: unknown;
};

const toStringOrNull = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const toNumberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getModuleCategoryName = async (categoryId: number | null) => {
  if (!categoryId) return null;
  const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } });
  return cat?.name ?? null;
};

export const serializeModuleForApp = async (mod: {
  id: number;
  navId: number;
  title: string;
  subtitle: string | null;
  displayStyle: string;
  contentType: string;
  contentSource: string;
  displayCount: number;
  showMore: boolean;
  showTitle: boolean;
  moreLink: string | null;
  sortOrder: number;
  status: string;
  items: unknown;
  categoryId: number | null;
  tagId: number | null;
}) => {
  const moduleItems: unknown[] = Array.isArray(mod.items) ? mod.items : [];
  let resolvedItems: unknown[] = [];

  if (mod.displayStyle === 'LARGE_IMAGE_CAROUSEL') {
    const categoryName = await getModuleCategoryName(mod.categoryId);
    const imageItems = (moduleItems as AppImageModuleItem[])
      .filter((item) => item && typeof item === 'object' && item.status === 'ENABLED')
      .map((item) => ({
        id: String(item.id ?? ''),
        type: 'image',
        cover: toStringOrNull(item.cover),
        title: toStringOrNull(item.title),
        subtitle: toStringOrNull(item.subtitle),
        buttonText: toStringOrNull(item.buttonText),
        jumpType: toStringOrNull(item.jumpType) ?? 'NONE',
        jumpTarget: toStringOrNull(item.jumpTarget),
        sortOrder: toNumberOrZero(item.sortOrder),
        status: 'ENABLED'
      }))
      .filter((item) => item.id && item.cover)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      id: mod.id,
      navId: mod.navId,
      title: mod.title,
      subtitle: mod.subtitle,
      displayStyle: mod.displayStyle,
      contentType: mod.contentType,
      contentSource: mod.contentSource,
      categoryId: mod.categoryId,
      categoryName,
      displayCount: mod.displayCount,
      showMore: mod.showMore,
      showTitle: mod.showTitle,
      moreLink: mod.moreLink,
      sortOrder: mod.sortOrder,
      status: mod.status,
      items: imageItems
    };
  }

  // 数据源说明：
  // - RECIPE   → prisma.recipe 表
  // - BEVERAGE → prisma.beverage 表
  // - INGREDIENT / FRUIT / SEASONING → prisma.ingredient 表（当前阶段 FRUIT 和 SEASONING 复用 ingredient 查询逻辑，后续可拆分独立表）
  const isRecipeType = mod.contentType === 'RECIPE';
  const isBeverageType = mod.contentType === 'BEVERAGE';
  const isIngredientType = ['INGREDIENT', 'FRUIT', 'SEASONING'].includes(mod.contentType);

  if (mod.contentSource === 'MANUAL') {
    const typedItems = moduleItems as Array<{ id: string; type: string; sortOrder: number }>;
    for (const item of typedItems) {
      if (isRecipeType) {
        const recipe = await prisma.recipe.findFirst({
          where: { ...buildPublicIdWhere(item.id), ...publicRecipeWhere },
          select: { id: true, bizId: true, code: true, title: true, cover: true, cookTime: true, difficulty: true, calories: true, servings: true, description: true, favoriteCount: true }
        });
        if (recipe) {
          resolvedItems.push({
            id: getPublicId('recipe', recipe),
            code: getPublicCode('recipe', recipe),
            type: 'recipe',
            title: recipe.title,
            cover: recipe.cover,
            duration: recipe.cookTime ? `${recipe.cookTime}分钟` : null,
            difficulty: recipe.difficulty,
            servings: recipe.servings,
            calories: recipe.calories ? `约${recipe.calories}kcal` : null,
            description: recipe.description,
            favoriteCount: recipe.favoriteCount,
            sortOrder: item.sortOrder
          });
        }
      } else if (isBeverageType) {
        const beverage = await prisma.beverage.findFirst({
          where: { ...buildPublicIdWhere(item.id), deletedAt: null, status: 'ACTIVE', isPublish: true },
          select: { id: true, name: true, coverImage: true, description: true }
        });
        if (beverage) {
          resolvedItems.push({
            id: getPublicId('beverage', beverage),
            type: 'beverage',
            name: beverage.name,
            cover: beverage.coverImage,
            description: beverage.description,
            sortOrder: item.sortOrder
          });
        }
      } else if (isIngredientType) {
        const ingredient = await prisma.ingredient.findFirst({
          where: { ...buildPublicIdWhere(item.id), deletedAt: null, status: 'ACTIVE', isPublish: true },
          select: { id: true, name: true, cover: true, currentPrice: true, priceUnit: true }
        });
        if (ingredient) {
          resolvedItems.push({
            id: getPublicId('ingredient', ingredient),
            type: 'ingredient',
            name: ingredient.name,
            cover: ingredient.cover,
            currentPrice: ingredient.currentPrice,
            priceUnit: ingredient.priceUnit,
            sortOrder: item.sortOrder
          });
        }
      }
    }
    resolvedItems.sort((a, b) => (a as { sortOrder: number }).sortOrder - (b as { sortOrder: number }).sortOrder);
  } else if (mod.contentSource === 'CATEGORY' && mod.categoryId) {
    if (isRecipeType) {
      const recipes = await prisma.recipe.findMany({
        where: { ...publicRecipeWhere, categoryId: mod.categoryId },
        orderBy: [{ isRecommend: 'desc' }, { sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, bizId: true, code: true, title: true, cover: true, cookTime: true, difficulty: true, calories: true, servings: true, description: true, favoriteCount: true }
      });
      resolvedItems = recipes.map((r, i) => ({
        id: getPublicId('recipe', r),
        code: getPublicCode('recipe', r),
        type: 'recipe',
        title: r.title,
        cover: r.cover,
        duration: r.cookTime ? `${r.cookTime}分钟` : null,
        difficulty: r.difficulty,
        servings: r.servings,
        calories: r.calories ? `约${r.calories}kcal` : null,
        description: r.description,
        favoriteCount: r.favoriteCount,
        sortOrder: i
      }));
    } else if (isBeverageType) {
      const beverages = await prisma.beverage.findMany({
        where: { deletedAt: null, status: 'ACTIVE', isPublish: true, categoryId: mod.categoryId },
        orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, name: true, coverImage: true, description: true }
      });
      resolvedItems = beverages.map((b, i) => ({
        id: getPublicId('beverage', b),
        type: 'beverage',
        name: b.name,
        cover: b.coverImage,
        description: b.description,
        sortOrder: i
      }));
    } else {
      const ingredients = await prisma.ingredient.findMany({
        where: { deletedAt: null, status: 'ACTIVE', isPublish: true, categoryId: mod.categoryId },
        orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, name: true, cover: true, currentPrice: true, priceUnit: true }
      });
      resolvedItems = ingredients.map((ing, i) => ({
        id: getPublicId('ingredient', ing),
        type: 'ingredient',
        name: ing.name,
        cover: ing.cover,
        currentPrice: ing.currentPrice,
        priceUnit: ing.priceUnit,
        sortOrder: i
      }));
    }
  } else if (mod.contentSource === 'CATEGORY_CONTENT' && mod.categoryId) {
    // CATEGORY_CONTENT: 与 CATEGORY 逻辑相同，按 categoryId 自动查询对应分类下的内容
    if (isRecipeType) {
      const recipes = await prisma.recipe.findMany({
        where: { ...publicRecipeWhere, categoryId: mod.categoryId },
        orderBy: [{ isRecommend: 'desc' }, { sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, bizId: true, code: true, title: true, cover: true, cookTime: true, difficulty: true, calories: true, servings: true, description: true, favoriteCount: true }
      });
      resolvedItems = recipes.map((r, i) => ({
        id: getPublicId('recipe', r),
        code: getPublicCode('recipe', r),
        type: 'recipe',
        title: r.title,
        cover: r.cover,
        duration: r.cookTime ? `${r.cookTime}分钟` : null,
        difficulty: r.difficulty,
        servings: r.servings,
        calories: r.calories ? `约${r.calories}kcal` : null,
        description: r.description,
        favoriteCount: r.favoriteCount,
        sortOrder: i
      }));
    } else if (isBeverageType) {
      const beverages = await prisma.beverage.findMany({
        where: { deletedAt: null, status: 'ACTIVE', isPublish: true, categoryId: mod.categoryId },
        orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, name: true, coverImage: true, description: true }
      });
      resolvedItems = beverages.map((b, i) => ({
        id: getPublicId('beverage', b),
        type: 'beverage',
        name: b.name,
        cover: b.coverImage,
        description: b.description,
        sortOrder: i
      }));
    } else {
      const ingredients = await prisma.ingredient.findMany({
        where: { deletedAt: null, status: 'ACTIVE', isPublish: true, categoryId: mod.categoryId },
        orderBy: [{ isRecommend: 'desc' }, { sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, name: true, cover: true, currentPrice: true, priceUnit: true }
      });
      resolvedItems = ingredients.map((ing, i) => ({
        id: getPublicId('ingredient', ing),
        type: 'ingredient',
        name: ing.name,
        cover: ing.cover,
        currentPrice: ing.currentPrice,
        priceUnit: ing.priceUnit,
        sortOrder: i
      }));
    }
  } else if (mod.contentSource === 'CATEGORY_GROUP') {
    // CATEGORY_GROUP: 展示分类入口，不展示具体内容
    // contentType -> CategoryType 映射
    const categoryTypeMap: Record<string, string> = {
      RECIPE: 'RECIPE',
      INGREDIENT: 'INGREDIENT',
      FRUIT: 'FRUIT',
      SEASONING: 'SEASONING',
      BEVERAGE: 'BEVERAGE'
    };
    const dbCategoryType = categoryTypeMap[mod.contentType];
    if (dbCategoryType) {
      const categories = await prisma.category.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          isPublish: true,
          type: dbCategoryType as 'RECIPE' | 'INGREDIENT' | 'SEASONING' | 'FRUIT' | 'BEVERAGE'
        },
        orderBy: [{ sortOrder: 'desc' }, { id: 'asc' }],
        take: mod.displayCount,
        select: { id: true, name: true, type: true }
      });
      resolvedItems = categories.map((cat, i) => ({
        id: cat.id,
        type: 'category',
        name: cat.name,
        categoryType: cat.type,
        sortOrder: i
      }));
    }
  } else if (mod.contentSource === 'TAG' && mod.tagId) {
    const tagId = mod.tagId;
    if (isRecipeType) {
      const recipes = await prisma.recipe.findMany({
        where: {
          ...publicRecipeWhere,
          recipeTags: { some: { tagId } }
        },
        orderBy: [{ isRecommend: 'desc' }, { sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, bizId: true, code: true, title: true, cover: true, cookTime: true, difficulty: true, calories: true, servings: true, description: true, favoriteCount: true }
      });
      resolvedItems = recipes.map((r, i) => ({
        id: getPublicId('recipe', r),
        code: getPublicCode('recipe', r),
        type: 'recipe',
        title: r.title,
        cover: r.cover,
        duration: r.cookTime ? `${r.cookTime}分钟` : null,
        difficulty: r.difficulty,
        servings: r.servings,
        calories: r.calories ? `约${r.calories}kcal` : null,
        description: r.description,
        favoriteCount: r.favoriteCount,
        sortOrder: i
      }));
    } else if (isBeverageType) {
      resolvedItems = [];
    } else {
      const ingredients = await prisma.ingredient.findMany({
        where: {
          deletedAt: null, status: 'ACTIVE', isPublish: true,
          ingredientTags: { some: { tagId } }
        },
        orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
        take: mod.displayCount,
        select: { id: true, name: true, cover: true, currentPrice: true, priceUnit: true }
      });
      resolvedItems = ingredients.map((ing, i) => ({
        id: getPublicId('ingredient', ing),
        type: 'ingredient',
        name: ing.name,
        cover: ing.cover,
        currentPrice: ing.currentPrice,
        priceUnit: ing.priceUnit,
        sortOrder: i
      }));
    }
  }

  // 返回时附带分类名称，便于 C 端显示分组标题
  const categoryName = await getModuleCategoryName(mod.categoryId);

  return {
    id: mod.id,
    navId: mod.navId,
    title: mod.title,
    subtitle: mod.subtitle,
    displayStyle: mod.displayStyle,
    contentType: mod.contentType,
    contentSource: mod.contentSource,
    categoryId: mod.categoryId,
    categoryName,
    displayCount: mod.displayCount,
    showMore: mod.showMore,
    showTitle: mod.showTitle,
    moreLink: mod.moreLink,
    sortOrder: mod.sortOrder,
    status: mod.status,
    items: resolvedItems
  };
};
