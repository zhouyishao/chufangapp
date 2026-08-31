import { HttpError } from '../http/errors';
import { lockFileForMutation } from './file-mutation';

export type MobileProfile = {
  id: number;
  phone: string | null;
  nickname: string | null;
  bio: string | null;
  avatar: string | null;
  avatarFileId: number | null;
  createdAt: Date;
  _count: {
    favorites: number;
    comments: number;
    posts: number;
  };
};

type StoredProfile = Omit<MobileProfile, 'avatarFileId'>;

type ProfileReferenceWhere = {
  ownerType: 'USER';
  ownerId: string;
  field: 'avatar';
  sortIndex: 0;
};

const avatarMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type MobileProfileDatabase = {
  user: {
    findFirst(args: {
      where: { id: number; deletedAt: null };
      select: typeof profileSelect;
    }): Promise<StoredProfile | null>;
    update(args: {
      where: { id: number };
      data: {
        nickname?: string;
        bio?: string | null;
        avatar?: string | null;
      };
      select: typeof profileSelect;
    }): Promise<StoredProfile>;
  };
  file: {
    findFirst(args: {
      where: {
        id: number;
        uploaderId?: number;
        OR?: Array<{ uploaderId: number | null }>;
        deletedAt: null;
        status: 'ACTIVE';
        mimeType: { in: string[] };
      };
      select: { id: true; url: true; width: true; height: true };
    }): Promise<{ id: number; url: string; width: number | null; height: number | null } | null>;
  };
  fileReference: {
    findFirst(args: {
      where: ProfileReferenceWhere & {
        file?: {
          OR: Array<{ uploaderId: number | null }>;
          deletedAt: null;
          status: 'ACTIVE';
          mimeType: { startsWith: 'image/' };
        };
      };
      select: { fileId: true };
    }): Promise<{ fileId: number } | null>;
    deleteMany(args: { where: ProfileReferenceWhere }): Promise<unknown>;
    upsert(args: {
      where: { ownerType_ownerId_field_sortIndex: ProfileReferenceWhere };
      create: ProfileReferenceWhere & { fileId: number };
      update: { fileId: number };
    }): Promise<unknown>;
  };
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $transaction<T>(callback: (transaction: MobileProfileDatabase) => Promise<T>): Promise<T>;
};

export type MobileProfileUpdate = {
  nickname?: string;
  bio?: string | null;
  avatarFileId?: number | null;
};

const profileSelect = {
  id: true,
  phone: true,
  nickname: true,
  bio: true,
  avatar: true,
  createdAt: true,
  _count: { select: { favorites: true, comments: true, posts: true } }
} as const;

const avatarReferenceWhere = (userId: number): ProfileReferenceWhere => ({
  ownerType: 'USER',
  ownerId: String(userId),
  field: 'avatar',
  sortIndex: 0
});

const readableAvatarFileWhere = (userId: number) => ({
  OR: [{ uploaderId: userId }, { uploaderId: null }],
  deletedAt: null as null,
  status: 'ACTIVE' as const,
  mimeType: { startsWith: 'image/' as const }
});

const withAvatarFileId = (profile: StoredProfile, avatarFileId: number | null): MobileProfile => ({
  ...profile,
  avatarFileId
});

export const getMobileProfile = async (
  database: MobileProfileDatabase,
  userId: number
): Promise<MobileProfile> => {
  const [profile, avatarReference] = await Promise.all([
    database.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: profileSelect
    }),
    database.fileReference.findFirst({
      where: {
        ...avatarReferenceWhere(userId),
        file: readableAvatarFileWhere(userId)
      },
      select: { fileId: true }
    })
  ]);

  if (!profile) throw new HttpError('not found', 404, 404);
  return withAvatarFileId(profile, avatarReference?.fileId ?? null);
};

export const updateMobileProfile = async (
  database: MobileProfileDatabase,
  userId: number,
  input: MobileProfileUpdate
): Promise<MobileProfile> => database.$transaction(async (transaction) => {
  const referenceWhere = avatarReferenceWhere(userId);
  let avatarFileId: number | null | undefined;
  let avatar: string | null | undefined;

  if (input.avatarFileId !== undefined) {
    avatarFileId = input.avatarFileId;
    const currentReference = await transaction.fileReference.findFirst({
      where: referenceWhere,
      select: { fileId: true }
    });
    if (avatarFileId === null) {
      if (currentReference) await lockFileForMutation(transaction, currentReference.fileId);
      avatar = null;
    } else {
      await lockFileForMutation(transaction, avatarFileId);
      const keepsCurrentHistoricalAvatar = currentReference?.fileId === avatarFileId;
      const file = await transaction.file.findFirst({
        where: {
          id: avatarFileId,
          ...(keepsCurrentHistoricalAvatar
            ? { OR: [{ uploaderId: userId }, { uploaderId: null }] }
            : { uploaderId: userId }),
          deletedAt: null,
          status: 'ACTIVE',
          mimeType: { in: [...avatarMimeTypes] }
        },
        select: { id: true, url: true, width: true, height: true }
      });
      if (!file || file.width === null || file.height === null || file.width < 512 || file.height < 512) {
        throw new HttpError('头像文件无效', 400, 400);
      }
      avatar = file.url;
    }
  }

  const profile = await transaction.user.update({
    where: { id: userId },
    data: {
      ...(input.nickname !== undefined ? { nickname: input.nickname } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(avatar !== undefined ? { avatar } : {})
    },
    select: profileSelect
  });

  if (avatarFileId !== undefined) {
    if (avatarFileId === null) {
      await transaction.fileReference.deleteMany({ where: referenceWhere });
    } else {
      await transaction.fileReference.upsert({
        where: { ownerType_ownerId_field_sortIndex: referenceWhere },
        create: { fileId: avatarFileId, ...referenceWhere },
        update: { fileId: avatarFileId }
      });
    }
  }

  if (avatarFileId === undefined) {
    const reference = await transaction.fileReference.findFirst({
      where: {
        ...referenceWhere,
        file: readableAvatarFileWhere(userId)
      },
      select: { fileId: true }
    });
    avatarFileId = reference?.fileId ?? null;
  }

  return withAvatarFileId(profile, avatarFileId);
});
