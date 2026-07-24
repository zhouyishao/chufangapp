import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import {
  getMobileProfile,
  updateMobileProfile,
  type MobileProfileDatabase
} from '../services/mobile-profile';

type StoredUser = {
  id: number;
  phone: string | null;
  nickname: string | null;
  bio: string | null;
  avatar: string | null;
  createdAt: Date;
  _count: { favorites: number; comments: number; posts: number };
};

type StoredFile = {
  id: number;
  url: string;
  mimeType: string;
  uploaderId: number | null;
  deletedAt: Date | null;
  width: number | null;
  height: number | null;
  status?: 'ACTIVE' | 'DISABLED';
};

type StoredReference = {
  fileId: number;
  ownerType: string;
  ownerId: string;
  field: string;
  sortIndex: number;
};

const createDatabase = (initial?: {
  users?: StoredUser[];
  files?: StoredFile[];
  references?: StoredReference[];
}) => {
  const users = new Map((initial?.users ?? []).map((user) => [user.id, { ...user }]));
  const files = new Map((initial?.files ?? []).map((file) => [file.id, { ...file }]));
  const references = [...(initial?.references ?? [])];
  const locks: number[] = [];

  const database = {
    user: {
      findFirst: async ({ where }: { where: { id: number } }) => users.get(where.id) ?? null,
      update: async ({
        where,
        data
      }: {
        where: { id: number };
        data: { nickname?: string; bio?: string | null; avatar?: string | null };
      }) => {
        const user = users.get(where.id);
        assert.ok(user);
        Object.assign(user, data);
        return user;
      }
    },
    file: {
      findFirst: async ({
        where
      }: {
        where: {
          id: number;
          deletedAt: null;
          status: 'ACTIVE';
          mimeType: { startsWith?: string; in?: string[] };
          OR?: Array<{ uploaderId: number | null }>;
          uploaderId?: number;
        };
      }) => {
        const file = files.get(where.id);
        const uploaderMatches = where.OR
          ? where.OR.some((condition) => file?.uploaderId === condition.uploaderId)
          : file?.uploaderId === where.uploaderId;
        if (
          !file
          || !uploaderMatches
          || file.deletedAt !== null
          || (file.status ?? 'ACTIVE') !== where.status
          || (
            where.mimeType.startsWith !== undefined
            && !file.mimeType.startsWith(where.mimeType.startsWith)
          )
          || (where.mimeType.in !== undefined && !where.mimeType.in.includes(file.mimeType))
        ) return null;
        return { id: file.id, url: file.url, width: file.width, height: file.height };
      }
    },
    fileReference: {
      findFirst: async ({
        where
      }: {
        where: Omit<StoredReference, 'fileId'> & {
          file?: {
            uploaderId?: number;
            OR?: Array<{ uploaderId: number | null }>;
            deletedAt: null;
            status: 'ACTIVE';
            mimeType: { startsWith: string };
          };
        };
      }) => {
        const reference = references.find((candidate) =>
          candidate.ownerType === where.ownerType
          && candidate.ownerId === where.ownerId
          && candidate.field === where.field
          && candidate.sortIndex === where.sortIndex
        );
        if (!reference) return null;
        const file = files.get(reference.fileId);
        const uploaderMatches = where.file?.OR
          ? where.file.OR.some((condition) => file?.uploaderId === condition.uploaderId)
          : file?.uploaderId === where.file?.uploaderId;
        if (
          where.file
          && (
            !file
            || !uploaderMatches
            || file.deletedAt !== where.file.deletedAt
            || (file.status ?? 'ACTIVE') !== where.file.status
            || !file.mimeType.startsWith(where.file.mimeType.startsWith)
          )
        ) return null;
        return reference;
      },
      deleteMany: async ({ where }: { where: Omit<StoredReference, 'fileId'> }) => {
        for (let index = references.length - 1; index >= 0; index -= 1) {
          const reference = references[index];
          if (reference && (
            reference.ownerType === where.ownerType
            && reference.ownerId === where.ownerId
            && reference.field === where.field
            && reference.sortIndex === where.sortIndex
          )) references.splice(index, 1);
        }
      },
      upsert: async ({
        where,
        create,
        update
      }: {
        where: { ownerType_ownerId_field_sortIndex: Omit<StoredReference, 'fileId'> };
        create: StoredReference;
        update: { fileId: number };
      }) => {
        const slot = where.ownerType_ownerId_field_sortIndex;
        const reference = references.find((candidate) =>
          candidate.ownerType === slot.ownerType
          && candidate.ownerId === slot.ownerId
          && candidate.field === slot.field
          && candidate.sortIndex === slot.sortIndex
        );
        if (reference) {
          reference.fileId = update.fileId;
          return reference;
        }
        references.push({ ...create });
        return create;
      }
    },
    $executeRawUnsafe: async (_query: string, _namespace: number, fileId: number) => {
      locks.push(fileId);
      return 1;
    },
    $transaction: async <T>(callback: (transaction: MobileProfileDatabase) => Promise<T>) =>
      callback(database as MobileProfileDatabase)
  } satisfies Record<string, unknown>;

  return {
    database: database as unknown as MobileProfileDatabase,
    users,
    references,
    locks
  };
};

const user = (id: number): StoredUser => ({
  id,
  phone: `1380000000${id}`,
  nickname: `用户${id}`,
  bio: null,
  avatar: null,
  createdAt: new Date('2026-07-24T00:00:00.000Z'),
  _count: { favorites: 1, comments: 2, posts: 3 }
});

test('GET 个人资料包含 bio 和 avatarFileId', async () => {
  const state = createDatabase({
    users: [{ ...user(1), bio: '认真吃饭', avatar: '/uploads/avatar.webp' }],
    files: [{ id: 11, url: '/uploads/avatar.webp', mimeType: 'image/webp', uploaderId: 1, deletedAt: null, width: 512, height: 512 }],
    references: [{ fileId: 11, ownerType: 'USER', ownerId: '1', field: 'avatar', sortIndex: 0 }]
  });

  const profile = await getMobileProfile(state.database, 1);

  assert.equal(profile.bio, '认真吃饭');
  assert.equal(profile.avatarFileId, 11);
  assert.equal(profile.avatar, '/uploads/avatar.webp');
});

test('GET 个人资料允许当前用户头像引用指向历史 uploaderId 为空的图片', async () => {
  const state = createDatabase({
    users: [{ ...user(1), avatar: '/uploads/historical.webp' }],
    files: [{
      id: 15,
      url: '/uploads/historical.webp',
      mimeType: 'image/webp',
      uploaderId: null,
      deletedAt: null,
      width: 512,
      height: 512
    }],
    references: [{ fileId: 15, ownerType: 'USER', ownerId: '1', field: 'avatar', sortIndex: 0 }]
  });

  const profile = await getMobileProfile(state.database, 1);

  assert.equal(profile.avatarFileId, 15);
});

test('GET 个人资料忽略已删除、跨用户或非图片的头像引用', async () => {
  for (const file of [
    { id: 12, url: '/uploads/deleted.webp', mimeType: 'image/webp', uploaderId: 1, deletedAt: new Date(), width: 512, height: 512 },
    { id: 13, url: '/uploads/other.webp', mimeType: 'image/webp', uploaderId: 2, deletedAt: null, width: 512, height: 512 },
    { id: 14, url: '/uploads/video.mp4', mimeType: 'video/mp4', uploaderId: 1, deletedAt: null, width: null, height: null }
  ]) {
    const state = createDatabase({
      users: [{ ...user(1), avatar: '/uploads/historical.webp' }],
      files: [file],
      references: [{ fileId: file.id, ownerType: 'USER', ownerId: '1', field: 'avatar', sortIndex: 0 }]
    });

    const profile = await getMobileProfile(state.database, 1);
    assert.equal(profile.avatarFileId, null);
    assert.equal(profile.avatar, '/uploads/historical.webp');
  }
});

test('GET 个人资料不返回 DISABLED 但未软删的头像引用', async () => {
  const state = createDatabase({
    users: [{ ...user(1), avatar: '/uploads/disabled.webp' }],
    files: [{
      id: 16,
      url: '/uploads/disabled.webp',
      mimeType: 'image/webp',
      uploaderId: 1,
      deletedAt: null,
      width: 512,
      height: 512,
      status: 'DISABLED'
    }],
    references: [{ fileId: 16, ownerType: 'USER', ownerId: '1', field: 'avatar', sortIndex: 0 }]
  });

  const profile = await getMobileProfile(state.database, 1);
  assert.equal(profile.avatarFileId, null);
});

test('可以更新当前 JWT 用户的昵称和简介', async () => {
  const state = createDatabase({ users: [user(1)] });

  const profile = await updateMobileProfile(state.database, 1, {
    nickname: '小周',
    bio: '认真吃饭，也认真生活'
  });

  assert.equal(profile.nickname, '小周');
  assert.equal(profile.bio, '认真吃饭，也认真生活');
});

test('A 用户不能把 B 用户上传的文件设为头像', async () => {
  const state = createDatabase({
    users: [user(1), user(2)],
    files: [{ id: 20, url: '/uploads/b.webp', mimeType: 'image/webp', uploaderId: 2, deletedAt: null, width: 512, height: 512 }]
  });

  await assert.rejects(
    updateMobileProfile(state.database, 1, { avatarFileId: 20 }),
    (error: Error & { status?: number }) => error.status === 400
  );
});

test('非图片文件不能设为头像', async () => {
  const state = createDatabase({
    users: [user(1)],
    files: [{ id: 21, url: '/uploads/video.mp4', mimeType: 'video/mp4', uploaderId: 1, deletedAt: null, width: null, height: null }]
  });

  await assert.rejects(
    updateMobileProfile(state.database, 1, { avatarFileId: 21 }),
    (error: Error & { status?: number }) => error.status === 400
  );
});

test('GIF 等未允许的图片 MIME 不能设为头像', async () => {
  const state = createDatabase({
    users: [user(1)],
    files: [{
      id: 24,
      url: '/uploads/animated.gif',
      mimeType: 'image/gif',
      uploaderId: 1,
      deletedAt: null,
      width: 512,
      height: 512
    }]
  });

  await assert.rejects(
    updateMobileProfile(state.database, 1, { avatarFileId: 24 }),
    (error: Error & { status?: number }) => error.status === 400
  );
});

test('原样 PATCH 当前历史空 uploader 头像允许保留，但不能换成其他空 uploader 文件', async () => {
  const state = createDatabase({
    users: [{ ...user(1), avatar: '/uploads/historical.webp' }],
    files: [
      { id: 25, url: '/uploads/historical.webp', mimeType: 'image/webp', uploaderId: null, deletedAt: null, width: 512, height: 512 },
      { id: 26, url: '/uploads/other-history.webp', mimeType: 'image/webp', uploaderId: null, deletedAt: null, width: 512, height: 512 }
    ],
    references: [{ fileId: 25, ownerType: 'USER', ownerId: '1', field: 'avatar', sortIndex: 0 }]
  });

  const profile = await updateMobileProfile(state.database, 1, {
    nickname: '更新昵称',
    avatarFileId: 25
  });
  assert.equal(profile.avatarFileId, 25);
  assert.equal(profile.avatar, '/uploads/historical.webp');

  await assert.rejects(
    updateMobileProfile(state.database, 1, { avatarFileId: 26 }),
    (error: Error & { status?: number }) => error.status === 400
  );
});

test('DISABLED 但未软删的图片不能设为头像', async () => {
  const state = createDatabase({
    users: [user(1)],
    files: [{
      id: 27,
      url: '/uploads/disabled.webp',
      mimeType: 'image/webp',
      uploaderId: 1,
      deletedAt: null,
      width: 512,
      height: 512,
      status: 'DISABLED'
    }]
  });

  await assert.rejects(
    updateMobileProfile(state.database, 1, { avatarFileId: 27 }),
    (error: Error & { status?: number }) => error.status === 400
  );
});

test('只更新文字资料时也不返回 DISABLED 头像引用', async () => {
  const state = createDatabase({
    users: [{ ...user(1), avatar: '/uploads/disabled.webp' }],
    files: [{
      id: 28,
      url: '/uploads/disabled.webp',
      mimeType: 'image/webp',
      uploaderId: 1,
      deletedAt: null,
      width: 512,
      height: 512,
      status: 'DISABLED'
    }],
    references: [{ fileId: 28, ownerType: 'USER', ownerId: '1', field: 'avatar', sortIndex: 0 }]
  });

  const profile = await updateMobileProfile(state.database, 1, { nickname: '只改昵称' });
  assert.equal(profile.avatarFileId, null);
});

test('尺寸不足或缺少尺寸的图片不能设为头像', async () => {
  for (const file of [
    { id: 22, url: '/uploads/small.webp', mimeType: 'image/webp', uploaderId: 1, deletedAt: null, width: 511, height: 512 },
    { id: 23, url: '/uploads/unknown.webp', mimeType: 'image/webp', uploaderId: 1, deletedAt: null, width: null, height: null }
  ]) {
    const state = createDatabase({ users: [user(1)], files: [file] });
    await assert.rejects(
      updateMobileProfile(state.database, 1, { avatarFileId: file.id }),
      (error: Error & { status?: number }) => error.status === 400
    );
  }
});

test('设置和替换头像时只保留一条 USER avatar 引用', async () => {
  const state = createDatabase({
    users: [{ ...user(1), avatar: '/uploads/old.webp' }],
    files: [
      { id: 30, url: '/uploads/old.webp', mimeType: 'image/webp', uploaderId: 1, deletedAt: null, width: 512, height: 512 },
      { id: 31, url: '/uploads/new.webp', mimeType: 'image/webp', uploaderId: 1, deletedAt: null, width: 1024, height: 768 }
    ],
    references: [{ fileId: 30, ownerType: 'USER', ownerId: '1', field: 'avatar', sortIndex: 0 }]
  });

  const profile = await updateMobileProfile(state.database, 1, { avatarFileId: 31 });

  assert.equal(profile.avatar, '/uploads/new.webp');
  assert.equal(profile.avatarFileId, 31);
  assert.deepEqual(state.references, [
    { fileId: 31, ownerType: 'USER', ownerId: '1', field: 'avatar', sortIndex: 0 }
  ]);
  assert.deepEqual(state.locks, [31]);
});

test('清空头像会同时清空 URL 和文件引用', async () => {
  const state = createDatabase({
    users: [{ ...user(1), avatar: '/uploads/avatar.webp' }],
    files: [{ id: 40, url: '/uploads/avatar.webp', mimeType: 'image/webp', uploaderId: 1, deletedAt: null, width: 512, height: 512 }],
    references: [{ fileId: 40, ownerType: 'USER', ownerId: '1', field: 'avatar', sortIndex: 0 }]
  });

  const profile = await updateMobileProfile(state.database, 1, { avatarFileId: null });

  assert.equal(profile.avatar, null);
  assert.equal(profile.avatarFileId, null);
  assert.deepEqual(state.references, []);
});

test('头像槽位迁移优先保留与 users.avatar URL 匹配的引用', async () => {
  const migration = await readFile(
    join(process.cwd(), 'prisma/migrations/20260724120000_add_user_bio/migration.sql'),
    'utf8'
  );

  assert.match(migration, /LEFT JOIN "files"/);
  assert.match(migration, /LEFT JOIN "users"/);
  assert.match(migration, /INSERT INTO "file_references"/);
  assert.match(migration, /file\."deleted_at" IS NULL/);
  assert.match(migration, /file\."mime_type" LIKE 'image\/%'/);
  assert.match(migration, /ON CONFLICT DO NOTHING/);
  assert.match(migration, /"owner_type" = 'USER'/);
  assert.match(migration, /"field" = 'avatar'/);
  assert.match(migration, /user_avatar\s*=\s*file_url/);
  assert.ok(
    migration.indexOf('user_avatar = file_url') < migration.indexOf('"created_at" DESC'),
    'URL 匹配优先级必须排在最新创建时间之前'
  );
});

test('头像槽位迁移只自动去重 USER avatar，其他重复槽位必须显式阻断', async () => {
  const migration = await readFile(
    join(process.cwd(), 'prisma/migrations/20260724120000_add_user_bio/migration.sql'),
    'utf8'
  );
  const candidateStart = migration.indexOf('WITH reference_candidates');
  const deleteStart = migration.indexOf('DELETE FROM "file_references"', candidateStart);
  const candidateSql = migration.slice(candidateStart, deleteStart);

  assert.match(candidateSql, /reference\."owner_type" = 'USER'/);
  assert.match(candidateSql, /reference\."field" = 'avatar'/);
  assert.match(candidateSql, /reference\."sort_index" = 0/);
  assert.match(migration, /RAISE EXCEPTION/);
  assert.match(migration, /HAVING COUNT\(\*\) > 1/);
});

test('头像迁移在显式事务内先预检非头像重复槽位再执行任何变更', async () => {
  const migration = await readFile(
    join(process.cwd(), 'prisma/migrations/20260724120000_add_user_bio/migration.sql'),
    'utf8'
  );
  const begin = migration.indexOf('BEGIN;');
  const preflight = migration.indexOf('duplicate non-avatar file reference slots');
  const alter = migration.indexOf('ALTER TABLE');
  const backfill = migration.indexOf('INSERT INTO "file_references"');
  const commit = migration.lastIndexOf('COMMIT;');

  assert.equal(begin, 0);
  assert.ok(preflight > begin);
  assert.ok(preflight < alter);
  assert.ok(preflight < backfill);
  assert.ok(commit > backfill);
});
