import { RefreshCw, Search, SearchX, TrendingUp, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getSearchLogOverview, listSearchLogs, type SearchLogItem, type SearchLogOverview } from '../api';
import { Button } from '../components/Button';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';

const formatTime = (value: string) => new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
}).format(new Date(value)).replaceAll('/', '-');

const maskPhone = (phone?: string | null) => phone?.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') ?? '--';

export const SearchOpsPage = () => {
  const pageSize = 20;
  const [page, setPage] = useState(1);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [resultType, setResultType] = useState<'' | 'WITH_RESULTS' | 'NO_RESULTS'>('');
  const [overview, setOverview] = useState<SearchLogOverview | null>(null);
  const [items, setItems] = useState<SearchLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextOverview, list] = await Promise.all([
        getSearchLogOverview(),
        listSearchLogs({ page, pageSize, q: keyword, resultType: resultType || undefined })
      ]);
      setOverview(nextOverview);
      setItems(list.list);
      setTotal(list.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '搜索日志加载失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, page, resultType]);

  useEffect(() => { void load(); }, [load]);

  const columns = useMemo<DataTableColumn<SearchLogItem>[]>(() => [
    { key: 'keyword', title: '搜索词', render: (item) => <span className="font-medium text-[#2f2f2f]">{item.keyword}</span> },
    { key: 'user', title: '用户', render: (item) => <div><div>{item.user.nickname || '未命名用户'}</div><div className="mt-1 text-xs text-[#8c8c8c]">{maskPhone(item.user.phone)}</div></div> },
    { key: 'searchCount', title: '搜索次数', render: (item) => item.searchCount },
    { key: 'resultCount', title: '最近结果数', render: (item) => item.resultCount },
    { key: 'resultStatus', title: '结果状态', render: (item) => <StatusTag label={item.resultCount > 0 ? '有结果' : '无结果'} tone={item.resultCount > 0 ? 'green' : 'red'} /> },
    { key: 'updatedAt', title: '最近搜索', render: (item) => formatTime(item.updatedAt) }
  ], []);

  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const submitSearch = () => { setPage(1); setKeyword(keywordInput.trim()); };

  return (
    <section className="space-y-6">
      <PageHeader title="搜索日志" description="追踪 C 端真实搜索词、搜索次数、最近结果数和无结果率，为内容运营提供依据。" actions={<Button variant="ghost" className="gap-2" onClick={() => void load()}><RefreshCw className="h-4 w-4" />刷新</Button>} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-5"><TrendingUp className="h-5 w-5 text-[#6ba368]" /><div className="mt-3 text-sm text-[#8c8c8c]">累计搜索次数</div><div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{overview?.totalSearches ?? '--'}</div></div>
        <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-5"><SearchX className="h-5 w-5 text-[#c27b48]" /><div className="mt-3 text-sm text-[#8c8c8c]">无结果搜索</div><div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{overview?.noResultSearches ?? '--'}</div></div>
        <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-5"><Users className="h-5 w-5 text-[#6b7280]" /><div className="mt-3 text-sm text-[#8c8c8c]">无结果率</div><div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{overview ? `${overview.noResultRate}%` : '--'}</div></div>
      </div>

      {overview?.topKeywords.length ? <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-5"><h2 className="text-base font-semibold text-[#2f2f2f]">热门搜索</h2><div className="mt-4 flex flex-wrap gap-2">{overview.topKeywords.map((item) => <span key={item.keyword} className="rounded-full bg-[#edf5ea] px-3 py-1.5 text-sm text-[#52704b]">{item.keyword} · {item.searchCount}</span>)}</div></div> : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4 md:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" /><Input className="pl-9" placeholder="搜索关键词、昵称或手机号" value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitSearch(); }} /></div>
        <select aria-label="搜索结果状态" className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" value={resultType} onChange={(event) => { setPage(1); setResultType(event.target.value as typeof resultType); }}><option value="">全部结果</option><option value="WITH_RESULTS">有结果</option><option value="NO_RESULTS">无结果</option></select>
        <Button onClick={submitSearch}>查询</Button>
      </div>

      <DataTable columns={columns} data={items} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无搜索日志" emptyDescription="C 端登录用户执行搜索后会出现在这里。" />
      <div className="flex items-center justify-end gap-3 text-sm text-[#6b7280]"><span>共 {total} 条</span><Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button><span>{page} / {maxPage}</span><Button variant="ghost" disabled={page >= maxPage} onClick={() => setPage(page + 1)}>下一页</Button></div>
    </section>
  );
};
