export type RecipeIngredientBackfillRow = {
  id: number;
  name: string;
};

export type IngredientBackfillRow = {
  id: number;
  name: string;
  transparentImage: string | null;
};

type BackfillLink = {
  recipeIngredientId: number;
  ingredientId: number;
  missingTransparentImage: boolean;
};

type BackfillSkip = {
  recipeIngredientId: number;
  name: string;
  reason: 'NO_MATCH' | 'MULTIPLE_MATCHES';
};

export const normalizeIngredientName = (value: string) =>
  value.trim().replace(/\s+/g, '').toLocaleLowerCase('zh-CN');

export const planRecipeIngredientBackfill = (
  rows: RecipeIngredientBackfillRow[],
  ingredients: IngredientBackfillRow[]
) => {
  const ingredientsByNormalizedName = new Map<string, IngredientBackfillRow[]>();
  for (const ingredient of ingredients) {
    const normalizedName = normalizeIngredientName(ingredient.name);
    ingredientsByNormalizedName.set(normalizedName, [
      ...(ingredientsByNormalizedName.get(normalizedName) ?? []),
      ingredient
    ]);
  }

  const links: BackfillLink[] = [];
  const skipped: BackfillSkip[] = [];
  for (const row of rows) {
    const matches = ingredientsByNormalizedName.get(normalizeIngredientName(row.name)) ?? [];
    if (matches.length !== 1) {
      skipped.push({
        recipeIngredientId: row.id,
        name: row.name,
        reason: matches.length === 0 ? 'NO_MATCH' : 'MULTIPLE_MATCHES'
      });
      continue;
    }

    const match = matches[0];
    if (!match) continue;
    links.push({
      recipeIngredientId: row.id,
      ingredientId: match.id,
      missingTransparentImage: !match.transparentImage?.trim()
    });
  }

  return { links, skipped };
};

export const hasSameRecipeIngredientBackfillLinks = (
  plannedLinks: BackfillLink[],
  currentLinks: BackfillLink[]
) => {
  if (plannedLinks.length !== currentLinks.length) return false;

  const currentIngredientIdsByRecipeIngredientId = new Map(
    currentLinks.map((link) => [link.recipeIngredientId, link.ingredientId])
  );
  return plannedLinks.every(
    (link) => currentIngredientIdsByRecipeIngredientId.get(link.recipeIngredientId) === link.ingredientId
  );
};

const main = async () => {
  const execute = process.argv.includes('--execute');
  const { prisma } = await import('../prisma');

  try {
    const [rows, ingredients] = await Promise.all([
      prisma.recipeIngredient.findMany({
        where: { deletedAt: null, ingredientId: null },
        select: { id: true, name: true },
        orderBy: { id: 'asc' }
      }),
      prisma.ingredient.findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        select: { id: true, name: true, transparentImage: true },
        orderBy: { id: 'asc' }
      })
    ]);
    const plan = planRecipeIngredientBackfill(rows, ingredients);
    const missingTransparentImage = plan.links.filter((link) => link.missingTransparentImage).length;

    console.log(`mode: ${execute ? 'execute' : 'dry-run'}`);
    console.log(`planned: ${plan.links.length}`);
    console.log(`missing-transparent-image: ${missingTransparentImage}`);
    console.log(`skipped: ${plan.skipped.length}`);

    if (!execute || plan.links.length === 0) return;

    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`LOCK TABLE "ingredients" IN SHARE ROW EXCLUSIVE MODE`;
      const [currentRows, currentIngredients] = await Promise.all([
        transaction.recipeIngredient.findMany({
          where: {
            id: { in: plan.links.map((link) => link.recipeIngredientId) },
            deletedAt: null,
            ingredientId: null
          },
          select: { id: true, name: true },
          orderBy: { id: 'asc' }
        }),
        transaction.ingredient.findMany({
          where: { deletedAt: null, status: 'ACTIVE' },
          select: { id: true, name: true, transparentImage: true },
          orderBy: { id: 'asc' }
        })
      ]);
      const currentPlan = planRecipeIngredientBackfill(currentRows, currentIngredients);
      if (!hasSameRecipeIngredientBackfillLinks(plan.links, currentPlan.links)) {
        throw new Error('候选食材或用料状态已变化，已取消补绑。');
      }

      for (const link of plan.links) {
        const result = await transaction.recipeIngredient.updateMany({
          where: { id: link.recipeIngredientId, deletedAt: null, ingredientId: null },
          data: { ingredientId: link.ingredientId }
        });
        if (result.count !== 1) {
          throw new Error(`用料 #${link.recipeIngredientId} 状态已变化，已取消补绑。`);
        }
      }
    }, { isolationLevel: 'Serializable' });
  } finally {
    await prisma.$disconnect();
  }
};

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
