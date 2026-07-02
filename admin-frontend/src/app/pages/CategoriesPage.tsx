import { type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createCategory, deleteCategory, listCategories, setCategoryStatus, updateCategory } from '../api';
import type { IngredientCategory } from '../types';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';
import { StatusTag } from '../components/StatusTag';

type Draft = { name: string; type: IngredientCategory['type']; sort: number; status: IngredientCategory['status']; isPublish: boolean };

type CategoryTypeFilter = 'all' | IngredientCategory['type'];

const emptyDraft: Draft = { name: '', type: 'RECIPE', sort: 0, status: 'ACTIVE', isPublish: true };

const typeOptions: { key: CategoryTypeFilter; label: string; tone?: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'RECIPE', label: '菜谱' },
  { key: 'INGREDIENT', label: '食材' },
  { key: 'SEASONING', label: '调料' },
  { key: 'FRUIT', label: '水果' },
  { key: 'BEVERAGE', label: '酒水' }
];

const typeLabels: Record<string, string> = {
  RECIPE: '菜谱',
  INGREDIENT: '食材',
  SEASONING: '调料',
  FRUIT: '水果',
  COCKTAIL: '酒水',
  BEVERAGE: '酒水'
};

const typePillClass: Record<string, string> = {
  RECIPE: 'bg-[#edf5ea] text-[#6f8b62] border-[#d8e9d1]',
  INGREDIENT: 'bg-[#f0ecfb] text-[#8f6ad8] border-[#e3d7f4]',
  SEASONING: 'bg-[#eef7fb] text-[#5f9bb3] border-[#d5edf4]',
  FRUIT: 'bg-[#fff3e8] text-[#c27b48] border-[#ead3be]',
  COCKTAIL: 'bg-[#fff0f3] text-[#d45b73] border-[#f0cbd3]',
  BEVERAGE: 'bg-[#fff0f3] text-[#d45b73] border-[#f0cbd3]'
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '-';
  return date.toLocaleString('zh-CN', { hour12: false });
};

export const CategoriesPage = () => {
  const [items, setItems] = useState<IngredientCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<CategoryTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<IngredientCategory['status'] | ''>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<IngredientCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deleting, setDeleting] = useState<IngredientCategory | null>(null);
  const [sortingId, setSortingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const canSave = useMemo(() => draft.name.trim().length > 0, [draft.name]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const stats = useMemo(() => {
    const active = items.filter((item) => item.status === 'ACTIVE').length;
    const disabled = items.filter((item) => item.status === 'DISABLED').length;
    return {
      total,
      firstLevel: total,
      active,
      disabled
    };
  }, [items, total]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const data = await listCategories({
        page,
        pageSize,
        q: appliedQ.trim() || undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter || undefined
      });
      setItems(data.list);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [page, pageSize, appliedQ, typeFilter, statusFilter]);

  const openCreate = () => { navigate('/taxonomies/categories/create'); };
  const openEdit = (item: IngredientCategory) => {
    navigate(`/taxonomies/categories/${item.id}/edit`);
  };

  const handleSearch = () => { setPage(1); setAppliedQ(q); };
  const handleReset = () => {
    setPage(1);
    setQ('');
    setAppliedQ('');
    setTypeFilter('all');
    setStatusFilter('');
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      const payload = { name: draft.name.trim(), type: draft.type, sort: draft.sort, status: draft.status, isPublish: draft.isPublish };
      if (editing) await updateCategory(editing.id, payload);
      else await createCategory(payload);
      setDrawerOpen(false);
      setNotice('保存成功');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteCategory(deleting.id);
      setDeleting(null);
      setNotice('删除成功');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleQuickStatus = async (item: IngredientCategory, next: IngredientCategory['status']) => {
    setError(null);
    try {
      await setCategoryStatus(item.id, next);
      setNotice(next === 'ACTIVE' ? '已启用' : '已禁用');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const moveCategory = async (item: IngredientCategory, direction: -1 | 1) => {
    if (sortingId) return;
    const currentIndex = items.findIndex((category) => category.id === item.id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) return;

    const current = items[currentIndex];
    const target = items[targetIndex];
    const nextItems = [...items];
    nextItems[currentIndex] = { ...target, sort: current.sort };
    nextItems[targetIndex] = { ...current, sort: target.sort };
    setItems(nextItems);
    setSortingId(item.id);
    setError(null);
    try {
      await Promise.all([
        updateCategory(current.id, {
          name: current.name,
          type: current.type,
          sort: target.sort,
          status: current.status,
          isPublish: current.isPublish
        }),
        updateCategory(target.id, {
          name: target.name,
          type: target.type,
          sort: current.sort,
          status: target.status,
          isPublish: target.isPublish
        })
      ]);
      setNotice('分类排序已保存');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '排序保存失败');
      await refresh();
    } finally {
      setSortingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">分类管理</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">统一管理菜谱、食材、水果、调料、酒水等内容分类，支持类型隔离、排序和启用状态控制。</p>
        </div>
        <Button onClick={openCreate} className="bg-[#2f6f2f] hover:bg-[#235623]">＋ 新增分类</Button>
      </div>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <FilterField label="分类类型">
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((option) => {
                const isActive = typeFilter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setTypeFilter(option.key);
                    }}
                    className={`h-9 px-4 rounded-xl border text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#2f6f2f] text-white border-[#2f6f2f]'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </FilterField>
          
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_2fr_auto_auto] pt-2 border-t border-[#f5f1ea]">
            <FilterField label="层级">
              <select disabled className="h-11 w-full rounded-xl border border-zinc-200 bg-[#f7f3ec] px-3 text-sm text-[#8c8c8c] outline-none">
                <option>一级分类</option>
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
              <Input value={q} onChange={(event) => setQ(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') handleSearch(); }} placeholder="请输入分类名称" className="h-11 rounded-xl" />
            </FilterField>
            <div className="flex items-end"><Button onClick={handleSearch} className="h-11 w-full bg-[#2f6f2f] hover:bg-[#235623]">查询</Button></div>
            <div className="flex items-end"><Button variant="ghost" onClick={handleReset} className="h-11 w-full">重置</Button></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="▱" title="筛选结果" value={stats.total} suffix="个" />
        <StatCard icon="▰" title="分类总数" value={stats.firstLevel} suffix="个" />
        <StatCard icon="✓" title="本页启用" value={stats.active} suffix="个" tone="green" />
        <StatCard icon="Ⅱ" title="本页停用" value={stats.disabled} suffix="个" tone="orange" />
      </div>

      <div className="rounded-2xl border border-[#d6decd] bg-[#eef3ea] px-5 py-4 text-sm text-[#5f7f56]">
        当前分类接口为一级扁平分类。内容模块、菜谱、食材等下游页面会按这里的“分类类型”读取对应分类；多级分类需要后端补充父级字段后再开放。
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e9e2d6] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-[#fffdfc] text-xs text-[#8c8c8c]">
              <tr>
                <th className="border-b border-[#e9e2d6] px-4 py-4"><input type="checkbox" /></th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">分类名称</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">分类类型</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">层级</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">排序</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">关联内容</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">状态</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">更新时间</th>
                <th className="sticky right-0 z-20 border-b border-[#e9e2d6] bg-[#fffdfc] px-4 py-4 shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-[#8c8c8c]">加载中...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-[#8c8c8c]">暂无分类</td></tr>
              ) : items.map((item, index) => (
                    <tr key={item.id} className="transition hover:bg-[#fffdfc]">
                      <td className="border-b border-[#f1ece4] px-4 py-4"><input type="checkbox" /></td>
                      <td className="whitespace-nowrap border-b border-[#f1ece4] px-4 py-4 font-medium">
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(item)}
                          className="text-[#2f6f2f] hover:underline cursor-pointer font-medium"
                        >
                          {item.name}
                        </button>
                      </td>
                      <td className="border-b border-[#f1ece4] px-4 py-4"><span className={`inline-flex rounded-md border px-2.5 py-1 text-xs ${typePillClass[item.type] ?? 'bg-[#f5f1ea] text-[#8c8c8c] border-[#e9e2d6]'}`}>{typeLabels[item.type] ?? item.type}</span></td>
                      <td className="border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">1</td>
                      <td className="border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">
                        <div className="flex items-center gap-3">
                          <span className="min-w-8">{item.sort}</span>
                          <div className="flex flex-col leading-none text-[#8c8c8c]">
                            <button
                              type="button"
                              className="h-4 text-xs hover:text-[#6f8663] disabled:cursor-not-allowed disabled:text-[#d9d2c6]"
                              disabled={index === 0 || !!sortingId}
                              aria-label={`上移${item.name}`}
                              onClick={() => void moveCategory(item, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="h-4 text-xs hover:text-[#6f8663] disabled:cursor-not-allowed disabled:text-[#d9d2c6]"
                              disabled={index === items.length - 1 || !!sortingId}
                              aria-label={`下移${item.name}`}
                              onClick={() => void moveCategory(item, 1)}
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">
                        {item.relatedCount && item.relatedCount > 0 ? (
                          <span className="text-[#c27b48]">{item.relatedCount} 条</span>
                        ) : (
                          <span className="text-[#8c8c8c]">0 条</span>
                        )}
                      </td>
                      <td className="border-b border-[#f1ece4] px-4 py-4"><StatusTag label={item.status === 'ACTIVE' ? '启用' : '停用'} tone={item.status === 'ACTIVE' ? 'green' : 'orange'} /></td>
                      <td className="whitespace-nowrap border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">{formatDate(item.updatedAt)}</td>
                      <td className="sticky right-0 z-10 whitespace-nowrap border-b border-[#f1ece4] bg-white px-4 py-4 shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]">
                        <div className="flex items-center gap-4 text-sm">
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

      <Drawer title={editing ? '编辑分类' : '新增分类'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="space-y-4">
          <Field label="分类名称"><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
          <Field label="分类类型"><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as Draft['type'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">{typeOptions.filter((option) => option.key !== 'all').map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></Field>
          <Field label="排序"><Input type="number" value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: Number(event.target.value) })} /></Field>
          <Field label="状态"><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft['status'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="ACTIVE">启用</option><option value="DISABLED">停用</option></select></Field>
          <label className="flex items-center gap-2 text-sm text-zinc-700"><input type="checkbox" checked={draft.isPublish} onChange={(event) => setDraft({ ...draft, isPublish: event.target.checked })} />在 App 中展示</label>
          <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={() => setDrawerOpen(false)}>取消</Button><Button disabled={!canSave} onClick={() => void handleSave()}>保存</Button></div>
        </div>
      </Drawer>
      <ConfirmModal
        title="确认删除"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        description={
          deleting ? (
            deleting.relatedCount && deleting.relatedCount > 0 ? (
              <span className="text-red-500 font-medium">
                该分类下有 {deleting.relatedCount} 条关联内容，不能删除。请先在相关内容中解除与该分类的绑定。
              </span>
            ) : (
              `删除分类「${deleting.name}」后将无法恢复。`
            )
          ) : null
        }
        confirmText={deleting && deleting.relatedCount && deleting.relatedCount > 0 ? "我知道了" : "删除"}
        danger={!(deleting && deleting.relatedCount && deleting.relatedCount > 0)}
        onConfirm={
          deleting && deleting.relatedCount && deleting.relatedCount > 0
            ? () => setDeleting(null)
            : handleDelete
        }
      />
      <Drawer
        title="分类详情"
        open={Boolean(selectedCategory)}
        onClose={() => setSelectedCategory(null)}
        widthClassName="max-w-lg"
      >
        {selectedCategory && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-[#8c8c8c]">分类名称</div>
                  <div className="mt-1 text-sm font-semibold text-[#2f2f2f]">{selectedCategory.name}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">分类类型</div>
                  <div className="mt-1">
                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs ${typePillClass[selectedCategory.type] ?? 'bg-[#f5f1ea] text-[#8c8c8c] border-[#e9e2d6]'}`}>
                      {typeLabels[selectedCategory.type] ?? selectedCategory.type}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">排序值</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">{selectedCategory.sort}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">状态</div>
                  <div className="mt-1">
                    <StatusTag label={selectedCategory.status === 'ACTIVE' ? '启用' : '停用'} tone={selectedCategory.status === 'ACTIVE' ? 'green' : 'orange'} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">App 中展示</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">{selectedCategory.isPublish ? '展示' : '隐藏'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">关联内容数</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">{selectedCategory.relatedCount ?? 0} 条</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">创建时间</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">{formatDate(selectedCategory.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">更新时间</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">{formatDate(selectedCategory.updatedAt)}</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-[#f5f1ea]">
              <Button variant="ghost" onClick={() => setSelectedCategory(null)}>
                关闭
              </Button>
              <Button
                onClick={() => {
                  const item = selectedCategory;
                  setSelectedCategory(null);
                  openEdit(item);
                }}
                className="bg-[#7a8b6f] hover:bg-[#68775f]"
              >
                编辑分类
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </section>
  );
};

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[72px_1fr] items-center gap-3 text-sm text-[#2f2f2f]">
    <span className="font-medium">{label}</span>
    {children}
  </div>
);

const StatCard = ({ icon, title, value, suffix, tone = 'green' }: { icon: string; title: string; value: number; suffix: string; tone?: 'green' | 'orange' }) => (
  <div className="flex items-center gap-5 rounded-2xl border border-[#e9e2d6] bg-white p-6 shadow-sm">
    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${tone === 'green' ? 'bg-[#edf5ea] text-[#6f8b62]' : 'bg-[#fbf1e7] text-[#c27b48]'}`}>{icon}</div>
    <div>
      <div className="text-sm text-[#8c8c8c]">{title}</div>
      <div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{value.toLocaleString('zh-CN')} <span className="text-sm font-normal">{suffix}</span></div>
    </div>
  </div>
);

const PaginationFooter = ({ total, page, pageSize, totalPages, canPrev, canNext, loading, setPage, setPageSize }: { total: number; page: number; pageSize: number; totalPages: number; canPrev: boolean; canNext: boolean; loading: boolean; setPage: Dispatch<SetStateAction<number>>; setPageSize: Dispatch<SetStateAction<number>> }) => (
  <div className="flex items-center justify-between gap-4 border-t border-[#f1ece4] px-5 py-4 text-sm text-[#8c8c8c] overflow-x-auto whitespace-nowrap">
    <span>共 {total.toLocaleString('zh-CN')} 条</span>
    <div className="flex items-center gap-2">
      <select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value={10}>10 条/页</option><option value={20}>20 条/页</option></select>
      <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</Button>
      <span className="rounded-lg bg-[#6f8b62] px-4 py-2 text-white">{page}</span>
      <span>/ {totalPages}</span>
      <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((value) => value + 1)}>›</Button>
      <span>前往</span>
      <Input type="number" min={1} max={totalPages} value={page} onChange={(event) => setPage(Math.min(totalPages, Math.max(1, Number(event.target.value) || 1)))} className="h-10 w-16 rounded-lg text-center font-normal" />
      <span>页</span>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <div className="mb-1 text-xs text-[#8c8c8c]">{label}</div>
    {children}
  </div>
);
