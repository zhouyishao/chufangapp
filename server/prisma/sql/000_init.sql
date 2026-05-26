-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('ADMIN', 'USER', 'IMPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('RECIPE', 'INGREDIENT', 'SEASONING', 'FRUIT', 'COCKTAIL');

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(32) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nickname" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_roles" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "type" "CategoryType" NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "cover" VARCHAR(255),
    "category_id" INTEGER,
    "season_month" VARCHAR(64),
    "nutrition" TEXT,
    "selection_tips" TEXT,
    "storage_method" TEXT,
    "taboo" TEXT,
    "related_recipes" JSONB,
    "current_price" DOUBLE PRECISION,
    "price_unit" VARCHAR(20),
    "price_source" VARCHAR(80),
    "price_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "subtitle" VARCHAR(255),
    "cover" VARCHAR(255),
    "images" JSONB,
    "description" TEXT,
    "category_id" INTEGER,
    "difficulty" VARCHAR(20),
    "cook_time" INTEGER,
    "servings" INTEGER,
    "calories" INTEGER,
    "taste" VARCHAR(50),
    "scene" VARCHAR(50),
    "tips" TEXT,
    "author_id" INTEGER,
    "reject_reason" TEXT,
    "is_draft" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "sort_index" INTEGER NOT NULL,
    "title" VARCHAR(120),
    "description" TEXT NOT NULL,
    "image" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "ingredient_id" INTEGER,
    "name" VARCHAR(120) NOT NULL,
    "amount" VARCHAR(80),
    "sort_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(80) NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "admin_roles_admin_id_role_id_key" ON "admin_roles"("admin_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_type_name_key" ON "categories"("type", "name");

-- CreateIndex
CREATE INDEX "ingredients_category_id_idx" ON "ingredients"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

-- CreateIndex
CREATE INDEX "recipe_steps_recipe_id_idx" ON "recipe_steps"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_ingredient_id_idx" ON "recipe_ingredients"("ingredient_id");

-- AddForeignKey
ALTER TABLE "admin_roles" ADD CONSTRAINT "admin_roles_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_roles" ADD CONSTRAINT "admin_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
