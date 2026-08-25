import { prisma } from '../src/prisma';
import type { Prisma } from '@prisma/client';
import { containsChineseText, normalizeImportedRecipeTitle } from '../src/services/resource-import/chinese-recipe-policy';
import { getRecipeProviderRole } from '../src/services/resource-import/recipe-provider-policy';

const apply = process.argv.includes('--apply');
const TEST_TITLE = /(?:E2E|测试|^\d+$)/i;
const OVERSEAS_OR_TEST_PROVIDER_CODES = ['themealdb_recipe', 'mock_recipe'];

const refreshAffectedBatchStats = async (tx: Prisma.TransactionClient, importIds: number[]) => {
  if (importIds.length === 0) return;

  const batches = await tx.resourceImportBatch.findMany({
    where: { id: { in: importIds } },
    select: { id: true, items: { select: { status: true } } }
  });

  await Promise.all(batches.map(async (batch) => {
    const totalCount = batch.items.length;
    const successCount = batch.items.filter((item) => item.status === 'IMPORTED').length;
    const failedCount = batch.items.filter((item) => item.status === 'FAILED').length;
    const pendingCount = batch.items.filter((item) => item.status === 'PENDING').length;

    await tx.resourceImportBatch.update({
      where: { id: batch.id },
      data: {
        totalCount,
        successCount,
        failedCount,
        status: pendingCount === 0 ? 'COMPLETED' : 'PENDING',
        finishedAt: pendingCount === 0 ? new Date() : null
      }
    });
  }));
};

const main = async () => {
  const [recipes, stagedItems] = await Promise.all([
    prisma.recipe.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true }
    }),
    prisma.resourceImportItem.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        batch: {
          is: {
            importType: 'RECIPE',
            provider: { is: { providerCode: { in: OVERSEAS_OR_TEST_PROVIDER_CODES } } }
          }
        }
      },
      select: {
        id: true,
        importId: true,
        batch: { select: { provider: { select: { providerCode: true } } } }
      }
    })
  ]);

  const recipesToHide = recipes.filter((recipe) => {
    const normalizedTitle = normalizeImportedRecipeTitle(recipe.title);
    return TEST_TITLE.test(recipe.title) || !containsChineseText(normalizedTitle);
  });
  const overseasItems = stagedItems.filter((item) => {
    const providerCode = item.batch.provider?.providerCode;
    const role = providerCode ? getRecipeProviderRole(providerCode) : null;
    return role === 'OVERSEAS' || role === 'TEST';
  });
  const affectedBatchIds = [...new Set(overseasItems.map((item) => item.importId))];

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    recipesToHide: recipesToHide.map((item) => ({ id: item.id, title: item.title })),
    importItemsToIgnore: overseasItems.map((item) => item.id)
  }, null, 2));

  if (!apply) return;

  await prisma.$transaction(async (tx) => {
    if (recipesToHide.length > 0) {
      await tx.recipe.updateMany({
        where: { id: { in: recipesToHide.map((item) => item.id) } },
        data: {
          isPublish: false,
          rejectReason: '中国菜谱资源治理：海外、英文或测试内容已隐藏'
        }
      });
    }

    if (overseasItems.length > 0) {
      await tx.resourceImportItem.updateMany({
        where: { id: { in: overseasItems.map((item) => item.id) } },
        data: {
          status: 'IGNORED',
          errorMessage: '海外或测试菜谱不进入中国菜谱库',
          filterCode: 'SOURCE_NOT_ALLOWED'
        }
      });
    }

    await refreshAffectedBatchStats(tx, affectedBatchIds);
  });
};

main()
  .catch(() => {
    console.error('中国菜谱历史资源修复未完成：无法读取或更新数据库。请确认本地数据库连接后重试。');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
