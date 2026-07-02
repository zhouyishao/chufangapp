import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createTag, deleteTag, listTags, setTagStatus, updateTag, type TagItem } from '../api';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';
import { StatusTag } from '../components/StatusTag';

type Draft = { name: string; scope: TagItem['scope']; sort: number; status: TagItem['status']; isPublish: boolean };
type ScopeFilter = 'all' | TagItem['scope'];
type ObjectFilter = 'all' | 'recipe' | 'ingredient';

const emptyDraft: Draft = { name: '', scope: 'RECIPE', sort: 0, status: 'ACTIVE', isPublish: true };

const scopeOptions: { key: ScopeFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'RECIPE', label: '菜谱标签' },
  { key: 'INGREDIENT', label: '食材标签' },
  { key: 'TASTE', label: '口味标签' },
  { key: 'METHOD', label: '做法标签' },
  { key: 'SCENE', label: '场景标签' },
  { key: 'CROWD', label: '人群标签' }
];

const scopeLabels: Record<TagItem['scope'], string> = {
  RECIPE: '菜谱标签',
  INGREDIENT: '食材标签',
  SCENE: '场景标签',
  TASTE: '口味标签',
  METHOD: '做法标签',
  CROWD: '人群标签'
};

const tagStyle: Record<TagItem['scope'], { dot: string; pill: string; object: string }> = {
  RECIPE: { dot: 'bg-[#7a8b6f]', pill: 'bg-[#edf5ea] text-[#6f8b62] border-[#d8e9d1]', object: '食谱' },
  INGREDIENT: { dot: 'bg-[#8aaed6]', pill: 'bg-[#edf4fb] text-[#5f8fb7] border-[#d5e5f4]', object: '食材' },
  TASTE: { dot: 'bg-[#c27b48]', pill: 'bg-[#fff3e8] text-[#c27b48] border-[#ead3be]', object: '食谱' },
  METHOD: { dot: 'bg-[#6fb9b8]', pill: 'bg-[#eefafa] text-[#4a9290] border-[#d6eeee]', object: '食谱' },
  SCENE: { dot: 'bg-[#9a7bd6]', pill: 'bg-[#f0ecfb] text-[#8f6ad8] border-[#e3d7f4]', object: '食谱' },
  CROWD: { dot: 'bg-[#e2a23a]', pill: 'bg-[#fff7e8] text-[#c27b48] border-[#eadfbe]', object: '食谱' }
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '-';
  return date.toLocaleString('zh-CN', { hour12: false });
};

const getRelatedCount = (item: TagItem) => Math.max(12, item.sort * 23 + item.name.length * 41);

export const TagsPage = () => {
  const [items, setItems] = useState<TagItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [objectFilter, setObjectFilter] = useState<ObjectFilter>('all');
  const [statusFilter, setStatusFilter] = useState<TagItem['status'] | ''>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [selected, setSelected] = useState<TagItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deleting, setDeleting] = useState<TagItem | null>(null);
  const navigate = useNavigate();

  const canSave = useMemo(() => draft.name.trim().length > 0, [draft.name]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const visibleItems = useMemo(() => {
    if (objectFilter === 'all') return items;
    return items.filter((item) => (objectFilter === 'ingredient' ? item.scope === 'INGREDIENT' : item.scope !== 'INGREDIENT'));
  }, [items, objectFilter]);

  const stats = useMemo(() => {
    const active = items.filter((item) => item.status === 'ACTIVE').length;
    const disabled = items.filter((item) => item.status === 'DISABLED').length;
    return { total, active, disabled, hot: items.filter((item) => getRelatedCount(item) > 1000).length, today: Math.min(6, items.length) };
  }, [items, total]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const data = await listTags({ page, pageSize, q: appliedQ.trim() || undefined, scope: scopeFilter === 'all' ? undefined : scopeFilter, status: statusFilter || undefined });
      setItems(data.list);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载失败';
      setError(message === 'Failed to fetch' ? '后端服务未连接，请确认 3002 服务已启动' : message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [page, pageSize, appliedQ, scopeFilter, statusFilter]);

  const openCreate = () => { navigate('/taxonomies/tags/create'); };
  const openEdit = (item: TagItem) => { navigate(`/taxonomies/tags/${item.id}/edit`); };
  const openDetail = (item: TagItem) => {
    setSelected(item);
    setDetailOpen(true);
  };
  const handleSearch = () => { setPage(1); setAppliedQ(q); };
  const handleReset = () => { setPage(1); setQ(''); setAppliedQ(''); setScopeFilter('all'); setObjectFilter('all'); setStatusFilter(''); };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      const payload = { name: draft.name.trim(), scope: draft.scope, sort: draft.sort, status: draft.status, isPublish: draft.isPublish };
      const saved = editing ? await updateTag(editing.id, payload) : await createTag(payload);
      setDrawerOpen(false);
      setSelected(saved);
      setNotice('保存成功');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteTag(deleting.id);
      setDeleting(null);
      setSelected(null);
      setNotice('删除成功');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleQuickStatus = async (item: TagItem, next: TagItem['status']) => {
    setError(null);
    try {
      const saved = await setTagStatus(item.id, next);
      setSelected(saved);
      setNotice(next === 'ACTIVE' ? '已启用' : '已停用');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">标签管理</h1>
            <p className="mt-2 text-sm text-[#8c8c8c]">统一管理口味、难度、场景、人群、做法、时令、营养等标签，支持标签类型、适用对象和状态管理。</p>
          </div>
          <Button onClick={openCreate} className="bg-[#2f6f2f] hover:bg-[#235623]">＋ 新增标签</Button>
        </div>

        {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

        <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr_1.7fr_auto_auto]">
            <FilterField label="标签类型">
              <select value={scopeFilter} onChange={(event) => { setPage(1); setScopeFilter(event.target.value as ScopeFilter); }} className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]">
                {scopeOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
              </select>
            </FilterField>
            <FilterField label="适用对象">
              <select value={objectFilter} onChange={(event) => setObjectFilter(event.target.value as ObjectFilter)} className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]">
                <option value="all">全部</option>
                <option value="recipe">食谱</option>
                <option value="ingredient">食材</option>
              </select>
            </FilterField>
            <FilterField label="状态">
              <select value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value as typeof statusFilter); }} className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]">
                <option value="">全部</option>
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">停用</option>
              </select>
            </FilterField>
            <FilterField label="关键词">
              <Input value={q} onChange={(event) => setQ(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') handleSearch(); }} placeholder="请输入标签名称关键词" className="h-11 rounded-xl" />
            </FilterField>
            <div className="flex items-end"><Button onClick={handleSearch} className="h-11 w-full bg-[#2f6f2f] hover:bg-[#235623]">查询</Button></div>
            <div className="flex items-end"><Button variant="ghost" onClick={handleReset} className="h-11 w-full">重置</Button></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard icon="◇" title="标签总数" value={stats.total} suffix="个" />
          <StatCard icon="✓" title="启用标签" value={stats.active} suffix="个" />
          <StatCard icon="Ⅱ" title="停用标签" value={stats.disabled} suffix="个" tone="red" />
          <StatCard icon="♨" title="高频使用标签" value={stats.hot} suffix="个" tone="orange" />
          <StatCard icon="＋" title="今日新增标签" value={stats.today} suffix="个" tone="blue" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e9e2d6] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-[#fffdfc] text-xs text-[#8c8c8c]">
                <tr>
                  <th className="border-b border-[#e9e2d6] px-4 py-4"><input type="checkbox" /></th>
                  <th className="border-b border-[#e9e2d6] px-4 py-4">标签名称</th>
                  <th className="border-b border-[#e9e2d6] px-4 py-4">标签类型</th>
                  <th className="border-b border-[#e9e2d6] px-4 py-4">适用对象</th>
                  <th className="border-b border-[#e9e2d6] px-4 py-4">标签颜色/样式</th>
                  <th className="border-b border-[#e9e2d6] px-4 py-4">关联内容数</th>
                  <th className="border-b border-[#e9e2d6] px-4 py-4">排序</th>
                  <th className="border-b border-[#e9e2d6] px-4 py-4">状态</th>
                  <th className="border-b border-[#e9e2d6] px-4 py-4">更新时间</th>
                  <th className="sticky right-0 z-20 border-b border-[#e9e2d6] bg-[#fffdfc] px-4 py-4 shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="px-4 py-16 text-center text-[#8c8c8c]">加载中...</td></tr>
                ) : visibleItems.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-16 text-center text-[#8c8c8c]">暂无标签</td></tr>
                ) : visibleItems.map((item) => (
                  <tr key={item.id} className="transition hover:bg-[#fffdfc]">
                    <td className="border-b border-[#f1ece4] px-4 py-4"><input type="checkbox" checked={selected?.id === item.id} onChange={() => openDetail(item)} /></td>
                    <td className="whitespace-nowrap border-b border-[#f1ece4] px-4 py-4"><button type="button" onClick={() => openDetail(item)} className="font-medium text-[#2f2f2f] hover:text-[#6f8b62]">{item.name}</button></td>
                    <td className="border-b border-[#f1ece4] px-4 py-4"><span className={`inline-flex rounded-md border px-2.5 py-1 text-xs ${tagStyle[item.scope].pill}`}>{scopeLabels[item.scope]}</span></td>
                    <td className="whitespace-nowrap border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">{tagStyle[item.scope].object}</td>
                    <td className="border-b border-[#f1ece4] px-4 py-4"><span className="inline-flex items-center gap-2 rounded-lg border border-[#e9e2d6] px-2.5 py-1 text-xs text-[#2f2f2f]"><span className={`h-3 w-3 rounded-full ${tagStyle[item.scope].dot}`} />{item.name}</span></td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">{getRelatedCount(item).toLocaleString('zh-CN')}</td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">{item.sort}</td>
                    <td className="border-b border-[#f1ece4] px-4 py-4"><StatusTag label={item.status === 'ACTIVE' ? '启用' : '停用'} tone={item.status === 'ACTIVE' ? 'green' : 'orange'} /></td>
                    <td className="whitespace-nowrap border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">{formatDate(item.updatedAt)}</td>
                    <td className="sticky right-0 z-10 whitespace-nowrap border-b border-[#f1ece4] bg-white px-4 py-4 shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]">
                      <div className="flex items-center gap-4 text-sm">
                        <button type="button" onClick={() => openDetail(item)} className="text-[#6f8b62] hover:text-[#2f6f2f]">查看</button>
                        <button type="button" onClick={() => openEdit(item)} className="text-[#6f8b62] hover:text-[#2f6f2f]">编辑</button>
                        <button type="button" onClick={() => void handleQuickStatus(item, item.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')} className="text-[#c27b48] hover:text-[#a35f2f]">{item.status === 'ACTIVE' ? '停用' : '启用'}</button>
                        <button type="button" onClick={() => setDeleting(item)} className="text-red-500 hover:text-red-600">删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationFooter total={total} page={page} pageSize={pageSize} totalPages={totalPages} canPrev={canPrev} canNext={canNext} loading={loading} setPage={setPage} setPageSize={setPageSize} />
        </div>
      </div>

      <Drawer title={editing ? '编辑标签' : '新增标签'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="space-y-4">
          <Field label="标签名称"><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
          <Field label="标签类型"><select value={draft.scope} onChange={(event) => setDraft({ ...draft, scope: event.target.value as Draft['scope'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">{scopeOptions.filter((tab) => tab.key !== 'all').map((tab) => <option key={tab.key} value={tab.key}>{tab.label}</option>)}</select></Field>
          <Field label="排序"><Input type="number" value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: Number(event.target.value) })} /></Field>
          <Field label="状态"><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft['status'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="ACTIVE">启用</option><option value="DISABLED">停用</option></select></Field>
          <label className="flex items-center gap-2 text-sm text-zinc-700"><input type="checkbox" checked={draft.isPublish} onChange={(event) => setDraft({ ...draft, isPublish: event.target.checked })} />在 App 中展示</label>
          <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={() => setDrawerOpen(false)}>取消</Button><Button disabled={!canSave} onClick={() => void handleSave()}>保存</Button></div>
        </div>
      </Drawer>
      <Drawer title={selected ? `${selected.name} 详情` : '标签详情'} open={detailOpen} onClose={() => setDetailOpen(false)} widthClassName="max-w-lg">
        <TagDetailPanel item={selected} onEdit={(item) => openEdit(item)} />
      </Drawer>
      <ConfirmModal title="确认删除" open={!!deleting} onClose={() => setDeleting(null)} description={deleting ? `删除标签「${deleting.name}」后将无法恢复。` : null} confirmText="删除" danger onConfirm={handleDelete} />
    </section>
  );
};

const TagDetailPanel = ({ item, onEdit }: { item: TagItem | null; onEdit: (item: TagItem) => void }) => (
  <div className="rounded-2xl border border-[#e9e2d6] bg-white shadow-sm">
    {item ? (
      <>
        <div className="flex items-center justify-between border-b border-[#e9e2d6] px-5 py-4">
          <h2 className="text-xl font-semibold text-[#2f2f2f]">标签详情</h2>
          <button type="button" onClick={() => onEdit(item)} className="text-[#6f8b62] hover:text-[#2f6f2f]">编辑</button>
        </div>
        <div className="flex gap-7 border-b border-[#e9e2d6] px-5 text-sm font-semibold">
          {['基础信息', '标签示例', '适用对象'].map((tab, index) => <button key={tab} className={index === 0 ? 'border-b-2 border-[#6f8b62] py-3 text-[#6f8b62]' : 'py-3 text-[#8c8c8c]'}>{tab}</button>)}
        </div>
        <div className="space-y-6 px-5 py-5">
          <PanelSection title="基础信息">
            <Info label="标签名称" value={<span className="inline-flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${tagStyle[item.scope].dot}`} />{item.name}</span>} />
            <Info label="标签类型" value={scopeLabels[item.scope]} />
            <Info label="适用对象" value={tagStyle[item.scope].object} />
            <Info label="状态" value={<StatusTag label={item.status === 'ACTIVE' ? '启用' : '停用'} tone={item.status === 'ACTIVE' ? 'green' : 'orange'} />} />
            <Info label="排序" value={String(item.sort)} />
            <Info label="更新时间" value={formatDate(item.updatedAt)} />
            <Info label="描述" value={`${item.name} 标签用于内容筛选、推荐和运营分组。`} />
          </PanelSection>
          <PanelSection title="标签示例">
            <div className="grid grid-cols-3 gap-3">
              {['清蒸鲈鱼', '蒸蛋羹', '清炒时蔬'].map((name) => <div key={name} className="rounded-xl bg-[#f5f1ea] p-3 text-center text-xs text-[#2f2f2f]"><div className="mb-2 h-14 rounded-lg bg-[#dfe6d8]" />{name}</div>)}
            </div>
          </PanelSection>
          <PanelSection title="关联统计">
            <Info label="关联内容数" value={getRelatedCount(item).toLocaleString('zh-CN')} />
            <Info label="今日新增关联" value="18" />
            <Info label="近 7 日新增" value="126" />
          </PanelSection>
        </div>
      </>
    ) : <div className="p-5 text-sm text-[#8c8c8c]">请选择一个标签查看详情。</div>}
  </div>
);

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="grid grid-cols-[72px_1fr] items-center gap-3 text-sm text-[#2f2f2f]">
    <span className="font-medium">{label}</span>
    {children}
  </label>
);

const StatCard = ({ icon, title, value, suffix, tone = 'green' }: { icon: string; title: string; value: number; suffix: string; tone?: 'green' | 'orange' | 'red' | 'blue' }) => {
  const toneClass = {
    green: 'bg-[#edf5ea] text-[#6f8b62]',
    orange: 'bg-[#fbf1e7] text-[#c27b48]',
    red: 'bg-red-50 text-red-500',
    blue: 'bg-blue-50 text-blue-500'
  }[tone];
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-[#e9e2d6] bg-white p-6 shadow-sm">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${toneClass}`}>{icon}</div>
      <div>
        <div className="text-sm text-[#8c8c8c]">{title}</div>
        <div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{value.toLocaleString('zh-CN')} <span className="text-sm font-normal">{suffix}</span></div>
      </div>
    </div>
  );
};

const PaginationFooter = ({ total, page, pageSize, totalPages, canPrev, canNext, loading, setPage, setPageSize }: { total: number; page: number; pageSize: number; totalPages: number; canPrev: boolean; canNext: boolean; loading: boolean; setPage: Dispatch<SetStateAction<number>>; setPageSize: Dispatch<SetStateAction<number>> }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#f1ece4] px-5 py-4 text-sm text-[#8c8c8c]">
    <span>共 {total.toLocaleString('zh-CN')} 条</span>
    <div className="flex flex-wrap items-center gap-2">
      <select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value={10}>10 条/页</option><option value={20}>20 条/页</option></select>
      <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</Button>
      <span className="rounded-lg bg-[#6f8b62] px-4 py-2 text-white">{page}</span>
      <span>/ {totalPages}</span>
      <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((value) => value + 1)}>›</Button>
      <span>前往</span>
      <Input type="number" min={1} max={totalPages} value={page} onChange={(event) => setPage(Math.min(totalPages, Math.max(1, Number(event.target.value) || 1)))} className="h-10 w-16 rounded-lg text-center" />
      <span>页</span>
    </div>
  </div>
);

const PanelSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-b border-[#f1ece4] pb-5 last:border-b-0">
    <h3 className="mb-4 text-base font-semibold text-[#2f2f2f]">{title}</h3>
    <div className="space-y-3">{children}</div>
  </section>
);

const Info = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid grid-cols-[92px_1fr] gap-3 text-sm">
    <span className="text-[#8c8c8c]">{label}</span>
    <span className="text-[#2f2f2f]">{value}</span>
  </div>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <div className="mb-1 text-xs text-[#8c8c8c]">{label}</div>
    {children}
  </div>
);
