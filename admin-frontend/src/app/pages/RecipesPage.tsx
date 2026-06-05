import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  createRecipe,
  deleteRecipe,
  listCategories,
  listRecipes,
  setRecipeAudit,
  setRecipePublish,
  setRecipeRecommend,
  setRecipeStatus,
  updateRecipe
} from '../api';
import type { IngredientCategory, Recipe } from '../types';
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
  title: string;
  subtitle: string | null;
  coverUrl: string | null;
  description: string | null;
  categoryId: string | null;
  cookTime: number | null;
  servings: number | null;
  difficulty: string | null;
  tips: string | null;
  sort: number;
  status: Recipe['status'];
  auditStatus: Recipe['auditStatus'];
  isDraft: boolean;
  isPublish: boolean;
  isRecommend: boolean;
  ingredientsText: string;
  stepsText: string;
};

const emptyDraft: Draft = {
  title: '',
  subtitle: null,
  coverUrl: null,
  description: null,
  categoryId: null,
  cookTime: null,
  servings: null,
  difficulty: null,
  tips: null,
  sort: 0,
  status: 'ACTIVE',
  auditStatus: 'DRAFT',
  isDraft: true,
  isPublish: false,
  isRecommend: false,
  ingredientsText: '',
  stepsText: ''
};

const difficultyOptions = ['简单', '中等', '困难'];

const splitLines = (value: string) =>
  value
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);

export const RecipesPage = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<Recipe['status'] | ''>('');
  const [auditFilter, setAuditFilter] = useState<Recipe['auditStatus'] | ''>('');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [recommendFilter, setRecommendFilter] = useState<'all' | 'recommended' | 'normal'>('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<Recipe | null>(null);
  const [publishing, setPublishing] = useState<{ item: Recipe; next: boolean } | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const canSave = useMemo(() => draft.title.trim().length > 0 && draft.categoryId !== null && Boolean(draft.difficulty?.trim()), [draft.categoryId, draft.difficulty, draft.title]);
  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const refresh = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const [cats, list] = await Promise.all([
        listCategories({ page: 1, pageSize: 100, type: 'RECIPE' }),
        listRecipes({
          page,
          pageSize,
          q: q.trim() || undefined,
          status: statusFilter === '' ? undefined : statusFilter,
          auditStatus: auditFilter === '' ? undefined : auditFilter,
          isPublish: publishFilter === 'all' ? undefined : publishFilter === 'published',
          isRecommend: recommendFilter === 'all' ? undefined : recommendFilter === 'recommended'
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
  }, [page, pageSize, q, statusFilter, auditFilter, publishFilter, recommendFilter]);

  const openCreate = () => {
    navigate('/content/recipes/create');
  };

  const openEdit = async (item: Recipe) => {
    navigate(`/content/recipes/${item.id}/edit`);
  };

  const toPayload = (d: Draft) => {
    const ingredientLines = splitLines(d.ingredientsText);
    const stepLines = splitLines(d.stepsText);
    return {
      title: d.title.trim(),
      subtitle: d.subtitle?.trim() ? d.subtitle.trim() : null,
      coverUrl: d.coverUrl?.trim() ? d.coverUrl.trim() : null,
      description: d.description?.trim() ? d.description.trim() : null,
      categoryId: d.categoryId,
      cookTime: d.cookTime,
      servings: d.servings,
      calories: null,
      difficulty: d.difficulty?.trim() ? d.difficulty.trim() : null,
      taste: null,
      scene: null,
      tips: d.tips?.trim() ? d.tips.trim() : null,
      sort: d.sort,
      status: d.status,
      auditStatus: d.auditStatus,
      isDraft: d.isDraft,
      isPublish: d.isPublish,
      isRecommend: d.isRecommend,
      steps: stepLines.map((description, idx) => ({
        sortIndex: idx + 1,
        title: null,
        description,
        image: null
      })),
      ingredients: ingredientLines.map((line, idx) => ({
        sortIndex: idx + 1,
        ingredientId: null,
        name: line,
        amount: null
      }))
    };
  };

  const handleSave = async () => {
    if (!canSave) return;
    if (draft.cookTime !== null && !Number.isFinite(draft.cookTime)) {
      setError('制作时间必须是数字');
      return;
    }
    if (!Number.isFinite(draft.sort)) {
      setError('排序必须是数字');
      return;
    }
    const payload = toPayload(draft);
    try {
      if (editing) {
        await updateRecipe(editing.id, payload);
      } else {
        await createRecipe(payload);
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
      await deleteRecipe(deleting.id);
      setDeleting(null);
      setNotice('删除成功');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const toggleSelected = (id: string) => {
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
      await Promise.all(selectedIds.map((id) => deleteRecipe(id)));
      setNotice('批量删除成功');
      setSelectedIds([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量删除失败');
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleQuickPublish = async (item: Recipe, next: boolean) => {
    setError(null);
    try {
      await setRecipePublish(item.id, next);
      setNotice(next ? '已发布' : '已下架');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleConfirmPublish = async () => {
    if (!publishing) return;
    await handleQuickPublish(publishing.item, publishing.next);
    setPublishing(null);
  };

  const handleQuickRecommend = async (item: Recipe, next: boolean) => {
    setError(null);
    try {
      await setRecipeRecommend(item.id, next);
      setNotice(next ? '已推荐' : '已取消推荐');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleQuickStatus = async (item: Recipe, next: Recipe['status']) => {
    setError(null);
    try {
      await setRecipeStatus(item.id, next);
      setNotice(next === 'ACTIVE' ? '已启用' : '已禁用');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleQuickAudit = async (item: Recipe, next: Recipe['auditStatus']) => {
    setError(null);
    try {
      await setRecipeAudit(item.id, next);
      const labels: Record<string, string> = { DRAFT: '已退回草稿', PENDING: '已提交审核', APPROVED: '已通过', REJECTED: '已驳回' };
      setNotice(labels[next] ?? '审核状态已更新');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const recipeColumns: DataTableColumn<Recipe>[] = [
    {
      key: 'select',
      title: '',
      render: (item) => <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />
    },
    {
      key: 'recipe',
      title: '菜谱',
      render: (item) => (
        <button type="button" className="flex min-w-[240px] items-center gap-3 text-left" onClick={() => navigate(`/content/recipes/${item.id}`)}>
          <ImagePreview src={item.cover} alt={item.title} />
          <div className="min-w-0">
            <div className="font-medium text-[#2f2f2f]">{item.title}</div>
            <div className="mt-1 text-xs text-[#8c8c8c]">{item.subtitle ?? '未填写副标题'}</div>
          </div>
        </button>
      )
    },
    { key: 'category', title: '分类', render: (item) => item.category?.name ?? categories.find((category) => category.id === item.categoryId)?.name ?? '-' },
    { key: 'mainIngredients', title: '主要食材', render: (item) => item.ingredients?.slice(0, 3).map((ingredient) => ingredient.name).filter(Boolean).join('、') || '-' },
    { key: 'difficulty', title: '难度', render: (item) => item.difficulty ?? '-' },
    { key: 'cookTime', title: '制作时间', render: (item) => (item.cookTime ? `${item.cookTime} 分钟` : '-') },
    { key: 'status', title: '状态', render: (item) => <StatusTag label={item.status === 'ACTIVE' ? '启用' : '禁用'} tone={item.status === 'ACTIVE' ? 'green' : 'gray'} /> },
    { key: 'viewCount', title: '浏览量', render: (item) => Number(item.viewCount ?? 0).toLocaleString('zh-CN') },
    { key: 'favoriteCount', title: '收藏量', render: (item) => Number(item.favoriteCount ?? 0).toLocaleString('zh-CN') },
    { key: 'updatedAt', title: '更新时间', render: (item) => new Date(item.updatedAt).toLocaleString('zh-CN', { hour12: false }) },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex min-w-[260px] flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate(`/content/recipes/${item.id}/edit`)}>编辑</Button>
          <Button variant="ghost" onClick={() => setPublishing({ item, next: !item.isPublish })}>{item.isPublish ? '下架' : '上架'}</Button>
          <Button variant="danger" onClick={() => setDeleting(item)}>删除</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="菜谱管理"
        description="管理官方菜谱和用户投稿菜谱，支持搜索、筛选、分页、发布状态、审核状态和批量操作。"
        actions={
          <>
            <Button variant="ghost" disabled={!selectedIds.length || batchDeleting} onClick={() => void handleBatchDelete()}>
              {batchDeleting ? '处理中...' : `批量删除${selectedIds.length ? ` (${selectedIds.length})` : ''}`}
            </Button>
            <Button onClick={() => navigate('/content/recipes/create')}>新增菜谱</Button>
          </>
        }
      />

      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}

      <FilterPanel>
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-5">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索标题..." />
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
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value as typeof auditFilter)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="">全部审核</option>
              <option value="DRAFT">草稿</option>
              <option value="PENDING">待审核</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已驳回</option>
            </select>
            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value as typeof publishFilter)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="all">全部发布</option>
              <option value="published">已发布</option>
              <option value="hidden">未发布</option>
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
          <input type="checkbox" checked={selectedIds.length === items.length && items.length > 0} onChange={toggleAll} />
          全选当前页
        </label>
      </div>

      <DataTable columns={recipeColumns} data={items} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无菜谱" />

      <Drawer title={editing ? '编辑菜谱' : '新增菜谱'} open={drawerOpen} onClose={() => setDrawerOpen(false)} widthClassName="max-w-3xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="mb-1 text-xs text-zinc-600">标题</div>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <div className="mb-1 text-xs text-zinc-600">副标题（可选）</div>
              <Input value={draft.subtitle ?? ''} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <UploadImage
                label="封面图片上传"
                value={draft.coverUrl}
                helperText="菜谱视频上传后续单独接入；当前封面上传后只保存 coverUrl。"
                onChange={(coverUrl) => setDraft({ ...draft, coverUrl })}
              />
              {!draft.coverUrl ? <div className="mt-2 text-xs text-[#8c8c8c]">建议上传封面图片，列表和 App 详情页会优先展示该图。</div> : null}
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">分类</div>
              <select
                value={draft.categoryId ?? ''}
                onChange={(e) => setDraft({ ...draft, categoryId: e.target.value || null })}
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
            <div>
              <div className="mb-1 text-xs text-zinc-600">难度（可选）</div>
              <select
                value={draft.difficulty ?? ''}
                onChange={(e) => setDraft({ ...draft, difficulty: e.target.value || null })}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="">请选择难度</option>
                {difficultyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">烹饪时间（分钟）</div>
              <Input
                type="number"
                value={draft.cookTime ?? ''}
                onChange={(e) => setDraft({ ...draft, cookTime: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">份量</div>
              <Input
                type="number"
                value={draft.servings ?? ''}
                onChange={(e) => setDraft({ ...draft, servings: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">排序</div>
              <Input type="number" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })} />
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
              <div className="mb-1 text-xs text-zinc-600">审核状态</div>
              <select
                value={draft.auditStatus}
                onChange={(e) => setDraft({ ...draft, auditStatus: e.target.value as Draft['auditStatus'] })}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="DRAFT">草稿</option>
                <option value="PENDING">待审核</option>
                <option value="APPROVED">已通过</option>
                <option value="REJECTED">已驳回</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={draft.isPublish} onChange={(e) => setDraft({ ...draft, isPublish: e.target.checked })} />
              已发布
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={draft.isRecommend} onChange={(e) => setDraft({ ...draft, isRecommend: e.target.checked })} />
              推荐
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={draft.isDraft} onChange={(e) => setDraft({ ...draft, isDraft: e.target.checked })} />
              草稿
            </label>
          </div>

          <div>
            <div className="mb-1 text-xs text-zinc-600">简介（可选）</div>
            <textarea
              value={draft.description ?? ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-zinc-600">食材清单（每行一条）</div>
              <textarea
                value={draft.ingredientsText}
                onChange={(e) => setDraft({ ...draft, ingredientsText: e.target.value })}
                className="min-h-44 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                placeholder="如：番茄 3个"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-600">步骤（每行一步）</div>
              <textarea
                value={draft.stepsText}
                onChange={(e) => setDraft({ ...draft, stepsText: e.target.value })}
                className="min-h-44 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                placeholder="如：处理食材..."
              />
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-zinc-600">Tips（可选）</div>
            <textarea
              value={draft.tips ?? ''}
              onChange={(e) => setDraft({ ...draft, tips: e.target.value })}
              className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            />
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

      <Drawer title="菜谱配置" open={configOpen} onClose={() => setConfigOpen(false)} widthClassName="max-w-xl">
        <div className="space-y-3">
          <div className="text-sm text-zinc-600">快速配置发布、推荐与排序。</div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={draft.isPublish} onChange={(e) => setDraft({ ...draft, isPublish: e.target.checked })} />
            已发布
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
        title={publishing?.next ? '确认上架' : '确认下架'}
        open={!!publishing}
        onClose={() => setPublishing(null)}
        description={publishing ? `确认${publishing.next ? '上架' : '下架'}菜谱「${publishing.item.title}」？操作后 App 展示状态会同步变化。` : null}
        confirmText={publishing?.next ? '上架' : '下架'}
        onConfirm={handleConfirmPublish}
      />

      <ConfirmModal
        title="确认删除"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        description={deleting ? `删除菜谱「${deleting.title}」后将无法恢复。` : null}
        confirmText="删除"
        danger
        onConfirm={handleDelete}
      />
    </div>
  );
};
