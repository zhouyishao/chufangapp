CREATE TABLE "ingredient_price_records" (
    "id" SERIAL NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "price" DOUBLE PRECISION NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "price_date" DATE NOT NULL,
    "price_source" VARCHAR(80),
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

    CONSTRAINT "ingredient_price_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ingredient_price_records_ingredient_id_idx" ON "ingredient_price_records"("ingredient_id");
CREATE INDEX "ingredient_price_records_user_id_idx" ON "ingredient_price_records"("user_id");

ALTER TABLE "ingredient_price_records"
  ADD CONSTRAINT "ingredient_price_records_ingredient_id_fkey"
  FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ingredient_price_records"
  ADD CONSTRAINT "ingredient_price_records_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
