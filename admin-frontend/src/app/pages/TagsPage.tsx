import { useEffect, useMemo, useState } from 'react';

import { createTag, deleteTag, listTags, setTagStatus, updateTag, type TagItem } from '../api';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { FilterPanel } from '../components/FilterPanel';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';

type Draft = { name: string; scope: TagItem['scope']; sort: number; status: TagItem['status']; isPublish: boolean };

const emptyDraft: Draft = { name: '', scope: 'RECIPE', sort: 0, status: 'ACTIVE', isPublish: true };

const scopeTabs: { key: 'all' | TagItem['scope']; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'RECIPE', label: '菜谱标签' },
  { key: 'INGREDIENT', label: '食材标签' },
  { key: 'TASTE', label: '口味标签' },
  { key: 'METHOD', label: '做法标签' },
  { key: 'SCENE', label: '场景标签' },
  { key: 'CROWD', label: '人群标签' }
];

const scopeLabels: Record<string, string> = {
  RECIPE: '菜谱标签', INGREDIENT: '食材标签', SCENE: '场景标签', TASTE: '口味标签', METHOD: '做法标签', CROWD: '人群标签'
};

export const TagsPage = () => {
  const [items, setItems] = useState<TagItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | TagItem['scope']>('all');
  const [statusFilter, setStatusFilter] = useState<TagItem['status'] | ''>('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const [deleting, setDeleting] = useState<TagItem | null>(null);

  const canSave = useMemo(() => draft.name.trim().length > 0, [draft.name]);
  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const refresh = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const data = await listTags({ page, pageSize, q: q.trim() || undefined, scope: scopeFilter === 'all' ? undefined : scopeFilter, status: statusFilter || undefined });
      setItems(data.list);
      setTotal(data.total);
    } catch (err) { setError(err instanceof Error ? err.message : '加载失败'); } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, [page, pageSize, q, scopeFilter, statusFilter]);

  const openCreate = () => { setEditing(null); setDraft(emptyDraft); setDrawerOpen(true); };
  const openEdit = (item: TagItem) => { setEditing(item); setDraft({ name: item.name, scope: item.scope, sort: item.sort, status: item.status, isPublish: item.isPublish }); setDrawerOpen(true); };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      const payload = { name: draft.name.trim(), scope: draft.scope, sort: draft.sort, status: draft.status, isPublish: draft.isPublish };
      if (editing) await updateTag(editing.id, payload); else await createTag(payload);
      setDrawerOpen(false); setNotice('保存成功'); await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : '保存失败'); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try { await deleteTag(deleting.id); setDeleting(null); setNotice('删除成功'); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : '删除失败'); }
  };

  const handleQuickStatus = async (item: TagItem, next: TagItem['status']) => {
    setError(null);
    try { await setTagStatus(item.id, next); setNotice(next === 'ACTIVE' ? '已启用' : '已禁用'); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : '操作失败'); }
  };

  const columns: DataTableColumn<TagItem>[] = [
    { key: 'id', title: 'ID', render: (i) => <span className="text-xs text-[#8c8c8c]">{i.id}</span> },
    { key: 'name', title: '名称', render: (i) => <span className="font-medium text-[#2f2f2f]">{i.name}</span> },
    { key: 'scope', title: '类型', render: (i) => <span className="inline-flex rounded-full bg-[#f5f1ea] px-2 py-0.5 text-xs text-[#8c8c8c]">{scopeLabels[i.scope] ?? i.scope}</span> },
    { key: 'sort', title: '排序', render: (i) => <span className="text-xs text-[#8c8c8c]">{i.sort}</span> },
    { key: 'status', title: '状态', render: (i) => <StatusTag label={i.status === 'ACTIVE' ? '启用' : '禁用'} tone={i.status === 'ACTIVE' ? 'green' : 'gray'} /> },
    { key: 'actions', title: '操作', render: (i) => (
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => openEdit(i)}>编辑</Button>
        {i.status === 'ACTIVE' ? <Button variant="ghost" onClick={() => void handleQuickStatus(i, 'DISABLED')}>禁用</Button> : <Button variant="ghost" onClick={() => void handleQuickStatus(i, 'ACTIVE')}>启用</Button>}
        <Button variant="danger" onClick={() => setDeleting(i)}>删除</Button>
      </div>
    )}
  ];

  return (
    <section className="space-y-6">
      <PageHeader title="标签管理" description="管理菜谱、食材、口味、做法、场景、人群标签。" />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="flex flex-wrap items-center gap-2">
        {scopeTabs.map((t) => <button key={t.key} type="button" className={['rounded-full px-4 py-1.5 text-xs font-medium transition', scopeFilter === t.key ? 'bg-[#2f2f2f] text-white' : 'bg-[#f5f1ea] text-[#8c8c8c] hover:bg-[#e9e2d6]'].join(' ')} onClick={() => { setScopeFilter(t.key); setPage(1); }}>{t.label}</button>)}
      </div>

      <FilterPanel>
        <div className="flex flex-1 gap-3">
          <Input value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="搜索标签名称..." />
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value as typeof statusFilter); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value="">全部状态</option><option value="ACTIVE">启用</option><option value="DISABLED">禁用</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8c8c8c]">
          <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value={10}>10 / 页</option><option value={20}>20 / 页</option>
          </select>
          <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((v) => Math.max(1, v - 1))}>上一页</Button>
          <span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页</span>
          <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((v) => v + 1)}>下一页</Button>
          <Button onClick={openCreate}>新增标签</Button>
        </div>
      </FilterPanel>

      <DataTable columns={columns} data={items} loading={loading} error={error} rowKey={(i) => i.id} emptyTitle="暂无标签" />

      <Drawer title={editing ? '编辑标签' : '新增标签'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="space-y-3">
          <div><div className="mb-1 text-xs text-[#8c8c8c]">名称</div><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
          <div><div className="mb-1 text-xs text-[#8c8c8c]">类型</div><select value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value as Draft['scope'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">{scopeTabs.filter((t) => t.key !== 'all').map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
          <div><div className="mb-1 text-xs text-[#8c8c8c]">排序</div><Input type="number" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })} /></div>
          <div><div className="mb-1 text-xs text-[#8c8c8c]">状态</div><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft['status'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="ACTIVE">启用</option><option value="DISABLED">禁用</option></select></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={() => setDrawerOpen(false)}>取消</Button><Button disabled={!canSave} onClick={() => void handleSave()}>保存</Button></div>
        </div>
      </Drawer>

      <ConfirmModal title="确认删除" open={!!deleting} onClose={() => setDeleting(null)} description={deleting ? `删除标签「${deleting.name}」后将无法恢复。` : null} confirmText="删除" danger onConfirm={handleDelete} />
    </section>
  );
};
