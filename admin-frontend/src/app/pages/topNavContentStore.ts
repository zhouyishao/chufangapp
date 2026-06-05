import type { HomeTopNav } from '../api';

export type ConfigStatus = 'online' | 'draft' | 'offline';

export type CarouselItem = {
  id: string;
  title: string;
  jumpType: string;
  relation: string;
  sort: number;
  status: ConfigStatus;
};

export type ModuleItem = {
  id: string;
  name: string;
  type: string;
  source: string;
  count: number;
  sort: number;
  status: ConfigStatus;
};

type TopNavContentConfig = {
  carouselItems: CarouselItem[];
  modules: ModuleItem[];
};

const keyFor = (navId: string) => `homeTopNavContentConfig:${navId}`;

export const defaultCarouselItems = (): CarouselItem[] => [
  { id: 'carousel_1', title: '今日家常好菜', jumpType: '菜谱详情', relation: '番茄牛腩', sort: 1, status: 'online' },
  { id: 'carousel_2', title: '一周晚餐推荐', jumpType: '专题页', relation: '一周晚餐不重样', sort: 2, status: 'online' },
  { id: 'carousel_3', title: '下饭菜合集', jumpType: '分类页', relation: '下饭菜', sort: 3, status: 'draft' }
];

export const defaultModuleItems = (nav: HomeTopNav): ModuleItem[] => [
  { id: 'module_main', name: `${nav.name}菜单`, type: '菜谱列表模块', source: nav.relations?.[0]?.relationName ?? '未配置', count: nav.contentRule?.displayCount ?? 6, sort: 1, status: nav.status },
  { id: 'module_today', name: '今日推荐', type: '推荐位模块', source: '推荐内容池', count: 6, sort: 2, status: nav.status },
  { id: 'module_season', name: '时令食材', type: '食材模块', source: '当季食材', count: 4, sort: 3, status: nav.status },
  { id: 'module_topic', name: '精选专题', type: '专题模块', source: '专题列表', count: 2, sort: 4, status: 'draft' }
];

const normalizeSort = <T extends { sort: number }>(rows: T[]) =>
  [...rows].sort((a, b) => a.sort - b.sort).map((row, index) => ({ ...row, sort: index + 1 }));

const readStored = (navId: string): Partial<TopNavContentConfig> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(keyFor(navId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<TopNavContentConfig>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const loadTopNavContentConfig = (navId: string, nav: HomeTopNav): TopNavContentConfig => {
  const stored = readStored(navId);
  const storedCarousels = Array.isArray(stored.carouselItems) ? stored.carouselItems : null;
  const storedModules = Array.isArray(stored.modules) ? stored.modules : null;
  return {
    carouselItems: normalizeSort(storedCarousels ?? defaultCarouselItems()),
    modules: normalizeSort(storedModules ?? defaultModuleItems(nav))
  };
};

export const saveTopNavContentConfig = (navId: string, config: TopNavContentConfig) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(keyFor(navId), JSON.stringify({
    carouselItems: normalizeSort(config.carouselItems),
    modules: normalizeSort(config.modules)
  }));
};

export const saveCarouselItem = (navId: string, nav: HomeTopNav, item: CarouselItem) => {
  const current = loadTopNavContentConfig(navId, nav);
  const exists = current.carouselItems.some((row) => row.id === item.id);
  const carouselItems = exists
    ? current.carouselItems.map((row) => row.id === item.id ? item : row)
    : [...current.carouselItems, item];
  saveTopNavContentConfig(navId, { ...current, carouselItems });
};

export const saveModuleItem = (navId: string, nav: HomeTopNav, item: ModuleItem) => {
  const current = loadTopNavContentConfig(navId, nav);
  const exists = current.modules.some((row) => row.id === item.id);
  const modules = exists
    ? current.modules.map((row) => row.id === item.id ? item : row)
    : [...current.modules, item];
  saveTopNavContentConfig(navId, { ...current, modules });
};
