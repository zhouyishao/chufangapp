import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createRecipe, getRecipe, listCategories, submitRecipeAudit, updateRecipe } from '../api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { MediaUploader, type MediaItem } from '../components/MediaUploader';
import { StatusTag } from '../components/StatusTag';
import { UploadImage } from '../components/UploadImage';
import type { IngredientCategory, Recipe } from '../types';

type RecipeFormMode = 'create' | 'edit';
type IngredientDraft = { id: string; name: string; amount: string; unit: string; type: string; note: string; sortIndex: number };
type StepDraft = { id: string; description: string; image: string | null; video: string | null; duration: number | null; sortIndex: number };

type Draft = {
  title: string;
  subtitle: string | null;
  coverUrl: string | null;
  images: string[];
  video: string | null;
  description: string | null;
  categoryId: number | null;
  cookTime: number | null;
  servings: number | null;
  calories: number | null;
  difficulty: string | null;
  taste: string | null;
  scene: string | null;
  visibility: string | null;
  tips: string | null;
  sort: number;
  status: Recipe['status'];
  auditStatus: Recipe['auditStatus'];
  isDraft: boolean;
  isPublish: boolean;
  isRecommend: boolean;
  ingredients: IngredientDraft[];
  steps: StepDraft[];
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const createIngredient = (sortIndex: number): IngredientDraft => ({ id: createId(), name: '', amount: '', unit: '', type: '主料', note: '', sortIndex });
const createStep = (sortIndex: number): StepDraft => ({ id: createId(), description: '', image: null, video: null, duration: null, sortIndex });

const emptyDraft: Draft = {
  title: '',
  subtitle: null,
  coverUrl: null,
  images: [],
  video: null,
  description: null,
  categoryId: null,
  cookTime: null,
  servings: null,
  calories: null,
  difficulty: null,
  taste: null,
  scene: null,
  visibility: 'PUBLIC',
  tips: null,
  sort: 0,
  status: 'ACTIVE',
  auditStatus: 'DRAFT',
  isDraft: true,
  isPublish: false,
  isRecommend: false,
  ingredients: [createIngredient(1)],
  steps: [createStep(1)]
};

const compactImages = (value: Recipe['images']) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : []);

const recipeToDraft = (recipe: Recipe): Draft => ({
  title: recipe.title,
  subtitle: recipe.subtitle,
  coverUrl: recipe.cover,
  images: compactImages(recipe.images),
  video: recipe.video ?? null,
  description: recipe.description,
  categoryId: recipe.categoryId,
  cookTime: recipe.cookTime,
  servings: recipe.servings,
  calories: recipe.calories,
  difficulty: recipe.difficulty,
  taste: recipe.taste,
  scene: recipe.scene,
  visibility: recipe.visibility ?? 'PUBLIC',
  tips: recipe.tips,
  sort: recipe.sort,
  status: recipe.status,
  auditStatus: recipe.auditStatus,
  isDraft: recipe.isDraft,
  isPublish: recipe.isPublish,
  isRecommend: recipe.isRecommend,
  ingredients: (recipe.ingredients?.length ? recipe.ingredients : [{ id: 0, sortIndex: 1, ingredientId: null, name: '', amount: null }]).map((item, index) => ({
    id: String(item.id ?? createId()),
    name: item.name,
    amount: item.amount ?? '',
    unit: item.unit ?? '',
    type: item.type ?? '主料',
    note: item.note ?? '',
    sortIndex: index + 1
  })),
  steps: (recipe.steps?.length ? recipe.steps : [{ id: 0, sortIndex: 1, title: null, description: '', image: null }]).map((step, index) => ({
    id: String(step.id ?? createId()),
    description: step.description,
    image: step.image,
    video: step.video ?? null,
    duration: step.duration ?? null,
    sortIndex: index + 1
  }))
});

const toPayload = (draft: Draft) => ({
  title: draft.title.trim(),
  subtitle: draft.subtitle?.trim() ? draft.subtitle.trim() : null,
  coverUrl: draft.coverUrl?.trim() ? draft.coverUrl.trim() : null,
  images: draft.images.filter(Boolean),
  video: draft.video?.trim() ? draft.video.trim() : null,
  description: draft.description?.trim() ? draft.description.trim() : null,
  categoryId: draft.categoryId,
  cookTime: draft.cookTime,
  servings: draft.servings,
  calories: draft.calories,
  difficulty: draft.difficulty?.trim() ? draft.difficulty.trim() : null,
  taste: draft.taste?.trim() ? draft.taste.trim() : null,
  scene: draft.scene?.trim() ? draft.scene.trim() : null,
  visibility: draft.visibility,
  tips: draft.tips?.trim() ? draft.tips.trim() : null,
  sort: draft.sort,
  status: draft.status,
  auditStatus: draft.auditStatus,
  isDraft: draft.isDraft,
  isPublish: draft.isPublish,
  isRecommend: draft.isRecommend,
  steps: draft.steps
    .filter((step) => step.description.trim())
    .map((step, index) => ({
      sortIndex: index + 1,
      title: null,
      description: step.description.trim(),
      image: step.image,
      video: step.video,
      duration: step.duration
    })),
  ingredients: draft.ingredients
    .filter((item) => item.name.trim())
    .map((item, index) => ({
      sortIndex: index + 1,
      ingredientId: null,
      name: item.name.trim(),
      amount: item.amount.trim() || null,
      unit: item.unit.trim() || null,
      type: item.type.trim() || null,
      note: item.note.trim() || null
    }))
});

type Props = { mode: RecipeFormMode };

const difficultyOptions = ['简单', '中等', '困难'];
const tasteOptions = ['清淡', '香辣', '酸甜', '咸鲜', '鲜香'];
const sceneOptions = ['炒', '煮', '蒸', '炖', '烤', '凉拌'];
const visibilityOptions = [
  { label: '公开', value: 'PUBLIC' },
  { label: '私有', value: 'PRIVATE' },
  { label: '仅自己可见', value: 'ONLY_ME' }
];

const auditLabels: Record<Recipe['auditStatus'], { label: string; tone: 'green' | 'orange' | 'red' | 'gray' }> = {
  DRAFT: { label: '草稿', tone: 'gray' },
  PENDING: { label: '待审核', tone: 'orange' },
  APPROVED: { label: '审核通过', tone: 'green' },
  REJECTED: { label: '审核驳回', tone: 'red' }
};

const toMediaItems = (urls: string[], type: MediaItem['type']): MediaItem[] => urls.map((url) => ({ url, type }));
const singleMedia = (url: string | null, type: MediaItem['type']): MediaItem[] => (url ? [{ url, type }] : []);

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

  const validationError = useMemo(() => {
    if (!draft.title.trim()) return '菜谱标题必填';
    if (draft.categoryId === null) return '分类必选';
    if (!draft.difficulty?.trim()) return '难度必选';
    if (draft.ingredients.filter((item) => item.name.trim()).length < 1) return '至少添加 1 个食材';
    if (draft.steps.filter((step) => step.description.trim()).length < 1) return '至少添加 1 个步骤';
    if (draft.cookTime !== null && !Number.isFinite(draft.cookTime)) return '烹饪时间必须是数字';
    if (draft.servings !== null && !Number.isFinite(draft.servings)) return '份量必须是数字';
    if (draft.calories !== null && !Number.isFinite(draft.calories)) return '热量必须是数字';
    if (!Number.isFinite(draft.sort)) return '排序必须是数字';
    return null;
  }, [draft]);

  const canSave = !validationError && !saving;

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

  const updateIngredient = (index: number, patch: Partial<IngredientDraft>) => {
    setDraft((current) => ({
      ...current,
      ingredients: current.ingredients.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item))
    }));
  };

  const updateStep = (index: number, patch: Partial<StepDraft>) => {
    setDraft((current) => ({ ...current, steps: current.steps.map((step, currentIndex) => (currentIndex === index ? { ...step, ...patch } : step)) }));
  };

  const moveRow = <T extends { sortIndex: number }>(items: T[], index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next.map((item, currentIndex) => ({ ...item, sortIndex: currentIndex + 1 }));
  };

  const saveBase = async (nextDraft: Draft) => {
    const payload = toPayload(nextDraft);
    return mode === 'edit' ? updateRecipe(id, payload) : createRecipe(payload);
  };

  const handleSave = async (intent: 'draft' | 'submit') => {
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const nextDraft: Draft =
        intent === 'submit'
          ? { ...draft, auditStatus: 'DRAFT', isDraft: true, isPublish: false }
          : { ...draft, auditStatus: 'DRAFT', isDraft: true, isPublish: false };
      const saved = await saveBase(nextDraft);
      if (intent === 'submit') await submitRecipeAudit(saved.id);
      setNotice(intent === 'submit' ? '已提交审核' : '草稿已保存');
      window.setTimeout(() => navigate('/content/recipes', { replace: true }), 350);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const audit = auditLabels[draft.auditStatus];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm text-[#8c8c8c]">内容管理 / 菜谱管理</div>
          <h1 className="mt-2 text-3xl font-semibold text-[#2f2f2f]">{mode === 'edit' ? '编辑菜谱' : '新增菜谱'}</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">结构化维护菜谱基础信息、成品媒体、食材清单和步骤，审核状态只能通过流程流转。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/content/recipes')}>返回列表</Button>
          <Button variant="ghost" disabled={saving} onClick={() => void handleSave('draft')}>{saving ? '保存中...' : '保存草稿'}</Button>
          <Button disabled={saving} onClick={() => void handleSave('submit')}>{saving ? '提交中...' : '提交审核'}</Button>
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
        {loading ? (
          <div className="text-sm text-[#8c8c8c]">加载中...</div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-[#8c8c8c]">审核状态</span>
              <StatusTag label={audit.label} tone={audit.tone} />
              <span className="text-xs text-[#8c8c8c]">此状态不可在表单手动修改，请通过“提交审核 / 审核中心 / 发布”流转。</span>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <label className="lg:col-span-2">
                <div className="mb-1 text-xs text-[#8c8c8c]">标题 *</div>
                <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </label>
              <label className="lg:col-span-2">
                <div className="mb-1 text-xs text-[#8c8c8c]">副标题</div>
                <Input value={draft.subtitle ?? ''} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} />
              </label>
              <div className="lg:col-span-2">
                <UploadImage label="主封面图片上传" value={draft.coverUrl} helperText="列表页和 C 端详情页优先展示主封面。" onChange={(coverUrl) => setDraft({ ...draft, coverUrl })} />
              </div>
              <div className="lg:col-span-2">
                <MediaUploader
                  label="成品图上传"
                  value={toMediaItems(draft.images, 'image')}
                  accept="image"
                  multiple
                  primaryUrl={draft.coverUrl}
                  onSetPrimary={(coverUrl) => setDraft({ ...draft, coverUrl })}
                  onChange={(items) => setDraft({ ...draft, images: items.map((item) => item.url) })}
                />
              </div>
              <div className="lg:col-span-2">
                <MediaUploader label="成品视频上传" value={singleMedia(draft.video, 'video')} accept="video" onChange={(items) => setDraft({ ...draft, video: items[0]?.url ?? null })} />
              </div>
              <label>
                <div className="mb-1 text-xs text-[#8c8c8c]">分类 *</div>
                <select value={draft.categoryId ?? ''} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value ? Number(event.target.value) : null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                  <option value="">请选择分类</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label>
                <div className="mb-1 text-xs text-[#8c8c8c]">难度 *</div>
                <select value={draft.difficulty ?? ''} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value || null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                  <option value="">请选择难度</option>
                  {difficultyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <div className="mb-1 text-xs text-[#8c8c8c]">口味</div>
                <select value={draft.taste ?? ''} onChange={(event) => setDraft({ ...draft, taste: event.target.value || null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                  <option value="">请选择口味</option>
                  {tasteOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <div className="mb-1 text-xs text-[#8c8c8c]">烹饪方式</div>
                <select value={draft.scene ?? ''} onChange={(event) => setDraft({ ...draft, scene: event.target.value || null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                  <option value="">请选择方式</option>
                  {sceneOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <div className="mb-1 text-xs text-[#8c8c8c]">可见范围</div>
                <select value={draft.visibility ?? 'PUBLIC'} onChange={(event) => setDraft({ ...draft, visibility: event.target.value })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                  {visibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <Input type="number" placeholder="烹饪时间（分钟）" value={draft.cookTime ?? ''} onChange={(event) => setDraft({ ...draft, cookTime: event.target.value === '' ? null : Number(event.target.value) })} />
              <Input type="number" placeholder="份量" value={draft.servings ?? ''} onChange={(event) => setDraft({ ...draft, servings: event.target.value === '' ? null : Number(event.target.value) })} />
              <Input type="number" placeholder="热量 kcal" value={draft.calories ?? ''} onChange={(event) => setDraft({ ...draft, calories: event.target.value === '' ? null : Number(event.target.value) })} />
              <Input type="number" placeholder="排序" value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: Number(event.target.value) })} />
              <label className="lg:col-span-2">
                <div className="mb-1 text-xs text-[#8c8c8c]">描述</div>
                <textarea value={draft.description ?? ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" />
              </label>
              <label className="lg:col-span-2">
                <div className="mb-1 text-xs text-[#8c8c8c]">小贴士</div>
                <textarea value={draft.tips ?? ''} onChange={(event) => setDraft({ ...draft, tips: event.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" />
              </label>
            </div>

            <div className="rounded-2xl border border-[#e9e2d6] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#2f2f2f]">食材清单</h2>
                <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, ingredients: [...draft.ingredients, createIngredient(draft.ingredients.length + 1)] })}>添加食材</Button>
              </div>
              <div className="space-y-3">
                {draft.ingredients.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 gap-2 rounded-2xl bg-[#f5f1ea] p-3 lg:grid-cols-[1.5fr_1fr_0.8fr_0.9fr_1.5fr_auto]">
                    <Input placeholder="食材名称" value={item.name} onChange={(event) => updateIngredient(index, { name: event.target.value })} />
                    <Input placeholder="用量" value={item.amount} onChange={(event) => updateIngredient(index, { amount: event.target.value })} />
                    <Input placeholder="单位" value={item.unit} onChange={(event) => updateIngredient(index, { unit: event.target.value })} />
                    <select value={item.type} onChange={(event) => updateIngredient(index, { type: event.target.value })} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                      {['主料', '辅料', '调料'].map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <Input placeholder="备注" value={item.note} onChange={(event) => updateIngredient(index, { note: event.target.value })} />
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, ingredients: moveRow(draft.ingredients, index, -1) })}>上移</Button>
                      <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, ingredients: moveRow(draft.ingredients, index, 1) })}>下移</Button>
                      <Button type="button" variant="danger" onClick={() => setDraft({ ...draft, ingredients: draft.ingredients.filter((_, currentIndex) => currentIndex !== index).map((next, nextIndex) => ({ ...next, sortIndex: nextIndex + 1 })) })}>删除</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e9e2d6] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#2f2f2f]">步骤编辑器</h2>
                <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, steps: [...draft.steps, createStep(draft.steps.length + 1)] })}>添加步骤</Button>
              </div>
              <div className="space-y-4">
                {draft.steps.map((step, index) => (
                  <div key={step.id} className="rounded-2xl bg-[#f5f1ea] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <strong className="text-[#2f2f2f]">步骤 {index + 1}</strong>
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, steps: moveRow(draft.steps, index, -1) })}>上移</Button>
                        <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, steps: moveRow(draft.steps, index, 1) })}>下移</Button>
                        <Button type="button" variant="danger" onClick={() => setDraft({ ...draft, steps: draft.steps.filter((_, currentIndex) => currentIndex !== index).map((next, nextIndex) => ({ ...next, sortIndex: nextIndex + 1 })) })}>删除</Button>
                      </div>
                    </div>
                    <textarea value={step.description} onChange={(event) => updateStep(index, { description: event.target.value })} className="mb-3 min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" placeholder="步骤说明" />
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                      <MediaUploader label="步骤图片" value={singleMedia(step.image, 'image')} accept="image" onChange={(items) => updateStep(index, { image: items[0]?.url ?? null })} />
                      <MediaUploader label="步骤视频" value={singleMedia(step.video, 'video')} accept="video" onChange={(items) => updateStep(index, { video: items[0]?.url ?? null })} />
                      <label>
                        <div className="mb-1 text-xs text-[#8c8c8c]">计时/时长（秒）</div>
                        <Input type="number" value={step.duration ?? ''} onChange={(event) => updateStep(index, { duration: event.target.value === '' ? null : Number(event.target.value) })} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
