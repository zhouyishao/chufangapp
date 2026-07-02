import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import { listImportBatches, getImportBatchesStats, retryFailedImport } from '../api';
import type { ResourceImportBatchItem } from '../types';

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '处理中/待确认', value: 'PENDING' },
  { label: '导入完成', value: 'COMPLETED' },
  { label: '导入失败', value: 'FAILED' }
] as const;

const selectClass =
  'h-11 w-full rounded-xl border border-[#e9e2d6] bg-white px-3 text-sm text-[#2f2f2f] outline-none focus:border-[#7a8b6f] focus:ring-2 focus:ring-[#7a8b6f]/10';

const statusTone: Record<ResourceImportBatchItem['status'], 'green' | 'orange' | 'red' | 'gray'> = {
  PENDING: 'orange',
  COMPLETED: 'green',
  FAILED: 'red'
};

const statusLabels: Record<ResourceImportBatchItem['status'], string> = {
  PENDING: '处理中',
  COMPLETED: '已完成',
  FAILED: '失败'
};

const resourceTypeLabels: Record<string, string> = {
  RECIPE: '菜谱',
  INGREDIENT: '食材',
  FRUIT: '水果',
  SEASONING: '调料',
  BEVERAGE: '酒水'
};

export const ResourceImportRecordsPage = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<ResourceImportBatchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Statistics State
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0
  });

  // Query Filters
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<ResourceImportBatchItem['status'] | ''>('');

  // Selected batch for drawer details
  const [detailBatch, setDetailBatch] = useState<ResourceImportBatchItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Fetch batches listing
  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listImportBatches({
        page,
        pageSize,
        q: appliedQ.trim() || undefined,
        status: statusFilter || undefined
      });
      setBatches(data.list);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取导入历史失败');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats count
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await getImportBatchesStats();
      setStats(data);
    } catch {
      // Gracefully ignore stats fetch failure
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    void fetchBatches();
  }, [page, pageSize, appliedQ, statusFilter]);

  useEffect(() => {
    void fetchStats();
  }, []);

  const handleSearch = () => {
    setPage(1);
    setAppliedQ(q);
  };

  const handleReset = () => {
    setPage(1);
    setQ('');
    setAppliedQ('');
    setStatusFilter('');
    setNotice('筛选条件已重置');
    setTimeout(() => setNotice(null), 3000);
  };

  const openDetails = (batch: ResourceImportBatchItem) => {
    setDetailBatch(batch);
    setDrawerOpen(true);
  };

  const handleRetry = async () => {
    if (!detailBatch) return;
    setRetryLoading(true);
    setError(null);
    try {
      const res = await retryFailedImport(detailBatch.id);
      setNotice(`重试成功！成功重新导入 ${res.successCount} 项，失败 ${res.failCount} 项`);
      await fetchBatches();
      await fetchStats();
      setDetailBatch(res.batch);
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '重新导入重试失败');
    } finally {
      setRetryLoading(false);
    }
  };

  const columns: DataTableColumn<ResourceImportBatchItem>[] = [
    {
      key: 'id',
      title: '批次 ID',
      render: (batch) => <span className="font-mono text-sm text-[#2f2f2f]">#{batch.id}</span>
    },
    {
      key: 'fileName',
      title: '文件名称',
      render: (batch) => (
        <span className="font-semibold text-[#2f2f2f] truncate max-w-[240px] block" title={batch.fileName}>
          {batch.fileName}
        </span>
      )
    },
    {
      key: 'importType',
      title: '导入类型',
      render: (batch) => (
        <span className="inline-flex items-center rounded-md bg-zinc-50 border border-zinc-150 px-2 py-0.5 text-xs font-semibold text-zinc-600">
          {resourceTypeLabels[batch.importType] || batch.importType}
        </span>
      )
    },
    {
      key: 'sourceType',
      title: '数据格式',
      render: (batch) => (
        <span className="inline-flex items-center rounded-md bg-zinc-50 border border-zinc-150 px-2 py-0.5 text-xs font-semibold text-zinc-600">
          {batch.sourceType}
        </span>
      )
    },
    {
      key: 'status',
      title: '导入状态',
      render: (batch) => (
        <StatusTag label={statusLabels[batch.status]} tone={statusTone[batch.status]} />
      )
    },
    {
      key: 'totalCount',
      title: '总数',
      render: (batch) => <span className="font-medium text-zinc-800">{batch.totalCount}</span>
    },
    {
      key: 'successCount',
      title: '成功导入',
      render: (batch) => <span className="font-semibold text-emerald-600">{batch.successCount}</span>
    },
    {
      key: 'failedCount',
      title: '失败数',
      render: (batch) => (
        <span className={batch.failedCount > 0 ? 'font-semibold text-red-500' : 'text-zinc-400'}>
          {batch.failedCount}
        </span>
      )
    },
    {
      key: 'createdBy',
      title: '操作人',
      render: (batch) => <span className="text-[#2f2f2f] text-sm">{batch.createdBy}</span>
    },
    {
      key: 'createdAt',
      title: '导入时间',
      render: (batch) => (
        <span className="text-zinc-500 text-xs whitespace-nowrap">
          {new Date(batch.createdAt).toLocaleString()}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      render: (batch) => (
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            className="text-[#7a8b6f] hover:underline font-semibold"
            onClick={() => navigate(`/resource-management/access-center?batchId=${batch.id}`)}
          >
            明细
          </button>
          <span className="text-[#d8d0c4]">|</span>
          <button
            type="button"
            className="text-zinc-600 hover:underline font-semibold"
            onClick={() => openDetails(batch)}
          >
            详情
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6">
      <PageHeader
        title="导入记录"
        description="记录每次文件导入的数据批次，包括处理状态、成功/失败数量及导入日志明细，支持点击明细查看待确认与忽略的子记录项。"
      />

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-[#d8e9d1] bg-[#edf5ea] px-5 py-3 text-sm text-[#5f7f59]">{notice}</div>
      ) : null}

      {/* Filter Panel */}
      <section className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.5fr_2.5fr_auto] items-end">
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-[#2f2f2f]">导入状态</span>
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ResourceImportBatchItem['status'] | '');
                setPage(1);
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-[#2f2f2f]">关键词</span>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="请输入文件名称、操作人检索批次记录..."
              className="h-11 rounded-xl border-[#e9e2d6]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button className="h-11 bg-[#7a8b6f] px-7 hover:bg-[#6d7f63]" onClick={handleSearch} disabled={loading}>
              查询
            </Button>
            <Button variant="ghost" className="h-11 px-6" onClick={handleReset} disabled={loading}>
              重置
            </Button>
          </div>
        </div>
      </section>

      {/* Statistics Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: '全部导入批次', value: stats.total, tone: 'gray' as const },
          { label: '处理中/待确认', value: stats.pending, tone: 'orange' as const },
          { label: '导入完成批次', value: stats.completed, tone: 'green' as const },
          { label: '导入失败批次', value: stats.failed, tone: 'red' as const }
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#8b8577] font-semibold">{card.label}</span>
              <StatusTag label="实时" tone={card.tone} />
            </div>
            <div className="mt-4 text-3xl font-semibold text-[#2f2f2f]">
              {statsLoading ? '...' : `${card.value} 个`}
            </div>
          </div>
        ))}
      </section>

      {/* Data Table */}
      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={batches}
          rowKey={(batch) => batch.id}
          emptyTitle="暂无导入日志"
          emptyDescription="请在“资源接入中心”上传并确认导入第一批资源数据。"
        />

        {/* Pagination Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-[#f1ece4] px-5 py-4 text-sm text-[#8c8c8c]">
          <span>共 {total} 个批次</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <span className="rounded-lg bg-[#6f8b62] px-3 py-1.5 text-white font-medium">
              {page}
            </span>
            <span>/ {totalPages}</span>
            <Button
              variant="ghost"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>

      {/* Batch Details Drawer */}
      <Drawer
        title="导入批次详情"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        widthClassName="max-w-xl"
      >
        {detailBatch && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#e9e2d6] bg-[#fcfbfa] p-5 space-y-4">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <span className="text-zinc-400 block mb-0.5">批次 ID</span>
                  <span className="font-semibold text-zinc-800">#{detailBatch.id}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">文件格式</span>
                  <span className="font-semibold text-zinc-800">{detailBatch.sourceType}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 block mb-0.5">文件名称</span>
                  <span className="font-semibold text-zinc-800 break-all">{detailBatch.fileName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">导入类型</span>
                  <span className="font-semibold text-zinc-800">{resourceTypeLabels[detailBatch.importType] || detailBatch.importType}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">导入状态</span>
                  <StatusTag label={statusLabels[detailBatch.status]} tone={statusTone[detailBatch.status]} />
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">操作人</span>
                  <span className="font-semibold text-zinc-800">{detailBatch.createdBy}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">总数据项数</span>
                  <span className="font-semibold text-zinc-800">{detailBatch.totalCount} 项</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">成功导入正式表</span>
                  <span className="font-semibold text-emerald-600">{detailBatch.successCount} 项</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">写入失败数</span>
                  <span className="font-semibold text-red-500">{detailBatch.failedCount} 项</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 block mb-0.5">导入时间</span>
                  <span className="font-semibold text-zinc-800 text-xs">
                    {new Date(detailBatch.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message Details */}
            {detailBatch.errorMessage && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-red-600 block">批次执行错误日志</span>
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 font-mono text-xs text-red-700 whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                  {detailBatch.errorMessage}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4 border-t border-[#f1ece4]">
              <div className="flex gap-2">
                {detailBatch.failedCount > 0 && (
                  <Button
                    className="flex-1 bg-[#c27b48] hover:bg-[#ad6c3e] h-11"
                    disabled={retryLoading}
                    onClick={handleRetry}
                  >
                    {retryLoading ? '正在重新导入...' : '🔄 重新导入失败项'}
                  </Button>
                )}
                <Button
                  className="flex-1 bg-[#7a8b6f] hover:bg-[#6d7f63] h-11"
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate(`/resource-management/access-center?batchId=${detailBatch.id}`);
                  }}
                >
                  🔍 查看批次明细
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full h-11"
                onClick={() => setDrawerOpen(false)}
              >
                关闭
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
