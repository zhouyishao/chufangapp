import { Eye, RefreshCw, Search, ShoppingBasket } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getPurchaseListDetail,
  listPurchaseLists,
  type PurchaseListItem,
  type PurchaseListStatus,
  type PurchaseListSummary
} from '../api';
import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';

const statusMeta: Record<PurchaseListStatus, { label: string; tone: 'green' | 'orange' | 'gray' }> = {
  PENDING: { label: '待采购', tone: 'gray' },
  IN_PROGRESS: { label: '采购中', tone: 'orange' },
  COMPLETED: { label: '已完成', tone: 'green' }
};

const formatTime = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date).replaceAll('/', '-');
};

const Pager = ({ page, pageSize, total, onChange }: { page: number; pageSize: number; total: number; onChange: (page: number) => void }) => {
  const max = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-end gap-3 text-sm text-[#6b7280]">
      <span>共 {total} 个菜篮</span>
      <Button variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>上一页</Button>
      <span>{page} / {max}</span>
      <Button variant="ghost" disabled={page >= max} onClick={() => onChange(page + 1)}>下一页</Button>
    </div>
  );
};

export const PurchaseListsPage = () => {
  const pageSize = 20;
  const [page, setPage] = useState(1);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<PurchaseListStatus | ''>('');
  const [items, setItems] = useState<PurchaseListSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ summary: PurchaseListSummary; items: PurchaseListItem[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listPurchaseLists({ page, pageSize, q: keyword, status: status || undefined });
      setItems(result.list);
      setTotal(result.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '采购数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (item: PurchaseListSummary) => {
    setDetailLoading(true);
    setError(null);
    try {
      setDetail(await getPurchaseListDetail(item));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : '采购明细加载失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = useMemo<DataTableColumn<PurchaseListSummary>[]>(() => [
    {
      key: 'name', title: '菜篮范围', render: (item) => (
        <div className="text-left">
          <div className="font-medium text-[#2f2f2f]">{item.name}</div>
          <div className="mt-1 text-xs text-[#8c8c8c]">{item.scopeType === 'FAMILY' ? '家庭共享' : '个人菜篮'} · ID {item.scopeId}</div>
        </div>
      )
    },
    { key: 'creator', title: '加入用户', render: (item) => item.creators.join('、') },
    { key: 'progress', title: '采购进度', render: (item) => `${item.checkedCount} / ${item.itemCount}` },
    { key: 'status', title: '状态', render: (item) => <StatusTag {...statusMeta[item.status]} /> },
    {
      key: 'amount', title: '参考金额', render: (item) => (
        <div>
          <div>{item.missingPriceCount === item.itemCount ? '待补充' : `￥${item.estimatedAmount.toFixed(2)}`}</div>
          {item.missingPriceCount > 0 ? <div className="mt-1 text-xs text-[#c27b48]">{item.missingPriceCount} 项缺价</div> : null}
        </div>
      )
    },
    { key: 'updatedAt', title: '最近更新', render: (item) => formatTime(item.updatedAt) },
    {
      key: 'actions', title: '操作', render: (item) => (
        <Button variant="ghost" className="gap-2" onClick={() => void openDetail(item)}>
          <Eye className="h-4 w-4" />查看明细
        </Button>
      )
    }
  ], []);

  const submitSearch = () => {
    setPage(1);
    setKeyword(keywordInput.trim());
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="采购清单"
        description="只读查看 C 端家庭与个人菜篮的实时数据。采购状态、数量和参考金额均来自真实数据库。"
        actions={<Button variant="ghost" className="gap-2" onClick={() => void load()}><RefreshCw className="h-4 w-4" />刷新</Button>}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          <Input
            className="pl-9"
            placeholder="搜索家庭、用户、食材或菜谱"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') submitSearch(); }}
          />
        </div>
        <select
          aria-label="采购状态"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          value={status}
          onChange={(event) => { setPage(1); setStatus(event.target.value as PurchaseListStatus | ''); }}
        >
          <option value="">全部状态</option>
          <option value="PENDING">待采购</option>
          <option value="IN_PROGRESS">采购中</option>
          <option value="COMPLETED">已完成</option>
        </select>
        <Button onClick={submitSearch}>查询</Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        error={error}
        rowKey={(item) => item.scopeKey}
        emptyTitle="暂无采购数据"
        emptyDescription="C 端用户把食材加入菜篮后，会按家庭或个人范围显示在这里。"
      />
      <Pager page={page} pageSize={pageSize} total={total} onChange={setPage} />

      <Drawer title={detail?.summary.name ?? '采购明细'} open={Boolean(detail) || detailLoading} onClose={() => setDetail(null)} widthClassName="max-w-2xl">
        {detailLoading && !detail ? <p className="text-sm text-[#8c8c8c]">明细加载中...</p> : detail ? (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#f7f3ec] p-4 text-center">
              <div><div className="text-xs text-[#8c8c8c]">条目</div><div className="mt-1 text-lg font-semibold">{detail.summary.itemCount}</div></div>
              <div><div className="text-xs text-[#8c8c8c]">已采购</div><div className="mt-1 text-lg font-semibold">{detail.summary.checkedCount}</div></div>
              <div><div className="text-xs text-[#8c8c8c]">缺价</div><div className="mt-1 text-lg font-semibold">{detail.summary.missingPriceCount}</div></div>
            </div>
            <div className="space-y-3">
              {detail.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#eee7dc] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5ea] text-[#6ba368]"><ShoppingBasket className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[#2f2f2f]">{item.name}</div>
                    <div className="mt-1 truncate text-xs text-[#8c8c8c]">{item.recipeName ? `来自菜谱：${item.recipeName}` : '单独加入'} · {item.creator}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{item.amountText || `${item.quantity}${item.unit ?? ''}`}</div>
                    <div className="mt-1 text-xs text-[#8c8c8c]">{item.currentPrice === null ? '价格待补充' : `￥${item.currentPrice}/${item.priceUnit ?? '份'}`}</div>
                  </div>
                  <StatusTag label={item.checked ? '已采购' : '待采购'} tone={item.checked ? 'green' : 'gray'} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Drawer>
    </section>
  );
};
