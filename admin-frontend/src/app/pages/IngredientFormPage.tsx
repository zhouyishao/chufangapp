import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { createIngredient, ensureDefaultIngredientCategories, getIngredient, resolveAssetUrl, updateIngredient, uploadMedia } from '../api';
import { Button } from '../components/Button';
import { ImageEditorUploader } from '../components/ImageEditorUploader';
import { Input } from '../components/Input';
import type { Ingredient, IngredientCategory } from '../types';

type IngredientFormMode = 'create' | 'edit';

type Draft = {
  name: string;
  coverUrl: string | null;
  categoryId: string | null;
  seasonMonth: string | null;
  nutrition: string | null;
  selectionTips: string | null;
  storageMethod: string | null;
  taboo: string | null;
  detailImages: string[];
  selectionMedia: string | null;
  currentPrice: number | null;
  priceUnit: string | null;
  priceSource: string | null;
  isPublish: boolean;
  isRecommend: boolean;
  status: Ingredient['status'];
  sort: number;
};

type SelectionGuideItem = {
  id: string;
  title: string;
  description: string;
  image: string | null;
};

type SelectionGuideGroup = {
  id: string;
  name: string;
  items: SelectionGuideItem[];
};

const createLocalId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const createSelectionGuideItem = (index = 1): SelectionGuideItem => ({
  id: createLocalId(),
  title: index === 1 ? '看大小形状' : '',
  description: index === 1 ? '一般而言，外形均匀、状态饱满的更适合购买。' : '',
  image: null
});
const createSelectionGuideGroup = (name = '外观'): SelectionGuideGroup => ({
  id: createLocalId(),
  name,
  items: [createSelectionGuideItem()]
});

const emptyDraft: Draft = {
  name: '',
  coverUrl: null,
  categoryId: null,
  seasonMonth: null,
  nutrition: null,
  selectionTips: null,
  storageMethod: null,
  taboo: null,
  detailImages: [],
  selectionMedia: null,
  currentPrice: null,
  priceUnit: null,
  priceSource: null,
  isPublish: false,
  isRecommend: false,
  status: 'ACTIVE',
  sort: 0
};

const ingredientToDraft = (ingredient: Ingredient): Draft => ({
  name: ingredient.name,
  coverUrl: ingredient.cover,
  categoryId: ingredient.categoryId,
  seasonMonth: ingredient.seasonMonth,
  nutrition: ingredient.nutrition,
  selectionTips: ingredient.selectionTips,
  storageMethod: ingredient.storageMethod,
  taboo: ingredient.taboo,
  detailImages: Array.isArray(ingredient.detailImages) ? ingredient.detailImages.filter((item): item is string => typeof item === 'string') : [],
  selectionMedia: ingredient.selectionMedia ?? null,
  currentPrice: ingredient.currentPrice,
  priceUnit: ingredient.priceUnit,
  priceSource: ingredient.priceSource,
  isPublish: ingredient.isPublish,
  isRecommend: ingredient.isRecommend,
  status: ingredient.status,
  sort: ingredient.sort
});

const toPayload = (draft: Draft) => ({
  name: draft.name.trim(),
  coverUrl: draft.coverUrl?.trim() ? draft.coverUrl.trim() : null,
  categoryId: draft.categoryId,
  seasonMonth: draft.seasonMonth?.trim() ? draft.seasonMonth.trim() : null,
  nutrition: draft.nutrition?.trim() ? draft.nutrition.trim() : null,
  selectionTips: draft.selectionTips?.trim() ? draft.selectionTips.trim() : null,
  storageMethod: draft.storageMethod?.trim() ? draft.storageMethod.trim() : null,
  taboo: draft.taboo?.trim() ? draft.taboo.trim() : null,
  detailImages: draft.detailImages,
  selectionMedia: draft.selectionMedia,
  currentPrice: draft.currentPrice,
  priceUnit: draft.priceUnit?.trim() ? draft.priceUnit.trim() : null,
  priceSource: draft.priceSource?.trim() ? draft.priceSource.trim() : null,
  isPublish: draft.isPublish,
  isRecommend: draft.isRecommend,
  status: draft.status,
  sort: draft.sort
});

const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);
const unitOptions = ['斤', '500g', 'kg', '个', '份'];
const createTypeLabelMap: Record<string, string> = {
  vegetable: '蔬菜',
  fruit: '水果',
  poultry: '生禽',
  aquatic: '水产',
  seasoning: '调料'
};

const formProfiles: Record<string, {
  description: string;
  nameLabel: string;
  coverLabel: string;
  detailImagesLabel: string;
  guideMediaLabel: string;
  nutritionLabel: string;
  selectionLabel: string;
  storageLabel: string;
  tabooLabel: string;
  showSeason: boolean;
  unitOptions: string[];
}> = {
  蔬菜: {
    description: '维护蔬菜分类、时令月份、营养、挑选技巧、保存方法和当前价格。',
    nameLabel: '蔬菜名称',
    coverLabel: '蔬菜封面图片',
    detailImagesLabel: '蔬菜详情图',
    guideMediaLabel: '挑选指南图片/视频',
    nutritionLabel: '营养信息',
    selectionLabel: '挑选技巧',
    storageLabel: '保存方法',
    tabooLabel: '食用禁忌',
    showSeason: true,
    unitOptions
  },
  水果: {
    description: '维护水果时令、营养、挑选技巧、保存方法、食用禁忌和价格。',
    nameLabel: '水果名称',
    coverLabel: '水果封面图片',
    detailImagesLabel: '水果详情图',
    guideMediaLabel: '挑选/食用指南图片视频',
    nutritionLabel: '营养信息',
    selectionLabel: '挑选技巧',
    storageLabel: '保存方法',
    tabooLabel: '食用禁忌',
    showSeason: true,
    unitOptions: ['斤', '500g', 'kg', '个', '盒']
  },
  生禽: {
    description: '维护生禽食材的规格、适合做法、处理建议、保存方法和价格。',
    nameLabel: '生禽名称',
    coverLabel: '生禽封面图片',
    detailImagesLabel: '生禽详情图',
    guideMediaLabel: '处理指南图片/视频',
    nutritionLabel: '营养/部位说明',
    selectionLabel: '挑选与处理技巧',
    storageLabel: '冷藏/冷冻保存方法',
    tabooLabel: '处理禁忌',
    showSeason: true,
    unitOptions: ['斤', '500g', 'kg', '只', '份']
  },
  水产: {
    description: '维护水产食材的产地、鲜活状态、处理建议、保存方法和价格。',
    nameLabel: '水产名称',
    coverLabel: '水产封面图片',
    detailImagesLabel: '水产详情图',
    guideMediaLabel: '处理指南图片/视频',
    nutritionLabel: '营养/产地说明',
    selectionLabel: '鲜活挑选技巧',
    storageLabel: '保鲜/冷冻保存方法',
    tabooLabel: '食用禁忌',
    showSeason: true,
    unitOptions: ['斤', '500g', 'kg', '条', '份']
  },
  调料: {
    description: '维护调料说明、使用方法、适合菜品、替代调料、保存方法和价格。',
    nameLabel: '调料名称',
    coverLabel: '调料封面图片',
    detailImagesLabel: '调料详情图',
    guideMediaLabel: '使用指南图片/视频',
    nutritionLabel: '调料说明',
    selectionLabel: '使用方法 / 适合菜品',
    storageLabel: '保存方法',
    tabooLabel: '替代调料 / 注意事项',
    showSeason: false,
    unitOptions: ['瓶', '袋', '盒', 'g', 'ml']
  },
  食材: {
    description: '维护食材分类、时令、营养、挑选技巧、保存方法和当前价格。',
    nameLabel: '名称',
    coverLabel: '封面图片上传',
    detailImagesLabel: '食材详情图',
    guideMediaLabel: '挑选指南图片/视频',
    nutritionLabel: '营养信息',
    selectionLabel: '挑选技巧',
    storageLabel: '保存方法',
    tabooLabel: '食用禁忌',
    showSeason: true,
    unitOptions
  }
};

const categoryAliases: Record<string, string[]> = {
  蔬菜: ['蔬菜', '应季食材'],
  水果: ['水果'],
  生禽: ['生禽', '肉禽蛋'],
  水产: ['水产', '水产海鲜'],
  调料: ['调料']
};

const returnPathByTypeLabel: Record<string, string> = {
  水果: '/content/fruits',
  调料: '/content/seasonings',
  食材: '/content/ingredients',
  蔬菜: '/content/ingredients',
  生禽: '/content/ingredients',
  水产: '/content/ingredients'
};

const listLabelByTypeLabel: Record<string, string> = {
  水果: '水果管理',
  调料: '调料管理',
  食材: '食材管理',
  蔬菜: '食材管理',
  生禽: '食材管理',
  水产: '食材管理'
};

const parseMonths = (value: string | null) =>
  (value ?? '')
    .split(/[,，/\s]+/)
    .map((month) => Number(month))
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12);

type Props = {
  mode: IngredientFormMode;
  forcedCreateType?: string;
};

export const IngredientFormPage = ({ mode, forcedCreateType }: Props) => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const id = params.id ?? '';
  const createType = forcedCreateType ?? searchParams.get('type') ?? '';
  const createTypeLabel = createTypeLabelMap[createType] ?? '食材';

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectionGuideGroups, setSelectionGuideGroups] = useState<SelectionGuideGroup[]>(() => [createSelectionGuideGroup()]);
  const categoryLabel = categories.find((category) => category.id === draft.categoryId)?.name;
  const effectiveTypeLabel = mode === 'edit' ? categoryLabel ?? createTypeLabel : createTypeLabel;
  const formProfile = formProfiles[effectiveTypeLabel] ?? formProfiles.食材;
  const returnPath = returnPathByTypeLabel[effectiveTypeLabel] ?? '/content/ingredients';
  const listLabel = listLabelByTypeLabel[effectiveTypeLabel] ?? '食材管理';
  const showSelectionGuide = effectiveTypeLabel === '食材' || effectiveTypeLabel === '水果';
  const allowedCategories = useMemo(() => {
    if (effectiveTypeLabel === '食材') return categories;
    const aliases = categoryAliases[effectiveTypeLabel] ?? [effectiveTypeLabel];
    return categories.filter((category) =>
      aliases.includes(category.name) || aliases.some((alias) => category.name.includes(alias))
    );
  }, [categories, effectiveTypeLabel]);

  const canSave = useMemo(() => draft.name.trim().length > 0 && draft.categoryId !== null && !saving, [draft.categoryId, draft.name, saving]);

  useEffect(() => {
    if (loading || mode !== 'create' || !allowedCategories.length) return;
    const currentAllowed = allowedCategories.some((category) => category.id === draft.categoryId);
    if (!currentAllowed) setDraft((current) => ({ ...current, categoryId: allowedCategories[0].id }));
  }, [allowedCategories, draft.categoryId, loading, mode]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [categoryResult, ingredient] = await Promise.all([
          ensureDefaultIngredientCategories(),
          mode === 'edit' && id ? getIngredient(id) : Promise.resolve(null)
        ]);
        if (!alive) return;
        setCategories(categoryResult.list);
        if (ingredient) setDraft(ingredientToDraft(ingredient));
        else if (mode === 'create' && createTypeLabelMap[createType]) {
          const matchedCategory = categoryResult.list.find((category) => category.name === createTypeLabelMap[createType]);
          if (matchedCategory) setDraft({ ...emptyDraft, categoryId: matchedCategory.id });
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
  }, [createType, id, mode]);

  const handleSave = async (overrides: Partial<Draft> = {}) => {
    const nextDraft = { ...draft, ...overrides };
    if (nextDraft.name.trim().length === 0 || nextDraft.categoryId === null || saving) return;
    if (nextDraft.currentPrice !== null && !Number.isFinite(nextDraft.currentPrice)) {
      setError('当前价格必须是数字');
      return;
    }
    if (!Number.isFinite(nextDraft.sort)) {
      setError('排序必须是数字');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(nextDraft);
      await (mode === 'edit' && id ? updateIngredient(id, payload) : createIngredient(payload));
      setNotice(nextDraft.isPublish ? '保存并发布成功' : '草稿已保存');
      window.setTimeout(() => navigate(returnPath, { replace: true }), 350);
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
          <h1 className="mt-2 text-3xl font-semibold text-[#2f2f2f]">{mode === 'edit' ? `编辑${effectiveTypeLabel}` : `新增${effectiveTypeLabel}`}</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">{formProfile.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(returnPath)}>
            取消
          </Button>
          <Button variant="ghost" disabled={saving} onClick={() => void handleSave({ isPublish: false, status: 'DISABLED' })}>
            {saving ? '保存中...' : '保存草稿'}
          </Button>
          <Button disabled={!canSave} onClick={() => void handleSave({ isPublish: true, status: 'ACTIVE' })}>
            {saving ? '保存中...' : '保存并发布'}
          </Button>
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
              <NumberedSection number={1} title="基础信息" className="2xl:col-span-1">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label={`${formProfile.nameLabel} *`}><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="请输入食材名称" /></Field>
                  <Field label="别名（可选）"><Input value={draft.priceSource ?? ''} onChange={(event) => setDraft({ ...draft, priceSource: event.target.value })} placeholder="如：西红柿、番茄" /></Field>
                  <Field label="分类 *">
                    <select value={draft.categoryId ?? ''} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value || null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                      <option value="">请选择食材分类</option>
                      {allowedCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </Field>
                  <Field label="食材类型">
                    <div className="flex h-10 flex-wrap items-center gap-3 text-sm text-[#2f2f2f]">
                      {['蔬菜', '肉类', '水产', '豆制品', '谷物', '其他'].map((type) => <label key={type} className="flex items-center gap-1.5"><input type="radio" checked={(categoryLabel ?? effectiveTypeLabel).includes(type) || (type === '蔬菜' && effectiveTypeLabel === '食材')} readOnly />{type}</label>)}
                    </div>
                  </Field>
                  <Field label="产地（可选）"><Input placeholder="如：山东寿光、海南三亚" /></Field>
                  {formProfile.showSeason ? (
                    <Field label="时令月份">
                      <MonthButtons value={draft.seasonMonth} onChange={(seasonMonth) => setDraft({ ...draft, seasonMonth })} />
                    </Field>
                  ) : null}
                  <Field label="关键词（可选，最多5个）"><Input value={draft.selectionTips ?? ''} onChange={(event) => setDraft({ ...draft, selectionTips: event.target.value })} placeholder="如：低脂、维生素C、抗氧化" /></Field>
                  <Field label="简介（可选）"><textarea value={draft.nutrition ?? ''} onChange={(event) => setDraft({ ...draft, nutrition: event.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" placeholder="简单介绍食材的特点、口感、常见用途等..." /></Field>
                </div>
              </NumberedSection>

              <NumberedSection number={2} title="封面与图片">
                <IngredientMediaSection
                  coverUrl={draft.coverUrl}
                  images={draft.detailImages}
                  video={draft.selectionMedia}
                  onCoverChange={(coverUrl) => setDraft({ ...draft, coverUrl })}
                  onImagesChange={(detailImages) => setDraft({ ...draft, detailImages })}
                  onVideoChange={(selectionMedia) => setDraft({ ...draft, selectionMedia })}
                />
              </NumberedSection>

              <NumberedSection number={3} title="营养成分（每100g，可选）">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field label="热量 kcal"><Input type="number" value={draft.currentPrice ?? ''} onChange={(event) => setDraft({ ...draft, currentPrice: event.target.value === '' ? null : Number(event.target.value) })} placeholder="如：20" /></Field>
                  <Field label="蛋白质 g"><Input placeholder="如：1.0" /></Field>
                  <Field label="脂肪 g"><Input placeholder="如：0.2" /></Field>
                  <Field label="碳水化合物 g"><Input placeholder="如：3.5" /></Field>
                  <Field label="膳食纤维 g"><Input placeholder="如：1.2" /></Field>
                  <Field label="钠 mg"><Input placeholder="如：12" /></Field>
                  <Field label="维生素"><Input placeholder="如：VC 15mg" /></Field>
                  <Field label="矿物质"><Input placeholder="如：钾 200mg" /></Field>
                  <button type="button" onClick={() => setNotice('自定义营养项入口已预留')} className="mt-6 text-left text-sm font-medium text-[#6f8b62]">＋ 添加自定义营养项</button>
                </div>
              </NumberedSection>

              <NumberedSection number={4} title="储存与处理">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="储存方式">
                    <select value={draft.storageMethod ?? ''} onChange={(event) => setDraft({ ...draft, storageMethod: event.target.value || null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                      <option value="">请选择储存方式</option>
                      <option value="常温保存">常温保存</option>
                      <option value="冷藏保存">冷藏保存</option>
                      <option value="冷冻保存">冷冻保存</option>
                      <option value="阴凉干燥">阴凉干燥</option>
                    </select>
                  </Field>
                  <Field label="保存期限"><Input placeholder="如：3-7天" /></Field>
                  <Field label="处理建议（可选）" className="md:col-span-2"><textarea value={draft.storageMethod ?? ''} onChange={(event) => setDraft({ ...draft, storageMethod: event.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" placeholder="清洗、去皮、切配等处理建议..." /></Field>
                  <Field label="不宜人群（可选）" className="md:col-span-2"><Input value={draft.taboo ?? ''} onChange={(event) => setDraft({ ...draft, taboo: event.target.value })} placeholder="如：脾胃虚寒者慎食等..." /></Field>
                </div>
              </NumberedSection>

              {showSelectionGuide ? (
                <NumberedSection number={5} title="挑选指南" className="2xl:col-span-2">
                  <SelectionGuideSection groups={selectionGuideGroups} onChange={setSelectionGuideGroups} />
                </NumberedSection>
              ) : null}

              <NumberedSection number={showSelectionGuide ? 6 : 5} title="其他信息" className="2xl:col-span-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="适用场景（可多选）" className="md:col-span-2">
                    <div className="flex flex-wrap gap-4 text-sm text-[#2f2f2f]">
                      {['家常烹饪', '烘焙甜品', '减脂健身', '宝宝辅食', '素食', '宴客', '其他'].map((scene) => <label key={scene} className="flex items-center gap-2"><input type="checkbox" />{scene}</label>)}
                    </div>
                  </Field>
                  <Field label="排序"><Input type="number" value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: Number(event.target.value) })} /></Field>
                  <Field label="推荐搭配食材（可多选）"><Input placeholder="请选择或搜索食材" /></Field>
                  <Field label="价格单位">
                    <select value={draft.priceUnit ?? ''} onChange={(event) => setDraft({ ...draft, priceUnit: event.target.value || null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                      <option value="">请选择单位</option>
                      {formProfile.unitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </Field>
                  <Field label="状态">
                    <div className="flex h-10 items-center gap-5 text-sm text-[#2f2f2f]">
                      <label className="flex items-center gap-2"><input type="radio" checked={draft.status === 'ACTIVE'} onChange={() => setDraft({ ...draft, status: 'ACTIVE', isPublish: true })} />启用</label>
                      <label className="flex items-center gap-2"><input type="radio" checked={draft.status === 'DISABLED'} onChange={() => setDraft({ ...draft, status: 'DISABLED', isPublish: false })} />禁用</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={draft.isRecommend} onChange={(event) => setDraft({ ...draft, isRecommend: event.target.checked })} />推荐</label>
                    </div>
                  </Field>
                </div>
              </NumberedSection>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
              <IngredientPreview draft={draft} categoryName={categoryLabel ?? effectiveTypeLabel} />
              <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
                <h2 className="text-lg font-semibold text-[#2f2f2f]">发布提示</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[#6f6a61]">
                  <li>• 发布后该食材将可被菜谱、专题、用户搜索引用</li>
                  <li>• 请确保信息准确、图片清晰、说明完整</li>
                  <li>• 分类与标签会影响搜索与推荐效果</li>
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

const SelectionGuideSection = ({ groups, onChange }: { groups: SelectionGuideGroup[]; onChange: (groups: SelectionGuideGroup[]) => void }) => {
  const updateGroup = (groupIndex: number, patch: Partial<SelectionGuideGroup>) => {
    onChange(groups.map((group, index) => index === groupIndex ? { ...group, ...patch } : group));
  };

  const updateItem = (groupIndex: number, itemIndex: number, patch: Partial<SelectionGuideItem>) => {
    onChange(groups.map((group, index) => {
      if (index !== groupIndex) return group;
      return {
        ...group,
        items: group.items.map((item, currentItemIndex) => currentItemIndex === itemIndex ? { ...item, ...patch } : item)
      };
    }));
  };

  const addItem = (groupIndex: number) => {
    onChange(groups.map((group, index) => index === groupIndex ? { ...group, items: [...group.items, createSelectionGuideItem(group.items.length + 1)] } : group));
  };

  const removeItem = (groupIndex: number, itemIndex: number) => {
    onChange(groups.map((group, index) => {
      if (index !== groupIndex) return group;
      const nextItems = group.items.filter((_, currentItemIndex) => currentItemIndex !== itemIndex);
      return { ...group, items: nextItems.length ? nextItems : [createSelectionGuideItem()] };
    }));
  };

  const addGroup = () => {
    onChange([...groups, createSelectionGuideGroup(`分组 ${groups.length + 1}`)]);
  };

  const removeGroup = (groupIndex: number) => {
    const nextGroups = groups.filter((_, index) => index !== groupIndex);
    onChange(nextGroups.length ? nextGroups : [createSelectionGuideGroup()]);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#8c8c8c]">按分组组织挑选要点，帮助用户快速整理挑选技巧。</p>
      {groups.map((group, groupIndex) => (
        <div key={group.id} className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input value={group.name} onChange={(event) => updateGroup(groupIndex, { name: event.target.value })} placeholder="分组名称，如：外观" className="md:max-w-sm" />
            <button type="button" onClick={() => removeGroup(groupIndex)} className="self-start rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-50 md:self-auto">删除分组</button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#eee7dc]">
            <div className="grid grid-cols-[64px_minmax(0,1fr)_minmax(0,1.6fr)_150px_92px] gap-3 border-b border-[#eee7dc] bg-[#faf7f1] px-4 py-3 text-sm font-semibold text-[#6f6a61]">
              <span />
              <span>挑选小标题</span>
              <span>挑选说明</span>
              <span>配图</span>
              <span>操作</span>
            </div>
            {group.items.map((item, itemIndex) => (
              <div key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)_minmax(0,1.6fr)_150px_92px] items-center gap-3 border-b border-[#f1ece4] px-4 py-4 last:border-b-0">
                <div className="text-center text-lg font-semibold text-[#2f2f2f]">{itemIndex + 1}</div>
                <Input value={item.title} onChange={(event) => updateItem(groupIndex, itemIndex, { title: event.target.value })} placeholder="如：看大小形状" />
                <textarea
                  value={item.description}
                  onChange={(event) => updateItem(groupIndex, itemIndex, { description: event.target.value })}
                  className="min-h-20 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#7a8b6f]"
                  placeholder="输入挑选说明"
                />
                <SelectionGuideImageUpload value={item.image} onChange={(image) => updateItem(groupIndex, itemIndex, { image })} />
                <button type="button" onClick={() => removeItem(groupIndex, itemIndex)} className="h-10 rounded-xl bg-red-500 px-3 text-sm font-semibold text-white transition hover:bg-red-600">删除</button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addItem(groupIndex)}
            className="mt-4 rounded-xl border border-dashed border-[#cfc6b8] bg-white px-4 py-2 text-sm font-semibold text-[#6f8b62] transition hover:border-[#6f8b62] hover:bg-[#edf5ea]"
          >
            ＋ 新增挑选项
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addGroup}
        className="rounded-xl border border-dashed border-[#cfc6b8] bg-white px-5 py-2.5 text-sm font-semibold text-[#6f8b62] transition hover:border-[#6f8b62] hover:bg-[#edf5ea]"
      >
        ＋ 新增分组
      </button>
    </div>
  );
};

const SelectionGuideImageUpload = ({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const previewUrl = resolveAssetUrl(value);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      if (uploaded.type === 'image') onChange(uploaded.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void handleFile(event)} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex h-16 w-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#d8cebe] bg-[#f5f1ea] text-xl text-[#6f8b62] transition hover:border-[#6f8b62]"
      >
        {previewUrl ? <img src={previewUrl} alt="挑选指南配图" className="absolute inset-0 h-full w-full object-cover" /> : null}
        <span className={previewUrl ? 'relative rounded-full bg-black/50 px-2 py-0.5 text-xs text-white' : ''}>{uploading ? '上传中' : previewUrl ? '更换' : '+'}</span>
      </button>
      {value ? <button type="button" onClick={() => onChange(null)} className="mt-1 text-xs text-red-500">删除图片</button> : null}
    </div>
  );
};

const computeSeason = (months: number[]): string => {
  if (months.length === 0) return '';
  const spring = months.filter(m => m >= 3 && m <= 5).length;
  const summer = months.filter(m => m >= 6 && m <= 8).length;
  const autumn = months.filter(m => m >= 9 && m <= 11).length;
  const winter = months.filter(m => m === 12 || m === 1 || m === 2).length;
  const parts = [];
  if (spring > 0) parts.push('春季');
  if (summer > 0) parts.push('夏季');
  if (autumn > 0) parts.push('秋季');
  if (winter > 0) parts.push('冬季');
  return parts.join('·');
};

const MonthButtons = ({ value, onChange }: { value: string | null; onChange: (value: string | null) => void }) => {
  const selectedMonths = parseMonths(value);
  const toggleMonth = (month: number) => {
    const set = new Set(selectedMonths);
    if (set.has(month)) set.delete(month); else set.add(month);
    const arr = Array.from(set).sort((a, b) => a - b);
    onChange(arr.length ? arr.join(',') : null);
  };
  const season = computeSeason(selectedMonths);
  return (
    <div>
      <div className="grid grid-cols-6 gap-2">
        {monthOptions.map((month) => {
          const active = selectedMonths.includes(month);
          return (
            <button
              key={month}
              type="button"
              onClick={() => toggleMonth(month)}
              className={['h-10 rounded-lg border text-sm transition', active ? 'border-[#6f8b62] bg-[#edf5ea] text-[#6f8b62]' : 'border-zinc-200 bg-white text-[#6f6a61] hover:border-[#6f8b62]'].join(' ')}
            >
              {month}月
            </button>
          );
        })}
      </div>
      {season ? <div className="mt-3 text-xs text-[#8c8c8c]">根据所选月份自动判定季节：<span className="font-medium text-[#6f8b62]">{season}</span></div> : null}
    </div>
  );
};

const IngredientMediaSection = ({
  coverUrl,
  images,
  video,
  onCoverChange,
  onImagesChange,
  onVideoChange
}: {
  coverUrl: string | null;
  images: string[];
  video: string | null;
  onCoverChange: (url: string | null) => void;
  onImagesChange: (urls: string[]) => void;
  onVideoChange: (url: string | null) => void;
}) => {
  return (
    <div className="space-y-5">
      <ImageEditorUploader coverUrl={coverUrl} images={images} max={8} onCoverChange={onCoverChange} onImagesChange={onImagesChange} />
      <div>
        <div className="mb-2 text-xs font-medium text-[#6f6a61]">视频（可选）</div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Input value={video ?? ''} onChange={(event) => onVideoChange(event.target.value || null)} placeholder="粘贴视频链接或上传视频文件" />
          <UploadVideoButton onUploaded={onVideoChange} />
        </div>
      </div>
    </div>
  );
};

const UploadVideoButton = ({ onUploaded }: { onUploaded: (url: string | null) => void }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      if (uploaded.type === 'video') onUploaded(uploaded.url);
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

const IngredientPreview = ({ draft, categoryName }: { draft: Draft; categoryName: string }) => {
  const imageUrl = resolveAssetUrl(draft.coverUrl);
  const related = draft.detailImages.slice(0, 3);
  return (
    <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#2f2f2f]">内容预览</h2>
        <button type="button" className="rounded-xl border border-[#e9e2d6] bg-white px-3 py-1.5 text-xs text-[#6f8b62]">刷新预览</button>
      </div>
      <div className="overflow-hidden rounded-[28px] border-[10px] border-[#232323] bg-white">
        <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-[#2f2f2f]"><span>9:41</span><span>•••</span></div>
        <div className="h-40 bg-[#f5f1ea]">{imageUrl ? <img src={imageUrl} alt={draft.name || '食材封面'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-[#8c8c8c]">封面预览</div>}</div>
        <div className="space-y-4 p-4">
          <h3 className="text-xl font-semibold text-[#2f2f2f]">{draft.name || '西红柿'}</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {[categoryName, '家常烹饪', draft.isRecommend ? '推荐' : '低脂'].map((tag) => <span key={tag} className="rounded-full bg-[#edf5ea] px-2.5 py-1 text-[#6f8b62]">{tag}</span>)}
          </div>
          <p className="text-sm leading-6 text-[#6f6a61]">{draft.nutrition || '口感酸甜多汁，适合多种食用方式，是家常菜中常见的食材。'}</p>
          <div className="grid grid-cols-4 gap-2 border-y border-[#f1ece4] py-3 text-center text-xs text-[#6f6a61]">
            <InfoStat value={draft.currentPrice ? String(draft.currentPrice) : '20'} label="kcal" />
            <InfoStat value="1.0g" label="蛋白质" />
            <InfoStat value="0.2g" label="脂肪" />
            <InfoStat value="3.5g" label="碳水" />
          </div>
          <PreviewBlock title="储存建议" text={draft.storageMethod || '冷藏保存，尽快食用。'} />
          <PreviewBlock title="常见做法" text={draft.selectionTips || '番茄炒蛋、番茄汤、沙拉。'} />
          <div>
            <div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-semibold text-[#2f2f2f]">相关菜谱</h4><span className="text-xs text-[#6f8b62]">查看全部</span></div>
            <div className="grid grid-cols-3 gap-2">
              {(related.length ? related : [null, null, null]).map((url, index) => {
                const src = resolveAssetUrl(url);
                return <div key={index} className="h-14 overflow-hidden rounded-lg bg-[#f5f1ea]">{src ? <img src={src} alt="相关菜谱" className="h-full w-full object-cover" /> : null}</div>;
              })}
            </div>
          </div>
          <button type="button" className="h-11 w-full rounded-xl bg-[#6f8b62] text-sm font-semibold text-white">加入菜篮子</button>
        </div>
      </div>
    </div>
  );
};

const InfoStat = ({ value, label }: { value: string; label: string }) => <div><div className="font-semibold text-[#2f2f2f]">{value}</div><div>{label}</div></div>;
const PreviewBlock = ({ title, text }: { title: string; text: string }) => <div><h4 className="mb-1 text-sm font-semibold text-[#2f2f2f]">{title}</h4><p className="text-sm leading-6 text-[#6f6a61]">{text}</p></div>;
