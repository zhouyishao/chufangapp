import { useEffect, useState } from 'react';

import { listAdminOperationLogs } from '../api';
import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { FilterPanel } from '../components/FilterPanel';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import type { AdminOperationLogItem } from '../types';

const formatDetail = (detail: Record<string, unknown> | null) => {
  if (!detail) return '-';
  return Object.entries(detail).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`).join('；') || '-';
};

export const SettingsLogsPage = () => {
  const [items, setItems] = useState<AdminOperationLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [q, setQ] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listAdminOperationLogs({ page, pageSize, q, module, action, startDate, endDate });
      setItems(result.list);
      setTotal(result.total);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '操作日志加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [page, pageSize, q, module, action, startDate, endDate]);

  const columns: DataTableColumn<AdminOperationLogItem>[] = [
    { key: 'time', title: '操作时间', render: (item) => new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false }) },
    { key: 'admin', title: '管理员', render: (item) => item.admin ? `${item.admin.nickname ?? item.admin.username}（${item.admin.username}）` : '-' },
    { key: 'module', title: '模块', render: (item) => item.module ?? '-' },
    { key: 'action', title: '操作', render: (item) => item.action ?? '-' },
    { key: 'path', title: '请求', render: (item) => `${item.method ?? '-'} ${item.path ?? '-'}` },
    { key: 'result', title: '结果', render: (item) => <StatusTag label={item.responseCode === 0 ? '成功' : '失败'} tone={item.responseCode === 0 ? 'green' : 'red'} /> },
    { key: 'ip', title: 'IP', render: (item) => item.ip ?? '-' },
    { key: 'detail', title: '安全摘要', render: (item) => <span className="block max-w-[360px] truncate" title={formatDetail(item.detail)}>{formatDetail(item.detail)}</span> }
  ];

  return (
    <section className="space-y-6">
      <PageHeader title="操作日志" description="只读查看管理员与角色权限变更记录；密码、Token 和鉴权信息不会展示。" />
      {error ? <div className="flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><Button variant="ghost" onClick={() => void refresh()}>重试</Button></div> : null}
      <FilterPanel>
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-5">
          <Input value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="搜索操作或路径" />
          <Input value={module} onChange={(event) => { setPage(1); setModule(event.target.value); }} placeholder="模块" />
          <Input value={action} onChange={(event) => { setPage(1); setAction(event.target.value); }} placeholder="操作类型" />
          <Input type="date" value={startDate} onChange={(event) => { setPage(1); setStartDate(event.target.value); }} />
          <Input type="date" value={endDate} onChange={(event) => { setPage(1); setEndDate(event.target.value); }} />
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8c8c8c]">
          <select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value={20}>20 / 页</option><option value={50}>50 / 页</option></select>
          <Button variant="ghost" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button>
          <span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页</span>
          <Button variant="ghost" disabled={page * pageSize >= total || loading} onClick={() => setPage((value) => value + 1)}>下一页</Button>
        </div>
      </FilterPanel>
      <DataTable columns={columns} data={items} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无操作日志" />
    </section>
  );
};
