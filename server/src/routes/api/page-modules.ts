import { Router } from 'express';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { ok } from '../../http/response';
import { buildPublicIdWhere, getPublicCode, getPublicId } from '../../lib/business-id';
import { serializeModuleForApp } from './app-home-shared';

const categoryContentTypeValues = ['recipe', 'ingredient', 'fruit', 'seasoning', 'beverage'] as const;

export const apiPageModulesRouter = Router();

apiPageModulesRouter.get('/page-modules', async (req, res) => {
  const pageParam = typeof req.query.page === 'string' ? req.query.page.trim() : 'home';
  const typeParam = typeof req.query.type === 'string' ? req.query.type.trim() : 'ingredient';
  const filterParam = typeof req.query.filter === 'string' ? req.query.filter.trim() : 'recommend';
  const categoryIdParam = typeof req.query.categoryId === 'string' ? Number(req.query.categoryId) : undefined;

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
  const categoryTypeMap: Record<string, string> = {
    recipe: 'RECIPE',
    ingredient: 'INGREDIENT',
    fruit: 'FRUIT',
    seasoning: 'SEASONING',
    beverage: 'BEVERAGE'
  };

  const dbCategoryType = categoryTypeMap[contentType] ?? 'INGREDIENT';
  const dbCategories = await prisma.category.findMany({
    where: { deletedAt: null, status: 'ACTIVE', isPublish: true, type: dbCategoryType as 'RECIPE' | 'INGREDIENT' | 'SEASONING' | 'FRUIT' | 'BEVERAGE' },
    orderBy: [{ sortOrder: 'desc' }, { id: 'asc' }],
    select: { id: true, name: true, type: true }
  });

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
      name: cat.name,
      key: cat.name,
      type: 'category',
      categoryId: cat.id
    });
  }

  modules.push({
    moduleType: 'category_filter',
    sortOrder: 3,
    data: {
      activeKey: filterParam,
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

    const contentModules = await prisma.contentModule.findMany({
      where: { navId: activeNav.id, status: 'ENABLED' },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    });

    if (contentModules.length > 0) {
      const resolvedModules = await Promise.all(contentModules.map(serializeModuleForApp));
      modules.push({
        moduleType: 'content_module',
        sortOrder: 5,
        data: resolvedModules
      });
    } else {
      modules.push({
        moduleType: 'content_module',
        sortOrder: 5,
        data: []
      });
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

  // 6. category_grid — 仅当后台配置了 FOUR_CARD_GRID 内容模块且来源为分类管理时才返回真实分类
  if (activeNav) {
    const gridModules = await prisma.contentModule.findMany({
      where: { navId: activeNav.id, status: 'ENABLED', displayStyle: 'FOUR_CARD_GRID' },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    });
    if (gridModules.length > 0) {
      // 只返回真实分类，不含「推荐」系统项
      const gridItems = categoryFilterItems.filter(item => item.type === 'category');
      modules.push({
        moduleType: 'category_grid',
        sortOrder: 6,
        data: {
          items: gridItems
        }
      });
    }
  }

  res.json(ok(modules));
});
