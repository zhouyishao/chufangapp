import { CheckCircle2, CircleOff, Grid2X2, Home, Layers, PauseCircle, Plus, Save, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  deleteHomeTopNav,
  getHomeTopNavSummary,
  listHomeTopNavs,
  reorderHomeTopNavs,
  setHomeTopNavDefault,
  updateHomeTopNavStatus,
  type HomeTopNav,
  type HomeTopNavDisplayPosition,
  type HomeTopNavStatus,
  type HomeTopNavSummary,
  type HomeTopNavType
} from '../api';
import { Button } from '../components/Button';
import { StatusTag } from '../components/StatusTag';

const emptySummary: HomeTopNavSummary = {
  totalCount: 0,
  onlineCount: 0,
  defaultCount: 0,
  availableRelationCount: 0
};

const statusOptions: { value: 'all' | HomeTopNavStatus; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'online', label: '已启用' },
  { value: 'draft', label: '草稿' },
  { value: 'offline', label: '已停用' }
];

const typeOptions: { value: 'all' | HomeTopNavType; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'system_recommend', label: '系统推荐' },
  { value: 'recipe_category', label: '菜谱分类' },
  { value: 'recipe_tag', label: '菜谱标签' },
  { value: 'topic', label: '专题' },
  { value: 'recommend_pool', label: '推荐池' }
];

const actionTextClass = 'text-xs font-medium text-[#6f8663] transition-colors hover:text-[#2f2f2f]';

const statusLabelMap: Record<HomeTopNavStatus, string> = {
  online: '已启用',
  draft: '草稿',
  offline: '已停用'
};

const safeDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const TopNavPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<HomeTopNavSummary>(emptySummary);
  const [items, setItems] = useState<HomeTopNav[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | HomeTopNavStatus>('all');
  const [navType, setNavType] = useState<'all' | HomeTopNavType>('all');
  const [displayPosition, setDisplayPosition] = useState<HomeTopNavDisplayPosition>('category_top');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 新增导航弹窗
  const [showCreateModal, setShowCreateModal] = useState(false);

  const draftCount = useMemo(() => items.filter((item) => item.status === 'draft').length, [items]);
  const offlineCount = useMemo(() => items.filter((item) => item.status === 'offline').length, [items]);

  const filteredItems = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return items.filter((item) => {
      const keywordMatched = !q || [item.name, item.alias, item.code, item.relationName, item.navTypeText]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      const statusMatched = status === 'all' || item.status === status;
      const typeMatched = navType === 'all' || item.navType === navType;
      const posMatched = item.displayPosition === displayPosition;
      return keywordMatched && statusMatched && typeMatched && posMatched;
    });
  }, [items, keyword, navType, status, displayPosition]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResult, listResult] = await Promise.all([
        getHomeTopNavSummary(),
        listHomeTopNavs({ page: 1, pageSize: 100, displayPosition })
      ]);
      setSummary(summaryResult);
      setItems(listResult.list);
    } catch (err) {
      setSummary(emptySummary);
      setItems([]);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [displayPosition]);

  useEffect(() => {
    setPage(1);
  }, [keyword, navType, status, displayPosition]);

  const move = async (item: HomeTopNav, direction: -1 | 1) => {
    const index = items.findIndex((row) => row.id === item.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const sorted = next.map((row, idx) => ({ ...row, sortOrder: idx + 1 }));
    setItems(sorted);
    await reorderHomeTopNavs(sorted.map((row) => ({ id: row.id, sortOrder: row.sortOrder })));
    setNotice('排序已保存');
  };

  const saveSort = async () => {
    await reorderHomeTopNavs(items.map((item, index) => ({ id: item.id, sortOrder: index + 1 })));
    setNotice('排序已保存，并同步至 App');
    await refresh();
  };

  const toggleStatus = async (item: HomeTopNav) => {
    const nextStatus = item.status === 'online' ? 'offline' : 'online';
    if (nextStatus === 'offline') {
      if (item.isDefault) {
        setNotice('「' + item.name + '」是默认导航，请先将其他导航设为默认后再停用');
        return;
      }
      if (!window.confirm('停用后 App 将不再展示该导航，是否继续？')) return;
    }
    try {
      await updateHomeTopNavStatus(item.id, nextStatus);
      setNotice(nextStatus === 'online' ? '导航已启用' : '导航已停用');
      await refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : '操作失败');
    }
  };

  const setDefault = async (item: HomeTopNav) => {
    await setHomeTopNavDefault(item.id, true);
    setNotice(`「${item.name}」已设为默认导航`);
    await refresh();
  };

  const remove = async (item: HomeTopNav) => {
    if (item.status === 'online') return;
    if (!window.confirm(`确认删除「${item.name}」？`)) return;
    await deleteHomeTopNav(item.id);
    setNotice('导航已删除');
    await refresh();
  };

  const resetFilters = () => {
    setKeyword('');
    setStatus('all');
    setNavType('all');
  };

  const handleCreate = (position: HomeTopNavDisplayPosition) => {
    setShowCreateModal(false);
    navigate(`/home-ops/top-nav/new?displayPosition=${position}`);
  };

  const metrics = [
    { label: '导航总数', value: summary.totalCount || items.length, icon: Grid2X2, tone: 'bg-[#eef3ea] text-[#7a8b6f]' },
    { label: '已启用', value: summary.onlineCount || items.filter((item) => item.status === 'online').length, icon: CheckCircle2, tone: 'bg-[#eef3ea] text-[#5f8f55]' },
    { label: '草稿', value: draftCount, icon: PauseCircle, tone: 'bg-[#fff2dc] text-[#c27b48]' },
    { label: '已停用', value: offlineCount, icon: CircleOff, tone: 'bg-[#f0efec] text-[#8c8c8c]' }
  ];

  return (
    <section className="space-y-5">
      {/* ==== 新增导航弹窗 ==== */}
      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="mx-4 w-full max-w-[440px] rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-6 shadow-[0_24px_64px_rgba(47,47,47,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#2f2f2f]">新增导航</h2>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#8c8c8c] hover:bg-[#f5f1ea] hover:text-[#2f2f2f]" onClick={() => setShowCreateModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-5 text-sm text-[#8c8c8c]">请选择该导航展示在哪个 C 端页面</p>
            <div className="grid gap-3">
              <button
                className="flex items-start gap-4 rounded-xl border border-[#e4ddd1] bg-[#fffdfc] p-4 text-left transition hover:border-[#7a8b6f] hover:bg-[#eef3ea]"
                onClick={() => handleCreate('home_top')}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3ea]">
                  <Home className="h-5 w-5 text-[#7a8b6f]" />
                </div>
                <div>
                  <p className="font-semibold text-[#2f2f2f]">首页导航</p>
                  <p className="mt-1 text-xs text-[#8c8c8c]">用于首页顶部 Tab，例如推荐、家常菜、快手菜</p>
                </div>
              </button>
              <button
                className="flex items-start gap-4 rounded-xl border border-[#e4ddd1] bg-[#fffdfc] p-4 text-left transition hover:border-[#7a8b6f] hover:bg-[#eef3ea]"
                onClick={() => handleCreate('category_top')}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3ea]">
                  <Layers className="h-5 w-5 text-[#7a8b6f]" />
                </div>
                <div>
                  <p className="font-semibold text-[#2f2f2f]">分类页导航</p>
                  <p className="mt-1 text-xs text-[#8c8c8c]">用于分类页顶部 Tab，例如菜谱、食材、水果、调料、酒水</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(520px,0.84fr)] xl:items-center">
        <div className="rounded-[4px] bg-transparent py-1">
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-[#2f2f2f]">顶部导航管理</h1>
          <p className="mt-2 text-sm leading-6 text-[#8c8c8c]">
            用于管理 App 顶部 Tab 导航，支持新增、排序、启用、停用、配置内容等操作。
          </p>
        </div>
        <div className="flex flex-wrap justify-start gap-6 rounded-[4px] bg-transparent xl:justify-end">
          <Button className="h-12 min-w-[172px] rounded-lg bg-[#6f8663] text-base shadow-[0_12px_30px_rgba(111,134,99,0.22)] hover:bg-[#627858]" onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-5 w-5" /> 新增导航
          </Button>
          <Button className="h-12 min-w-[172px] rounded-lg bg-[#6f8663] text-base shadow-[0_12px_30px_rgba(111,134,99,0.22)] hover:bg-[#627858]" onClick={() => void saveSort()}>
            <Save className="mr-2 h-5 w-5" /> 保存配置
          </Button>
        </div>
      </div>

      {notice ? <div className="rounded-2xl bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">{notice}</div> : null}
      {error ? <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="flex min-h-[110px] items-center gap-6 rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] px-7 py-5 shadow-[0_18px_48px_rgba(47,47,47,0.045)]">
              <div className={['flex h-14 w-14 items-center justify-center rounded-full', metric.tone].join(' ')}>
                <Icon className="h-8 w-8" />
              </div>
              <div>
                <div className="text-sm text-[#8c8c8c]">{metric.label}</div>
                <div className="mt-2 text-3xl font-semibold text-[#2f2f2f]">{metric.value} 个</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] shadow-[0_18px_48px_rgba(47,47,47,0.045)]">
        <div className="flex flex-col gap-4 border-b border-[#e9e2d6] px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            {/* 使用页面分段按钮 */}
            <div className="flex h-12 overflow-hidden rounded-xl border border-[#e1d8ca] bg-[#f5f1ea]">
              <button
                className={`flex items-center gap-1.5 px-4 text-sm font-medium transition ${displayPosition === 'home_top' ? 'bg-[#7a8b6f] text-white' : 'text-[#6f6f6f] hover:text-[#2f2f2f]'}`}
                onClick={() => setDisplayPosition('home_top')}
              >
                <Home className="h-4 w-4" />首页导航
              </button>
              <button
                className={`flex items-center gap-1.5 px-4 text-sm font-medium transition ${displayPosition === 'category_top' ? 'bg-[#7a8b6f] text-white' : 'text-[#6f6f6f] hover:text-[#2f2f2f]'}`}
                onClick={() => setDisplayPosition('category_top')}
              >
                <Layers className="h-4 w-4" />分类页导航
              </button>
            </div>
            <label className="relative block w-full max-w-[280px]">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b7aea1]" />
              <input
                className="h-12 w-full rounded-xl border border-[#e1d8ca] bg-[#fffdfc] pl-12 pr-4 text-sm outline-none transition focus:border-[#7a8b6f]"
                placeholder="搜索导航名称"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>
            <select className="h-12 min-w-[140px] rounded-xl border border-[#e1d8ca] bg-[#fffdfc] px-4 text-sm outline-none focus:border-[#7a8b6f]" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select className="h-12 min-w-[140px] rounded-xl border border-[#e1d8ca] bg-[#fffdfc] px-4 text-sm outline-none focus:border-[#7a8b6f]" value={navType} onChange={(event) => setNavType(event.target.value as typeof navType)}>
              {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <Button variant="ghost" className="h-12 min-w-[82px] rounded-xl border-[#e9e2d6] bg-[#f5f1ea]" onClick={resetFilters}>
            重置
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-[#fffdfc] text-[#5f5f5f]">
              <tr>
                {['排序', '导航名称', '导航类型', '使用页面', '关联内容', '状态', '默认选中', '更新时间', '操作'].map((title) => (
                  <th
                    key={title}
                    className={[
                      'border-b border-[#e9e2d6] px-6 py-4 font-semibold',
                      title === '操作' ? 'sticky right-0 z-20 bg-[#fffdfc] shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.45)]' : ''
                    ].join(' ')}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-6 py-14 text-center text-[#8c8c8c]" colSpan={9}>加载中...</td></tr>
              ) : pagedItems.length ? (
                pagedItems.map((item) => (
                  <tr key={item.id} className="transition hover:bg-[#f5f1ea]/55">
                    <td className="border-b border-[#f0eadf] px-6 py-5">
                      <div className="flex items-center gap-5">
                        <div className="flex flex-col gap-[2px] text-[#2f2f2f]" aria-hidden="true">
                          <span className="leading-none">••</span>
                          <span className="leading-none">••</span>
                          <span className="leading-none">••</span>
                        </div>
                        <div className="font-medium text-[#2f2f2f]">{item.sortOrder}</div>
                        <div className="flex flex-col text-[#8c8c8c]">
                          <button className="cursor-pointer hover:text-[#7a8b6f]" onClick={() => void move(item, -1)}>⌃</button>
                          <button className="cursor-pointer hover:text-[#7a8b6f]" onClick={() => void move(item, 1)}>⌄</button>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[#f0eadf] px-6 py-5">
                      <Link className="cursor-pointer font-semibold text-[#2f2f2f] transition hover:text-[#7a8b6f]" to={`/home-ops/top-nav/${item.id}`}>
                        {item.name}
                      </Link>
                    </td>
                    <td className="border-b border-[#f0eadf] px-6 py-5 text-[#5f5f5f]">{item.navTypeText ?? item.navType}</td>
                    <td className="border-b border-[#f0eadf] px-6 py-5 text-[#5f5f5f]">{item.displayPositionLabel ?? item.displayPosition}</td>
                    <td className="border-b border-[#f0eadf] px-6 py-5 text-[#5f5f5f]">{item.relationName ?? '-'}</td>
                    <td className="border-b border-[#f0eadf] px-6 py-5">
                      <StatusTag label={statusLabelMap[item.status] ?? item.statusText ?? item.status} tone={item.status === 'online' ? 'green' : item.status === 'draft' ? 'orange' : 'gray'} />
                    </td>
                    <td className="border-b border-[#f0eadf] px-6 py-5">
                      {item.isDefault ? (
                        <span className="rounded-lg bg-[#f5f1ea] px-3 py-1 text-xs text-[#6f8663]">是</span>
                      ) : (
                        <button className={actionTextClass} onClick={() => void setDefault(item)}>设为默认</button>
                      )}
                    </td>
                    <td className="border-b border-[#f0eadf] px-6 py-5 text-[#5f5f5f]">{safeDate(item.updatedAt)}</td>
                    <td className="sticky right-0 z-10 border-b border-[#f0eadf] bg-[#fffdfc] px-6 py-5 shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.45)]">
                      <div className="flex flex-wrap justify-end gap-3 whitespace-nowrap">
                        <button className={actionTextClass} onClick={() => navigate(`/home-ops/top-nav/${item.id}/edit`)}>编辑</button>
                        <span className="text-[#e1d8ca]">|</span>
                        <button className={actionTextClass} onClick={() => navigate(`/home-ops/top-nav/${item.id}/content`)}>配置内容</button>
                        <span className="text-[#e1d8ca]">|</span>
                        <button className={actionTextClass} onClick={() => void toggleStatus(item)}>{item.status === 'online' ? '停用' : '启用'}</button>
                        {item.status !== 'online' ? (
                          <>
                            <span className="text-[#e1d8ca]">|</span>
                            <button className="cursor-pointer text-xs font-medium text-[#8c8c8c] transition hover:text-red-600" onClick={() => void remove(item)}>删除</button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-[#8c8c8c]">
                    {displayPosition === 'category_top' ? '暂无分类页导航，点击「新增导航」创建。' : '暂无首页导航，点击「新增导航」创建。'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5 text-sm text-[#5f5f5f] md:flex-row md:items-center md:justify-end">
          <span>共 {filteredItems.length} 条</span>
          <select className="h-10 rounded-xl border border-[#e1d8ca] bg-[#fffdfc] px-3 outline-none" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
            {[10, 20, 50].map((size) => <option key={size} value={size}>{size} 条/页</option>)}
          </select>
          <button className="h-10 rounded-xl border border-[#e1d8ca] px-4 disabled:opacity-40" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>
          {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1).map((item) => (
            <button key={item} className={['h-10 w-10 rounded-xl border', item === currentPage ? 'border-[#7a8b6f] bg-[#7a8b6f] text-white' : 'border-[#e1d8ca] bg-[#fffdfc]'].join(' ')} onClick={() => setPage(item)}>
              {item}
            </button>
          ))}
          <button className="h-10 rounded-xl border border-[#e1d8ca] px-4 disabled:opacity-40" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>›</button>
          <span>前往</span>
          <input className="h-10 w-16 rounded-xl border border-[#e1d8ca] bg-[#fffdfc] px-3 text-center outline-none" value={currentPage} onChange={(event) => setPage(Number(event.target.value) || 1)} />
          <span>页</span>
        </div>
      </div>
    </section>
  );
};
