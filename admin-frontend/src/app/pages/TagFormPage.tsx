import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { createTag, listTags, updateTag, type TagItem } from '../api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';

type Draft = {
  name: string;
  alias: string;
  scope: TagItem['scope'];
  applyObject: '食谱' | '食材';
  sort: number;
  status: TagItem['status'];
  isPublish: boolean;
  isHot: boolean;
  description: string;
  rule: string;
};

const emptyDraft: Draft = {
  name: '',
  alias: '',
  scope: 'RECIPE',
  applyObject: '食谱',
  sort: 0,
  status: 'ACTIVE',
  isPublish: true,
  isHot: false,
  description: '',
  rule: ''
};

const scopeOptions: { value: TagItem['scope']; label: string; object: Draft['applyObject'] }[] = [
  { value: 'RECIPE', label: '菜谱标签', object: '食谱' },
  { value: 'INGREDIENT', label: '食材标签', object: '食材' },
  { value: 'TASTE', label: '口味标签', object: '食谱' },
  { value: 'METHOD', label: '做法标签', object: '食谱' },
  { value: 'SCENE', label: '场景标签', object: '食谱' },
  { value: 'CROWD', label: '人群标签', object: '食谱' }
];

export const TagFormPage = ({ mode }: { mode: 'create' | 'edit' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canSave = useMemo(() => draft.name.trim().length > 0 && !saving, [draft.name, saving]);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    setLoading(true);
    setError(null);
    void listTags({ page: 1, pageSize: 200 })
      .then((data) => {
        const item = data.list.find((tag) => String(tag.id) === id);
        if (!item) throw new Error('未找到标签数据');
        const option = scopeOptions.find((scope) => scope.value === item.scope);
        setDraft({
          name: item.name,
          alias: '',
          scope: item.scope,
          applyObject: option?.object ?? '食谱',
          sort: item.sort,
          status: item.status,
          isPublish: item.isPublish,
          isHot: item.sort >= 80,
          description: `${item.name} 标签用于内容筛选、推荐和运营分组。`,
          rule: '按内容标题、分类、食材和人工标注进行关联。'
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id, mode]);

  const updateScope = (scope: TagItem['scope']) => {
    const option = scopeOptions.find((item) => item.value === scope);
    setDraft({ ...draft, scope, applyObject: option?.object ?? draft.applyObject });
  };

  const handleSave = async (publish: boolean) => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { name: draft.name.trim(), scope: draft.scope, sort: draft.sort, status: publish ? draft.status : 'DISABLED' as const, isPublish: publish && draft.isPublish };
      if (mode === 'edit' && id) await updateTag(Number(id), payload);
      else await createTag(payload);
      setNotice(publish ? '保存并发布成功' : '草稿已保存');
      window.setTimeout(() => navigate('/taxonomies/tags', { replace: true }), 350);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title={mode === 'edit' ? '编辑标签' : '新增标签'}
        description="维护标签名称、别名、类型、适用对象、排序、状态和关联规则。"
        actions={<><Button variant="ghost" onClick={() => navigate('/taxonomies/tags')}>返回</Button><Button variant="ghost" disabled={saving} onClick={() => void handleSave(false)}>保存草稿</Button><Button disabled={!canSave} onClick={() => void handleSave(true)}>保存并发布</Button></>}
      />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
        {loading ? <div className="text-sm text-[#8c8c8c]">加载中...</div> : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Field label="标签名称 *"><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
            <Field label="标签别名"><Input value={draft.alias} onChange={(event) => setDraft({ ...draft, alias: event.target.value })} placeholder="多个别名可用逗号分隔" /></Field>
            <Field label="标签类型"><select value={draft.scope} onChange={(event) => updateScope(event.target.value as TagItem['scope'])} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">{scopeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
            <Field label="适用对象"><Input value={draft.applyObject} onChange={(event) => setDraft({ ...draft, applyObject: event.target.value as Draft['applyObject'] })} /></Field>
            <Field label="排序"><Input type="number" value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: Number(event.target.value) })} /></Field>
            <Field label="状态"><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Draft['status'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="ACTIVE">启用</option><option value="DISABLED">停用</option></select></Field>
            <label className="flex items-center gap-2 rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm text-[#2f2f2f]"><input type="checkbox" checked={draft.isHot} onChange={(event) => setDraft({ ...draft, isHot: event.target.checked })} />高频标签</label>
            <label className="flex items-center gap-2 rounded-2xl bg-[#f5f1ea] px-4 py-3 text-sm text-[#2f2f2f]"><input type="checkbox" checked={draft.isPublish} onChange={(event) => setDraft({ ...draft, isPublish: event.target.checked })} />在 App 展示</label>
            <Field label="标签说明" className="lg:col-span-2"><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-28 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></Field>
            <Field label="关联规则" className="lg:col-span-2"><textarea value={draft.rule} onChange={(event) => setDraft({ ...draft, rule: event.target.value })} className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></Field>
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
