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
  seasonMonth: string | null;
  nutrition: string | null;
  selectionTips: string | null;
  storageMethod: string | null;
  taboo: string | null;
  currentPrice: number | null;
  priceUnit: string | null;
  description: string | null;
  status: 'ACTIVE' | 'DISABLED';
  sort: number;
  isPublish: boolean;
  isRecommend: boolean;
};

const emptyDraft: Draft = {
  name: '', cover: null, categoryId: null, seasonMonth: null,
  nutrition: null, selectionTips: null, storageMethod: null, taboo: null,
  currentPrice: null, priceUnit: null, description: null,
  status: 'ACTIVE', sort: 0, isPublish: true, isRecommend: false
};

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

type Props = { mode: 'create' | 'edit' };

export const FruitFormPage = ({ mode }: Props) => {
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
          listCategories({ page: 1, pageSize: 100, type: 'FRUIT' })
        ]);
        if (!alive) return;
        setCategories(cats.list);
        if (mode === 'edit' && Number.isFinite(id)) {
          // Load existing fruit data from API (placeholder until fruit endpoint is ready)
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
        seasonMonth: draft.seasonMonth, nutrition: draft.nutrition,
        selectionTips: draft.selectionTips, storageMethod: draft.storageMethod,
        taboo: draft.taboo, currentPrice: draft.currentPrice, priceUnit: draft.priceUnit,
        description: draft.description, status: draft.status, sort: draft.sort,
        isPublish: draft.isPublish, isRecommend: draft.isRecommend
      };
      if (mode === 'edit') await updateAdminResource('fruits', String(id), payload);
      else await createAdminResource('fruits', payload);
      setNotice('保存成功');
      setTimeout(() => navigate('/content/fruits', { replace: true }), 400);
    } catch (err) { setError(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const parseMonths = (v: string | null) => (v ?? '').split(/[,，/\s]+/).map(Number).filter(n => n >= 1 && n <= 12);

  return (
    <section className="space-y-6">
      <PageHeader title={mode === 'edit' ? '编辑水果' : '新增水果'} description="维护水果基础信息、营养属性、挑选方式和关联内容。" />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
        {loading ? <div className="text-sm text-[#8c8c8c]">加载中...</div> : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2 flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigate('/content/fruits')}>取消</Button>
                <Button variant="ghost" disabled={saving} onClick={() => void handleSave()}>保存草稿</Button>
                <Button disabled={!canSave} onClick={() => void handleSave()}>保存并发布</Button>
              </div>
            </div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">水果名称 *</div><Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">分类</div>
              <select value={draft.categoryId ?? ''} onChange={e => setDraft({ ...draft, categoryId: e.target.value ? Number(e.target.value) : null })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                <option value="">未分类</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2"><UploadImage label="封面图片" value={draft.cover} onChange={cover => setDraft({ ...draft, cover })} /></div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">上市季节</div>
              <div className="grid grid-cols-6 gap-2 rounded-2xl border border-[#e9e2d6] bg-[#f5f1ea] p-3">
                {monthOptions.map(m => {
                  const selected = parseMonths(draft.seasonMonth).includes(m);
                  return <button key={m} type="button" className={['rounded-full px-2 py-1 text-xs', selected ? 'bg-[#7a8b6f] text-white' : 'bg-white text-[#8c8c8c]'].join(' ')} onClick={() => { const s = new Set(parseMonths(draft.seasonMonth)); s.has(m) ? s.delete(m) : s.add(m); setDraft({ ...draft, seasonMonth: Array.from(s).sort((a, b) => a - b).join(',') || null }); }}>{m}月</button>;
                })}
              </div>
            </div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">价格</div><Input type="number" value={draft.currentPrice ?? ''} onChange={e => setDraft({ ...draft, currentPrice: e.target.value === '' ? null : Number(e.target.value) })} /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">价格单位</div><Input value={draft.priceUnit ?? ''} onChange={e => setDraft({ ...draft, priceUnit: e.target.value })} placeholder="斤 / 个 / kg" /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">储存方式</div><Input value={draft.storageMethod ?? ''} onChange={e => setDraft({ ...draft, storageMethod: e.target.value })} /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">排序</div><Input type="number" value={draft.sort} onChange={e => setDraft({ ...draft, sort: Number(e.target.value) })} /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">状态</div><select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Draft['status'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="ACTIVE">启用</option><option value="DISABLED">禁用</option></select></div>
            <div className="lg:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">营养信息</div><textarea value={draft.nutrition ?? ''} onChange={e => setDraft({ ...draft, nutrition: e.target.value })} className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></div>
            <div className="lg:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">挑选技巧</div><textarea value={draft.selectionTips ?? ''} onChange={e => setDraft({ ...draft, selectionTips: e.target.value })} className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></div>
            <div className="lg:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">食用禁忌</div><textarea value={draft.taboo ?? ''} onChange={e => setDraft({ ...draft, taboo: e.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></div>
            <div className="lg:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">描述</div><textarea value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></div>
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
