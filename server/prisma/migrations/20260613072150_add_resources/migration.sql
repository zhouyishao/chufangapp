-- CreateTable
CREATE TABLE "resource_apps" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "app_id" VARCHAR(64) NOT NULL,
    "app_type" VARCHAR(32) NOT NULL,
    "owner" VARCHAR(64) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_api_keys" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "app_id" INTEGER NOT NULL,
    "key_hash" VARCHAR(255) NOT NULL,
    "key_prefix" VARCHAR(32) NOT NULL,
    "permission_scope" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_permissions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "method" VARCHAR(16) NOT NULL,
    "module" VARCHAR(32) NOT NULL,
    "auth_required" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_call_logs" (
    "id" SERIAL NOT NULL,
    "called_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "app_id" INTEGER NOT NULL,
    "api_key_id" INTEGER,
    "api_key_prefix" VARCHAR(32),
    "path" VARCHAR(255) NOT NULL,
    "method" VARCHAR(16) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "ip" VARCHAR(64),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_apps_app_id_key" ON "resource_apps"("app_id");

-- CreateIndex
CREATE INDEX "resource_api_keys_app_id_idx" ON "resource_api_keys"("app_id");

-- CreateIndex
CREATE UNIQUE INDEX "resource_permissions_code_key" ON "resource_permissions"("code");

-- CreateIndex
CREATE INDEX "resource_call_logs_app_id_idx" ON "resource_call_logs"("app_id");

-- CreateIndex
CREATE INDEX "resource_call_logs_api_key_id_idx" ON "resource_call_logs"("api_key_id");

-- CreateIndex
CREATE INDEX "resource_call_logs_called_at_idx" ON "resource_call_logs"("called_at");

-- AddForeignKey
ALTER TABLE "resource_api_keys" ADD CONSTRAINT "resource_api_keys_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "resource_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_call_logs" ADD CONSTRAINT "resource_call_logs_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "resource_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_call_logs" ADD CONSTRAINT "resource_call_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "resource_api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
