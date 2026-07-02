import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  createIngredient,
  getIngredient,
  resolveAssetUrl,
  updateIngredient,
  uploadMedia,
  listRecipes,
  listCategories
} from '../api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import type { Ingredient, IngredientCategory, Recipe } from '../types';

type SelectionGuideItem = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  sort: number;
  status: 'ACTIVE' | 'DISABLED';
};

type SelectionGuideGroup = {
  id: string;
  title: string;
  description: string;
  items: SelectionGuideItem[];
};

type StorageMethodItem = {
  id: string;
  name: string;
  description: string;
  duration: string;
  temperature: string;
  icon: string | null;
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

type PriceTrendItem = {
  id: string;
  date: string;
  region: string;
  price: number;
  unit: string;
  source: string;
  sort: number;
};

type AssociatedRecipeItem = {
  id: string;
  title: string;
  cover: string | null;
  categoryName: string;
  cookTime: number | null;
  difficulty: string | null;
  sort: number;
};

type Draft = {
  // 1. 基础信息
  name: string;
  alias: string;
  englishName: string;
  type: string;
  categoryId: string | null;
  tags: string[];
  origin: string;
  unit: string;
  seasonMonth: string | null;
  seasonStart: number | null;
  seasonEnd: number | null;
  description: string;
  status: 'ACTIVE' | 'DISABLED';
  isRecommend: boolean;

  // 2. 封面与图片
  coverUrl: string | null;
  detailImages: string[];
  imageDesc: string;
  videoUrl: string | null;

  // 3. 属性信息
  tasteCharacteristics: string;
  flavorCharacteristics: string;
  mainCharacteristics: string;
  cookingMethods: string;
  scenes: string[];
  commonVarieties: string;
  eatingTips: string;
  showProperties: boolean;
  extTexture: string;
  extMoisture: string;
  extFiber: string;
  extOxidizable: boolean;
  extRawEat: boolean;

  // 4. 价格信息
  currentPrice: number | null;
  priceUnit: string;
  priceDesc: string;
  priceSource: string;
  priceDate: string;
  showPrice: boolean;
  showPriceTrend: boolean;
  priceTrends: PriceTrendItem[];

  // 5. 怎么挑
  selectionGroups: SelectionGuideGroup[];

  // 6. 怎么保存
  storageMethods: StorageMethodItem[];
  eatingRemind: string;

  // 7. 营养价值
  nutritionBase: string;
  nutCalorie: number | null;
  nutProtein: number | null;
  nutFat: number | null;
  nutCarbo: number | null;
  nutFiber: number | null;
  nutVitC: number | null;
  nutSodium: number | null;
  nutPotassium: number | null;
  nutCalcium: number | null;
  nutIron: number | null;
  customNutrition: CustomNutritionItem[];

  // 8. 可以做什么
  recipeTitle: string;
  recipeCountLimit: number;
  recipeSortRule: string;
  showRecipes: boolean;
  recipes: AssociatedRecipeItem[];

  // 9. 发布设置
  isPublish: boolean;
  sort: number;
  contentType: 'INGREDIENT';
  id?: string;
  code?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
};

const createLocalId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyDraft: Draft = {
  name: '',
  alias: '',
  englishName: '',
  type: '蔬菜',
  categoryId: null,
  tags: [],
  origin: '',
  unit: '斤',
  seasonMonth: null,
  seasonStart: null,
  seasonEnd: null,
  description: '',
  status: 'ACTIVE',
  isRecommend: false,

  coverUrl: null,
  detailImages: [],
  imageDesc: '',
  videoUrl: null,

  tasteCharacteristics: '',
  flavorCharacteristics: '',
  mainCharacteristics: '',
  cookingMethods: '',
  scenes: [],
  commonVarieties: '',
  eatingTips: '',
  showProperties: true,
  extTexture: '',
  extMoisture: '',
  extFiber: '',
  extOxidizable: false,
  extRawEat: false,

  currentPrice: null,
  priceUnit: '斤',
  priceDesc: '',
  priceSource: '',
  priceDate: new Date().toISOString().slice(0, 10),
  showPrice: true,
  showPriceTrend: true,
  priceTrends: [],

  selectionGroups: [
    {
      id: createLocalId(),
      title: '外观',
      description: '选择外形规则、色泽饱满无伤的食材',
      items: [
        {
          id: createLocalId(),
          title: '看大小形状',
          description: '一般而言，外形均匀、状态饱满的更适合购买。',
          image: null,
          sort: 1,
          status: 'ACTIVE'
        }
      ]
    }
  ],

  storageMethods: [
    {
      id: createLocalId(),
      name: '常温保存',
      description: '常温阴凉避光干燥处保存',
      duration: '3-5天',
      temperature: '15-25℃',
      icon: 'house',
      sort: 1,
      status: 'ACTIVE'
    },
    {
      id: createLocalId(),
      name: '冷藏保存',
      description: '密封放入冰箱冷藏室',
      duration: '7-10天',
      temperature: '2-8℃',
      icon: 'cold',
      sort: 2,
      status: 'ACTIVE'
    }
  ],
  eatingRemind: '',

  nutritionBase: '每100g',
  nutCalorie: null,
  nutProtein: null,
  nutFat: null,
  nutCarbo: null,
  nutFiber: null,
  nutVitC: null,
  nutSodium: null,
  nutPotassium: null,
  nutCalcium: null,
  nutIron: null,
  customNutrition: [],

  recipeTitle: '可以做什么',
  recipeCountLimit: 6,
  recipeSortRule: 'HOT',
  showRecipes: true,
  recipes: [],

  isPublish: false,
  sort: 0,
  contentType: 'INGREDIENT'
};

const serializeDraftToPayload = (draft: Draft) => {
  const nutritionData = {
    description: draft.description,
    nutritionBase: draft.nutritionBase,
    nutCalorie: draft.nutCalorie,
    nutProtein: draft.nutProtein,
    nutFat: draft.nutFat,
    nutCarbo: draft.nutCarbo,
    nutFiber: draft.nutFiber,
    nutVitC: draft.nutVitC,
    nutSodium: draft.nutSodium,
    nutPotassium: draft.nutPotassium,
    nutCalcium: draft.nutCalcium,
    nutIron: draft.nutIron,
    customNutrition: draft.customNutrition,
    properties: {
      tasteCharacteristics: draft.tasteCharacteristics,
      flavorCharacteristics: draft.flavorCharacteristics,
      mainCharacteristics: draft.mainCharacteristics,
      cookingMethods: draft.cookingMethods,
      scenes: draft.scenes,
      commonVarieties: draft.commonVarieties,
      eatingTips: draft.eatingTips,
      showProperties: draft.showProperties,
      extTexture: draft.extTexture,
      extMoisture: draft.extMoisture,
      extFiber: draft.extFiber,
      extOxidizable: draft.extOxidizable,
      extRawEat: draft.extRawEat
    }
  };

  const selectionTipsData = {
    alias: draft.alias,
    englishName: draft.englishName,
    tags: draft.tags,
    origin: draft.origin,
    seasonStart: draft.seasonStart,
    seasonEnd: draft.seasonEnd,
    selectionGroups: draft.selectionGroups
  };

  const storageMethodData = {
    storageMethods: draft.storageMethods,
    eatingRemind: draft.eatingRemind
  };

  const tabooData = {
    taboo: draft.eatingTips,
    imageDesc: draft.imageDesc,
    priceInfo: {
      priceDesc: draft.priceDesc,
      showPrice: draft.showPrice,
      showPriceTrend: draft.showPriceTrend,
      priceTrends: draft.priceTrends
    },
    recipeInfo: {
      recipeTitle: draft.recipeTitle,
      recipeCountLimit: draft.recipeCountLimit,
      recipeSortRule: draft.recipeSortRule,
      showRecipes: draft.showRecipes,
      recipes: draft.recipes
    }
  };

  return {
    name: draft.name.trim(),
    coverUrl: draft.coverUrl,
    categoryId: draft.categoryId,
    seasonMonth: draft.seasonMonth,
    nutrition: JSON.stringify(nutritionData),
    selectionTips: JSON.stringify(selectionTipsData),
    storageMethod: JSON.stringify(storageMethodData),
    taboo: JSON.stringify(tabooData),
    detailImages: draft.detailImages,
    selectionMedia: draft.videoUrl,
    currentPrice: draft.currentPrice,
    priceUnit: draft.priceUnit,
    priceSource: draft.priceSource,
    isPublish: draft.isPublish,
    isRecommend: draft.isRecommend,
    status: draft.status,
    sort: draft.sort
  };
};

const deserializePayloadToDraft = (ingredient: Ingredient): Draft => {
  let nutritionObj: any = {};
  try {
    if (ingredient.nutrition && ingredient.nutrition.startsWith('{')) {
      nutritionObj = JSON.parse(ingredient.nutrition);
    }
  } catch (e) {
    console.error('Failed to parse nutrition JSON:', e);
  }

  let selectionTipsObj: any = {};
  try {
    if (ingredient.selectionTips && ingredient.selectionTips.startsWith('{')) {
      selectionTipsObj = JSON.parse(ingredient.selectionTips);
    }
  } catch (e) {
    console.error('Failed to parse selectionTips JSON:', e);
  }

  let storageMethodObj: any = {};
  try {
    if (ingredient.storageMethod && ingredient.storageMethod.startsWith('{')) {
      storageMethodObj = JSON.parse(ingredient.storageMethod);
    }
  } catch (e) {
    console.error('Failed to parse storageMethod JSON:', e);
  }

  let tabooObj: any = {};
  try {
    if (ingredient.taboo && ingredient.taboo.startsWith('{')) {
      tabooObj = JSON.parse(ingredient.taboo);
    }
  } catch (e) {
    console.error('Failed to parse taboo JSON:', e);
  }

  const defaultStorageMethods: StorageMethodItem[] = [
    {
      id: createLocalId(),
      name: '常温保存',
      description: '常温避光干燥保存',
      duration: '3-5天',
      temperature: '15-25℃',
      icon: 'house',
      sort: 1,
      status: 'ACTIVE'
    },
    {
      id: createLocalId(),
      name: '冷藏保存',
      description: '冷藏密封保存',
      duration: '7-10天',
      temperature: '2-8℃',
      icon: 'cold',
      sort: 2,
      status: 'ACTIVE'
    }
  ];

  const categoryName = ingredient.category?.name ?? '蔬菜';

  return {
    name: ingredient.name,
    alias: selectionTipsObj.alias ?? '',
    englishName: selectionTipsObj.englishName ?? '',
    type: categoryName.includes('蔬菜') ? '蔬菜' : categoryName.includes('水果') ? '水果' : categoryName.includes('生禽') ? '生禽' : categoryName.includes('水产') ? '水产' : categoryName.includes('调料') ? '调料' : '其他',
    categoryId: ingredient.categoryId,
    tags: Array.isArray(selectionTipsObj.tags) ? selectionTipsObj.tags : [],
    origin: selectionTipsObj.origin ?? '',
    unit: ingredient.priceUnit ?? '斤',
    seasonMonth: ingredient.seasonMonth,
    seasonStart: selectionTipsObj.seasonStart ?? null,
    seasonEnd: selectionTipsObj.seasonEnd ?? null,
    description: nutritionObj.description ?? ingredient.nutrition ?? '',
    status: ingredient.status,
    isRecommend: ingredient.isRecommend,

    coverUrl: ingredient.cover,
    detailImages: Array.isArray(ingredient.detailImages) ? ingredient.detailImages : [],
    imageDesc: tabooObj.imageDesc ?? '',
    videoUrl: ingredient.selectionMedia ?? null,

    tasteCharacteristics: nutritionObj.properties?.tasteCharacteristics ?? '',
    flavorCharacteristics: nutritionObj.properties?.flavorCharacteristics ?? '',
    mainCharacteristics: nutritionObj.properties?.mainCharacteristics ?? '',
    cookingMethods: nutritionObj.properties?.cookingMethods ?? '',
    scenes: Array.isArray(nutritionObj.properties?.scenes) ? nutritionObj.properties.scenes : [],
    commonVarieties: nutritionObj.properties?.commonVarieties ?? '',
    eatingTips: nutritionObj.properties?.eatingTips ?? '',
    showProperties: nutritionObj.properties?.showProperties ?? true,
    extTexture: nutritionObj.properties?.extTexture ?? '',
    extMoisture: nutritionObj.properties?.extMoisture ?? '',
    extFiber: nutritionObj.properties?.extFiber ?? '',
    extOxidizable: nutritionObj.properties?.extOxidizable ?? false,
    extRawEat: nutritionObj.properties?.extRawEat ?? false,

    currentPrice: ingredient.currentPrice,
    priceUnit: ingredient.priceUnit ?? '斤',
    priceDesc: tabooObj.priceInfo?.priceDesc ?? '',
    priceSource: ingredient.priceSource ?? '',
    priceDate: ingredient.priceDate ? new Date(ingredient.priceDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    showPrice: tabooObj.priceInfo?.showPrice ?? true,
    showPriceTrend: tabooObj.priceInfo?.showPriceTrend ?? true,
    priceTrends: Array.isArray(tabooObj.priceInfo?.priceTrends) ? tabooObj.priceInfo.priceTrends : [],

    selectionGroups: Array.isArray(selectionTipsObj.selectionGroups) ? selectionTipsObj.selectionGroups : [
      {
        id: createLocalId(),
        title: '外观',
        description: '选择外形规则、色泽饱满无伤的食材',
        items: [
          {
            id: createLocalId(),
            title: '看大小形状',
            description: '一般而言，外形均匀、状态饱满的更适合购买。',
            image: null,
            sort: 1,
            status: 'ACTIVE'
          }
        ]
      }
    ],

    storageMethods: Array.isArray(storageMethodObj.storageMethods) ? storageMethodObj.storageMethods : defaultStorageMethods,
    eatingRemind: storageMethodObj.eatingRemind ?? ingredient.storageMethod ?? '',

    nutritionBase: nutritionObj.nutritionBase ?? '每100g',
    nutCalorie: nutritionObj.nutCalorie ?? null,
    nutProtein: nutritionObj.nutProtein ?? null,
    nutFat: nutritionObj.nutFat ?? null,
    nutCarbo: nutritionObj.nutCarbo ?? null,
    nutFiber: nutritionObj.nutFiber ?? null,
    nutVitC: nutritionObj.nutVitC ?? null,
    nutSodium: nutritionObj.nutSodium ?? null,
    nutPotassium: nutritionObj.nutPotassium ?? null,
    nutCalcium: nutritionObj.nutCalcium ?? null,
    nutIron: nutritionObj.nutIron ?? null,
    customNutrition: Array.isArray(nutritionObj.customNutrition) ? nutritionObj.customNutrition : [],

    recipeTitle: tabooObj.recipeInfo?.recipeTitle ?? '可以做什么',
    recipeCountLimit: tabooObj.recipeInfo?.recipeCountLimit ?? 6,
    recipeSortRule: tabooObj.recipeInfo?.recipeSortRule ?? 'HOT',
    showRecipes: tabooObj.recipeInfo?.showRecipes ?? true,
    recipes: Array.isArray(tabooObj.recipeInfo?.recipes) ? tabooObj.recipeInfo.recipes : [],

    isPublish: ingredient.isPublish,
    sort: ingredient.sort,
    contentType: 'INGREDIENT',
    id: ingredient.id,
    code: ingredient.code,
    createdAt: ingredient.createdAt,
    updatedAt: ingredient.updatedAt,
    createdBy: '管理员'
  };
};

const TABS = [
  '基础信息',
  '封面与图片',
  '属性信息',
  '价格信息',
  '怎么挑',
  '怎么保存',
  '营养价值',
  '可以做什么',
  '发布设置'
];

const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);
const unitOptions = ['斤', '500g', 'kg', '个', '份', '瓶', '袋', '盒', 'g', 'ml'];

type IngredientFormKind = 'ingredient' | 'fruit' | 'seasoning';

const formKindConfig: Record<IngredientFormKind, {
  titleCreate: string;
  titleEdit: string;
  description: string;
  loadingText: string;
  nameLabel: string;
  namePlaceholder: string;
  categoryLabel: string;
  categoryPlaceholder: string;
  categoryType: IngredientCategory['type'];
  backPath: string;
  defaultCategoryName: string;
  typeLabel: string;
  typeFallback: string;
}> = {
  ingredient: {
    titleCreate: '新增食材',
    titleEdit: '编辑食材',
    description: '维护食材的基础资料、属性、价格、挑选与保存信息',
    loadingText: '加载食材数据中...',
    nameLabel: '食材名称',
    namePlaceholder: '请输入食材名称',
    categoryLabel: '食材分类',
    categoryPlaceholder: '请选择食材分类',
    categoryType: 'INGREDIENT',
    backPath: '/content/ingredients',
    defaultCategoryName: '蔬菜',
    typeLabel: '食材属性',
    typeFallback: '其他'
  },
  fruit: {
    titleCreate: '新增水果',
    titleEdit: '编辑水果',
    description: '维护水果的基础资料、属性、价格、挑选与保存信息',
    loadingText: '加载水果数据中...',
    nameLabel: '水果名称',
    namePlaceholder: '请输入水果名称',
    categoryLabel: '水果分类',
    categoryPlaceholder: '请选择水果分类',
    categoryType: 'FRUIT',
    backPath: '/content/fruits',
    defaultCategoryName: '时令水果',
    typeLabel: '水果属性',
    typeFallback: '水果'
  },
  seasoning: {
    titleCreate: '新增调料',
    titleEdit: '编辑调料',
    description: '维护调料的基础资料、属性、价格、挑选与保存信息',
    loadingText: '加载调料数据中...',
    nameLabel: '调料名称',
    namePlaceholder: '请输入调料名称',
    categoryLabel: '调料分类',
    categoryPlaceholder: '请选择调料分类',
    categoryType: 'SEASONING',
    backPath: '/content/seasonings',
    defaultCategoryName: '基础调味',
    typeLabel: '调料属性',
    typeFallback: '调料'
  }
};

const resolveFormKind = (forcedType: string): IngredientFormKind => {
  if (forcedType === 'fruit') return 'fruit';
  if (forcedType === 'seasoning') return 'seasoning';
  return 'ingredient';
};

const getFriendlyErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return '后端服务未连接，请确认 3002 服务已启动';
  }
  return err instanceof Error ? err.message : fallback;
};

export const IngredientFormPage = ({ mode, forcedCreateType }: { mode: 'create' | 'edit'; forcedCreateType?: string }) => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const id = params.id ?? '';
  const forcedType = forcedCreateType ?? searchParams.get('type') ?? 'vegetable';
  const formKind = resolveFormKind(forcedType);
  const config = formKindConfig[formKind];

  const [activeTab, setActiveTab] = useState<number>(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Tab validations warnings mapping
  const [tabErrors, setTabErrors] = useState<Record<number, boolean>>({});

  // Recipe Search State inside Tab 8
  const [recipeQuery, setRecipeQuery] = useState('');
  const [searchedRecipes, setSearchedRecipes] = useState<Recipe[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);

  const selectedCategoryName = categories.find((cat) => cat.id === draft.categoryId)?.name ?? config.typeFallback;

  const allowedCategories = useMemo(() => {
    return categories.filter((category) => category.type === config.categoryType);
  }, [categories, config.categoryType]);

  // Load Initial Categories & Data
  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [categoryResult, ingredient] = await Promise.all([
          listCategories({ page: 1, pageSize: 100, type: config.categoryType, status: 'ACTIVE' }),
          mode === 'edit' && id ? getIngredient(id) : Promise.resolve(null)
        ]);
        if (!alive) return;
        setCategories(categoryResult.list);

        if (ingredient) {
          setDraft(deserializePayloadToDraft(ingredient));
        } else {
          // Pre-select category based on URL query type
          const mapping: Record<string, string> = {
            vegetable: '蔬菜',
            fruit: config.defaultCategoryName,
            poultry: '生禽',
            aquatic: '水产',
            seasoning: config.defaultCategoryName
          };
          const targetName = mapping[forcedType] ?? config.defaultCategoryName;
          const matchedCategory = categoryResult.list.find((cat) => cat.name === targetName);
          setDraft({
            ...emptyDraft,
            categoryId: matchedCategory?.id ?? null,
            type: matchedCategory?.name ?? config.typeFallback
          });
        }
      } catch (err) {
        if (alive) setError(getFriendlyErrorMessage(err, '加载失败'));
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [config.categoryType, config.defaultCategoryName, config.typeFallback, forcedType, id, mode]);

  // Handle Recipe Search
  useEffect(() => {
    if (!recipeQuery.trim()) {
      setSearchedRecipes([]);
      return;
    }
    const timer = setTimeout(async () => {
      setRecipeLoading(true);
      try {
        const result = await listRecipes({ q: recipeQuery, pageSize: 8 });
        setSearchedRecipes(result.list);
      } catch (e) {
        console.error('Failed to search recipes:', e);
      } finally {
        setRecipeLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [recipeQuery]);

  // Validate fields for a specific Tab
  const validateTab = (tabIndex: number, currentDraft = draft): string | null => {
    if (tabIndex === 0) {
      if (!currentDraft.name.trim()) return `请输入${config.nameLabel}`;
      if (!currentDraft.categoryId) return config.categoryPlaceholder;
      if (!currentDraft.unit.trim()) return '请输入或选择计量单位';
    }
    // 封面与价格信息为可选，不阻止发布
    return null;
  };

  // Run full validation to update tab error indicators
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

  // Switch Tab manually without validation checks
  const handleTabClick = (index: number) => {
    setError(null);
    setActiveTab(index);
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    const firstTabError = validateTab(0, draft);
    if (firstTabError) {
      setTabErrors({ 0: true });
      setActiveTab(0);
      setError(`【${TABS[0]}】: ${firstTabError}`);
      return;
    }
    await handleSave(false);
  };

  // Publish / Submit
  const handlePublish = async () => {
    const isValid = updateAllTabErrors(draft);
    if (!isValid) {
      // Find the first tab with validation errors
      let firstErrorTab = 0;
      for (let i = 0; i < TABS.length; i++) {
        const err = validateTab(i, draft);
        if (err) {
          firstErrorTab = i;
          setError(`【${TABS[i]}】: ${err}`);
          break;
        }
      }
      setActiveTab(firstErrorTab);
      return;
    }
    await handleSave(true);
  };

  const handleSave = async (publish: boolean) => {
    const finalDraft = {
      ...draft,
      isPublish: publish,
      status: publish ? ('ACTIVE' as const) : ('DISABLED' as const)
    };

    setSaving(true);
    setError(null);
    try {
      const payload = serializeDraftToPayload(finalDraft);
      if (mode === 'edit' && id) {
        await updateIngredient(id, payload);
      } else {
        await createIngredient(payload);
      }
      setNotice(publish ? '保存并发布成功' : '草稿已保存');
      window.setTimeout(() => navigate(config.backPath, { replace: true }), 1000);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, '保存失败'));
    } finally {
      setSaving(false);
    }
  };

  // Cover Image Uploader logic
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadMedia(file);
      setDraft((d) => ({ ...d, coverUrl: result.url }));
      setError(null);
    } catch (e) {
      setError('封面上传失败，请重试');
    }
  };

  // Image Gallery Uploader logic
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const currentImages = [...draft.detailImages];
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
      setDraft((d) => ({ ...d, detailImages: [...currentImages, ...newUrls] }));
      setError(null);
    } catch (e) {
      setError('部分图片上传失败，请重试');
    }
  };

  // Month select toggler
  const toggleSeasonMonth = (m: number) => {
    const months = draft.seasonMonth ? draft.seasonMonth.split(',').map(Number) : [];
    const set = new Set(months);
    if (set.has(m)) {
      set.delete(m);
    } else {
      set.add(m);
    }
    const sorted = Array.from(set).sort((a, b) => a - b);
    const seasonString = sorted.length ? sorted.join(',') : null;
    setDraft((d) => ({ ...d, seasonMonth: seasonString }));
  };

  // Month range text mapping
  const seasonText = useMemo(() => {
    if (!draft.seasonMonth) return '';
    const months = draft.seasonMonth.split(',').map(Number);
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
  }, [draft.seasonMonth]);

  return (
    <section className="min-h-screen bg-[#FAF7F2] py-6 px-4 md:px-8">
      {/* 顶部标题区 */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2f2f2f]">{mode === 'edit' ? config.titleEdit : config.titleCreate}</h1>
          <p className="mt-1 text-sm text-[#B7AEA1]">{config.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="border-[#cfc6b8] text-[#6f6a61] px-5 h-10 hover:bg-[#f5f1ea]" onClick={() => navigate(config.backPath)}>
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
        <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-12 text-center text-[#B7AEA1] text-sm">
          {config.loadingText}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* 左侧主体大卡片 */}
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
                      {/* 红色校验错误标记 */}
                      {hasErr && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                      )}
                      {/* 绿色高亮下滑线 */}
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
                    <p className="text-xs text-[#B7AEA1] mt-1">设置{config.nameLabel.replace('名称', '')}的通用基本属性</p>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label={`${config.nameLabel} *`} desc={`必须输入${config.nameLabel}`}>
                      <Input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        placeholder={config.namePlaceholder}
                        className="h-11"
                      />
                    </Field>
                    <Field label="别名" desc="如番茄又名西红柿">
                      <Input
                        value={draft.alias}
                        onChange={(e) => setDraft({ ...draft, alias: e.target.value })}
                        placeholder="别名，如西红柿、洋柿子"
                        className="h-11"
                      />
                    </Field>
                    <Field label="英文名 / 拼音">
                      <Input
                        value={draft.englishName}
                        onChange={(e) => setDraft({ ...draft, englishName: e.target.value })}
                        placeholder="如 Tomato / Xihongshi"
                        className="h-11"
                      />
                    </Field>
                    <Field label={`${config.categoryLabel} *`} desc="与 C 端分类关联">
                      <select
                        value={draft.categoryId ?? ''}
                        onChange={(e) => {
                          const newCatId = e.target.value || null;
                          const matchedCatName = categories.find(c => c.id === newCatId)?.name ?? '';
                          const inferredType = matchedCatName.includes('蔬菜')
                            ? '蔬菜'
                            : matchedCatName.includes('水果')
                            ? '水果'
                            : (matchedCatName.includes('禽') || matchedCatName.includes('肉') || matchedCatName.includes('蛋'))
                            ? '生禽'
                            : (matchedCatName.includes('水产') || matchedCatName.includes('海鲜'))
                            ? '水产'
                            : (matchedCatName.includes('调料') || matchedCatName.includes('味') || matchedCatName.includes('酱'))
                            ? '调料'
                            : config.typeFallback;
                          
                          setDraft({
                            ...draft,
                            categoryId: newCatId,
                            type: inferredType
                          });
                        }}
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none"
                      >
                        <option value="">{config.categoryPlaceholder}</option>
                        {allowedCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {allowedCategories.length === 0 ? (
                        <p className="mt-2 text-xs text-[#c27b48]">暂无{config.categoryLabel}，请先到分类管理新增。</p>
                      ) : null}
                    </Field>
                    <Field label={config.typeLabel} desc="依据分类名称自动判定">
                      <Input
                        value={draft.type}
                        disabled
                        className="h-11 bg-zinc-50 text-zinc-500 cursor-not-allowed"
                      />
                    </Field>
                    <Field label="计量单位 *" desc="食材的默认显示和计价单位">
                      <select
                        value={draft.unit}
                        onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none"
                      >
                        {unitOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="产地">
                      <Input
                        value={draft.origin}
                        onChange={(e) => setDraft({ ...draft, origin: e.target.value })}
                        placeholder="主要产地，如：山东寿光"
                        className="h-11"
                      />
                    </Field>
                    <Field label="详情页标签" desc="输入后回车添加">
                      <div className="flex flex-wrap items-center gap-2 p-2 border border-zinc-200 rounded-xl min-h-11 bg-white">
                        {draft.tags.map((tag) => (
                          <span key={tag} className="flex items-center gap-1.5 bg-[#edf5ea] text-[#6f8b62] px-2.5 py-1 text-xs rounded-full">
                            {tag}
                            <button
                              type="button"
                              onClick={() => setDraft({ ...draft, tags: draft.tags.filter(t => t !== tag) })}
                              className="text-[#6f8b62] hover:text-[#5d7552] font-semibold"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          placeholder="添加标签..."
                          className="flex-1 outline-none text-sm px-1 min-w-[100px] h-7"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val && !draft.tags.includes(val)) {
                                setDraft({ ...draft, tags: [...draft.tags, val] });
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="时令月份" desc="可选多月份">
                        <div className="grid grid-cols-6 gap-2 mt-2">
                          {monthOptions.map((m) => {
                            const isSelected = draft.seasonMonth?.split(',').map(Number).includes(m);
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => toggleSeasonMonth(m)}
                                className={[
                                  'h-10 rounded-xl text-sm transition',
                                  isSelected
                                    ? 'border-[#6f8b62] bg-[#edf5ea] text-[#6f8b62] font-semibold'
                                    : 'border border-zinc-200 text-[#6f6a61] bg-white hover:border-[#6f8b62]'
                                ].join(' ')}
                              >
                                {m}月
                              </button>
                            );
                          })}
                        </div>
                        {seasonText && (
                          <div className="mt-2 text-xs text-[#6f8b62]">
                            判定季节为：<span className="font-semibold">{seasonText}</span>
                          </div>
                        )}
                      </Field>
                    </div>
                    <div className="md:col-span-2 flex gap-4 mt-2">
                      <Field label="上市季节：开始月份 (可选)">
                        <select
                          value={draft.seasonStart ?? ''}
                          onChange={(e) => setDraft({ ...draft, seasonStart: e.target.value ? Number(e.target.value) : null })}
                          className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] outline-none"
                        >
                          <option value="">开始月份</option>
                          {monthOptions.map((m) => <option key={m} value={m}>{m}月</option>)}
                        </select>
                      </Field>
                      <Field label="上市季节：结束月份 (可选)">
                        <select
                          value={draft.seasonEnd ?? ''}
                          onChange={(e) => setDraft({ ...draft, seasonEnd: e.target.value ? Number(e.target.value) : null })}
                          className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] outline-none"
                        >
                          <option value="">结束月份</option>
                          {monthOptions.map((m) => <option key={m} value={m}>{m}月</option>)}
                        </select>
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="简介 / 特色简述">
                        <textarea
                          value={draft.description}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none min-h-24 resize-y"
                          placeholder="输入食材的简单背景、风味来源或食用特点说明"
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: 封面与图片 */}
              {activeTab === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-100 pb-4">
                    <h3 className="text-lg font-semibold text-[#2f2f2f]">封面与图片</h3>
                    <p className="text-xs text-[#B7AEA1] mt-1">上传详情页封面图、多图轮播相册及视频</p>
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
                    {draft.coverUrl ? (
                      <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-[#e9e2d6]">
                        <img
                          src={resolveAssetUrl(draft.coverUrl)}
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
                            onClick={() => setDraft((d) => ({ ...d, coverUrl: null }))}
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

                  {/* 图片集上传区 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[#2f2f2f]">图片集 (最多8张)</h4>
                      <span className="text-xs text-[#B7AEA1]">{draft.detailImages.length} / 8</span>
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
                      {draft.detailImages.map((img, idx) => (
                        <div key={img + idx} className="relative aspect-square rounded-2xl overflow-hidden border border-[#e9e2d6] group">
                          <img
                            src={resolveAssetUrl(img)}
                            alt={`图片 ${idx + 1}`}
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
                                detailImages: d.detailImages.filter((_, i) => i !== idx)
                              }))
                            }
                            className="absolute top-2 right-2 hidden group-hover:flex bg-red-600 text-white rounded-full w-6 h-6 items-center justify-center hover:bg-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {draft.detailImages.length < 8 && (
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
                      value={draft.imageDesc}
                      onChange={(e) => setDraft({ ...draft, imageDesc: e.target.value })}
                      placeholder="简单说明图片的场景，如 '寿光特供蔬菜基地实拍图'"
                      className="h-11"
                    />
                  </Field>

                  <Field label="视频链接 / 上传视频 (可选)">
                    <Input
                      value={draft.videoUrl ?? ''}
                      onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value || null })}
                      placeholder="输入以 http/https 开头的视频播放源或第三方展示外链"
                      className="h-11"
                    />
                  </Field>
                </div>
              )}

              {/* Tab 3: 属性信息 */}
              {activeTab === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2f2f2f]">属性信息</h3>
                      <p className="text-xs text-[#B7AEA1] mt-1">设置{config.nameLabel.replace('名称', '')}的风味、品类特色与烹饪属性</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-[#2f2f2f]">
                      <input
                        type="checkbox"
                        checked={draft.showProperties}
                        onChange={(e) => setDraft({ ...draft, showProperties: e.target.checked })}
                        className="accent-[#6f8b62] h-4 w-4"
                      />
                      是否在前端显示属性信息
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="口感特点">
                      <Input
                        value={draft.tasteCharacteristics}
                        onChange={(e) => setDraft({ ...draft, tasteCharacteristics: e.target.value })}
                        placeholder="如：清甜脆嫩、鲜嫩多汁、细腻粉糯"
                        className="h-11"
                      />
                    </Field>
                    <Field label="风味特点">
                      <Input
                        value={draft.flavorCharacteristics}
                        onChange={(e) => setDraft({ ...draft, flavorCharacteristics: e.target.value })}
                        placeholder="如：清香扑鼻、草本风味、甘甜适口"
                        className="h-11"
                      />
                    </Field>
                    <Field label="主要特点">
                      <Input
                        value={draft.mainCharacteristics}
                        onChange={(e) => setDraft({ ...draft, mainCharacteristics: e.target.value })}
                        placeholder="如：无公害有机肥、果肉饱满"
                        className="h-11"
                      />
                    </Field>
                    <Field label="适合做法">
                      <Input
                        value={draft.cookingMethods}
                        onChange={(e) => setDraft({ ...draft, cookingMethods: e.target.value })}
                        placeholder="如：清炒、煮汤、凉拌、清蒸"
                        className="h-11"
                      />
                    </Field>
                    <Field label="常见品种">
                      <Input
                        value={draft.commonVarieties}
                        onChange={(e) => setDraft({ ...draft, commonVarieties: e.target.value })}
                        placeholder="如：圣女果、粉茄、千禧樱桃番茄"
                        className="h-11"
                      />
                    </Field>
                    <Field label="食用提醒">
                      <Input
                        value={draft.eatingTips}
                        onChange={(e) => setDraft({ ...draft, eatingTips: e.target.value })}
                        placeholder="如：不宜空腹过量食用，熟食更佳"
                        className="h-11"
                      />
                    </Field>

                    <div className="md:col-span-2">
                      <Field label="适合场景">
                        <div className="flex flex-wrap gap-4 text-sm mt-2 text-[#2f2f2f]">
                          {['家常烹饪', '烘焙甜品', '减脂健身', '宝宝辅食', '素食健康', '宴客聚会'].map((scene) => {
                            const isSelected = draft.scenes.includes(scene);
                            return (
                              <label key={scene} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setDraft({ ...draft, scenes: [...draft.scenes, scene] });
                                    } else {
                                      setDraft({ ...draft, scenes: draft.scenes.filter(s => s !== scene) });
                                    }
                                  }}
                                  className="accent-[#6f8b62] h-4 w-4"
                                />
                                {scene}
                              </label>
                            );
                          })}
                        </div>
                      </Field>
                    </div>

                    {/* 类型特有扩展字段（以蔬菜为例） */}
                    {(draft.type === '蔬菜' || draft.type === '水果') && (
                      <div className="md:col-span-2 border-t border-zinc-100 pt-5 mt-2 space-y-5">
                        <h4 className="text-sm font-semibold text-[#6f8b62]">
                          【{draft.type}】专属属性扩展字段
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Field label="口感度">
                            <Input
                              value={draft.extTexture}
                              onChange={(e) => setDraft({ ...draft, extTexture: e.target.value })}
                              placeholder="描述口感，如 爽脆、软嫩"
                              className="h-11"
                            />
                          </Field>
                          <Field label="水分比">
                            <Input
                              value={draft.extMoisture}
                              onChange={(e) => setDraft({ ...draft, extMoisture: e.target.value })}
                              placeholder="如 极多汁、适中、少汁"
                              className="h-11"
                            />
                          </Field>
                          <Field label="纤维感">
                            <Input
                              value={draft.extFiber}
                              onChange={(e) => setDraft({ ...draft, extFiber: e.target.value })}
                              placeholder="如 无渣细腻、有丝、纤维偏粗"
                              className="h-11"
                            />
                          </Field>
                          <div className="flex gap-6 mt-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={draft.extOxidizable}
                                onChange={(e) => setDraft({ ...draft, extOxidizable: e.target.checked })}
                                className="accent-[#6f8b62] h-4 w-4"
                              />
                              切开后易氧化变色
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={draft.extRawEat}
                                onChange={(e) => setDraft({ ...draft, extRawEat: e.target.checked })}
                                className="accent-[#6f8b62] h-4 w-4"
                              />
                              适合直接生食
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: 价格信息 */}
              {activeTab === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2f2f2f]">价格信息</h3>
                      <p className="text-xs text-[#B7AEA1] mt-1">设置参考价格及历史记录（用于展示价格走向）</p>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-[#2f2f2f]">
                        <input
                          type="checkbox"
                          checked={draft.showPrice}
                          onChange={(e) => setDraft({ ...draft, showPrice: e.target.checked })}
                          className="accent-[#6f8b62] h-4 w-4"
                        />
                        显示价格
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-[#2f2f2f]">
                        <input
                          type="checkbox"
                          checked={draft.showPriceTrend}
                          onChange={(e) => setDraft({ ...draft, showPriceTrend: e.target.checked })}
                          className="accent-[#6f8b62] h-4 w-4"
                        />
                        开启价格趋势图
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="预计价格 *">
                      <Input
                        type="number"
                        step="0.01"
                        value={draft.currentPrice ?? ''}
                        onChange={(e) => setDraft({ ...draft, currentPrice: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="请输入预计价格，如：3.50"
                        className="h-11"
                      />
                    </Field>
                    <Field label="价格单位 *">
                      <Input
                        value={draft.priceUnit}
                        onChange={(e) => setDraft({ ...draft, priceUnit: e.target.value })}
                        placeholder="预计价格的结算单位，如：斤、元/个"
                        className="h-11"
                      />
                    </Field>
                    <Field label="价格来源 *">
                      <Input
                        value={draft.priceSource}
                        onChange={(e) => setDraft({ ...draft, priceSource: e.target.value })}
                        placeholder="市场价格的来源，如：北京新发地市场"
                        className="h-11"
                      />
                    </Field>
                    <Field label="更新时间 *">
                      <Input
                        type="date"
                        value={draft.priceDate}
                        onChange={(e) => setDraft({ ...draft, priceDate: e.target.value })}
                        className="h-11"
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="价格备注 / 说明 (可选)">
                        <textarea
                          value={draft.priceDesc}
                          onChange={(e) => setDraft({ ...draft, priceDesc: e.target.value })}
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none min-h-16 resize-y"
                          placeholder="说明该规格价格的波动情况或地区差异..."
                        />
                      </Field>
                    </div>
                  </div>

                  {/* 价格历史记录表格（支持价格趋势图展示） */}
                  {draft.showPriceTrend && (
                    <div className="border-t border-zinc-100 pt-6 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-[#2f2f2f]">价格趋势数据表</h4>
                        <button
                          type="button"
                          onClick={() => {
                            const newRecord: PriceTrendItem = {
                              id: createLocalId(),
                              date: new Date().toISOString().slice(0, 10),
                              region: '全国',
                              price: draft.currentPrice ?? 0,
                              unit: draft.priceUnit || '斤',
                              source: draft.priceSource || '市场',
                              sort: draft.priceTrends.length + 1
                            };
                            setDraft((d) => ({ ...d, priceTrends: [...d.priceTrends, newRecord] }));
                          }}
                          className="text-xs font-semibold text-[#6f8b62] hover:text-[#5d7552]"
                        >
                          ＋ 新增价格记录
                        </button>
                      </div>

                      {draft.priceTrends.length === 0 ? (
                        <div className="bg-[#FAF7F2] rounded-xl p-4 text-center text-xs text-[#B7AEA1]">
                          暂无历史价格数据。点击右上角“新增价格记录”添加。
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-[#e9e2d6] bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#fcfbf9] text-[#6f6a61] font-semibold border-b border-[#e9e2d6]">
                              <tr>
                                <th className="p-3">记录日期</th>
                                <th className="p-3">地区</th>
                                <th className="p-3">参考价格</th>
                                <th className="p-3">单位</th>
                                <th className="p-3">数据来源</th>
                                <th className="p-3 text-center">操作</th>
                              </tr>
                            </thead>
                            <tbody>
                              {draft.priceTrends.map((trend, idx) => (
                                <tr key={trend.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/50">
                                  <td className="p-2">
                                    <input
                                      type="date"
                                      value={trend.date}
                                      onChange={(e) => {
                                        const newArr = [...draft.priceTrends];
                                        newArr[idx].date = e.target.value;
                                        setDraft((d) => ({ ...d, priceTrends: newArr }));
                                      }}
                                      className="border border-zinc-200 rounded px-1.5 py-1 text-xs outline-none"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={trend.region}
                                      onChange={(e) => {
                                        const newArr = [...draft.priceTrends];
                                        newArr[idx].region = e.target.value;
                                        setDraft((d) => ({ ...d, priceTrends: newArr }));
                                      }}
                                      className="border border-zinc-200 rounded px-1.5 py-1 text-xs w-20 outline-none"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={trend.price}
                                      onChange={(e) => {
                                        const newArr = [...draft.priceTrends];
                                        newArr[idx].price = Number(e.target.value);
                                        setDraft((d) => ({ ...d, priceTrends: newArr }));
                                      }}
                                      className="border border-zinc-200 rounded px-1.5 py-1 text-xs w-20 outline-none"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={trend.unit}
                                      onChange={(e) => {
                                        const newArr = [...draft.priceTrends];
                                        newArr[idx].unit = e.target.value;
                                        setDraft((d) => ({ ...d, priceTrends: newArr }));
                                      }}
                                      className="border border-zinc-200 rounded px-1.5 py-1 text-xs w-16 outline-none"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={trend.source}
                                      onChange={(e) => {
                                        const newArr = [...draft.priceTrends];
                                        newArr[idx].source = e.target.value;
                                        setDraft((d) => ({ ...d, priceTrends: newArr }));
                                      }}
                                      className="border border-zinc-200 rounded px-1.5 py-1 text-xs w-32 outline-none"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDraft((d) => ({
                                          ...d,
                                          priceTrends: d.priceTrends.filter((_, i) => i !== idx)
                                        }));
                                      }}
                                      className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded transition"
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
                  )}
                </div>
              )}

              {/* Tab 5: 怎么挑 */}
              {activeTab === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2f2f2f]">怎么挑（挑选技巧）</h3>
                      <p className="text-xs text-[#B7AEA1] mt-1">按分组配置食材挑选的小技巧与要领</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newGrp: SelectionGuideGroup = {
                          id: createLocalId(),
                          title: `挑选维度 ${draft.selectionGroups.length + 1}`,
                          description: '请输入挑选维度描述',
                          items: [
                            {
                              id: createLocalId(),
                              title: '新要点',
                              description: '输入挑选的判断依据或指示说明。',
                              image: null,
                              sort: 1,
                              status: 'ACTIVE'
                            }
                          ]
                        };
                        setDraft((d) => ({ ...d, selectionGroups: [...d.selectionGroups, newGrp] }));
                      }}
                      className="text-[#6f8b62] hover:text-[#5d7552] text-sm font-semibold flex items-center gap-1"
                    >
                      ＋ 新建挑选分组
                    </button>
                  </div>

                  {draft.selectionGroups.length === 0 ? (
                    <div className="bg-[#FAF7F2] rounded-xl p-8 text-center text-sm text-[#B7AEA1]">
                      暂无挑选指南，点击右上角“新建挑选分组”开始维护。
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {draft.selectionGroups.map((group, gIdx) => (
                        <div key={group.id} className="border border-[#e9e2d6] rounded-2xl p-4 bg-[#fdfcf9]">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-zinc-100 pb-3 mb-3">
                            <div className="flex-1 flex gap-3">
                              <input
                                type="text"
                                value={group.title}
                                onChange={(e) => {
                                  const list = [...draft.selectionGroups];
                                  list[gIdx].title = e.target.value;
                                  setDraft((d) => ({ ...d, selectionGroups: list }));
                                }}
                                className="font-semibold text-sm border-b border-dashed border-[#cfc6b8] focus:border-[#6f8b62] outline-none bg-transparent max-w-[180px]"
                                placeholder="分组名称"
                              />
                              <input
                                type="text"
                                value={group.description}
                                onChange={(e) => {
                                  const list = [...draft.selectionGroups];
                                  list[gIdx].description = e.target.value;
                                  setDraft((d) => ({ ...d, selectionGroups: list }));
                                }}
                                className="text-xs text-[#B7AEA1] flex-1 border-b border-dashed border-zinc-200 focus:border-[#6f8b62] outline-none bg-transparent"
                                placeholder="简短描述"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDraft((d) => ({
                                  ...d,
                                  selectionGroups: d.selectionGroups.filter((_, idx) => idx !== gIdx)
                                }));
                              }}
                              className="text-xs text-red-500 hover:text-red-700 font-medium self-end md:self-auto"
                            >
                              删除该组
                            </button>
                          </div>

                          {/* 组内挑选项的表单卡片集 */}
                          <div className="space-y-4">
                            {group.items.map((item, iIdx) => (
                              <div key={item.id} className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-center bg-white p-3 rounded-xl border border-zinc-100">
                                <div className="text-center text-base font-semibold text-[#6f8b62] bg-[#edf5ea] rounded-full w-8 h-8 flex items-center justify-center">
                                  {iIdx + 1}
                                </div>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => {
                                      const groups = [...draft.selectionGroups];
                                      groups[gIdx].items[iIdx].title = e.target.value;
                                      setDraft((d) => ({ ...d, selectionGroups: groups }));
                                    }}
                                    className="w-full text-xs font-semibold border-b border-zinc-100 focus:border-[#6f8b62] outline-none"
                                    placeholder="挑选要点标题，如 '看软硬色泽'"
                                  />
                                  <textarea
                                    value={item.description}
                                    onChange={(e) => {
                                      const groups = [...draft.selectionGroups];
                                      groups[gIdx].items[iIdx].description = e.target.value;
                                      setDraft((d) => ({ ...d, selectionGroups: groups }));
                                    }}
                                    className="w-full text-xs border border-zinc-100 rounded p-1.5 focus:border-[#6f8b62] outline-none min-h-12 resize-y bg-zinc-50/30"
                                    placeholder="挑选的细节性描述"
                                  />
                                </div>
                                <div className="flex items-center gap-3 justify-end">
                                  {/* 配图上传 */}
                                  <input
                                    id={`item-file-${gIdx}-${iIdx}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        const result = await uploadMedia(file);
                                        const groups = [...draft.selectionGroups];
                                        groups[gIdx].items[iIdx].image = result.url;
                                        setDraft((d) => ({ ...d, selectionGroups: groups }));
                                      } catch (err) {
                                        setError('指南配图上传失败');
                                      }
                                    }}
                                  />
                                  {item.image ? (
                                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border">
                                      <img
                                        src={resolveAssetUrl(item.image)}
                                        alt="配图"
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const groups = [...draft.selectionGroups];
                                          groups[gIdx].items[iIdx].image = null;
                                          setDraft((d) => ({ ...d, selectionGroups: groups }));
                                        }}
                                        className="absolute top-0 right-0 bg-black/70 text-white w-4 h-4 text-[9px] flex items-center justify-center hover:bg-black"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <label
                                      htmlFor={`item-file-${gIdx}-${iIdx}`}
                                      className="w-14 h-14 border border-dashed border-[#cfc6b8] hover:border-[#6f8b62] rounded-lg flex flex-col items-center justify-center text-[10px] text-[#6f8b62] cursor-pointer"
                                    >
                                      +配图
                                    </label>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const groups = [...draft.selectionGroups];
                                      groups[gIdx].items = groups[gIdx].items.filter((_, i) => i !== iIdx);
                                      setDraft((d) => ({ ...d, selectionGroups: groups }));
                                    }}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2 py-1.5 rounded transition"
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const groups = [...draft.selectionGroups];
                              const newItm = {
                                id: createLocalId(),
                                title: '',
                                description: '',
                                image: null,
                                sort: groups[gIdx].items.length + 1,
                                status: 'ACTIVE' as const
                              };
                              groups[gIdx].items.push(newItm);
                              setDraft((d) => ({ ...d, selectionGroups: groups }));
                            }}
                            className="mt-3 text-xs font-semibold text-[#6f8b62] hover:text-[#5d7552]"
                          >
                            ＋ 新增挑选项
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 6: 怎么保存 */}
              {activeTab === 5 && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2f2f2f]">怎么保存（保存与处理）</h3>
                      <p className="text-xs text-[#B7AEA1] mt-1">设置常用保存手段与食用前的建议处理流程</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newStorage: StorageMethodItem = {
                          id: createLocalId(),
                          name: '阴凉防潮保存',
                          description: '阴凉通风干燥处，防止受潮发霉。',
                          duration: '10-15天',
                          temperature: '10-18℃',
                          icon: 'shade',
                          sort: draft.storageMethods.length + 1,
                          status: 'ACTIVE'
                        };
                        setDraft((d) => ({ ...d, storageMethods: [...d.storageMethods, newStorage] }));
                      }}
                      className="text-[#6f8b62] hover:text-[#5d7552] text-sm font-semibold"
                    >
                      ＋ 新增保存方式
                    </button>
                  </div>

                  {draft.storageMethods.length === 0 ? (
                    <div className="bg-[#FAF7F2] rounded-xl p-8 text-center text-sm text-[#B7AEA1]">
                      暂无保存方案。请点击右上角“新增保存方式”。
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {draft.storageMethods.map((method, idx) => (
                        <div key={method.id} className="border border-[#e9e2d6] rounded-2xl p-4 bg-[#fdfcf9] grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div className="md:col-span-1">
                            <label className="text-xs text-[#6f6a61] block mb-1">保存方式名称</label>
                            <input
                              type="text"
                              value={method.name}
                              onChange={(e) => {
                                const list = [...draft.storageMethods];
                                list[idx].name = e.target.value;
                                setDraft((d) => ({ ...d, storageMethods: list }));
                              }}
                              className="w-full text-xs font-semibold h-9 rounded-lg border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                              placeholder="如 冷冻保存"
                            />
                          </div>
                          <div className="md:col-span-1 flex gap-2">
                            <div className="flex-1">
                              <label className="text-xs text-[#6f6a61] block mb-1">保存时长</label>
                              <input
                                type="text"
                                value={method.duration}
                                onChange={(e) => {
                                  const list = [...draft.storageMethods];
                                  list[idx].duration = e.target.value;
                                  setDraft((d) => ({ ...d, storageMethods: list }));
                                }}
                                className="w-full text-xs h-9 rounded-lg border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                                placeholder="如 3个月"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-[#6f6a61] block mb-1">适宜温度</label>
                              <input
                                type="text"
                                value={method.temperature}
                                onChange={(e) => {
                                  const list = [...draft.storageMethods];
                                  list[idx].temperature = e.target.value;
                                  setDraft((d) => ({ ...d, storageMethods: list }));
                                }}
                                className="w-full text-xs h-9 rounded-lg border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                                placeholder="如 -18℃"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-1">
                            <label className="text-xs text-[#6f6a61] block mb-1">保存描述详情</label>
                            <input
                              type="text"
                              value={method.description}
                              onChange={(e) => {
                                const list = [...draft.storageMethods];
                                list[idx].description = e.target.value;
                                setDraft((d) => ({ ...d, storageMethods: list }));
                              }}
                              className="w-full text-xs h-9 rounded-lg border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                              placeholder="请输入具体保存动作及注意事项"
                            />
                          </div>
                          <div className="md:col-span-1 flex items-center justify-between gap-3 pt-4 md:pt-0">
                            <div>
                              <label className="text-xs text-[#6f6a61] block mb-1">图标标识</label>
                              <select
                                value={method.icon ?? ''}
                                onChange={(e) => {
                                  const list = [...draft.storageMethods];
                                  list[idx].icon = e.target.value || null;
                                  setDraft((d) => ({ ...d, storageMethods: list }));
                                }}
                                className="text-xs h-9 rounded-lg border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                              >
                                <option value="house">常温 (house)</option>
                                <option value="cold">冷藏 (cold)</option>
                                <option value="freeze">冷冻 (freeze)</option>
                                <option value="shade">防潮避光 (shade)</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDraft((d) => ({
                                  ...d,
                                  storageMethods: d.storageMethods.filter((_, i) => i !== idx)
                                }));
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2.5 py-1.5 rounded h-9 transition mt-4"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-zinc-100 pt-6 mt-4">
                    <Field label="食用 / 处理提醒" desc="用于给 C 端用户在烹饪前、清洗去皮、刀工切配等方面的安全和技巧贴士">
                      <textarea
                        value={draft.eatingRemind}
                        onChange={(e) => setDraft({ ...draft, eatingRemind: e.target.value })}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-[#6f8b62] focus:ring-1 focus:ring-[#6f8b62] outline-none min-h-24 resize-y"
                        placeholder="清洗去皮建议：如 '可用淡盐水浸泡10分钟后用清水冲洗，可去除果蜡农残' 等..."
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* Tab 7: 营养价值 */}
              {activeTab === 6 && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2f2f2f]">营养价值（每100克基准）</h3>
                      <p className="text-xs text-[#B7AEA1] mt-1">配置食材的关键宏量与微量营养元素数据</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6f6a61]">营养基准:</span>
                      <input
                        type="text"
                        value={draft.nutritionBase}
                        onChange={(e) => setDraft({ ...draft, nutritionBase: e.target.value })}
                        className="w-24 border border-zinc-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#6f8b62]"
                      />
                    </div>
                  </div>

                  {/* 核心元素输入网格 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Field label="热量 (kcal)">
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.nutCalorie ?? ''}
                        onChange={(e) => setDraft({ ...draft, nutCalorie: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="0.0"
                        className="h-10"
                      />
                    </Field>
                    <Field label="蛋白质 (g)">
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.nutProtein ?? ''}
                        onChange={(e) => setDraft({ ...draft, nutProtein: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="0.0"
                        className="h-10"
                      />
                    </Field>
                    <Field label="脂肪 (g)">
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.nutFat ?? ''}
                        onChange={(e) => setDraft({ ...draft, nutFat: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="0.0"
                        className="h-10"
                      />
                    </Field>
                    <Field label="碳水化合物 (g)">
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.nutCarbo ?? ''}
                        onChange={(e) => setDraft({ ...draft, nutCarbo: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="0.0"
                        className="h-10"
                      />
                    </Field>
                    <Field label="膳食纤维 (g)">
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.nutFiber ?? ''}
                        onChange={(e) => setDraft({ ...draft, nutFiber: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="0.0"
                        className="h-10"
                      />
                    </Field>
                    <Field label="维生素C (mg)">
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.nutVitC ?? ''}
                        onChange={(e) => setDraft({ ...draft, nutVitC: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="0.0"
                        className="h-10"
                      />
                    </Field>
                    <Field label="钠 (mg)">
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.nutSodium ?? ''}
                        onChange={(e) => setDraft({ ...draft, nutSodium: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="0.0"
                        className="h-10"
                      />
                    </Field>
                    <Field label="钾 (mg)">
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.nutPotassium ?? ''}
                        onChange={(e) => setDraft({ ...draft, nutPotassium: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="0.0"
                        className="h-10"
                      />
                    </Field>
                    <Field label="钙 (mg)">
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.nutCalcium ?? ''}
                        onChange={(e) => setDraft({ ...draft, nutCalcium: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="0.0"
                        className="h-10"
                      />
                    </Field>
                    <Field label="铁 (mg)">
                      <Input
                        type="number"
                        step="0.1"
                        value={draft.nutIron ?? ''}
                        onChange={(e) => setDraft({ ...draft, nutIron: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="0.0"
                        className="h-10"
                      />
                    </Field>
                  </div>

                  {/* 自定义营养项 */}
                  <div className="border-t border-zinc-100 pt-6 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-[#2f2f2f]">自定义扩展营养项 (可选)</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newNut: CustomNutritionItem = {
                            id: createLocalId(),
                            name: '',
                            value: '',
                            unit: 'mg',
                            sort: draft.customNutrition.length + 1,
                            status: 'ACTIVE'
                          };
                          setDraft((d) => ({ ...d, customNutrition: [...d.customNutrition, newNut] }));
                        }}
                        className="text-xs font-semibold text-[#6f8b62] hover:text-[#5d7552]"
                      >
                        ＋ 新增自定义营养项
                      </button>
                    </div>

                    {draft.customNutrition.length === 0 ? (
                      <div className="bg-[#FAF7F2] rounded-xl p-4 text-center text-xs text-[#B7AEA1]">
                        暂无自定义营养项目。点击右上角“新增自定义项”配置。
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {draft.customNutrition.map((item, idx) => (
                          <div key={item.id} className="flex flex-wrap gap-3 items-center bg-[#fdfcf9] border border-zinc-100 rounded-xl p-3">
                            <div className="flex-1 min-w-[120px]">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const list = [...draft.customNutrition];
                                  list[idx].name = e.target.value;
                                  setDraft((d) => ({ ...d, customNutrition: list }));
                                }}
                                className="w-full text-xs h-9 rounded-lg border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                                placeholder="营养素名称, 如 叶酸"
                              />
                            </div>
                            <div className="flex-1 min-w-[80px]">
                              <input
                                type="text"
                                value={item.value}
                                onChange={(e) => {
                                  const list = [...draft.customNutrition];
                                  list[idx].value = e.target.value;
                                  setDraft((d) => ({ ...d, customNutrition: list }));
                                }}
                                className="w-full text-xs h-9 rounded-lg border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                                placeholder="值, 如 32.5"
                              />
                            </div>
                            <div className="w-20">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => {
                                  const list = [...draft.customNutrition];
                                  list[idx].unit = e.target.value;
                                  setDraft((d) => ({ ...d, customNutrition: list }));
                                }}
                                className="w-full text-xs h-9 rounded-lg border border-zinc-200 bg-white px-2 focus:border-[#6f8b62] outline-none"
                                placeholder="单位, 如 μg"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDraft((d) => ({
                                  ...d,
                                  customNutrition: d.customNutrition.filter((_, i) => i !== idx)
                                }));
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

              {/* Tab 8: 可以做什么 */}
              {activeTab === 7 && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2f2f2f]">可以做什么（关联菜谱）</h3>
                      <p className="text-xs text-[#B7AEA1] mt-1">展示与该食材关联的推荐菜谱菜品配置</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-[#2f2f2f]">
                      <input
                        type="checkbox"
                        checked={draft.showRecipes}
                        onChange={(e) => setDraft({ ...draft, showRecipes: e.target.checked })}
                        className="accent-[#6f8b62] h-4 w-4"
                      />
                      是否在 C 端展示关联菜谱
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="展示卡片标题">
                      <Input
                        value={draft.recipeTitle}
                        onChange={(e) => setDraft({ ...draft, recipeTitle: e.target.value })}
                        placeholder="如：推荐菜谱、可以做什么"
                        className="h-10"
                      />
                    </Field>
                    <Field label="展示上限数量">
                      <Input
                        type="number"
                        value={draft.recipeCountLimit}
                        onChange={(e) => setDraft({ ...draft, recipeCountLimit: Number(e.target.value) })}
                        placeholder="推荐食谱的展示数量限制"
                        className="h-10"
                      />
                    </Field>
                    <Field label="排序展示权重">
                      <select
                        value={draft.recipeSortRule}
                        onChange={(e) => setDraft({ ...draft, recipeSortRule: e.target.value })}
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:border-[#6f8b62] outline-none"
                      >
                        <option value="HOT">按热度高低 (HOT)</option>
                        <option value="NEW">按发布时间 (NEW)</option>
                        <option value="RECOMMEND">优先推荐标志 (RECOMMEND)</option>
                      </select>
                    </Field>
                  </div>

                  {/* 关联菜谱搜索区域 */}
                  <div className="border-t border-zinc-100 pt-6 mt-4">
                    <h4 className="text-sm font-semibold text-[#2f2f2f] mb-3">搜索并添加菜谱</h4>
                    <div className="relative">
                      <Input
                        value={recipeQuery}
                        onChange={(e) => setRecipeQuery(e.target.value)}
                        placeholder="输入关键字搜索系统库中的菜谱..."
                        className="h-11"
                      />
                      {recipeLoading && (
                        <div className="absolute right-3 top-3.5 text-xs text-[#B7AEA1]">搜索中...</div>
                      )}

                      {/* 搜索悬浮结果面板 */}
                      {searchedRecipes.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto divide-y divide-zinc-100">
                          {searchedRecipes.map((r) => {
                            const alreadyAdded = draft.recipes.some((item) => item.id === r.id);
                            return (
                              <div key={r.id} className="p-3 flex items-center justify-between hover:bg-zinc-50 transition">
                                <div className="flex items-center gap-3">
                                  {r.cover ? (
                                    <img
                                      src={resolveAssetUrl(r.cover)}
                                      alt={r.title}
                                      className="w-10 h-10 object-cover rounded-lg border"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-[10px] text-zinc-400">
                                      无图
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-xs font-semibold text-[#2f2f2f]">{r.title}</div>
                                    <div className="text-[10px] text-[#B7AEA1] mt-0.5">
                                      {r.category?.name ?? '菜谱分类'} | {r.cookTime ?? 0}分钟 | {r.difficulty ?? '初级'}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  disabled={alreadyAdded}
                                  onClick={() => {
                                    const newItem: AssociatedRecipeItem = {
                                      id: r.id,
                                      title: r.title,
                                      cover: r.cover,
                                      categoryName: r.category?.name ?? '菜谱',
                                      cookTime: r.cookTime,
                                      difficulty: r.difficulty,
                                      sort: draft.recipes.length + 1
                                    };
                                    setDraft((d) => ({ ...d, recipes: [...d.recipes, newItem] }));
                                    setRecipeQuery('');
                                    setSearchedRecipes([]);
                                  }}
                                  className={[
                                    'text-xs font-semibold px-3 py-1.5 rounded-lg border transition',
                                    alreadyAdded
                                      ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                                      : 'bg-white border-[#6f8b62] text-[#6f8b62] hover:bg-[#edf5ea]'
                                  ].join(' ')}
                                >
                                  {alreadyAdded ? '已添加' : '＋ 选择'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 已选关联列表表格 */}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-[#2f2f2f] mb-3">已选关联菜谱列表</h4>
                    {draft.recipes.length === 0 ? (
                      <div className="bg-[#FAF7F2] rounded-xl p-8 text-center text-xs text-[#B7AEA1]">
                        未关联任何菜谱，请在上方搜索进行关联。
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-[#e9e2d6] bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#fcfbf9] text-[#6f6a61] border-b border-[#e9e2d6] font-semibold">
                            <tr>
                              <th className="p-3">菜谱封面</th>
                              <th className="p-3">菜谱名称</th>
                              <th className="p-3">分类</th>
                              <th className="p-3">时长</th>
                              <th className="p-3">难度</th>
                              <th className="p-3 text-center">排序操作</th>
                              <th className="p-3 text-center">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {draft.recipes.map((item, idx) => (
                              <tr key={item.id} className="border-b border-zinc-100 last:border-b-0">
                                <td className="p-2">
                                  {item.cover ? (
                                    <img
                                      src={resolveAssetUrl(item.cover)}
                                      alt="封面"
                                      className="w-8 h-8 object-cover rounded-lg border"
                                    />
                                  ) : (
                                    <span className="text-zinc-400">无封面</span>
                                  )}
                                </td>
                                <td className="p-2 font-semibold text-[#2f2f2f]">{item.title}</td>
                                <td className="p-2 text-[#6f6a61]">{item.categoryName}</td>
                                <td className="p-2 text-[#6f6a61]">{item.cookTime ? `${item.cookTime}分钟` : '-'}</td>
                                <td className="p-2 text-[#6f6a61]">{item.difficulty ?? '-'}</td>
                                <td className="p-2 text-center space-x-1.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => {
                                      const arr = [...draft.recipes];
                                      const temp = arr[idx];
                                      arr[idx] = arr[idx - 1];
                                      arr[idx - 1] = temp;
                                      setDraft((d) => ({ ...d, recipes: arr }));
                                    }}
                                    className="bg-zinc-50 hover:bg-zinc-100 px-2 py-1 border rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    ▲ 上移
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === draft.recipes.length - 1}
                                    onClick={() => {
                                      const arr = [...draft.recipes];
                                      const temp = arr[idx];
                                      arr[idx] = arr[idx + 1];
                                      arr[idx + 1] = temp;
                                      setDraft((d) => ({ ...d, recipes: arr }));
                                    }}
                                    className="bg-zinc-50 hover:bg-zinc-100 px-2 py-1 border rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    ▼ 下移
                                  </button>
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDraft((d) => ({
                                        ...d,
                                        recipes: d.recipes.filter((r) => r.id !== item.id)
                                      }));
                                    }}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded transition"
                                  >
                                    移除
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 9: 发布设置 */}
              {activeTab === 8 && (
                <div className="space-y-6">
                  <div className="border-b border-zinc-100 pb-4">
                    <h3 className="text-lg font-semibold text-[#2f2f2f]">发布设置</h3>
                    <p className="text-xs text-[#B7AEA1] mt-1">控制食材在 C 端的前端可见性及其他发布元数据参数</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="排序值" desc="决定 C 端列表的展示顺序，数值越大越靠前">
                      <Input
                        type="number"
                        value={draft.sort}
                        onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
                        className="h-11"
                      />
                    </Field>

                    <Field label="内容类型 (不可编辑)">
                      <Input
                        value="食材 (INGREDIENT)"
                        disabled
                        className="h-11 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                      />
                    </Field>

                    <div className="flex flex-col gap-3 mt-4">
                      <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-[#2f2f2f]">
                        <input
                          type="checkbox"
                          checked={draft.status === 'ACTIVE'}
                          onChange={(e) => setDraft({ ...draft, status: e.target.checked ? 'ACTIVE' : 'DISABLED' })}
                          className="accent-[#6f8b62] h-4.5 w-4.5"
                        />
                        启用本食材 (设为 ACTIVE 状态)
                      </label>
                      <p className="text-xs text-[#B7AEA1] ml-7">禁用后本食材及其相关价格历史在 C 端应用中均不可见</p>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                      <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-[#2f2f2f]">
                        <input
                          type="checkbox"
                          checked={draft.isRecommend}
                          onChange={(e) => setDraft({ ...draft, isRecommend: e.target.checked })}
                          className="accent-[#6f8b62] h-4.5 w-4.5"
                        />
                        标记为推荐食材 (将在首页相关专题页优先轮播展现)
                      </label>
                    </div>
                  </div>

                  {/* 详细元信息面板 */}
                  <div className="border-t border-zinc-100 pt-6 mt-6 bg-[#fcfbf9] rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-[#6f6a61] uppercase tracking-wider">系统元数据详情</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#6f6a61]">
                      <div>
                        <span className="font-semibold">发布状态：</span>
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
                            <span className="font-semibold">维护人：</span>
                            {draft.createdBy || '管理员'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 底部固定操作栏 */}
              <div className="mt-8 pt-6 border-t border-zinc-100 flex gap-4 justify-end items-center bg-white sticky bottom-0 z-10 py-3">
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
                  {saving ? '发布中...' : '保存并发布'}
                </Button>
              </div>
            </div>
          </div>

          {/* 右侧手机所见即所得预览区域 */}
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-3xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#2f2f2f]">内容实时预览 (C端效果)</h2>
                <span className="text-[10px] bg-[#edf5ea] text-[#6f8b62] px-2 py-0.5 rounded-full font-semibold">
                  iPhone 15
                </span>
              </div>

              {/* iPhone 15 外壳仿真框 */}
              <div className="overflow-hidden rounded-[36px] border-[10px] border-[#222] bg-[#FAF7F2] shadow-xl relative font-sans w-full max-w-[320px] mx-auto">
                {/* 摄像头灵动岛 */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 h-5 w-24 bg-black rounded-full z-20 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 bg-[#111] rounded-full absolute right-4" />
                </div>
                {/* 仿真系统状态栏 */}
                <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[10px] font-semibold text-[#2f2f2f]">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </div>

                {/* 详情页首屏封面图 */}
                <div className="h-44 bg-[#F5F1EA] relative border-b border-[#e9e2d6]">
                  {draft.coverUrl ? (
                    <img
                      src={resolveAssetUrl(draft.coverUrl)}
                      alt="封面预览"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[#B7AEA1] font-medium">
                      封面预览区
                    </div>
                  )}
                </div>

                {/* 详情卡片与信息展示层 */}
                <div className="space-y-4 p-4 max-h-[380px] overflow-y-auto bg-white rounded-t-3xl -mt-5 relative z-10 shadow-2xl">
                  <div>
                    <h3 className="text-lg font-bold text-[#2f2f2f]">{draft.name || '圣女果'}</h3>
                    {draft.alias && (
                      <p className="text-[10px] text-[#B7AEA1] mt-0.5">别名：{draft.alias}</p>
                    )}
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#edf5ea] px-2.5 py-0.5 text-[9px] text-[#6f8b62] font-medium">
                      {selectedCategoryName}
                    </span>
                    {draft.isRecommend && (
                      <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[9px] text-orange-600 font-medium">
                        精选推荐
                      </span>
                    )}
                    {draft.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[9px] text-zinc-600 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 预计价格 */}
                  {draft.showPrice && (
                    <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-zinc-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#B7AEA1]">实时参考价格</div>
                        <div className="text-base font-extrabold text-[#6f8b62] mt-0.5">
                          ¥{draft.currentPrice !== null ? draft.currentPrice.toFixed(2) : '0.00'}
                          <span className="text-xs font-normal text-[#6f6a61]"> / {draft.priceUnit}</span>
                        </div>
                      </div>
                      {draft.priceSource && (
                        <div className="text-[9px] text-[#B7AEA1] text-right">
                          <div>来源: {draft.priceSource.slice(0, 8)}</div>
                          <div className="mt-0.5">{draft.priceDate}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 时令与简介 */}
                  <div className="text-[11px] leading-5 text-[#6f6a61]">
                    {draft.seasonMonth && (
                      <div className="mb-1">
                        🍂 <span className="font-semibold text-[#2f2f2f]">时令季节：</span>
                        {draft.seasonMonth.split(',').map((m) => `${m}月`).join('、')}
                      </div>
                    )}
                    {draft.origin && (
                      <div className="mb-1.5">
                        📍 <span className="font-semibold text-[#2f2f2f]">地理产地：</span>
                        {draft.origin}
                      </div>
                    )}
                    <p className="bg-zinc-50 p-2 rounded-xl text-zinc-600 text-[10px]">
                      {draft.description || '口感清甜脆嫩、鲜嫩多汁，可用于烹制多种家常美食，是餐桌上深受喜爱的经典食材。'}
                    </p>
                  </div>

                  {/* 核心营养成分 */}
                  <div className="grid grid-cols-4 gap-1.5 border-y border-zinc-100 py-2.5 text-center text-[9px] text-[#6f6a61]">
                    <div className="border-r border-zinc-100">
                      <div className="font-bold text-[#2f2f2f] text-[10px]">{draft.nutCalorie ?? '18'}</div>
                      <div>热量(kcal)</div>
                    </div>
                    <div className="border-r border-zinc-100">
                      <div className="font-bold text-[#2f2f2f] text-[10px]">{draft.nutProtein ?? '0.8'}g</div>
                      <div>蛋白质</div>
                    </div>
                    <div className="border-r border-zinc-100">
                      <div className="font-bold text-[#2f2f2f] text-[10px]">{draft.nutFat ?? '0.2'}g</div>
                      <div>脂肪</div>
                    </div>
                    <div>
                      <div className="font-bold text-[#2f2f2f] text-[10px]">{draft.nutCarbo ?? '3.5'}g</div>
                      <div>碳水</div>
                    </div>
                  </div>

                  {/* 怎么挑预览 */}
                  {draft.selectionGroups.length > 0 && (
                    <div className="space-y-1.5 border-b border-zinc-100 pb-2.5">
                      <h4 className="text-[11px] font-bold text-[#2f2f2f]">💡 挑选攻略</h4>
                      <div className="bg-[#FAF7F2] p-2 rounded-xl border border-zinc-100 text-[10px] text-zinc-600">
                        <span className="font-semibold text-[#6f8b62]">【{draft.selectionGroups[0].title}】</span>
                        {draft.selectionGroups[0].items[0]?.title}：
                        {draft.selectionGroups[0].items[0]?.description.slice(0, 36)}...
                      </div>
                    </div>
                  )}

                  {/* 保存指南 */}
                  {draft.storageMethods.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold text-[#2f2f2f]">🏠 保存指南</h4>
                      <div className="flex gap-2">
                        {draft.storageMethods.slice(0, 2).map((sm) => (
                          <div key={sm.id} className="flex-1 bg-zinc-50 p-2 rounded-lg text-center">
                            <div className="font-semibold text-[10px] text-[#6f8b62]">{sm.name}</div>
                            <div className="text-[9px] text-[#B7AEA1] mt-0.5">{sm.duration} | {sm.temperature}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 按钮 */}
                  <button
                    type="button"
                    className="w-full bg-[#6f8b62] text-white font-semibold rounded-xl h-10 text-xs shadow-md transition"
                  >
                    加入菜篮子
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
              <h2 className="text-sm font-semibold text-[#2f2f2f]">操作指引</h2>
              <ul className="mt-4 space-y-2 text-xs leading-5 text-[#6f6a61]">
                <li>• 分步表单分为九个 Tab 独立输入。</li>
                <li>• 左下角切换“上一步/下一步”，系统会对当前 Tab 校验必填项。</li>
                <li>• 点按 Tab 选项栏也可以直接跳转。</li>
                <li>• 表单字段在右侧 iPhone 预览中实时渲染。</li>
              </ul>
            </div>
          </aside>
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
