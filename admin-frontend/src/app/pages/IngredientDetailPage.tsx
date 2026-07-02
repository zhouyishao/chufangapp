import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getIngredient, resolveAssetUrl } from '../api';
import type { Ingredient } from '../types';
import { Button } from '../components/Button';
import { ImagePreview } from '../components/ImagePreview';
import { StatusTag } from '../components/StatusTag';

// Safe JSON parser helper
const parseJsonObject = <T,>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
};

type SelectionGuideItem = {
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

type ParsedNutrition = {
  description: string;
  properties: {
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
  };
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
};

type ParsedSelectionTips = {
  alias: string;
  englishName: string;
  tags: string[];
  origin: string;
  seasonStart: number | null;
  seasonEnd: number | null;
  selectionGroups: SelectionGuideGroup[];
};

type ParsedStorageMethod = {
  storageMethods: StorageMethodItem[];
  eatingRemind: string;
};

type ParsedTaboo = {
  imageDesc: string;
  priceInfo: {
    priceDesc: string;
    showPrice: boolean;
    showPriceTrend: boolean;
    priceTrends: PriceTrendItem[];
  };
  recipeInfo: {
    recipeTitle: string;
    recipeCountLimit: number;
    recipeSortRule: string;
    showRecipes: boolean;
    recipes: AssociatedRecipeItem[];
  };
};

export const IngredientDetailPage = ({ variant }: { variant?: 'ingredient' | 'fruit' | 'seasoning' }) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ?? '';

  const currentVariant = variant || 'ingredient';

  const variantConfig = useMemo(() => {
    const configs = {
      ingredient: {
        title: '食材详情',
        nameLabel: '食材名称',
        categoryLabel: '食材分类',
        backPath: '/content/ingredients',
        editPath: `/content/ingredients/${id}/edit`
      },
      fruit: {
        title: '水果详情',
        nameLabel: '水果名称',
        categoryLabel: '水果分类',
        backPath: '/content/fruits',
        editPath: `/content/fruits/${id}/edit`
      },
      seasoning: {
        title: '调料详情',
        nameLabel: '调料名称',
        categoryLabel: '调料分类',
        backPath: '/content/seasonings',
        editPath: `/content/seasonings/${id}/edit`
      }
    };
    return configs[currentVariant];
  }, [currentVariant, id]);

  const [item, setItem] = useState<Ingredient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('无效的 ID');
      return;
    }
    setLoading(true);
    setError(null);
    void getIngredient(id)
      .then((data) => setItem(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  // Safe parse for detailImages JSON array
  const detailImagesList = useMemo(() => {
    if (!item?.detailImages) return [];
    if (Array.isArray(item.detailImages)) return item.detailImages;
    try {
      if (typeof item.detailImages === 'string') {
        const parsed = JSON.parse(item.detailImages);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
    return [];
  }, [item?.detailImages]);

  // Safe parse for nutrition JSON field
  const nutritionData = useMemo((): ParsedNutrition => {
    const fallback: ParsedNutrition = {
      description: item?.nutrition || '',
      properties: {
        tasteCharacteristics: '',
        flavorCharacteristics: '',
        mainCharacteristics: '',
        cookingMethods: '',
        scenes: [],
        commonVarieties: '',
        eatingTips: '',
        showProperties: false,
        extTexture: '',
        extMoisture: '',
        extFiber: '',
        extOxidizable: false,
        extRawEat: false
      },
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
      customNutrition: []
    };

    if (!item?.nutrition) return fallback;
    const value = item.nutrition.trim();
    if (!value.startsWith('{')) return fallback;

    try {
      const parsed = JSON.parse(value);
      return {
        description: parsed.description ?? '',
        properties: {
          tasteCharacteristics: parsed.properties?.tasteCharacteristics ?? '',
          flavorCharacteristics: parsed.properties?.flavorCharacteristics ?? '',
          mainCharacteristics: parsed.properties?.mainCharacteristics ?? '',
          cookingMethods: parsed.properties?.cookingMethods ?? '',
          scenes: Array.isArray(parsed.properties?.scenes) ? parsed.properties.scenes : [],
          commonVarieties: parsed.properties?.commonVarieties ?? '',
          eatingTips: parsed.properties?.eatingTips ?? '',
          showProperties: typeof parsed.properties?.showProperties === 'boolean' ? parsed.properties.showProperties : true,
          extTexture: parsed.properties?.extTexture ?? '',
          extMoisture: parsed.properties?.extMoisture ?? '',
          extFiber: parsed.properties?.extFiber ?? '',
          extOxidizable: typeof parsed.properties?.extOxidizable === 'boolean' ? parsed.properties.extOxidizable : false,
          extRawEat: typeof parsed.properties?.extRawEat === 'boolean' ? parsed.properties.extRawEat : false
        },
        nutritionBase: parsed.nutritionBase ?? '每100g',
        nutCalorie: parsed.nutCalorie ?? null,
        nutProtein: parsed.nutProtein ?? null,
        nutFat: parsed.nutFat ?? null,
        nutCarbo: parsed.nutCarbo ?? null,
        nutFiber: parsed.nutFiber ?? null,
        nutVitC: parsed.nutVitC ?? null,
        nutSodium: parsed.nutSodium ?? null,
        nutPotassium: parsed.nutPotassium ?? null,
        nutCalcium: parsed.nutCalcium ?? null,
        nutIron: parsed.nutIron ?? null,
        customNutrition: Array.isArray(parsed.customNutrition) ? parsed.customNutrition : []
      };
    } catch {
      return fallback;
    }
  }, [item?.nutrition]);

  // Safe parse for selectionTips JSON field
  const selectionTipsData = useMemo((): ParsedSelectionTips => {
    const fallback: ParsedSelectionTips = {
      alias: '',
      englishName: '',
      tags: [],
      origin: '',
      seasonStart: null,
      seasonEnd: null,
      selectionGroups: []
    };

    if (!item?.selectionTips) return fallback;
    const value = item.selectionTips.trim();
    if (!value.startsWith('{')) {
      return {
        ...fallback,
        alias: value // Fallback plain text to alias
      };
    }

    try {
      const parsed = JSON.parse(value);
      return {
        alias: parsed.alias ?? '',
        englishName: parsed.englishName ?? '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        origin: parsed.origin ?? '',
        seasonStart: parsed.seasonStart ?? null,
        seasonEnd: parsed.seasonEnd ?? null,
        selectionGroups: Array.isArray(parsed.selectionGroups) ? parsed.selectionGroups : []
      };
    } catch {
      return {
        ...fallback,
        alias: value
      };
    }
  }, [item?.selectionTips]);

  // Safe parse for storageMethod JSON field
  const storageMethodData = useMemo((): ParsedStorageMethod => {
    const fallback: ParsedStorageMethod = {
      storageMethods: [],
      eatingRemind: item?.storageMethod ?? ''
    };

    if (!item?.storageMethod) return fallback;
    const value = item.storageMethod.trim();
    if (!value.startsWith('{')) return fallback;

    try {
      const parsed = JSON.parse(value);
      return {
        storageMethods: Array.isArray(parsed.storageMethods) ? parsed.storageMethods : [],
        eatingRemind: parsed.eatingRemind ?? ''
      };
    } catch {
      return fallback;
    }
  }, [item?.storageMethod]);

  // Safe parse for taboo JSON field
  const tabooData = useMemo((): ParsedTaboo => {
    const fallback: ParsedTaboo = {
      imageDesc: '',
      priceInfo: {
        priceDesc: '',
        showPrice: true,
        showPriceTrend: true,
        priceTrends: []
      },
      recipeInfo: {
        recipeTitle: '可以做什么',
        recipeCountLimit: 6,
        recipeSortRule: 'HOT',
        showRecipes: true,
        recipes: []
      }
    };

    if (!item?.taboo) return fallback;
    const value = item.taboo.trim();
    if (!value.startsWith('{')) {
      return {
        ...fallback,
        imageDesc: value // Fallback plain text to taboo description
      };
    }

    try {
      const parsed = JSON.parse(value);
      return {
        imageDesc: parsed.imageDesc ?? '',
        priceInfo: {
          priceDesc: parsed.priceInfo?.priceDesc ?? '',
          showPrice: typeof parsed.priceInfo?.showPrice === 'boolean' ? parsed.priceInfo.showPrice : true,
          showPriceTrend: typeof parsed.priceInfo?.showPriceTrend === 'boolean' ? parsed.priceInfo.showPriceTrend : true,
          priceTrends: Array.isArray(parsed.priceInfo?.priceTrends) ? parsed.priceInfo.priceTrends : []
        },
        recipeInfo: {
          recipeTitle: parsed.recipeInfo?.recipeTitle ?? '可以做什么',
          recipeCountLimit: parsed.recipeInfo?.recipeCountLimit ?? 6,
          recipeSortRule: parsed.recipeInfo?.recipeSortRule ?? 'HOT',
          showRecipes: typeof parsed.recipeInfo?.showRecipes === 'boolean' ? parsed.recipeInfo.showRecipes : true,
          recipes: Array.isArray(parsed.recipeInfo?.recipes) ? parsed.recipeInfo.recipes : []
        }
      };
    } catch {
      return {
        ...fallback,
        imageDesc: value
      };
    }
  }, [item?.taboo]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#e9e2d6] pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-[#2f2f2f]">{variantConfig.title}</h2>
          <p className="mt-1 text-sm text-[#8c8c8c]">
            查看并维护{variantConfig.title === '食材详情' ? '食材' : variantConfig.title === '水果详情' ? '水果' : '调料'}的各项属性、挑选技巧、保存指南及价格行情。
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate(variantConfig.backPath)}>
            返回列表
          </Button>
          <Button onClick={() => navigate(variantConfig.editPath)}>编辑信息</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="text-sm text-zinc-500">正在获取内容详情...</span>
        </div>
      ) : item ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Cover Header */}
            <div className="overflow-hidden rounded-[2rem] border border-[#e9e2d6] bg-[#fdfbf7] p-2">
              <div className="relative h-80 w-full overflow-hidden rounded-[calc(2rem-0.5rem)] bg-[#f5f1ea]">
                {item.cover ? (
                  <ImagePreview src={item.cover} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-[#b7aea1]">
                    暂无封面图
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
                  <span className="rounded-full bg-[#7a8b6f] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                    {item.category?.name ?? '分类'}
                  </span>
                  <h1 className="mt-3 text-2xl font-bold">{item.name}</h1>
                  {selectionTipsData.alias && (
                    <p className="mt-1 text-sm text-zinc-200">别名：{selectionTipsData.alias}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Base Info Cards */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-4">
              <h3 className="text-base font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">基础信息</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-400 block text-xs mb-0.5">{variantConfig.nameLabel}</span>
                  <span className="font-semibold text-[#2f2f2f]">{item.name}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-xs mb-0.5">英文名/拼音</span>
                  <span className="font-medium text-[#2f2f2f]">{selectionTipsData.englishName || '—'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-xs mb-0.5">{variantConfig.categoryLabel}</span>
                  <span className="font-medium text-[#2f2f2f]">{item.category?.name ?? '—'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-xs mb-0.5">产地/源头</span>
                  <span className="font-medium text-[#2f2f2f]">{selectionTipsData.origin || '—'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-xs mb-0.5">计量单位</span>
                  <span className="font-medium text-[#2f2f2f]">{item.priceUnit || '—'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-xs mb-0.5">上市月份/周期</span>
                  <span className="font-medium text-[#2f2f2f]">
                    {item.seasonMonth ? `${item.seasonMonth}月` : '—'} 
                    {selectionTipsData.seasonStart && selectionTipsData.seasonEnd 
                      ? ` (集中上市：${selectionTipsData.seasonStart}月至${selectionTipsData.seasonEnd}月)` 
                      : ''}
                  </span>
                </div>
              </div>
              
              {nutritionData.description && (
                <div className="pt-2 border-t border-zinc-100">
                  <span className="text-zinc-400 block text-xs mb-1">简介与描述</span>
                  <p className="text-sm text-[#6f6a61] leading-relaxed whitespace-pre-wrap">{nutritionData.description}</p>
                </div>
              )}

              {tabooData.imageDesc && (
                <div className="pt-2 border-t border-zinc-100">
                  <span className="text-zinc-400 block text-xs mb-1">食用提醒 / 禁忌</span>
                  <p className="text-sm text-red-600 font-medium leading-relaxed whitespace-pre-wrap">{tabooData.imageDesc}</p>
                </div>
              )}
            </div>

            {/* Properties Features */}
            {nutritionData.properties.showProperties && (
              <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-4">
                <h3 className="text-base font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">特性与口感</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {nutritionData.properties.tasteCharacteristics && (
                    <div>
                      <span className="text-zinc-400 block text-xs mb-0.5">口感特点</span>
                      <span className="text-[#6f6a61]">{nutritionData.properties.tasteCharacteristics}</span>
                    </div>
                  )}
                  {nutritionData.properties.flavorCharacteristics && (
                    <div>
                      <span className="text-zinc-400 block text-xs mb-0.5">风味特点</span>
                      <span className="text-[#6f6a61]">{nutritionData.properties.flavorCharacteristics}</span>
                    </div>
                  )}
                  {nutritionData.properties.mainCharacteristics && (
                    <div className="md:col-span-2">
                      <span className="text-zinc-400 block text-xs mb-0.5">主要物理特点</span>
                      <span className="text-[#6f6a61]">{nutritionData.properties.mainCharacteristics}</span>
                    </div>
                  )}
                  {nutritionData.properties.cookingMethods && (
                    <div>
                      <span className="text-zinc-400 block text-xs mb-0.5">适合推荐做法</span>
                      <span className="text-[#6f6a61]">{nutritionData.properties.cookingMethods}</span>
                    </div>
                  )}
                  {nutritionData.properties.commonVarieties && (
                    <div>
                      <span className="text-zinc-400 block text-xs mb-0.5">常见品种</span>
                      <span className="text-[#6f6a61]">{nutritionData.properties.commonVarieties}</span>
                    </div>
                  )}
                </div>

                {/* Stretched detail properties */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-zinc-100">
                  {nutritionData.properties.extTexture && (
                    <div className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-center text-xs">
                      <span className="text-zinc-400 block mb-0.5">口感度</span>
                      <span className="font-bold text-[#2f2f2f]">{nutritionData.properties.extTexture}</span>
                    </div>
                  )}
                  {nutritionData.properties.extMoisture && (
                    <div className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-center text-xs">
                      <span className="text-zinc-400 block mb-0.5">水分比</span>
                      <span className="font-bold text-[#2f2f2f]">{nutritionData.properties.extMoisture}</span>
                    </div>
                  )}
                  {nutritionData.properties.extFiber && (
                    <div className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-center text-xs">
                      <span className="text-zinc-400 block mb-0.5">纤维感</span>
                      <span className="font-bold text-[#2f2f2f]">{nutritionData.properties.extFiber}</span>
                    </div>
                  )}
                  <div className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-center text-xs">
                    <span className="text-zinc-400 block mb-0.5">是否易氧化</span>
                    <span className={`font-bold ${nutritionData.properties.extOxidizable ? 'text-amber-600' : 'text-green-600'}`}>
                      {nutritionData.properties.extOxidizable ? '易氧化' : '不易氧化'}
                    </span>
                  </div>
                  <div className="p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-center text-xs">
                    <span className="text-zinc-400 block mb-0.5">是否适合生食</span>
                    <span className={`font-bold ${nutritionData.properties.extRawEat ? 'text-green-600' : 'text-zinc-500'}`}>
                      {nutritionData.properties.extRawEat ? '适合生食' : '需烹饪食用'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Price Information */}
            {tabooData.priceInfo.showPrice && (
              <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-4">
                <h3 className="text-base font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">价格行情与趋势</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400 block text-xs mb-0.5">当前参考价</span>
                    <span className="text-lg font-bold text-amber-600">
                      {item.currentPrice !== null ? `￥${item.currentPrice}` : '暂无'} 
                      <span className="text-xs text-zinc-500 font-normal"> / {item.priceUnit || '斤'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-xs mb-0.5">价格来源渠道</span>
                    <span className="font-medium text-[#2f2f2f]">{item.priceSource || '默认批发价'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-xs mb-0.5">行情更新日期</span>
                    <span className="font-medium text-[#2f2f2f]">
                      {item.priceDate ? new Date(item.priceDate).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>

                {tabooData.priceInfo.priceDesc && (
                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-normal">
                    <strong>价格说明：</strong> {tabooData.priceInfo.priceDesc}
                  </div>
                )}

                {/* Price Trends List */}
                {tabooData.priceInfo.showPriceTrend && tabooData.priceInfo.priceTrends.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-zinc-100">
                    <h4 className="text-xs font-semibold text-[#6f6a61]">价格波动明细记录</h4>
                    <div className="overflow-x-auto rounded-xl border border-zinc-200">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 font-semibold text-zinc-600">
                          <tr>
                            <th className="p-2.5">记录日期</th>
                            <th className="p-2.5">价格</th>
                            <th className="p-2.5">地区</th>
                            <th className="p-2.5">采集源</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-zinc-700">
                          {tabooData.priceInfo.priceTrends.map((trend, idx) => (
                            <tr key={trend.id || idx}>
                              <td className="p-2.5">{trend.date}</td>
                              <td className="p-2.5 font-semibold text-amber-600">￥{trend.price} / {trend.unit}</td>
                              <td className="p-2.5">{trend.region}</td>
                              <td className="p-2.5 text-zinc-500">{trend.source}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Nutrition Facts */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-4">
              <h3 className="text-base font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">
                营养元素列表 ({nutritionData.nutritionBase})
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                  <span className="block text-zinc-400 mb-0.5">能量</span>
                  <span className="font-bold text-zinc-800">{nutritionData.nutCalorie !== null ? `${nutritionData.nutCalorie} kcal` : '—'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                  <span className="block text-zinc-400 mb-0.5">蛋白质</span>
                  <span className="font-bold text-zinc-800">{nutritionData.nutProtein !== null ? `${nutritionData.nutProtein} g` : '—'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                  <span className="block text-zinc-400 mb-0.5">脂肪</span>
                  <span className="font-bold text-zinc-800">{nutritionData.nutFat !== null ? `${nutritionData.nutFat} g` : '—'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                  <span className="block text-zinc-400 mb-0.5">碳水</span>
                  <span className="font-bold text-zinc-800">{nutritionData.nutCarbo !== null ? `${nutritionData.nutCarbo} g` : '—'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                  <span className="block text-zinc-400 mb-0.5">膳食纤维</span>
                  <span className="font-bold text-zinc-800">{nutritionData.nutFiber !== null ? `${nutritionData.nutFiber} g` : '—'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                  <span className="block text-zinc-400 mb-0.5">维生素 C</span>
                  <span className="font-bold text-zinc-800">{nutritionData.nutVitC !== null ? `${nutritionData.nutVitC} mg` : '—'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                  <span className="block text-zinc-400 mb-0.5">钠</span>
                  <span className="font-bold text-zinc-800">{nutritionData.nutSodium !== null ? `${nutritionData.nutSodium} mg` : '—'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                  <span className="block text-zinc-400 mb-0.5">钾</span>
                  <span className="font-bold text-zinc-800">{nutritionData.nutPotassium !== null ? `${nutritionData.nutPotassium} mg` : '—'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                  <span className="block text-zinc-400 mb-0.5">钙</span>
                  <span className="font-bold text-zinc-800">{nutritionData.nutCalcium !== null ? `${nutritionData.nutCalcium} mg` : '—'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                  <span className="block text-zinc-400 mb-0.5">铁</span>
                  <span className="font-bold text-zinc-800">{nutritionData.nutIron !== null ? `${nutritionData.nutIron} mg` : '—'}</span>
                </div>
              </div>

              {nutritionData.customNutrition.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <h4 className="text-xs font-semibold text-[#6f6a61]">其它营养/特质指标</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {nutritionData.customNutrition.map((item, idx) => (
                      <div key={item.id || idx} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center text-xs">
                        <span className="block text-zinc-400 mb-0.5 truncate">{item.name}</span>
                        <span className="font-bold text-zinc-800">{item.value} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Media details - Video & Images */}
            {(detailImagesList.length > 0 || item.selectionMedia) && (
              <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-4">
                <h3 className="text-base font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">图文及视频素材</h3>
                
                {item.selectionMedia && (
                  <div className="space-y-2">
                    <span className="text-zinc-400 block text-xs">挑选介绍视频</span>
                    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#e9e2d6] bg-black">
                      <video src={resolveAssetUrl(item.selectionMedia)} controls className="h-full w-full" />
                    </div>
                  </div>
                )}

                {detailImagesList.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-zinc-400 block text-xs">详情轮播图集</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {detailImagesList.map((imgUrl, idx) => (
                        <div key={idx} className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                          <ImagePreview src={imgUrl} alt={`图片集 ${idx + 1}`} className="h-28 w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (1/3 width) */}
          <div className="space-y-6">
            
            {/* Selection Guides */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">怎么挑选</h3>
              
              {selectionTipsData.selectionGroups.length > 0 ? (
                <div className="space-y-4">
                  {selectionTipsData.selectionGroups.map((group, idx) => (
                    <div key={group.id || idx} className="space-y-2 bg-[#fdfbf7] p-3 rounded-xl border border-[#e9e2d6]">
                      <div className="font-semibold text-sm text-[#7a8b6f]">{group.title}</div>
                      {group.description && <p className="text-xs text-zinc-500">{group.description}</p>}
                      <div className="space-y-2 mt-2 pt-2 border-t border-dashed border-zinc-200">
                        {group.items.map((sub, sIdx) => (
                          <div key={sIdx} className="space-y-1.5 text-xs">
                            <span className="font-semibold text-[#2f2f2f] block">· {sub.title}</span>
                            <p className="text-zinc-600 leading-normal">{sub.description}</p>
                            {sub.image && (
                              <div className="overflow-hidden rounded-lg w-full max-h-24">
                                <ImagePreview src={sub.image} alt={sub.title} className="w-full object-cover" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 py-1">暂无挑选要领配置</p>
              )}
            </div>

            {/* Storage Guides */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">怎么保存</h3>
              
              {storageMethodData.storageMethods.length > 0 ? (
                <div className="space-y-3">
                  {storageMethodData.storageMethods.map((method, idx) => (
                    <div key={method.id || idx} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-[#2f2f2f]">{method.name}</span>
                        <span className="text-amber-600">{method.duration}</span>
                      </div>
                      {method.temperature && (
                        <div className="text-[10px] text-zinc-400">建议温度：{method.temperature}</div>
                      )}
                      <p className="text-[11px] text-zinc-500 leading-normal">{method.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 py-1">暂无保存方法配置</p>
              )}

              {storageMethodData.eatingRemind && (
                <div className="bg-[#eff3ec] p-3 rounded-lg border-l-4 border-[#7a8b6f] text-xs text-[#6f6a61] leading-relaxed">
                  <strong>食用提醒：</strong> {storageMethodData.eatingRemind}
                </div>
              )}
            </div>

            {/* Associated Recipes */}
            {tabooData.recipeInfo.showRecipes && (
              <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">
                  {tabooData.recipeInfo.recipeTitle || '可以做什么'}
                </h3>
                
                {tabooData.recipeInfo.recipes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {tabooData.recipeInfo.recipes.slice(0, tabooData.recipeInfo.recipeCountLimit).map((recipe, idx) => (
                      <div
                        key={recipe.id || idx}
                        className="flex gap-3 items-center p-2 rounded-xl bg-[#fdfbf7] border border-[#e9e2d6] hover:border-[#7a8b6f] cursor-pointer"
                        onClick={() => navigate(`/content/recipes/${recipe.id}`)}
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <ImagePreview src={recipe.cover} alt={recipe.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-[#2f2f2f] truncate">{recipe.title}</span>
                          <span className="block text-[10px] text-zinc-400 mt-0.5">
                            {recipe.categoryName} · {recipe.cookTime ? `${recipe.cookTime}分钟` : '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-1">暂无关联菜谱配置</p>
                )}
              </div>
            )}

            {/* Metadata and Stats */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-3 text-xs text-[#b7aea1]">
              <h4 className="text-xs font-semibold text-[#6f6a61] border-b border-zinc-100 pb-2 mb-2">系统属性</h4>
              <div className="flex justify-between">
                <span>业务编码 ID</span>
                <span className="font-mono">{item.code || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>时令月份设置</span>
                <span>{item.seasonMonth ? `${item.seasonMonth}月` : '未设置'}</span>
              </div>
              <div className="flex justify-between">
                <span>状态</span>
                <StatusTag
                  label={item.status === 'ACTIVE' ? '启用' : '禁用'}
                  tone={item.status === 'ACTIVE' ? 'green' : 'gray'}
                />
              </div>
              <div className="flex justify-between">
                <span>公开展示</span>
                <span>{item.isPublish ? '显示中' : '隐藏'}</span>
              </div>
              <div className="flex justify-between">
                <span>设为推荐</span>
                <span>{item.isRecommend ? '是' : '否'}</span>
              </div>
              <div className="flex justify-between">
                <span>排序权重</span>
                <span>{item.sort}</span>
              </div>
              <div className="flex justify-between">
                <span>创建时间</span>
                <span>{new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
              </div>
              <div className="flex justify-between">
                <span>更新时间</span>
                <span>{new Date(item.updatedAt).toLocaleString('zh-CN', { hour12: false })}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e9e2d6] bg-white p-10 text-center text-sm text-[#8c8c8c]">
          未找到对应的数据。
        </div>
      )}
    </div>
  );
};
