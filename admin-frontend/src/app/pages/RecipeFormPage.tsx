import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  createRecipe,
  getRecipe,
  listCategories,
  listIngredients,
  resolveAssetUrl,
  submitRecipeAudit,
  updateRecipe,
  uploadMedia
} from '../api';
import { Button } from '../components/Button';
import { ImageEditorUploader } from '../components/ImageEditorUploader';
import { Input } from '../components/Input';
import { StatusTag } from '../components/StatusTag';
import type { IngredientCategory, Recipe } from '../types';

type RecipeFormMode = 'create' | 'edit';
type IngredientDraft = {
  id: string;
  name: string;
  amount: string;
  unit: string;
  type: string;
  note: string;
  sortIndex: number;
  ingredientId: string | null;
};
type StepDraft = {
  id: string;
  description: string;
  image: string | null;
  video: string | null;
  duration: number | null;
  sortIndex: number;
};
type CookingTipItem = {
  id: string;
  title: string;
  description: string;
  relatedStep: string;
  type: string;
  sort: number;
  status: 'ACTIVE' | 'DISABLED';
};
type CustomNutritionItem = {
  id: string;
  name: string;
  value: string;
  unit: string;
  sort: number;
  status: 'ACTIVE' | 'DISABLED';
};
type RecipeNutrition = {
  base: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrate: number | null;
  dietaryFiber: number | null;
  sodium: number | null;
  potassium: number | null;
  suitableCrowd: string;
  unsuitableCrowd: string;
  description: string;
  customItems: CustomNutritionItem[];
};

type Draft = {
  // 1. 基础信息
  title: string;
  subtitle: string | null;
  categoryId: string | null;
  difficulty: string | null;
  cookTime: number | null;
  calories: number | null;
  servings: number | null;
  description: string | null;

  // 2. 封面与图文素材
  coverUrl: string | null;
  images: string[];
  video: string | null;
  taste: string | null;
  scene: string | null;

  // 3. 食材清单 & 4. 调料清单
  ingredients: IngredientDraft[];

  // 5. 制作步骤
  steps: StepDraft[];

  // 6. 烹饪技巧
  cookingTips: CookingTipItem[];

  // 7. 营养价值
  nutrition: RecipeNutrition;

  // 8. 关联信息
  scenes: string[];
  keywords: string[];
  source: string;
  author: string;
  auditRemark: string;
  tipsText: string;
  relatedTopics: string[];
  relatedTags: string[];

  // 9. 发布设置
  visibility: string;
  status: Recipe['status'];
  isRecommend: boolean;
  recommendPositions: string[];
  sort: number;
  isDraft: boolean;
  isPublish: boolean;
  auditStatus: Recipe['auditStatus'];
  rejectReason?: string | null;
  code?: string | null;
  id?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const createIngredient = (sortIndex: number, type = '主料'): IngredientDraft => ({
  id: createId(),
  name: '',
  amount: '',
  unit: '',
  type,
  note: '',
  sortIndex,
  ingredientId: null
});
const createStep = (sortIndex: number): StepDraft => ({
  id: createId(),
  description: '',
  image: null,
  video: null,
  duration: null,
  sortIndex
});

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
  ingredients: [createIngredient(1, '主料')],
  steps: [createStep(1)],
  cookingTips: [],
  nutrition: {
    base: '每份',
    calories: null,
    protein: null,
    fat: null,
    carbohydrate: null,
    dietaryFiber: null,
    sodium: null,
    potassium: null,
    suitableCrowd: '',
    unsuitableCrowd: '',
    description: '',
    customItems: []
  },
  scenes: [],
  keywords: [],
  source: '',
  author: '',
  auditRemark: '',
  tipsText: '',
  relatedTopics: [],
  relatedTags: [],
  recommendPositions: [],
  visibility: 'PUBLIC',
  status: 'ACTIVE',
  isRecommend: false,
  sort: 0,
  isDraft: true,
  isPublish: false,
  auditStatus: 'DRAFT'
};

const compactImages = (value: Recipe['images']) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];

const recipeToDraft = (recipe: Recipe): Draft => {
  let tipsObj: any = {};
  try {
    if (recipe.tips && recipe.tips.startsWith('{')) {
      tipsObj = JSON.parse(recipe.tips);
    } else {
      tipsObj = {
        tipsText: recipe.tips || ''
      };
    }
  } catch (e) {
    console.error('Failed to parse recipe tips JSON:', e);
    tipsObj = {
      tipsText: recipe.tips || ''
    };
  }

  const defaultNutrition: RecipeNutrition = {
    base: tipsObj.nutrition?.base ?? '每份',
    calories: tipsObj.nutrition?.calories ?? recipe.calories ?? null,
    protein: tipsObj.nutrition?.protein ?? null,
    fat: tipsObj.nutrition?.fat ?? null,
    carbohydrate: tipsObj.nutrition?.carbohydrate ?? null,
    dietaryFiber: tipsObj.nutrition?.dietaryFiber ?? null,
    sodium: tipsObj.nutrition?.sodium ?? null,
    potassium: tipsObj.nutrition?.potassium ?? null,
    suitableCrowd: tipsObj.nutrition?.suitableCrowd ?? '',
    unsuitableCrowd: tipsObj.nutrition?.unsuitableCrowd ?? '',
    description: tipsObj.nutrition?.description ?? '',
    customItems: Array.isArray(tipsObj.nutrition?.customItems) ? tipsObj.nutrition.customItems : []
  };

  return {
    title: recipe.title,
    subtitle: recipe.subtitle ?? null,
    coverUrl: recipe.cover ?? null,
    images: compactImages(recipe.images),
    video: recipe.video ?? null,
    description: recipe.description ?? null,
    categoryId: recipe.categoryId,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    calories: recipe.calories,
    difficulty: recipe.difficulty,
    taste: recipe.taste ?? null,
    scene: recipe.scene ?? null,

    ingredients: (recipe.ingredients?.length
      ? recipe.ingredients
      : [{ id: 0, sortIndex: 1, ingredientId: null, name: '', amount: null, type: '主料', unit: null, note: null }]
    ).map((item, index) => ({
      id: String(item.id ?? createId()),
      name: item.name,
      amount: item.amount ?? '',
      unit: item.unit ?? '',
      type: item.type ?? '主料',
      note: item.note ?? '',
      sortIndex: index + 1,
      ingredientId: item.ingredientId ? String(item.ingredientId) : null
    })),

    steps: (recipe.steps?.length
      ? recipe.steps
      : [{ id: 0, sortIndex: 1, title: null, description: '', image: null, video: null, duration: null }]
    ).map((step, index) => ({
      id: String(step.id ?? createId()),
      description: step.description,
      image: step.image ?? null,
      video: step.video ?? null,
      duration: step.duration ?? null,
      sortIndex: index + 1
    })),

    cookingTips: Array.isArray(tipsObj.cookingTips) ? tipsObj.cookingTips : [],
    nutrition: defaultNutrition,

    scenes: Array.isArray(tipsObj.scenes) ? tipsObj.scenes : [],
    keywords: Array.isArray(tipsObj.keywords) ? tipsObj.keywords : [],
    source: tipsObj.source ?? '',
    author: tipsObj.author ?? '',
    auditRemark: tipsObj.auditRemark ?? recipe.rejectReason ?? '',
    tipsText: tipsObj.tipsText ?? '',
    relatedTopics: Array.isArray(tipsObj.relatedTopics) ? tipsObj.relatedTopics : [],
    relatedTags: Array.isArray(tipsObj.relatedTags) ? tipsObj.relatedTags : [],

    visibility: recipe.visibility ?? 'PUBLIC',
    status: recipe.status,
    isRecommend: recipe.isRecommend,
    recommendPositions: Array.isArray(tipsObj.recommendPositions) ? tipsObj.recommendPositions : [],
    sort: recipe.sort,
    isDraft: recipe.isDraft,
    isPublish: recipe.isPublish,
    auditStatus: recipe.auditStatus,
    rejectReason: recipe.rejectReason ?? null,
    code: recipe.code ?? null,
    id: recipe.id ? String(recipe.id) : null,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    createdBy: '管理员'
  };
};

const serializeDraftToPayload = (draft: Draft) => {
  const tipsObj = {
    tipsText: draft.tipsText,
    cookingTips: draft.cookingTips,
    nutrition: draft.nutrition,
    scenes: draft.scenes,
    keywords: draft.keywords,
    source: draft.source,
    author: draft.author,
    auditRemark: draft.auditRemark,
    relatedTopics: draft.relatedTopics,
    relatedTags: draft.relatedTags,
    recommendPositions: draft.recommendPositions
  };

  return {
    title: draft.title.trim(),
    subtitle: draft.subtitle?.trim() || null,
    coverUrl: draft.coverUrl,
    images: draft.images.filter(Boolean),
    video: draft.video?.trim() || null,
    description: draft.description?.trim() || null,
    categoryId: draft.categoryId,
    cookTime: draft.cookTime,
    servings: draft.servings,
    calories: draft.calories,
    difficulty: draft.difficulty,
    taste: draft.taste,
    scene: draft.scene,
    visibility: draft.visibility,
    tips: JSON.stringify(tipsObj),
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
        ingredientId: item.ingredientId,
        name: item.name.trim(),
        amount: item.amount.trim() || null,
        unit: item.unit.trim() || null,
        type: item.type.trim() || null,
        note: item.note.trim() || null
      }))
  };
};

const TABS = [
  '基础信息',
  '封面与图文素材',
  '食材配料',
  '调料配比',
  '制作步骤',
  '烹饪技巧',
  '营养价值',
  '关联信息',
  '发布设置'
];

const difficultyOptions = ['简单', '中等', '困难'];
const tasteOptions = ['清淡', '香辣', '酸甜', '咸鲜', '鲜香'];
const sceneOptions = ['炒', '煮', '蒸', '炖', '烤', '凉拌'];
const visibilityOptions = [
  { label: '公开 (PUBLIC)', value: 'PUBLIC' },
  { label: '私有 (PRIVATE)', value: 'PRIVATE' },
  { label: '仅自己可见 (ONLY_ME)', value: 'ONLY_ME' }
];

const auditLabels: Record<Recipe['auditStatus'], { label: string; tone: 'green' | 'orange' | 'red' | 'gray' }> = {
  DRAFT: { label: '草稿', tone: 'gray' },
  PENDING: { label: '待审核', tone: 'orange' },
  APPROVED: { label: '审核通过', tone: 'green' },
  REJECTED: { label: '审核驳回', tone: 'red' }
};

export const RecipeFormPage = ({ mode }: { mode: RecipeFormMode }) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ?? '';

  const [activeTab, setActiveTab] = useState<number>(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Tab validations errors state
  const [tabErrors, setTabErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [categoryResult, recipe] = await Promise.all([
          listCategories({ page: 1, pageSize: 100, type: 'RECIPE', status: 'ACTIVE' }),
          mode === 'edit' && id ? getRecipe(id) : Promise.resolve(null)
        ]);
        if (!alive) return;
        setCategories(categoryResult.list);
        if (recipe) {
          setDraft(recipeToDraft(recipe));
        }
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

  const validateTab = (tabIndex: number, currentDraft = draft): string | null => {
    if (tabIndex === 0) {
      if (!currentDraft.title.trim()) return '请输入菜谱名称';
      if (!currentDraft.categoryId) return '请选择菜谱分类';
      if (!currentDraft.difficulty) return '请选择难度';
      if (!currentDraft.description?.trim()) return '请输入菜谱简介';
    }
    if (tabIndex === 1) {
      if (!currentDraft.coverUrl) return '请上传详情页封面图';
    }
    if (tabIndex === 2) {
      const activeIngredients = currentDraft.ingredients.filter((item) => item.type !== '调料' && item.name.trim());
      if (activeIngredients.length === 0) return '至少输入一个食材配料名称';
    }
    if (tabIndex === 4) {
      const activeSteps = currentDraft.steps.filter((step) => step.description.trim());
      if (activeSteps.length === 0) return '至少输入一个制作步骤描述';
    }
    return null;
  };

  const updateAllTabErrors = (currentDraft = draft) => {
    const errors: Record<number, boolean> = {};
    TABS.forEach((_, idx) => {
      const err = validateTab(idx, currentDraft);
      if (err) {
        errors[idx] = true;
      }
    });
    setTabErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTabClick = (index: number) => {
    setError(null);
    setActiveTab(index);
  };

  const handlePrev = () => {
    setError(null);
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  const handleNext = () => {
    setError(null);
    const validationErr = validateTab(activeTab, draft);
    if (validationErr) {
      setError(`【${TABS[activeTab]}】: ${validationErr}`);
      return;
    }
    if (activeTab < TABS.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };

  const handleSaveDraft = async () => {
    await handleSave('draft');
  };

  const handlePublish = async () => {
    await handleSave('submit');
  };

  const handleSave = async (intent: 'draft' | 'submit') => {
    setError(null);
    const finalDraft = {
      ...draft,
      isDraft: intent === 'draft',
      isPublish: intent === 'submit',
      status: intent === 'submit' ? ('ACTIVE' as const) : ('DISABLED' as const)
    };

    if (intent === 'submit') {
      const isValid = updateAllTabErrors(finalDraft);
      if (!isValid) {
        let firstErrorTab = 0;
        for (let i = 0; i < TABS.length; i++) {
          const err = validateTab(i, finalDraft);
          if (err) {
            firstErrorTab = i;
            setError(`【${TABS[i]}】: ${err}`);
            break;
          }
        }
        setActiveTab(firstErrorTab);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = serializeDraftToPayload(finalDraft);
      const saved = await (mode === 'edit' && id ? updateRecipe(id, payload) : createRecipe(payload));
      if (intent === 'submit') {
        await submitRecipeAudit(saved.id);
      }
      setNotice(intent === 'submit' ? '提交审核成功' : '草稿已保存');
      window.setTimeout(() => navigate('/content/recipes', { replace: true }), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const updateIngredient = (index: number, patch: Partial<IngredientDraft>) => {
    setDraft((current) => ({
      ...current,
      ingredients: current.ingredients.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item))
    }));
  };

  const updateStep = (index: number, patch: Partial<StepDraft>) => {
    setDraft((current) => ({
      ...current,
      steps: current.steps.map((step, currentIndex) => (currentIndex === index ? { ...step, ...patch } : step))
    }));
  };

  const moveRow = <T extends { sortIndex: number }>(items: T[], index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next.map((item, currentIndex) => ({ ...item, sortIndex: currentIndex + 1 }));
  };

  const moveIngredient = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= draft.ingredients.length) return;
    const list = [...draft.ingredients];
    [list[index], list[targetIdx]] = [list[targetIdx], list[index]];
    const updated = list.map((item, idx) => ({ ...item, sortIndex: idx + 1 }));
    setDraft((d) => ({ ...d, ingredients: updated }));
  };

  const audit = auditLabels[draft.auditStatus];

  return (
    <section className="min-h-screen bg-[#FAF7F2] py-6 px-4 md:px-8">
      {/* 顶部标题区 */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2f2f2f]">
            {mode === 'edit' ? '编辑菜谱' : '新增菜谱'}
          </h1>
          <p className="mt-1 text-sm text-[#B7AEA1]">
            维护菜谱的基础信息、图文音视频素材、食材配比、烹饪步骤与营养参数
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="border-[#cfc6b8] text-[#6f6a61] px-5 h-10 hover:bg-[#f5f1ea]"
            onClick={() => navigate('/content/recipes')}
          >
            返回列表
          </Button>
        </div>
      </div>

      {/* 错误与成功状态提示 */}
      {error ? (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 font-bold hover:text-red-700">✕</button>
        </div>
      ) : null}
      {notice ? (
        <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-[#e9e2d6] bg-white p-12 text-center text-[#B7AEA1] text-sm">
          加载数据中...
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Tab 选项栏 */}
          <div className="overflow-x-auto rounded-2xl border border-[#e9e2d6] bg-white p-2">
            <nav className="flex space-x-1 min-w-[800px]">
              {TABS.map((tab, idx) => {
                const isActive = idx === activeTab;
                const hasErr = tabErrors[idx];
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabClick(idx)}
                    className={[
                      'flex-1 relative py-3 px-1 text-sm font-medium rounded-xl transition duration-150',
                      isActive
                        ? 'bg-[#edf5ea] text-[#6f8b62]'
                        : 'text-[#6f6a61] hover:bg-zinc-50'
                    ].join(' ')}
                  >
                    {tab}
                    {hasErr && (
                      <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-4 h-[3px] bg-[#6f8b62] rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 表单面板 */}
          <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 shadow-sm min-h-[500px]">
            {/* Tab 1: 基础信息 */}
            {activeTab === 0 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">基础信息</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">输入菜谱的通用基本属性，带 * 为必填项</p>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="菜谱名称 *">
                    <Input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="请输入菜谱名称"
                      className="h-11"
                    />
                  </Field>
                  <Field label="菜谱副标题">
                    <Input
                      value={draft.subtitle ?? ''}
                      onChange={(e) => setDraft({ ...draft, subtitle: e.target.value || null })}
                      placeholder="请输入副标题，如'酸甜开胃，简单易做'"
                      className="h-11"
                    />
                  </Field>
                  <Field label="菜谱分类 *">
                    <select
                      value={draft.categoryId ?? ''}
                      onChange={(e) => setDraft({ ...draft, categoryId: e.target.value || null })}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none"
                    >
                      <option value="">请选择分类</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="难度 *">
                    <select
                      value={draft.difficulty ?? ''}
                      onChange={(e) => setDraft({ ...draft, difficulty: e.target.value || null })}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none"
                    >
                      <option value="">请选择难度</option>
                      {difficultyOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="烹饪时长 (分钟)">
                    <Input
                      type="number"
                      placeholder="如 15"
                      value={draft.cookTime ?? ''}
                      onChange={(e) => setDraft({ ...draft, cookTime: e.target.value === '' ? null : Number(e.target.value) })}
                      className="h-11"
                    />
                  </Field>
                  <Field label="热量 (kcal)">
                    <Input
                      type="number"
                      placeholder="如 320"
                      value={draft.calories ?? ''}
                      onChange={(e) => setDraft({ ...draft, calories: e.target.value === '' ? null : Number(e.target.value) })}
                      className="h-11"
                    />
                  </Field>
                  <Field label="份量 (几人食)">
                    <Input
                      type="number"
                      placeholder="如 2"
                      value={draft.servings ?? ''}
                      onChange={(e) => setDraft({ ...draft, servings: e.target.value === '' ? null : Number(e.target.value) })}
                      className="h-11"
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="菜谱简介 / 描述 *">
                      <textarea
                        value={draft.description ?? ''}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none min-h-24 resize-y"
                        placeholder="简要介绍这道菜的特色、口感、适合人群或食用场景..."
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: 封面与图文素材 */}
            {activeTab === 1 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">封面与图文素材</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">上传菜谱的主封面、轮播展示图片集，以及烹饪讲解视频</p>
                </div>
                <ImageEditorUploader
                  coverUrl={draft.coverUrl}
                  images={draft.images}
                  max={8}
                  onCoverChange={(coverUrl) => setDraft({ ...draft, coverUrl })}
                  onImagesChange={(images) => setDraft({ ...draft, images })}
                />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="视频链接 / 视频上传 (可选)">
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <Input
                        value={draft.video ?? ''}
                        onChange={(e) => setDraft({ ...draft, video: e.target.value || null })}
                        placeholder="粘贴以 http/https 开头的视频链接，或点击右侧上传"
                        className="h-11"
                      />
                      <PrototypeVideoButton
                        onUploaded={(url) => setDraft({ ...draft, video: url })}
                        onNotice={(msg) => setNotice(msg)}
                      />
                    </div>
                  </Field>
                  <Field label="核心口味属性 (选填)">
                    <select
                      value={draft.taste ?? ''}
                      onChange={(e) => setDraft({ ...draft, taste: e.target.value || null })}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] outline-none"
                    >
                      <option value="">选择口味</option>
                      {tasteOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* Tab 3: 食材配料 */}
            {activeTab === 2 && (
              <IngredientRowsSection
                items={draft.ingredients}
                kind="ingredient"
                updateIngredient={updateIngredient}
                remove={(index) =>
                  setDraft((current) => ({
                    ...current,
                    ingredients: current.ingredients
                      .filter((_, currentIndex) => currentIndex !== index)
                      .map((next, nextIndex) => ({ ...next, sortIndex: nextIndex + 1 }))
                  }))
                }
                add={() =>
                  setDraft((current) => ({
                    ...current,
                    ingredients: [...current.ingredients, createIngredient(current.ingredients.length + 1, '主料')]
                  }))
                }
                move={(index, direction) => moveIngredient(index, direction)}
              />
            )}

            {/* Tab 4: 调料配比 */}
            {activeTab === 3 && (
              <IngredientRowsSection
                items={draft.ingredients}
                kind="seasoning"
                updateIngredient={updateIngredient}
                remove={(index) =>
                  setDraft((current) => ({
                    ...current,
                    ingredients: current.ingredients
                      .filter((_, currentIndex) => currentIndex !== index)
                      .map((next, nextIndex) => ({ ...next, sortIndex: nextIndex + 1 }))
                  }))
                }
                add={() =>
                  setDraft((current) => ({
                    ...current,
                    ingredients: [...current.ingredients, createIngredient(current.ingredients.length + 1, '调料')]
                  }))
                }
                move={(index, direction) => moveIngredient(index, direction)}
              />
            )}

            {/* Tab 5: 制作步骤 */}
            {activeTab === 4 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2f2f2f]">制作步骤</h3>
                    <p className="text-xs text-[#B7AEA1] mt-1">维护烹饪过程的分步动作及引导图片，带 * 为必填项</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        steps: [...current.steps, createStep(current.steps.length + 1)]
                      }))
                    }
                    className="bg-[#6f8b62] text-white hover:bg-[#5d7552] text-xs px-3 h-9 font-semibold transition"
                  >
                    ＋ 新增步骤
                  </Button>
                </div>

                {draft.steps.length === 0 ? (
                  <div className="bg-[#FAF7F2] rounded-xl p-8 text-center text-sm text-[#B7AEA1]">
                    暂无步骤。请点击右上角“新增步骤”按钮添加。
                  </div>
                ) : (
                  <div className="space-y-4">
                    {draft.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="border border-[#e9e2d6] rounded-2xl p-4 bg-[#fdfcf9] grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-center"
                      >
                        <div className="text-center text-lg font-bold text-[#6f8b62] bg-[#edf5ea] rounded-full w-10 h-10 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
                          <textarea
                            value={step.description}
                            onChange={(e) => updateStep(index, { description: e.target.value })}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:border-[#6f8b62] outline-none min-h-16 resize-y"
                            placeholder="请输入步骤描述，如：番茄洗净切块，鸡蛋打散..."
                          />
                          <div className="flex flex-col gap-1.5 justify-center">
                            <label className="text-[10px] text-[#6f6a61] font-semibold">预估用时 (秒)</label>
                            <Input
                              type="number"
                              value={step.duration ?? ''}
                              onChange={(e) =>
                                updateStep(index, { duration: e.target.value === '' ? null : Number(e.target.value) })
                              }
                              placeholder="秒，如：120"
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                          <StepImageUpload value={step.image} onChange={(img) => updateStep(index, { image: img })} />
                          <div className="inline-flex flex-col gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => {
                                const arr = moveRow(draft.steps, index, -1);
                                setDraft((d) => ({ ...d, steps: arr }));
                              }}
                              className="bg-zinc-50 hover:bg-zinc-100 p-1 border rounded disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={index === draft.steps.length - 1}
                              onClick={() => {
                                const arr = moveRow(draft.steps, index, 1);
                                setDraft((d) => ({ ...d, steps: arr }));
                              }}
                              className="bg-zinc-50 hover:bg-zinc-100 p-1 border rounded disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                            >
                              ▼
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((current) => ({
                                ...current,
                                steps: current.steps
                                  .filter((_, idx) => idx !== index)
                                  .map((next, nextIndex) => ({ ...next, sortIndex: nextIndex + 1 }))
                              }))
                            }
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2.5 py-2 rounded transition"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 6: 烹饪技巧 */}
            {activeTab === 5 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2f2f2f]">烹饪技巧</h3>
                    <p className="text-xs text-[#B7AEA1] mt-1">设置菜谱的实用烹饪小妙招或注意事项，帮助新手规避失败</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      const newTip: CookingTipItem = {
                        id: createId(),
                        title: '',
                        description: '',
                        relatedStep: '全局',
                        type: '烹饪阶段',
                        sort: draft.cookingTips.length + 1,
                        status: 'ACTIVE'
                      };
                      setDraft((d) => ({ ...d, cookingTips: [...d.cookingTips, newTip] }));
                    }}
                    className="bg-[#6f8b62] text-white hover:bg-[#5d7552] text-xs px-3 h-9 font-semibold transition"
                  >
                    ＋ 新增技巧
                  </Button>
                </div>

                {draft.cookingTips.length === 0 ? (
                  <div className="bg-[#FAF7F2] rounded-xl p-8 text-center text-sm text-[#B7AEA1]">
                    暂无烹饪技巧。点击右上角“新增技巧”按钮添加。
                  </div>
                ) : (
                  <div className="space-y-4">
                    {draft.cookingTips.map((tip, idx) => (
                      <div
                        key={tip.id}
                        className="border border-[#e9e2d6] rounded-2xl p-4 bg-[#fdfcf9] grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
                      >
                        <div>
                          <label className="text-xs text-[#6f6a61] block mb-1">技巧标题 *</label>
                          <Input
                            value={tip.title}
                            onChange={(e) => {
                              const list = [...draft.cookingTips];
                              list[idx].title = e.target.value;
                              setDraft((d) => ({ ...d, cookingTips: list }));
                            }}
                            placeholder="如：如何炒蛋蓬松"
                            className="h-10 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#6f6a61] block mb-1">小技巧描述 *</label>
                          <Input
                            value={tip.description}
                            onChange={(e) => {
                              const list = [...draft.cookingTips];
                              list[idx].description = e.target.value;
                              setDraft((d) => ({ ...d, cookingTips: list }));
                            }}
                            placeholder="如：加少量温水搅拌，大火下锅..."
                            className="h-10 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-[#6f6a61] block mb-1">关联步骤</label>
                            <select
                              value={tip.relatedStep}
                              onChange={(e) => {
                                const list = [...draft.cookingTips];
                                list[idx].relatedStep = e.target.value;
                                setDraft((d) => ({ ...d, cookingTips: list }));
                              }}
                              className="text-xs h-10 w-full rounded-xl border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                            >
                              <option value="全局">全局 (整个菜谱)</option>
                              {draft.steps.map((s, stepIdx) => (
                                <option key={s.id} value={`步骤 ${stepIdx + 1}`}>步骤 {stepIdx + 1}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-[#6f6a61] block mb-1">技巧类型</label>
                            <select
                              value={tip.type}
                              onChange={(e) => {
                                const list = [...draft.cookingTips];
                                list[idx].type = e.target.value;
                                setDraft((d) => ({ ...d, cookingTips: list }));
                              }}
                              className="text-xs h-10 w-full rounded-xl border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                            >
                              <option value="准备阶段">准备阶段</option>
                              <option value="烹饪阶段">烹饪阶段</option>
                              <option value="摆盘阶段">摆盘阶段</option>
                              <option value="其它">其它</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 pt-4 md:pt-0">
                          <div>
                            <label className="text-xs text-[#6f6a61] block mb-1">启用状态</label>
                            <select
                              value={tip.status}
                              onChange={(e) => {
                                const list = [...draft.cookingTips];
                                list[idx].status = e.target.value as any;
                                setDraft((d) => ({ ...d, cookingTips: list }));
                              }}
                              className="text-xs h-10 w-full rounded-xl border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                            >
                              <option value="ACTIVE">启用 (ACTIVE)</option>
                              <option value="DISABLED">停用 (DISABLED)</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDraft((d) => ({
                                ...d,
                                cookingTips: d.cookingTips.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2.5 py-2 rounded h-10 transition mt-4"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 7: 营养价值 */}
            {activeTab === 6 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2f2f2f]">营养价值</h3>
                    <p className="text-xs text-[#B7AEA1] mt-1">设置菜谱的营养素构成以及人群膳食建议</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6f6a61] font-semibold">营养基准:</span>
                    <input
                      type="text"
                      value={draft.nutrition.base}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          nutrition: { ...draft.nutrition, base: e.target.value }
                        })
                      }
                      className="w-24 border border-zinc-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#6f8b62]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="热量 (kcal)">
                    <Input
                      type="number"
                      value={draft.nutrition.calories ?? ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          nutrition: { ...draft.nutrition, calories: e.target.value === '' ? null : Number(e.target.value) }
                        })
                      }
                      placeholder="0.0"
                      className="h-10 text-xs"
                    />
                  </Field>
                  <Field label="蛋白质 (g)">
                    <Input
                      type="number"
                      value={draft.nutrition.protein ?? ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          nutrition: { ...draft.nutrition, protein: e.target.value === '' ? null : Number(e.target.value) }
                        })
                      }
                      placeholder="0.0"
                      className="h-10 text-xs"
                    />
                  </Field>
                  <Field label="脂肪 (g)">
                    <Input
                      type="number"
                      value={draft.nutrition.fat ?? ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          nutrition: { ...draft.nutrition, fat: e.target.value === '' ? null : Number(e.target.value) }
                        })
                      }
                      placeholder="0.0"
                      className="h-10 text-xs"
                    />
                  </Field>
                  <Field label="碳水化合物 (g)">
                    <Input
                      type="number"
                      value={draft.nutrition.carbohydrate ?? ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          nutrition: { ...draft.nutrition, carbohydrate: e.target.value === '' ? null : Number(e.target.value) }
                        })
                      }
                      placeholder="0.0"
                      className="h-10 text-xs"
                    />
                  </Field>
                  <Field label="膳食纤维 (g)">
                    <Input
                      type="number"
                      value={draft.nutrition.dietaryFiber ?? ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          nutrition: { ...draft.nutrition, dietaryFiber: e.target.value === '' ? null : Number(e.target.value) }
                        })
                      }
                      placeholder="0.0"
                      className="h-10 text-xs"
                    />
                  </Field>
                  <Field label="钠 (mg)">
                    <Input
                      type="number"
                      value={draft.nutrition.sodium ?? ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          nutrition: { ...draft.nutrition, sodium: e.target.value === '' ? null : Number(e.target.value) }
                        })
                      }
                      placeholder="0.0"
                      className="h-10 text-xs"
                    />
                  </Field>
                  <Field label="钾 (mg)">
                    <Input
                      type="number"
                      value={draft.nutrition.potassium ?? ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          nutrition: { ...draft.nutrition, potassium: e.target.value === '' ? null : Number(e.target.value) }
                        })
                      }
                      placeholder="0.0"
                      className="h-10 text-xs"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                  <Field label="适合人群">
                    <Input
                      value={draft.nutrition.suitableCrowd}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          nutrition: { ...draft.nutrition, suitableCrowd: e.target.value }
                        })
                      }
                      placeholder="如：减脂人群、高血压患者..."
                      className="h-10 text-xs"
                    />
                  </Field>
                  <Field label="不适合/禁忌人群">
                    <Input
                      value={draft.nutrition.unsuitableCrowd}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          nutrition: { ...draft.nutrition, unsuitableCrowd: e.target.value }
                        })
                      }
                      placeholder="如：肾功能不全者、糖尿病患者..."
                      className="h-10 text-xs"
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="整体营养解读">
                      <textarea
                        value={draft.nutrition.description}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            nutrition: { ...draft.nutrition, description: e.target.value }
                          })
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:border-[#6f8b62] outline-none min-h-16 resize-y"
                        placeholder="这道菜富含优质蛋白，钠含量偏低..."
                      />
                    </Field>
                  </div>
                </div>

                {/* 自定义扩展营养素 */}
                <div className="border-t border-zinc-100 pt-6 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-[#2f2f2f]">自定义微量元素 / 维生素项 (选填)</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newNut: CustomNutritionItem = {
                          id: createId(),
                          name: '',
                          value: '',
                          unit: 'mg',
                          sort: draft.nutrition.customItems.length + 1,
                          status: 'ACTIVE'
                        };
                        setDraft({
                          ...draft,
                          nutrition: { ...draft.nutrition, customItems: [...draft.nutrition.customItems, newNut] }
                        });
                      }}
                      className="text-xs font-semibold text-[#6f8b62] hover:text-[#5d7552]"
                    >
                      ＋ 新增自定义项
                    </button>
                  </div>

                  {draft.nutrition.customItems.length === 0 ? (
                    <div className="bg-[#FAF7F2] rounded-xl p-4 text-center text-xs text-[#B7AEA1]">
                      暂无自定义元素项。
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {draft.nutrition.customItems.map((item, idx) => (
                        <div key={item.id} className="flex flex-wrap gap-3 items-center bg-[#fdfcf9] border border-zinc-100 rounded-xl p-3">
                          <div className="flex-1 min-w-[120px]">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const list = [...draft.nutrition.customItems];
                                list[idx].name = e.target.value;
                                setDraft({ ...draft, nutrition: { ...draft.nutrition, customItems: list } });
                              }}
                              className="w-full text-xs h-9 rounded-lg border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                              placeholder="名称, 如 维生素C"
                            />
                          </div>
                          <div className="flex-1 min-w-[80px]">
                            <input
                              type="text"
                              value={item.value}
                              onChange={(e) => {
                                const list = [...draft.nutrition.customItems];
                                list[idx].value = e.target.value;
                                setDraft({ ...draft, nutrition: { ...draft.nutrition, customItems: list } });
                              }}
                              className="w-full text-xs h-9 rounded-lg border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                              placeholder="值, 如 12.5"
                            />
                          </div>
                          <div className="w-20">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => {
                                const list = [...draft.nutrition.customItems];
                                list[idx].unit = e.target.value;
                                setDraft({ ...draft, nutrition: { ...draft.nutrition, customItems: list } });
                              }}
                              className="w-full text-xs h-9 rounded-lg border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                              placeholder="单位, 如 mg"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDraft({
                                ...draft,
                                nutrition: {
                                  ...draft.nutrition,
                                  customItems: draft.nutrition.customItems.filter((_, i) => i !== idx)
                                }
                              });
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2.5 h-9 rounded transition"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 8: 关联与元数据 */}
            {activeTab === 7 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">关联与元信息</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">设置适用场景、归属出处、搜索关键词及小贴士</p>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="关联食材清单 (自动获取)">
                    <Input
                      value={draft.ingredients.filter((item) => item.type !== '调料' && item.name.trim()).map((item) => item.name).join('、')}
                      readOnly
                      className="h-11 bg-zinc-50 text-zinc-500 cursor-not-allowed text-xs"
                      placeholder="来自前述食材配料列表"
                    />
                  </Field>
                  <Field label="来源 / 出处">
                    <Input
                      value={draft.source}
                      onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                      placeholder="如：大厨食谱 / 经典古籍 / 原创"
                      className="h-11"
                    />
                  </Field>
                  <Field label="菜谱作者">
                    <Input
                      value={draft.author}
                      onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                      placeholder="如：陆羽、苏轼"
                      className="h-11"
                    />
                  </Field>
                  <Field label="适用场景">
                    <div className="flex flex-wrap gap-4 text-xs mt-2 text-[#2f2f2f]">
                      {sceneOptions.map((sc) => {
                        const isSelected = draft.scenes.includes(sc);
                        return (
                          <label key={sc} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setDraft({ ...draft, scenes: [...draft.scenes, sc] });
                                } else {
                                  setDraft({ ...draft, scenes: draft.scenes.filter(s => s !== sc) });
                                }
                              }}
                              className="accent-[#6f8b62] h-4 w-4"
                            />
                            {sc}
                          </label>
                        );
                      })}
                    </div>
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="搜索关键词 (英文/中文逗号回车分隔)">
                      <div className="flex flex-wrap items-center gap-2 p-2 border border-zinc-200 rounded-xl min-h-11 bg-white">
                        {draft.keywords.map((kw) => (
                          <span key={kw} className="flex items-center gap-1.5 bg-[#edf5ea] text-[#6f8b62] px-2.5 py-1 text-xs rounded-full">
                            {kw}
                            <button
                              type="button"
                              onClick={() => setDraft({ ...draft, keywords: draft.keywords.filter(k => k !== kw) })}
                              className="text-[#6f8b62] hover:text-[#5d7552] font-semibold"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          placeholder="添加关键词..."
                          className="flex-1 outline-none text-xs px-1 min-w-[100px] h-7"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val && !draft.keywords.includes(val)) {
                                setDraft({ ...draft, keywords: [...draft.keywords, val] });
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="小贴士 (烹饪避坑指南 / 储存注意)">
                      <textarea
                        value={draft.tipsText}
                        onChange={(e) => setDraft({ ...draft, tipsText: e.target.value })}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:border-[#6f8b62] outline-none min-h-24 resize-y"
                        placeholder="说明调味增减、火候控制技巧..."
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 9: 发布设置 */}
            {activeTab === 8 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">发布与权限设置</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">控制菜谱的前端发布状态与系统排序权重</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="排序权重值" desc="决定 C 端展示列表排序，数值越大越靠前">
                    <Input
                      type="number"
                      value={draft.sort}
                      onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
                      className="h-11 text-xs"
                    />
                  </Field>
                  <Field label="前端可见性范围">
                    <select
                      value={draft.visibility}
                      onChange={(e) => setDraft({ ...draft, visibility: e.target.value })}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] outline-none"
                    >
                      {visibilityOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="flex flex-col gap-3 mt-4">
                    <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-[#2f2f2f]">
                      <input
                        type="checkbox"
                        checked={draft.status === 'ACTIVE'}
                        onChange={(e) => setDraft({ ...draft, status: e.target.checked ? 'ACTIVE' : 'DISABLED' })}
                        className="accent-[#6f8b62] h-4.5 w-4.5"
                      />
                      启用本菜谱 (设为 ACTIVE 状态)
                    </label>
                    <p className="text-xs text-[#B7AEA1] ml-7">禁用后本菜谱及其对应步骤在前端均不可见</p>
                  </div>
                  <div className="flex flex-col gap-3 mt-4">
                    <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-[#2f2f2f]">
                      <input
                        type="checkbox"
                        checked={draft.isRecommend}
                        onChange={(e) => setDraft({ ...draft, isRecommend: e.target.checked })}
                        className="accent-[#6f8b62] h-4.5 w-4.5"
                      />
                      标记为精选推荐 (在首页或分类推荐中优先轮播显示)
                    </label>
                  </div>
                </div>

                {/* 详细系统元信息面板 */}
                <div className="border-t border-zinc-100 pt-6 mt-6 bg-[#fcfbf9] rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-[#6f6a61] uppercase tracking-wider">系统元数据详情</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#6f6a61]">
                    <div>
                      <span className="font-semibold">发布阶段：</span>
                      {draft.isPublish ? (
                        <span className="text-emerald-600 font-bold">已发布 (PUBLISHED)</span>
                      ) : (
                        <span className="text-amber-500 font-bold">草稿 (DRAFT)</span>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">内容编号 (ID)：</span>
                      <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-[11px] text-zinc-700">
                        {draft.id || '系统自动生成'}
                      </code>
                    </div>
                    <div>
                      <span className="font-semibold">业务内码 (Code)：</span>
                      <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-[11px] text-zinc-700">
                        {draft.code || '系统自动编码'}
                      </code>
                    </div>
                    <div>
                      <span className="font-semibold">审核状态：</span>
                      <StatusTag label={audit.label} tone={audit.tone} />
                    </div>
                    {draft.rejectReason && (
                      <div className="sm:col-span-3 text-red-600">
                        <span className="font-semibold text-zinc-600">驳回原因/审核批注：</span>
                        {draft.rejectReason}
                      </div>
                    )}
                    {mode === 'edit' && (
                      <>
                        <div>
                          <span className="font-semibold">创建时间：</span>
                          {draft.createdAt ? new Date(draft.createdAt).toLocaleString() : '-'}
                        </div>
                        <div>
                          <span className="font-semibold">最近更新：</span>
                          {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : '-'}
                        </div>
                        <div>
                          <span className="font-semibold">创建人：</span>
                          {draft.createdBy || '管理员'}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 底部固定操作栏 */}
            <div className="mt-8 pt-6 border-t border-zinc-100 flex gap-4 justify-between items-center bg-white sticky bottom-0 z-10 py-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={activeTab === 0}
                  onClick={handlePrev}
                  className="border-[#cfc6b8] text-[#6f6a61] px-5 h-10 hover:bg-[#f5f1ea] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一步
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={activeTab === TABS.length - 1}
                  onClick={handleNext}
                  className="border-[#cfc6b8] text-[#6f6a61] px-5 h-10 hover:bg-[#f5f1ea] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saving}
                  onClick={handleSaveDraft}
                  className="border-[#cfc6b8] text-[#6f6a61] px-5 h-10 hover:bg-[#f5f1ea]"
                >
                  {saving ? '保存中...' : '保存草稿'}
                </Button>
                <Button
                  type="button"
                  disabled={saving}
                  onClick={handlePublish}
                  className="bg-[#6f8b62] text-white hover:bg-[#5d7552] px-6 h-10 font-semibold transition"
                >
                  {saving ? '提交中...' : '提交审核'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const Field = ({ label, desc, children, className = '' }: { label: string; desc?: string; children: ReactNode; className?: string }) => (
  <div className={className}>
    <label className="block mb-1.5 text-xs font-semibold text-[#6f6a61]">
      {label}
    </label>
    {children}
    {desc && <p className="mt-1 text-[10px] text-[#B7AEA1]">{desc}</p>}
  </div>
);

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

const IngredientAutocompleteInput = ({
  value,
  onChange,
  onSelectIngredient,
  placeholder
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectIngredient: (ing: { id: string; name: string; unit: string | null }) => void;
  placeholder?: string;
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const triggerSearch = useMemo(() => {
    let timer: any = null;
    return (q: string) => {
      if (timer) clearTimeout(timer);
      if (!q.trim()) {
        setSuggestions([]);
        return;
      }
      setSearching(true);
      timer = setTimeout(async () => {
        try {
          const res = await listIngredients({ q, pageSize: 8 });
          setSuggestions(res.list);
          setOpen(res.list.length > 0);
        } catch (e) {
          console.error(e);
        } finally {
          setSearching(false);
        }
      }, 300);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val);
          triggerSearch(val);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className="h-10 text-xs"
      />
      {searching && (
        <span className="absolute right-2 top-3 text-[10px] text-zinc-400">...</span>
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-zinc-100">
          {suggestions.map((ing) => (
            <button
              key={ing.id}
              type="button"
              onClick={() => {
                onSelectIngredient({ id: ing.id, name: ing.name, unit: ing.priceUnit });
                setOpen(false);
              }}
              className="w-full text-left p-2.5 hover:bg-[#edf5ea] text-xs text-[#2f2f2f] transition flex justify-between items-center"
            >
              <span className="font-semibold">{ing.name}</span>
              <span className="text-[10px] text-[#B7AEA1]">{ing.category?.name || '分类'} | {ing.priceUnit || '单位'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const IngredientRowsSection = ({
  items,
  kind,
  updateIngredient,
  remove,
  add,
  move
}: {
  items: IngredientDraft[];
  kind: 'ingredient' | 'seasoning';
  updateIngredient: (index: number, patch: Partial<IngredientDraft>) => void;
  remove: (index: number) => void;
  add: () => void;
  move: (index: number, direction: -1 | 1) => void;
}) => {
  const isSeasoning = kind === 'seasoning';
  const rows = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => (isSeasoning ? item.type === '调料' : item.type !== '调料'));

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-100 pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-[#2f2f2f]">{isSeasoning ? '调料配比' : '食材配料'}</h3>
          <p className="text-xs text-[#B7AEA1] mt-1">设置菜谱所需的{isSeasoning ? '调味辅料' : '主配食材'}，支持模糊搜索关联系统食材库</p>
        </div>
        <Button
          type="button"
          onClick={add}
          className="bg-[#6f8b62] text-white hover:bg-[#5d7552] text-xs px-3 h-9 font-semibold transition"
        >
          ＋ 新增{isSeasoning ? '调料' : '食材'}
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="bg-[#FAF7F2] rounded-xl p-8 text-center text-sm text-[#B7AEA1]">
          暂无记录。点击右上角“新增”按钮进行添加。
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e9e2d6] bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fcfbf9] text-[#6f6a61] border-b border-[#e9e2d6] font-semibold">
              <tr>
                <th className="p-3 w-1/4">{isSeasoning ? '调料名称 *' : '食材名称 *'}</th>
                <th className="p-3 w-1/6">用量</th>
                <th className="p-3 w-1/6">单位</th>
                <th className="p-3 w-1/4">备注</th>
                <th className="p-3 text-center">排序</th>
                <th className="p-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map(({ item, index }) => (
                <tr key={item.id} className="hover:bg-zinc-50/50">
                  <td className="p-2">
                    <IngredientAutocompleteInput
                      value={item.name}
                      onChange={(val) => updateIngredient(index, { name: val, type: isSeasoning ? '调料' : '主料' })}
                      onSelectIngredient={(ing) => {
                        updateIngredient(index, {
                          name: ing.name,
                          ingredientId: ing.id,
                          unit: ing.unit || item.unit,
                          type: isSeasoning ? '调料' : '主料'
                        });
                      }}
                      placeholder={isSeasoning ? '如：生抽' : '如：番茄'}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.amount}
                      onChange={(e) => updateIngredient(index, { amount: e.target.value })}
                      placeholder="2"
                      className="h-10 text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.unit}
                      onChange={(e) => updateIngredient(index, { unit: e.target.value })}
                      placeholder={isSeasoning ? '勺' : '个'}
                      className="h-10 text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.note}
                      onChange={(e) => updateIngredient(index, { note: e.target.value })}
                      placeholder={isSeasoning ? '按口味调整' : '中等大小'}
                      className="h-10 text-xs"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className="bg-zinc-50 hover:bg-zinc-100 px-2 py-1 border rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={index === rows.length - 1}
                        onClick={() => move(index, 1)}
                        className="bg-zinc-50 hover:bg-zinc-100 px-2 py-1 border rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded transition"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
