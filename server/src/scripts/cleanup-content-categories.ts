import { prisma } from '../prisma';
import { buildCategoryMetrics, type CategoryMetric } from '../services/admin-category-metrics';

const applyChanges = process.argv.includes('--apply');

const explicitCandidates = new Set([
  'RECIPE:Chicken',
  'RECIPE:E2E菜谱',
  'INGREDIENT:水果',
  'INGREDIENT:酒水饮品',
  'INGREDIENT:应季食材',
  'INGREDIENT:时令蔬菜',
  'INGREDIENT:E2E食材',
  'INGREDIENT:菌菇类',
  'INGREDIENT:干货',
  'INGREDIENT:生禽',
  'INGREDIENT:水产',
  'SEASONING:基础调味',
  'SEASONING:酱料',
  'SEASONING:香辛料',
  'SEASONING:复合调味',
  'SEASONING:腌制调料',
  'SEASONING:烘焙调料',
  'SEASONING:基础调料',
  'SEASONING:调料',
]);

const groupCountMap = (rows: Array<{ categoryId: number | null; _count: { id: number } }>) => new Map(
  rows.flatMap((row) => row.categoryId == null ? [] : [[row.categoryId, row._count.id] as const]),
);

const main = async () => {
  const [categories, publicRecipes, publicIngredients, publicBeverages] = await Promise.all([
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, type: true, name: true, parentId: true, isPublish: true },
      orderBy: [{ type: 'asc' }, { sort: 'desc' }, { id: 'asc' }],
    }),
    prisma.recipe.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true, auditStatus: 'APPROVED' },
      _count: { id: true },
    }),
    prisma.ingredient.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true },
      _count: { id: true },
    }),
    prisma.beverage.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null, status: 'ACTIVE', isPublish: true },
      _count: { id: true },
    }),
  ]);

  const publicMaps = {
    RECIPE: groupCountMap(publicRecipes),
    INGREDIENT: groupCountMap(publicIngredients),
    FRUIT: groupCountMap(publicIngredients),
    SEASONING: groupCountMap(publicIngredients),
    COCKTAIL: groupCountMap(publicBeverages),
    BEVERAGE: groupCountMap(publicBeverages),
  };
  const metrics = new Map<number, CategoryMetric>();
  for (const type of Object.keys(publicMaps) as Array<keyof typeof publicMaps>) {
    const nodes = categories.filter((category) => category.type === type);
    for (const [id, metric] of buildCategoryMetrics(nodes, new Map(), publicMaps[type])) {
      metrics.set(id, metric);
    }
  }

  const candidates = categories.filter((category) => {
    if (!category.isPublish) return false;
    const publicContentCount = metrics.get(category.id)?.publicContentCount ?? 0;
    const isEmptyPublishedCategory = publicContentCount === 0;
    return isEmptyPublishedCategory || explicitCandidates.has(`${category.type}:${category.name}`);
  });

  const preview = candidates.map((category) => ({
    id: category.id,
    type: category.type,
    name: category.name,
    publicContentCount: metrics.get(category.id)?.publicContentCount ?? 0,
    action: 'HIDE' as const,
  }));
  console.log(JSON.stringify(preview, null, 2));

  const blocked = preview.filter((item) => item.publicContentCount !== 0);
  if (blocked.length > 0) {
    throw new Error(`公开内容不为 0，已取消整理：${blocked.map((item) => `${item.type}:${item.name}`).join('、')}`);
  }

  if (!applyChanges) {
    console.log(`预览完成，共 ${preview.length} 个候选；未修改数据库。`);
    return;
  }

  if (preview.length === 0) {
    console.log('没有需要整理的已发布分类。');
    return;
  }

  await prisma.$transaction(preview.map((item) => prisma.category.update({
    where: { id: item.id },
    data: { isPublish: false },
  })));
  console.log(`整理完成，已将 ${preview.length} 个分类设为 App 隐藏。`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
