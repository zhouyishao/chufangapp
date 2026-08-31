import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { listRecipes, setRecipeAudit } from '../api';
import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { FilterPanel } from '../components/FilterPanel';
import { ImagePreview } from '../components/ImagePreview';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import type { Recipe } from '../types';

const auditLabel: Record<Recipe['auditStatus'], string> = {
  DRAFT: '草稿',
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回'
};

export const UserSubmissionsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [auditStatus, setAuditStatus] = useState<Recipe['auditStatus'] | ''>('PENDING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Recipe | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listRecipes({
        page,
        pageSize: 20,
        q: q.trim() || undefined,
        auditStatus: auditStatus || undefined,
        sourceType: 'USER'
      });
      setItems(result.list);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [page, q, auditStatus]);

  const approve = async (item: Recipe) => {
    setError(null);
    try {
      await setRecipeAudit(item.id, 'APPROVED');
      setNotice(`“${item.title}”已审核通过，仍需在菜谱管理中发布`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '审核失败');
    }
  };

  const reject = async () => {
    if (!rejecting || !rejectReason.trim()) return;
    setError(null);
    try {
      await setRecipeAudit(rejecting.id, 'REJECTED', rejectReason.trim());
      setNotice(`“${rejecting.title}”已驳回`);
      setRejecting(null);
      setRejectReason('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '驳回失败');
    }
  };

  const columns: DataTableColumn<Recipe>[] = [
    {
      key: 'recipe',
      title: '投稿菜谱',
      render: (item) => (
        <button type="button" className="flex min-w-[260px] items-center gap-3 text-left" onClick={() => navigate(`/content/recipes/${item.id}`)}>
          <ImagePreview src={item.cover} alt={item.title} />
          <div>
            <div className="font-medium text-[#2f2f2f]">{item.title}</div>
            <div className="mt-1 text-xs text-[#8c8c8c]">作者 ID：{item.authorId ?? '-'}</div>
          </div>
        </button>
      )
    },
    { key: 'createdAt', title: '提交时间', render: (item) => new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false }) },
    { key: 'submission', title: '提交状态', render: (item) => (item.isDraft ? '草稿' : '已提交') },
    { key: 'audit', title: '审核状态', render: (item) => <StatusTag label={auditLabel[item.auditStatus]} tone={item.auditStatus === 'APPROVED' ? 'green' : item.auditStatus === 'REJECTED' ? 'red' : 'gray'} /> },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex min-w-[220px] justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate(`/content/recipes/${item.id}`)}>查看</Button>
          <Button variant="ghost" disabled={item.auditStatus !== 'PENDING'} onClick={() => setRejecting(item)}>驳回</Button>
          <Button disabled={item.auditStatus !== 'PENDING'} onClick={() => void approve(item)}>通过</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="用户投稿" description="审核 C 端用户提交的菜谱。审核通过后仍需在菜谱管理中确认发布。" />
      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}
      <FilterPanel>
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          <Input value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="搜索菜谱标题" />
          <select value={auditStatus} onChange={(event) => { setPage(1); setAuditStatus(event.target.value as typeof auditStatus); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value="">全部审核状态</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已驳回</option>
            <option value="DRAFT">草稿</option>
          </select>
        </div>
      </FilterPanel>
      <DataTable columns={columns} data={items} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无用户投稿" emptyDescription="用户在 C 端提交菜谱后会显示在这里。" />
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>共 {total} 条</span>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button>
          <Button variant="ghost" disabled={page * 20 >= total} onClick={() => setPage((value) => value + 1)}>下一页</Button>
        </div>
      </div>
      {rejecting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4" role="dialog" aria-modal="true" aria-label="驳回投稿">
          <div className="w-full max-w-lg rounded-3xl bg-[#fffdfc] p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-[#2f2f2f]">驳回“{rejecting.title}”</h2>
            <p className="mt-2 text-sm text-[#8c8c8c]">原因会返回给投稿用户，请说明需要修改的具体内容。</p>
            <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} className="mt-4 min-h-28 w-full rounded-xl border border-[#e9e2d6] bg-white p-3 text-sm outline-none" placeholder="请输入驳回原因" />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setRejecting(null); setRejectReason(''); }}>取消</Button>
              <Button variant="danger" disabled={!rejectReason.trim()} onClick={() => void reject()}>确认驳回</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
