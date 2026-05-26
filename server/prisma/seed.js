import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const adminPassword = 'admin123';
const ensureRole = async (data) => {
    return prisma.role.upsert({
        where: { name: data.name },
        create: data,
        update: {}
    });
};
const ensureAdmin = async (username, password, nickname) => {
    const passwordHash = await bcrypt.hash(password, 10);
    return prisma.admin.upsert({
        where: { username },
        create: { username, passwordHash, nickname, auditStatus: 'APPROVED' },
        update: { nickname }
    });
};
const ensureCategory = async (type, name, sort = 0) => {
    return prisma.category.upsert({
        where: { type_name: { type, name } },
        create: { type, name, sort, isPublish: true },
        update: { sort }
    });
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
        update: {}
    });
    const recipe = await prisma.recipe.create({
        data: {
            title: '番茄牛腩',
            subtitle: '酸甜浓郁',
            cover: null,
            description: '家常炖菜，番茄的酸甜与牛腩的醇厚。',
            categoryId: recipeCategory.id,
            cookTime: 70,
            servings: 2,
            isDraft: false,
            isPublish: true,
            isRecommend: true,
            auditStatus: 'APPROVED',
            steps: {
                create: [
                    { sortIndex: 1, description: '牛腩焯水，冲洗干净。' },
                    { sortIndex: 2, description: '番茄炒出沙，加入牛腩炖煮。' },
                    { sortIndex: 3, description: '收汁调味，出锅。' }
                ]
            },
            ingredients: {
                create: [
                    { sortIndex: 1, ingredientId: ingredient.id, name: '番茄', amount: '3个' },
                    { sortIndex: 2, name: '牛腩', amount: '500g' }
                ]
            }
        }
    });
    await prisma.recipe.update({
        where: { id: recipe.id },
        data: { viewCount: 12, favoriteCount: 3 }
    });
};
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
});
