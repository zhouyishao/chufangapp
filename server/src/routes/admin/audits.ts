import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../prisma';
import { HttpError } from '../../http/errors';
import { requireAdminAuth } from '../../http/middleware/admin-auth';
import { ok, type PageResult } from '../../http/response';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  type: z.enum(['RECIPE', 'INGREDIENT', 'POST', 'COMMENT', 'REPORT']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  keyword: z.string().trim().optional()
});

const mapAuditStatusTone = (auditStatus: string): 'orange' | 'green' | 'red' | 'gray' => {
  switch (auditStatus) {
    case 'PENDING': return 'orange';
    case 'APPROVED': return 'green';
    case 'REJECTED': return 'red';
    default: return 'gray';
  }
};

export const adminAuditsRouter = Router();

adminAuditsRouter.get('/', requireAdminAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('参数错误', 400, 400);
  const { page, pageSize, type, status, keyword } = parsed.data;

  const results: {
    id: string;
    bizId: number;
    type: string;
    title: string;
    submitter: string;
    auditStatus: string;
    statusTone: string;
    cover: string | null;
    description: string | null;
    rejectReason: string | null;
    submittedAt: string;
  }[] = [];
  let total = 0;

  const includeRecipe = !type || type === 'RECIPE';
  const includeIngredient = !type || type === 'INGREDIENT';

  if (includeRecipe) {
    const recipeWhere: Record<string, unknown> = { deletedAt: null };
    if (status) recipeWhere.auditStatus = status;
    else recipeWhere.auditStatus = { not: 'DRAFT' };
    if (keyword) {
      recipeWhere.OR = [
        { title: { contains: keyword, mode: 'insensitive' as const } },
        { description: { contains: keyword, mode: 'insensitive' as const } }
      ];
    }

    const [recipeList, recipeTotal] = await Promise.all([
      prisma.recipe.findMany({
        where: recipeWhere,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        include: { category: { select: { id: true, name: true, type: true } } }
      }),
      prisma.recipe.count({ where: recipeWhere })
    ]);

    recipeList.forEach((recipe) => {
      results.push({
        id: `recipe-${recipe.id}`,
        bizId: recipe.id,
        type: 'RECIPE',
        title: recipe.title,
        submitter: '管理员',
        auditStatus: recipe.auditStatus,
        statusTone: mapAuditStatusTone(recipe.auditStatus),
        cover: recipe.cover,
        description: recipe.description,
        rejectReason: recipe.rejectReason,
        submittedAt: recipe.updatedAt.toISOString()
      });
    });
    total += recipeTotal;
  }

  if (includeIngredient) {
    const ingredientWhere: Record<string, unknown> = { deletedAt: null };
    if (status) ingredientWhere.auditStatus = status;
    else ingredientWhere.auditStatus = { not: 'APPROVED' };
    if (keyword) {
      ingredientWhere.OR = [
        { name: { contains: keyword, mode: 'insensitive' as const } }
      ];
    }

    const [ingredientList, ingredientTotal] = await Promise.all([
      prisma.ingredient.findMany({
        where: ingredientWhere,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }]
      }),
      prisma.ingredient.count({ where: ingredientWhere })
    ]);

    ingredientList.forEach((ingredient) => {
      results.push({
        id: `ingredient-${ingredient.id}`,
        bizId: ingredient.id,
        type: 'INGREDIENT',
        title: ingredient.name,
        submitter: '管理员',
        auditStatus: ingredient.auditStatus,
        statusTone: mapAuditStatusTone(ingredient.auditStatus),
        cover: ingredient.cover,
        description: null,
        rejectReason: null,
        submittedAt: ingredient.updatedAt.toISOString()
      });
    });
    total += ingredientTotal;
  }

  results.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const start = (page - 1) * pageSize;
  const pagedList = results.slice(start, start + pageSize);

  const data: PageResult<(typeof pagedList)[number]> = {
    list: pagedList,
    total: results.length,
    page,
    pageSize
  };
  res.json(ok(data));
});
