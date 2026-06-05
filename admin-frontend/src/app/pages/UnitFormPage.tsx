import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';

type UnitType = '重量' | '容量' | '数量' | '包装' | '口语';
type Draft = {
  name: string;
  code: string;
  type: UnitType;
  baseUnit: string;
  ratio: string;
  target: string;
  isDefault: boolean;
  status: 'ACTIVE' | 'DISABLED';
  sort: number;
  description: string;
};

const emptyDraft: Draft = {
  name: '', code: '', type: '重量', baseUnit: '', ratio: '1',
  target: '食材、菜谱、采购', isDefault: false, status: 'ACTIVE', sort: 0, description: ''
};

type Props = { mode: 'create' | 'edit' };

// Mock unit data for edit mode
const mockUnits: Record<string, Draft> = {
  '1': { name: '克（g）', code: 'g', type: '重量', baseUnit: '克（g）', ratio: '1', target: '食材、菜谱、采购', isDefault: true, status: 'ACTIVE', sort: 0, description: '国际标准重量单位' }
};

export const UnitFormPage = ({ mode }: Props) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === 'edit');

  const canSave = draft.name.trim() && draft.code.trim() && !saving;

  useEffect(() => {
    if (mode === 'edit' && id && mockUnits[id]) {
      setDraft(mockUnits[id]);
      setLoading(false);
    } else if (mode === 'edit') {
      setLoading(false);
    }
  }, [id, mode]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true); setError(null);
    await new Promise(r => setTimeout(r, 200)); // mock
    setNotice('保存成功');
    setSaving(false);
    setTimeout(() => navigate('/taxonomies/units', { replace: true }), 400);
  };

  return (
    <section className="space-y-6">
      <PageHeader title={mode === 'edit' ? '编辑单位' : '新增单位'} description="维护单位名称、编码、类型和换算关系。" />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
        {loading ? <div className="text-sm text-[#8c8c8c]">加载中...</div> : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigate('/taxonomies/units')}>取消</Button>
                <Button variant="ghost" disabled={saving} onClick={() => void handleSave()}>保存草稿</Button>
                <Button disabled={!canSave} onClick={() => void handleSave()}>保存并发布</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><div className="mb-1 text-xs text-[#8c8c8c]">单位名称 *</div><Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="例如：克（g）" /></div>
              <div><div className="mb-1 text-xs text-[#8c8c8c]">单位编码 *</div><Input value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value })} placeholder="例如：g" /></div>
              <div>
                <div className="mb-1 text-xs text-[#8c8c8c]">单位类型</div>
                <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as UnitType })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                  <option>重量</option><option>容量</option><option>数量</option><option>包装</option><option>口语</option>
                </select>
              </div>
              <div>
                <div className="mb-1 text-xs text-[#8c8c8c]">状态</div>
                <select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Draft['status'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                  <option value="ACTIVE">启用</option><option value="DISABLED">禁用</option>
                </select>
              </div>
              <div><div className="mb-1 text-xs text-[#8c8c8c]">基础单位</div><Input value={draft.baseUnit} onChange={e => setDraft({ ...draft, baseUnit: e.target.value })} placeholder="例如：克（g）" /></div>
              <div><div className="mb-1 text-xs text-[#8c8c8c]">换算比例</div><Input value={draft.ratio} onChange={e => setDraft({ ...draft, ratio: e.target.value })} placeholder="例如：1000" /></div>
              <div><div className="mb-1 text-xs text-[#8c8c8c]">适用对象</div><Input value={draft.target} onChange={e => setDraft({ ...draft, target: e.target.value })} placeholder="食材、菜谱、采购" /></div>
              <div><div className="mb-1 text-xs text-[#8c8c8c]">排序</div><Input type="number" value={draft.sort} onChange={e => setDraft({ ...draft, sort: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={draft.isDefault} onChange={e => setDraft({ ...draft, isDefault: e.target.checked })} id="isDefault" />
                <label htmlFor="isDefault" className="text-sm text-[#2f2f2f]">设为默认单位</label>
              </div>
              <div className="md:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">单位说明</div><textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
