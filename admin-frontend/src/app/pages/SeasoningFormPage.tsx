import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createAdminResource, listCategories, updateAdminResource } from '../api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { UploadImage } from '../components/UploadImage';
import type { IngredientCategory } from '../types';

type Draft = {
  name: string;
  cover: string | null;
  categoryId: number | null;
  description: string | null;
  usageMethod: string | null;
  suitableDishes: string | null;
  substitute: string | null;
  storageMethod: string | null;
  nutritionNote: string | null;
  healthTip: string | null;
  currentPrice: number | null;
  priceUnit: string | null;
  status: 'ACTIVE' | 'DISABLED';
  sort: number;
  isPublish: boolean;
  isRecommend: boolean;
};

const emptyDraft: Draft = {
  name: '', cover: null, categoryId: null, description: null,
  usageMethod: null, suitableDishes: null, substitute: null,
  storageMethod: null, nutritionNote: null, healthTip: null,
  currentPrice: null, priceUnit: null, status: 'ACTIVE', sort: 0,
  isPublish: true, isRecommend: false
};

type Props = { mode: 'create' | 'edit' };

export const SeasoningFormPage = ({ mode }: Props) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = Number.parseInt(params.id ?? '', 10);

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSave = useMemo(() => draft.name.trim().length > 0 && !saving, [draft.name, saving]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const [cats] = await Promise.all([
          listCategories({ page: 1, pageSize: 100, type: 'SEASONING' })
        ]);
        if (!alive) return;
        setCategories(cats.list);
        if (mode === 'edit' && Number.isFinite(id)) {
          // Load existing seasoning data from API (placeholder until seasoning endpoint is ready)
          setLoading(false);
        }
      } catch (err) { if (alive) setError(err instanceof Error ? err.message : '加载失败'); }
      finally { if (alive) setLoading(false); }
    };
    void load();
    return () => { alive = false; };
  }, [id, mode]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true); setError(null);
    try {
      const payload = {
        name: draft.name.trim(), cover: draft.cover, categoryId: draft.categoryId,
        description: draft.description, usageMethod: draft.usageMethod,
        suitableDishes: draft.suitableDishes, substitute: draft.substitute,
        storageMethod: draft.storageMethod, nutritionNote: draft.nutritionNote,
        healthTip: draft.healthTip, currentPrice: draft.currentPrice, priceUnit: draft.priceUnit,
        status: draft.status, sort: draft.sort, isPublish: draft.isPublish, isRecommend: draft.isRecommend
      };
      if (mode === 'edit') await updateAdminResource('seasonings', String(id), payload);
      else await createAdminResource('seasonings', payload);
      setNotice('保存成功');
      setTimeout(() => navigate('/content/seasonings', { replace: true }), 400);
    } catch (err) { setError(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  return (
    <section className="space-y-6">
      <PageHeader title={mode === 'edit' ? '编辑调料' : '新增调料'} description="维护调料基础信息、规格属性、使用说明和关联内容。" />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
        {loading ? <div className="text-sm text-[#8c8c8c]">加载中...</div> : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2 flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigate('/content/seasonings')}>取消</Button>
                <Button variant="ghost" disabled={saving} onClick={() => void handleSave()}>保存草稿</Button>
                <Button disabled={!canSave} onClick={() => void handleSave()}>保存并发布</Button>
              </div>
            </div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">调料名称 *</div><Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">分类</div>
              <select value={draft.categoryId ?? ''} onChange={e => setDraft({ ...draft, categoryId: e.target.value ? Number(e.target.value) : null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                <option value="">未分类</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2"><UploadImage label="封面图片" value={draft.cover} onChange={cover => setDraft({ ...draft, cover })} /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">规格</div><Input value={draft.substitute ?? ''} onChange={e => setDraft({ ...draft, substitute: e.target.value })} placeholder="如: 500ml / 200g" /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">价格</div><Input type="number" value={draft.currentPrice ?? ''} onChange={e => setDraft({ ...draft, currentPrice: e.target.value === '' ? null : Number(e.target.value) })} /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">价格单位</div><Input value={draft.priceUnit ?? ''} onChange={e => setDraft({ ...draft, priceUnit: e.target.value })} placeholder="瓶 / 袋 / 盒" /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">储存方式</div><Input value={draft.storageMethod ?? ''} onChange={e => setDraft({ ...draft, storageMethod: e.target.value })} /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">排序</div><Input type="number" value={draft.sort} onChange={e => setDraft({ ...draft, sort: Number(e.target.value) })} /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">状态</div><select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Draft['status'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="ACTIVE">启用</option><option value="DISABLED">禁用</option></select></div>
            <div className="lg:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">描述</div><textarea value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></div>
            <div className="lg:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">使用说明</div><textarea value={draft.usageMethod ?? ''} onChange={e => setDraft({ ...draft, usageMethod: e.target.value })} className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" placeholder="使用方法和用量建议" /></div>
            <div className="lg:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">适用菜品</div><textarea value={draft.suitableDishes ?? ''} onChange={e => setDraft({ ...draft, suitableDishes: e.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></div>
            <div className="lg:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">营养备注</div><textarea value={draft.nutritionNote ?? ''} onChange={e => setDraft({ ...draft, nutritionNote: e.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></div>
            <div className="lg:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">健康提示</div><textarea value={draft.healthTip ?? ''} onChange={e => setDraft({ ...draft, healthTip: e.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></div>
            <div className="lg:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isPublish} onChange={e => setDraft({ ...draft, isPublish: e.target.checked })} />发布</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isRecommend} onChange={e => setDraft({ ...draft, isRecommend: e.target.checked })} />推荐</label>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
