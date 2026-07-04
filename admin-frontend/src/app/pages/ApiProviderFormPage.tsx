import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  createResourceApiProvider,
  getResourceApiProvider,
  testResourceApiProvider,
  testSavedResourceApiProvider,
  updateResourceApiProvider
} from '../api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import type { ResourceApiProviderItem } from '../types';

type Draft = {
  name: string;
  providerName: string;
  resourceType: ResourceApiProviderItem['resourceType'];
  method: ResourceApiProviderItem['method'];
  endpointUrl: string;
  authType: ResourceApiProviderItem['authType'];
  appKey: string;
  secret: string;
  defaultHeaders: string;
  defaultParams: string;
  dataPath: string;
  timeoutMs: number;
  dailyLimit: number;
  description: string;
  status: ResourceApiProviderItem['status'];
};

const emptyDraft: Draft = {
  name: '',
  providerName: '',
  resourceType: 'RECIPE',
  method: 'GET',
  endpointUrl: '',
  authType: 'NONE',
  appKey: '',
  secret: '',
  defaultHeaders: '',
  defaultParams: '',
  dataPath: 'data.list',
  timeoutMs: 10000,
  dailyLimit: 10000,
  description: '',
  status: 'ACTIVE'
};

type Props = { mode: 'create' | 'edit' };

const parseJsonInput = (value: string) => {
  const text = value.trim();
  if (!text) return null;
  return JSON.parse(text) as Record<string, unknown>;
};

const formatJsonInput = (value: Record<string, unknown> | null | undefined) => (value ? JSON.stringify(value, null, 2) : '');

export const ApiProviderFormPage = ({ mode }: Props) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await getResourceApiProvider(id);
        setDraft({
          name: item.name,
          providerName: item.providerName,
          resourceType: item.resourceType,
          method: item.method,
          endpointUrl: item.endpointUrl,
          authType: item.authType,
          appKey: item.appKey ?? '',
          secret: '',
          defaultHeaders: formatJsonInput(item.defaultHeaders),
          defaultParams: formatJsonInput(item.defaultParams),
          dataPath: item.dataPath,
          timeoutMs: item.timeoutMs,
          dailyLimit: item.dailyLimit,
          description: item.description ?? '',
          status: item.status
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载接口配置失败');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, mode]);

  const canSave = Boolean(draft.name.trim() && draft.providerName.trim() && draft.endpointUrl.trim() && !saving && !loading);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...draft,
        appKey: draft.appKey.trim() || null,
        secret: draft.secret.trim() || null,
        defaultHeaders: parseJsonInput(draft.defaultHeaders),
        defaultParams: parseJsonInput(draft.defaultParams),
        description: draft.description.trim() || null
      };
      if (mode === 'edit' && id) {
        await updateResourceApiProvider(id, payload);
      } else {
        await createResourceApiProvider(payload);
      }
      setNotice(mode === 'edit' ? '接口配置已更新' : '接口配置已创建');
      navigate('/resources/api-providers');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    try {
      const payload = {
        ...draft,
        appKey: draft.appKey.trim() || null,
        secret: draft.secret.trim() || null,
        defaultHeaders: parseJsonInput(draft.defaultHeaders),
        defaultParams: parseJsonInput(draft.defaultParams),
        description: draft.description.trim() || null
      };
      const result = mode === 'edit' && id && !draft.secret.trim()
        ? await testSavedResourceApiProvider(id)
        : await testResourceApiProvider(payload);
      setPreview(result.preview);
      setNotice(`测试通过：共解析 ${result.total} 条，预览 ${result.preview.length} 条`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title={mode === 'edit' ? '编辑接口' : '新增接口'}
        description="配置公共资源 API 的地址、鉴权和映射规则，保存后可在资源接入中心直接同步。"
      />

      {loading ? <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4 text-sm text-[#8c8c8c]">加载中...</div> : null}
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/resources/api-providers')}>返回</Button>
            <Button variant="ghost" onClick={handleTest} disabled={testing || loading}>
              {testing ? '测试中...' : '测试连接'}
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {saving ? '保存中...' : '保存接口'}
            </Button>
          </div>

          <FormSection title="基础信息">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="接口名称 *">
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="例如：菜谱公共资源接口" />
              </Field>
              <Field label="服务商名称 *">
                <Input value={draft.providerName} onChange={(e) => setDraft({ ...draft, providerName: e.target.value })} placeholder="例如：示例开放平台" />
              </Field>
              <Field label="资源类型">
                <select value={draft.resourceType} onChange={(e) => setDraft({ ...draft, resourceType: e.target.value as Draft['resourceType'] })} className={selectClass}>
                  <option value="RECIPE">菜谱</option>
                  <option value="INGREDIENT">蔬菜/食材</option>
                  <option value="FRUIT">水果</option>
                  <option value="SEASONING">调料</option>
                  <option value="BEVERAGE">酒水</option>
                </select>
              </Field>
              <Field label="请求方式">
                <select value={draft.method} onChange={(e) => setDraft({ ...draft, method: e.target.value as Draft['method'] })} className={selectClass}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </Field>
              <Field label="鉴权方式">
                <select value={draft.authType} onChange={(e) => setDraft({ ...draft, authType: e.target.value as Draft['authType'] })} className={selectClass}>
                  <option value="NONE">无需鉴权</option>
                  <option value="HEADER_TOKEN">Header Token</option>
                  <option value="QUERY_KEY">Query Key</option>
                  <option value="CUSTOM_HEADERS">自定义请求头</option>
                </select>
              </Field>
              <Field label="状态">
                <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft['status'] })} className={selectClass}>
                  <option value="ACTIVE">启用</option>
                  <option value="DISABLED">禁用</option>
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title="接口配置">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="接口地址 *" className="md:col-span-2">
                <Input value={draft.endpointUrl} onChange={(e) => setDraft({ ...draft, endpointUrl: e.target.value })} placeholder="https://api.example.com/v1/resources" />
              </Field>
              <Field label="AppKey">
                <Input value={draft.appKey} onChange={(e) => setDraft({ ...draft, appKey: e.target.value })} placeholder="可选" />
              </Field>
              <Field label="AppSecret / Token">
                <Input value={draft.secret} onChange={(e) => setDraft({ ...draft, secret: e.target.value })} type="password" placeholder="保存时加密" />
              </Field>
              <Field label="超时时间 (ms)">
                <Input type="number" value={draft.timeoutMs} onChange={(e) => setDraft({ ...draft, timeoutMs: Number(e.target.value) })} />
              </Field>
              <Field label="每日调用上限">
                <Input type="number" value={draft.dailyLimit} onChange={(e) => setDraft({ ...draft, dailyLimit: Number(e.target.value) })} />
              </Field>
              <Field label="返回数据路径" className="md:col-span-2">
                <Input value={draft.dataPath} onChange={(e) => setDraft({ ...draft, dataPath: e.target.value })} placeholder="data.list" />
              </Field>
            </div>
          </FormSection>

          <FormSection title="默认参数与说明">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="默认请求头 (JSON)" className="md:col-span-2">
                <textarea value={draft.defaultHeaders} onChange={(e) => setDraft({ ...draft, defaultHeaders: e.target.value })} className={textareaClass} placeholder='{"Content-Type": "application/json"}' />
              </Field>
              <Field label="默认请求参数 (JSON)" className="md:col-span-2">
                <textarea value={draft.defaultParams} onChange={(e) => setDraft({ ...draft, defaultParams: e.target.value })} className={textareaClass} placeholder='{"page": 1, "pageSize": 20}' />
              </Field>
              <Field label="说明" className="md:col-span-2">
                <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={textareaClass} placeholder="用于后台同步与筛选说明" />
              </Field>
            </div>
          </FormSection>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
            <div className="mb-3 text-sm font-medium text-[#2f2f2f]">配置提示</div>
            <ul className="space-y-2 text-xs leading-relaxed text-[#8c8c8c]">
              <li>· 保存后可在资源接入中心发起同步。</li>
              <li>· 预览测试只展示前三条解析结果。</li>
              <li>· Secret 会在后端加密存储。</li>
              <li>· JSON 默认参数支持空值。</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
            <div className="mb-3 text-sm font-medium text-[#2f2f2f]">测试预览</div>
            {preview.length ? (
              <pre className="max-h-[420px] overflow-auto rounded-2xl bg-[#f5f1ea] p-3 text-xs text-[#2f2f2f]">
                {JSON.stringify(preview, null, 2)}
              </pre>
            ) : (
              <div className="text-xs text-[#8c8c8c]">点击“测试连接”后显示解析结果。</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const selectClass =
  'h-11 w-full rounded-xl border border-[#e9e2d6] bg-white px-3 text-sm text-[#2f2f2f] outline-none focus:border-[#7a8b6f] focus:ring-2 focus:ring-[#7a8b6f]/10';

const textareaClass =
  'min-h-[120px] w-full rounded-xl border border-[#e9e2d6] bg-white px-3 py-2 text-sm text-[#2f2f2f] outline-none focus:border-[#7a8b6f] focus:ring-2 focus:ring-[#7a8b6f]/10';

const Field = ({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) => (
  <div className={className}>
    <div className="mb-1.5 text-sm font-semibold text-[#2f2f2f]">{label}</div>
    {children}
  </div>
);

const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-2xl border border-[#e9e2d6] bg-white p-5">
    <h2 className="mb-4 text-lg font-semibold text-[#2f2f2f]">{title}</h2>
    {children}
  </section>
);
