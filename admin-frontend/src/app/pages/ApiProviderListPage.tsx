import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { FilterPanel } from '../components/FilterPanel';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';

type ApiProvider = {
  id: string;
  name: string;
  version: string;
  type: string;
  provider: string;
  method: 'GET' | 'POST';
  baseUrl: string;
  status: '启用' | '禁用';
  todayCalls: number;
  dailyLimit: number;
  updatedAt: string;
};

export const ApiProviderListPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ApiProvider[]>([]);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState<ApiProvider | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = items.filter(item => {
    const matchQ = appliedQ.trim() ? item.name.includes(appliedQ.trim()) || item.provider.includes(appliedQ.trim()) : true;
    const matchType = typeFilter === 'all' || item.type === typeFilter;
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchQ && matchType && matchStatus;
  });

  const handleTest = (item: ApiProvider) => setNotice(`资源接口测试能力未接入后端：${item.name}`);
  const handleDelete = () => {
    if (deleting) {
      setItems((current) => current.filter((item) => item.id !== deleting.id));
      setNotice(`已从当前列表移除「${deleting.name}」`);
      setDeleting(null);
    }
  };
  const handleReset = () => { setQ(''); setAppliedQ(''); setTypeFilter('all'); setStatusFilter('all'); };

  const columns: DataTableColumn<ApiProvider>[] = [
    { key: 'name', title: '接口名称', render: i => <span className="font-medium text-[#2f2f2f]">{i.name}</span> },
    { key: 'version', title: '版本', render: i => <span className="text-xs text-[#8c8c8c]">{i.version}</span> },
    { key: 'type', title: '类型', render: i => <span className="inline-flex rounded-full bg-[#f5f1ea] px-2 py-0.5 text-xs text-[#8c8c8c]">{i.type}</span> },
    { key: 'provider', title: '服务商', render: i => i.provider },
    { key: 'method', title: '方式', render: i => <span className={['inline-flex rounded px-2 py-0.5 text-xs font-mono', i.method === 'GET' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'].join(' ')}>{i.method}</span> },
    { key: 'baseUrl', title: 'Base URL', render: i => <span className="max-w-48 truncate text-xs text-[#8c8c8c]">{i.baseUrl}</span> },
    { key: 'status', title: '状态', render: i => <StatusTag label={i.status} tone={i.status === '启用' ? 'green' : 'gray'} /> },
    { key: 'todayCalls', title: '今日调用', render: i => <span className="text-xs text-[#8c8c8c]">{i.todayCalls.toLocaleString()}</span> },
    { key: 'actions', title: '操作', render: i => (
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate(`/resources/api-providers/${i.id}/edit`)}>编辑</Button>
        <Button variant="ghost" onClick={() => handleTest(i)}>测试</Button>
        <Button variant="ghost" onClick={() => setNotice(`查看日志：${i.name}`)}>日志</Button>
        <Button variant="danger" onClick={() => setDeleting(i)}>删除</Button>
      </div>
    )}
  ];

  return (
    <section className="space-y-6">
      <PageHeader title="API 接口管理" description="管理资源接入中心的接口配置、服务商、调用限制和状态。" />
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <FilterPanel>
        <div className="flex flex-1 gap-3">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索接口名称 / 服务商..." />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value="all">全部类型</option><option value="菜谱">菜谱</option><option value="食材">食材</option><option value="调料">调料</option><option value="水果">水果</option><option value="酒水">酒水</option><option value="价格">价格</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value="all">全部状态</option><option value="启用">启用</option><option value="禁用">禁用</option>
          </select>
        </div>
        <Button onClick={() => navigate('/resources/api-providers/create')}>＋ 新增接口</Button>
        <Button variant="ghost" onClick={() => setAppliedQ(q)}>搜索</Button>
        <Button variant="ghost" onClick={handleReset}>重置</Button>
      </FilterPanel>

      <DataTable columns={columns} data={filtered} rowKey={i => i.id} emptyTitle="暂无接口配置" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4">
          <div className="text-xs text-[#8c8c8c]">今日调用总量</div>
          <div className="mt-1 text-2xl font-semibold text-[#2f2f2f]">{items.reduce((s, i) => s + i.todayCalls, 0).toLocaleString()}</div>
          <div className="mt-4 h-16 rounded-xl bg-gradient-to-r from-[#edf5ea] to-white" />
        </div>
        <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4">
          <div className="text-xs text-[#8c8c8c]">调用限制提醒</div>
          <div className="mt-3 space-y-3">
            {items.length ? (
              items.slice(0, 3).map((item) => <div key={item.id} className="grid grid-cols-[80px_1fr_76px] items-center gap-3 text-xs text-[#2f2f2f]"><span>{item.name.slice(0, 5)}</span><span className="h-2 rounded-full bg-[#f5f1ea]"><span className="block h-2 rounded-full bg-[#7a8b6f]" style={{ width: `${Math.min(100, item.todayCalls / item.dailyLimit * 100)}%` }} /></span><span className="text-right text-[#8c8c8c]">{item.todayCalls}/{item.dailyLimit}</span></div>)
            ) : (
              <div className="text-xs text-[#8c8c8c]">暂无接口调用限制数据</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4">
          <div className="mb-3 flex items-center justify-between"><div className="text-xs text-[#8c8c8c]">最近调用日志</div><button type="button" onClick={() => setNotice('已刷新最近调用日志')} className="text-xs text-[#6f8b62]">刷新</button></div>
          <div className="space-y-3 text-xs">
            <div className="text-[#8c8c8c]">暂无真实调用日志</div>
          </div>
        </div>
      </div>

      <ConfirmModal title="确认删除" open={!!deleting} onClose={() => setDeleting(null)} description={deleting ? `删除接口「${deleting.name}」后将无法恢复，资源接入中心将无法调用此接口。` : null} confirmText="删除" danger onConfirm={handleDelete} />
    </section>
  );
};
