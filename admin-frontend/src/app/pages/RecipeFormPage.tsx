import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createRecipe, getRecipe, listCategories, updateRecipe } from '../api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UploadImage } from '../components/UploadImage';
import type { IngredientCategory, Recipe } from '../types';

type RecipeFormMode = 'create' | 'edit';

type Draft = {
  title: string;
  subtitle: string | null;
  coverUrl: string | null;
  description: string | null;
  categoryId: number | null;
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

const splitLines = (value: string) =>
  value
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);

const recipeToDraft = (recipe: Recipe): Draft => ({
  title: recipe.title,
  subtitle: recipe.subtitle,
  coverUrl: recipe.cover,
  description: recipe.description,
  categoryId: recipe.categoryId,
  cookTime: recipe.cookTime,
  servings: recipe.servings,
  difficulty: recipe.difficulty,
  tips: recipe.tips,
  sort: recipe.sort,
  status: recipe.status,
  auditStatus: recipe.auditStatus,
  isDraft: recipe.isDraft,
  isPublish: recipe.isPublish,
  isRecommend: recipe.isRecommend,
  ingredientsText: (recipe.ingredients ?? []).map((item) => `${item.name}${item.amount ? ` ${item.amount}` : ''}`).join('\n'),
  stepsText: (recipe.steps ?? []).map((step) => step.description).join('\n')
});

const toPayload = (draft: Draft) => ({
  title: draft.title.trim(),
  subtitle: draft.subtitle?.trim() ? draft.subtitle.trim() : null,
  coverUrl: draft.coverUrl?.trim() ? draft.coverUrl.trim() : null,
  description: draft.description?.trim() ? draft.description.trim() : null,
  categoryId: draft.categoryId,
  cookTime: draft.cookTime,
  servings: draft.servings,
  calories: null,
  difficulty: draft.difficulty?.trim() ? draft.difficulty.trim() : null,
  taste: null,
  scene: null,
  tips: draft.tips?.trim() ? draft.tips.trim() : null,
  sort: draft.sort,
  status: draft.status,
  auditStatus: draft.auditStatus,
  isDraft: draft.isDraft,
  isPublish: draft.isPublish,
  isRecommend: draft.isRecommend,
  steps: splitLines(draft.stepsText).map((description, index) => ({
    sortIndex: index + 1,
    title: null,
    description,
    image: null
  })),
  ingredients: splitLines(draft.ingredientsText).map((line, index) => ({
    sortIndex: index + 1,
    ingredientId: null,
    name: line,
    amount: null
  }))
});

type Props = {
  mode: RecipeFormMode;
};

const difficultyOptions = ['简单', '中等', '困难'];

export const RecipeFormPage = ({ mode }: Props) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = Number.parseInt(params.id ?? '', 10);

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSave = useMemo(
    () => draft.title.trim().length > 0 && draft.categoryId !== null && Boolean(draft.difficulty?.trim()) && !saving,
    [draft.categoryId, draft.difficulty, draft.title, saving]
  );

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [categoryResult, recipe] = await Promise.all([
          listCategories({ page: 1, pageSize: 100, type: 'RECIPE' }),
          mode === 'edit' && Number.isFinite(id) ? getRecipe(id) : Promise.resolve(null)
        ]);
        if (!alive) return;
        setCategories(categoryResult.list);
        if (recipe) setDraft(recipeToDraft(recipe));
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [id, mode]);

  const handleSave = async (intent: 'draft' | 'submit' = 'draft') => {
    if (!canSave) return;
    if (draft.cookTime !== null && !Number.isFinite(draft.cookTime)) {
      setError('制作时间必须是数字');
      return;
    }
    if (!Number.isFinite(draft.sort)) {
      setError('排序必须是数字');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const nextDraft = {
        ...draft,
        auditStatus: intent === 'submit' ? ('PENDING' as const) : ('DRAFT' as const),
        isDraft: intent !== 'submit'
      };
      const payload = toPayload(nextDraft);
      await (mode === 'edit' ? updateRecipe(id, payload) : createRecipe(payload));
      setNotice(intent === 'submit' ? '已提交审核' : '草稿已保存');
      window.setTimeout(() => navigate('/content/recipes', { replace: true }), 350);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm text-[#8c8c8c]">内容管理 / 菜谱管理</div>
          <h1 className="mt-2 text-3xl font-semibold text-[#2f2f2f]">{mode === 'edit' ? '编辑菜谱' : '新增菜谱'}</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">维护菜谱基础信息、食材清单、步骤、发布状态和审核状态。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/content/recipes')}>
            返回列表
          </Button>
          <Button variant="ghost" disabled={!canSave} onClick={() => void handleSave('draft')}>
            {saving ? '保存中...' : '保存草稿'}
          </Button>
          <Button disabled={!canSave} onClick={() => void handleSave('submit')}>
            {saving ? '提交中...' : '提交审核'}
          </Button>
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
        {loading ? (
          <div className="text-sm text-[#8c8c8c]">加载中...</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <div className="mb-1 text-xs text-[#8c8c8c]">标题</div>
              <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </div>
            <div className="lg:col-span-2">
              <div className="mb-1 text-xs text-[#8c8c8c]">副标题</div>
              <Input value={draft.subtitle ?? ''} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} />
            </div>
            <div className="lg:col-span-2">
              <UploadImage
                label="封面图片上传"
                value={draft.coverUrl}
                helperText="菜谱视频上传后续单独接入；当前封面通过 POST /api/admin/upload/image 上传后只保存 coverUrl。"
                onChange={(coverUrl) => setDraft({ ...draft, coverUrl })}
              />
              {!draft.coverUrl ? <div className="mt-2 text-xs text-[#8c8c8c]">建议上传封面图片，列表和 App 详情页会优先展示该图。</div> : null}
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">分类</div>
              <select
                value={draft.categoryId ?? ''}
                onChange={(event) => setDraft({ ...draft, categoryId: event.target.value ? Number(event.target.value) : null })}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="">未分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">难度</div>
              <select
                value={draft.difficulty ?? ''}
                onChange={(event) => setDraft({ ...draft, difficulty: event.target.value || null })}
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
              <div className="mb-1 text-xs text-[#8c8c8c]">烹饪时间（分钟）</div>
              <Input
                type="number"
                value={draft.cookTime ?? ''}
                onChange={(event) => setDraft({ ...draft, cookTime: event.target.value === '' ? null : Number(event.target.value) })}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">份量</div>
              <Input
                type="number"
                value={draft.servings ?? ''}
                onChange={(event) => setDraft({ ...draft, servings: event.target.value === '' ? null : Number(event.target.value) })}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">状态</div>
              <select
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft['status'] })}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">禁用</option>
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">审核状态</div>
              <select
                value={draft.auditStatus}
                onChange={(event) => setDraft({ ...draft, auditStatus: event.target.value as Draft['auditStatus'] })}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="DRAFT">草稿</option>
                <option value="PENDING">待审核</option>
                <option value="APPROVED">已通过</option>
                <option value="REJECTED">已驳回</option>
              </select>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                ['已发布', 'isPublish'],
                ['推荐', 'isRecommend'],
                ['草稿', 'isDraft']
              ].map(([label, key]) => (
                <label key={key} className="flex items-center gap-2 rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm text-[#2f2f2f]">
                  <input
                    type="checkbox"
                    checked={Boolean(draft[key as 'isPublish' | 'isRecommend' | 'isDraft'])}
                    onChange={(event) => setDraft({ ...draft, [key]: event.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="lg:col-span-2">
              <div className="mb-1 text-xs text-[#8c8c8c]">简介</div>
              <textarea
                value={draft.description ?? ''}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                className="min-h-28 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">食材清单（每行一条）</div>
              <textarea
                value={draft.ingredientsText}
                onChange={(event) => setDraft({ ...draft, ingredientsText: event.target.value })}
                className="min-h-56 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                placeholder="番茄 3个"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">步骤（每行一步）</div>
              <textarea
                value={draft.stepsText}
                onChange={(event) => setDraft({ ...draft, stepsText: event.target.value })}
                className="min-h-56 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                placeholder="洗净食材..."
              />
            </div>
            <div className="lg:col-span-2">
              <div className="mb-1 text-xs text-[#8c8c8c]">Tips</div>
              <textarea
                value={draft.tips ?? ''}
                onChange={(event) => setDraft({ ...draft, tips: event.target.value })}
                className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
