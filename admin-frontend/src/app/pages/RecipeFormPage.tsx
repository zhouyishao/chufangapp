import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createRecipe, getRecipe, listCategories, resolveAssetUrl, submitRecipeAudit, updateRecipe, uploadMedia } from '../api';
import { Button } from '../components/Button';
import { ImageEditorUploader } from '../components/ImageEditorUploader';
import { Input } from '../components/Input';
import { StatusTag } from '../components/StatusTag';
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
  categoryId: string | null;
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

export const RecipeFormPage = ({ mode }: Props) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ?? '';

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
          mode === 'edit' && id ? getRecipe(id) : Promise.resolve(null)
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
    return mode === 'edit' && id ? updateRecipe(id, payload) : createRecipe(payload);
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

      <div>
        {loading ? (
          <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6 text-sm text-[#8c8c8c]">加载中...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
              <NumberedSection number={1} title="基础信息">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="菜谱名称 *"><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="请输入菜谱名称" /></Field>
                  <Field label="菜谱副标题"><Input value={draft.subtitle ?? ''} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} placeholder="请输入副标题" /></Field>
                  <Field label="菜谱分类 *">
                    <select value={draft.categoryId ?? ''} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value ? event.target.value : null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                      <option value="">请选择分类</option>
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </Field>
                  <Field label="难度 *">
                    <select value={draft.difficulty ?? ''} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value || null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                      <option value="">请选择难度</option>
                      {difficultyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="烹饪时长"><Input type="number" placeholder="如：15" value={draft.cookTime ?? ''} onChange={(event) => setDraft({ ...draft, cookTime: event.target.value === '' ? null : Number(event.target.value) })} /></Field>
                  <Field label="热量 kcal"><Input type="number" placeholder="如：320" value={draft.calories ?? ''} onChange={(event) => setDraft({ ...draft, calories: event.target.value === '' ? null : Number(event.target.value) })} /></Field>
                  <Field label="份量 / 几人食"><Input type="number" placeholder="如：2" value={draft.servings ?? ''} onChange={(event) => setDraft({ ...draft, servings: event.target.value === '' ? null : Number(event.target.value) })} /></Field>
                  <Field label="发布状态">
                    <div className="flex h-10 items-center gap-4 text-sm text-[#2f2f2f]">
                      <label className="flex items-center gap-2"><input type="radio" checked={draft.isDraft} onChange={() => setDraft({ ...draft, isDraft: true, isPublish: false })} />草稿</label>
                      <label className="flex items-center gap-2"><input type="radio" checked={draft.isPublish} onChange={() => setDraft({ ...draft, isDraft: false, isPublish: true })} />发布</label>
                    </div>
                  </Field>
                  <Field label="是否推荐"><label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={draft.isRecommend} onChange={(event) => setDraft({ ...draft, isRecommend: event.target.checked })} />推荐到首页或频道位</label></Field>
                  <Field label="审核状态"><div className="flex h-10 items-center gap-3"><StatusTag label={audit.label} tone={audit.tone} /><span className="text-xs text-[#8c8c8c]">通过流程流转</span></div></Field>
                  <Field label="菜谱简介 / 描述 *" className="md:col-span-2">
                    <textarea value={draft.description ?? ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" placeholder="简要介绍这道菜的特色、口感、适合人群或食用场景..." />
                  </Field>
                </div>
              </NumberedSection>

              <NumberedSection number={2} title="封面与图文素材">
                <PrototypeMediaSection
                  coverUrl={draft.coverUrl}
                  images={draft.images}
                  video={draft.video}
                  tags={[draft.taste, draft.scene].filter(Boolean).join('、')}
                  onCoverChange={(coverUrl) => setDraft({ ...draft, coverUrl })}
                  onImagesChange={(images) => setDraft({ ...draft, images })}
                  onVideoChange={(video) => setDraft({ ...draft, video })}
                  onTagsChange={(tags) => setDraft({ ...draft, taste: tags })}
                />
              </NumberedSection>

              <NumberedSection number={3} title="食材配料">
                <IngredientRows
                  items={draft.ingredients}
                  kind="ingredient"
                  updateIngredient={updateIngredient}
                  remove={(index) => setDraft({ ...draft, ingredients: draft.ingredients.filter((_, currentIndex) => currentIndex !== index).map((next, nextIndex) => ({ ...next, sortIndex: nextIndex + 1 })) })}
                />
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, ingredients: [...draft.ingredients, createIngredient(draft.ingredients.length + 1)] })}>＋ 新增食材</Button>
                  <Button type="button" variant="ghost" onClick={() => setNotice('批量导入入口已预留')}>批量导入</Button>
                </div>
              </NumberedSection>

              <NumberedSection number={4} title="调料配比（可选）">
                <IngredientRows
                  items={draft.ingredients}
                  kind="seasoning"
                  updateIngredient={updateIngredient}
                  remove={(index) => setDraft({ ...draft, ingredients: draft.ingredients.filter((_, currentIndex) => currentIndex !== index).map((next, nextIndex) => ({ ...next, sortIndex: nextIndex + 1 })) })}
                />
                <div className="mt-4">
                  <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, ingredients: [...draft.ingredients, { ...createIngredient(draft.ingredients.length + 1), type: '调料' }] })}>＋ 新增调料</Button>
                </div>
              </NumberedSection>

              <NumberedSection number={5} title="制作步骤" className="2xl:col-span-2">
                <div className="space-y-3">
                  {draft.steps.map((step, index) => (
                    <div key={step.id} className="grid grid-cols-[32px_1fr_116px_52px] items-center gap-3 rounded-2xl bg-[#f5f1ea] p-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-semibold text-[#2f2f2f]">{index + 1}</span>
                      <textarea value={step.description} onChange={(event) => updateStep(index, { description: event.target.value })} className="min-h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" placeholder="请输入制作步骤" />
                      <StepImageUpload value={step.image} onChange={(image) => updateStep(index, { image })} />
                      <Button type="button" variant="danger" onClick={() => setDraft({ ...draft, steps: draft.steps.filter((_, currentIndex) => currentIndex !== index).map((next, nextIndex) => ({ ...next, sortIndex: nextIndex + 1 })) })}>删除</Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Button type="button" variant="ghost" onClick={() => setDraft({ ...draft, steps: [...draft.steps, createStep(draft.steps.length + 1)] })}>＋ 新增步骤</Button>
                  <span className="text-xs text-[#8c8c8c]">拖拽排序后续接入，当前可通过删除和新增调整内容。</span>
                </div>
              </NumberedSection>

              <NumberedSection number={6} title="关联信息" className="2xl:col-span-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field label="关联食材（可多选）"><Input value={draft.ingredients.filter((item) => item.name.trim()).map((item) => item.name).join('、')} readOnly placeholder="自动来自食材配料" /></Field>
                  <Field label="适用场景"><select value={draft.scene ?? ''} onChange={(event) => setDraft({ ...draft, scene: event.target.value || null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="">请选择</option>{sceneOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></Field>
                  <Field label="关键词"><Input value={[draft.title, draft.taste, draft.scene].filter(Boolean).join('、')} onChange={(event) => setDraft({ ...draft, taste: event.target.value })} placeholder="用逗号分隔" /></Field>
                  <Field label="来源 / 作者"><Input placeholder="如：原创 / 家庭作者 / 网络" /></Field>
                  <Field label="审核备注" className="md:col-span-2"><Input placeholder="给审核人员看的备注信息" /></Field>
                  <Field label="小贴士" className="md:col-span-3"><textarea value={draft.tips ?? ''} onChange={(event) => setDraft({ ...draft, tips: event.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></Field>
                </div>
              </NumberedSection>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
              <RecipePreview draft={draft} categoryName={categories.find((category) => category.id === draft.categoryId)?.name} />
              <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
                <h2 className="text-lg font-semibold text-[#2f2f2f]">发布提示</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[#6f6a61]">
                  <li>• 发布后可被首页推荐、专题和频道引用</li>
                  <li>• 请确保封面清晰、步骤完整</li>
                  <li>• 分类与标签将影响搜索与推荐</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
};

const NumberedSection = ({ number, title, children, className = '' }: { number: number; title: string; children: ReactNode; className?: string }) => (
  <section className={`rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5 shadow-sm ${className}`}>
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6f8b62] text-sm font-semibold text-white">{number}</span>
      <h2 className="text-lg font-semibold text-[#2f2f2f]">{title}</h2>
    </div>
    {children}
  </section>
);

const Field = ({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) => (
  <label className={`block ${className}`}>
    <div className="mb-1.5 text-xs font-medium text-[#6f6a61]">{label}</div>
    {children}
  </label>
);

const PrototypeMediaSection = ({
  coverUrl,
  images,
  video,
  tags,
  onCoverChange,
  onImagesChange,
  onVideoChange,
  onTagsChange
}: {
  coverUrl: string | null;
  images: string[];
  video: string | null;
  tags: string;
  onCoverChange: (url: string | null) => void;
  onImagesChange: (urls: string[]) => void;
  onVideoChange: (url: string | null) => void;
  onTagsChange: (tags: string) => void;
}) => {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {notice ? <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{notice}</div> : null}
      <ImageEditorUploader coverUrl={coverUrl} images={images} max={8} onCoverChange={onCoverChange} onImagesChange={onImagesChange} />

      <div>
        <div className="mb-2 text-xs font-medium text-[#6f6a61]">视频链接 / 视频上传（可选）</div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Input value={video ?? ''} onChange={(event) => onVideoChange(event.target.value || null)} placeholder="粘贴视频链接或上传视频文件" />
          <PrototypeVideoButton onUploaded={onVideoChange} onNotice={setNotice} />
        </div>
      </div>

      <Field label="标签（最多选择5个）">
        <Input value={tags} onChange={(event) => onTagsChange(event.target.value)} placeholder="请选择或搜索标签" />
      </Field>
    </div>
  );
};

const PrototypeVideoButton = ({ onUploaded, onNotice }: { onUploaded: (url: string | null) => void; onNotice: (message: string | null) => void }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    onNotice(null);
    try {
      const uploaded = await uploadMedia(file);
      if (uploaded.type !== 'video') throw new Error('请上传视频文件');
      onUploaded(uploaded.url);
      onNotice('视频已上传');
    } catch (err) {
      onNotice(err instanceof Error ? err.message : '视频上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(event) => void handleFile(event)} />
      <Button type="button" variant="ghost" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? '上传中...' : '上传视频'}</Button>
    </>
  );
};

const StepImageUpload = ({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadMedia(file);
      if (uploaded.type !== 'image') throw new Error('请上传图片文件');
      onChange(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = resolveAssetUrl(value);

  return (
    <div className="grid grid-cols-[32px_56px] items-center gap-2">
      <span className="text-sm font-medium text-[#6f6a61]">配图</span>
      <div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void handleFile(event)} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#d8cebe] bg-white text-lg text-[#6f8b62] transition hover:border-[#6f8b62]"
          title={previewUrl ? '重新上传配图' : '上传配图'}
        >
          {previewUrl ? <img src={previewUrl} alt="步骤配图" className="absolute inset-0 h-full w-full object-cover" /> : null}
          <span className={previewUrl ? 'relative rounded-full bg-white/85 px-1.5 text-xs' : ''}>{uploading ? '...' : '+'}</span>
        </button>
        {value ? <button type="button" onClick={() => onChange(null)} className="mt-1 block text-xs text-red-500">删除</button> : null}
        {error ? <div className="mt-1 w-24 text-xs text-red-600">{error}</div> : null}
      </div>
    </div>
  );
};

const IngredientRows = ({
  items,
  kind,
  updateIngredient,
  remove
}: {
  items: IngredientDraft[];
  kind: 'ingredient' | 'seasoning';
  updateIngredient: (index: number, patch: Partial<IngredientDraft>) => void;
  remove: (index: number) => void;
}) => {
  const rows = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => (kind === 'seasoning' ? item.type === '调料' : item.type !== '调料'));
  const visibleRows = rows.length ? rows : items.slice(0, kind === 'seasoning' ? 0 : 3).map((item, index) => ({ item, index }));

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e9e2d6] bg-white">
      <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1.3fr_52px] border-b border-[#e9e2d6] bg-[#f5f1ea] px-3 py-2 text-xs font-semibold text-[#6f6a61]">
        <span>{kind === 'seasoning' ? '调料名称' : '食材名称'}</span>
        <span>用量</span>
        <span>单位</span>
        <span>备注</span>
        <span className="text-right">操作</span>
      </div>
      <div className="divide-y divide-[#f1ece4]">
        {visibleRows.length ? visibleRows.map(({ item, index }) => (
          <div key={item.id} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1.3fr_52px] items-center gap-2 px-3 py-2">
            <Input value={item.name} onChange={(event) => updateIngredient(index, { name: event.target.value, type: kind === 'seasoning' ? '调料' : item.type })} placeholder={kind === 'seasoning' ? '生抽' : '番茄'} />
            <Input value={item.amount} onChange={(event) => updateIngredient(index, { amount: event.target.value })} placeholder="2" />
            <Input value={item.unit} onChange={(event) => updateIngredient(index, { unit: event.target.value })} placeholder={kind === 'seasoning' ? '勺' : '个'} />
            <Input value={item.note} onChange={(event) => updateIngredient(index, { note: event.target.value })} placeholder={kind === 'seasoning' ? '按口味调整' : '中等大小'} />
            <button type="button" onClick={() => remove(index)} className="text-right text-sm text-red-500 hover:text-red-600">删除</button>
          </div>
        )) : (
          <div className="px-3 py-8 text-center text-sm text-[#8c8c8c]">暂无{kind === 'seasoning' ? '调料' : '食材'}，点击下方按钮添加。</div>
        )}
      </div>
    </div>
  );
};

const RecipePreview = ({ draft, categoryName }: { draft: Draft; categoryName?: string }) => {
  const ingredients = draft.ingredients.filter((item) => item.name.trim()).slice(0, 6);
  const steps = draft.steps.filter((step) => step.description.trim()).slice(0, 4);

  return (
    <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#2f2f2f]">内容预览</h2>
        <button type="button" className="rounded-xl border border-[#e9e2d6] bg-white px-3 py-1.5 text-xs text-[#6f8b62]">刷新预览</button>
      </div>
      <div className="overflow-hidden rounded-[28px] border-[10px] border-[#232323] bg-white">
        <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-[#2f2f2f]">
          <span>9:41</span>
          <span>•••</span>
        </div>
        <div className="h-40 bg-[#f5f1ea]">
          {draft.coverUrl ? <img src={draft.coverUrl} alt={draft.title || '菜谱封面'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-[#8c8c8c]">封面预览</div>}
        </div>
        <div className="space-y-4 p-4">
          <div>
            <h3 className="text-xl font-semibold text-[#2f2f2f]">{draft.title || '番茄炒蛋'}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {[categoryName || '家常菜', draft.scene || '下饭菜', draft.difficulty || '简单'].map((tag) => <span key={tag} className="rounded-full bg-[#edf5ea] px-2.5 py-1 text-[#6f8b62]">{tag}</span>)}
            </div>
          </div>
          <div className="flex gap-3 text-xs text-[#6f6a61]">
            <span>{draft.cookTime ?? 15}分钟</span>
            <span>{draft.calories ?? 320} kcal</span>
            <span>{draft.servings ?? 2}人份</span>
          </div>
          <p className="text-sm leading-6 text-[#6f6a61]">{draft.description || '经典家常菜，酸甜开胃，营养丰富，做法简单。'}</p>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-[#2f2f2f]">食材</h4>
            <div className="space-y-1 text-sm text-[#6f6a61]">
              {(ingredients.length ? ingredients : [{ name: '番茄', amount: '2', unit: '个' }, { name: '鸡蛋', amount: '3', unit: '个' }]).map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex justify-between"><span>{item.name}</span><span>{item.amount} {item.unit}</span></div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-[#2f2f2f]">制作步骤</h4>
            <div className="space-y-2 text-sm text-[#6f6a61]">
              {(steps.length ? steps : [{ description: '番茄切块，鸡蛋打散备用。' }, { description: '热锅倒油，倒入蛋液炒至凝固。' }]).map((step, index) => (
                <div key={`${step.description}-${index}`} className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6f8b62] text-xs text-white">{index + 1}</span><span className="line-clamp-2">{step.description}</span></div>
              ))}
            </div>
          </div>
          <button type="button" className="h-11 w-full rounded-xl bg-[#6f8b62] text-sm font-semibold text-white">开始烹饪</button>
        </div>
      </div>
    </div>
  );
};
