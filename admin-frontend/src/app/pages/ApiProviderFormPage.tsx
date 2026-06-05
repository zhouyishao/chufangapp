import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';

type Draft = {
  name: string;
  type: string;
  provider: string;
  method: 'GET' | 'POST';
  baseUrl: string;
  appKey: string;
  appSecret: string;
  timeout: number;
  dailyLimit: number;
  defaultHeaders: string;
  defaultParams: string;
  dataPath: string;
  description: string;
  status: '启用' | '禁用';
};

const emptyDraft: Draft = {
  name: '', type: '菜谱', provider: '', method: 'GET', baseUrl: '',
  appKey: '', appSecret: '', timeout: 10000, dailyLimit: 10000,
  defaultHeaders: '', defaultParams: '', dataPath: 'data.list',
  description: '', status: '启用'
};

const mockDrafts: Record<string, Draft> = {
  '1': { ...emptyDraft, name: '菜谱资源接口', type: '菜谱', provider: '官方数据', baseUrl: 'https://api.example.com/v2/recipes', appKey: 'recipe_app', dailyLimit: 10000, defaultHeaders: '{"Content-Type":"application/json"}', defaultParams: '{"page":1,"pageSize":20}', description: '同步菜谱列表、详情、步骤和食材清单。' },
  '2': { ...emptyDraft, name: '食材数据库接口', type: '食材', provider: '官方数据', baseUrl: 'https://api.example.com/v1/ingredients', appKey: 'ingredient_app', dailyLimit: 5000, dataPath: 'data.items', description: '同步食材基础信息、营养和价格。' },
  '3': { ...emptyDraft, name: '水果营养接口', type: '水果', provider: '第三方', baseUrl: 'https://nutrition-api.io/fruits', appKey: 'fruit_app', dailyLimit: 20000, description: '获取水果营养、时令和挑选信息。' },
  '4': { ...emptyDraft, name: '调料库导入接口', type: '调料', provider: '第三方', method: 'POST', baseUrl: 'https://seasoning-db.com/import', status: '禁用', appKey: 'seasoning_app', dailyLimit: 3000, description: '导入调料规格、用法和替代调料。' },
  '5': { ...emptyDraft, name: '酒水百科接口', type: '酒水', provider: '第三方', baseUrl: 'https://beverage-wiki.org/api', appKey: 'beverage_app', dailyLimit: 8000, description: '同步酒水百科和搭配建议。' },
  '6': { ...emptyDraft, name: '价格行情接口', type: '价格', provider: '市场数据', method: 'POST', baseUrl: 'https://market-price.cn/api/v1', appKey: 'price_app', dailyLimit: 50000, description: '同步食材市场价格行情。' }
};

type Props = { mode: 'create' | 'edit' };

export const ApiProviderFormPage = ({ mode }: Props) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const canSave = draft.name.trim() && draft.baseUrl.trim() && !saving;

  useEffect(() => {
    if (mode === 'edit' && id) setDraft(mockDrafts[id] ?? { ...emptyDraft, name: `接口 ${id}`, baseUrl: 'https://api.example.com' });
  }, [id, mode]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true); setError(null);
    await new Promise(r => setTimeout(r, 300)); // mock API call
    setNotice('保存成功');
    setSaving(false);
    setTimeout(() => navigate('/resources/api-providers', { replace: true }), 400);
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null); setError(null);
    await new Promise(r => setTimeout(r, 800)); // mock test
    setTestResult(`测试连接成功 — 延迟 42ms，状态码 200`);
    setTesting(false);
  };

  return (
    <section className="space-y-6">
      <PageHeader title={mode === 'edit' ? '编辑接口' : '新增接口'} description="配置 API 接口基本信息、认证方式和请求参数。" />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
      {testResult ? <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">{testResult}</div> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate('/resources/api-providers')}>取消</Button>
              <Button variant="ghost" onClick={handleTest} disabled={testing}>{testing ? '测试中...' : '测试连接'}</Button>
              <Button disabled={!canSave} onClick={() => void handleSave()}>{saving ? '保存中...' : '保存接口'}</Button>
            </div>
          </div>

          <FormSection title="基础信息">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">接口名称 *</div><Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="例如：菜谱资源接口" /></div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">接口类型</div>
              <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                <option>菜谱</option><option>食材</option><option>调料</option><option>水果</option><option>酒水</option><option>价格</option>
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">服务商</div>
              <select value={draft.provider} onChange={e => setDraft({ ...draft, provider: e.target.value })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                <option value="">请选择</option><option value="官方数据">官方数据</option><option value="第三方">第三方</option><option value="市场数据">市场数据</option>
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">请求方式</div>
              <select value={draft.method} onChange={e => setDraft({ ...draft, method: e.target.value as Draft['method'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                <option>GET</option><option>POST</option>
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs text-[#8c8c8c]">状态</div>
              <select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Draft['status'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
                <option value="启用">启用</option><option value="禁用">禁用</option>
              </select>
            </div>
            </div>
          </FormSection>
          <FormSection title="接口配置">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">Base URL *</div><Input value={draft.baseUrl} onChange={e => setDraft({ ...draft, baseUrl: e.target.value })} placeholder="https://api.example.com/v2/recipes" /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">AppKey</div><Input value={draft.appKey} onChange={e => setDraft({ ...draft, appKey: e.target.value })} placeholder="应用密钥" /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">AppSecret / Token</div><Input value={draft.appSecret} onChange={e => setDraft({ ...draft, appSecret: e.target.value })} type="password" placeholder="加密存储" /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">超时时间 (ms)</div><Input type="number" value={draft.timeout} onChange={e => setDraft({ ...draft, timeout: Number(e.target.value) })} /></div>
            <div><div className="mb-1 text-xs text-[#8c8c8c]">每日调用上限</div><Input type="number" value={draft.dailyLimit} onChange={e => setDraft({ ...draft, dailyLimit: Number(e.target.value) })} /></div>
            </div>
          </FormSection>
          <FormSection title="请求参数与说明">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">默认请求头 (JSON)</div><textarea value={draft.defaultHeaders} onChange={e => setDraft({ ...draft, defaultHeaders: e.target.value })} className="min-h-16 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-mono outline-none" placeholder='{"Content-Type": "application/json"}' /></div>
            <div className="md:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">默认请求参数 (JSON)</div><textarea value={draft.defaultParams} onChange={e => setDraft({ ...draft, defaultParams: e.target.value })} className="min-h-16 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-mono outline-none" placeholder='{"page": 1, "pageSize": 20}' /></div>
            <div className="md:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">返回数据路径</div><Input value={draft.dataPath} onChange={e => setDraft({ ...draft, dataPath: e.target.value })} placeholder="data.list" /></div>
            <div className="md:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">描述</div><textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} className="min-h-20 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none" /></div>
            </div>
          </FormSection>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
            <div className="text-sm font-medium text-[#2f2f2f] mb-3">配置提示</div>
            <ul className="space-y-2 text-xs text-[#8c8c8c] leading-relaxed">
              <li>· 保存后可在资源接入中心使用此接口</li>
              <li>· 可在接口配置列表中测试连接</li>
              <li>· AppKey / AppSecret 等敏感字段加密存储</li>
              <li>· 启用后才允许被资源接入中心调用</li>
              <li>· 每日调用上限达到后自动暂停</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
            <div className="text-sm font-medium text-[#2f2f2f] mb-3">请求预览</div>
            <div className="rounded-xl bg-[#f5f1ea] p-3 font-mono text-xs text-[#2f2f2f] break-all">
              <div className="text-[#8c8c8c]">{draft.method} {draft.baseUrl || 'https://api.example.com/...'}</div>
              {draft.defaultHeaders && <div className="mt-1 text-[#7a8b6f]">Headers: {draft.defaultHeaders}</div>}
              {draft.defaultParams && <div className="mt-1 text-[#c27b48]">Params: {draft.defaultParams}</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-[#e9e2d6] bg-white p-5">
    <h2 className="mb-4 text-lg font-semibold text-[#2f2f2f]">{title}</h2>
    {children}
  </section>
);
