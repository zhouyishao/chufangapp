import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const srcRoot = fileURLToPath(new URL('../src/', import.meta.url));

const collectStyleSources = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectStyleSources(path));
    } else if (['.vue', '.scss'].includes(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
};

test('页面与组件只消费统一安全区和层级 Token', async () => {
  const files = await collectStyleSources(srcRoot);
  const violations = [];

  for (const file of files) {
    if (file.endsWith('/styles/global.scss')) {
      continue;
    }

    const source = await readFile(file, 'utf8');
    if (
      /env\(safe-area-inset-(?:top|bottom)/.test(source) ||
      /var\(--status-bar-height\)/.test(source) ||
      /var\(--app-z-fixed\)/.test(source)
    ) {
      violations.push(file);
    }
  }

  assert.deepEqual(violations, []);
});

test('共享详情底栏使用统一底部安全区并约束在 393px 画布内', async () => {
  const source = await readFile(new URL('../src/components/content-detail-bottom-bar.vue', import.meta.url), 'utf8');

  assert.match(source, /var\(--app-safe-area-bottom\)/);
  assert.match(source, /max-width:\s*var\(--app-canvas-width\)/);
  assert.doesNotMatch(source, /env\(safe-area-inset-bottom/);
});
