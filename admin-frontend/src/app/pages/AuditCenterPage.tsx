import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { approveAudit, listAudits, rejectAudit } from '../api';
import type { AuditItem } from '../types';
import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { FilterPanel } from '../components/FilterPanel';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';

type AuditStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type AuditType = AuditItem['type'];

type Props = {
  mode?: 'pending' | 'approved' | 'rejected' | 'records';
};

const typeTabs: { key: 'all' | AuditType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'RECIPE', label: '菜谱' },
  { key: 'INGREDIENT', label: '食材' },
  { key: 'POST', label: '用户投稿' },
  { key: 'COMMENT', label: '评论' },
  { key: 'REPORT', label: '举报' }
];

const auditStatusLabels: Record<AuditStatus, { label: string; tone: 'green' | 'orange' | 'red' }> = {
  PENDING: { label: '待审核', tone: 'orange' },
  APPROVED: { label: '已通过', tone: 'green' },
  REJECTED: { label: '已驳回', tone: 'red' }
};

const typeLabels: Record<AuditType, string> = {
  RECIPE: '菜谱审核',
  INGREDIENT: '食材审核',
  POST: '用户投稿',
  COMMENT: '评论',
  REPORT: '举报'
};

const mapStatusFromMode = (mode: Props['mode']): AuditStatus | 'all' => {
  switch (mode) {
    case 'pending': return 'PENDING';
    case 'approved': return 'APPROVED';
    case 'rejected': return 'REJECTED';
    default: return 'all';
  }
};

const emptyLabels: Record<string, string> = {
  PENDING: '暂无待审核内容',
  APPROVED: '暂无已通过内容',
  REJECTED: '暂无已驳回内容'
};

export const AuditCenterPage = ({ mode = 'pending' }: Props) => {
  const navigate = useNavigate();

  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | AuditType>('all');
  const [statusFilter, setStatusFilter] = useState<AuditStatus | 'all'>(mapStatusFromMode(mode));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [passing, setPassing] = useState<AuditItem | null>(null);
  const [rejecting, setRejecting] = useState<AuditItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listAudits({
        page,
        pageSize,
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        keyword: keyword.trim() || undefined
      });
      setItems(result.list);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载审核数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatusFilter(mapStatusFromMode(mode));
    setPage(1);
  }, [mode]);

  useEffect(() => {
    void fetchData();
  }, [page, pageSize, typeFilter, statusFilter, keyword, mode]);

  const handleApprove = async () => {
    if (!passing) return;
    setError(null);
    try {
      await approveAudit(passing.bizId, passing.type);
      setPassing(null);
      setNotice('审核已通过');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '审核操作失败');
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    if (!rejectReason.trim()) {
      setError('驳回原因不能为空');
      return;
    }
    setError(null);
    try {
      await rejectAudit(rejecting.bizId, rejecting.type, rejectReason.trim());
      setRejecting(null);
      setRejectReason('');
      setNotice('审核已驳回');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '驳回操作失败');
    }
  };

  const handleView = (item: AuditItem) => {
    if (item.type === 'RECIPE') navigate(`/content/recipes/${item.bizId}`);
    else if (item.type === 'INGREDIENT') navigate(`/content/ingredients/${item.bizId}`);
    else setNotice(`查看：${item.title}`);
  };

  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const columns: DataTableColumn<AuditItem>[] = [
    { key: 'id', title: 'ID', render: (item) => <span className="text-xs text-[#8c8c8c]">{item.id}</span> },
    {
      key: 'title',
      title: '内容标题',
      render: (item) => (
        <span className="font-medium text-[#2f2f2f]">{item.title}</span>
      )
    },
    {
      key: 'type',
      title: '内容类型',
      render: (item) => (
        <span className="inline-flex rounded-full bg-[#f5f1ea] px-2 py-0.5 text-xs text-[#8c8c8c]">
          {typeLabels[item.type] ?? item.type}
        </span>
      )
    },
    { key: 'submitter', title: '提交人', render: (item) => item.submitter },
    {
      key: 'status',
      title: '审核状态',
      render: (item) => {
        const s = auditStatusLabels[item.auditStatus as AuditStatus];
        return s ? <StatusTag label={s.label} tone={s.tone} /> : <span className="text-xs text-[#8c8c8c]">{item.auditStatus}</span>;
      }
    },
    {
      key: 'submittedAt',
      title: '提交时间',
      render: (item) => <span className="text-xs text-[#8c8c8c]">{item.submittedAt.replace('T', ' ').slice(0, 19)}</span>
    },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => handleView(item)}>查看</Button>
          {item.auditStatus === 'PENDING' ? (
            <>
              <Button variant="ghost" onClick={() => setPassing(item)}>通过</Button>
              <Button variant="danger" onClick={() => { setRejecting(item); setRejectReason(''); }}>驳回</Button>
            </>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <section className="space-y-6">
      <PageHeader
        title={mode === 'records' ? '审核记录' : '审核中心'}
        description="处理菜谱、食材、用户投稿、评论和举报内容审核，支持通过、驳回和审核记录追踪。"
      />

      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="flex flex-wrap gap-2">
        {typeTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={[
              'rounded-full px-4 py-1.5 text-xs font-medium transition',
              typeFilter === tab.key
                ? 'bg-[#2f2f2f] text-white'
                : 'bg-[#f5f1ea] text-[#8c8c8c] hover:bg-[#e9e2d6]'
            ].join(' ')}
            onClick={() => { setTypeFilter(tab.key); setPage(1); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <FilterPanel>
        <div className="flex flex-1 gap-3">
          <Input value={keyword} onChange={(event) => { setPage(1); setKeyword(event.target.value); }} placeholder="搜索标题 / 提交人..." />
          <select
            value={statusFilter}
            onChange={(event) => { setPage(1); setStatusFilter(event.target.value as typeof statusFilter); }}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
          >
            <option value="all">全部审核</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已驳回</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8c8c8c]">
          <select
            value={pageSize}
            onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
          >
            <option value={10}>10 / 页</option>
            <option value={20}>20 / 页</option>
          </select>
          <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((v) => Math.max(1, v - 1))}>上一页</Button>
          <span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页</span>
          <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((v) => v + 1)}>下一页</Button>
        </div>
      </FilterPanel>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        error={error}
        rowKey={(item) => item.id}
        emptyTitle={emptyLabels[statusFilter] ?? '暂无审核内容'}
      />

      <Modal title="审核通过" open={!!passing} onClose={() => setPassing(null)}>
        <div className="space-y-4">
          <div className="text-sm text-zinc-600">
            {passing ? `确认通过「${passing.title}」？通过后内容可进入发布流程。` : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPassing(null)}>取消</Button>
            <Button onClick={() => void handleApprove()}>确认通过</Button>
          </div>
        </div>
      </Modal>

      <Modal title="审核驳回" open={!!rejecting} onClose={() => setRejecting(null)}>
        <div className="space-y-4">
          <div className="text-sm text-zinc-600">
            {rejecting ? `请填写「${rejecting.title}」的驳回原因。` : null}
          </div>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            className="min-h-28 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            placeholder="例如：图片不清晰，步骤描述不完整。"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejecting(null)}>取消</Button>
            <Button variant="danger" onClick={() => void handleReject()}>确认驳回</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
