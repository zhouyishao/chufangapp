/*
  Warnings:

  - The `status` column on the `home_hero_banners` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `nav_id` to the `home_hero_banners` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BannerStatus" AS ENUM ('DRAFT', 'ENABLED', 'DISABLED');

-- DropForeignKey
ALTER TABLE "family_invites" DROP CONSTRAINT "family_invites_family_id_fkey";

-- DropForeignKey
ALTER TABLE "family_members" DROP CONSTRAINT "family_members_family_id_fkey";

-- DropForeignKey
ALTER TABLE "family_members" DROP CONSTRAINT "family_members_user_id_fkey";

-- DropIndex
DROP INDEX "home_hero_banners_status_sort_order_idx";

-- AlterTable
ALTER TABLE "beverages" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "families" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "family_invites" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "family_members" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "home_hero_banners" ADD COLUMN     "image_focus" VARCHAR(20) NOT NULL DEFAULT 'center',
ADD COLUMN     "nav_id" INTEGER NOT NULL,
ADD COLUMN     "remark" VARCHAR(255),
ADD COLUMN     "target_title_snapshot" VARCHAR(120),
ALTER COLUMN "sort_order" SET DEFAULT 1,
ALTER COLUMN "updated_at" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "BannerStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "home_top_nav_content_rules" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "home_top_nav_styles" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "home_top_navs" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "recipe_beverages" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "home_hero_banners_nav_id_status_sort_order_idx" ON "home_hero_banners"("nav_id", "status", "sort_order");

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_invites" ADD CONSTRAINT "family_invites_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_hero_banners" ADD CONSTRAINT "home_hero_banners_nav_id_fkey" FOREIGN KEY ("nav_id") REFERENCES "home_top_navs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "recipes_import_source_unique" RENAME TO "recipes_source_type_external_source_name_source_recipe_id_key";
