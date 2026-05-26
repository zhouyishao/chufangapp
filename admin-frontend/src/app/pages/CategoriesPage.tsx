import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createCategory, deleteCategory, listCategories, setCategoryPublish, setCategoryStatus, updateCategory } from '../api';
import type { IngredientCategory } from '../types';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';

type Draft = {
  name: string;
  sort: number;
  status: IngredientCategory['status'];
  isPublish: boolean;
};

const emptyDraft: Draft = { name: '', sort: 0, status: 'ACTIVE', isPublish: true };

export const CategoriesPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<IngredientCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<IngredientCategory['status'] | ''>('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [editing, setEditing] = useState<IngredientCategory | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState<IngredientCategory | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);

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
        status: statusFilter || undefined,
        type: 'INGREDIENT'
      });
      setItems(data.list);
      setTotal(data.total);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [page, pageSize, q, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setDrawerOpen(true);
  };

  const openEdit = (item: IngredientCategory) => {
    setEditing(item);
    setDraft({ name: item.name, sort: item.sort, status: item.status, isPublish: item.isPublish });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      const payload = {
        name: draft.name.trim(),
        type: 'INGREDIENT' as const,
        sort: draft.sort,
        status: draft.status,
        isPublish: draft.isPublish
      };
      if (editing) {
        await updateCategory(editing.id, payload);
      } else {
        await createCategory(payload);
      }
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

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(items.map((i) => i.id));
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    setBatchDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteCategory(id)));
      setNotice('批量删除成功');
      setSelectedIds([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量删除失败');
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleQuickPublish = async (item: IngredientCategory, next: boolean) => {
    setError(null);
    try {
      await setCategoryPublish(item.id, next);
      setNotice(next ? '已展示' : '已隐藏');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
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

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-semibold">分类管理</div>
          <div className="mt-1 text-sm text-zinc-500">管理菜谱、食材、调料、水果和调酒分类。</div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={!selectedIds.length || batchDeleting} onClick={() => void handleBatchDelete()}>
            {batchDeleting ? '处理中...' : `批量删除${selectedIds.length ? ` (${selectedIds.length})` : ''}`}
          </Button>
          <Button onClick={openCreate}>新增分类</Button>
        </div>
      </div>

      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}

      <div className="rounded-2xl border border-zinc-100 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索分类名称..." />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="">全部状态</option>
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">禁用</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              {[10, 20, 50].map((v) => (
                <option key={v} value={v}>
                  {v} / 页
                </option>
              ))}
            </select>
            <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              上一页
            </Button>
            <div className="text-sm text-zinc-600">
              第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页
            </div>
            <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((p) => p + 1)}>
              下一页
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-100 px-4 py-3 text-xs text-zinc-500">
          <div className="col-span-1">
            <input type="checkbox" checked={selectedIds.length === items.length && items.length > 0} onChange={toggleAll} />
          </div>
          <div className="col-span-1">ID</div>
          <div className="col-span-4">名称</div>
          <div className="col-span-2">状态</div>
          <div className="col-span-1">排序</div>
          <div className="col-span-3 text-right">操作</div>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-zinc-500">加载中...</div>
        ) : items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-zinc-50"
            >
              <div className="col-span-1">
                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />
              </div>
              <div className="col-span-1 text-zinc-500">{item.id}</div>
              <div className="col-span-4">{item.name}</div>
              <div className="col-span-2">
                <span
                  className={[
                    'inline-flex rounded-full px-2 py-0.5 text-xs',
                    item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                  ].join(' ')}
                >
                  {item.status === 'ACTIVE' ? '启用' : '禁用'}
                </span>
              </div>
              <div className="col-span-1 text-zinc-700">{item.sort}</div>
              <div className="col-span-3 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={() => navigate(`/categories/${item.id}`)}>
                  详情
                </Button>
                <Button variant="ghost" onClick={() => openEdit(item)}>
                  编辑
                </Button>
                {item.isPublish ? (
                  <Button variant="ghost" onClick={() => void handleQuickPublish(item, false)}>
                    隐藏
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => void handleQuickPublish(item, true)}>
                    展示
                  </Button>
                )}
                {item.status === 'ACTIVE' ? (
                  <Button variant="ghost" onClick={() => void handleQuickStatus(item, 'DISABLED')}>
                    禁用
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => void handleQuickStatus(item, 'ACTIVE')}>
                    启用
                  </Button>
                )}
                <Button variant="danger" onClick={() => setDeleting(item)}>
                  删除
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-zinc-500">暂无分类。</div>
        )}
      </div>

      <Drawer title={editing ? '编辑分类' : '新增分类'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs text-zinc-600">名称</div>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <div className="mb-1 text-xs text-zinc-600">排序（越大越靠前）</div>
            <Input
              type="number"
              value={draft.sort}
              onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-zinc-600">状态</div>
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft['status'] })}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">禁用</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={draft.isPublish}
                onChange={(e) => setDraft({ ...draft, isPublish: e.target.checked })}
              />
              在 App 中展示
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
              取消
            </Button>
            <Button disabled={!canSave} onClick={() => void handleSave()}>
              保存
            </Button>
          </div>
        </div>
      </Drawer>

      <Drawer
        title="分类配置"
        open={configOpen}
        onClose={() => setConfigOpen(false)}
      >
        <div className="space-y-3">
          <div className="text-sm text-zinc-600">快速配置分类展示与状态。</div>
          <div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={draft.isPublish}
                onChange={(e) => setDraft({ ...draft, isPublish: e.target.checked })}
              />
              在 App 中展示
            </label>
          </div>
          <div>
            <div className="mb-1 text-xs text-zinc-600">状态</div>
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft['status'] })}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">禁用</option>
            </select>
          </div>
          <div>
            <div className="mb-1 text-xs text-zinc-600">排序</div>
            <Input
              type="number"
              value={draft.sort}
              onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setConfigOpen(false)}>
              取消
            </Button>
            <Button disabled={!canSave} onClick={() => void handleSave().then(() => setConfigOpen(false))}>
              保存
            </Button>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        title="确认删除"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        description={deleting ? `删除分类「${deleting.name}」后将无法恢复。` : null}
        confirmText="删除"
        danger
        onConfirm={handleDelete}
      />
    </div>
  );
};
