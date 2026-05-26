import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createIngredient, getIngredient, listCategories, updateIngredient } from '../api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { MediaUploader } from '../components/MediaUploader';
import { UploadImage } from '../components/UploadImage';
import type { Ingredient, IngredientCategory } from '../types';

type IngredientFormMode = 'create' | 'edit';

type Draft = {
  name: string;
  coverUrl: string | null;
  categoryId: number | null;
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
  isPublish: true,
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

const parseMonths = (value: string | null) =>
  (value ?? '')
    .split(/[,，/\s]+/)
    .map((month) => Number(month))
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12);

type Props = {
  mode: IngredientFormMode;
};

export const IngredientFormPage = ({ mode }: Props) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = Number.parseInt(params.id ?? '', 10);

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSave = useMemo(() => draft.name.trim().length > 0 && draft.categoryId !== null && !saving, [draft.categoryId, draft.name, saving]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [categoryResult, ingredient] = await Promise.all([
          listCategories({ page: 1, pageSize: 100, type: 'INGREDIENT' }),
          mode === 'edit' && Number.isFinite(id) ? getIngredient(id) : Promise.resolve(null)
        ]);
        if (!alive) return;
        setCategories(categoryResult.list);
        if (ingredient) setDraft(ingredientToDraft(ingredient));
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

  const handleSave = async () => {
    if (!canSave) return;
    if (draft.currentPrice !== null && !Number.isFinite(draft.currentPrice)) {
      setError('当前价格必须是数字');
      return;
    }
    if (!Number.isFinite(draft.sort)) {
      setError('排序必须是数字');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(draft);
      await (mode === 'edit' ? updateIngredient(id, payload) : createIngredient(payload));
      setNotice('保存成功');
      window.setTimeout(() => navigate('/content/ingredients', { replace: true }), 350);
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
          <div className="text-sm text-[#8c8c8c]">内容管理 / 食材管理</div>
          <h1 className="mt-2 text-3xl font-semibold text-[#2f2f2f]">{mode === 'edit' ? '编辑食材' : '新增食材'}</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">维护食材分类、时令、营养、挑选技巧、保存方法和当前价格。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/content/ingredients')}>
            返回列表
          </Button>
          <Button disabled={!canSave} onClick={() => void handleSave()}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
        {loading ? (
          <div className="text-sm text-[#8c8c8c]">加载中...</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">名称</div>
              <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">分类</div>
              <select
                value={draft.categoryId ?? ''}
                onChange={(event) => setDraft({ ...draft, categoryId: event.target.value ? Number(event.target.value) : null })}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="">未分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <UploadImage
                label="封面图片上传"
                value={draft.coverUrl}
                helperText="上传成功后表单只保存 coverUrl，对接 POST /api/admin/upload/image。"
                onChange={(coverUrl) => setDraft({ ...draft, coverUrl })}
              />
              {!draft.coverUrl ? <div className="mt-2 text-xs text-[#8c8c8c]">建议上传封面图片，列表和 App 详情页会优先展示该图。</div> : null}
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">时令月份</div>
              <div className="grid grid-cols-6 gap-2 rounded-2xl border border-[#e9e2d6] bg-[#f5f1ea] p-3">
                {monthOptions.map((month) => {
                  const selected = parseMonths(draft.seasonMonth).includes(month);
                  return (
                    <button
                      key={month}
                      type="button"
                      className={[
                        'rounded-full px-2 py-1 text-xs',
                        selected ? 'bg-[#7a8b6f] text-white' : 'bg-white text-[#8c8c8c]'
                      ].join(' ')}
                      onClick={() => {
                        const months = new Set(parseMonths(draft.seasonMonth));
                        if (months.has(month)) months.delete(month);
                        else months.add(month);
                        setDraft({ ...draft, seasonMonth: Array.from(months).sort((a, b) => a - b).join(',') || null });
                      }}
                    >
                      {month}月
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">排序</div>
              <Input type="number" value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: Number(event.target.value) })} />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">当前价格</div>
              <Input
                type="number"
                value={draft.currentPrice ?? ''}
                onChange={(event) => setDraft({ ...draft, currentPrice: event.target.value === '' ? null : Number(event.target.value) })}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">价格单位</div>
              <select
                value={draft.priceUnit ?? ''}
                onChange={(event) => setDraft({ ...draft, priceUnit: event.target.value || null })}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="">请选择单位</option>
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <MediaUploader
                label="食材详情图"
                value={draft.detailImages.map((url) => ({ url, type: 'image' }))}
                accept="image"
                multiple
                onChange={(items) => setDraft({ ...draft, detailImages: items.map((item) => item.url) })}
              />
            </div>
            <div className="lg:col-span-2">
              <MediaUploader
                label="挑选指南图片/视频"
                value={draft.selectionMedia ? [{ url: draft.selectionMedia, type: draft.selectionMedia.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image' }] : []}
                accept="mixed"
                onChange={(items) => setDraft({ ...draft, selectionMedia: items[0]?.url ?? null })}
              />
            </div>
            <div className="lg:col-span-2">
              <div className="mb-1 text-xs text-[#8c8c8c]">价格来源</div>
              <Input value={draft.priceSource ?? ''} onChange={(event) => setDraft({ ...draft, priceSource: event.target.value })} placeholder="菜市场 / 盒马 / 平台导入" />
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm text-[#2f2f2f]">
                <input type="checkbox" checked={draft.isPublish} onChange={(event) => setDraft({ ...draft, isPublish: event.target.checked })} />
                在 App 中展示
              </label>
              <label className="flex items-center gap-2 rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm text-[#2f2f2f]">
                <input type="checkbox" checked={draft.isRecommend} onChange={(event) => setDraft({ ...draft, isRecommend: event.target.checked })} />
                推荐
              </label>
              <select
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft['status'] })}
                className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">禁用</option>
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">营养信息</div>
              <textarea
                value={draft.nutrition ?? ''}
                onChange={(event) => setDraft({ ...draft, nutrition: event.target.value })}
                className="min-h-32 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">挑选技巧</div>
              <textarea
                value={draft.selectionTips ?? ''}
                onChange={(event) => setDraft({ ...draft, selectionTips: event.target.value })}
                className="min-h-32 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">保存方法</div>
              <textarea
                value={draft.storageMethod ?? ''}
                onChange={(event) => setDraft({ ...draft, storageMethod: event.target.value })}
                className="min-h-32 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">食用禁忌</div>
              <textarea
                value={draft.taboo ?? ''}
                onChange={(event) => setDraft({ ...draft, taboo: event.target.value })}
                className="min-h-32 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
