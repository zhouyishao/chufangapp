ALTER TABLE "admins" ADD COLUMN "last_login_at" TIMESTAMP(3);

ALTER TABLE "roles"
  ADD COLUMN "code" VARCHAR(64),
  ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

UPDATE "roles"
SET "code" = CASE
  WHEN "name" IN ('SUPER_ADMIN', '超级管理员') THEN 'SUPER_ADMIN'
  WHEN "name" IN ('CONTENT_OPERATOR', '内容运营') THEN 'CONTENT_OPERATOR'
  WHEN "name" IN ('READ_ONLY', '只读人员') THEN 'READ_ONLY'
  ELSE 'LEGACY_' || "id"::text
END
WHERE "code" IS NULL;

ALTER TABLE "roles" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

ALTER TABLE "permissions"
  ADD COLUMN "module" VARCHAR(64),
  ADD COLUMN "action" VARCHAR(32);

UPDATE "permissions"
SET
  "module" = split_part("key", ':', 1),
  "action" = regexp_replace("key", '^.*:', '')
WHERE "module" IS NULL OR "action" IS NULL;

ALTER TABLE "permissions"
  ALTER COLUMN "module" SET NOT NULL,
  ALTER COLUMN "action" SET NOT NULL;
