/**
 * page-modules API 测试
 *
 * 启动方式：先启动 server（npm run dev），再运行测试。
 *
 *   cd server && npx tsx src/__tests__/page-modules.test.ts
 *
 * 或内联运行：
 *   curl 'http://localhost:3002/api/app/page-modules?page=category&type=recipe&filter=recommend'
 */

const BASE = process.env.API_BASE ?? 'http://127.0.0.1:3002';

type ApiResponse<T = unknown> = { code: number; message: string; data: T };

type PageModule = {
  moduleType: string;
  sortOrder: number;
  config?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

async function get(path: string): Promise<ApiResponse> {
  const url = `${BASE}${path}`;
  const res = await fetch(url);
  const json = (await res.json()) as ApiResponse;
  if (json.code !== 0) throw new Error(`API error: ${json.message}`);
  return json;
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
  } catch (err) {
    console.error(`  ❌ ${name}: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log('page-modules API 测试\n');

  // ====== 1. top-navs page 参数 ======
  console.log('1. top-navs page 参数');

  await test('GET /top-navs?page=category 只返回 category_top 导航', async () => {
    const res = await get('/api/app/home/top-navs?page=category');
    const navs = res.data as Array<{ contentType: string | null; displayPosition: string }>;
    if (!Array.isArray(navs)) throw new Error('data is not an array');
    if (navs.length > 0) {
      const wrongPosition = navs.some(n => n.displayPosition !== 'category_top');
      if (wrongPosition) throw new Error('返回了非 category_top 的导航');
    }
  });

  await test('GET /top-navs?page=home 只返回 home_top 导航', async () => {
    const res = await get('/api/app/home/top-navs?page=home');
    const navs = res.data as Array<{ displayPosition: string }>;
    if (!Array.isArray(navs)) throw new Error('data is not an array');
    if (navs.length > 0) {
      const wrongPosition = navs.some(n => n.displayPosition !== 'home_top');
      if (wrongPosition) throw new Error('返回了非 home_top 的导航');
    }
  });

  // ====== 2. page-modules 五种 type ======
  const types = ['recipe', 'ingredient', 'fruit', 'seasoning', 'beverage'] as const;
  // category_grid 仅在后台配置了 FOUR_CARD_GRID 内容模块时才返回
const baseModules = ['search_bar', 'top_nav', 'category_filter', 'hero_banner', 'content_module'];
const expectedModules = [...baseModules]; // category_grid is optional

  for (const type of types) {
    console.log(`\n2. page-modules type=${type}`);

    await test(`GET /page-modules?page=category&type=${type} 返回6个模块`, async () => {
      const res = await get(`/api/app/page-modules?page=category&type=${type}&filter=recommend`);
      const modules = res.data as PageModule[];
      if (!Array.isArray(modules)) throw new Error('data is not an array');
      const moduleTypes = modules.map(m => m.moduleType);
      const missing = expectedModules.filter(m => !moduleTypes.includes(m));
      if (missing.length > 0) throw new Error(`缺少模块: ${missing.join(', ')}`);
    });

    await test(`GET /page-modules?page=category&type=${type} activeKey=${type}`, async () => {
      const res = await get(`/api/app/page-modules?page=category&type=${type}&filter=recommend`);
      const modules = res.data as PageModule[];
      const topNav = modules.find(m => m.moduleType === 'top_nav');
      if (!topNav) throw new Error('缺少 top_nav 模块');
      const data = topNav.data as { activeKey: string } | undefined;
      if (!data || data.activeKey !== type) {
        throw new Error(`top_nav.activeKey 期望 ${type}，实际 ${data?.activeKey}`);
      }
    });

    await test(`GET /page-modules?page=category&type=${type} category_filter 第一个是「推荐」`, async () => {
      const res = await get(`/api/app/page-modules?page=category&type=${type}&filter=recommend`);
      const modules = res.data as PageModule[];
      const catFilter = modules.find(m => m.moduleType === 'category_filter');
      if (!catFilter) throw new Error('缺少 category_filter 模块');
      const data = catFilter.data as { items: Array<{ name: string; key: string; type: string }> } | undefined;
      if (!data || !Array.isArray(data.items)) throw new Error('category_filter.items 不是数组');
      if (data.items.length === 0) throw new Error('category_filter 为空');
      const first = data.items[0]!;
      if (first.name !== '推荐' || first.key !== 'recommend' || first.type !== 'system') {
        throw new Error(`第一个 item 不是「推荐」: ${JSON.stringify(first)}`);
      }
    });

    await test(`GET /page-modules?page=category&type=${type} category_filter 后面的来自分类管理`, async () => {
      const res = await get(`/api/app/page-modules?page=category&type=${type}&filter=recommend`);
      const modules = res.data as PageModule[];
      const catFilter = modules.find(m => m.moduleType === 'category_filter');
      const data = catFilter?.data as { items: Array<{ type: string }> } | undefined;
      if (!data) throw new Error('缺少 category_filter.data');
      const afterSystem = data.items.slice(1);
      if (afterSystem.length === 0) {
        console.log(`    ⚠️  type=${type} 暂无系统分类数据（需先运行 seed）`);
        return;
      }
      const allCategory = afterSystem.every(item => item.type === 'category');
      if (!allCategory) throw new Error('「推荐」后面的 item type 不是 category');
    });
  }

  // ====== 3. BEVERAGE category_filter 专项检查 ======
  console.log('\n3. BEVERAGE category_filter 专项');

  await test('beverage 类型下 category_filter 能返回酒水分类', async () => {
    const res = await get('/api/app/page-modules?page=category&type=beverage&filter=recommend');
    const modules = res.data as PageModule[];
    const catFilter = modules.find(m => m.moduleType === 'category_filter');
    const data = catFilter?.data as { items: Array<{ name: string }> } | undefined;
    if (!data || data.items.length <= 1) {
      throw new Error('beverage 类型下 category_filter 缺少酒水分类（需先运行 seed）');
    }
    const names = data.items.slice(1).map(i => i.name);
    console.log(`    酒水分类: ${names.join(', ')}`);
  });

  await test('beverage 类型下 category_grid 按需出现（需后台配置四宫格模块）', async () => {
    const res = await get('/api/app/page-modules?page=category&type=beverage&filter=recommend');
    const modules = res.data as PageModule[];
    const catGrid = modules.find(m => m.moduleType === 'category_grid');
    // category_grid 仅在后台配置了 FOUR_CARD_GRID 内容模块时才返回
    // 未配置时不出现在模块列表中（符合预期）
    if (catGrid) {
      const data = catGrid.data as { items: unknown[] } | undefined;
      if (!data || !Array.isArray(data.items)) throw new Error('category_grid.items 不是数组');
      // 不应包含「推荐」系统项
      const hasSystem = data.items.some((i) => (i as Record<string, unknown>).type === 'system');
      if (hasSystem) throw new Error('category_grid 不应包含系统项「推荐」');
    }
  });

  console.log('\n===== 测试完成 =====');
}

main().catch(err => {
  console.error('测试异常:', err);
  process.exit(1);
});
