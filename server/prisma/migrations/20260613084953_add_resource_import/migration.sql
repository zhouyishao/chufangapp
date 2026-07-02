-- CreateTable
CREATE TABLE "resource_import_batches" (
    "id" SERIAL NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "source_type" VARCHAR(64) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "operator" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_import_items" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "resource_type" VARCHAR(32) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "content" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "error_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_import_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resource_import_items_batch_id_idx" ON "resource_import_items"("batch_id");

-- AddForeignKey
ALTER TABLE "resource_import_items" ADD CONSTRAINT "resource_import_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "resource_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
