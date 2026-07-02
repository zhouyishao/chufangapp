import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  createBeverage,
  getBeverage,
  listCategories,
  resolveAssetUrl,
  updateBeverage,
  uploadMedia,
  type Beverage
} from '../api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import type { IngredientCategory } from '../types';

export type MixStepItem = {
  id: string;
  stepNo: number;
  description: string;
  image: string | null;
  estimatedTime: number | null; // 秒或分钟
  sort: number;
};

export type BeveragePriceRecord = {
  id: string;
  date: string;
  region: string;
  price: number;
  unit: string;
  source: string;
};

export type Draft = {
  name: string;
  coverImage: string | null;
  categoryId: string | null;
  beverageType: string; // 白酒, 红酒, 啤酒, 鸡尾酒, 茶饮, 果汁, 咖啡, 乳饮, 其他
  isAlcoholic: boolean;
  alcoholDegree: number | null;
  description: string | null;
  sort: number;
  status: 'ACTIVE' | 'DISABLED';
  isPublish: boolean;
  isRecommend: boolean;
  code?: string | null;
  id?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BeverageExtra = {
  // 1. 基础信息额外
  subtitle: string;
  sweetness: string;
  taste: string;
  origin: string;
  brand: string;
  specification: string; // 容量规格

  // 2. 封面与图文素材额外
  gallery: string[];
  video: string | null;
  tags: string;

  // 3. 规格与属性
  drinkingTemp: string;
  packingForm: string;
  shelfLife: string;
  ingredients: string;
  nutritionInfo: string;
  pairings: string[];

  // 4. 饮用说明
  drinkingNotes: string[];

  // 5. 调制方法 (鸡尾酒/调制饮品/自制饮品专属)
  mixMethod: string; // 摇和 / 搅拌 / 兑和 / 分层 / 打发 / 其他
  baseLiquor: string;
  mixIngredients: string;
  accessories: string;
  garnish: string;
  glassType: string;
  iceType: string;
  mixSteps: MixStepItem[];
  mixTips: string;
  showMixMethod: boolean;

  // 6. 价格信息
  estimatedPrice: number | null;
  priceUnit: string;
  priceSource: string;
  priceUpdateTime: string | null;
  showPrice: boolean;
  showPriceTrend: boolean;
  priceRemark: string;
  priceRecords: BeveragePriceRecord[];

  // 7. 关联信息
  relatedCategories: string[];
  applicableScenes: string[];
  keywords: string;
  sourceAuthor: string;
  auditRemark: string;
};

const mixMethodOptions = [
  '摇和',
  '搅拌',
  '兑和',
  '分层',
  '打发',
  '其他'
];

const availableScenesOptions = [
  '聚会',
  '露营',
  '送礼',
  '佐餐',
  '独酌'
];

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyDraft: Draft = {
  name: '',
  coverImage: null,
  categoryId: null,
  beverageType: '其他',
  isAlcoholic: false,
  alcoholDegree: null,
  description: null,
  sort: 0,
  status: 'ACTIVE',
  isPublish: true,
  isRecommend: false
};

const emptyExtra: BeverageExtra = {
  subtitle: '',
  sweetness: '',
  taste: '',
  origin: '',
  brand: '',
  specification: '330ml',

  gallery: [],
  video: null,
  tags: '',

  drinkingTemp: '',
  packingForm: '',
  shelfLife: '',
  ingredients: '',
  nutritionInfo: '',
  pairings: [],

  drinkingNotes: [''],

  mixMethod: '摇和',
  baseLiquor: '',
  mixIngredients: '',
  accessories: '',
  garnish: '',
  glassType: '',
  iceType: '',
  mixSteps: [],
  mixTips: '',
  showMixMethod: true,

  estimatedPrice: null,
  priceUnit: '瓶',
  priceSource: '',
  priceUpdateTime: null,
  showPrice: true,
  showPriceTrend: true,
  priceRemark: '',
  priceRecords: [],

  relatedCategories: [],
  applicableScenes: [],
  keywords: '',
  sourceAuthor: '',
  auditRemark: ''
};

const serializeDraftToPayload = (draft: Draft, extra: BeverageExtra) => {
  const jsonPayload = {
    // 1. 基础信息额外
    subtitle: extra.subtitle,
    sweetness: extra.sweetness,
    taste: extra.taste,
    origin: extra.origin,
    brand: extra.brand,
    specification: extra.specification,
    descriptionText: draft.description,

    // 2. 封面与图文素材额外
    gallery: extra.gallery,
    video: extra.video,
    tags: extra.tags,

    // 3. 规格与属性
    drinkingTemp: extra.drinkingTemp,
    packingForm: extra.packingForm,
    shelfLife: extra.shelfLife,
    ingredients: extra.ingredients,
    nutritionInfo: extra.nutritionInfo,
    pairings: extra.pairings,

    // 4. 饮用说明
    drinkingNotes: extra.drinkingNotes,

    // 5. 调制方法
    mixMethod: extra.mixMethod,
    baseLiquor: extra.baseLiquor,
    mixIngredients: extra.mixIngredients,
    accessories: extra.accessories,
    garnish: extra.garnish,
    glassType: extra.glassType,
    iceType: extra.iceType,
    mixSteps: extra.mixSteps,
    mixTips: extra.mixTips,
    showMixMethod: extra.showMixMethod,

    // 6. 价格信息
    estimatedPrice: extra.estimatedPrice,
    priceUnit: extra.priceUnit,
    priceSource: extra.priceSource,
    priceUpdateTime: extra.priceUpdateTime,
    showPrice: extra.showPrice,
    showPriceTrend: extra.showPriceTrend,
    priceRemark: extra.priceRemark,
    priceRecords: extra.priceRecords,

    // 7. 关联信息
    relatedCategories: extra.relatedCategories,
    applicableScenes: extra.applicableScenes,
    keywords: extra.keywords,
    sourceAuthor: extra.sourceAuthor,
    auditRemark: extra.auditRemark
  };

  return {
    name: draft.name.trim(),
    coverImage: draft.coverImage,
    categoryId: draft.categoryId,
    beverageType: draft.beverageType,
    isAlcoholic: draft.isAlcoholic,
    alcoholDegree: draft.isAlcoholic ? draft.alcoholDegree : null,
    description: JSON.stringify(jsonPayload),
    sort: draft.sort,
    status: draft.status,
    isPublish: draft.isPublish,
    isRecommend: draft.isRecommend
  };
};

const deserializePayloadToDraft = (beverage: Beverage): { draft: Draft; extra: BeverageExtra } => {
  let extra: any = {};
  let descText = beverage.description;

  try {
    if (beverage.description && beverage.description.startsWith('{')) {
      const parsed = JSON.parse(beverage.description);
      extra = parsed;
      descText = parsed.descriptionText ?? '';
    }
  } catch (e) {
    console.error('Failed to parse beverage description JSON:', e);
  }

  const draft: Draft = {
    name: beverage.name,
    coverImage: beverage.coverImage,
    categoryId: beverage.categoryId,
    beverageType: beverage.beverageType ?? '其他',
    isAlcoholic: beverage.isAlcoholic,
    alcoholDegree: beverage.alcoholDegree,
    description: descText,
    sort: beverage.sort,
    status: beverage.status,
    isPublish: beverage.isPublish,
    isRecommend: beverage.isRecommend,
    code: beverage.code ?? null,
    id: beverage.id,
    createdAt: beverage.createdAt,
    updatedAt: beverage.updatedAt
  };

  const extraData: BeverageExtra = {
    subtitle: extra.subtitle ?? '',
    sweetness: extra.sweetness ?? '',
    taste: extra.taste ?? '',
    origin: extra.origin ?? '',
    brand: extra.brand ?? '',
    specification: extra.specification ?? '',

    gallery: Array.isArray(extra.gallery) ? extra.gallery : [],
    video: extra.video ?? null,
    tags: extra.tags ?? '',

    drinkingTemp: extra.drinkingTemp ?? '',
    packingForm: extra.packingForm ?? '',
    shelfLife: extra.shelfLife ?? '',
    ingredients: extra.ingredients ?? '',
    nutritionInfo: extra.nutritionInfo ?? '',
    pairings: Array.isArray(extra.pairings) ? extra.pairings : [],

    drinkingNotes: Array.isArray(extra.drinkingNotes) ? extra.drinkingNotes : [''],

    mixMethod: extra.mixMethod ?? '摇和',
    baseLiquor: extra.baseLiquor ?? '',
    mixIngredients: extra.mixIngredients ?? '',
    accessories: extra.accessories ?? '',
    garnish: extra.garnish ?? '',
    glassType: extra.glassType ?? '',
    iceType: extra.iceType ?? '',
    mixSteps: Array.isArray(extra.mixSteps) ? extra.mixSteps : [],
    mixTips: extra.mixTips ?? '',
    showMixMethod: typeof extra.showMixMethod === 'boolean' ? extra.showMixMethod : true,

    estimatedPrice: extra.estimatedPrice ?? null,
    priceUnit: extra.priceUnit ?? '瓶',
    priceSource: extra.priceSource ?? '',
    priceUpdateTime: extra.priceUpdateTime ?? '',
    showPrice: typeof extra.showPrice === 'boolean' ? extra.showPrice : true,
    showPriceTrend: typeof extra.showPriceTrend === 'boolean' ? extra.showPriceTrend : true,
    priceRemark: extra.priceRemark ?? '',
    priceRecords: Array.isArray(extra.priceRecords) ? extra.priceRecords : [],

    relatedCategories: Array.isArray(extra.relatedCategories) ? extra.relatedCategories : [],
    applicableScenes: Array.isArray(extra.applicableScenes) ? extra.applicableScenes : [],
    keywords: extra.keywords ?? '',
    sourceAuthor: extra.sourceAuthor ?? '',
    auditRemark: extra.auditRemark ?? ''
  };

  return { draft, extra: extraData };
};

const Field = ({ label, children, desc }: { label: string; children: ReactNode; desc?: string }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-[#6f6a61]">{label}</label>
      {desc && <span className="text-[11px] text-[#B7AEA1] font-normal">{desc}</span>}
    </div>
    {children}
  </div>
);

export const BeverageFormPage = ({ mode }: { mode: 'create' | 'edit' }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [extra, setExtra] = useState<BeverageExtra>(emptyExtra);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>('basic');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Temporary state for adding a price record
  const [newRecDate, setNewRecDate] = useState('');
  const [newRecRegion, setNewRecRegion] = useState('');
  const [newRecPrice, setNewRecPrice] = useState('');
  const [newRecUnit, setNewRecUnit] = useState('瓶');
  const [newRecSource, setNewRecSource] = useState('');

  // Temporary state for adding a mix step
  const [newStepDesc, setNewStepDesc] = useState('');
  const [newStepTime, setNewStepTime] = useState('');
  const [newStepImage, setNewStepImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const stepImageRef = useRef<HTMLInputElement | null>(null);

  // Categories loading
  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const result = await listCategories({ page: 1, pageSize: 100, type: 'BEVERAGE', status: 'ACTIVE' });
        if (!alive) return;
        setCategories(result.list);

        if (mode === 'edit' && id) {
          const item = await getBeverage(id);
          if (alive && item) {
            const parsed = deserializePayloadToDraft(item);
            setDraft(parsed.draft);
            setExtra(parsed.extra);
          }
        } else {
          const defaultCategory = result.list.find((cat) => cat.name === '酒水饮品');
          if (alive) {
            setDraft((current) => ({ ...current, categoryId: defaultCategory?.id ?? null }));
          }
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => { alive = false; };
  }, [id, mode]);

  // Mix Method Visibility Rule
  const showMixMethodTab = true;

  // Tab Definitions
  const visibleTabs = useMemo(() => {
    const tabs = [
      { name: '基础信息', key: 'basic' },
      { name: '封面与图文素材', key: 'media' },
      { name: '规格与属性', key: 'specs' },
      { name: '饮用说明', key: 'drinking' }
    ];
    if (showMixMethodTab) {
      tabs.push({ name: '调制方法', key: 'mix' });
    }
    tabs.push(
      { name: '价格信息', key: 'price' },
      { name: '关联信息', key: 'relations' },
      { name: '发布设置', key: 'publish' }
    );
    return tabs;
  }, [showMixMethodTab]);

  // Adjust active tab key if the mix tab gets hidden
  useEffect(() => {
    if (!showMixMethodTab && activeTabKey === 'mix') {
      setActiveTabKey('drinking');
    }
  }, [showMixMethodTab, activeTabKey]);

  // Helper properties
  const isFirstTab = activeTabKey === visibleTabs[0]?.key;
  const isLastTab = activeTabKey === visibleTabs[visibleTabs.length - 1]?.key;

  // Validation function per tab
  const validateTab = (tabKey: string, currentDraft: Draft, currentExtra: BeverageExtra): string[] => {
    const errs: string[] = [];
    if (tabKey === 'basic') {
      if (!currentDraft.name.trim()) {
        errs.push('酒水名称是必填项');
      }
      if (!currentDraft.categoryId) {
        errs.push('请选择酒水分类');
      }
      if (!currentExtra.specification.trim()) {
        errs.push('容量规格是必填项');
      }
      if (!currentDraft.description?.trim()) {
        errs.push('酒水简介是必填项');
      }
      if (currentDraft.isAlcoholic && (currentDraft.alcoholDegree === null || isNaN(currentDraft.alcoholDegree))) {
        errs.push('酒精饮品必须填写酒精度 %vol');
      }
    } else if (tabKey === 'media') {
      if (!currentDraft.coverImage) {
        errs.push('请上传封面图片');
      }
    } else if (tabKey === 'mix' && showMixMethodTab) {
      currentExtra.mixSteps.forEach((step, idx) => {
        if (!step.description.trim()) {
          errs.push(`调制步骤 ${idx + 1} 的描述不能为空`);
        }
      });
    } else if (tabKey === 'price') {
      if (currentExtra.estimatedPrice === null || isNaN(currentExtra.estimatedPrice)) {
        errs.push('预计价格是必填项且必须为数字');
      }
      if (!currentExtra.priceUnit.trim()) {
        errs.push('价格单位是必填项');
      }
    }
    return errs;
  };

  // Real-time tab errors calculations
  const tabErrors = useMemo(() => {
    const errs: Record<string, boolean> = {};
    visibleTabs.forEach((tab) => {
      errs[tab.key] = validateTab(tab.key, draft, extra).length > 0;
    });
    return errs;
  }, [draft, extra, visibleTabs]);

  const handleTabClick = (key: string) => {
    setActiveTabKey(key);
  };

  const handleNext = () => {
    const currentIdx = visibleTabs.findIndex((t) => t.key === activeTabKey);
    if (currentIdx !== -1 && currentIdx < visibleTabs.length - 1) {
      setActiveTabKey(visibleTabs[currentIdx + 1].key);
    }
  };

  const handlePrev = () => {
    const currentIdx = visibleTabs.findIndex((t) => t.key === activeTabKey);
    if (currentIdx > 0) {
      setActiveTabKey(visibleTabs[currentIdx - 1].key);
    }
  };

  // Category change wrapper
  const handleCategoryChange = (catId: string | null) => {
    const selectedCat = categories.find((c) => String(c.id) === String(catId));
    const catName = selectedCat?.name ?? '';
    setDraft((prev) => ({
      ...prev,
      categoryId: catId,
      beverageType: catName || '其他'
    }));
  };

  // Upload handlers
  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadMedia(file);
      setDraft((d) => ({ ...d, coverImage: result.url }));
      setError(null);
    } catch (e) {
      setError('封面上传失败，请重试');
    }
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const currentGallery = [...extra.gallery];
    const availableSlots = 8 - currentGallery.length;
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
      setExtra((prev) => ({ ...prev, gallery: [...currentGallery, ...newUrls] }));
      setError(null);
    } catch (e) {
      setError('部分图片上传失败，请重试');
    }
  };

  const handleStepImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadMedia(file);
      setNewStepImage(result.url);
      setError(null);
    } catch (e) {
      setError('步骤图片上传失败，请重试');
    }
  };

  // Price record handlers
  const handleAddPriceRecord = () => {
    if (!newRecDate || !newRecPrice) {
      setError('价格记录的日期和价格为必填项');
      return;
    }
    const val = parseFloat(newRecPrice);
    if (isNaN(val)) {
      setError('价格必须是有效的数字');
      return;
    }

    const newRec: BeveragePriceRecord = {
      id: createId(),
      date: newRecDate,
      region: newRecRegion || '全国',
      price: val,
      unit: newRecUnit || '瓶',
      source: newRecSource || '采集'
    };

    setExtra((prev) => ({
      ...prev,
      priceRecords: [...prev.priceRecords, newRec]
    }));

    setNewRecDate('');
    setNewRecRegion('');
    setNewRecPrice('');
    setNewRecSource('');
    setError(null);
  };

  const handleRemovePriceRecord = (recId: string) => {
    setExtra((prev) => ({
      ...prev,
      priceRecords: prev.priceRecords.filter((r) => r.id !== recId)
    }));
  };

  // Mix steps handlers
  const handleAddMixStep = () => {
    if (!newStepDesc.trim()) {
      setError('请输入步骤说明');
      return;
    }
    const duration = newStepTime ? parseInt(newStepTime, 10) : null;

    const newStep: MixStepItem = {
      id: createId(),
      stepNo: extra.mixSteps.length + 1,
      description: newStepDesc.trim(),
      image: newStepImage,
      estimatedTime: isNaN(Number(duration)) ? null : duration,
      sort: extra.mixSteps.length + 1
    };

    setExtra((prev) => ({
      ...prev,
      mixSteps: [...prev.mixSteps, newStep]
    }));

    setNewStepDesc('');
    setNewStepTime('');
    setNewStepImage(null);
    setError(null);
  };

  const handleRemoveMixStep = (idx: number) => {
    setExtra((prev) => {
      const list = prev.mixSteps.filter((_, i) => i !== idx);
      const renumbered = list.map((step, i) => ({
        ...step,
        stepNo: i + 1,
        sort: i + 1
      }));
      return { ...prev, mixSteps: renumbered };
    });
  };

  const handleMoveMixStep = (idx: number, direction: 'up' | 'down') => {
    setExtra((prev) => {
      const list = [...prev.mixSteps];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;

      const temp = list[idx];
      list[idx] = list[targetIdx];
      list[targetIdx] = temp;

      const renumbered = list.map((step, i) => ({
        ...step,
        stepNo: i + 1,
        sort: i + 1
      }));
      return { ...prev, mixSteps: renumbered };
    });
  };

  // performSave
  const performSave = async (isDraftMode: boolean) => {
    setError(null);
    setNotice(null);

    const nextErrors: Record<string, boolean> = {};
    let firstFailedKey = '';
    let allMessages: string[] = [];

    visibleTabs.forEach((tab) => {
      if (isDraftMode && tab.key !== 'basic') return; // Draft only checks basic fields

      const tabErrs = validateTab(tab.key, draft, extra);
      if (tabErrs.length > 0) {
        nextErrors[tab.key] = true;
        allMessages = allMessages.concat(tabErrs);
        if (!firstFailedKey) {
          firstFailedKey = tab.key;
        }
      }
    });

    if (allMessages.length > 0) {
      setError(`提交失败，存在未通过校验的项：${allMessages.join('，')}`);
      if (firstFailedKey) {
        setActiveTabKey(firstFailedKey);
      }
      return;
    }

    setSaving(true);
    try {
      const finalDraft: Draft = {
        ...draft,
        isPublish: !isDraftMode,
        status: isDraftMode ? 'DISABLED' : 'ACTIVE'
      };

      const payload = serializeDraftToPayload(finalDraft, extra);

      if (mode === 'edit' && id) {
        await updateBeverage(id, payload);
      } else {
        await createBeverage(payload);
      }

      setNotice('保存成功');
      window.setTimeout(() => navigate('/content/beverages', { replace: true }), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6 min-h-screen bg-[#FAF7F2] p-6 pb-24">
      {/* 顶部标题及操作栏：仅保留 取消 与 保存草稿 */}
      <div className="flex items-center justify-between border-b border-zinc-200/60 pb-5">
        <PageHeader
          title={mode === 'edit' ? '编辑酒水' : '新增酒水'}
          description="配置酒水的基本资料、图文相册、调制步骤、售价及发布开关"
        />
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/content/beverages')}>
            取消
          </Button>
          <Button variant="ghost" disabled={saving} onClick={() => void performSave(true)}>
            保存草稿
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
            <nav className="flex space-x-1 min-w-[800px]">
              {visibleTabs.map((tab) => {
                const isActive = tab.key === activeTabKey;
                const hasErr = tabErrors[tab.key];
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabClick(tab.key)}
                    className={[
                      'flex-1 relative py-3 px-1 text-sm font-medium rounded-xl transition duration-150',
                      isActive
                        ? 'bg-[#edf5ea] text-[#6f8b62]'
                        : 'text-[#6f6a61] hover:bg-zinc-50'
                    ].join(' ')}
                  >
                    {tab.name}
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
            {activeTabKey === 'basic' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">基础信息</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">编辑酒水饮品的名称、分类及核心口味等特征</p>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="酒水名称 *">
                    <Input
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      placeholder="请输入酒水名称"
                      className="h-11"
                    />
                  </Field>
                  <Field label="酒水副标题">
                    <Input
                      value={extra.subtitle}
                      onChange={(e) => setExtra({ ...extra, subtitle: e.target.value })}
                      placeholder="请输入副标题，如'清冽甘甜，佐餐首选'"
                      className="h-11"
                    />
                  </Field>
                  <Field label="酒水分类 *">
                    <select
                      value={draft.categoryId ?? ''}
                      onChange={(e) => handleCategoryChange(e.target.value || null)}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none"
                    >
                      <option value="">请选择酒水分类</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="饮品属性 *">
                    <div className="flex h-11 items-center gap-6 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isAlcoholic"
                          checked={draft.isAlcoholic}
                          onChange={() => setDraft({ ...draft, isAlcoholic: true })}
                          className="text-[#6f8b62] focus:ring-[#6f8b62]"
                        />
                        酒精饮品
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isAlcoholic"
                          checked={!draft.isAlcoholic}
                          onChange={() => setDraft({ ...draft, isAlcoholic: false, alcoholDegree: null })}
                          className="text-[#6f8b62] focus:ring-[#6f8b62]"
                        />
                        非酒精饮品
                      </label>
                    </div>
                  </Field>
                  {draft.isAlcoholic && (
                    <Field label="酒精度 %vol">
                      <Input
                        type="number"
                        value={draft.alcoholDegree ?? ''}
                        onChange={(e) => setDraft({ ...draft, alcoholDegree: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="如 12.5"
                        className="h-11"
                      />
                    </Field>
                  )}
                  <Field label="产地">
                    <Input
                      value={extra.origin}
                      onChange={(e) => setExtra({ ...extra, origin: e.target.value })}
                      placeholder="如 法国波尔多, 四川宜宾"
                      className="h-11"
                    />
                  </Field>
                  <Field label="品牌">
                    <Input
                      value={extra.brand}
                      onChange={(e) => setExtra({ ...extra, brand: e.target.value })}
                      placeholder="如 茅台 / 轩尼诗"
                      className="h-11"
                    />
                  </Field>
                  <Field label="容量规格 *">
                    <Input
                      value={extra.specification}
                      onChange={(e) => setExtra({ ...extra, specification: e.target.value })}
                      placeholder="如 330ml / 750ml"
                      className="h-11"
                    />
                  </Field>
                  <Field label="甜度">
                    <Input
                      value={extra.sweetness}
                      onChange={(e) => setExtra({ ...extra, sweetness: e.target.value })}
                      placeholder="如 半甜 / 干型 / 无糖"
                      className="h-11"
                    />
                  </Field>
                  <Field label="口感特点">
                    <Input
                      value={extra.taste}
                      onChange={(e) => setExtra({ ...extra, taste: e.target.value })}
                      placeholder="如 醇厚顺滑, 清爽酸甜"
                      className="h-11"
                    />
                  </Field>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#6f6a61]">酒水简介 / 描述 *</label>
                  <textarea
                    value={draft.description ?? ''}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
                    placeholder="请输入对酒水风味、故事背景、适饮场景的简短介绍..."
                    className="w-full min-h-[100px] text-sm rounded-xl border border-zinc-200 bg-white p-3 outline-none focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62]"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: 封面与图文素材 */}
            {activeTabKey === 'media' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">封面与图文素材</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">上传展示图片素材及视频链接</p>
                </div>

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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-[#2f2f2f]">图片集 (最多8张)</h4>
                    <span className="text-xs text-[#B7AEA1]">{extra.gallery.length} / 8</span>
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
                    {extra.gallery.map((img, idx) => (
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
                            setExtra((prev) => ({
                              ...prev,
                              gallery: prev.gallery.filter((_, i) => i !== idx)
                            }))
                          }
                          className="absolute top-2 right-2 hidden group-hover:flex bg-red-600 text-white rounded-full w-6 h-6 items-center justify-center hover:bg-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {extra.gallery.length < 8 && (
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

                <Field label="视频外链 (可选)">
                  <Input
                    value={extra.video ?? ''}
                    onChange={(e) => setExtra({ ...extra, video: e.target.value || null })}
                    placeholder="输入 http / https 开头的视频源文件"
                    className="h-11"
                  />
                </Field>

                <Field label="标签属性组" desc="逗号隔开，最多 5 个">
                  <Input
                    value={extra.tags}
                    onChange={(e) => setExtra({ ...extra, tags: e.target.value })}
                    placeholder="如 果味, 微醺, 派对, 冰镇"
                    className="h-11"
                  />
                </Field>
              </div>
            )}

            {/* Tab 3: 规格与属性 */}
            {activeTabKey === 'specs' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">规格与属性</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">编辑饮品的存储、配料原料与搭配等细节信息</p>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <Field label="建议饮用温度">
                    <Input
                      value={extra.drinkingTemp}
                      onChange={(e) => setExtra({ ...extra, drinkingTemp: e.target.value })}
                      placeholder="如 6-8°C / 常温"
                      className="h-11"
                    />
                  </Field>
                  <Field label="包装形式">
                    <Input
                      value={extra.packingForm}
                      onChange={(e) => setExtra({ ...extra, packingForm: e.target.value })}
                      placeholder="如 玻璃瓶装 / 听装 / 礼盒装"
                      className="h-11"
                    />
                  </Field>
                  <Field label="保质期">
                    <Input
                      value={extra.shelfLife}
                      onChange={(e) => setExtra({ ...extra, shelfLife: e.target.value })}
                      placeholder="如 12个月 / 长期保存"
                      className="h-11"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#6f6a61]">原料 / 配料</label>
                    <textarea
                      value={extra.ingredients}
                      onChange={(e) => setExtra({ ...extra, ingredients: e.target.value })}
                      placeholder="如 水、大麦麦芽、啤酒花、酵母等"
                      className="w-full min-h-[90px] text-sm rounded-xl border border-zinc-200 bg-white p-3 outline-none focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#6f6a61]">营养成分信息 (可选)</label>
                    <textarea
                      value={extra.nutritionInfo}
                      onChange={(e) => setExtra({ ...extra, nutritionInfo: e.target.value })}
                      placeholder="如 每100ml含能量180kJ，蛋白质0g，碳水3.5g等"
                      className="w-full min-h-[90px] text-sm rounded-xl border border-zinc-200 bg-white p-3 outline-none focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62]"
                    />
                  </div>
                </div>

                <Field label="推荐搭配食物" desc="顿号或逗号隔开">
                  <Input
                    value={extra.pairings.join('、')}
                    onChange={(e) =>
                      setExtra({
                        ...extra,
                        pairings: e.target.value
                          .split(/[、,，]/)
                          .map((s) => s.trim())
                          .filter(Boolean)
                      })
                    }
                    placeholder="如 海鲜、烧烤、牛排、甜品"
                    className="h-11"
                  />
                </Field>
              </div>
            )}

            {/* Tab 4: 饮用说明 */}
            {activeTabKey === 'drinking' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">饮用说明</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">编辑口感描述、适饮温度和喝法推荐特点行</p>
                </div>

                <div className="space-y-3">
                  {extra.drinkingNotes.map((note, index) => (
                    <div key={index} className="grid grid-cols-[40px_1fr_40px] items-center gap-3 rounded-2xl bg-[#f5f1ea]/60 p-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-semibold text-zinc-700">{index + 1}</span>
                      <Input
                        value={note}
                        onChange={(e) => {
                          const updated = [...extra.drinkingNotes];
                          updated[index] = e.target.value;
                          setExtra({ ...extra, drinkingNotes: updated });
                        }}
                        placeholder="请输入饮用特点，如 '冰镇至 4℃ 口感最佳' / '开瓶后静置 15 分钟醒酒'"
                        className="h-10"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = extra.drinkingNotes.filter((_, i) => i !== index);
                          setExtra({ ...extra, drinkingNotes: updated.length ? updated : [''] });
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setExtra({ ...extra, drinkingNotes: [...extra.drinkingNotes, ''] })}
                  >
                    ＋ 新增饮用特点
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 5: 调制方法 */}
            {activeTabKey === 'mix' && showMixMethodTab && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">调制方法</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">配置此饮品的配方用料及调制工艺流程步骤</p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <Field label="调制方式">
                    <select
                      value={extra.mixMethod}
                      onChange={(e) => setExtra({ ...extra, mixMethod: e.target.value })}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none"
                    >
                      {mixMethodOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="基酒 / 主料">
                    <Input
                      value={extra.baseLiquor}
                      onChange={(e) => setExtra({ ...extra, baseLiquor: e.target.value })}
                      placeholder="如 朗姆酒 45ml / 浓缩咖啡 30ml"
                      className="h-11"
                    />
                  </Field>
                  <Field label="辅料">
                    <Input
                      value={extra.mixIngredients}
                      onChange={(e) => setExtra({ ...extra, mixIngredients: e.target.value })}
                      placeholder="如 苏打水 120ml / 牛乳 150ml"
                      className="h-11"
                    />
                  </Field>
                  <Field label="额外配件">
                    <Input
                      value={extra.accessories}
                      onChange={(e) => setExtra({ ...extra, accessories: e.target.value })}
                      placeholder="如 白砂糖 1茶匙 / 糖浆 10ml"
                      className="h-11"
                    />
                  </Field>
                  <Field label="装饰物">
                    <Input
                      value={extra.garnish}
                      onChange={(e) => setExtra({ ...extra, garnish: e.target.value })}
                      placeholder="如 薄荷叶 3片 / 柠檬片"
                      className="h-11"
                    />
                  </Field>
                  <Field label="杯型">
                    <Input
                      value={extra.glassType}
                      onChange={(e) => setExtra({ ...extra, glassType: e.target.value })}
                      placeholder="如 高球杯 / 柯林杯 / 经典马天尼杯"
                      className="h-11"
                    />
                  </Field>
                  <Field label="冰块类型">
                    <Input
                      value={extra.iceType}
                      onChange={(e) => setExtra({ ...extra, iceType: e.target.value })}
                      placeholder="如 整冰 / 碎冰 / 冰球"
                      className="h-11"
                    />
                  </Field>
                </div>

                <div className="border-t border-zinc-100 pt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-[#2f2f2f]">调制步骤列表</h4>
                  
                  <div className="rounded-xl border border-[#e9e2d6] bg-[#fdfbf7] p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
                      <div className="space-y-3">
                        <Field label="步骤说明 *">
                          <Input
                            value={newStepDesc}
                            onChange={(e) => setNewStepDesc(e.target.value)}
                            placeholder="请输入当前操作细节..."
                            className="h-10"
                          />
                        </Field>
                        <Field label="预计用时 (秒/分)">
                          <Input
                            type="number"
                            value={newStepTime}
                            onChange={(e) => setNewStepTime(e.target.value)}
                            placeholder="如 30 (代表 30秒)"
                            className="h-10"
                          />
                        </Field>
                      </div>

                      <div className="flex flex-col justify-center items-center border border-dashed border-zinc-200 rounded-xl bg-white p-2">
                        <input
                          ref={stepImageRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleStepImageUpload}
                        />
                        {newStepImage ? (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                            <img
                              src={resolveAssetUrl(newStepImage)}
                              alt="新建步骤图"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setNewStepImage(null)}
                              className="absolute top-1 right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => stepImageRef.current?.click()}
                            className="text-xs text-[#6f8b62] hover:underline"
                          >
                            + 上传步骤配图
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" onClick={handleAddMixStep}>
                        + 插入步骤行
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-zinc-150 text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                          <th className="p-3 w-16">序号</th>
                          <th className="p-3 w-24">配图</th>
                          <th className="p-3">步骤说明 *</th>
                          <th className="p-3 w-24">预计时间</th>
                          <th className="p-3 w-16">排序</th>
                          <th className="p-3 text-right w-44">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {extra.mixSteps.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-zinc-400">
                              暂无步骤，请在上方填写后添加步骤行。
                            </td>
                          </tr>
                        ) : (
                          extra.mixSteps.map((step, idx) => (
                            <tr key={step.id} className="hover:bg-zinc-50/50">
                              <td className="p-3 font-semibold">{step.stepNo}</td>
                              <td className="p-3">
                                {step.image ? (
                                  <img
                                    src={resolveAssetUrl(step.image)}
                                    alt={`步骤 ${step.stepNo}`}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                ) : (
                                  <span className="text-zinc-300">-</span>
                                )}
                              </td>
                              <td className="p-3">{step.description}</td>
                              <td className="p-3">{step.estimatedTime ? `${step.estimatedTime}s` : '-'}</td>
                              <td className="p-3">{step.sort}</td>
                              <td className="p-3 text-right space-x-2">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveMixStep(idx, 'up')}
                                  className="text-zinc-600 hover:text-zinc-900 disabled:opacity-30"
                                >
                                  上移
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === extra.mixSteps.length - 1}
                                  onClick={() => handleMoveMixStep(idx, 'down')}
                                  className="text-zinc-600 hover:text-zinc-900 disabled:opacity-30"
                                >
                                  下移
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMixStep(idx)}
                                  className="text-red-600 hover:text-red-800 font-semibold"
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#6f6a61]">调制小贴士 (Tips)</label>
                  <textarea
                    value={extra.mixTips}
                    onChange={(e) => setExtra({ ...extra, mixTips: e.target.value })}
                    placeholder="如：杯口抹盐边前，可以先用柠檬片将杯口润湿。"
                    className="w-full min-h-[80px] text-sm rounded-xl border border-zinc-200 bg-white p-3 outline-none focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showMixMethod"
                    checked={extra.showMixMethod}
                    onChange={(e) => setExtra({ ...extra, showMixMethod: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-[#6f8b62] focus:ring-[#6f8b62]"
                  />
                  <label htmlFor="showMixMethod" className="text-sm text-[#6f6a61] font-medium cursor-pointer">
                    在前端详情页显示本调制配方与步骤
                  </label>
                </div>
              </div>
            )}

            {/* Tab 6: 价格信息 */}
            {activeTabKey === 'price' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">价格信息</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">配置预计价格及历史售价记录</p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="预计价格 *">
                    <Input
                      type="number"
                      value={extra.estimatedPrice ?? ''}
                      onChange={(e) => setExtra({ ...extra, estimatedPrice: e.target.value === '' ? null : Number(e.target.value) })}
                      placeholder="元"
                      className="h-11"
                    />
                  </Field>
                  <Field label="价格单位 *">
                    <Input
                      value={extra.priceUnit}
                      onChange={(e) => setExtra({ ...extra, priceUnit: e.target.value })}
                      placeholder="如 瓶 / 罐 / 杯"
                      className="h-11"
                    />
                  </Field>
                  <Field label="价格来源">
                    <Input
                      value={extra.priceSource}
                      onChange={(e) => setExtra({ ...extra, priceSource: e.target.value })}
                      placeholder="如 线下酒吧 / 线上商超"
                      className="h-11"
                    />
                  </Field>
                  <Field label="更新时间">
                    <Input
                      type="date"
                      value={extra.priceUpdateTime ?? ''}
                      onChange={(e) => setExtra({ ...extra, priceUpdateTime: e.target.value || null })}
                      className="h-11"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showPrice"
                      checked={extra.showPrice}
                      onChange={(e) => setExtra({ ...extra, showPrice: e.target.checked })}
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
                      checked={extra.showPriceTrend}
                      onChange={(e) => setExtra({ ...extra, showPriceTrend: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-[#6f8b62] focus:ring-[#6f8b62]"
                    />
                    <label htmlFor="showPriceTrend" className="text-sm text-[#6f6a61] font-medium cursor-pointer">
                      在前端展示价格历史走势图
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#6f6a61]">价格备注说明</label>
                  <textarea
                    value={extra.priceRemark}
                    onChange={(e) => setExtra({ ...extra, priceRemark: e.target.value })}
                    placeholder="请输入额外价格描述..."
                    className="w-full min-h-[80px] text-sm rounded-xl border border-zinc-200 bg-white p-3 outline-none focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62]"
                  />
                </div>

                <div className="border-t border-zinc-100 pt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-[#2f2f2f]">价格采集历史数据</h4>
                  
                  <div className="rounded-xl border border-[#e9e2d6] bg-[#fdfbf7] p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div>
                        <span className="block text-[11px] text-[#6f6a61] mb-1">采集日期 *</span>
                        <input
                          type="date"
                          value={newRecDate}
                          onChange={(e) => setNewRecDate(e.target.value)}
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#6f6a61] mb-1">采集地区</span>
                        <input
                          type="text"
                          value={newRecRegion}
                          onChange={(e) => setNewRecRegion(e.target.value)}
                          placeholder="上海 / 北京等"
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#6f6a61] mb-1">采集售价 (元) *</span>
                        <input
                          type="number"
                          value={newRecPrice}
                          onChange={(e) => setNewRecPrice(e.target.value)}
                          placeholder="￥ 55"
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#6f6a61] mb-1">单位</span>
                        <input
                          type="text"
                          value={newRecUnit}
                          onChange={(e) => setNewRecUnit(e.target.value)}
                          placeholder="瓶"
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#6f6a61] mb-1">价格渠道</span>
                        <input
                          type="text"
                          value={newRecSource}
                          onChange={(e) => setNewRecSource(e.target.value)}
                          placeholder="如 酒吧零售"
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" onClick={handleAddPriceRecord}>
                        + 插入价格采集行
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-zinc-150">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
                          <th className="p-3">采集日期</th>
                          <th className="p-3">地区</th>
                          <th className="p-3">采集价格</th>
                          <th className="p-3">单位</th>
                          <th className="p-3">来源渠道</th>
                          <th className="p-3 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {extra.priceRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-zinc-400">
                              暂无价格采集记录点
                            </td>
                          </tr>
                        ) : (
                          extra.priceRecords.map((rec) => (
                            <tr key={rec.id} className="hover:bg-zinc-50/50">
                              <td className="p-3">{rec.date}</td>
                              <td className="p-3">{rec.region}</td>
                              <td className="p-3 font-semibold text-zinc-800">￥{rec.price}</td>
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

            {/* Tab 7: 关联信息 */}
            {activeTabKey === 'relations' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">关联信息</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">配置此饮品的关联分类、标签及推荐审核备注</p>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="关联分类" desc="顿号或逗号隔开">
                    <Input
                      value={extra.relatedCategories.join('、')}
                      onChange={(e) =>
                        setExtra({
                          ...extra,
                          relatedCategories: e.target.value
                            .split(/[、,，]/)
                            .map((s) => s.trim())
                            .filter(Boolean)
                        })
                      }
                      placeholder="如 鸡尾酒、自制特调、微醺"
                      className="h-11"
                    />
                  </Field>

                  <Field label="适用场景">
                    <div className="flex h-11 flex-wrap items-center gap-4 text-xs">
                      {availableScenesOptions.map((scene) => {
                        const checked = extra.applicableScenes.includes(scene);
                        return (
                          <label key={scene} className="flex items-center gap-2 cursor-pointer text-[#6f6a61]">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const list = checked
                                  ? extra.applicableScenes.filter((s) => s !== scene)
                                  : [...extra.applicableScenes, scene];
                                setExtra({ ...extra, applicableScenes: list });
                              }}
                              className="rounded border-gray-300 text-[#6f8b62] focus:ring-[#6f8b62]"
                            />
                            {scene}
                          </label>
                        );
                      })}
                    </div>
                  </Field>

                  <Field label="搜索关键词" desc="逗号隔开">
                    <Input
                      value={extra.keywords}
                      onChange={(e) => setExtra({ ...extra, keywords: e.target.value })}
                      placeholder="如 莫吉托, 薄荷, 气泡饮"
                      className="h-11"
                    />
                  </Field>

                  <Field label="来源 / 作者">
                    <Input
                      value={extra.sourceAuthor}
                      onChange={(e) => setExtra({ ...extra, sourceAuthor: e.target.value })}
                      placeholder="如 官方发布 / 调酒大师"
                      className="h-11"
                    />
                  </Field>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#6f6a61]">审核备注</label>
                  <textarea
                    value={extra.auditRemark}
                    onChange={(e) => setExtra({ ...extra, auditRemark: e.target.value })}
                    placeholder="输入给内容审核人员的参考说明..."
                    className="w-full min-h-[90px] text-sm rounded-xl border border-zinc-200 bg-white p-3 outline-none focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62]"
                  />
                </div>
              </div>
            )}

            {/* Tab 8: 发布设置 - 包含最终的保存/发布按钮 */}
            {activeTabKey === 'publish' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h3 className="text-lg font-semibold text-[#2f2f2f]">发布设置</h3>
                  <p className="text-xs text-[#B7AEA1] mt-1">设置此酒水饮品的发布上架及推荐属性</p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="flex flex-col gap-3 justify-center">
                    <label className="flex items-center gap-2 text-sm text-[#6f6a61] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.isPublish}
                        onChange={(e) => setDraft({ ...draft, isPublish: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#6f8b62] focus:ring-[#6f8b62]"
                      />
                      在 App 中公开展示
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#6f6a61] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.isRecommend}
                        onChange={(e) => setDraft({ ...draft, isRecommend: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#6f8b62] focus:ring-[#6f8b62]"
                      />
                      设为推荐（展示在首页及推荐大类中）
                    </label>
                  </div>

                  <Field label="排序权重值" desc="越大排在越前面">
                    <Input
                      type="number"
                      value={draft.sort}
                      onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
                      className="h-11"
                    />
                  </Field>

                  <Field label="内容类型">
                    <Input
                      value="酒水饮品 (BEVERAGE)"
                      readOnly
                      disabled
                      className="h-11 bg-zinc-50 border-zinc-200 text-zinc-400"
                    />
                  </Field>

                  <Field label="发布状态">
                    <select
                      value={draft.status}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft['status'] })}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none"
                    >
                      <option value="ACTIVE">启用</option>
                      <option value="DISABLED">下架停用</option>
                    </select>
                  </Field>

                  <Field label="饮品内容编号 ID">
                    <Input
                      value={draft.code ?? '保存后自动生成'}
                      readOnly
                      disabled
                      className="h-11 bg-zinc-50 border-zinc-200 text-zinc-400"
                    />
                  </Field>

                  {draft.createdAt && (
                    <Field label="创建时间">
                      <Input
                        value={new Date(draft.createdAt).toLocaleString('zh-CN')}
                        readOnly
                        disabled
                        className="h-11 bg-zinc-50 border-zinc-200 text-zinc-400"
                      />
                    </Field>
                  )}

                  {draft.updatedAt && (
                    <Field label="更新时间">
                      <Input
                        value={new Date(draft.updatedAt).toLocaleString('zh-CN')}
                        readOnly
                        disabled
                        className="h-11 bg-zinc-50 border-zinc-200 text-zinc-400"
                      />
                    </Field>
                  )}
                </div>

                {/* 最终操作面板：保存草稿 与 保存并发布 */}
                <div className="border-t border-zinc-150 pt-6 flex justify-end gap-3">
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
                    {saving ? '正在发布...' : '保存并发布'}
                  </Button>
                </div>
              </div>
            )}

          </div>

          {/* 底部固定导航条：第一个 Tab 隐藏上一步；最后一个 Tab 隐藏下一步，也不显示保存发布按钮 */}
          <div className="flex justify-between items-center bg-white border border-[#e9e2d6] rounded-2xl p-4 shadow-sm">
            <Button
              type="button"
              variant="ghost"
              disabled={isFirstTab}
              onClick={handlePrev}
              className={isFirstTab ? 'invisible' : ''}
            >
              上一步
            </Button>
            
            <div className="text-xs text-zinc-400">
              提示：填写完毕后请跳转至最后一个 Tab「发布设置」进行最终的保存与发布操作。
            </div>

            <Button
              type="button"
              variant="ghost"
              disabled={isLastTab}
              onClick={handleNext}
              className={isLastTab ? 'invisible' : ''}
            >
              下一步
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
