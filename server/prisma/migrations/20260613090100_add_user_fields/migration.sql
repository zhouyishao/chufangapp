-- AlterTable
ALTER TABLE "users" ADD COLUMN "email" VARCHAR(120);
ALTER TABLE "users" ADD COLUMN "password_hash" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN "role" VARCHAR(32) NOT NULL DEFAULT 'USER';
ALTER TABLE "users" ADD COLUMN "source" VARCHAR(32) NOT NULL DEFAULT 'USER';
ALTER TABLE "users" ADD COLUMN "birthday" DATE;
ALTER TABLE "users" ADD COLUMN "region" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
