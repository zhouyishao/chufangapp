export type MockPagination = {
  page: number;
  pageSize: number;
  total: number;
};

export type MockApiListResponse<T> = {
  code: 0;
  message: 'success';
  data: {
    list: T[];
    pagination: MockPagination;
  };
};

export type MockUploadResponse = {
  code: 0;
  message: 'success';
  data: {
    url: string;
  };
};

const normalizeMockPage = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
};

const normalizeMockPageSize = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
};

export const createMockListResponse = <T,>(items: T[] = [], page: unknown = 1, pageSize: unknown = 10): MockApiListResponse<T> => {
  const safePage = normalizeMockPage(page, 1);
  const safePageSize = normalizeMockPageSize(pageSize, 10);
  const start = (safePage - 1) * safePageSize;
  return {
    code: 0,
    message: 'success',
    data: {
      list: items.slice(start, start + safePageSize),
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total: items.length
      }
    }
  };
};

export const resolveMockList = async <T,>(items: T[] = [], page: unknown = 1, pageSize: unknown = 10) => {
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  return createMockListResponse(items, page, pageSize);
};

export const mockUploadImage = async (file: File): Promise<MockUploadResponse> => {
  await new Promise((resolve) => window.setTimeout(resolve, 240));
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  return {
    code: 0,
    message: 'success',
    data: {
      url: `/uploads/mock-${Date.now()}.${extension}`
    }
  };
};
