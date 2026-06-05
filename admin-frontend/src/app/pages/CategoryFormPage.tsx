import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createCategory, getCategory, updateCategory } from '../api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import type { IngredientCategory } from '../types';

type Draft = {
  name: string;
  type: IngredientCategory['type'];
  parentName: string;
  level: number;
  sort: number;
  status: IngredientCategory['status'];
  isPublish: boolean;
  description: string;
  remark: string;
};

const emptyDraft: Draft = {
  name: '',
  type: 'RECIPE',
  parentName: '',
  level: 1,
  sort: 0,
  status: 'ACTIVE',
  isPublish: true,
  description: '',
  remark: ''
};

const typeOptions: { value: IngredientCategory['type']; label: string }[] = [
  { value: 'RECIPE', label: '菜谱' },
  { value: 'INGREDIENT', label: '食材' },
  { value: 'SEASONING', label: '调料' },
  { value: 'FRUIT', label: '水果' },
  { value: 'BEVERAGE', label: '酒水' }
];

export const CategoryFormPage = ({ mode }: { mode: 'create' | 'edit' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSave = useMemo(() => draft.name.trim().length > 0 && Number.isFinite(draft.sort) && !saving, [draft.name, draft.sort, saving]);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    setLoading(true);
    setError(null);
    void getCategory(id)
      .then((item) => {
        setDraft({
          name: item.name,
          type: item.type,
          parentName: '',
          level: 1,
          sort: item.sort,
          status: item.status,
          isPublish: item.isPublish,
          description: `${item.name} 分类用于内容归档、筛选和 App 展示。`,
          remark: ''
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id, mode]);

  const handleSave = async (publish: boolean) => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: draft.name.trim(),
        type: draft.type,
        sort: draft.sort,
        status: publish ? draft.status : 'DISABLED',
        isPublish: publish && draft.isPublish
      };
      if (mode === 'edit' && id) await updateCategory(id, payload);
      else await createCategory(payload);
      setNotice(publish ? '保存并发布成功' : '草稿已保存');
      window.setTimeout(() => navigate('/taxonomies/categories', { replace: true }), 350);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title={mode === 'edit' ? '编辑分类' : '新增分类'}
        description="维护分类名称、类型、层级、排序、状态和说明信息。"
        actions={<><Button variant="ghost" onClick={() => navigate('/taxonomies/categories')}>返回</Button><Button variant="ghost" disabled={saving} onClick={() => void handleSave(false)}>保存草稿</Button><Button disabled={!canSave} onClick={() => void handleSave(true)}>保存并发布</Button></>}
      />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
        {loading ? <div className="text-sm text-[#8c8c8c]">加载中...</div> : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Field label="分类名称 *"><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
            <Field label="分类类型">
              <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as Draft['type'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
            <Field label="上级分类"><Input value={draft.parentName} onChange={(event) => setDraft({ ...draft, parentName: event.target.value })} placeholder="不填则为一级分类" /></Field>
            <Field label="层级"><Input type="number" value={draft.level} onChange={(event) => setDraft({ ...draft, level: Number(event.target.value) })} /></Field>
            <Field label="排序"><Input type="number" value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: Number(event.target.value) })} /></Field>
            <Field label="状态">
              <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft['status'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                <option value="ACTIVE">启用</option><option value="DISABLED">停用</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm text-[#2f2f2f]"><input type="checkbox" checked={draft.isPublish} onChange={(event) => setDraft({ ...draft, isPublish: event.target.checked })} />在 App 展示</label>
            <div />
            <Field label="分类说明" className="lg:col-span-2"><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-28 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></Field>
            <Field label="备注" className="lg:col-span-2"><textarea value={draft.remark} onChange={(event) => setDraft({ ...draft, remark: event.target.value })} className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></Field>
          </div>
        )}
      </div>
    </section>
  );
};

const Field = ({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) => (
  <label className={className}>
    <div className="mb-1 text-xs text-[#8c8c8c]">{label}</div>
    {children}
  </label>
);
