export type ApiSuccess<T> = {
  code: 0;
  message: 'success';
  data: T;
};

export type ApiFail = {
  code: number;
  message: string;
  data: null;
};

export const ok = <T>(data: T): ApiSuccess<T> => ({ code: 0, message: 'success', data });

export const fail = (code: number, message: string): ApiFail => ({ code, message, data: null });

export type PageResult<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
};
