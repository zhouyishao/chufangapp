CREATE TYPE "FamilyMemberRole" AS ENUM ('CREATOR', 'ADMIN', 'MEMBER');
CREATE TYPE "FamilyJoinMethod" AS ENUM ('SCAN_QR', 'MANUAL_INVITE', 'INVITE_LINK', 'ADMIN_CREATE');
CREATE TYPE "FamilyMemberStatus" AS ENUM ('ACTIVE', 'LEFT', 'REMOVED');
CREATE TYPE "FamilyInviteMethod" AS ENUM ('QR_CODE', 'LINK');
CREATE TYPE "FamilyInviteStatus" AS ENUM ('JOINED', 'PENDING', 'EXPIRED', 'REVOKED');

CREATE TABLE "families" (
  "id" SERIAL PRIMARY KEY,
  "biz_id" VARCHAR(64) UNIQUE,
  "code" VARCHAR(32) UNIQUE,
  "name" VARCHAR(80) NOT NULL,
  "avatar" VARCHAR(255),
  "city" VARCHAR(40),
  "district" VARCHAR(40),
  "owner_id" INTEGER,
  "member_limit" INTEGER NOT NULL DEFAULT 8,
  "active_at" TIMESTAMP(3),
  "description" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "sort" INTEGER NOT NULL DEFAULT 0,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "is_publish" BOOLEAN NOT NULL DEFAULT false,
  "is_recommend" BOOLEAN NOT NULL DEFAULT false,
  "source_type" "SourceType" NOT NULL DEFAULT 'USER',
  "source_id" INTEGER,
  "audit_status" "AuditStatus" NOT NULL DEFAULT 'APPROVED',
  "created_by" INTEGER,
  "updated_by" INTEGER,
  CONSTRAINT "families_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "families_owner_id_idx" ON "families"("owner_id");

CREATE TABLE "family_members" (
  "id" SERIAL PRIMARY KEY,
  "family_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "role" "FamilyMemberRole" NOT NULL DEFAULT 'MEMBER',
  "join_method" "FamilyJoinMethod" NOT NULL DEFAULT 'SCAN_QR',
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "left_at" TIMESTAMP(3),
  "member_status" "FamilyMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "remark" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  CONSTRAINT "family_members_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "family_members_family_id_user_id_key" ON "family_members"("family_id", "user_id");
CREATE INDEX "family_members_family_id_idx" ON "family_members"("family_id");
CREATE INDEX "family_members_user_id_idx" ON "family_members"("user_id");

CREATE TABLE "family_invites" (
  "id" SERIAL PRIMARY KEY,
  "biz_id" VARCHAR(64) UNIQUE,
  "code" VARCHAR(32) UNIQUE,
  "family_id" INTEGER NOT NULL,
  "inviter_id" INTEGER,
  "invitee_id" INTEGER,
  "invite_name" VARCHAR(120) NOT NULL,
  "invite_method" "FamilyInviteMethod" NOT NULL DEFAULT 'QR_CODE',
  "invite_type" VARCHAR(40) NOT NULL DEFAULT '家庭邀请',
  "token" VARCHAR(64) UNIQUE,
  "url" VARCHAR(255),
  "invite_status" "FamilyInviteStatus" NOT NULL DEFAULT 'PENDING',
  "joined_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  CONSTRAINT "family_invites_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "family_invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "family_invites_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "family_invites_family_id_idx" ON "family_invites"("family_id");
CREATE INDEX "family_invites_inviter_id_idx" ON "family_invites"("inviter_id");
CREATE INDEX "family_invites_invitee_id_idx" ON "family_invites"("invitee_id");
