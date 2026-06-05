ALTER TYPE "CategoryType" ADD VALUE IF NOT EXISTS 'BEVERAGE';
ALTER TYPE "TargetType" ADD VALUE IF NOT EXISTS 'BEVERAGE';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "biz_id" VARCHAR(64), ADD COLUMN IF NOT EXISTS "code" VARCHAR(32), ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "biz_id" VARCHAR(64), ADD COLUMN IF NOT EXISTS "code" VARCHAR(32), ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "biz_id" VARCHAR(64), ADD COLUMN IF NOT EXISTS "code" VARCHAR(32), ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "biz_id" VARCHAR(64), ADD COLUMN IF NOT EXISTS "code" VARCHAR(32), ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "source_type_external" VARCHAR(80), ADD COLUMN IF NOT EXISTS "source_name" VARCHAR(120), ADD COLUMN IF NOT EXISTS "source_recipe_id" VARCHAR(120), ADD COLUMN IF NOT EXISTS "source_url" VARCHAR(255);
ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "biz_id" VARCHAR(64), ADD COLUMN IF NOT EXISTS "code" VARCHAR(32), ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "biz_id" VARCHAR(64), ADD COLUMN IF NOT EXISTS "code" VARCHAR(32), ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "users" SET "biz_id" = COALESCE("biz_id", 'user_' || md5('user:' || "id"::text)), "code" = COALESCE("code", 'YH' || lpad("id"::text, 6, '0')), "sort_order" = COALESCE("sort_order", "sort"), "is_deleted" = COALESCE("is_deleted", "deleted_at" IS NOT NULL);
UPDATE "categories" SET "biz_id" = COALESCE("biz_id", 'category_' || md5('category:' || "id"::text)), "code" = COALESCE("code", 'FL' || lpad("id"::text, 6, '0')), "sort_order" = COALESCE("sort_order", "sort"), "is_deleted" = COALESCE("is_deleted", "deleted_at" IS NOT NULL);
UPDATE "ingredients" SET "biz_id" = COALESCE("biz_id", 'ingredient_' || md5('ingredient:' || "id"::text)), "code" = COALESCE("code", 'SC' || lpad("id"::text, 6, '0')), "sort_order" = COALESCE("sort_order", "sort"), "is_deleted" = COALESCE("is_deleted", "deleted_at" IS NOT NULL);
UPDATE "recipes" SET "biz_id" = COALESCE("biz_id", 'recipe_' || md5('recipe:' || "id"::text)), "code" = COALESCE("code", 'CP' || lpad("id"::text, 6, '0')), "sort_order" = COALESCE("sort_order", "sort"), "is_deleted" = COALESCE("is_deleted", "deleted_at" IS NOT NULL);
UPDATE "menus" SET "biz_id" = COALESCE("biz_id", 'menu_' || md5('menu:' || "id"::text)), "code" = COALESCE("code", 'CD' || lpad("id"::text, 6, '0')), "sort_order" = COALESCE("sort_order", "sort"), "is_deleted" = COALESCE("is_deleted", "deleted_at" IS NOT NULL);
UPDATE "recommendations" SET "biz_id" = COALESCE("biz_id", 'recommend_' || md5('recommend:' || "id"::text)), "code" = COALESCE("code", 'TJ' || lpad("id"::text, 6, '0')), "sort_order" = COALESCE("sort_order", "sort"), "is_deleted" = COALESCE("is_deleted", "deleted_at" IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS "users_biz_id_key" ON "users"("biz_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_code_key" ON "users"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "categories_biz_id_key" ON "categories"("biz_id");
CREATE UNIQUE INDEX IF NOT EXISTS "categories_code_key" ON "categories"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "ingredients_biz_id_key" ON "ingredients"("biz_id");
CREATE UNIQUE INDEX IF NOT EXISTS "ingredients_code_key" ON "ingredients"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "recipes_biz_id_key" ON "recipes"("biz_id");
CREATE UNIQUE INDEX IF NOT EXISTS "recipes_code_key" ON "recipes"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "menus_biz_id_key" ON "menus"("biz_id");
CREATE UNIQUE INDEX IF NOT EXISTS "menus_code_key" ON "menus"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "recommendations_biz_id_key" ON "recommendations"("biz_id");
CREATE UNIQUE INDEX IF NOT EXISTS "recommendations_code_key" ON "recommendations"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "recipes_import_source_unique" ON "recipes"("source_type_external", "source_name", "source_recipe_id") WHERE "source_type_external" IS NOT NULL AND "source_name" IS NOT NULL AND "source_recipe_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "beverages" (
  "id" SERIAL PRIMARY KEY,
  "biz_id" VARCHAR(64) UNIQUE,
  "code" VARCHAR(32) UNIQUE,
  "name" VARCHAR(120) NOT NULL,
  "cover_image" VARCHAR(255),
  "category_id" INTEGER,
  "beverage_type" VARCHAR(80),
  "is_alcoholic" BOOLEAN NOT NULL DEFAULT false,
  "alcohol_degree" DOUBLE PRECISION,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "sort" INTEGER NOT NULL DEFAULT 0,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "is_publish" BOOLEAN NOT NULL DEFAULT true,
  "is_recommend" BOOLEAN NOT NULL DEFAULT false,
  "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
  "source_id" INTEGER,
  "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
  "created_by" INTEGER,
  "updated_by" INTEGER,
  CONSTRAINT "beverages_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "beverages_name_key" ON "beverages"("name");
CREATE INDEX IF NOT EXISTS "beverages_category_id_idx" ON "beverages"("category_id");

CREATE TABLE IF NOT EXISTS "recipe_beverages" (
  "id" SERIAL PRIMARY KEY,
  "recipe_id" INTEGER NOT NULL,
  "beverage_id" INTEGER NOT NULL,
  "recommend_reason" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recipe_beverages_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "recipe_beverages_beverage_id_fkey" FOREIGN KEY ("beverage_id") REFERENCES "beverages"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "recipe_beverages_recipe_id_beverage_id_key" ON "recipe_beverages"("recipe_id", "beverage_id");
CREATE INDEX IF NOT EXISTS "recipe_beverages_recipe_id_idx" ON "recipe_beverages"("recipe_id");
CREATE INDEX IF NOT EXISTS "recipe_beverages_beverage_id_idx" ON "recipe_beverages"("beverage_id");
