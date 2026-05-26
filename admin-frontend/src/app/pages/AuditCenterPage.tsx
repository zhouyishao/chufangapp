import { useEffect, useMemo, useState } from 'react';

import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { FilterPanel } from '../components/FilterPanel';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import { resolveMockList } from '../mockApi';

type AuditStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type AuditType = '菜谱投稿' | '评论' | '举报';

type AuditItem = {
  id: number;
  title: string;
  type: AuditType;
  submitter: string;
  status: AuditStatus;
  reason?: string;
  submittedAt: string;
};

type Props = {
  mode?: 'pending' | 'approved' | 'rejected' | 'records';
};

const initialAudits: AuditItem[] = [
  { id: 1001, title: '用户投稿：番茄牛肉焖饭', type: '菜谱投稿', submitter: 'Peinian', status: 'PENDING', submittedAt: '2026-05-25 10:18' },
  { id: 1002, title: '评论：这个步骤少了盐', type: '评论', submitter: '一只碗', status: 'PENDING', submittedAt: '2026-05-25 09:40' },
  { id: 1003, title: '举报：图片不清晰', type: '举报', submitter: '匿名用户', status: 'REJECTED', reason: '证据不足，保留原内容', submittedAt: '2026-05-24 18:12' },
  { id: 1004, title: '用户投稿：春笋炒肉', type: '菜谱投稿', submitter: 'Z_ou', status: 'APPROVED', submittedAt: '2026-05-24 12:08' }
];

const statusLabel: Record<AuditStatus, { label: string; tone: 'green' | 'orange' | 'red' }> = {
  PENDING: { label: '待审核', tone: 'orange' },
  APPROVED: { label: '已通过', tone: 'green' },
  REJECTED: { label: '已驳回', tone: 'red' }
};

export const AuditCenterPage = ({ mode = 'pending' }: Props) => {
  const [sourceItems, setSourceItems] = useState<AuditItem[]>(initialAudits);
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | AuditType>('all');
  const [status, setStatus] = useState<'all' | AuditStatus>(mode === 'pending' ? 'PENDING' : mode === 'approved' ? 'APPROVED' : mode === 'rejected' ? 'REJECTED' : 'all');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [passing, setPassing] = useState<AuditItem | null>(null);
  const [rejecting, setRejecting] = useState<AuditItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    setStatus(mode === 'pending' ? 'PENDING' : mode === 'approved' ? 'APPROVED' : mode === 'rejected' ? 'REJECTED' : 'all');
    setPage(1);
  }, [mode]);

  const filteredItems = useMemo(() => {
    return sourceItems.filter((item) => {
      const matchKeyword = q.trim() ? item.title.includes(q.trim()) || item.submitter.includes(q.trim()) : true;
      const matchType = type === 'all' ? true : item.type === type;
      const matchStatus = status === 'all' ? true : item.status === status;
      return matchKeyword && matchType && matchStatus;
    });
  }, [q, sourceItems, status, type]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const response = await resolveMockList(filteredItems, page, pageSize);
      if (!alive) return;
      setItems(response.data.list);
      setTotal(response.data.pagination.total);
      setLoading(false);
    };
    void load();
    return () => {
      alive = false;
    };
  }, [filteredItems, page, pageSize]);

  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const approve = () => {
    if (!passing) return;
    setSourceItems((prev) => prev.map((item) => (item.id === passing.id ? { ...item, status: 'APPROVED', reason: undefined } : item)));
    setPassing(null);
    setNotice('审核已通过');
  };

  const reject = () => {
    if (!rejecting) return;
    setSourceItems((prev) => prev.map((item) => (item.id === rejecting.id ? { ...item, status: 'REJECTED', reason: rejectReason.trim() || '内容不符合发布规范' } : item)));
    setRejecting(null);
    setRejectReason('');
    setNotice('审核已驳回');
  };

  const columns: DataTableColumn<AuditItem>[] = [
    { key: 'id', title: 'ID', render: (item) => item.id },
    { key: 'title', title: '内容标题', render: (item) => <span className="font-medium text-[#2f2f2f]">{item.title}</span> },
    { key: 'type', title: '内容类型', render: (item) => item.type },
    { key: 'submitter', title: '提交人', render: (item) => item.submitter },
    { key: 'status', title: '审核状态', render: (item) => <StatusTag label={statusLabel[item.status].label} tone={statusLabel[item.status].tone} /> },
    { key: 'submittedAt', title: '提交时间', render: (item) => item.submittedAt },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setNotice(`查看：${item.title}`)}>查看</Button>
          {item.status === 'PENDING' ? (
            <>
              <Button variant="ghost" onClick={() => setPassing(item)}>通过</Button>
              <Button variant="danger" onClick={() => { setRejecting(item); setRejectReason(''); }}>驳回</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setNotice(item.reason ? `原因：${item.reason}` : '暂无驳回原因')}>审核记录</Button>
          )}
        </div>
      )
    }
  ];

  return (
    <section className="space-y-6">
      <PageHeader title={mode === 'records' ? '审核记录' : '审核中心'} description="处理用户投稿、评论和举报内容，支持通过、驳回、查看和审核记录追踪。" />

      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <FilterPanel>
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          <Input value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="搜索标题 / 提交人..." />
          <select value={type} onChange={(event) => { setPage(1); setType(event.target.value as typeof type); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value="all">全部类型</option>
            <option value="菜谱投稿">菜谱投稿</option>
            <option value="评论">评论</option>
            <option value="举报">举报</option>
          </select>
          <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as typeof status); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value="all">全部审核</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已驳回</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8c8c8c]">
          <select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value={10}>10 / 页</option>
            <option value={20}>20 / 页</option>
          </select>
          <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button>
          <span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页</span>
          <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((value) => value + 1)}>下一页</Button>
        </div>
      </FilterPanel>

      <DataTable columns={columns} data={items} loading={loading} rowKey={(item) => item.id} emptyTitle="暂无审核内容" />

      <ConfirmModal
        title="审核通过"
        open={!!passing}
        description={passing ? `确认通过「${passing.title}」？通过后内容可进入发布流程。` : null}
        confirmText="通过"
        onClose={() => setPassing(null)}
        onConfirm={approve}
      />

      <Modal title="审核驳回" open={!!rejecting} onClose={() => setRejecting(null)}>
        <div className="space-y-4">
          <div className="text-sm text-zinc-600">{rejecting ? `请填写「${rejecting.title}」的驳回原因。` : null}</div>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            className="min-h-28 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            placeholder="例如：图片不清晰，步骤描述不完整。"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejecting(null)}>取消</Button>
            <Button variant="danger" onClick={reject}>确认驳回</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
