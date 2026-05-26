import { useEffect, useMemo, useState } from 'react';

import { createCategory, deleteCategory, listCategories, setCategoryPublish, setCategoryStatus, updateCategory } from '../api';
import type { IngredientCategory } from '../types';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { FilterPanel } from '../components/FilterPanel';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';

type Draft = { name: string; type: IngredientCategory['type']; sort: number; status: IngredientCategory['status']; isPublish: boolean };

const emptyDraft: Draft = { name: '', type: 'INGREDIENT', sort: 0, status: 'ACTIVE', isPublish: true };

const typeTabs: { key: 'all' | IngredientCategory['type']; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'RECIPE', label: '菜谱分类' },
  { key: 'INGREDIENT', label: '食材分类' },
  { key: 'SEASONING', label: '调料分类' },
  { key: 'FRUIT', label: '水果分类' },
  { key: 'COCKTAIL', label: '酒水分类' }
];

const typeLabels: Record<string, string> = {
  RECIPE: '菜谱分类', INGREDIENT: '食材分类', SEASONING: '调料分类', FRUIT: '水果分类', COCKTAIL: '酒水分类'
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
  const [typeFilter, setTypeFilter] = useState<'all' | IngredientCategory['type']>('all');
  const [statusFilter, setStatusFilter] = useState<IngredientCategory['status'] | ''>('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<IngredientCategory | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const [deleting, setDeleting] = useState<IngredientCategory | null>(null);

  const canSave = useMemo(() => draft.name.trim().length > 0, [draft.name]);
  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const refresh = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const data = await listCategories({
        page,
        pageSize,
        q: q.trim() || undefined,
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

  useEffect(() => { void refresh(); }, [page, pageSize, q, typeFilter, statusFilter]);

  const openCreate = () => { setEditing(null); setDraft(emptyDraft); setDrawerOpen(true); };

  const openEdit = (item: IngredientCategory) => {
    setEditing(item);
    setDraft({ name: item.name, type: item.type, sort: item.sort, status: item.status, isPublish: item.isPublish });
    setDrawerOpen(true);
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

  const handleQuickPublish = async (item: IngredientCategory, next: boolean) => {
    setError(null);
    try {
      await setCategoryPublish(item.id, next);
      setNotice(next ? '已展示' : '已隐藏');
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : '操作失败'); }
  };

  const handleQuickStatus = async (item: IngredientCategory, next: IngredientCategory['status']) => {
    setError(null);
    try {
      await setCategoryStatus(item.id, next);
      setNotice(next === 'ACTIVE' ? '已启用' : '已禁用');
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : '操作失败'); }
  };

  const columns: DataTableColumn<IngredientCategory>[] = [
    { key: 'id', title: 'ID', render: (item) => <span className="text-xs text-[#8c8c8c]">{item.id}</span> },
    { key: 'name', title: '名称', render: (item) => <span className="font-medium text-[#2f2f2f]">{item.name}</span> },
    {
      key: 'type', title: '类型',
      render: (item) => (
        <span className="inline-flex rounded-full bg-[#f5f1ea] px-2 py-0.5 text-xs text-[#8c8c8c]">
          {typeLabels[item.type] ?? item.type}
        </span>
      )
    },
    { key: 'sort', title: '排序', render: (item) => <span className="text-xs text-[#8c8c8c]">{item.sort}</span> },
    {
      key: 'status', title: '状态',
      render: (item) => (
        <StatusTag
          label={item.status === 'ACTIVE' ? '启用' : '禁用'}
          tone={item.status === 'ACTIVE' ? 'green' : 'gray'}
        />
      )
    },
    { key: 'publish', title: '展示', render: (item) => <span className="text-xs text-[#8c8c8c]">{item.isPublish ? '展示' : '隐藏'}</span> },
    {
      key: 'actions', title: '操作',
      render: (item) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => openEdit(item)}>编辑</Button>
          {item.isPublish ? (
            <Button variant="ghost" onClick={() => void handleQuickPublish(item, false)}>隐藏</Button>
          ) : (
            <Button variant="ghost" onClick={() => void handleQuickPublish(item, true)}>展示</Button>
          )}
          {item.status === 'ACTIVE' ? (
            <Button variant="ghost" onClick={() => void handleQuickStatus(item, 'DISABLED')}>禁用</Button>
          ) : (
            <Button variant="ghost" onClick={() => void handleQuickStatus(item, 'ACTIVE')}>启用</Button>
          )}
          <Button variant="danger" onClick={() => setDeleting(item)}>删除</Button>
        </div>
      )
    }
  ];

  return (
    <section className="space-y-6">
      <PageHeader title="分类管理" description="管理菜谱、食材、调料、水果、酒水分类，支持按类型筛选。" />

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="flex flex-wrap items-center gap-2">
        {typeTabs.map((tab) => (
          <button
            key={tab.key} type="button"
            className={[
              'rounded-full px-4 py-1.5 text-xs font-medium transition',
              typeFilter === tab.key ? 'bg-[#2f2f2f] text-white' : 'bg-[#f5f1ea] text-[#8c8c8c] hover:bg-[#e9e2d6]'
            ].join(' ')}
            onClick={() => { setTypeFilter(tab.key); setPage(1); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <FilterPanel>
        <div className="flex flex-1 gap-3">
          <Input value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="搜索分类名称..." />
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value as typeof statusFilter); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value="">全部状态</option>
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8c8c8c]">
          <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value={10}>10 / 页</option><option value={20}>20 / 页</option>
          </select>
          <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((v) => Math.max(1, v - 1))}>上一页</Button>
          <span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页</span>
          <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((v) => v + 1)}>下一页</Button>
          <Button onClick={openCreate}>新增分类</Button>
        </div>
      </FilterPanel>

      <DataTable columns={columns} data={items} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无分类" />

      <Drawer title={editing ? '编辑分类' : '新增分类'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs text-[#8c8c8c]">名称</div>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <div className="mb-1 text-xs text-[#8c8c8c]">类型</div>
            <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Draft['type'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
              {typeTabs.filter((t) => t.key !== 'all').map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <div className="mb-1 text-xs text-[#8c8c8c]">排序</div>
            <Input type="number" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })} />
          </div>
          <div>
            <div className="mb-1 text-xs text-[#8c8c8c]">状态</div>
            <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft['status'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
              <option value="ACTIVE">启用</option><option value="DISABLED">禁用</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={draft.isPublish} onChange={(e) => setDraft({ ...draft, isPublish: e.target.checked })} />
            在 App 中展示
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button disabled={!canSave} onClick={() => void handleSave()}>保存</Button>
          </div>
        </div>
      </Drawer>

      <ConfirmModal title="确认删除" open={!!deleting} onClose={() => setDeleting(null)} description={deleting ? `删除分类「${deleting.name}」后将无法恢复。` : null} confirmText="删除" danger onConfirm={handleDelete} />
    </section>
  );
};
