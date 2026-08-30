ALTER TABLE "categories" ADD COLUMN "parent_id" INTEGER;

CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

ALTER TABLE "categories"
ADD CONSTRAINT "categories_parent_id_fkey"
FOREIGN KEY ("parent_id") REFERENCES "categories"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- 将历史导入产生的细分类归入现有大分类。此处只做一次数据回填，
-- 后续关系由后台分类管理自由配置，不依赖运行时名称映射。
UPDATE "categories" child
SET "parent_id" = parent."id"
FROM "categories" parent
WHERE child."type" = 'INGREDIENT'
  AND parent."type" = 'INGREDIENT'
  AND (
    (parent."name" = '蔬菜' AND child."name" IN ('时令蔬菜')) OR
    (parent."name" = '肉禽蛋' AND child."name" IN ('生禽', '畜肉', '禽肉', '蛋类')) OR
    (parent."name" = '水产海鲜' AND child."name" IN ('水产', '海藻', '鱼类', '甲壳类', '贝类', '头足类', '棘皮类', '其他水产')) OR
    (parent."name" = '豆制品' AND child."name" IN ('豆类')) OR
    (parent."name" = '主食米面' AND child."name" IN ('谷物', '面制品', '淀粉制品')) OR
    (parent."name" = '干货菌菇' AND child."name" IN ('干货', '菌菇类', '菌菇', '坚果种子')) OR
    (parent."name" = '奶制品' AND child."name" IN ('乳制品'))
  );
