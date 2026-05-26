-- CreateEnum
CREATE TYPE "TagScope" AS ENUM ('RECIPE', 'INGREDIENT', 'SCENE', 'TASTE', 'METHOD', 'CROWD');

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "scope" "TagScope" NOT NULL,
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

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_tags" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
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

    CONSTRAINT "recipe_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_tags" (
    "id" SERIAL NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
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

    CONSTRAINT "ingredient_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "position" VARCHAR(80),
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

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_scope_name_key" ON "tags"("scope", "name");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_tags_recipe_id_tag_id_key" ON "recipe_tags"("recipe_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_tags_ingredient_id_tag_id_key" ON "ingredient_tags"("ingredient_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "channels_code_key" ON "channels"("code");

-- AddForeignKey
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_tags" ADD CONSTRAINT "ingredient_tags_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_tags" ADD CONSTRAINT "ingredient_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
