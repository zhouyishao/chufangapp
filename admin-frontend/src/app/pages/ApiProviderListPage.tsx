import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  deleteResourceApiProvider,
  listResourceApiProviders,
  syncResourceApiProvider,
  testSavedResourceApiProvider
} from '../api';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { FilterPanel } from '../components/FilterPanel';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import type { ResourceApiProviderItem } from '../types';

const resourceTypeLabels: Record<ResourceApiProviderItem['resourceType'], string> = {
  RECIPE: '菜谱',
  INGREDIENT: '蔬菜/食材',
  FRUIT: '水果',
  SEASONING: '调料',
  BEVERAGE: '酒水'
};

const statusTone: Record<ResourceApiProviderItem['status'], 'green' | 'gray'> = {
  ACTIVE: 'green',
  DISABLED: 'gray'
};

const authTypeLabels: Record<ResourceApiProviderItem['authType'], string> = {
  NONE: '无需鉴权',
  HEADER_TOKEN: 'Header Token',
  QUERY_KEY: 'Query Key',
  CUSTOM_HEADERS: '自定义请求头'
};

export const ApiProviderListPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ResourceApiProviderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceApiProviderItem['resourceType'] | ''>('');
  const [statusFilter, setStatusFilter] = useState<ResourceApiProviderItem['status'] | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ResourceApiProviderItem | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listResourceApiProviders({
        page,
        pageSize,
        q: appliedQ.trim() || undefined,
        status: statusFilter || undefined,
        resourceType: typeFilter || undefined
      });
      setItems(data.list);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取资源提供方列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchList();
  }, [page, pageSize, appliedQ, statusFilter, typeFilter]);

  const handleSearch = () => {
    setPage(1);
    setAppliedQ(q);
  };

  const handleReset = () => {
    setQ('');
    setAppliedQ('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteResourceApiProvider(deleting.id);
      setNotice(`已删除「${deleting.name}」`);
      setDeleting(null);
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleTest = async (item: ResourceApiProviderItem) => {
    setTestingId(item.id);
    setError(null);
    try {
      const result = await testSavedResourceApiProvider(item.id);
      setNotice(`测试通过，成功解析 ${result.total} 条，预览 ${result.preview.length} 条`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试失败');
    } finally {
      setTestingId(null);
    }
  };

  const handleSync = async (item: ResourceApiProviderItem) => {
    setSyncingId(item.id);
    setError(null);
    try {
      const result = await syncResourceApiProvider(item.id, { limit: 100, params: {} });
      setNotice(`同步完成：待处理 ${result.summary.pending} 条，失败 ${result.summary.failed} 条，批次 #${result.batch.id}`);
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : '同步失败');
    } finally {
      setSyncingId(null);
    }
  };

  const columns: DataTableColumn<ResourceApiProviderItem>[] = [
    {
      key: 'name',
      title: '接口名称',
      render: (item) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-[#2f2f2f]">{item.name}</span>
          <span className="text-xs text-[#8c8c8c]">{item.providerName}</span>
        </div>
      )
    },
    {
      key: 'resourceType',
      title: '资源类型',
      render: (item) => <span className="text-sm text-[#2f2f2f]">{resourceTypeLabels[item.resourceType]}</span>
    },
    {
      key: 'endpointUrl',
      title: '接口地址',
      widthClassName: 'max-w-[260px]',
      render: (item) => <span className="block max-w-[260px] truncate text-xs text-[#8c8c8c]" title={item.endpointUrl}>{item.endpointUrl}</span>
    },
    {
      key: 'authType',
      title: '鉴权方式',
      render: (item) => <span className="text-sm text-[#2f2f2f]">{authTypeLabels[item.authType]}</span>
    },
    {
      key: 'status',
      title: '状态',
      render: (item) => <StatusTag label={item.status === 'ACTIVE' ? '启用' : '禁用'} tone={statusTone[item.status]} />
    },
    {
      key: 'lastSyncedAt',
      title: '最近同步',
      render: (item) => <span className="text-xs text-[#8c8c8c]">{item.lastSyncedAt ? new Date(item.lastSyncedAt).toLocaleString() : '-'}</span>
    },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate(`/resources/api-providers/${item.id}/edit`)}>
            编辑
          </Button>
          <Button variant="ghost" onClick={() => void handleTest(item)} disabled={testingId === item.id}>
            {testingId === item.id ? '测试中...' : '测试'}
          </Button>
          <Button variant="ghost" onClick={() => void handleSync(item)} disabled={syncingId === item.id}>
            {syncingId === item.id ? '同步中...' : '同步'}
          </Button>
          <Button variant="danger" onClick={() => setDeleting(item)}>
            删除
          </Button>
        </div>
      )
    }
  ];

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="space-y-6">
      <PageHeader
        title="API 接口管理"
        description="配置公共资源 API 的来源、鉴权和同步方式，支持测试连接、同步到导入池并批量进入正式库。"
      />

      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl border border-[#d8e9d1] bg-[#edf5ea] px-5 py-3 text-sm text-[#5f7f59]">{notice}</div> : null}

      <FilterPanel>
        <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-end">
          <div className="flex-1">
            <div className="mb-1.5 text-sm font-semibold text-[#2f2f2f]">搜索</div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索接口名称、服务商或地址..." />
          </div>
          <div className="min-w-[180px]">
            <div className="mb-1.5 text-sm font-semibold text-[#2f2f2f]">资源类型</div>
            <select
              className="h-11 w-full rounded-xl border border-[#e9e2d6] bg-white px-3 text-sm text-[#2f2f2f]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ResourceApiProviderItem['resourceType'] | '')}
            >
              <option value="">全部类型</option>
              {Object.entries(resourceTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <div className="mb-1.5 text-sm font-semibold text-[#2f2f2f]">状态</div>
            <select
              className="h-11 w-full rounded-xl border border-[#e9e2d6] bg-white px-3 text-sm text-[#2f2f2f]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ResourceApiProviderItem['status'] | '')}
            >
              <option value="">全部状态</option>
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">禁用</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch}>查询</Button>
            <Button variant="ghost" onClick={handleReset}>重置</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/resources/api-providers/create?preset=JUHE_RECIPE')}
          >
            新建 Juhe 菜谱
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/resources/api-providers/create?preset=TIANAPI_RECIPE')}
          >
            新建 TianAPI 菜谱
          </Button>
          <Button onClick={() => navigate('/resources/api-providers/create')}>新增接口</Button>
        </div>
      </FilterPanel>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        error={null}
        rowKey={(item) => item.id}
        emptyTitle="暂无接口配置"
        emptyDescription="先创建一个公共资源 API Provider，再进行测试和同步。"
      />

      <div className="flex items-center justify-between gap-4 text-sm text-[#8c8c8c]">
        <span>共 {total} 条记录</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            上一页
          </Button>
          <span className="rounded-lg bg-[#7a8b6f] px-3 py-1.5 text-white">{page}</span>
          <span>/ {totalPages}</span>
          <Button variant="ghost" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>
            下一页
          </Button>
        </div>
      </div>

      <ConfirmModal
        title="确认删除"
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        description={deleting ? `删除「${deleting.name}」后不可恢复。` : null}
        confirmText="删除"
        danger
        onConfirm={() => void handleDelete()}
      />
    </section>
  );
};
