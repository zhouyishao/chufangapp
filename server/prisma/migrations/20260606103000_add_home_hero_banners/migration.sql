ALTER TYPE "TargetType" ADD VALUE IF NOT EXISTS 'TOPIC';

CREATE TABLE "home_hero_banners" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(120) NOT NULL,
  "subtitle" VARCHAR(160),
  "button_text" VARCHAR(32),
  "cover" VARCHAR(255) NOT NULL,
  "target_type" "TargetType" NOT NULL DEFAULT 'NONE',
  "target_id" VARCHAR(64),
  "link" VARCHAR(255),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "start_at" TIMESTAMP(3),
  "end_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "sort" INTEGER NOT NULL DEFAULT 0,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "is_publish" BOOLEAN NOT NULL DEFAULT true,
  "is_recommend" BOOLEAN NOT NULL DEFAULT false,
  "source_type" "SourceType" NOT NULL DEFAULT 'ADMIN',
  "source_id" INTEGER,
  "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
  "created_by" INTEGER,
  "updated_by" INTEGER
);

CREATE INDEX "home_hero_banners_status_sort_order_idx" ON "home_hero_banners"("status", "sort_order");
