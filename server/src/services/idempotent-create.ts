type CreateOrLoadOptions<T> = {
  load: () => Promise<T | null>;
  create: () => Promise<T>;
};

const isUniqueConstraintError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === 'P2002';

export const createOrLoadByUniqueKey = async <T>({ load, create }: CreateOrLoadOptions<T>): Promise<T> => {
  const existing = await load();
  if (existing) return existing;

  try {
    return await create();
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const concurrentResult = await load();
    if (concurrentResult) return concurrentResult;
    throw error;
  }
};
