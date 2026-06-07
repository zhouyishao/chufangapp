import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';

import { CategoryType, PrismaClient, TagScope, type Prisma } from '@prisma/client';
import { createBusinessId, formatCode, type BusinessKind } from '../src/lib/business-id';

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

const nextCodeFrom = (kind: BusinessKind, rows: Array<{ code: string | null }>) => {
  const prefix = formatCode(kind, 1).slice(0, 2);
  const maxSerial = rows.reduce((max, row) => {
    const code = row.code ?? '';
    if (!code.startsWith(prefix)) return max;
    const serial = Number.parseInt(code.slice(prefix.length), 10);
    return Number.isFinite(serial) ? Math.max(max, serial) : max;
  }, 0);
  return formatCode(kind, maxSerial + 1);
};

const ensureCategory = async (type: CategoryType, name: string, sort = 0) => {
  const codes = await prisma.category.findMany({ select: { code: true } });
  return prisma.category.upsert({
    where: { type_name: { type, name } },
    create: { type, name, sort, sortOrder: sort, isPublish: true, bizId: createBusinessId('category'), code: nextCodeFrom('category', codes) },
    update: { sort, sortOrder: sort }
  });
};

const identityFor = async (kind: BusinessKind, codes: () => Promise<Array<{ code: string | null }>>) => ({
  bizId: createBusinessId(kind),
  code: nextCodeFrom(kind, await codes())
});

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

  const recipeCategories = ['快手菜', '早餐', '午餐', '晚餐', '汤羹', '凉菜', '主食', '下饭菜', '宴客菜', '减脂餐', '儿童餐', '老人餐', '烘焙'];
  for (const [index, name] of recipeCategories.entries()) await ensureCategory('RECIPE', name, 95 - index);
  const ingredientCategories = ['时令蔬菜', '肉禽蛋', '水产海鲜', '豆制品', '菌菇类', '水果', '主食米面', '调味料', '干货', '奶制品', '酒水饮品'];
  for (const [index, name] of ingredientCategories.entries()) await ensureCategory('INGREDIENT', name, 95 - index);
  await ensureCategory('INGREDIENT', '蔬菜', 90);
  await ensureCategory('INGREDIENT', '生禽', 86);
  await ensureCategory('INGREDIENT', '水产', 84);
  await ensureCategory('INGREDIENT', '调料', 82);
  await ensureCategory('SEASONING', '基础调料', 80);
  await ensureCategory('FRUIT', '时令水果', 80);
  const beverageCategory = await ensureCategory('BEVERAGE', '酒水饮品', 100);

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

  const homeTopNavSeeds = [
    { name: '推荐', alias: '系统推荐', navType: 'system_recommend', relationName: '推荐内容池', sortOrder: 1, isDefault: true },
    { name: '家常菜', alias: '每日家常', navType: 'recipe_category', relationName: '家常菜', sortOrder: 2, isDefault: false },
    { name: '快手菜', alias: '快速上桌', navType: 'recipe_category', relationName: '快手菜', sortOrder: 3, isDefault: false }
  ];
  for (const item of homeTopNavSeeds) {
    const relationCategory = item.navType === 'recipe_category' ? await prisma.category.findFirst({ where: { type: 'RECIPE', name: item.relationName, deletedAt: null } }) : null;
    const existing = await prisma.homeTopNav.findFirst({ where: { name: item.name, displayPosition: 'home_top', deletedAt: null } });
    const nav = existing
      ? await prisma.homeTopNav.update({
          where: { id: existing.id },
          data: { alias: item.alias, navType: item.navType, sortOrder: item.sortOrder, status: 'online', isDefault: item.isDefault }
        })
      : await prisma.homeTopNav.create({
          data: {
            ...(await identityFor('top_nav', () => prisma.homeTopNav.findMany({ select: { code: true } }))),
            name: item.name,
            alias: item.alias,
            navType: item.navType,
            sortOrder: item.sortOrder,
            status: 'online',
            isDefault: item.isDefault,
            isFixed: true,
            showMoreEntry: false,
            description: `${item.name}首页顶部导航`
          }
        });
    if (item.isDefault) await prisma.homeTopNav.updateMany({ where: { id: { not: nav.id }, displayPosition: 'home_top', deletedAt: null }, data: { isDefault: false } });
    await prisma.homeTopNavStyle.upsert({
      where: { navId: nav.id },
      create: { navId: nav.id, navStyle: 'text_tab', activeStyle: 'underline', layoutMode: 'fixed', textColor: '#666666', activeTextColor: '#7A8B6F' },
      update: { activeStyle: 'underline', textColor: '#666666', activeTextColor: '#7A8B6F' }
    });
    await prisma.homeTopNavContentRule.upsert({
      where: { navId: nav.id },
      create: { navId: nav.id, sourceType: item.navType === 'system_recommend' ? 'recommend_pool' : 'category', displayCount: 6, sortRule: 'comprehensive', moreButtonText: '查看更多' },
      update: { sourceType: item.navType === 'system_recommend' ? 'recommend_pool' : 'category', displayCount: 6, sortRule: 'comprehensive', moreButtonText: '查看更多' }
    });
    await prisma.homeTopNavRelation.deleteMany({ where: { navId: nav.id } });
    await prisma.homeTopNavRelation.create({
      data: {
        navId: nav.id,
        relationType: item.navType === 'system_recommend' ? 'recommend_pool' : 'category',
        relationId: relationCategory?.bizId ?? String(relationCategory?.id ?? 'recommend_pool'),
        relationName: item.relationName
      }
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
      ...(await identityFor('user', () => prisma.user.findMany({ select: { code: true } }))),
      phone: '18800000000',
      nickname: '家庭主理人',
      avatar: null,
      sourceType: 'USER'
    },
    update: { nickname: '家庭主理人' }
  });

  const familyUsers = [
    user,
    await prisma.user.upsert({
      where: { phone: '13812341234' },
      create: { ...(await identityFor('user', () => prisma.user.findMany({ select: { code: true } }))), phone: '13812341234', nickname: '小美', avatar: null, gender: 'female', sourceType: 'USER' },
      update: { nickname: '小美', gender: 'female' }
    }),
    await prisma.user.upsert({
      where: { phone: '13956785678' },
      create: { ...(await identityFor('user', () => prisma.user.findMany({ select: { code: true } }))), phone: '13956785678', nickname: '张三', avatar: null, gender: 'male', sourceType: 'USER' },
      update: { nickname: '张三', gender: 'male' }
    }),
    await prisma.user.upsert({
      where: { phone: '13724682468' },
      create: { ...(await identityFor('user', () => prisma.user.findMany({ select: { code: true } }))), phone: '13724682468', nickname: '李四', avatar: null, gender: 'male', sourceType: 'USER' },
      update: { nickname: '李四', gender: 'male' }
    }),
    await prisma.user.upsert({
      where: { phone: '15013571357' },
      create: { ...(await identityFor('user', () => prisma.user.findMany({ select: { code: true } }))), phone: '15013571357', nickname: '王五', avatar: null, gender: 'male', sourceType: 'USER' },
      update: { nickname: '王五', gender: 'male' }
    }),
    await prisma.user.upsert({
      where: { phone: '18867896789' },
      create: { ...(await identityFor('user', () => prisma.user.findMany({ select: { code: true } }))), phone: '18867896789', nickname: '赵六', avatar: null, gender: 'female', sourceType: 'USER' },
      update: { nickname: '赵六', gender: 'female' }
    })
  ];

  const familySeeds = [
    { name: '张三的一家', owner: familyUsers[2], city: '上海市', district: '浦东新区', members: [familyUsers[2], familyUsers[1], familyUsers[3], familyUsers[4], familyUsers[5]], status: 'ACTIVE' as const, activeOffset: 1 },
    { name: '妈妈家', owner: familyUsers[3], city: '上海市', district: '闵行区', members: [familyUsers[3], familyUsers[1], familyUsers[2], familyUsers[0]], status: 'ACTIVE' as const, activeOffset: 2 },
    { name: '周末聚餐', owner: familyUsers[4], city: '杭州市', district: '西湖区', members: familyUsers, status: 'ACTIVE' as const, activeOffset: 3 },
    { name: '合租小屋', owner: familyUsers[5], city: '北京市', district: '朝阳区', members: [familyUsers[5], familyUsers[1], familyUsers[2]], status: 'ACTIVE' as const, activeOffset: 4 },
    { name: '爸妈家', owner: familyUsers[0], city: '广州市', district: '天河区', members: [familyUsers[0], familyUsers[1], familyUsers[3], familyUsers[4], familyUsers[5]], status: 'DISABLED' as const, activeOffset: 10 }
  ];

  const familyRecords = [];
  for (const [familyIndex, item] of familySeeds.entries()) {
    const existing = await prisma.family.findFirst({ where: { name: item.name, deletedAt: null } });
    const family = existing
      ? await prisma.family.update({
          where: { id: existing.id },
          data: { ownerId: item.owner!.id, city: item.city, district: item.district, status: item.status, memberLimit: 8, activeAt: new Date(Date.now() - item.activeOffset * 60 * 60 * 1000) }
        })
      : await prisma.family.create({
          data: {
            ...(await identityFor('family', () => prisma.family.findMany({ select: { code: true } }))),
            name: item.name,
            ownerId: item.owner!.id,
            city: item.city,
            district: item.district,
            status: item.status,
            memberLimit: 8,
            activeAt: new Date(Date.now() - item.activeOffset * 60 * 60 * 1000),
            sortOrder: 100 - familyIndex
          }
        });
    familyRecords.push(family);
    for (const [memberIndex, memberUser] of item.members.entries()) {
      await prisma.familyMember.upsert({
        where: { familyId_userId: { familyId: family.id, userId: memberUser!.id } },
        create: {
          familyId: family.id,
          userId: memberUser!.id,
          role: memberUser!.id === item.owner!.id ? 'CREATOR' : memberIndex % 3 === 0 ? 'ADMIN' : 'MEMBER',
          joinMethod: memberIndex % 3 === 0 ? 'MANUAL_INVITE' : memberIndex % 3 === 1 ? 'SCAN_QR' : 'INVITE_LINK',
          memberStatus: item.status === 'DISABLED' && memberIndex === 1 ? 'REMOVED' : 'ACTIVE',
          joinedAt: new Date(Date.now() - (familyIndex * 4 + memberIndex + 1) * 24 * 60 * 60 * 1000)
        },
        update: {
          role: memberUser!.id === item.owner!.id ? 'CREATOR' : memberIndex % 3 === 0 ? 'ADMIN' : 'MEMBER',
          joinMethod: memberIndex % 3 === 0 ? 'MANUAL_INVITE' : memberIndex % 3 === 1 ? 'SCAN_QR' : 'INVITE_LINK',
          memberStatus: item.status === 'DISABLED' && memberIndex === 1 ? 'REMOVED' : 'ACTIVE'
        }
      });
    }
  }

  await prisma.familyInvite.deleteMany({ where: { familyId: { in: familyRecords.map((family) => family.id) } } });
  for (const [index, family] of familyRecords.entries()) {
    const inviter = familyUsers[(index + 2) % familyUsers.length];
    const invitee = familyUsers[(index + 3) % familyUsers.length];
    const token = `seed${String(index + 1).padStart(2, '0')}invite`;
    await prisma.familyInvite.create({
      data: {
        ...(await identityFor('family_invite', () => prisma.familyInvite.findMany({ select: { code: true } }))),
        familyId: family.id,
        inviterId: inviter!.id,
        inviteeId: index % 2 === 0 ? invitee!.id : null,
        inviteName: index % 2 === 0 ? '家庭二维码邀请' : '周末聚餐邀请链接',
        inviteMethod: index % 2 === 0 ? 'QR_CODE' : 'LINK',
        inviteType: index % 2 === 0 ? '二维码邀请' : '链接邀请',
        token,
        url: `https://jlyc.app/invite/${token}`,
        inviteStatus: index === 3 ? 'PENDING' : index === 4 ? 'EXPIRED' : 'JOINED',
        joinedAt: index < 3 ? new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000) : null,
        expiresAt: index === 4 ? new Date(Date.now() - 24 * 60 * 60 * 1000) : new Date(Date.now() + (7 - index) * 24 * 60 * 60 * 1000)
      }
    });
  }

  const ingredient = await prisma.ingredient.upsert({
    where: { name: '番茄' },
    create: {
      ...(await identityFor('ingredient', () => prisma.ingredient.findMany({ select: { code: true } }))),
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

  const commonIngredientNames = ['白菜', '土豆', '黄瓜', '青椒', '茄子', '胡萝卜', '洋葱', '菠菜', '豆腐', '鸡蛋', '鸡胸肉', '猪肉', '牛肉', '虾', '鱼', '香菇', '金针菇', '米饭', '面条'];
  for (const [index, name] of commonIngredientNames.entries()) {
    await prisma.ingredient.upsert({
      where: { name },
      create: {
        ...(await identityFor('ingredient', () => prisma.ingredient.findMany({ select: { code: true } }))),
        name,
        categoryId: ingredientCategory.id,
        isPublish: true,
        isRecommend: index < 6,
        sort: 80 - index,
        sortOrder: 80 - index
      },
      update: { isPublish: true }
    });
  }

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

    const created = await tx.recipe.create({ data: { ...(recipeData as Prisma.RecipeUncheckedCreateInput), ...(await identityFor('recipe', () => tx.recipe.findMany({ select: { code: true } }))) } });
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

  const beverages = [
    { name: '乌龙茶', beverageType: '茶饮', description: '清爽解腻，适合搭配油脂较重的菜品。', sort: 100 },
    { name: '酸梅汤', beverageType: '无酒精饮品', description: '酸甜开胃，适合火锅和烧烤。', sort: 95 },
    { name: '牛奶', beverageType: '乳饮', description: '适合儿童餐和早餐搭配。', sort: 90 },
    { name: '果汁', beverageType: '果汁', description: '适合儿童餐与轻食搭配。', sort: 85 },
    { name: '无糖茶', beverageType: '茶饮', description: '低负担，适合日常佐餐。', sort: 80 }
  ];
  const beverageItems = [];
  for (const item of beverages) {
    const beverage = await prisma.beverage.upsert({
      where: { name: item.name },
      create: {
        ...(await identityFor('beverage', () => prisma.beverage.findMany({ select: { code: true } }))),
        ...item,
        categoryId: beverageCategory.id,
        sortOrder: item.sort,
        isAlcoholic: false,
        isPublish: true
      },
      update: { beverageType: item.beverageType, description: item.description, sort: item.sort, sortOrder: item.sort, isAlcoholic: false, isPublish: true }
    });
    beverageItems.push(beverage);
  }
  const suggested = beverageItems.filter((item) => ['乌龙茶', '酸梅汤', '无糖茶'].includes(item.name));
  for (const [index, beverage] of suggested.entries()) {
    await prisma.recipeBeverage.upsert({
      where: { recipeId_beverageId: { recipeId: recipe.id, beverageId: beverage.id } },
      create: {
        recipeId: recipe.id,
        beverageId: beverage.id,
        recommendReason: beverage.name === '乌龙茶' ? '适合搭配油脂较重的菜品，解腻。' : '适合家庭佐餐，默认无酒精。',
        sortOrder: index + 1
      },
      update: { sortOrder: index + 1 }
    });
  }

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

  // HomeHeroBanner 需要绑定默认顶部导航
  const defaultNav = await prisma.homeTopNav.findFirst({ where: { isDefault: true, deletedAt: null } });
  if (defaultNav) {
    await replaceByTitle(
      () =>
        prisma.homeHeroBanner.create({
          data: {
            navId: defaultNav.id,
            title: '初夏家常菜',
            subtitle: '番茄牛腩配一碗米饭，晚餐不用再纠结。',
            buttonText: '查看菜谱',
            cover: '/static/images/banner-seasonal.svg',
            imageFocus: 'center',
            targetType: 'RECIPE',
            targetId: String(recipe.id),
            link: null,
            sortOrder: 1,
            sort: 1,
            status: 'ENABLED',
            isPublish: true
          }
        }),
      () => prisma.homeHeroBanner.deleteMany({ where: { title: '初夏家常菜' } })
    );
  }

  const existingMenus = await prisma.menu.findMany({
    where: { name: '家庭晚餐菜单' },
    select: { id: true }
  });
  if (existingMenus.length > 0) {
    await prisma.menuRecipe.deleteMany({ where: { menuId: { in: existingMenus.map((menu) => menu.id) } } });
    await prisma.menu.deleteMany({ where: { id: { in: existingMenus.map((menu) => menu.id) } } });
  }
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
