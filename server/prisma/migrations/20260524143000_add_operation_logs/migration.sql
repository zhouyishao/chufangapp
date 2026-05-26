-- CreateTable
CREATE TABLE "operation_logs" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER,
    "module" VARCHAR(80),
    "action" VARCHAR(120),
    "method" VARCHAR(16),
    "path" VARCHAR(255),
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(255),
    "request_body" JSONB,
    "response_code" INTEGER,
    "response_message" VARCHAR(255),
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

    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operation_logs_admin_id_idx" ON "operation_logs"("admin_id");

