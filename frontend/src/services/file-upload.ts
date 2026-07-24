import { getAuthToken, handleAuthExpired } from './auth-session';
import { API_BASE, ApiError, apiRequest, resolveAssetUrl } from './public-api';

type ApiUploadResponse = {
  code: number;
  message: string;
  data: UploadedFile | null;
};

export type UploadedFile = {
  id: number;
  url: string;
  mimeType: string;
  size: number;
};

export type UploadAvatarOptions = {
  onProgress?: (progress: number) => void;
};

export type UploadPurpose = 'avatar' | 'family-avatar';

export type UploadController = {
  promise: Promise<UploadedFile>;
  abort: () => void;
};

const PENDING_FILE_CLEANUP_STORAGE_KEY = 'recipe-app-pending-file-cleanup';
const MAX_FILE_CLEANUP_ATTEMPTS = 5;
const FILE_CLEANUP_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type PendingFileCleanupItem = {
  userId: number;
  fileId: number;
  attempts: number;
  createdAt: number;
};

const loadPendingFileCleanup = (): PendingFileCleanupItem[] => {
  const stored = uni.getStorageSync(PENDING_FILE_CLEANUP_STORAGE_KEY) as unknown;
  if (!Array.isArray(stored)) return [];
  const now = Date.now();

  return stored.flatMap((item) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as PendingFileCleanupItem).userId !== 'number' ||
      typeof (item as PendingFileCleanupItem).fileId !== 'number'
    ) {
      return [];
    }
    const candidate = item as Partial<PendingFileCleanupItem>;
    return [{
      userId: candidate.userId as number,
      fileId: candidate.fileId as number,
      attempts: typeof candidate.attempts === 'number' ? candidate.attempts : 0,
      createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : now
    }];
  });
};

const savePendingFileCleanup = (items: PendingFileCleanupItem[]) => {
  if (items.length === 0) {
    uni.removeStorageSync(PENDING_FILE_CLEANUP_STORAGE_KEY);
    return;
  }
  uni.setStorageSync(PENDING_FILE_CLEANUP_STORAGE_KEY, items);
};

const prunePendingFileCleanup = (items: PendingFileCleanupItem[], now = Date.now()) =>
  items.filter(
    (item) =>
      item.attempts < MAX_FILE_CLEANUP_ATTEMPTS &&
      now - item.createdAt < FILE_CLEANUP_MAX_AGE_MS
  );

export const enqueuePendingFileCleanup = (userId: number, fileId: number) => {
  const items = prunePendingFileCleanup(loadPendingFileCleanup());
  if (items.some((item) => item.userId === userId && item.fileId === fileId)) return;
  savePendingFileCleanup([...items, { userId, fileId, attempts: 0, createdAt: Date.now() }]);
};

export const removePendingFileCleanup = (userId: number, fileId: number) => {
  savePendingFileCleanup(
    prunePendingFileCleanup(loadPendingFileCleanup()).filter(
      (item) => item.userId !== userId || item.fileId !== fileId
    )
  );
};

const incrementPendingFileCleanupAttempts = (userId: number, fileId: number) => {
  const now = Date.now();
  savePendingFileCleanup(
    prunePendingFileCleanup(
      loadPendingFileCleanup().map((item) =>
        item.userId === userId && item.fileId === fileId
          ? { ...item, attempts: item.attempts + 1 }
          : item
      ),
      now
    )
  );
};

export const handlePendingFileCleanupFailure = (
  userId: number,
  fileId: number,
  error: unknown
) => {
  if (error instanceof ApiError && (error.code === 404 || error.code === 409)) {
    removePendingFileCleanup(userId, fileId);
    return;
  }
  incrementPendingFileCleanupAttempts(userId, fileId);
};

export const deleteUploadedFile = async (fileId: number, tokenOverride?: string): Promise<void> => {
  await apiRequest<{ id: number }>(`/files/${fileId}`, {
    method: 'DELETE',
    authToken: tokenOverride,
    handleAuthExpired: tokenOverride === undefined
  });
};

export const retryPendingFileCleanup = async (userId: number, token: string): Promise<void> => {
  const activeItems = prunePendingFileCleanup(loadPendingFileCleanup());
  savePendingFileCleanup(activeItems);
  const pendingItems = activeItems.filter((item) => item.userId === userId);
  for (const item of pendingItems) {
    try {
      await deleteUploadedFile(item.fileId, token);
      removePendingFileCleanup(userId, item.fileId);
    } catch (error) {
      handlePendingFileCleanupFailure(userId, item.fileId, error);
    }
  }
};

const parseUploadResponse = (raw: string): ApiUploadResponse => {
  try {
    return JSON.parse(raw) as ApiUploadResponse;
  } catch {
    throw new ApiError('上传服务返回异常，请稍后重试');
  }
};

export const uploadAvatarFile = (
  filePath: string,
  options: UploadAvatarOptions = {},
  purpose: UploadPurpose = 'avatar'
): UploadController => {
  const token = getAuthToken();
  if (!token) {
    handleAuthExpired();
    return {
      promise: Promise.reject(new ApiError('请先登录', 401)),
      abort: () => undefined
    };
  }

  let task: UniApp.UploadTask | undefined;
  const promise = new Promise<UploadedFile>((resolve, reject) => {
    task = uni.uploadFile({
      url: `${API_BASE}/files?purpose=${purpose}`,
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${token}`
      },
      timeout: 20000,
      success: (response) => {
        try {
          const result = parseUploadResponse(response.data);
          if (response.statusCode === 401 || result.code === 401) {
            handleAuthExpired();
            reject(new ApiError(result.message || '登录已过期', 401));
            return;
          }
          if (result.code !== 0 || !result.data) {
            reject(new ApiError(result.message || '图片上传失败', result.code || response.statusCode));
            return;
          }
          resolve({
            ...result.data,
            url: resolveAssetUrl(result.data.url)
          });
        } catch (error) {
          reject(error instanceof Error ? error : new ApiError('图片上传失败'));
        }
      },
      fail: (error) => {
        reject(new ApiError(error.errMsg?.includes('abort') ? '已取消上传' : '上传失败，请检查网络后重试'));
      }
    });

    task?.onProgressUpdate((event) => {
      options.onProgress?.(Math.max(0, Math.min(100, event.progress)));
    });
  });

  return {
    promise,
    abort: () => task?.abort()
  };
};
