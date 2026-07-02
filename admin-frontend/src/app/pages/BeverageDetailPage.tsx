import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getBeverage, resolveAssetUrl } from '../api';
import type { Beverage } from '../api';
import { Button } from '../components/Button';
import { ImagePreview } from '../components/ImagePreview';
import { StatusTag } from '../components/StatusTag';

type MixStepItem = {
  id: string;
  stepNo: number;
  description: string;
  image: string | null;
  estimatedTime: number | null;
  sort: number;
};

type BeveragePriceRecord = {
  id: string;
  date: string;
  region: string;
  price: number;
  unit: string;
  source: string;
};

type BeverageExtra = {
  subtitle: string;
  sweetness: string;
  taste: string;
  origin: string;
  brand: string;
  specification: string;
  gallery: string[];
  video: string | null;
  tags: string;
  drinkingTemp: string;
  packingForm: string;
  shelfLife: string;
  ingredients: string;
  nutritionInfo: string;
  pairings: string[];
  drinkingNotes: string[];
  mixMethod: string;
  baseLiquor: string;
  mixIngredients: string;
  accessories: string;
  garnish: string;
  glassType: string;
  iceType: string;
  mixSteps: MixStepItem[];
  mixTips: string;
  showMixMethod: boolean;
  estimatedPrice: number | null;
  priceUnit: string;
  priceSource: string;
  priceUpdateTime: string | null;
  showPrice: boolean;
  showPriceTrend: boolean;
  priceRemark: string;
  priceRecords: BeveragePriceRecord[];
  relatedCategories: string[];
  applicableScenes: string[];
  keywords: string;
  sourceAuthor: string;
  auditRemark: string;
};

const emptyExtra: BeverageExtra = {
  subtitle: '',
  sweetness: '',
  taste: '',
  origin: '',
  brand: '',
  specification: '',
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
  priceUpdateTime: '',
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

export const BeverageDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ?? '';

  const [item, setItem] = useState<Beverage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('无效的 ID');
      return;
    }
    setLoading(true);
    setError(null);
    void getBeverage(id)
      .then((data) => setItem(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  // Safe parse for beverage extra data stored in description field (Option A)
  const parsedExtra = useMemo((): BeverageExtra => {
    if (!item?.description) return emptyExtra;
    const value = item.description.trim();
    if (!value.startsWith('{')) {
      // Legacy text fallback
      return {
        ...emptyExtra,
        subtitle: ''
      };
    }
    try {
      const parsed = JSON.parse(value);
      return {
        subtitle: parsed.subtitle ?? '',
        sweetness: parsed.sweetness ?? '',
        taste: parsed.taste ?? '',
        origin: parsed.origin ?? '',
        brand: parsed.brand ?? '',
        specification: parsed.specification ?? '',
        gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
        video: parsed.video ?? null,
        tags: parsed.tags ?? '',
        drinkingTemp: parsed.drinkingTemp ?? '',
        packingForm: parsed.packingForm ?? '',
        shelfLife: parsed.shelfLife ?? '',
        ingredients: parsed.ingredients ?? '',
        nutritionInfo: parsed.nutritionInfo ?? '',
        pairings: Array.isArray(parsed.pairings) ? parsed.pairings : [],
        drinkingNotes: Array.isArray(parsed.drinkingNotes) ? parsed.drinkingNotes : [''],
        mixMethod: parsed.mixMethod ?? '摇和',
        baseLiquor: parsed.baseLiquor ?? '',
        mixIngredients: parsed.mixIngredients ?? '',
        accessories: parsed.accessories ?? '',
        garnish: parsed.garnish ?? '',
        glassType: parsed.glassType ?? '',
        iceType: parsed.iceType ?? '',
        mixSteps: Array.isArray(parsed.mixSteps) ? parsed.mixSteps : [],
        mixTips: parsed.mixTips ?? '',
        showMixMethod: typeof parsed.showMixMethod === 'boolean' ? parsed.showMixMethod : true,
        estimatedPrice: parsed.estimatedPrice ?? null,
        priceUnit: parsed.priceUnit ?? '瓶',
        priceSource: parsed.priceSource ?? '',
        priceUpdateTime: parsed.priceUpdateTime ?? '',
        showPrice: typeof parsed.showPrice === 'boolean' ? parsed.showPrice : true,
        showPriceTrend: typeof parsed.showPriceTrend === 'boolean' ? parsed.showPriceTrend : true,
        priceRemark: parsed.priceRemark ?? '',
        priceRecords: Array.isArray(parsed.priceRecords) ? parsed.priceRecords : [],
        relatedCategories: Array.isArray(parsed.relatedCategories) ? parsed.relatedCategories : [],
        applicableScenes: Array.isArray(parsed.applicableScenes) ? parsed.applicableScenes : [],
        keywords: parsed.keywords ?? '',
        sourceAuthor: parsed.sourceAuthor ?? '',
        auditRemark: parsed.auditRemark ?? ''
      };
    } catch {
      return emptyExtra;
    }
  }, [item?.description]);

  // Extract raw text if description isn't a JSON
  const rawDescription = useMemo(() => {
    if (!item?.description) return '';
    const val = item.description.trim();
    if (val.startsWith('{')) {
      try {
        const obj = JSON.parse(val);
        return obj.descriptionText ?? '';
      } catch {
        return val;
      }
    }
    return val;
  }, [item?.description]);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-[#e9e2d6] pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-[#2f2f2f]">酒水详情</h2>
          <p className="mt-1 text-sm text-[#8c8c8c]">查看系统酒水、饮品特性、包装规格及调制指南配方</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/content/beverages')}>
            返回列表
          </Button>
          <Button onClick={() => navigate(`/content/beverages/${id}/edit`)}>编辑酒水</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="text-sm text-zinc-500">正在读取酒水数据...</span>
        </div>
      ) : item ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Visual Header Block */}
            <div className="overflow-hidden rounded-[2rem] border border-[#e9e2d6] bg-[#fdfbf7] p-2">
              <div className="relative h-80 w-full overflow-hidden rounded-[calc(2rem-0.5rem)] bg-[#f5f1ea]">
                {item.coverImage ? (
                  <ImagePreview src={item.coverImage} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-[#b7aea1]">
                    暂无封面图
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
                  <span className="rounded-full bg-[#7a8b6f] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                    {item.category?.name ?? item.beverageType ?? '饮品'}
                  </span>
                  <h1 className="mt-3 text-2xl font-bold">{item.name}</h1>
                  {parsedExtra.subtitle && (
                    <p className="mt-1 text-sm text-zinc-200">{parsedExtra.subtitle}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-3">
              <h3 className="text-base font-semibold text-[#2f2f2f]">简介与描述</h3>
              <p className="text-sm text-[#6f6a61] leading-relaxed whitespace-pre-wrap">
                {rawDescription || '暂无描述'}
              </p>
            </div>

            {/* Drinking Specifications (Drinking guidelines) */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-4">
              <h3 className="text-base font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">饮用说明与规格</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {parsedExtra.drinkingTemp && (
                  <div>
                    <span className="text-zinc-400 block text-xs mb-0.5">最佳饮用温度</span>
                    <span className="text-[#6f6a61]">{parsedExtra.drinkingTemp}</span>
                  </div>
                )}
                {parsedExtra.packingForm && (
                  <div>
                    <span className="text-zinc-400 block text-xs mb-0.5">包装形式</span>
                    <span className="text-[#6f6a61]">{parsedExtra.packingForm}</span>
                  </div>
                )}
                {parsedExtra.shelfLife && (
                  <div>
                    <span className="text-zinc-400 block text-xs mb-0.5">保质期</span>
                    <span className="text-[#6f6a61]">{parsedExtra.shelfLife}</span>
                  </div>
                )}
                {parsedExtra.ingredients && (
                  <div className="md:col-span-2">
                    <span className="text-zinc-400 block text-xs mb-0.5">原料配料表</span>
                    <span className="text-[#6f6a61] whitespace-pre-wrap leading-normal">{parsedExtra.ingredients}</span>
                  </div>
                )}
                {parsedExtra.nutritionInfo && (
                  <div className="md:col-span-2">
                    <span className="text-zinc-400 block text-xs mb-0.5">基本营养成分</span>
                    <span className="text-[#6f6a61] whitespace-pre-wrap leading-normal">{parsedExtra.nutritionInfo}</span>
                  </div>
                )}
              </div>

              {/* Drinking notes text list */}
              {parsedExtra.drinkingNotes.filter(Boolean).length > 0 && (
                <div className="pt-3 border-t border-zinc-100 space-y-2">
                  <span className="text-zinc-400 block text-xs font-semibold">详细饮用说明 & 建议</span>
                  <div className="space-y-2">
                    {parsedExtra.drinkingNotes.filter(Boolean).map((note, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start text-xs bg-zinc-50 p-2.5 border border-zinc-200 rounded-xl">
                        <span className="text-[#7a8b6f] font-bold shrink-0">{idx + 1}.</span>
                        <p className="text-zinc-600 leading-normal">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mixing Methods (调制方法) */}
            {parsedExtra.showMixMethod && (parsedExtra.mixSteps.length > 0 || parsedExtra.baseLiquor) && (
              <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-5">
                <h3 className="text-base font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">调制方法配方</h3>
                
                {/* Mix ingredients details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-[#fdfbf7] p-4 border border-[#e9e2d6] rounded-xl text-left">
                  {parsedExtra.mixMethod && (
                    <div>
                      <span className="text-zinc-400 block mb-0.5">调制手法</span>
                      <span className="font-semibold text-zinc-700">{parsedExtra.mixMethod}</span>
                    </div>
                  )}
                  {parsedExtra.baseLiquor && (
                    <div>
                      <span className="text-zinc-400 block mb-0.5">基酒 / 主料</span>
                      <span className="font-semibold text-zinc-700">{parsedExtra.baseLiquor}</span>
                    </div>
                  )}
                  {parsedExtra.mixIngredients && (
                    <div>
                      <span className="text-zinc-400 block mb-0.5">辅配料</span>
                      <span className="font-semibold text-zinc-700">{parsedExtra.mixIngredients}</span>
                    </div>
                  )}
                  {parsedExtra.accessories && (
                    <div>
                      <span className="text-zinc-400 block mb-0.5">额外配件</span>
                      <span className="font-semibold text-zinc-700">{parsedExtra.accessories}</span>
                    </div>
                  )}
                  {parsedExtra.garnish && (
                    <div>
                      <span className="text-zinc-400 block mb-0.5">点缀/装饰物</span>
                      <span className="font-semibold text-zinc-700">{parsedExtra.garnish}</span>
                    </div>
                  )}
                  {parsedExtra.glassType && (
                    <div>
                      <span className="text-zinc-400 block mb-0.5">杯型建议</span>
                      <span className="font-semibold text-zinc-700">{parsedExtra.glassType}</span>
                    </div>
                  )}
                  {parsedExtra.iceType && (
                    <div>
                      <span className="text-zinc-400 block mb-0.5">建议冰块类型</span>
                      <span className="font-semibold text-zinc-700">{parsedExtra.iceType}</span>
                    </div>
                  )}
                </div>

                {/* Steps table */}
                {parsedExtra.mixSteps.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-semibold text-[#6f6a61]">工艺调制步骤</h4>
                    <div className="space-y-4">
                      {parsedExtra.mixSteps.map((step, idx) => (
                        <div key={step.id || idx} className="flex gap-3 text-xs border-b border-dashed border-zinc-100 pb-3 last:border-b-0 last:pb-0">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#7a8b6f]/10 text-[#7a8b6f] font-bold shrink-0">
                            {step.stepNo ?? idx + 1}
                          </span>
                          <div className="flex-1 space-y-2">
                            <p className="text-zinc-700 leading-normal">{step.description}</p>
                            {step.estimatedTime && (
                              <span className="text-[10px] text-zinc-400 block">预计时间：{step.estimatedTime}秒</span>
                            )}
                            {step.image && (
                              <div className="overflow-hidden rounded-lg w-32 border border-zinc-200 mt-1">
                                <ImagePreview src={step.image} alt={`步骤 ${step.stepNo}`} className="h-20 w-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsedExtra.mixTips && (
                  <div className="bg-[#eff3ec] p-3 rounded-lg border-l-4 border-[#7a8b6f] text-xs text-[#6f6a61] leading-relaxed">
                    <strong>调制建议贴士：</strong> {parsedExtra.mixTips}
                  </div>
                )}
              </div>
            )}

            {/* Price Information */}
            {parsedExtra.showPrice && (
              <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-4">
                <h3 className="text-base font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">销售价格行情</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400 block text-xs mb-0.5">当前估价</span>
                    <span className="text-lg font-bold text-amber-600">
                      {parsedExtra.estimatedPrice !== null ? `￥${parsedExtra.estimatedPrice}` : '暂无'} 
                      <span className="text-xs text-zinc-500 font-normal"> / {parsedExtra.priceUnit || '瓶'}</span>
                    </span>
                  </div>
                  {parsedExtra.priceSource && (
                    <div>
                      <span className="text-zinc-400 block text-xs mb-0.5">价格来源</span>
                      <span className="font-semibold text-zinc-700">{parsedExtra.priceSource}</span>
                    </div>
                  )}
                  {parsedExtra.priceUpdateTime && (
                    <div>
                      <span className="text-zinc-400 block text-xs mb-0.5">采集更新时间</span>
                      <span className="font-semibold text-zinc-700">{parsedExtra.priceUpdateTime}</span>
                    </div>
                  )}
                </div>

                {parsedExtra.priceRemark && (
                  <p className="text-xs text-[#6f6a61] p-3 bg-zinc-50 border border-zinc-200 rounded-xl whitespace-pre-wrap leading-normal">
                    <strong>备价说明：</strong> {parsedExtra.priceRemark}
                  </p>
                )}

                {parsedExtra.showPriceTrend && parsedExtra.priceRecords.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-zinc-100">
                    <h4 className="text-xs font-semibold text-[#6f6a61]">售价波动记录</h4>
                    <div className="overflow-x-auto rounded-xl border border-zinc-200">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200 font-semibold text-zinc-600">
                          <tr>
                            <th className="p-2.5">记录日期</th>
                            <th className="p-2.5">价格</th>
                            <th className="p-2.5">地区</th>
                            <th className="p-2.5">平台/来源</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-zinc-700">
                          {parsedExtra.priceRecords.map((rec, idx) => (
                            <tr key={rec.id || idx}>
                              <td className="p-2.5">{rec.date}</td>
                              <td className="p-2.5 font-semibold text-amber-600">￥{rec.price} / {rec.unit}</td>
                              <td className="p-2.5">{rec.region}</td>
                              <td className="p-2.5 text-zinc-500">{rec.source}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gallery Media */}
            {(parsedExtra.gallery.length > 0 || parsedExtra.video) && (
              <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-4">
                <h3 className="text-base font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">图集及视频素材</h3>
                
                {parsedExtra.video && (
                  <div className="space-y-2">
                    <span className="text-zinc-400 block text-xs">演示/宣传视频</span>
                    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#e9e2d6] bg-black">
                      <video src={resolveAssetUrl(parsedExtra.video)} controls className="h-full w-full" />
                    </div>
                  </div>
                )}

                {parsedExtra.gallery.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-zinc-400 block text-xs">详情图集</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {parsedExtra.gallery.map((imgUrl, idx) => (
                        <div key={idx} className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                          <ImagePreview src={imgUrl} alt={`图集图片 ${idx + 1}`} className="h-28 w-full object-cover" />
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
            
            {/* Quick Parameters */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">基本性能指标</h3>
              
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">酒水类别</span>
                  <span className="font-semibold text-zinc-700">{item.beverageType || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">产品品牌</span>
                  <span className="font-semibold text-zinc-700">{parsedExtra.brand || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">规格/容量</span>
                  <span className="font-semibold text-zinc-700">{parsedExtra.specification || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">含酒精</span>
                  <span className="font-semibold text-zinc-700">{item.isAlcoholic ? '酒精饮料 (含酒精)' : '无酒精饮料'}</span>
                </div>
                {item.isAlcoholic && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">酒精度数</span>
                    <span className="font-semibold text-zinc-700">{item.alcoholDegree !== null ? `${item.alcoholDegree}% vol` : '—'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">产地</span>
                  <span className="font-semibold text-zinc-700">{parsedExtra.origin || '—'}</span>
                </div>
                {parsedExtra.sweetness && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">甜度指标</span>
                    <span className="font-semibold text-zinc-700">{parsedExtra.sweetness}</span>
                  </div>
                )}
                {parsedExtra.taste && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">口感调性</span>
                    <span className="font-semibold text-zinc-700">{parsedExtra.taste}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested scenes and pairings */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">关联与搭配</h3>
              
              <div className="space-y-4 text-xs">
                {/* Pairing suggestions */}
                {parsedExtra.pairings.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-[#6f6a61] block">推荐佐餐/搭配建议</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedExtra.pairings.map((p, idx) => (
                        <span key={idx} className="bg-[#7a8b6f]/10 text-[#7a8b6f] rounded-lg px-2.5 py-1 font-semibold">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Applicable Scenes */}
                {parsedExtra.applicableScenes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-[#6f6a61] block">适用细分场景</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedExtra.applicableScenes.map((s, idx) => (
                        <span key={idx} className="bg-[#f5f1ea] text-[#6f6a61] rounded-lg px-2 py-1 font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Categories */}
                {parsedExtra.relatedCategories.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-[#6f6a61] block">其它关联类别</span>
                    <div className="flex flex-wrap gap-1">
                      {parsedExtra.relatedCategories.map((c, idx) => (
                        <span key={idx} className="bg-zinc-100 text-zinc-600 text-[10px] rounded px-1.5 py-0.5">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source author */}
                {parsedExtra.sourceAuthor && (
                  <div className="pt-2 border-t border-zinc-100 flex justify-between text-sm">
                    <span className="text-zinc-500 text-xs">来源 / 创作者</span>
                    <span className="font-semibold text-zinc-700 text-xs">{parsedExtra.sourceAuthor}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Keyword search tags */}
            {parsedExtra.keywords && (
              <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-3">
                <h3 className="text-sm font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">搜索关键词</h3>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {parsedExtra.keywords.split(',').map((k) => k.trim()).filter(Boolean).map((word, idx) => (
                    <span key={idx} className="bg-zinc-100 text-zinc-600 rounded px-2 py-0.7">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata & Audit records logs */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-3 text-xs text-[#b7aea1]">
              <h4 className="text-xs font-semibold text-[#6f6a61] border-b border-zinc-100 pb-2 mb-2">系统日志</h4>
              <div className="flex justify-between">
                <span>业务编码 ID</span>
                <span className="font-mono">{item.code || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>上架展示</span>
                <span className={`font-bold ${item.isPublish ? 'text-green-600' : 'text-zinc-500'}`}>
                  {item.isPublish ? '公开中' : '下架隐藏'}
                </span>
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
                <span>状态</span>
                <StatusTag
                  label={item.status === 'ACTIVE' ? '启用' : '停用'}
                  tone={item.status === 'ACTIVE' ? 'green' : 'gray'}
                />
              </div>
              <div className="flex justify-between">
                <span>录入日期</span>
                <span>{new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
              </div>
              <div className="flex justify-between">
                <span>更新修改</span>
                <span>{new Date(item.updatedAt).toLocaleString('zh-CN', { hour12: false })}</span>
              </div>
              {parsedExtra.auditRemark && (
                <div className="pt-2 border-t border-zinc-100 space-y-1">
                  <span className="text-xs text-red-500 font-semibold block">审核退回意见：</span>
                  <p className="text-xs text-zinc-500 bg-red-50 border border-red-100 p-2 rounded leading-relaxed">
                    {parsedExtra.auditRemark}
                  </p>
                </div>
              )}
            </div>
            
          </div>
          
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e9e2d6] bg-white p-10 text-center text-sm text-[#8c8c8c]">
          未找到对应数据。
        </div>
      )}
    </div>
  );
};
