import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ensureDefaultIngredientCategories,
  listBeverages,
  listIngredients,
  listRecipes,
  type Beverage,
  disableBeverage,
  enableBeverage,
  setIngredientPublish,
  setIngredientRecommend,
  setRecipePublish,
  setRecipeRecommend
} from '../api';
import type { Ingredient, IngredientCategory, Recipe } from '../types';
import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { FilterPanel } from '../components/FilterPanel';
import { ImagePreview } from '../components/ImagePreview';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';

type ContentKind = 'all' | 'recipe' | 'vegetable' | 'fruit' | 'poultry' | 'aquatic' | 'seasoning' | 'beverage';
type IngredientContentLabel = '蔬菜' | '水果' | '生禽' | '水产' | '调料' | '食材';

type ContentRow =
  | {
      rowKey: string;
      source: 'recipe';
      id: string;
      title: string;
      subtitle: string | null;
      cover: string | null;
      typeLabel: '菜谱';
      categoryLabel: string;
      difficulty: string | null;
      cookTime: number | null;
      status: Recipe['status'];
      isPublish: boolean;
      isRecommend: boolean;
      auditStatus: Recipe['auditStatus'];
      updatedAt: string;
    }
  | {
      rowKey: string;
      source: 'ingredient';
      id: string;
      title: string;
      subtitle: string | null;
      cover: string | null;
      typeLabel: IngredientContentLabel;
      categoryLabel: string;
      difficulty: null;
      cookTime: null;
      status: Ingredient['status'];
      isPublish: boolean;
      isRecommend: boolean;
      auditStatus: null;
      updatedAt: string;
    }
  | {
      rowKey: string;
      source: 'beverage';
      id: string;
      title: string;
      subtitle: string | null;
      cover: string | null;
      typeLabel: '酒水饮品';
      categoryLabel: string;
      difficulty: null;
      cookTime: null;
      status: Beverage['status'];
      isPublish: boolean;
      isRecommend: boolean;
      auditStatus: null;
      updatedAt: string;
    };

const tabs: { key: ContentKind; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'recipe', label: '菜谱' },
  { key: 'vegetable', label: '蔬菜' },
  { key: 'fruit', label: '水果' },
  { key: 'poultry', label: '生禽' },
  { key: 'aquatic', label: '水产' },
  { key: 'seasoning', label: '调料' },
  { key: 'beverage', label: '酒水饮品' }
];

const categoryNameByKind: Partial<Record<ContentKind, string>> = {
  vegetable: '蔬菜',
  fruit: '水果',
  poultry: '生禽',
  aquatic: '水产',
  seasoning: '调料'
};

const kindByCategoryName: Record<string, IngredientContentLabel> = {
  蔬菜: '蔬菜',
  水果: '水果',
  生禽: '生禽',
  水产: '水产',
  调料: '调料'
};

const auditLabels: Record<Recipe['auditStatus'], { label: string; tone: 'green' | 'orange' | 'red' | 'gray' }> = {
  DRAFT: { label: '草稿', tone: 'gray' },
  PENDING: { label: '待审核', tone: 'orange' },
  APPROVED: { label: '已通过', tone: 'green' },
  REJECTED: { label: '已驳回', tone: 'red' }
};

const toRecipeRow = (recipe: Recipe): ContentRow => ({
  rowKey: `recipe-${recipe.id}`,
  source: 'recipe',
  id: recipe.id,
  title: recipe.title,
  subtitle: recipe.subtitle ?? recipe.description,
  cover: recipe.cover,
  typeLabel: '菜谱',
  categoryLabel: recipe.category?.name ?? '-',
  difficulty: recipe.difficulty,
  cookTime: recipe.cookTime,
  status: recipe.status,
  isPublish: recipe.isPublish,
  isRecommend: recipe.isRecommend,
  auditStatus: recipe.auditStatus,
  updatedAt: recipe.updatedAt
});

const toIngredientRow = (ingredient: Ingredient): ContentRow => {
  const categoryLabel = ingredient.category?.name ?? '-';
  return {
    rowKey: `ingredient-${ingredient.id}`,
    source: 'ingredient',
    id: ingredient.id,
    title: ingredient.name,
    subtitle: ingredient.nutrition ?? ingredient.selectionTips,
    cover: ingredient.cover,
    typeLabel: kindByCategoryName[categoryLabel] ?? '食材',
    categoryLabel,
    difficulty: null,
    cookTime: null,
    status: ingredient.status,
    isPublish: ingredient.isPublish,
    isRecommend: ingredient.isRecommend,
    auditStatus: null,
    updatedAt: ingredient.updatedAt
  };
};

const toBeverageRow = (beverage: Beverage): ContentRow => ({
  rowKey: `beverage-${beverage.id}`,
  source: 'beverage',
  id: beverage.id,
  title: beverage.name,
  subtitle: beverage.description,
  cover: beverage.coverImage,
  typeLabel: '酒水饮品',
  categoryLabel: beverage.category?.name ?? '酒水饮品',
  difficulty: null,
  cookTime: null,
  status: beverage.status,
  isPublish: beverage.isPublish,
  isRecommend: beverage.isRecommend,
  auditStatus: null,
  updatedAt: beverage.updatedAt
});

export const ContentListPage = () => {
  const navigate = useNavigate();

  const [activeKind, setActiveKind] = useState<ContentKind>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<Exclude<ContentKind, 'all'>>('recipe');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'DISABLED'>('all');
  const [publishFilter, setPublishFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [recommendFilter, setRecommendFilter] = useState<'all' | 'recommended' | 'normal'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [beverages, setBeverages] = useState<Beverage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const categoryResult = await ensureDefaultIngredientCategories();
      const nextCategories = categoryResult.list;
      setCategories(nextCategories);

      const selectedCategoryName = categoryNameByKind[activeKind];
      const selectedCategoryId = selectedCategoryName
        ? nextCategories.find((item) => item.name === selectedCategoryName)?.id
        : undefined;

      const shouldLoadRecipes = activeKind === 'all' || activeKind === 'recipe';
      const shouldLoadBeverages = activeKind === 'all' || activeKind === 'beverage';
      const shouldLoadIngredients = activeKind === 'all' || (activeKind !== 'recipe' && activeKind !== 'beverage');
      const [recipeResult, ingredientResult, beverageResult] = await Promise.all([
        shouldLoadRecipes
          ? listRecipes({
              page: 1,
              pageSize: 100,
              q: q.trim() || undefined,
              status: statusFilter === 'all' ? undefined : statusFilter,
              isPublish: publishFilter === 'all' ? undefined : publishFilter === 'published',
              isRecommend: recommendFilter === 'all' ? undefined : recommendFilter === 'recommended'
            })
          : Promise.resolve({ list: [], page: 1, pageSize: 100, total: 0 }),
        shouldLoadIngredients
          ? listIngredients({
              page: 1,
              pageSize: 100,
              q: q.trim() || undefined,
              status: statusFilter === 'all' ? undefined : statusFilter,
              isPublish: publishFilter === 'all' ? undefined : publishFilter === 'published',
              isRecommend: recommendFilter === 'all' ? undefined : recommendFilter === 'recommended',
              categoryId: selectedCategoryId
            })
          : Promise.resolve({ list: [], page: 1, pageSize: 100, total: 0 }),
        shouldLoadBeverages
          ? listBeverages({
              page: 1,
              pageSize: 100,
              q: q.trim() || undefined,
              status: statusFilter === 'all' ? undefined : statusFilter,
              isPublish: publishFilter === 'all' ? undefined : publishFilter === 'published',
              isRecommend: recommendFilter === 'all' ? undefined : recommendFilter === 'recommended'
            })
          : Promise.resolve({ list: [], page: 1, pageSize: 100, total: 0 })
      ]);

      setRecipes(recipeResult.list);
      setIngredients(ingredientResult.list);
      setBeverages(beverageResult.list);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeKind, q, statusFilter, publishFilter, recommendFilter]);

  useEffect(() => {
    void refresh();
  }, [activeKind, q, statusFilter, publishFilter, recommendFilter]);

  const rows = useMemo(() => {
    const merged = [...recipes.map(toRecipeRow), ...ingredients.map(toIngredientRow), ...beverages.map(toBeverageRow)];
    return merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [beverages, ingredients, recipes]);

  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [page, pageSize, rows]);
  const canPrev = page > 1;
  const canNext = page * pageSize < rows.length;

  const handleTogglePublish = async (row: ContentRow) => {
    setError(null);
    try {
      if (row.source === 'recipe') {
        await setRecipePublish(row.id, !row.isPublish);
      } else if (row.source === 'ingredient') {
        await setIngredientPublish(row.id, !row.isPublish);
      } else {
        row.isPublish ? await disableBeverage(row.id) : await enableBeverage(row.id);
      }
      setNotice(row.isPublish ? '已下架' : '已上架');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleToggleRecommend = async (row: ContentRow) => {
    setError(null);
    try {
      if (row.source === 'recipe') {
        await setRecipeRecommend(row.id, !row.isRecommend);
      } else if (row.source === 'ingredient') {
        await setIngredientRecommend(row.id, !row.isRecommend);
      } else {
        setNotice('酒水推荐请在酒水饮品管理页编辑');
      }
      setNotice(row.isRecommend ? '已取消推荐' : '已推荐');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const getDetailPath = (row: ContentRow) => (row.source === 'recipe' ? `/content/recipes/${row.id}` : row.source === 'beverage' ? `/content/beverages/${row.id}/edit` : `/content/ingredients/${row.id}`);
  const getEditPath = (row: ContentRow) => (row.source === 'recipe' ? `/content/recipes/${row.id}/edit` : row.source === 'beverage' ? `/content/beverages/${row.id}/edit` : `/content/ingredients/${row.id}/edit`);

  const handleConfirmCreate = () => {
    setCreateOpen(false);
    if (createKind === 'recipe') {
      navigate('/content/recipes/create');
      return;
    }
    if (createKind === 'beverage') {
      navigate('/content/beverages/create');
      return;
    }
    navigate(`/content/ingredients/create?type=${createKind}`);
  };

  const columns: DataTableColumn<ContentRow>[] = [
    { key: 'cover', title: '封面', render: (item) => <ImagePreview src={item.cover} alt={item.title} /> },
    { key: 'id', title: 'ID', render: (item) => item.id },
    {
      key: 'title',
      title: '标题 / 名称',
      render: (item) => (
        <button type="button" className="block text-left" onClick={() => navigate(getDetailPath(item))}>
          <div className="font-medium text-[#2f2f2f]">{item.title}</div>
          <div className="mt-1 max-w-56 truncate text-xs text-[#8c8c8c]">{item.subtitle ?? '未填写描述'}</div>
        </button>
      )
    },
    { key: 'type', title: '内容类型', render: (item) => <StatusTag label={item.typeLabel} tone={item.source === 'recipe' ? 'orange' : 'gray'} /> },
    { key: 'category', title: '分类', render: (item) => item.categoryLabel },
    { key: 'difficulty', title: '难度', render: (item) => item.difficulty ?? '-' },
    { key: 'cookTime', title: '制作时间', render: (item) => (item.cookTime ? `${item.cookTime} 分钟` : '-') },
    { key: 'status', title: '状态', render: (item) => <StatusTag label={item.status === 'ACTIVE' ? '启用' : '禁用'} tone={item.status === 'ACTIVE' ? 'green' : 'gray'} /> },
    {
      key: 'audit',
      title: '审核',
      render: (item) =>
        item.auditStatus ? <StatusTag label={auditLabels[item.auditStatus].label} tone={auditLabels[item.auditStatus].tone} /> : <span className="text-[#8c8c8c]">-</span>
    },
    {
      key: 'recommend',
      title: '推荐',
      render: (item) => (
        <div className="space-y-1">
          <StatusTag label={item.isRecommend ? '已推荐' : '未推荐'} tone={item.isRecommend ? 'green' : 'gray'} />
          <div className="text-[11px] text-[#8c8c8c]">用于首页/推荐位优先展示</div>
        </div>
      )
    },
    { key: 'updatedAt', title: '更新时间', render: (item) => new Date(item.updatedAt).toLocaleString('zh-CN', { hour12: false }) },
    {
      key: 'actions',
      title: '操作',
      render: (item) => {
        return (
          <div className="flex min-w-[260px] flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => navigate(getEditPath(item))}>编辑</Button>
            <Button variant="ghost" onClick={() => void handleToggleRecommend(item)}>{item.isRecommend ? '取消推荐' : '推荐'}</Button>
            <Button variant="ghost" onClick={() => void handleTogglePublish(item)}>{item.isPublish ? '下架' : '上架'}</Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="内容列表"
        description="统一管理菜谱、蔬菜、水果、生禽、水产和调料内容，支持按内容类型、状态、发布和推荐筛选。"
        actions={
          <Button onClick={() => setCreateOpen(true)}>新增</Button>
        }
      />

      <div className="flex flex-wrap gap-3 rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveKind(tab.key)}
            className={[
              'rounded-full px-5 py-2 text-sm font-medium transition',
              activeKind === tab.key ? 'bg-zinc-900 text-white' : 'text-[#8c8c8c] hover:bg-[#f5f1ea] hover:text-[#2f2f2f]'
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}

      <FilterPanel>
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-4">
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="搜索标题 / 名称..." />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
          >
            <option value="all">全部状态</option>
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
          <select
            value={publishFilter}
            onChange={(event) => setPublishFilter(event.target.value as typeof publishFilter)}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
          >
            <option value="all">全部发布</option>
            <option value="published">已发布</option>
            <option value="hidden">未发布</option>
          </select>
          <select
            value={recommendFilter}
            onChange={(event) => setRecommendFilter(event.target.value as typeof recommendFilter)}
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
            onChange={(event) => {
              setPage(1);
              setPageSize(Number(event.target.value));
            }}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
          >
            {[10, 20, 50].map((value) => (
              <option key={value} value={value}>{value} / 页</option>
            ))}
          </select>
          <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button>
          <div className="text-sm text-zinc-600">第 {page} 页 / 共 {Math.max(1, Math.ceil(rows.length / pageSize))} 页</div>
          <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((value) => value + 1)}>下一页</Button>
        </div>
      </FilterPanel>

      <DataTable
        columns={columns}
        data={pageRows}
        loading={loading}
        error={error}
        rowKey={(item) => item.rowKey}
        emptyTitle="暂无内容"
        emptyDescription="切换内容类型或新增菜谱、食材后再查看。"
      />

      <Modal title="选择新增内容类型" open={createOpen} onClose={() => setCreateOpen(false)}>
        <div className="space-y-5">
          <div className="text-sm text-[#8c8c8c]">请选择要新增的内容类型，确认后进入对应新增页面。</div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {tabs.filter((tab) => tab.key !== 'all').map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCreateKind(tab.key as Exclude<ContentKind, 'all'>)}
                className={[
                  'rounded-2xl border px-4 py-4 text-left text-sm font-medium transition',
                  createKind === tab.key
                    ? 'border-[#7A8B6F] bg-[#f5f1ea] text-[#2f2f2f]'
                    : 'border-[#e9e2d6] bg-white text-[#8c8c8c] hover:bg-[#f5f1ea]'
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleConfirmCreate}>确定</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
