import { ArrowLeft, Eye, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  deleteContentModule,
  deleteHeroBanner,
  getHomeTopNav,
  listContentModules,
  listHeroBanners,
  updateContentModule,
  updateContentModuleStatus,
  updateHeroBannerStatus,
  updateHomeTopNav,
  resolveAssetUrl,
  listCategories,
  type BannerStatus,
  type ContentModule,
  type ContentModulePayload,
  type ContentModuleStatus,
  type HeroBanner,
  type HomeTopNav,
  type HomeTopNavPayload
} from '../api';
import type { IngredientCategory } from '../types';
import { Button } from '../components/Button';
import { StatusTag } from '../components/StatusTag';

const plusIconUrl = new URL('../assets/icons/icon_plus.svg', import.meta.url).href;
const searchIconUrl = new URL('../assets/icons/icon_search.svg', import.meta.url).href;

const statusLabelMap: Record<string, string> = {
  ENABLED: '已启用',
  DRAFT: '草稿',
  DISABLED: '已停用'
};

const statusToneMap: Record<string, 'green' | 'orange' | 'gray'> = {
  ENABLED: 'green',
  DRAFT: 'orange',
  DISABLED: 'gray'
};

const targetTypeLabelMap: Record<string, string> = {
  NONE: '无跳转',
  URL: '自定义链接',
  RECIPE: '菜谱',
  INGREDIENT: '食材',
  CATEGORY: '分类',
  MENU: '菜单',
  BEVERAGE: '酒水',
  TOPIC: '专题'
};

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
};

const toPayload = (item: HomeTopNav): HomeTopNavPayload => ({
  name: item.name,
  alias: item.alias ?? '',
  navType: item.navType,
  displayPosition: item.displayPosition,
  iconUrl: item.iconUrl ?? null,
  sortOrder: item.sortOrder,
  status: item.status,
  isDefault: item.isDefault,
  isFixed: item.isFixed,
  showMoreEntry: item.showMoreEntry,
  description: item.description ?? '',
  remark: item.remark ?? '',
  relations: item.relations ?? [],
  contentRule: item.contentRule ?? {
    sourceType: 'category',
    difficultyFilter: 'all',
    durationFilter: 'all',
    cookingMethodFilter: 'all',
    displayCount: 6,
    sortRule: 'comprehensive',
    moreButtonText: '查看更多',
    jumpRule: 'nav_content_list'
  },
  style: item.style ?? {
    navStyle: 'text_tab',
    activeStyle: 'underline',
    layoutMode: 'fixed',
    textColor: '#666666',
    activeTextColor: '#7A8B6F',
    showDivider: true,
    tabGap: 'medium',
    reserveSpace: false
  }
});

const toModulePayload = (item: ContentModule, sortOrder = item.sortOrder): ContentModulePayload => ({
  title: item.title,
  subtitle: item.subtitle,
  displayStyle: item.displayStyle,
  contentType: item.contentType,
  contentSource: item.contentSource,
  displayCount: item.displayCount,
  showMore: item.showMore,
  showTitle: item.showTitle,
  moreLink: item.moreLink,
  sortOrder,
  status: item.status,
  items: item.items,
  categoryId: item.categoryId,
  tagId: item.tagId
});

export const TopNavContentConfigPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nav, setNav] = useState<HomeTopNav | null>(null);
  const [draft, setDraft] = useState<HomeTopNavPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [carouselItems, setCarouselItems] = useState<HeroBanner[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(false);
  const [moduleItems, setModuleItems] = useState<ContentModule[]>([]);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleSorting, setModuleSorting] = useState(false);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);

  const selectedRelation = draft?.relations[0] ?? null;
  const carouselApiNavId = nav?.legacyId ? String(nav.legacyId) : id;
  const showCarouselSettings = false;

  const loadNav = async () => {
    if (!id) return;
    setError(null);
    const item = await getHomeTopNav(id);
    setNav(item);
    setDraft(toPayload(item));
  };

  const loadCarousels = useCallback(async () => {
    if (!carouselApiNavId) return;
    setCarouselLoading(true);
    try {
      const result = await listHeroBanners(carouselApiNavId, { page: 1, pageSize: 50 });
      setCarouselItems(result.list);
    } catch (err) {
      // 首次加载失败不阻塞页面
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err instanceof Error ? err.message : '加载轮播图失败');
      }
    } finally {
      setCarouselLoading(false);
    }
  }, [carouselApiNavId]);

  useEffect(() => {
    void loadNav().catch((err) => setError(err instanceof Error ? err.message : '加载导航失败'));
  }, [id]);

  useEffect(() => {
    if (carouselApiNavId) void loadCarousels();
  }, [carouselApiNavId, loadCarousels]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await listCategories({ page: 1, pageSize: 200 });
        setCategories(result.list);
      } catch (err) {
        console.error('加载分类失败', err);
      }
    };
    void fetchCategories();
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => {
      if (c.legacyId !== undefined) {
        map.set(c.legacyId, c.name);
      }
    });
    return map;
  }, [categories]);

  const saveNavConfig = async () => {
    if (!id || !draft) return;
    if (!draft.relations.length) return setError('请先选择关联内容');
    setSaving(true);
    setError(null);
    try {
      await updateHomeTopNav(id, draft);
      setNotice('内容配置已保存');
      await loadNav();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addCarousel = () => {
    if (!id) return;
    navigate(`/home-ops/top-nav/${id}/content/carousels/new`);
  };

  const editCarousel = (item: HeroBanner) => {
    if (!id) return;
    navigate(`/home-ops/top-nav/${id}/content/carousels/${item.id}/edit`);
  };

  const toggleCarouselStatus = async (item: HeroBanner) => {
    if (!id) return;
    const nextStatus: BannerStatus = item.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    try {
      await updateHeroBannerStatus(carouselApiNavId ?? id, item.id, nextStatus);
      setNotice(nextStatus === 'ENABLED' ? `「${item.title}」已启用` : `「${item.title}」已停用`);
      await loadCarousels();
    } catch (err) {
      setError(err instanceof Error ? err.message : '状态更新失败');
    }
  };

  const deleteCarouselItem = async (item: HeroBanner) => {
    if (!id) return;
    if (!window.confirm(`确认删除「${item.title}」？删除后不可恢复。`)) return;
    try {
      await deleteHeroBanner(carouselApiNavId ?? id, item.id);
      setNotice('轮播图已删除');
      await loadCarousels();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  // ====== 内容模块管理 ======

  const loadModules = useCallback(async () => {
    if (!id) return;
    setModuleLoading(true);
    try {
      const result = await listContentModules(id, { page: 1, pageSize: 50 });
      setModuleItems(result.list);
    } catch (err) {
      // 首次加载失败不阻塞页面
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err instanceof Error ? err.message : '加载模块失败');
      }
    } finally {
      setModuleLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void loadModules();
  }, [id, loadModules]);

  const addModule = () => {
    if (!id) return;
    navigate(`/home-ops/top-nav/${id}/content/modules/new`);
  };

  const editModule = (item: ContentModule) => {
    if (!id) return;
    navigate(`/home-ops/top-nav/${id}/content/modules/${item.id}/edit`);
  };

  const toggleModuleStatus = async (item: ContentModule) => {
    if (!id) return;
    const nextStatus: ContentModuleStatus = item.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    try {
      await updateContentModuleStatus(id, item.id, nextStatus);
      setNotice(nextStatus === 'ENABLED' ? `「${item.title}」已启用` : `「${item.title}」已停用`);
      await loadModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : '状态更新失败');
    }
  };

  const moveModule = async (item: ContentModule, direction: -1 | 1) => {
    if (!id || moduleSorting) return;
    const currentIndex = moduleItems.findIndex((moduleItem) => moduleItem.id === item.id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= moduleItems.length) return;

    const reorderedItems = [...moduleItems];
    [reorderedItems[currentIndex], reorderedItems[targetIndex]] = [reorderedItems[targetIndex], reorderedItems[currentIndex]];
    const normalizedItems = reorderedItems.map((moduleItem, index) => ({ ...moduleItem, sortOrder: index + 1 }));

    setModuleItems(normalizedItems);
    setModuleSorting(true);
    setError(null);
    try {
      await Promise.all(
        normalizedItems.map((moduleItem) => updateContentModule(id, moduleItem.id, toModulePayload(moduleItem)))
      );
      setNotice('模块排序已保存');
      await loadModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : '排序保存失败');
      await loadModules();
    } finally {
      setModuleSorting(false);
    }
  };

  const deleteModuleItem = async (item: ContentModule) => {
    if (!id) return;
    if (!window.confirm(`确认删除「${item.title}」？删除后不可恢复。`)) return;
    try {
      await deleteContentModule(id, item.id);
      setNotice('模块已删除');
      await loadModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  if (!draft || !nav) {
    return (
      <section className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-8 text-sm text-[#8c8c8c]">
        {error ?? '加载中...'}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1540px] space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#2f2f2f]">{nav.name} 内容配置</h1>
          <div className="mt-4 grid gap-3 rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] px-5 py-4 text-sm text-[#5f5f5f] md:grid-cols-5">
            <span>导航名称：<b className="text-[#6f8663]">{nav.name}</b></span>
            <span>导航类型：{nav.navTypeText ?? nav.navType}</span>
            <span>关联内容：{selectedRelation?.relationName ?? '-'}</span>
            <span>状态：<b className="text-[#6f8663]">{statusLabelMap[nav.status] ?? nav.status}</b></span>
            <span>排序：{nav.sortOrder}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" className="h-11 rounded-lg border-[#d9d2c6] bg-[#fffdfc]" onClick={() => navigate('/home-ops')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回导航管理
          </Button>
          <Button variant="ghost" className="h-11 rounded-lg border-[#d9d2c6] bg-[#fffdfc]" onClick={() => setNotice('已刷新首页预览')}>
            <Eye className="mr-2 h-4 w-4" /> 预览首页
          </Button>
          <Button className="h-11 min-w-[160px] rounded-lg bg-[#5f7f56] hover:bg-[#526f4b]" disabled={saving} onClick={() => void saveNavConfig()}>
            保存配置
          </Button>
        </div>
      </div>

      {notice ? <div className="rounded-2xl bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">{notice}</div> : null}
      {error ? <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      {/* 展示位置说明 */}
      {nav.displayPosition === 'category_top' ? (
        <div className="rounded-2xl border border-[#d6decd] bg-[#eef3ea] px-5 py-4 text-sm">
          <p className="font-semibold text-[#2f2f2f] mb-2">📍 当前配置展示位置</p>
          <p className="text-[#5f7f56]">
            分类页 / <b>{nav.name}</b> Tab / 分类筛选下方 / 内容模块区
          </p>
          <p className="mt-2 text-xs text-[#8c8c8c]">
            展示条件：C端进入分类页 → 选中「{nav.name}」Tab → 模块已启用且有内容 → 按排序值展示
          </p>
          {nav.contentType ? (
            <p className="mt-1 text-xs text-[#8c8c8c]">
              调试接口：/api/app/page-modules?page=category&type={nav.contentType}&filter=recommend
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* 轮播图设置 */}
          {showCarouselSettings ? (
          <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#2f2f2f]">轮播图设置</h2>
              <div className="flex items-center gap-3">
                <Button className="h-9 rounded-lg bg-[#6f8663]" onClick={addCarousel}>
                  <span
                    className="mr-1 h-4 w-4 bg-current"
                    style={{
                      WebkitMask: `url(${plusIconUrl}) center / contain no-repeat`,
                      mask: `url(${plusIconUrl}) center / contain no-repeat`
                    }}
                    aria-hidden="true"
                  />
                  新增轮播图
                </Button>
              </div>
            </div>
            {carouselLoading ? (
              <div className="py-8 text-center text-sm text-[#8c8c8c]">加载中...</div>
            ) : carouselItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d9d2c6] bg-[#f5f1ea] py-10 text-center text-sm text-[#8c8c8c]">
                <p className="font-medium text-[#6f6f6f]">暂无轮播图</p>
                <p className="mt-2">点击「新增轮播图」为当前导航添加顶部轮播内容</p>
              </div>
            ) : (
              <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
                <thead className="text-[#5f5f5f]">
                  <tr>
                    {['封面图', '标题', '副标题', '按钮文案', '跳转类型', '关联内容', '排序', '状态', '生效时间', '操作'].map((title) => (
                      <th
                        key={title}
                        className={[
                          'border-b border-[#e9e2d6] px-3 py-3 text-left whitespace-nowrap',
                          title === '操作' ? 'sticky right-0 z-20 bg-[#fffdfc] shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.45)]' : ''
                        ].join(' ')}
                      >
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {carouselItems.map((item) => (
                    <tr key={item.id} className="transition hover:bg-[#f5f1ea]/50">
                      <td className="border-b border-[#f0eadf] px-3 py-3">
                        <img src={resolveAssetUrl(item.cover)} alt={item.title} className="h-12 w-9 rounded object-cover" />
                      </td>
                      <td className="border-b border-[#f0eadf] px-3 py-3 font-medium">{item.title}</td>
                      <td className="border-b border-[#f0eadf] px-3 py-3 text-[#8c8c8c]">{item.subtitle ?? '-'}</td>
                      <td className="border-b border-[#f0eadf] px-3 py-3">{item.buttonText ?? '查看菜谱'}</td>
                      <td className="border-b border-[#f0eadf] px-3 py-3">{targetTypeLabelMap[item.targetType] ?? item.targetType}</td>
                      <td className="border-b border-[#f0eadf] px-3 py-3 text-xs text-[#8c8c8c]">
                        {item.targetTitleSnapshot ?? item.targetId ?? item.link ?? '-'}
                      </td>
                      <td className="border-b border-[#f0eadf] px-3 py-3">{item.sortOrder}</td>
                      <td className="border-b border-[#f0eadf] px-3 py-3">
                        <StatusTag
                          label={statusLabelMap[item.status] ?? item.status}
                          tone={statusToneMap[item.status] ?? 'gray'}
                        />
                      </td>
                      <td className="border-b border-[#f0eadf] px-3 py-3 text-xs text-[#8c8c8c]">
                        <div>{formatDateTime(item.startAt)}</div>
                        <div>{formatDateTime(item.endAt)}</div>
                      </td>
                      <td className="sticky right-0 z-10 border-b border-[#f0eadf] bg-[#fffdfc] px-3 py-3 text-xs text-[#6f8663] shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.45)] whitespace-nowrap">
                        <button className="hover:text-[#2f2f2f]" onClick={() => editCarousel(item)}>编辑</button>
                        <button className="ml-2 hover:text-[#2f2f2f]" onClick={() => setNotice(`预览「${item.title}」`)}>预览</button>
                        <button className="ml-2 hover:text-[#2f2f2f]" onClick={() => void toggleCarouselStatus(item)}>
                          {item.status === 'ENABLED' ? '停用' : '启用'}
                        </button>
                        <button className="ml-2 text-red-500 hover:text-red-700" onClick={() => void deleteCarouselItem(item)}>删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          ) : null}

          {/* 内容模块管理 */}
          <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#2f2f2f]">内容模块管理</h2>
              <div className="flex items-center gap-3">
                <Button className="h-9 rounded-lg bg-[#6f8663]" onClick={addModule}>
                  <span
                    className="mr-1 h-4 w-4 bg-current"
                    style={{
                      WebkitMask: `url(${plusIconUrl}) center / contain no-repeat`,
                      mask: `url(${plusIconUrl}) center / contain no-repeat`
                    }}
                    aria-hidden="true"
                  />
                  新增模块
                </Button>
              </div>
            </div>
            {moduleLoading ? (
              <div className="py-8 text-center text-sm text-[#8c8c8c]">加载中...</div>
            ) : moduleItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d9d2c6] bg-[#f5f1ea] py-10 text-center text-sm text-[#8c8c8c]">
                <p className="font-medium text-[#6f6f6f]">暂无内容模块</p>
                <p className="mt-2">点击「新增模块」为当前导航配置首页内容模块</p>
              </div>
            ) : (
              <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
                <thead className="text-[#5f5f5f]">
                  <tr>
                    {['排序', '模块名称', '展示样式', '内容类型', '内容来源', '关联分类', '有效内容', '展示数量', '状态', '更新时间', '操作'].map((title) => (
                      <th
                        key={title}
                        className={[
                          'border-b border-[#e9e2d6] px-3 py-3 text-left whitespace-nowrap',
                          title === '操作' ? 'sticky right-0 z-20 bg-[#fffdfc] shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]' : ''
                        ].join(' ')}
                      >
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {moduleItems.map((item, index) => (
                    <tr key={item.id} className="transition hover:bg-[#f5f1ea]/50">
                      <td className="border-b border-[#f0eadf] px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="min-w-5 font-medium text-[#2f2f2f]">{item.sortOrder}</span>
                          <div className="flex flex-col leading-none text-[#8c8c8c]">
                            <button
                              type="button"
                              className="h-4 text-xs hover:text-[#6f8663] disabled:cursor-not-allowed disabled:text-[#d9d2c6]"
                              disabled={index === 0 || moduleSorting}
                              aria-label={`上移${item.title}`}
                              onClick={() => void moveModule(item, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="h-4 text-xs hover:text-[#6f8663] disabled:cursor-not-allowed disabled:text-[#d9d2c6]"
                              disabled={index === moduleItems.length - 1 || moduleSorting}
                              aria-label={`下移${item.title}`}
                              onClick={() => void moveModule(item, 1)}
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-[#f0eadf] px-3 py-3 font-medium">
                        {item.title}
                        {item.subtitle ? <div className="text-xs text-[#8c8c8c]">{item.subtitle}</div> : null}
                      </td>
                      <td className="border-b border-[#f0eadf] px-3 py-3">{item.displayStyleLabel ?? item.displayStyle}</td>
                      <td className="border-b border-[#f0eadf] px-3 py-3">{item.contentTypeLabel ?? item.contentType}</td>
                      <td className="border-b border-[#f0eadf] px-3 py-3">{item.contentSourceLabel ?? item.contentSource}</td>
                      <td className="border-b border-[#f0eadf] px-3 py-3">
                        {item.categoryId ? (categoryMap.get(item.categoryId) || `分类(ID:${item.categoryId})`) : '推荐'}
                      </td>
                      <td className="border-b border-[#f0eadf] px-3 py-3">
                        {(() => {
                          let validCount = 0;
                          if (item.displayStyle === 'LARGE_IMAGE_CAROUSEL') {
                            const carouselItems = (item.items as unknown as { status: string; cover: string }[]) || [];
                            validCount = carouselItems.filter(i => i.status === 'ENABLED' && i.cover).length;
                          } else {
                            validCount = item.items ? item.items.length : 0;
                          }

                          if (validCount === 0) {
                            return <span className="text-[#c27b48] font-medium">0 个</span>;
                          }
                          return <span>{validCount} 个</span>;
                        })()}
                      </td>
                      <td className="border-b border-[#f0eadf] px-3 py-3">{item.displayCount}</td>
                      <td className="border-b border-[#f0eadf] px-3 py-3">
                        <StatusTag
                          label={item.status === 'ENABLED' ? '已启用' : '已停用'}
                          tone={item.status === 'ENABLED' ? 'green' : 'gray'}
                        />
                      </td>
                      <td className="border-b border-[#f0eadf] px-3 py-3 text-xs text-[#8c8c8c]">
                        {formatDateTime(item.updatedAt)}
                      </td>
                      <td className="sticky right-0 z-10 border-b border-[#f0eadf] bg-[#fffdfc] px-3 py-3 text-xs text-[#6f8663] shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.45)] whitespace-nowrap">
                        <button className="hover:text-[#2f2f2f]" onClick={() => editModule(item)}>编辑</button>
                        <button className="ml-2 hover:text-[#2f2f2f]" onClick={() => setNotice(`预览「${item.title}」`)}>预览</button>
                        <button className="ml-2 hover:text-[#2f2f2f]" onClick={() => void toggleModuleStatus(item)}>
                          {item.status === 'ENABLED' ? '停用' : '启用'}
                        </button>
                        <button className="ml-2 text-red-500 hover:text-red-700" onClick={() => void deleteModuleItem(item)}>删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-xl border border-[#d6decd] bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">
            ⓘ 排序优先级：顶部导航 ＞ 轮播图 ＞ 内容模块。保存配置后将同步至 App，建议发布后在手机端查看效果。
          </div>
        </div>

        {/* 右侧预览 */}
        <div className="rounded-2xl border border-[#e4ddd1] bg-[#fffdfc] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#2f2f2f]">
              {nav.displayPosition === 'category_top' ? `分类页预览（${nav.name} Tab）` : `首页预览（${nav.name} Tab）`}
            </h2>
            <button className="flex items-center gap-1 text-xs text-[#6f8663]" onClick={() => setNotice('预览已刷新')}>
              <RefreshCw className="h-3 w-3" /> 刷新预览
            </button>
          </div>
          <div className="mx-auto h-[488px] w-full overflow-hidden">
          <div className="mx-auto h-[852px] w-[393px] origin-top scale-[0.55] overflow-hidden rounded-[2rem] border-[8px] border-[#1f1f1f] bg-[#fffdfc]">
            <div className="flex items-center justify-between px-5 pt-4 text-[14px] font-semibold">
              <span>9:41</span>
              <span>▮▮▮ ))) ▰</span>
            </div>
            <div className="mx-4 mt-4 flex items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-[#f5f1ea] px-4 py-3 text-[14px] text-[#8c8c8c]">
                <span
                  className="h-4 w-4 shrink-0 bg-current"
                  style={{
                    WebkitMask: `url(${searchIconUrl}) center / contain no-repeat`,
                    mask: `url(${searchIconUrl}) center / contain no-repeat`
                  }}
                  aria-hidden="true"
                />
                <span className="truncate">搜索菜谱、食材、做法</span>
              </div>
              <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7a8b6f] text-[#fffdfc]">
                <span
                  className="h-5 w-5 bg-current"
                  style={{
                    WebkitMask: `url(${plusIconUrl}) center / contain no-repeat`,
                    mask: `url(${plusIconUrl}) center / contain no-repeat`
                  }}
                  aria-hidden="true"
                />
              </button>
            </div>
            <div className="mx-4 mt-4 flex gap-5 overflow-hidden whitespace-nowrap text-[13px]">
              {['推荐', nav.name, '快手菜', '时令食材'].map((tab, i) => (
                <span key={tab} className={i === 1 ? 'font-semibold text-[#6f8663] underline decoration-1 underline-offset-4' : ''}>{tab}</span>
              ))}
            </div>
            {/* 轮播图预览 */}
            {carouselItems.filter((b) => b.status === 'ENABLED').length > 0 ? (
              <div className="mt-4 overflow-hidden" style={{ height: 510 }}>
                <img
                  src={resolveAssetUrl(carouselItems.find((b) => b.status === 'ENABLED')?.cover ?? '')}
                  alt="轮播图"
                  className="h-full w-full object-cover"
                />
                <div className="relative -mt-32 px-6 text-white text-[26px]">
                  <span className="font-bold">{carouselItems.find((b) => b.status === 'ENABLED')?.title}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex h-[510px] items-center justify-center bg-[#f5f1ea] text-[15px] text-[#8c8c8c]">
                暂无启用轮播图
              </div>
            )}
            <div className="mx-4 mt-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold">{nav.name}菜单</span>
                <span className="text-[#7a8b6f]">{draft.contentRule.moreButtonText} ›</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {['红烧肉', '清蒸鲈鱼', '地三鲜'].map((name, i) => (
                  <div key={name} className="overflow-hidden rounded-lg bg-[#f5f1ea]">
                    <div className={['h-16', i === 0 ? 'bg-[#c27b48]' : i === 1 ? 'bg-[#a8b48a]' : 'bg-[#b7aea1]'].join(' ')} />
                    <div className="truncate p-2 text-[12px]">{name}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mx-4 mt-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold">时令食材</span>
                <span className="text-[#7a8b6f]">查看更多 ›</span>
              </div>
              <div className="mt-3 flex justify-between text-center text-[12px]">
                {['番茄', '黄瓜', '茄子', '南瓜', '冬瓜'].map((name) => (
                  <div key={name}>
                    <div className="mx-auto mb-1 h-8 w-8 rounded-full bg-[#a8b48a]" />
                    {name}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-around border-t border-[#e9e2d6] pt-3 pb-4 text-[12px] text-[#5f5f5f]">
              <span className="text-[#6f8663]">首页</span><span>食材</span><span>菜篮子</span><span>我的</span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};
