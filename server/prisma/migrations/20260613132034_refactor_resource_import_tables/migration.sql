/*
  Warnings:

  - You are about to drop the column `fail_count` on the `resource_import_batches` table. All the data in the column will be lost.
  - You are about to drop the column `operator` on the `resource_import_batches` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `resource_import_batches` table. All the data in the column will be lost.
  - You are about to drop the column `batch_id` on the `resource_import_items` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `resource_import_items` table. All the data in the column will be lost.
  - You are about to drop the column `error_reason` on the `resource_import_items` table. All the data in the column will be lost.
  - You are about to drop the column `is_duplicate` on the `resource_import_items` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `resource_import_items` table. All the data in the column will be lost.
  - You are about to drop the column `resource_type` on the `resource_import_items` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `resource_import_items` table. All the data in the column will be lost.
  - Added the required column `created_by` to the `resource_import_batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `import_type` to the `resource_import_batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `import_id` to the `resource_import_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mapped_data` to the `resource_import_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `raw_data` to the `resource_import_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `row_index` to the `resource_import_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "resource_import_items" DROP CONSTRAINT "resource_import_items_batch_id_fkey";

-- DropIndex
DROP INDEX "resource_import_items_batch_id_idx";

-- AlterTable
ALTER TABLE "resource_import_batches" DROP COLUMN "fail_count",
DROP COLUMN "operator",
DROP COLUMN "updated_at",
ADD COLUMN     "created_by" VARCHAR(64) NOT NULL,
ADD COLUMN     "failed_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "finished_at" TIMESTAMP(3),
ADD COLUMN     "import_type" VARCHAR(32) NOT NULL;

-- AlterTable
ALTER TABLE "resource_import_items" DROP COLUMN "batch_id",
DROP COLUMN "content",
DROP COLUMN "error_reason",
DROP COLUMN "is_duplicate",
DROP COLUMN "name",
DROP COLUMN "resource_type",
DROP COLUMN "updated_at",
ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "import_id" INTEGER NOT NULL,
ADD COLUMN     "mapped_data" JSONB NOT NULL,
ADD COLUMN     "raw_data" JSONB NOT NULL,
ADD COLUMN     "row_index" INTEGER NOT NULL,
ADD COLUMN     "target_id" INTEGER;

-- CreateIndex
CREATE INDEX "resource_import_items_import_id_idx" ON "resource_import_items"("import_id");

-- AddForeignKey
ALTER TABLE "resource_import_items" ADD CONSTRAINT "resource_import_items_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "resource_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
