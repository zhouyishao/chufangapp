import { Prisma, PrismaClient } from '@prisma/client';

import { createBusinessId, nextCodeFromItems } from '../../lib/business-id';
import type { NormalizedResourcePayload, ResourceImportType } from './types';

type DbClient = PrismaClient | Prisma.TransactionClient;

const normalizeName = (value: string) => value.trim();

const getCodes = async (db: DbClient, kind: 'recipe' | 'ingredient' | 'beverage' | 'category') => {
  if (kind === 'recipe') return db.recipe.findMany({ select: { code: true } });
  if (kind === 'ingredient') return db.ingredient.findMany({ select: { code: true } });
  if (kind === 'beverage') return db.beverage.findMany({ select: { code: true } });
  return db.category.findMany({ select: { code: true } });
};

export async function resolveCategoryId(db: DbClient, name: string | null | undefined, type: 'RECIPE' | 'INGREDIENT' | 'FRUIT' | 'SEASONING' | 'BEVERAGE'): Promise<number | null> {
  const normalizedName = normalizeName(String(name ?? ''));
  if (!normalizedName) return null;

  const existing = await db.category.findFirst({
    where: { name: { equals: normalizedName, mode: 'insensitive' }, type, deletedAt: null }
  });
  if (existing) return existing.id;

  const codes = await getCodes(db, 'category');
  const created = await db.category.create({
    data: {
      type,
      name: normalizedName,
      bizId: createBusinessId('category'),
      code: nextCodeFromItems('category', codes),
      sort: 0,
      sortOrder: 0,
      status: 'ACTIVE',
      isPublish: true
    }
  });
  return created.id;
}

export async function resolveCuisineId(db: DbClient, name: string | null | undefined): Promise<number | null> {
  const normalizedName = normalizeName(String(name ?? ''));
  if (!normalizedName) return null;
  const existing = await db.cuisine.findFirst({
    where: { name: { equals: normalizedName, mode: 'insensitive' } }
  });
  if (existing) return existing.id;
  const created = await db.cuisine.create({
    data: { name: normalizedName, description: '', sort: 0, isPublish: true }
  });
  return created.id;
}

export async function findDuplicateTargetId(
  db: DbClient,
  resourceType: ResourceImportType,
  mapped: NormalizedResourcePayload
): Promise<number | null> {
  const externalId = mapped.externalId?.trim() || null;
  const name = normalizeName(mapped.name);

  if (resourceType === 'RECIPE') {
    if (externalId && mapped.sourceName) {
      const existing = await db.recipe.findFirst({
        where: {
          importSourceType: 'PUBLIC_API',
          sourceName: mapped.sourceName,
          sourceRecipeId: externalId,
          deletedAt: null
        },
        select: { id: true }
      });
      return existing?.id ?? null;
    }
    const existing = await db.recipe.findFirst({
      where: { title: { equals: name, mode: 'insensitive' }, deletedAt: null },
      select: { id: true }
    });
    return existing?.id ?? null;
  }

  if (resourceType === 'BEVERAGE') {
    if (externalId && mapped.sourceName) {
      const existingBySource = await db.beverage.findFirst({
        where: {
          sourceName: mapped.sourceName,
          sourceExternalId: externalId,
          deletedAt: null
        },
        select: { id: true }
      });
      if (existingBySource) return existingBySource.id;
    }
    const existing = await db.beverage.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, deletedAt: null },
      select: { id: true }
    });
    return existing?.id ?? null;
  }

  const existing = await db.ingredient.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, deletedAt: null },
    select: { id: true }
  });
  return existing?.id ?? null;
}

export async function createOfficialRecord(
  db: DbClient,
  resourceType: ResourceImportType,
  mapped: NormalizedResourcePayload,
  importItemId: number,
  sourceName: string | null,
  sourceUrl: string | null
): Promise<number> {
  const titleOrName = mapped.title?.trim() || mapped.name.trim();

  if (resourceType === 'RECIPE') {
    const codes = await db.recipe.findMany({ select: { code: true } });
    const categoryId = await resolveCategoryId(db, mapped.categoryName, 'RECIPE');
    const cuisineId = await resolveCuisineId(db, mapped.cuisineName);
    const created = await db.recipe.create({
      data: {
        bizId: createBusinessId('recipe'),
        code: nextCodeFromItems('recipe', codes),
        title: titleOrName,
        subtitle: mapped.subtitle ?? null,
        description: mapped.description ?? null,
        cover: mapped.cover ?? null,
        cookTime: mapped.cookTime ?? null,
        servings: mapped.servings ?? null,
        calories: mapped.calories ?? null,
        difficulty: mapped.difficulty ?? null,
        taste: mapped.taste ?? null,
        scene: mapped.scene ?? null,
        tips: mapped.tips ?? null,
        categoryId,
        cuisineId,
        isDraft: false,
        isPublish: true,
        auditStatus: 'APPROVED',
        sourceType: 'IMPORT',
        sourceId: importItemId,
        importSourceType: 'PUBLIC_API',
        sourceName: sourceName ?? mapped.sourceName ?? null,
        sourceRecipeId: mapped.externalId ?? null,
        sourceUrl: sourceUrl ?? mapped.externalUrl ?? null,
        steps: {
          create: (mapped.steps ?? []).map((step, index) =>
            typeof step === 'string'
              ? { sortIndex: index + 1, description: step, sourceType: 'IMPORT', sourceId: importItemId }
              : {
                  sortIndex: step.sortIndex ?? index + 1,
                  description: step.description,
                  image: step.image ?? null,
                  sourceType: 'IMPORT',
                  sourceId: importItemId
                }
          )
        },
        ingredients: {
          create: (mapped.ingredients ?? []).map((ingredient, index) =>
            typeof ingredient === 'string'
              ? { sortIndex: index + 1, name: ingredient, sourceType: 'IMPORT', sourceId: importItemId }
              : {
                  sortIndex: ingredient.sortIndex ?? index + 1,
                  name: ingredient.name,
                  amount: ingredient.amount ?? null,
                  unit: ingredient.unit ?? null,
                  sourceType: 'IMPORT',
                  sourceId: importItemId
                }
          )
        }
      }
    });
    return created.id;
  }

  if (resourceType === 'BEVERAGE') {
    const codes = await db.beverage.findMany({ select: { code: true } });
    const categoryId = await resolveCategoryId(db, mapped.categoryName, 'BEVERAGE');
    const created = await db.beverage.create({
      data: {
        bizId: createBusinessId('beverage'),
        code: nextCodeFromItems('beverage', codes),
        name: titleOrName,
        coverImage: mapped.coverImage ?? null,
        categoryId,
        beverageType: mapped.beverageType ?? null,
        isAlcoholic: mapped.isAlcoholic ?? false,
        alcoholDegree: mapped.alcoholDegree ?? null,
        description: mapped.description ?? null,
        drinkType: mapped.drinkType ?? null,
        cocktailMethod: mapped.cocktailMethod ?? null,
        baseSpirit: mapped.baseSpirit ?? null,
        glassType: mapped.glassType ?? null,
        alcoholicType: mapped.alcoholicType ?? null,
        ingredients: mapped.ingredients ? (mapped.ingredients as Prisma.InputJsonValue) : Prisma.DbNull,
        measures: mapped.measures ? (mapped.measures as Prisma.InputJsonValue) : Prisma.DbNull,
        garnish: mapped.garnish ?? null,
        instructions: mapped.instructions ?? null,
        flavorTags: mapped.flavorTags ? (mapped.flavorTags as Prisma.InputJsonValue) : Prisma.DbNull,
        sceneTags: mapped.sceneTags ? (mapped.sceneTags as Prisma.InputJsonValue) : Prisma.DbNull,
        sourceName: sourceName ?? mapped.sourceName ?? null,
        sourceExternalId: mapped.externalId ?? null,
        rawJson: mapped.rawJson ? (mapped.rawJson as Prisma.InputJsonValue) : Prisma.DbNull,
        sourceType: 'IMPORT',
        sourceId: importItemId,
        isPublish: true,
        auditStatus: 'APPROVED'
      }
    });
    return created.id;
  }

  const codes = await db.ingredient.findMany({ select: { code: true } });
  const categoryType = resourceType === 'FRUIT' ? 'FRUIT' : resourceType === 'SEASONING' ? 'SEASONING' : 'INGREDIENT';
  const categoryId = await resolveCategoryId(db, mapped.categoryName ?? (resourceType === 'FRUIT' ? '水果' : resourceType === 'SEASONING' ? '调料' : '蔬菜'), categoryType);
  const created = await db.ingredient.create({
    data: {
      bizId: createBusinessId('ingredient'),
      code: nextCodeFromItems('ingredient', codes),
      name: titleOrName,
      cover: mapped.cover ?? null,
      categoryId,
      seasonMonth: mapped.seasonMonth ?? null,
      nutrition: mapped.nutrition ?? null,
      selectionTips: mapped.selectionTips ?? null,
      storageMethod: mapped.storageMethod ?? null,
      taboo: mapped.taboo ?? null,
      currentPrice: mapped.currentPrice ?? null,
      priceUnit: mapped.priceUnit ?? null,
      priceSource: mapped.priceSource ?? null,
      priceDate: mapped.priceDate ? new Date(mapped.priceDate) : null,
      isPublish: true,
      sourceType: 'IMPORT',
      sourceId: importItemId,
      auditStatus: 'APPROVED'
    }
  });
  return created.id;
}

export async function buildDuplicateFilterCode(
  resourceType: ResourceImportType,
  mapped: NormalizedResourcePayload,
  duplicateTargetId: number | null,
  externalId: string | null
): Promise<{ filterCode: string | null; errorMessage: string | null }> {
  if (duplicateTargetId) {
    return {
      filterCode: externalId ? 'DUPLICATE_EXTERNAL_ID' : 'DUPLICATE_NAME',
      errorMessage: externalId ? '数据重复: 该外部资源在正式库中已存在' : '数据重复: 该资源在正式库中已存在'
    };
  }
  return { filterCode: null, errorMessage: null };
}

export function buildRequestSnapshot(method: string, endpointUrl: string, dataPath: string, params: Record<string, unknown>, sourceName: string | null) {
  return {
    method,
    endpointUrl,
    dataPath,
    params,
    sourceName
  };
}
