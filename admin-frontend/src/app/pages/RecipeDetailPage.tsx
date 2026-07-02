import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getRecipe, resolveAssetUrl } from '../api';
import type { Recipe } from '../types';
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
  carbo: number | null;
  fiber: number | null;
  vitC: number | null;
  sodium: number | null;
  calcium: number | null;
  potassium: number | null;
  iron: number | null;
  customNutrition: CustomNutritionItem[];
};

type RecipeTipsData = {
  tipsText: string;
  cookingTips: CookingTipItem[];
  nutrition: RecipeNutrition;
  scenes: string[];
  keywords: string[];
  source: string;
  author: string;
  auditRemark: string;
  relatedTopics: string[];
  relatedTags: string[];
  recommendPositions: string[];
};

const defaultNutrition: RecipeNutrition = {
  base: '每100g',
  calories: null,
  protein: null,
  fat: null,
  carbo: null,
  fiber: null,
  vitC: null,
  sodium: null,
  calcium: null,
  potassium: null,
  iron: null,
  customNutrition: []
};

const defaultTipsObj: RecipeTipsData = {
  tipsText: '',
  cookingTips: [],
  nutrition: defaultNutrition,
  scenes: [],
  keywords: [],
  source: '',
  author: '',
  auditRemark: '',
  relatedTopics: [],
  relatedTags: [],
  recommendPositions: []
};

export const RecipeDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ?? '';

  const [item, setItem] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('无效的 ID');
      return;
    }
    setLoading(true);
    setError(null);
    void getRecipe(id)
      .then((data) => setItem(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  // Safe parse for images array
  const galleryImages = useMemo(() => {
    if (!item?.images) return [];
    if (Array.isArray(item.images)) return item.images;
    try {
      if (typeof item.images === 'string') {
        const parsed = JSON.parse(item.images);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
    return [];
  }, [item?.images]);

  // Safe parse for nested tips data (Option A)
  const parsedTips = useMemo((): RecipeTipsData => {
    if (!item?.tips) return defaultTipsObj;
    const value = item.tips.trim();
    if (!value.startsWith('{')) {
      // Legacy format (pure text)
      return {
        ...defaultTipsObj,
        tipsText: value
      };
    }
    try {
      const parsed = JSON.parse(value);
      return {
        tipsText: parsed.tipsText ?? '',
        cookingTips: Array.isArray(parsed.cookingTips) ? parsed.cookingTips : [],
        nutrition: parsed.nutrition ? { ...defaultNutrition, ...parsed.nutrition } : defaultNutrition,
        scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        source: parsed.source ?? '',
        author: parsed.author ?? '',
        auditRemark: parsed.auditRemark ?? '',
        relatedTopics: Array.isArray(parsed.relatedTopics) ? parsed.relatedTopics : [],
        relatedTags: Array.isArray(parsed.relatedTags) ? parsed.relatedTags : [],
        recommendPositions: Array.isArray(parsed.recommendPositions) ? parsed.recommendPositions : []
      };
    } catch {
      return {
        ...defaultTipsObj,
        tipsText: value
      };
    }
  }, [item?.tips]);

  const auditStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'green';
      case 'PENDING': return 'orange';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  };

  const auditStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED': return '已审核通过';
      case 'PENDING': return '待审核';
      case 'REJECTED': return '已退回';
      case 'DRAFT': return '草稿';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#e9e2d6] pb-5">
        <div>
          <h2 className="text-2xl font-semibold text-[#2f2f2f]">菜谱详情</h2>
          <p className="mt-1 text-sm text-[#8c8c8c]">查看系统菜谱、烹饪参数、用料清单与图文步骤</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            返回
          </Button>
          <Button onClick={() => navigate(`/content/recipes/${id}/edit`)}>编辑菜谱</Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="text-sm text-zinc-500">正在载入菜谱资料...</span>
        </div>
      ) : item ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Left / Center: Primary Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Banner / Cover Visual Block */}
            <div className="overflow-hidden rounded-[2rem] border border-[#e9e2d6] bg-[#fdfbf7] p-2">
              <div className="relative h-80 w-full overflow-hidden rounded-[calc(2rem-0.5rem)]">
                <ImagePreview src={item.cover} alt={item.title} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
                  <span className="rounded-full bg-[#7a8b6f] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                    {item.category?.name ?? '菜谱'}
                  </span>
                  <h1 className="mt-3 text-2xl font-bold">{item.title}</h1>
                  {item.subtitle && <p className="mt-1 text-sm text-zinc-200">{item.subtitle}</p>}
                </div>
              </div>
            </div>

            {/* Description Block */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-3">
              <h3 className="text-base font-semibold text-[#2f2f2f]">菜谱简介</h3>
              <p className="text-sm text-[#6f6a61] leading-relaxed whitespace-pre-wrap">
                {item.description?.trim() || '暂无简介'}
              </p>
            </div>

            {/* Ingredients Section */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-4">
              <h3 className="text-base font-semibold text-[#2f2f2f]">用料清单</h3>
              {(item.ingredients ?? []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(item.ingredients ?? []).map((ing, index) => (
                    <div
                      key={ing.id || index}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#fdfbf7] border border-[#f5f1ea] text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-[#7a8b6f] w-5">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="font-medium text-[#2f2f2f]">{ing.name}</span>
                        {ing.type && (
                          <span className="text-[10px] text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.2">
                            {ing.type}
                          </span>
                        )}
                      </div>
                      <div className="text-[#6f6a61] font-semibold text-right">
                        {ing.amount ?? '-'} {ing.unit ?? ''}
                        {ing.note && <span className="block text-[10px] font-normal text-zinc-400 mt-0.5">{ing.note}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 py-2">暂无用料数据</p>
              )}
            </div>

            {/* Steps Section */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-5">
              <h3 className="text-base font-semibold text-[#2f2f2f]">烹饪步骤</h3>
              {(item.steps ?? []).length > 0 ? (
                <div className="space-y-6">
                  {(item.steps ?? []).map((step, index) => (
                    <div key={step.id || index} className="flex flex-col md:flex-row gap-4 border-b border-zinc-100 pb-5 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#7a8b6f]/10 text-[#7a8b6f] font-bold text-sm shrink-0">
                        {step.sortIndex ?? index + 1}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <p className="text-sm text-[#2f2f2f] leading-relaxed whitespace-pre-wrap">
                          {step.description}
                        </p>
                        
                        {step.duration ? (
                          <span className="inline-block text-xs text-zinc-400 bg-zinc-50 px-2 py-1 rounded">
                            预计耗时：{step.duration} 分钟
                          </span>
                        ) : null}

                        {/* Step Image */}
                        {step.image && (
                          <div className="mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200">
                            <ImagePreview src={step.image} alt={`步骤 ${step.sortIndex}`} className="h-32 w-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 py-2">暂无步骤数据</p>
              )}
            </div>

            {/* Gallery Images & Video Block */}
            {(galleryImages.length > 0 || item.video) && (
              <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-5">
                <h3 className="text-base font-semibold text-[#2f2f2f]">媒体素材</h3>
                
                {/* Video */}
                {item.video && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-[#6f6a61]">介绍/演示视频</h4>
                    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#e9e2d6] bg-black">
                      <video
                        src={resolveAssetUrl(item.video)}
                        controls
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Detail Images */}
                {galleryImages.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-semibold text-[#6f6a61]">其它参考图片</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {galleryImages.map((imgUrl, idx) => (
                        <div key={idx} className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                          <ImagePreview src={imgUrl} alt={`图片集 ${idx + 1}`} className="h-32 w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Cooking Tips & Tags (JSON Option A) */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-6 space-y-6">
              <h3 className="text-base font-semibold text-[#2f2f2f]">挑选、烹饪诀窍与建议</h3>
              
              {/* Main Tips */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#6f6a61]">小贴士 (Tips)</h4>
                <div className="bg-[#fdfbf7] rounded-xl border border-[#e9e2d6] p-4 text-sm text-[#6f6a61] whitespace-pre-wrap leading-relaxed">
                  {parsedTips.tipsText || '无建议内容'}
                </div>
              </div>

              {/* Cooking Tips List */}
              {parsedTips.cookingTips.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-[#6f6a61]">核心工艺步骤说明</h4>
                  <div className="space-y-2">
                    {parsedTips.cookingTips.map((tip, idx) => (
                      <div key={tip.id || idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                        <div className="flex justify-between text-xs font-semibold text-[#7a8b6f] mb-1">
                          <span>{tip.title} {tip.type ? `(${tip.type})` : ''}</span>
                          {tip.relatedStep && <span>关联步骤: {tip.relatedStep}</span>}
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed">{tip.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nutrition Facts */}
              {parsedTips.nutrition && (parsedTips.nutrition.calories !== null || parsedTips.nutrition.customNutrition.length > 0) && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-[#6f6a61]">热量营养测算 ({parsedTips.nutrition.base})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {parsedTips.nutrition.calories !== null && (
                      <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                        <span className="block text-zinc-400 mb-0.5">热量</span>
                        <span className="font-semibold text-zinc-800">{parsedTips.nutrition.calories} kcal</span>
                      </div>
                    )}
                    {parsedTips.nutrition.protein !== null && (
                      <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                        <span className="block text-zinc-400 mb-0.5">蛋白质</span>
                        <span className="font-semibold text-zinc-800">{parsedTips.nutrition.protein} g</span>
                      </div>
                    )}
                    {parsedTips.nutrition.fat !== null && (
                      <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                        <span className="block text-zinc-400 mb-0.5">脂肪</span>
                        <span className="font-semibold text-zinc-800">{parsedTips.nutrition.fat} g</span>
                      </div>
                    )}
                    {parsedTips.nutrition.carbo !== null && (
                      <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                        <span className="block text-zinc-400 mb-0.5">碳水</span>
                        <span className="font-semibold text-zinc-800">{parsedTips.nutrition.carbo} g</span>
                      </div>
                    )}
                    {parsedTips.nutrition.fiber !== null && (
                      <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                        <span className="block text-zinc-400 mb-0.5">膳食纤维</span>
                        <span className="font-semibold text-zinc-800">{parsedTips.nutrition.fiber} g</span>
                      </div>
                    )}
                    {parsedTips.nutrition.vitC !== null && (
                      <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                        <span className="block text-zinc-400 mb-0.5">维生素C</span>
                        <span className="font-semibold text-zinc-800">{parsedTips.nutrition.vitC} mg</span>
                      </div>
                    )}
                    {parsedTips.nutrition.sodium !== null && (
                      <div className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                        <span className="block text-zinc-400 mb-0.5">钠</span>
                        <span className="font-semibold text-zinc-800">{parsedTips.nutrition.sodium} mg</span>
                      </div>
                    )}
                    {parsedTips.nutrition.customNutrition.map((item, index) => (
                      <div key={item.id || index} className="p-2.5 rounded-xl bg-zinc-50 text-center border border-zinc-200 text-xs">
                        <span className="block text-zinc-400 mb-0.5 truncate">{item.name}</span>
                        <span className="font-semibold text-zinc-800">{item.value} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Metadata, Parameters, Relations */}
          <div className="space-y-6">
            
            {/* Quick Parameters Grid Card */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">基础烹饪参数</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">烹饪时间</span>
                  <span className="font-semibold text-zinc-700">{item.cookTime ? `${item.cookTime} 分钟` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">适合分量</span>
                  <span className="font-semibold text-zinc-700">{item.servings ? `${item.servings} 人份` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">热量</span>
                  <span className="font-semibold text-zinc-700">{item.calories ? `${item.calories} kcal` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">难度级别</span>
                  <span className="font-semibold text-zinc-700">{item.difficulty || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">口味类型</span>
                  <span className="font-semibold text-zinc-700">{item.taste || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">适用场景</span>
                  <span className="font-semibold text-zinc-700">{item.scene || '-'}</span>
                </div>
              </div>
            </div>

            {/* Publishing & Audit status details */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">状态与设置</h3>
              
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">审核状态</span>
                  <StatusTag
                    label={auditStatusLabel(item.auditStatus)}
                    tone={auditStatusColor(item.auditStatus)}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">展示设置</span>
                  <span className={`font-semibold ${item.isPublish ? 'text-green-600' : 'text-zinc-500'}`}>
                    {item.isPublish ? '公开展示' : '隐藏下架'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">推荐属性</span>
                  <span className="font-semibold text-zinc-700">
                    {item.isRecommend ? '✅ 已设为推荐' : '❌ 普通展示'}
                  </span>
                </div>
                {parsedTips.recommendPositions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-500 block">推荐位置</span>
                    <div className="flex flex-wrap gap-1">
                      {parsedTips.recommendPositions.map((pos, idx) => (
                        <span key={idx} className="bg-zinc-100 text-zinc-600 text-[10px] rounded px-1.5 py-0.5">
                          {pos}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">排序权重值</span>
                  <span className="font-medium text-zinc-700">{item.sort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">可视范围</span>
                  <span className="font-medium text-zinc-700">{item.visibility === 'PUBLIC' ? '全公开' : item.visibility ?? '-'}</span>
                </div>
                {parsedTips.auditRemark && (
                  <div className="space-y-1 pt-1 border-t border-zinc-100">
                    <span className="text-xs text-red-500 font-semibold block">审核退回说明/备注：</span>
                    <p className="text-xs text-zinc-500 leading-normal bg-red-50/50 p-2 rounded border border-red-100/50">
                      {parsedTips.auditRemark}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Source, Scenes & Keyword Tags */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#2f2f2f] border-b border-zinc-100 pb-2">关联与标签</h3>
              
              <div className="space-y-4 text-xs">
                {/* Keywords */}
                {parsedTips.keywords.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-[#6f6a61] block">搜索关键词</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedTips.keywords.map((k, idx) => (
                        <span key={idx} className="bg-[#f5f1ea] text-[#6f6a61] rounded-lg px-2 py-1 font-medium">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scenes */}
                {parsedTips.scenes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-semibold text-[#6f6a61] block">适用细分场景</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedTips.scenes.map((s, idx) => (
                        <span key={idx} className="bg-[#7a8b6f]/10 text-[#7a8b6f] rounded-lg px-2.5 py-1 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source details */}
                {(parsedTips.source || parsedTips.author) && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-100 text-sm">
                    {parsedTips.source && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 text-xs">信息来源</span>
                        <span className="font-semibold text-zinc-700 text-xs">{parsedTips.source}</span>
                      </div>
                    )}
                    {parsedTips.author && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 text-xs">内容作者</span>
                        <span className="font-semibold text-zinc-700 text-xs">{parsedTips.author}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Operations logs info */}
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 space-y-3 text-xs text-[#b7aea1]">
              <h4 className="text-xs font-semibold text-[#6f6a61] border-b border-zinc-100 pb-2 mb-2">系统日志</h4>
              <div className="flex justify-between">
                <span>业务编码 ID</span>
                <span className="font-mono">{item.code || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>创建时间</span>
                <span>{new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
              </div>
              <div className="flex justify-between">
                <span>最后修改</span>
                <span>{new Date(item.updatedAt).toLocaleString('zh-CN', { hour12: false })}</span>
              </div>
              <div className="flex justify-between">
                <span>浏览次数</span>
                <span>{item.viewCount} 次</span>
              </div>
            </div>
            
          </div>
          
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e9e2d6] bg-white p-10 text-center text-sm text-[#8c8c8c]">
          未找到对应的菜谱资料。
        </div>
      )}
    </div>
  );
};
