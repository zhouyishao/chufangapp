import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createIngredient, deleteIngredient, listCategories, listIngredients, setIngredientPublish, setIngredientRecommend, setIngredientStatus, updateIngredient } from '../api';
import type { Ingredient, IngredientCategory } from '../types';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { FilterPanel } from '../components/FilterPanel';
import { ImagePreview } from '../components/ImagePreview';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import { UploadImage } from '../components/UploadImage';

type Draft = {
  name: string;
  coverUrl: string | null;
  categoryId: number | null;
  seasonMonth: string | null;
  nutrition: string | null;
  selectionTips: string | null;
  storageMethod: string | null;
  taboo: string | null;
  currentPrice: number | null;
  priceUnit: string | null;
  priceSource: string | null;
  isPublish: boolean;
  isRecommend: boolean;
  status: Ingredient['status'];
  sort: number;
};

const emptyDraft: Draft = {
  name: '',
  coverUrl: null,
  categoryId: null,
  seasonMonth: null,
  nutrition: null,
  selectionTips: null,
  storageMethod: null,
  taboo: null,
  currentPrice: null,
  priceUnit: null,
  priceSource: null,
  isPublish: true,
  isRecommend: false,
  status: 'ACTIVE',
  sort: 0
};

const isValidSeasonMonth = (value: string | null) => {
  if (!value?.trim()) return true;
  return value
    .split(/[,，/\s]+/)
    .filter(Boolean)
    .every((month) => {
      const numericMonth = Number(month);
      return Number.isInteger(numericMonth) && numericMonth >= 1 && numericMonth <= 12;
    });
};

export const IngredientsPage = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<Ingredient[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<Ingredient['status'] | ''>('');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [seasonMonthFilter, setSeasonMonthFilter] = useState<'all' | string>('all');
  const [recommendFilter, setRecommendFilter] = useState<'all' | 'recommended' | 'normal'>('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState<Ingredient | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const canSave = useMemo(() => draft.name.trim().length > 0 && draft.categoryId !== null, [draft.categoryId, draft.name]);
  const canPrev = page > 1;
  const canNext = page * pageSize < total;
  const visibleItems = useMemo(() => {
    if (seasonMonthFilter === 'all') return items;
    return items.filter((item) => (item.seasonMonth ?? '').split(/[,，/\s]+/).includes(seasonMonthFilter));
  }, [items, seasonMonthFilter]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const [cats, list] = await Promise.all([
        listCategories({ page: 1, pageSize: 100, type: 'INGREDIENT' }),
        listIngredients({
          page,
          pageSize,
          q: q.trim() || undefined,
          status: statusFilter === '' ? undefined : statusFilter,
          isPublish: publishFilter === 'all' ? undefined : publishFilter === 'published',
          isRecommend: recommendFilter === 'all' ? undefined : recommendFilter === 'recommended',
          categoryId: categoryFilter === 'all' ? undefined : Number(categoryFilter)
        })
      ]);
      setCategories(cats.list);
      setItems(list.list);
      setTotal(list.total);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [page, pageSize, q, statusFilter, publishFilter, recommendFilter, categoryFilter]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setDrawerOpen(true);
  };

  const openEdit = (item: Ingredient) => {
    setEditing(item);
    setDraft({
      name: item.name,
      coverUrl: item.cover,
      categoryId: item.categoryId,
      seasonMonth: item.seasonMonth,
      nutrition: item.nutrition,
      selectionTips: item.selectionTips,
      storageMethod: item.storageMethod,
      taboo: item.taboo,
      currentPrice: item.currentPrice,
      priceUnit: item.priceUnit,
      priceSource: item.priceSource,
      isPublish: item.isPublish,
      isRecommend: item.isRecommend,
      status: item.status,
      sort: item.sort
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!canSave) return;
    if (!isValidSeasonMonth(draft.seasonMonth)) {
      setError('时令月份格式错误，请填写 1-12 的月份，多个值用逗号分隔');
      return;
    }
    if (draft.currentPrice !== null && !Number.isFinite(draft.currentPrice)) {
      setError('当前价格必须是数字');
      return;
    }
    if (!Number.isFinite(draft.sort)) {
      setError('排序必须是数字');
      return;
    }
    const payload = {
      name: draft.name.trim(),
      coverUrl: draft.coverUrl?.trim() ? draft.coverUrl.trim() : null,
      categoryId: draft.categoryId,
      seasonMonth: draft.seasonMonth?.trim() ? draft.seasonMonth.trim() : null,
      nutrition: draft.nutrition?.trim() ? draft.nutrition.trim() : null,
      selectionTips: draft.selectionTips?.trim() ? draft.selectionTips.trim() : null,
      storageMethod: draft.storageMethod?.trim() ? draft.storageMethod.trim() : null,
      taboo: draft.taboo?.trim() ? draft.taboo.trim() : null,
      currentPrice: draft.currentPrice,
      priceUnit: draft.priceUnit?.trim() ? draft.priceUnit.trim() : null,
      priceSource: draft.priceSource?.trim() ? draft.priceSource.trim() : null,
      isPublish: draft.isPublish,
      isRecommend: draft.isRecommend,
      status: draft.status,
      sort: draft.sort
    };
    try {
      if (editing) {
        await updateIngredient(editing.id, payload);
      } else {
        await createIngredient(payload);
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
      await deleteIngredient(deleting.id);
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
    if (selectedIds.length === visibleItems.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(visibleItems.map((i) => i.id));
  };

  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    setBatchDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteIngredient(id)));
      setNotice('批量删除成功');
      setSelectedIds([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量删除失败');
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleQuickPublish = async (item: Ingredient, next: boolean) => {
    setError(null);
    try {
      await setIngredientPublish(item.id, next);
      setNotice(next ? '已发布' : '已下架');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleQuickRecommend = async (item: Ingredient, next: boolean) => {
    setError(null);
    try {
      await setIngredientRecommend(item.id, next);
      setNotice(next ? '已推荐' : '已取消推荐');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleQuickStatus = async (item: Ingredient, next: Ingredient['status']) => {
    setError(null);
    try {
      await setIngredientStatus(item.id, next);
      setNotice(next === 'ACTIVE' ? '已启用' : '已禁用');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const ingredientColumns: DataTableColumn<Ingredient>[] = [
    {
      key: 'select',
      title: '',
      render: (item) => <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />
    },
    {
      key: 'cover',
      title: '图片',
      render: (item) => <ImagePreview src={item.cover} alt={item.name} />
    },
    { key: 'id', title: 'ID', render: (item) => item.id },
    { key: 'name', title: '名称', render: (item) => <span className="font-medium text-[#2f2f2f]">{item.name}</span> },
    { key: 'alias', title: '别名', render: () => '-' },
    { key: 'type', title: '类型', render: (item) => item.category?.name ?? categories.find((category) => category.id === item.categoryId)?.name ?? '-' },
    { key: 'seasonMonth', title: '时令月份', render: (item) => item.seasonMonth ?? '-' },
    { key: 'relatedRecipeCount', title: '关联菜谱数', render: (item) => Number((item as Ingredient & { relatedRecipeCount?: number }).relatedRecipeCount ?? 0) },
    { key: 'status', title: '状态', render: (item) => <StatusTag label={item.status === 'ACTIVE' ? '启用' : '禁用'} tone={item.status === 'ACTIVE' ? 'green' : 'gray'} /> },
    { key: 'recommend', title: '推荐', render: (item) => <StatusTag label={item.isRecommend ? '已推荐' : '未推荐'} tone={item.isRecommend ? 'green' : 'gray'} /> },
    { key: 'updatedAt', title: '更新时间', render: (item) => new Date(item.updatedAt).toLocaleString('zh-CN', { hour12: false }) },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex min-w-[360px] flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate(`/content/ingredients/${item.id}`)}>查看</Button>
          <Button variant="ghost" onClick={() => navigate(`/content/ingredients/${item.id}/edit`)}>编辑</Button>
          <Button variant="ghost" onClick={() => setNotice(`关联菜谱：${item.name}`)}>关联菜谱</Button>
          <Button variant="ghost" onClick={() => void handleQuickRecommend(item, !item.isRecommend)}>{item.isRecommend ? '取消推荐' : '推荐'}</Button>
          <Button variant="ghost" onClick={() => void handleQuickPublish(item, !item.isPublish)}>{item.isPublish ? '下架' : '上架'}</Button>
          <Button variant="danger" onClick={() => setDeleting(item)}>删除</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="食材管理"
        description="管理食材资料、时令月份、推荐状态、发布状态和关联菜谱，支持搜索、筛选、分页与批量操作。"
        actions={
          <>
            <Button variant="ghost" disabled={!selectedIds.length || batchDeleting} onClick={() => void handleBatchDelete()}>
              {batchDeleting ? '处理中...' : `批量删除${selectedIds.length ? ` (${selectedIds.length})` : ''}`}
            </Button>
            <Button onClick={() => navigate('/content/ingredients/create')}>新增食材</Button>
          </>
        }
      />

      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}

      <FilterPanel>
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-6">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索食材名称..." />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="all">全部类型</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={seasonMonthFilter}
              onChange={(e) => setSeasonMonthFilter(e.target.value)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="all">全部月份</option>
              {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((month) => (
                <option key={month} value={month}>{month} 月</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="">全部状态</option>
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">禁用</option>
            </select>
            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value as typeof publishFilter)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="all">全部展示</option>
              <option value="published">展示中</option>
              <option value="hidden">已隐藏</option>
            </select>
            <select
              value={recommendFilter}
              onChange={(e) => setRecommendFilter(e.target.value as typeof recommendFilter)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="all">全部推荐</option>
              <option value="recommended">已推荐</option>
              <option value="normal">未推荐</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 text-sm text-[#8c8c8c]">
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
      </FilterPanel>

      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-3">
        <label className="inline-flex items-center gap-2 text-sm text-[#8c8c8c]">
          <input type="checkbox" checked={selectedIds.length === visibleItems.length && visibleItems.length > 0} onChange={toggleAll} />
          全选当前页
        </label>
      </div>

      <DataTable columns={ingredientColumns} data={visibleItems} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无食材" />

      <Drawer title={editing ? '编辑食材' : '新增食材'} open={drawerOpen} onClose={() => setDrawerOpen(false)} widthClassName="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-zinc-600">名称</div>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">分类</div>
              <select
                value={draft.categoryId ?? ''}
                onChange={(e) => setDraft({ ...draft, categoryId: e.target.value ? Number(e.target.value) : null })}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="">未分类</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <UploadImage
                label="封面图片上传"
                value={draft.coverUrl}
                helperText="上传成功后表单只保存 coverUrl。"
                onChange={(coverUrl) => setDraft({ ...draft, coverUrl })}
              />
              {!draft.coverUrl ? <div className="mt-2 text-xs text-[#8c8c8c]">建议上传封面图片，列表和 App 详情页会优先展示该图。</div> : null}
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">时令月份（如：5,6,7）</div>
              <Input value={draft.seasonMonth ?? ''} onChange={(e) => setDraft({ ...draft, seasonMonth: e.target.value })} />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">排序</div>
              <Input type="number" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })} />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">当前价格</div>
              <Input
                type="number"
                value={draft.currentPrice ?? ''}
                onChange={(e) => setDraft({ ...draft, currentPrice: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">单位</div>
              <Input value={draft.priceUnit ?? ''} onChange={(e) => setDraft({ ...draft, priceUnit: e.target.value })} placeholder="斤 / kg ..." />
            </div>
            <div className="md:col-span-2">
              <div className="mb-1 text-xs text-zinc-600">价格来源（可选）</div>
              <Input value={draft.priceSource ?? ''} onChange={(e) => setDraft({ ...draft, priceSource: e.target.value })} placeholder="如：盒马 / 菜市场" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={draft.isPublish} onChange={(e) => setDraft({ ...draft, isPublish: e.target.checked })} />
              在 App 中展示
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={draft.isRecommend} onChange={(e) => setDraft({ ...draft, isRecommend: e.target.checked })} />
              推荐
            </label>
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
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-zinc-600">营养（可选）</div>
              <textarea
                value={draft.nutrition ?? ''}
                onChange={(e) => setDraft({ ...draft, nutrition: e.target.value })}
                className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">挑选技巧（可选）</div>
              <textarea
                value={draft.selectionTips ?? ''}
                onChange={(e) => setDraft({ ...draft, selectionTips: e.target.value })}
                className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">保存方法（可选）</div>
              <textarea
                value={draft.storageMethod ?? ''}
                onChange={(e) => setDraft({ ...draft, storageMethod: e.target.value })}
                className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">禁忌（可选）</div>
              <textarea
                value={draft.taboo ?? ''}
                onChange={(e) => setDraft({ ...draft, taboo: e.target.value })}
                className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
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

      <Drawer title="食材配置" open={configOpen} onClose={() => setConfigOpen(false)} widthClassName="max-w-xl">
        <div className="space-y-3">
          <div className="text-sm text-zinc-600">快速配置展示、推荐与排序。</div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={draft.isPublish} onChange={(e) => setDraft({ ...draft, isPublish: e.target.checked })} />
            在 App 中展示
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={draft.isRecommend} onChange={(e) => setDraft({ ...draft, isRecommend: e.target.checked })} />
            推荐
          </label>
          <div>
            <div className="mb-1 text-xs text-zinc-600">排序</div>
            <Input type="number" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })} />
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
        description={deleting ? `删除食材「${deleting.name}」后将无法恢复。` : null}
        confirmText="删除"
        danger
        onConfirm={handleDelete}
      />
    </div>
  );
};
