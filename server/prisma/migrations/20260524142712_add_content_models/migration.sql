-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('NONE', 'URL', 'RECIPE', 'INGREDIENT', 'CATEGORY', 'MENU');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "cuisine_id" INTEGER;

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "phone" VARCHAR(32),
    "openid" VARCHAR(80),
    "nickname" VARCHAR(60),
    "avatar" VARCHAR(255),
    "gender" VARCHAR(16),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'USER',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_tips" (
    "id" SERIAL NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT true,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "ingredient_tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuisines" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "cover" VARCHAR(255),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT true,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "cuisines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasonal_foods" (
    "id" SERIAL NOT NULL,
    "ingredient_id" INTEGER,
    "name" VARCHAR(80) NOT NULL,
    "month" INTEGER NOT NULL,
    "cover" VARCHAR(255),
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT true,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "seasonal_foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "cover" VARCHAR(255),
    "target_type" "TargetType" NOT NULL DEFAULT 'RECIPE',
    "target_url" VARCHAR(255),
    "recipe_id" INTEGER,
    "ingredient_id" INTEGER,
    "category_id" INTEGER,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT true,
    "is_recommend" BOOLEAN NOT NULL DEFAULT true,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "scene" VARCHAR(80),
    "cover" VARCHAR(255),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT true,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_recipes" (
    "id" SERIAL NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "sort_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT true,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "menu_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "target_type" "TargetType" NOT NULL DEFAULT 'NONE',
    "target_url" VARCHAR(255),
    "recipe_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT true,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER,
    "ingredient_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'USER',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "view_histories" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER,
    "ingredient_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT false,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'USER',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "view_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "recipe_id" INTEGER,
    "post_id" INTEGER,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT true,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'USER',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "recipe_id" INTEGER,
    "title" VARCHAR(120) NOT NULL,
    "content" TEXT,
    "images" JSONB,
    "post_status" "PostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_publish" BOOLEAN NOT NULL DEFAULT true,
    "is_recommend" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "SourceType" NOT NULL DEFAULT 'USER',
    "source_id" INTEGER,
    "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_openid_key" ON "users"("openid");

-- CreateIndex
CREATE INDEX "ingredient_tips_ingredient_id_idx" ON "ingredient_tips"("ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "cuisines_name_key" ON "cuisines"("name");

-- CreateIndex
CREATE INDEX "seasonal_foods_ingredient_id_idx" ON "seasonal_foods"("ingredient_id");

-- CreateIndex
CREATE INDEX "seasonal_foods_month_idx" ON "seasonal_foods"("month");

-- CreateIndex
CREATE INDEX "recommendations_recipe_id_idx" ON "recommendations"("recipe_id");

-- CreateIndex
CREATE INDEX "recommendations_ingredient_id_idx" ON "recommendations"("ingredient_id");

-- CreateIndex
CREATE INDEX "recommendations_category_id_idx" ON "recommendations"("category_id");

-- CreateIndex
CREATE INDEX "menu_recipes_recipe_id_idx" ON "menu_recipes"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_recipes_menu_id_recipe_id_key" ON "menu_recipes"("menu_id", "recipe_id");

-- CreateIndex
CREATE INDEX "banners_recipe_id_idx" ON "banners"("recipe_id");

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- CreateIndex
CREATE INDEX "favorites_recipe_id_idx" ON "favorites"("recipe_id");

-- CreateIndex
CREATE INDEX "favorites_ingredient_id_idx" ON "favorites"("ingredient_id");

-- CreateIndex
CREATE INDEX "view_histories_user_id_idx" ON "view_histories"("user_id");

-- CreateIndex
CREATE INDEX "view_histories_recipe_id_idx" ON "view_histories"("recipe_id");

-- CreateIndex
CREATE INDEX "view_histories_ingredient_id_idx" ON "view_histories"("ingredient_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "comments_recipe_id_idx" ON "comments"("recipe_id");

-- CreateIndex
CREATE INDEX "comments_post_id_idx" ON "comments"("post_id");

-- CreateIndex
CREATE INDEX "posts_user_id_idx" ON "posts"("user_id");

-- CreateIndex
CREATE INDEX "posts_recipe_id_idx" ON "posts"("recipe_id");

-- AddForeignKey
ALTER TABLE "ingredient_tips" ADD CONSTRAINT "ingredient_tips_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_cuisine_id_fkey" FOREIGN KEY ("cuisine_id") REFERENCES "cuisines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasonal_foods" ADD CONSTRAINT "seasonal_foods_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_recipes" ADD CONSTRAINT "menu_recipes_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_recipes" ADD CONSTRAINT "menu_recipes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "view_histories" ADD CONSTRAINT "view_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "view_histories" ADD CONSTRAINT "view_histories_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "view_histories" ADD CONSTRAINT "view_histories_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
