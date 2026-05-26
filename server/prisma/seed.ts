import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';

import { CategoryType, PrismaClient, TagScope, type Prisma } from '@prisma/client';

const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chufangapp?schema=public';
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url })
});

const adminPassword = 'admin123';

const ensureRole = async (data: Prisma.RoleCreateInput) => {
  return prisma.role.upsert({
    where: { name: data.name },
    create: data,
    update: {}
  });
};

const ensureAdmin = async (username: string, password: string, nickname: string) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.admin.upsert({
    where: { username },
    create: { username, passwordHash, nickname, auditStatus: 'APPROVED' },
    update: { nickname }
  });
};

const ensureCategory = async (type: CategoryType, name: string, sort = 0) => {
  return prisma.category.upsert({
    where: { type_name: { type, name } },
    create: { type, name, sort, isPublish: true },
    update: { sort }
  });
};

const replaceByTitle = async <T>(
  findOrCreate: () => Promise<T>,
  cleanup: () => Promise<unknown>
) => {
  await cleanup();
  return findOrCreate();
};

const main = async () => {
  const superAdminRole = await ensureRole({ name: 'SUPER_ADMIN', description: 'Super admin' });
  const admin = await ensureAdmin('admin', adminPassword, '管理员');

  await prisma.adminRole.upsert({
    where: { adminId_roleId: { adminId: admin.id, roleId: superAdminRole.id } },
    create: { adminId: admin.id, roleId: superAdminRole.id },
    update: {}
  });

  const ingredientCategory = await ensureCategory('INGREDIENT', '应季食材', 100);
  const recipeCategory = await ensureCategory('RECIPE', '家常菜', 100);

  await ensureCategory('RECIPE', '快手菜', 90);
  await ensureCategory('RECIPE', '早餐', 80);
  await ensureCategory('RECIPE', '晚餐', 80);
  await ensureCategory('RECIPE', '减脂餐', 70);
  await ensureCategory('RECIPE', '下饭菜', 70);
  await ensureCategory('INGREDIENT', '蔬菜', 90);
  await ensureCategory('INGREDIENT', '肉禽蛋', 80);
  await ensureCategory('INGREDIENT', '水产海鲜', 80);
  await ensureCategory('INGREDIENT', '豆制品', 70);
  await ensureCategory('INGREDIENT', '主食粮油', 70);
  await ensureCategory('SEASONING', '基础调料', 80);
  await ensureCategory('FRUIT', '时令水果', 80);

  const ensureTag = async (scope: TagScope, name: string, sort = 0) => {
    return prisma.tag.upsert({
      where: { scope_name: { scope, name } },
      create: { scope, name, sort },
      update: { sort }
    });
  };

  await ensureTag('TASTE', '清淡', 100);
  await ensureTag('TASTE', '香辣', 90);
  await ensureTag('TASTE', '酸甜', 90);
  await ensureTag('TASTE', '咸鲜', 80);
  await ensureTag('TASTE', '鲜香', 80);
  await ensureTag('RECIPE', '快手', 100);
  await ensureTag('RECIPE', '低脂', 90);
  await ensureTag('RECIPE', '高蛋白', 80);
  await ensureTag('RECIPE', '家常', 100);
  await ensureTag('METHOD', '炒', 100);
  await ensureTag('METHOD', '蒸', 90);
  await ensureTag('METHOD', '煮', 90);
  await ensureTag('METHOD', '炖', 80);
  await ensureTag('METHOD', '烤', 80);
  await ensureTag('METHOD', '凉拌', 80);
  await ensureTag('CROWD', '儿童', 80);
  await ensureTag('CROWD', '老人', 70);

  await prisma.cuisine.upsert({
    where: { name: '川菜' },
    create: { name: '川菜', description: '麻辣鲜香，百菜百味。', sort: 90, isPublish: true },
    update: {}
  });
  await prisma.cuisine.upsert({
    where: { name: '粤菜' },
    create: { name: '粤菜', description: '清而不淡，鲜而不俗。', sort: 90, isPublish: true },
    update: {}
  });
  await prisma.cuisine.upsert({
    where: { name: '湘菜' },
    create: { name: '湘菜', description: '香辣浓郁，口味多变。', sort: 80, isPublish: true },
    update: {}
  });
  await prisma.cuisine.upsert({
    where: { name: '家常菜' },
    create: { name: '家常菜', description: '做法简单，适合日常。', sort: 80, isPublish: true },
    update: {}
  });

  const channels = [
    { name: '推荐', code: 'recommend', position: '首页顶部', sort: 100 },
    { name: '家常菜', code: 'home_cooking', position: '首页栏目', sort: 90 },
    { name: '快手菜', code: 'quick_meals', position: '首页栏目', sort: 80 },
    { name: '减脂', code: 'diet', position: '首页栏目', sort: 70 },
    { name: '早餐', code: 'breakfast', position: '首页栏目', sort: 70 },
    { name: '晚餐', code: 'dinner', position: '首页栏目', sort: 60 }
  ];
  for (const ch of channels) {
    await prisma.channel.upsert({
      where: { code: ch.code },
      create: ch,
      update: { name: ch.name, position: ch.position, sort: ch.sort }
    });
  }

  // Look up tags for linking after recipe creation
  const [tasteTag, recipeTag, methodTag] = await Promise.all([
    prisma.tag.findFirst({ where: { scope: 'TASTE', name: '酸甜' } }),
    prisma.tag.findFirst({ where: { scope: 'RECIPE', name: '家常' } }),
    prisma.tag.findFirst({ where: { scope: 'METHOD', name: '炖' } })
  ]);

  const cuisine = await prisma.cuisine.upsert({
    where: { name: '江浙家常' },
    create: {
      name: '江浙家常',
      description: '清爽、鲜甜、适合家庭日常餐桌。',
      sort: 90,
      isPublish: true
    },
    update: { sort: 90, isPublish: true }
  });

  const user = await prisma.user.upsert({
    where: { phone: '18800000000' },
    create: {
      phone: '18800000000',
      nickname: '家庭主理人',
      avatar: null,
      sourceType: 'USER'
    },
    update: { nickname: '家庭主理人' }
  });

  const ingredient = await prisma.ingredient.upsert({
    where: { name: '番茄' },
    create: {
      name: '番茄',
      categoryId: ingredientCategory.id,
      cover: null,
      seasonMonth: '5,6,7,8,9',
      currentPrice: 6,
      priceUnit: '斤',
      isPublish: true,
      isRecommend: true
    },
    update: { isPublish: true, isRecommend: true }
  });

  await prisma.ingredientTip.deleteMany({ where: { ingredientId: ingredient.id } });
  await prisma.ingredientTip.createMany({
    data: [
      {
        ingredientId: ingredient.id,
        title: '看颜色和手感',
        content: '成熟番茄颜色均匀，手感微微软但不塌陷。',
        sort: 2,
        isPublish: true
      },
      {
        ingredientId: ingredient.id,
        title: '闻蒂部香气',
        content: '蒂部有自然清香，通常成熟度更好。',
        sort: 1,
        isPublish: true
      }
    ]
  });

  await prisma.seasonalFood.deleteMany({ where: { name: '番茄' } });
  await prisma.seasonalFood.create({
    data: {
      name: '番茄',
      ingredientId: ingredient.id,
      month: 6,
      reason: '初夏番茄酸甜适口，适合做汤、炖菜和凉拌。',
      sort: 100,
      isPublish: true,
      isRecommend: true
    }
  });

  const recipeTitle = '番茄牛腩';
  const existingRecipes = await prisma.recipe.findMany({
    where: { title: recipeTitle, deletedAt: null },
    orderBy: [{ id: 'asc' }],
    select: { id: true }
  });
  const existingRecipe = existingRecipes[0] ?? null;

  const recipeData: Prisma.RecipeUncheckedUpdateInput = {
    title: recipeTitle,
    subtitle: '酸甜浓郁',
    cover: null,
    description: '家常炖菜，番茄的酸甜与牛腩的醇厚。',
    categoryId: recipeCategory.id,
    cuisineId: cuisine.id,
    cookTime: 70,
    servings: 2,
    isDraft: false,
    isPublish: true,
    isRecommend: true,
    auditStatus: 'APPROVED',
    viewCount: 12,
    favoriteCount: 3
  };

  const steps = [
    { sortIndex: 1, description: '牛腩焯水，冲洗干净。' },
    { sortIndex: 2, description: '番茄炒出沙，加入牛腩炖煮。' },
    { sortIndex: 3, description: '收汁调味，出锅。' }
  ];
  const recipeIngredients = [
    { sortIndex: 1, ingredientId: ingredient.id, name: '番茄', amount: '3个' },
    { sortIndex: 2, ingredientId: null, name: '牛腩', amount: '500g' }
  ];

  await prisma.$transaction(async (tx) => {
    if (existingRecipes.length > 1) {
      const extraIds = existingRecipes.slice(1).map((r) => r.id);
      await tx.recipeStep.deleteMany({ where: { recipeId: { in: extraIds } } });
      await tx.recipeIngredient.deleteMany({ where: { recipeId: { in: extraIds } } });
      await tx.recipe.deleteMany({ where: { id: { in: extraIds } } });
    }

    if (existingRecipe) {
      await tx.recipeStep.deleteMany({ where: { recipeId: existingRecipe.id } });
      await tx.recipeIngredient.deleteMany({ where: { recipeId: existingRecipe.id } });
      await tx.recipe.update({ where: { id: existingRecipe.id }, data: recipeData });
      await tx.recipeStep.createMany({ data: steps.map((s) => ({ ...s, recipeId: existingRecipe.id })) });
      await tx.recipeIngredient.createMany({
        data: recipeIngredients.map((i) => ({ ...i, recipeId: existingRecipe.id }))
      });
      return;
    }

    const created = await tx.recipe.create({ data: recipeData as Prisma.RecipeUncheckedCreateInput });
    await tx.recipeStep.createMany({ data: steps.map((s) => ({ ...s, recipeId: created.id })) });
    await tx.recipeIngredient.createMany({
      data: recipeIngredients.map((i) => ({ ...i, recipeId: created.id }))
    });
  });

  const recipe = await prisma.recipe.findFirstOrThrow({ where: { title: recipeTitle, deletedAt: null } });

  if (tasteTag && recipeTag && methodTag) {
    for (const tagId of [tasteTag.id, recipeTag.id, methodTag.id]) {
      await prisma.recipeTag.upsert({
        where: { recipeId_tagId: { recipeId: recipe.id, tagId } },
        create: { recipeId: recipe.id, tagId },
        update: {}
      });
    }
  }

  await replaceByTitle(
    () =>
      prisma.recommendation.create({
        data: {
          title: '今日推荐：番茄牛腩',
          description: '酸甜开胃，适合一家人的晚餐主菜。',
          targetType: 'RECIPE',
          recipeId: recipe.id,
          sort: 100,
          isPublish: true,
          isRecommend: true
        }
      }),
    () => prisma.recommendation.deleteMany({ where: { title: '今日推荐：番茄牛腩' } })
  );

  await replaceByTitle(
    () =>
      prisma.banner.create({
        data: {
          title: '初夏家常菜',
          image: '/static/images/banner-seasonal.svg',
          targetType: 'RECIPE',
          recipeId: recipe.id,
          sort: 100,
          isPublish: true
        }
      }),
    () => prisma.banner.deleteMany({ where: { title: '初夏家常菜' } })
  );

  await prisma.menu.deleteMany({ where: { name: '家庭晚餐菜单' } });
  await prisma.menu.create({
    data: {
      name: '家庭晚餐菜单',
      scene: 'family-dinner',
      description: '一荤一素一汤的家庭晚餐组合。',
      sort: 100,
      isPublish: true,
      recipes: {
        create: [{ recipeId: recipe.id, sortIndex: 1 }]
      }
    }
  });

  await prisma.post.deleteMany({ where: { title: '今晚做了番茄牛腩' } });
  const post = await prisma.post.create({
    data: {
      userId: user.id,
      recipeId: recipe.id,
      title: '今晚做了番茄牛腩',
      content: '按菜谱炖出来很下饭，汤汁拌米饭刚好。',
      images: [],
      isPublish: true
    }
  });

  await prisma.comment.deleteMany({ where: { recipeId: recipe.id, content: '这道菜很适合周末做。' } });
  await prisma.comment.create({
    data: {
      userId: user.id,
      recipeId: recipe.id,
      postId: post.id,
      content: '这道菜很适合周末做。',
      isPublish: true
    }
  });

  await prisma.favorite.deleteMany({ where: { userId: user.id, recipeId: recipe.id } });
  await prisma.favorite.create({ data: { userId: user.id, recipeId: recipe.id } });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err: unknown) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
