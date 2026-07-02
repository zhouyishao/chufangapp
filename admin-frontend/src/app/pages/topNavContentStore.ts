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

export const defaultCarouselItems = (): CarouselItem[] => [];

export const defaultModuleItems = (_nav: HomeTopNav): ModuleItem[] => [];

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
