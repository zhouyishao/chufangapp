import { Router } from 'express';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { ok } from '../../http/response';
import { buildPublicIdWhere, getPublicCode, getPublicId } from '../../lib/business-id';
import { serializeModuleForApp } from './app-home-shared';
import { collectDescendantCategoryIds } from '../../services/category-tree';
import {
  collectVisibleCategoryIds,
  getCategoryNavigationName,
  type CategoryNavigationType,
} from '../../services/category-navigation';

const categoryContentTypeValues = ['recipe', 'ingredient', 'fruit', 'seasoning', 'beverage'] as const;

type CategoryContentType = typeof categoryContentTypeValues[number];

const loadCategoryResourceItems = async (contentType: CategoryContentType, categoryIds: number[]) => {
  if (contentType === 'recipe') {
    const recipes = await prisma.recipe.findMany({
      where: {
        categoryId: { in: categoryIds },
        deletedAt: null,
        status: 'ACTIVE',
        isPublish: true,
        auditStatus: 'APPROVED'
      },
      orderBy: [{ isRecommend: 'desc' }, { sortOrder: 'desc' }, { id: 'desc' }],
      take: 100,
      select: {
        id: true,
        bizId: true,
        code: true,
        title: true,
        subtitle: true,
        description: true,
        cover: true,
        cookTime: true,
        difficulty: true
      }
    });

    return recipes.map((recipe) => ({
      id: getPublicId('recipe', recipe),
      code: getPublicCode('recipe', recipe),
      type: 'recipe',
      title: recipe.title,
      subtitle: recipe.subtitle ?? recipe.description,
      cover: recipe.cover,
      duration: recipe.cookTime ? `${recipe.cookTime}分钟` : null,
      difficulty: recipe.difficulty
    }));
  }

  if (contentType === 'beverage') {
    const beverages = await prisma.beverage.findMany({
      where: {
        categoryId: { in: categoryIds },
        deletedAt: null,
        status: 'ACTIVE',
        isPublish: true
      },
      orderBy: [{ isRecommend: 'desc' }, { sortOrder: 'desc' }, { id: 'desc' }],
      take: 100,
      select: {
        id: true,
        bizId: true,
        code: true,
        name: true,
        coverImage: true,
        description: true,
        beverageType: true,
        alcoholDegree: true
      }
    });

    return beverages.map((beverage) => ({
      id: getPublicId('beverage', beverage),
      code: getPublicCode('beverage', beverage),
      type: 'beverage',
      name: beverage.name,
      cover: beverage.coverImage,
      description: beverage.description,
      duration: beverage.alcoholDegree != null
        ? `${beverage.alcoholDegree}%vol`
        : beverage.beverageType
    }));
  }

  const ingredients = await prisma.ingredient.findMany({
    where: {
      categoryId: { in: categoryIds },
      deletedAt: null,
      status: 'ACTIVE',
      isPublish: true
    },
    orderBy: [{ isRecommend: 'desc' }, { sortOrder: 'desc' }, { id: 'desc' }],
    take: 100,
    select: {
      id: true,
      bizId: true,
      code: true,
      name: true,
      cover: true,
      transparentImage: true,
      seasonMonth: true,
      currentPrice: true,
      priceUnit: true
    }
  });

  return ingredients.map((ingredient) => ({
    id: getPublicId('ingredient', ingredient),
    code: getPublicCode('ingredient', ingredient),
    type: contentType,
    name: ingredient.name,
    cover: ingredient.transparentImage ?? ingredient.cover,
    displayImage: ingredient.transparentImage ?? ingredient.cover,
    seasonMonth: ingredient.seasonMonth,
    currentPrice: ingredient.currentPrice,
    priceUnit: ingredient.priceUnit
  }));
};

const collectCategoryTypeIds = async (categoryType: 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'BEVERAGE' | 'SEASONING') => {
  const categories = await prisma.category.findMany({
    where: { type: categoryType, deletedAt: null, status: 'ACTIVE' },
    select: { id: true }
  });
  return categories.map((category) => category.id);
};

const loadCategoryResourceCategoryIds = async (contentType: CategoryContentType): Promise<number[]> => {
  if (contentType === 'recipe') {
    const resources = await prisma.recipe.findMany({
      where: {
        categoryId: { not: null },
        deletedAt: null,
        status: 'ACTIVE',
        isPublish: true,
        auditStatus: 'APPROVED',
      },
      distinct: ['categoryId'],
      select: { categoryId: true },
    });
    return resources.flatMap((resource) => resource.categoryId == null ? [] : [resource.categoryId]);
  }

  if (contentType === 'beverage') {
    const resources = await prisma.beverage.findMany({
      where: {
        categoryId: { not: null },
        deletedAt: null,
        status: 'ACTIVE',
        isPublish: true,
      },
      distinct: ['categoryId'],
      select: { categoryId: true },
    });
    return resources.flatMap((resource) => resource.categoryId == null ? [] : [resource.categoryId]);
  }

  const resources = await prisma.ingredient.findMany({
    where: {
      categoryId: { not: null },
      deletedAt: null,
      status: 'ACTIVE',
      isPublish: true,
    },
    distinct: ['categoryId'],
    select: { categoryId: true },
  });
  return resources.flatMap((resource) => resource.categoryId == null ? [] : [resource.categoryId]);
};

export const apiPageModulesRouter = Router();

apiPageModulesRouter.get('/page-modules', async (req, res) => {
  const pageParam = typeof req.query.page === 'string' ? req.query.page.trim() : 'home';
  const typeParam = typeof req.query.type === 'string' ? req.query.type.trim() : 'ingredient';
  const filterParam = typeof req.query.filter === 'string' ? req.query.filter.trim() : 'recommend';
  const rawCategoryId = typeof req.query.categoryId === 'string' ? Number(req.query.categoryId) : undefined;
  const categoryIdParam = Number.isFinite(rawCategoryId) && rawCategoryId && rawCategoryId > 0 ? rawCategoryId : undefined;

  const displayPosition = pageParam === 'category' ? 'category_top' : 'home_top';
  const contentType = categoryContentTypeValues.includes(typeParam as typeof categoryContentTypeValues[number]) ? typeParam : 'ingredient';

  const modules: Array<{
    moduleType: string;
    sortOrder: number;
    config?: Record<string, unknown>;
    items?: unknown[];
    data?: unknown;
  }> = [];

  // 1. search_bar
  modules.push({
    moduleType: 'search_bar',
    sortOrder: 1,
    config: {
      placeholder: '搜索菜谱、食材、水果、调料、酒水',
      showScanIcon: true
    }
  });

  // 2. top_nav — from displayPosition=category_top navs
  const categoryNavs = await prisma.homeTopNav.findMany({
    where: { deletedAt: null, isDeleted: false, status: 'online', displayPosition: 'category_top' },
    include: { style: true, contentRule: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
  });

  const topNavItems = categoryNavs.map((nav) => ({
    id: getPublicId('top_nav', nav),
    code: getPublicCode('top_nav', nav),
    name: nav.name,
    navType: nav.navType,
    contentType: nav.contentType ?? null,
    isDefault: nav.isDefault,
    sortOrder: nav.sortOrder,
    active: nav.contentType === contentType
  }));

  modules.push({
    moduleType: 'top_nav',
    sortOrder: 2,
    data: {
      activeKey: contentType,
      items: topNavItems
    }
  });

  // 3. category_filter — "推荐" system item + categories from DB
  const categoryTypeMap: Record<string, 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'BEVERAGE' | 'SEASONING'> = {
    recipe: 'RECIPE',
    ingredient: 'INGREDIENT',
    fruit: 'FRUIT',
    seasoning: 'SEASONING',
    beverage: 'BEVERAGE'
  };

  const dbCategoryType = categoryTypeMap[contentType] ?? 'INGREDIENT';
  const availableCategories = await prisma.category.findMany({
    where: { deletedAt: null, status: 'ACTIVE', isPublish: true, type: dbCategoryType as 'RECIPE' | 'INGREDIENT' | 'SEASONING' | 'FRUIT' | 'BEVERAGE' },
    orderBy: [{ sortOrder: 'desc' }, { id: 'asc' }],
    select: { id: true, name: true, type: true, parentId: true }
  });
  const resourceCategoryIds = await loadCategoryResourceCategoryIds(contentType as CategoryContentType);
  const visibleCategoryIds = collectVisibleCategoryIds(availableCategories, resourceCategoryIds);
  const dbCategories = availableCategories.filter((category) => visibleCategoryIds.has(category.id));

  const categoryFilterItems: Array<{
    name: string;
    key: string;
    type: 'system' | 'category';
    categoryId?: number;
  }> = [
    { name: '推荐', key: 'recommend', type: 'system' }
  ];

  for (const cat of dbCategories) {
    categoryFilterItems.push({
      name: getCategoryNavigationName(dbCategoryType as CategoryNavigationType, cat.name),
      key: cat.name,
      type: 'category',
      categoryId: cat.id
    });
  }

  const activeFilterKey = categoryIdParam
    ? (dbCategories.find((cat) => cat.id === categoryIdParam)?.name ?? filterParam)
    : filterParam;

  modules.push({
    moduleType: 'category_filter',
    sortOrder: 3,
    data: {
      activeKey: activeFilterKey,
      items: categoryFilterItems
    }
  });

  // 4. hero_banner + 5. content_module — from the nav matching current contentType
  const activeNav = categoryNavs.find((nav) => nav.contentType === contentType);
  if (activeNav) {
    const now = new Date();
    const banners = await prisma.homeHeroBanner.findMany({
      where: {
        navId: activeNav.id,
        deletedAt: null,
        isDeleted: false,
        status: 'ENABLED',
        isPublish: true,
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] }
        ]
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    });

    modules.push({
      moduleType: 'hero_banner',
      sortOrder: 4,
      data: {
        navId: getPublicId('top_nav', activeNav),
        banners: banners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          buttonText: b.buttonText,
          cover: b.cover,
          imageFocus: b.imageFocus,
          targetType: b.targetType,
          targetId: b.targetId,
          link: b.link,
          sortOrder: b.sortOrder
        }))
      }
    });

    const activeCategory = categoryIdParam
      ? dbCategories.find((category) => category.id === categoryIdParam)
      : undefined;

    if (categoryIdParam && activeCategory) {
      const categoryTree = await prisma.category.findMany({
        where: { type: dbCategoryType, deletedAt: null, status: 'ACTIVE' },
        select: { id: true, parentId: true }
      });
      const categoryIds = collectDescendantCategoryIds(categoryTree, categoryIdParam);
      const categoryResourceItems = await loadCategoryResourceItems(
        contentType as CategoryContentType,
        categoryIds
      );
      modules.push({
        moduleType: 'content_module',
        sortOrder: 5,
        data: [{
          id: -categoryIdParam,
          navId: getPublicId('top_nav', activeNav),
          moduleKey: `category-resource-${categoryIdParam}`,
          title: activeCategory.name,
          subtitle: null,
          displayStyle: contentType === 'recipe' ? 'RECIPE_LIST' : 'DOUBLE_COLUMN',
          contentType: contentType.toUpperCase(),
          contentSource: 'CATEGORY_RESOURCE',
          categoryId: categoryIdParam,
          sourceCategoryId: categoryIdParam,
          categoryName: activeCategory.name,
          displayCount: categoryResourceItems.length,
          showMore: false,
          showTitle: false,
          moreLink: null,
          sortOrder: 0,
          status: 'ENABLED',
          items: categoryResourceItems
        }]
      });
    } else if (pageParam === 'category') {
      const categoryIds = await collectCategoryTypeIds(dbCategoryType);
      const categoryResourceItems = categoryIds.length
        ? await loadCategoryResourceItems(contentType as CategoryContentType, categoryIds)
        : [];
      modules.push({
        moduleType: 'content_module',
        sortOrder: 5,
        data: [{
          id: -1,
          navId: getPublicId('top_nav', activeNav),
          moduleKey: `category-recommend-${contentType}`,
          title: '推荐',
          subtitle: null,
          displayStyle: contentType === 'recipe' ? 'RECIPE_LIST' : 'DOUBLE_COLUMN',
          contentType: contentType.toUpperCase(),
          contentSource: 'CATEGORY_RESOURCE',
          categoryId: null,
          sourceCategoryId: null,
          categoryName: null,
          displayCount: categoryResourceItems.length,
          showMore: false,
          showTitle: false,
          moreLink: null,
          sortOrder: 0,
          status: 'ENABLED',
          items: categoryResourceItems
        }]
      });
    } else {
      const contentModules = await prisma.contentModule.findMany({
        where: { navId: activeNav.id, status: 'ENABLED', categoryId: null },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
      });

      const resolvedModules = await Promise.all(contentModules.map(serializeModuleForApp));
      modules.push({ moduleType: 'content_module', sortOrder: 5, data: resolvedModules });
    }
  } else {
    modules.push({
      moduleType: 'hero_banner',
      sortOrder: 4,
      data: { navId: null, banners: [] }
    });
    modules.push({
      moduleType: 'content_module',
      sortOrder: 5,
      data: []
    });
  }

  res.json(ok(modules));
});
