import { Router } from 'express';

import { prisma } from '../../prisma';
import { ok } from '../../http/response';

export const apiHomeRouter = Router();

apiHomeRouter.get('/', async (_req, res) => {
  const [recommendRecipes, recommendIngredients, recipeCategories, ingredientCategories] =
    await Promise.all([
      prisma.recipe.findMany({
        where: { deletedAt: null, isPublish: true, status: 'ACTIVE', isRecommend: true },
        orderBy: [{ sort: 'desc' }, { id: 'desc' }],
        take: 10,
        select: {
          id: true,
          title: true,
          subtitle: true,
          cover: true,
          description: true,
          cookTime: true,
          difficulty: true,
          viewCount: true,
          favoriteCount: true,
          updatedAt: true
        }
      }),
      prisma.ingredient.findMany({
        where: { deletedAt: null, isPublish: true, status: 'ACTIVE', isRecommend: true },
        orderBy: [{ sort: 'desc' }, { id: 'desc' }],
        take: 10,
        select: {
          id: true,
          name: true,
          cover: true,
          seasonMonth: true,
          currentPrice: true,
          priceUnit: true,
          updatedAt: true
        }
      }),
      prisma.category.findMany({
        where: { deletedAt: null, isPublish: true, status: 'ACTIVE', type: 'RECIPE' },
        orderBy: [{ sort: 'desc' }, { id: 'desc' }],
        take: 50
      }),
      prisma.category.findMany({
        where: { deletedAt: null, isPublish: true, status: 'ACTIVE', type: 'INGREDIENT' },
        orderBy: [{ sort: 'desc' }, { id: 'desc' }],
        take: 50
      })
    ]);

  res.json(
    ok({
      recommendRecipes,
      recommendIngredients,
      recipeCategories,
      ingredientCategories
    })
  );
});

