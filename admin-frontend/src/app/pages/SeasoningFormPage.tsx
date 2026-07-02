import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  createIngredient,
  getIngredient,
  listCategories,
  resolveAssetUrl,
  updateIngredient,
  uploadMedia
} from '../api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import type { Ingredient, IngredientCategory } from '../types';

export type PriceRecordItem = {
  id: string;
  date: string;
  region: string;
  price: number;
  unit: string;
  source: string;
};

export type Draft = {
  // 1. 基础信息
  seasoningName: string;
  alias: string | null;
  englishName: string | null;
  pinyin: string | null;
  categoryId: string | null;
  seasoningType: string; // 基础调味, 酱料, 香辛料, 油脂, 腌料, 复合调料, 其他
  unit: string;
  origin: string | null;
  brand: string | null;
  specification: string | null;
  tags: string[];
  description: string | null;

  // 2. 封面与图片
  coverImage: string | null;
  imageList: string[];
  imageDescription: string | null;
  videoUrl: string | null;

  // 3. 使用与属性
  flavor: string | null;
  taste: string | null;
  applicableCuisine: string | null;
  applicableCookingMethods: string | null;
  pairedIngredients: string | null;
  usageSuggestion: string | null;
  dosageSuggestion: string | null;
  purchaseTips: string | null;
  storageMethod: string | null;
  storageDuration: string | null;
  notice: string | null;
  showUsageInfo: boolean;

  // 4. 价格信息
  estimatedPrice: number | null;
  priceUnit: string | null;
  priceSource: string | null;
  priceUpdateTime: string | null;
  showPrice: boolean;
  showPriceTrend: boolean;
  priceRemark: string | null;
  priceRecords: PriceRecordItem[];

  // 5. 发布设置
  frontendVisible: boolean;
  recommended: boolean;
  sort: number;
  contentType: 'SEASONING';
  publishStatus: 'ACTIVE' | 'DISABLED';
  publishTime: string | null;
  creator: string;
  createdAt?: string;
  updatedAt?: string;
  seasoningCode?: string | null;
  id?: string | null;
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyDraft: Draft = {
  seasoningName: '',
  alias: null,
  englishName: null,
  pinyin: null,
  categoryId: null,
  seasoningType: '基础调味',
  unit: 'g',
  origin: null,
  brand: null,
  specification: null,
  tags: [],
  description: null,

  coverImage: null,
  imageList: [],
  imageDescription: null,
  videoUrl: null,

  flavor: null,
  taste: null,
  applicableCuisine: null,
  applicableCookingMethods: null,
  pairedIngredients: null,
  usageSuggestion: null,
  dosageSuggestion: null,
  purchaseTips: null,
  storageMethod: null,
  storageDuration: null,
  notice: null,
  showUsageInfo: true,

  estimatedPrice: null,
  priceUnit: '瓶',
  priceSource: null,
  priceUpdateTime: null,
  showPrice: true,
  showPriceTrend: true,
  priceRemark: null,
  priceRecords: [],

  frontendVisible: true,
  recommended: false,
  sort: 0,
  contentType: 'SEASONING',
  publishStatus: 'ACTIVE',
  publishTime: null,
  creator: '管理员'
};

const TABS = [
  '基础信息',
  '封面与图片',
  '使用与属性',
  '价格信息',
  '发布设置'
];

const seasoningTypeOptions = [
  '基础调味',
  '酱料',
  '香辛料',
  '油脂',
  '腌料',
  '复合调料',
  '其他'
];

const Field = ({ label, children, desc }: { label: string; children: ReactNode; desc?: string }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-[#6f6a61]">{label}</label>
      {desc && <span className="text-[11px] text-[#B7AEA1] font-normal">{desc}</span>}
    </div>
    {children}
  </div>
);

const serializeDraftToPayload = (draft: Draft) => {
  const selectionTipsData = {
    alias: draft.alias,
    englishName: draft.englishName,
    pinyin: draft.pinyin,
    seasoningType: draft.seasoningType,
    unit: draft.unit,
    origin: draft.origin,
    brand: draft.brand,
    specification: draft.specification,
    tags: draft.tags,
    description: draft.description
  };

  const storageMethodData = {
    flavor: draft.flavor,
    taste: draft.taste,
    applicableCuisine: draft.applicableCuisine,
    applicableCookingMethods: draft.applicableCookingMethods,
    pairedIngredients: draft.pairedIngredients,
    usageSuggestion: draft.usageSuggestion,
    dosageSuggestion: draft.dosageSuggestion,
    purchaseTips: draft.purchaseTips,
    storageMethod: draft.storageMethod,
    storageDuration: draft.storageDuration,
    notice: draft.notice,
    showUsageInfo: draft.showUsageInfo
  };

  const tabooData = {
    imageDescription: draft.imageDescription,
    publishTime: draft.publishTime,
    priceInfo: {
      estimatedPrice: draft.estimatedPrice,
      priceUnit: draft.priceUnit,
      priceSource: draft.priceSource,
      priceUpdateTime: draft.priceUpdateTime,
      showPrice: draft.showPrice,
      showPriceTrend: draft.showPriceTrend,
      priceRemark: draft.priceRemark,
      priceRecords: draft.priceRecords
    }
  };

  return {
    name: draft.seasoningName.trim(),
    coverUrl: draft.coverImage,
    categoryId: draft.categoryId,
    seasonMonth: null,
    nutrition: '',
    selectionTips: JSON.stringify(selectionTipsData),
    storageMethod: JSON.stringify(storageMethodData),
    taboo: JSON.stringify(tabooData),
    detailImages: draft.imageList,
    selectionMedia: draft.videoUrl,
    currentPrice: draft.estimatedPrice,
    priceUnit: draft.priceUnit,
    priceSource: draft.priceSource,
    isPublish: draft.frontendVisible,
    isRecommend: draft.recommended,
    status: draft.publishStatus,
    sort: draft.sort
  };
};

const deserializePayloadToDraft = (ingredient: Ingredient): Draft => {
  let selectionTipsObj: any = {};
  try {
    if (ingredient.selectionTips && ingredient.selectionTips.startsWith('{')) {
      selectionTipsObj = JSON.parse(ingredient.selectionTips);
    }
  } catch (e) {
    console.error('Failed to parse selectionTips:', e);
  }

  let storageMethodObj: any = {};
  try {
    if (ingredient.storageMethod && ingredient.storageMethod.startsWith('{')) {
      storageMethodObj = JSON.parse(ingredient.storageMethod);
    }
  } catch (e) {
    console.error('Failed to parse storageMethod:', e);
  }

  let tabooObj: any = {};
  try {
    if (ingredient.taboo && ingredient.taboo.startsWith('{')) {
      tabooObj = JSON.parse(ingredient.taboo);
    }
  } catch (e) {
    console.error('Failed to parse taboo:', e);
  }

  const priceInfo = tabooObj.priceInfo || {};

  return {
    seasoningName: ingredient.name,
    alias: selectionTipsObj.alias ?? null,
    englishName: selectionTipsObj.englishName ?? null,
    pinyin: selectionTipsObj.pinyin ?? null,
    categoryId: ingredient.categoryId,
    seasoningType: selectionTipsObj.seasoningType ?? '基础调味',
    unit: selectionTipsObj.unit ?? ingredient.priceUnit ?? 'g',
    origin: selectionTipsObj.origin ?? null,
    brand: selectionTipsObj.brand ?? null,
    specification: selectionTipsObj.specification ?? null,
    tags: Array.isArray(selectionTipsObj.tags) ? selectionTipsObj.tags : [],
    description: selectionTipsObj.description ?? (ingredient.nutrition && !ingredient.nutrition.startsWith('{') ? ingredient.nutrition : null),

    coverImage: ingredient.cover,
    imageList: Array.isArray(ingredient.detailImages) ? ingredient.detailImages : [],
    imageDescription: tabooObj.imageDescription ?? null,
    videoUrl: ingredient.selectionMedia ?? null,

    flavor: storageMethodObj.flavor ?? null,
    taste: storageMethodObj.taste ?? null,
    applicableCuisine: storageMethodObj.applicableCuisine ?? null,
    applicableCookingMethods: storageMethodObj.applicableCookingMethods ?? null,
    pairedIngredients: storageMethodObj.pairedIngredients ?? null,
    usageSuggestion: storageMethodObj.usageSuggestion ?? null,
    dosageSuggestion: storageMethodObj.dosageSuggestion ?? null,
    purchaseTips: storageMethodObj.purchaseTips ?? null,
    storageMethod: storageMethodObj.storageMethod ?? ingredient.storageMethod ?? null,
    storageDuration: storageMethodObj.storageDuration ?? null,
    notice: storageMethodObj.notice ?? null,
    showUsageInfo: typeof storageMethodObj.showUsageInfo === 'boolean' ? storageMethodObj.showUsageInfo : true,

    estimatedPrice: ingredient.currentPrice,
    priceUnit: ingredient.priceUnit,
    priceSource: ingredient.priceSource,
    priceUpdateTime: priceInfo.priceUpdateTime ?? (ingredient.priceDate ? new Date(ingredient.priceDate).toISOString().split('T')[0] : null),
    showPrice: typeof priceInfo.showPrice === 'boolean' ? priceInfo.showPrice : true,
    showPriceTrend: typeof priceInfo.showPriceTrend === 'boolean' ? priceInfo.showPriceTrend : true,
    priceRemark: priceInfo.priceRemark ?? null,
    priceRecords: Array.isArray(priceInfo.priceRecords) ? priceInfo.priceRecords : [],

    frontendVisible: ingredient.isPublish,
    recommended: ingredient.isRecommend,
    sort: ingredient.sort,
    contentType: 'SEASONING',
    publishStatus: ingredient.status,
    publishTime: tabooObj.publishTime ?? null,
    creator: '管理员',
    createdAt: ingredient.createdAt,
    updatedAt: ingredient.updatedAt,
    seasoningCode: ingredient.code ?? null,
    id: ingredient.id
  };
};

type Props = { mode: 'create' | 'edit' };

export const SeasoningFormPage = ({ mode }: Props) => {
  const navigate = useNavigate();
  const params = useParams();
  const rawId = params.id;

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tabErrors, setTabErrors] = useState<boolean[]>([false, false, false, false, false]);

  // Temporary state for adding a price record
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newRecordRegion, setNewRecordRegion] = useState('');
  const [newRecordPrice, setNewRecordPrice] = useState('');
  const [newRecordUnit, setNewRecordUnit] = useState('瓶');
  const [newRecordSource, setNewRecordSource] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const [cats] = await Promise.all([
          listCategories({ page: 1, pageSize: 100, type: 'SEASONING', status: 'ACTIVE' })
        ]);
        if (!alive) return;
        setCategories(cats.list);

        if (mode === 'edit' && rawId) {
          const ingredient = await getIngredient(rawId);
          if (alive && ingredient) {
            setDraft(deserializePayloadToDraft(ingredient));
          }
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => { alive = false; };
  }, [rawId, mode]);

  const validateTab = (tabIdx: number, currentDraft: Draft): string[] => {
    const errs: string[] = [];
    if (tabIdx === 0) {
      if (!currentDraft.seasoningName.trim()) {
        errs.push('调料名称是必填项');
      }
      if (!currentDraft.categoryId) {
        errs.push('请选择调料分类');
      }
      if (!currentDraft.seasoningType) {
        errs.push('请选择调料类型');
      }
      if (!currentDraft.unit.trim()) {
        errs.push('计量单位是必填项');
      }
    } else if (tabIdx === 1) {
      if (!currentDraft.coverImage) {
        errs.push('请上传详情页封面图');
      }
    } else if (tabIdx === 3) {
      if (currentDraft.estimatedPrice === null || isNaN(currentDraft.estimatedPrice)) {
        errs.push('预计价格是必填项且必须为数字');
      }
      if (!currentDraft.priceUnit?.trim()) {
        errs.push('价格单位是必填项');
      }
    }
    return errs;
  };

  const handleTabClick = (idx: number) => {
    // Perform soft checks on current tab errors just for marking dots
    const currentErrors = [...tabErrors];
    for (let i = 0; i < TABS.length; i++) {
      currentErrors[i] = validateTab(i, draft).length > 0;
    }
    setTabErrors(currentErrors);
    setActiveTab(idx);
  };

  const handleNext = () => {
    const currentErrs = validateTab(activeTab, draft);
    if (currentErrs.length > 0) {
      setError(currentErrs.join('，'));
      const newTabErrors = [...tabErrors];
      newTabErrors[activeTab] = true;
      setTabErrors(newTabErrors);
      return;
    }
    setError(null);
    const newTabErrors = [...tabErrors];
    newTabErrors[activeTab] = false;
    setTabErrors(newTabErrors);
    if (activeTab < TABS.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };

  const handlePrev = () => {
    setError(null);
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadMedia(file);
      setDraft((d) => ({ ...d, coverImage: result.url }));
      setError(null);
    } catch (e) {
      setError('封面图片上传失败，请重试');
    }
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const currentImages = [...draft.imageList];
    const availableSlots = 8 - currentImages.length;
    if (availableSlots <= 0) {
      setError('图片集最多上传 8 张图');
      return;
    }

    try {
      const newUrls: string[] = [];
      for (const file of files.slice(0, availableSlots)) {
        const result = await uploadMedia(file);
        newUrls.push(result.url);
      }
      setDraft((d) => ({ ...d, imageList: [...currentImages, ...newUrls] }));
      setError(null);
    } catch (e) {
      setError('部分图片上传失败，请重试');
    }
  };

  const handleAddPriceRecord = () => {
    if (!newRecordDate || !newRecordPrice) {
      setError('价格记录的日期和价格为必填项');
      return;
    }
    const val = parseFloat(newRecordPrice);
    if (isNaN(val)) {
      setError('价格必须是有效的数值');
      return;
    }

    const newRec: PriceRecordItem = {
      id: createId(),
      date: newRecordDate,
      region: newRecordRegion || '全国',
      price: val,
      unit: newRecordUnit || '瓶',
      source: newRecordSource || '市场采购'
    };

    setDraft((d) => ({
      ...d,
      priceRecords: [...d.priceRecords, newRec]
    }));

    // Reset temporary states
    setNewRecordDate('');
    setNewRecordRegion('');
    setNewRecordPrice('');
    setNewRecordSource('');
    setError(null);
  };

  const handleRemovePriceRecord = (recId: string) => {
    setDraft((d) => ({
      ...d,
      priceRecords: d.priceRecords.filter((r) => r.id !== recId)
    }));
  };

  const performSave = async (isDraftMode: boolean) => {
    setError(null);
    setNotice(null);

    // Validate ALL tabs on save
    const allTabErrors = [false, false, false, false, false];
    let firstFailedTabIdx = -1;
    let allMessages: string[] = [];

    for (let i = 0; i < TABS.length; i++) {
      // In soft draft saving, we only validate the seasoning name
      if (isDraftMode && i > 0) continue;

      const tabErrs = validateTab(i, draft);
      if (tabErrs.length > 0) {
        allTabErrors[i] = true;
        allMessages = allMessages.concat(tabErrs);
        if (firstFailedTabIdx === -1) {
          firstFailedTabIdx = i;
        }
      }
    }

    setTabErrors(allTabErrors);

    if (allMessages.length > 0) {
      setError(`提交失败，存在未通过校验的项：${allMessages.join('，')}`);
      if (firstFailedTabIdx !== -1) {
        setActiveTab(firstFailedTabIdx);
      }
      return;
    }

    setSaving(true);
    try {
      const finalDraft = {
        ...draft,
        publishStatus: (isDraftMode ? 'DISABLED' : 'ACTIVE') as Draft['publishStatus'],
        frontendVisible: !isDraftMode
      };

      const payload = serializeDraftToPayload(finalDraft);

      if (mode === 'edit' && rawId) {
        await updateIngredient(rawId, payload);
      } else {
        await createIngredient(payload);
      }

      setNotice('保存成功');
      setTimeout(() => navigate('/content/seasonings', { replace: true }), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6 min-h-screen bg-[#FAF7F2] p-6 pb-24">
      <div className="flex items-center justify-between border-b border-zinc-200/60 pb-5">
        <PageHeader
          title={mode === 'edit' ? '编辑调料' : '新增调料'}
          description="维护调料的基础资料、属性规格、使用与属性描述、价格和发布信息"
        />
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/content/seasonings')}>
            取消
          </Button>
          <Button variant="ghost" disabled={saving} onClick={() => void performSave(true)}>
            保存草稿
          </Button>
          <Button disabled={saving} onClick={() => void performSave(false)}>
            {saving ? '保存中...' : '保存并发布'}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 font-bold hover:text-red-700">✕</button>
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-[#e9e2d6] bg-white p-12 text-center text-[#B7AEA1] text-sm">
          数据加载中...
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Tab 选项栏 */}
          <div className="overflow-x-auto rounded-2xl border border-[#e9e2d6] bg-white p-2">
            <nav className="flex space-x-1 min-w-[600px]">
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
          <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 shadow-sm min-h-[480px]">
            
            {/* Tab 1: 基础信息 */}
            {activeTab === 0 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">基础信息</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">输入调料的名称、类型和通用描述</p>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="调料名称 *">
                    <Input
                      value={draft.seasoningName}
                      onChange={(e) => setDraft({ ...draft, seasoningName: e.target.value })}
                      placeholder="请输入调料名称"
                      className="h-11"
                    />
                  </Field>
                  <Field label="别名">
                    <Input
                      value={draft.alias ?? ''}
                      onChange={(e) => setDraft({ ...draft, alias: e.target.value || null })}
                      placeholder="多个别名以逗号隔开"
                      className="h-11"
                    />
                  </Field>
                  <Field label="英文名 / 拼音">
                    <Input
                      value={draft.englishName ?? ''}
                      onChange={(e) => setDraft({ ...draft, englishName: e.target.value || null })}
                      placeholder="如 Soy Sauce / Shengchou"
                      className="h-11"
                    />
                  </Field>
                  <Field label="拼音">
                    <Input
                      value={draft.pinyin ?? ''}
                      onChange={(e) => setDraft({ ...draft, pinyin: e.target.value || null })}
                      placeholder="输入汉语拼音助记词"
                      className="h-11"
                    />
                  </Field>
                  <Field label="调料分类 *">
                    <select
                      value={draft.categoryId ?? ''}
                      onChange={(e) => setDraft({ ...draft, categoryId: e.target.value || null })}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none"
                    >
                      <option value="">请选择调料分类</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="调料类型 *">
                    <select
                      value={draft.seasoningType}
                      onChange={(e) => setDraft({ ...draft, seasoningType: e.target.value })}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none"
                    >
                      {seasoningTypeOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="计量单位 *">
                    <Input
                      value={draft.unit}
                      onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                      placeholder="如 g, ml, 汤匙"
                      className="h-11"
                    />
                  </Field>
                  <Field label="产地">
                    <Input
                      value={draft.origin ?? ''}
                      onChange={(e) => setDraft({ ...draft, origin: e.target.value || null })}
                      placeholder="如 四川郫县, 广东中山"
                      className="h-11"
                    />
                  </Field>
                  <Field label="品牌">
                    <Input
                      value={draft.brand ?? ''}
                      onChange={(e) => setDraft({ ...draft, brand: e.target.value || null })}
                      placeholder="如 海天, 李锦记"
                      className="h-11"
                    />
                  </Field>
                  <Field label="规格">
                    <Input
                      value={draft.specification ?? ''}
                      onChange={(e) => setDraft({ ...draft, specification: e.target.value || null })}
                      placeholder="如 500ml / 瓶, 200g / 袋"
                      className="h-11"
                    />
                  </Field>
                  <Field label="详情页标签" desc="逗号隔开">
                    <Input
                      value={draft.tags.join(', ')}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          tags: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        })
                      }
                      placeholder="如 必备调料, 提鲜, 辛辣"
                      className="h-11"
                    />
                  </Field>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#6f6a61]">简介 / 特色简述</label>
                  <textarea
                    value={draft.description ?? ''}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
                    placeholder="请输入关于此调料的简短介绍..."
                    className="w-full min-h-[100px] text-sm rounded-xl border border-zinc-200 bg-white p-3 outline-none focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62]"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: 封面与图片 */}
            {activeTab === 1 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">封面与图片</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">上传展示图片素材及视频链接</p>
                </div>

                {/* 封面上传区 */}
                <div>
                  <h4 className="text-sm font-semibold text-[#2f2f2f] mb-2">详情页封面图 *</h4>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                  {draft.coverImage ? (
                    <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-[#e9e2d6]">
                      <img
                        src={resolveAssetUrl(draft.coverImage)}
                        alt="封面图"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white/95 text-xs text-[#2f2f2f] px-3 py-1.5 rounded-full font-medium"
                        >
                          更换
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, coverImage: null }))}
                          className="bg-red-600 text-xs text-white px-3 py-1.5 rounded-full font-medium"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-44 h-44 border-2 border-dashed border-[#cfc6b8] bg-[#fdfbf7] hover:border-[#6f8b62] rounded-2xl flex flex-col items-center justify-center gap-2 text-[#6f8b62] transition"
                    >
                      <span className="text-3xl font-light">+</span>
                      <span className="text-xs">上传封面图</span>
                    </button>
                  )}
                </div>

                {/* 图片集 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-[#2f2f2f]">图片集 (最多8张)</h4>
                    <span className="text-xs text-[#B7AEA1]">{draft.imageList.length} / 8</span>
                  </div>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGalleryUpload}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {draft.imageList.map((img, idx) => (
                      <div key={img + idx} className="relative aspect-square rounded-2xl overflow-hidden border border-[#e9e2d6] group">
                        <img
                          src={resolveAssetUrl(img)}
                          alt={`图片集 ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              imageList: d.imageList.filter((_, i) => i !== idx)
                            }))
                          }
                          className="absolute top-2 right-2 hidden group-hover:flex bg-red-600 text-white rounded-full w-6 h-6 items-center justify-center hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {draft.imageList.length < 8 && (
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-[#cfc6b8] bg-[#fdfbf7] hover:border-[#6f8b62] rounded-2xl flex flex-col items-center justify-center gap-2 text-[#6f8b62] transition"
                      >
                        <span className="text-2xl font-light">+</span>
                        <span className="text-xs">上传图片</span>
                      </button>
                    )}
                  </div>
                </div>

                <Field label="图片说明 (可选)">
                  <Input
                    value={draft.imageDescription ?? ''}
                    onChange={(e) => setDraft({ ...draft, imageDescription: e.target.value || null })}
                    placeholder="输入图文介绍说明文字"
                    className="h-11"
                  />
                </Field>

                <Field label="视频播放链接 (可选)">
                  <Input
                    value={draft.videoUrl ?? ''}
                    onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value || null })}
                    placeholder="输入视频网络播放 URL 链接"
                    className="h-11"
                  />
                </Field>
              </div>
            )}

            {/* Tab 3: 使用与属性 */}
            {activeTab === 2 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">使用与属性</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">编辑调料的风味、烹饪建议与存储说明</p>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="风味特点">
                    <Input
                      value={draft.flavor ?? ''}
                      onChange={(e) => setDraft({ ...draft, flavor: e.target.value || null })}
                      placeholder="如 咸鲜、酸辣、浓郁、提香"
                      className="h-11"
                    />
                  </Field>
                  <Field label="口感 / 气味">
                    <Input
                      value={draft.taste ?? ''}
                      onChange={(e) => setDraft({ ...draft, taste: e.target.value || null })}
                      placeholder="如 质地粘稠、椒香扑鼻"
                      className="h-11"
                    />
                  </Field>
                  <Field label="适用菜系">
                    <Input
                      value={draft.applicableCuisine ?? ''}
                      onChange={(e) => setDraft({ ...draft, applicableCuisine: e.target.value || null })}
                      placeholder="如 川菜、粤菜、西餐"
                      className="h-11"
                    />
                  </Field>
                  <Field label="适用做法">
                    <Input
                      value={draft.applicableCookingMethods ?? ''}
                      onChange={(e) => setDraft({ ...draft, applicableCookingMethods: e.target.value || null })}
                      placeholder="如 红烧、凉拌、煲汤、腌制"
                      className="h-11"
                    />
                  </Field>
                  <Field label="适合搭配食材">
                    <Input
                      value={draft.pairedIngredients ?? ''}
                      onChange={(e) => setDraft({ ...draft, pairedIngredients: e.target.value || null })}
                      placeholder="如 鸡肉、海鲜、豆腐"
                      className="h-11"
                    />
                  </Field>
                  <Field label="用量建议">
                    <Input
                      value={draft.dosageSuggestion ?? ''}
                      onChange={(e) => setDraft({ ...draft, dosageSuggestion: e.target.value || null })}
                      placeholder="如 每500g食材建议使用 10-15ml"
                      className="h-11"
                    />
                  </Field>
                  <Field label="保存方式">
                    <Input
                      value={draft.storageMethod ?? ''}
                      onChange={(e) => setDraft({ ...draft, storageMethod: e.target.value || null })}
                      placeholder="如 阴凉避光，开封后冷藏"
                      className="h-11"
                    />
                  </Field>
                  <Field label="保存时长">
                    <Input
                      value={draft.storageDuration ?? ''}
                      onChange={(e) => setDraft({ ...draft, storageDuration: e.target.value || null })}
                      placeholder="如 12个月 / 开封后3个月"
                      className="h-11"
                    />
                  </Field>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#6f6a61]">使用建议</label>
                    <textarea
                      value={draft.usageSuggestion ?? ''}
                      onChange={(e) => setDraft({ ...draft, usageSuggestion: e.target.value || null })}
                      placeholder="如：出锅前沿锅边淋入可激发出最浓香气。"
                      className="w-full min-h-[80px] text-sm rounded-xl border border-zinc-200 bg-white p-3 outline-none focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#6f6a61]">选购提示</label>
                    <textarea
                      value={draft.purchaseTips ?? ''}
                      onChange={(e) => setDraft({ ...draft, purchaseTips: e.target.value || null })}
                      placeholder="如：看配料表，选用酿造酱油而非配制酱油。"
                      className="w-full min-h-[80px] text-sm rounded-xl border border-zinc-200 bg-white p-3 outline-none focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#6f6a61]">注意事项</label>
                    <textarea
                      value={draft.notice ?? ''}
                      onChange={(e) => setDraft({ ...draft, notice: e.target.value || null })}
                      placeholder="如：因含盐量高，高血压及低钠饮食人群需控量使用。"
                      className="w-full min-h-[80px] text-sm rounded-xl border border-zinc-200 bg-white p-3 outline-none focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showUsageInfo"
                    checked={draft.showUsageInfo}
                    onChange={(e) => setDraft({ ...draft, showUsageInfo: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-[#6f8b62] focus:ring-[#6f8b62]"
                  />
                  <label htmlFor="showUsageInfo" className="text-sm text-[#6f6a61] font-medium cursor-pointer">
                    在前端直接显示使用说明
                  </label>
                </div>
              </div>
            )}

            {/* Tab 4: 价格信息 */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">价格信息</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">配置此调料的预计售价、售价开关及价格历史曲线数据</p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="预计价格 *">
                    <Input
                      type="number"
                      value={draft.estimatedPrice ?? ''}
                      onChange={(e) => setDraft({ ...draft, estimatedPrice: e.target.value === '' ? null : Number(e.target.value) })}
                      placeholder="元"
                      className="h-11"
                    />
                  </Field>
                  <Field label="价格单位 *">
                    <Input
                      value={draft.priceUnit ?? ''}
                      onChange={(e) => setDraft({ ...draft, priceUnit: e.target.value })}
                      placeholder="如 瓶, 袋, 盒"
                      className="h-11"
                    />
                  </Field>
                  <Field label="价格来源">
                    <Input
                      value={draft.priceSource ?? ''}
                      onChange={(e) => setDraft({ ...draft, priceSource: e.target.value || null })}
                      placeholder="如 盒马鲜生, 大润发超市"
                      className="h-11"
                    />
                  </Field>
                  <Field label="更新时间">
                    <Input
                      type="date"
                      value={draft.priceUpdateTime ?? ''}
                      onChange={(e) => setDraft({ ...draft, priceUpdateTime: e.target.value || null })}
                      className="h-11"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showPrice"
                      checked={draft.showPrice}
                      onChange={(e) => setDraft({ ...draft, showPrice: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-[#6f8b62] focus:ring-[#6f8b62]"
                    />
                    <label htmlFor="showPrice" className="text-sm text-[#6f6a61] font-medium cursor-pointer">
                      在前端展示参考价
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showPriceTrend"
                      checked={draft.showPriceTrend}
                      onChange={(e) => setDraft({ ...draft, showPriceTrend: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-[#6f8b62] focus:ring-[#6f8b62]"
                    />
                    <label htmlFor="showPriceTrend" className="text-sm text-[#6f6a61] font-medium cursor-pointer">
                      在前端展示价格历史走向趋势图
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#6f6a61]">价格备注</label>
                  <textarea
                    value={draft.priceRemark ?? ''}
                    onChange={(e) => setDraft({ ...draft, priceRemark: e.target.value || null })}
                    placeholder="如：根据不同品牌和地区售价存在 2-5 元左右浮动。"
                    className="w-full min-h-[80px] text-sm rounded-xl border border-zinc-200 bg-white p-3 outline-none focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62]"
                  />
                </div>

                {/* 价格趋势数据表 */}
                <div className="border-t border-zinc-100 pt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-[#2f2f2f]">价格历史记录（用于走势图）</h4>
                  
                  {/* 新增纪录栏 */}
                  <div className="rounded-xl border border-[#e9e2d6] bg-[#fdfbf7] p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div>
                        <span className="block text-[11px] text-[#6f6a61] mb-1">记录日期 *</span>
                        <input
                          type="date"
                          value={newRecordDate}
                          onChange={(e) => setNewRecordDate(e.target.value)}
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#6f6a61] mb-1">采集地区</span>
                        <input
                          type="text"
                          value={newRecordRegion}
                          onChange={(e) => setNewRecordRegion(e.target.value)}
                          placeholder="全国 / 上海等"
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#6f6a61] mb-1">采集价格 (元) *</span>
                        <input
                          type="number"
                          value={newRecordPrice}
                          onChange={(e) => setNewRecordPrice(e.target.value)}
                          placeholder="￥ 8.5"
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#6f6a61] mb-1">价格单位</span>
                        <input
                          type="text"
                          value={newRecordUnit}
                          onChange={(e) => setNewRecordUnit(e.target.value)}
                          placeholder="瓶"
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#6f6a61] mb-1">价格来源</span>
                        <input
                          type="text"
                          value={newRecordSource}
                          onChange={(e) => setNewRecordSource(e.target.value)}
                          placeholder="如 菜市场/大润发"
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" onClick={handleAddPriceRecord}>
                        + 添加价格历史行
                      </Button>
                    </div>
                  </div>

                  {/* 历史行表格 */}
                  <div className="overflow-x-auto rounded-xl border border-zinc-150">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200">
                          <th className="p-3">采集日期</th>
                          <th className="p-3">采集地区</th>
                          <th className="p-3">价格</th>
                          <th className="p-3">价格单位</th>
                          <th className="p-3">价格来源</th>
                          <th className="p-3 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {draft.priceRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-zinc-400">
                              暂无历史价格走向记录，可以在上方配置后新增添加
                            </td>
                          </tr>
                        ) : (
                          draft.priceRecords.map((rec) => (
                            <tr key={rec.id} className="hover:bg-zinc-50/50">
                              <td className="p-3">{rec.date}</td>
                              <td className="p-3">{rec.region}</td>
                              <td className="p-3 font-medium text-zinc-800">￥{rec.price}</td>
                              <td className="p-3">{rec.unit}</td>
                              <td className="p-3 text-zinc-500">{rec.source}</td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePriceRecord(rec.id)}
                                  className="text-red-600 hover:text-red-800 font-medium"
                                >
                                  移除
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: 发布设置 */}
            {activeTab === 4 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">发布设置</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">设置此调料的前端上架展示状态、推荐优先级和记录元数据</p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="flex flex-col gap-3 justify-center">
                    <label className="flex items-center gap-2 text-sm text-[#6f6a61] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.frontendVisible}
                        onChange={(e) => setDraft({ ...draft, frontendVisible: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#6f8b62] focus:ring-[#6f8b62]"
                      />
                      在 App 中展示发布
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#6f6a61] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.recommended}
                        onChange={(e) => setDraft({ ...draft, recommended: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#6f8b62] focus:ring-[#6f8b62]"
                      />
                      是否推荐（展示在时令/推荐专区）
                    </label>
                  </div>

                  <Field label="排序值" desc="数值越大，前端排在越前面">
                    <Input
                      type="number"
                      value={draft.sort}
                      onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
                      className="h-11"
                    />
                  </Field>

                  <Field label="内容类型">
                    <Input
                      value="调料 (SEASONING)"
                      readOnly
                      disabled
                      className="h-11 bg-zinc-50 border-zinc-200 text-zinc-400"
                    />
                  </Field>

                  <Field label="发布状态">
                    <select
                      value={draft.publishStatus}
                      onChange={(e) => setDraft({ ...draft, publishStatus: e.target.value as Draft['publishStatus'] })}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none"
                    >
                      <option value="ACTIVE">启用</option>
                      <option value="DISABLED">停用</option>
                    </select>
                  </Field>

                  <Field label="发布时间">
                    <Input
                      type="text"
                      value={draft.publishTime ?? '跟随上架立即发布'}
                      readOnly
                      disabled
                      className="h-11 bg-zinc-50 border-zinc-200 text-zinc-400"
                    />
                  </Field>

                  <Field label="内容编号 (ID)">
                    <Input
                      type="text"
                      value={draft.seasoningCode ?? '保存后自动生成'}
                      readOnly
                      disabled
                      className="h-11 bg-zinc-50 border-zinc-200 text-zinc-400"
                    />
                  </Field>

                  <Field label="创建人">
                    <Input
                      type="text"
                      value={draft.creator}
                      readOnly
                      disabled
                      className="h-11 bg-zinc-50 border-zinc-200 text-zinc-400"
                    />
                  </Field>

                  {draft.createdAt && (
                    <Field label="创建时间">
                      <Input
                        type="text"
                        value={new Date(draft.createdAt).toLocaleString('zh-CN')}
                        readOnly
                        disabled
                        className="h-11 bg-zinc-50 border-zinc-200 text-zinc-400"
                      />
                    </Field>
                  )}

                  {draft.updatedAt && (
                    <Field label="最近更新时间">
                      <Input
                        type="text"
                        value={new Date(draft.updatedAt).toLocaleString('zh-CN')}
                        readOnly
                        disabled
                        className="h-11 bg-zinc-50 border-zinc-200 text-zinc-400"
                      />
                    </Field>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* 底部固定导航条 */}
          <div className="flex justify-between items-center bg-white border border-[#e9e2d6] rounded-2xl p-4 shadow-sm">
            <Button
              type="button"
              variant="ghost"
              disabled={activeTab === 0}
              onClick={handlePrev}
            >
              上一步
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => void performSave(true)}
              >
                保存草稿
              </Button>
              <Button
                type="button"
                onClick={() => void performSave(false)}
                disabled={saving}
              >
                保存并发布
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              disabled={activeTab === TABS.length - 1}
              onClick={handleNext}
            >
              下一步
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
