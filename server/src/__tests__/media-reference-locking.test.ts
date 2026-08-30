import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { lockActiveMediaFiles } from '../services/file-mutation';

test('媒体引用写入前按稳定顺序锁定并验证文件仍为 active', async () => {
  const locks: number[] = [];
  const lookups: number[] = [];
  const database = {
    $executeRawUnsafe: async (_query: string, _namespace: number, fileId: number) => {
      locks.push(fileId);
      return 1;
    },
    file: {
      findFirst: async ({ where }: { where: { id: number; deletedAt: null; status: 'ACTIVE' } }) => {
        lookups.push(where.id);
        return where.id === 9 ? null : { id: where.id };
      }
    }
  };

  await assert.rejects(
    lockActiveMediaFiles(database, [7, 3, 7, 9]),
    (error: Error & { status?: number }) => error.status === 422
  );
  assert.deepEqual(locks, [3, 7, 9]);
  assert.deepEqual(lookups, [3, 7, 9]);
});
test('菜谱和饮品步骤媒体写入均在事务内调用统一文件锁', async () => {
  for (const relativePath of ['src/routes/admin/recipes.ts', 'src/routes/admin/beverages.ts']) {
    const source = await readFile(join(process.cwd(), relativePath), 'utf8');
    assert.match(source, /prisma\.\$transaction/);
    assert.match(source, /lockActiveMediaFiles\(tx,/);
  }
});
