import { useEffect, useState, useMemo } from 'react';
import { Button } from '../components/Button';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';
import { listResourceLogs } from '../api';
import type { ResourceLogItem } from '../types';

const methodPillClass: Record<string, string> = {
  GET: 'bg-[#edf5ea] text-[#6f8b62] border-[#d8e9d1]',
  POST: 'bg-[#f0ecfb] text-[#8f6ad8] border-[#e3d7f4]',
  PUT: 'bg-[#eef7fb] text-[#5f9bb3] border-[#d5edf4]',
  DELETE: 'bg-red-50 text-red-600 border-red-100'
};

const statusTone = (code: number) => {
  if (code >= 200 && code < 300) return 'text-[#2f6f2f] bg-emerald-50 border-emerald-100';
  if (code >= 400 && code < 500) return 'text-[#c27b48] bg-[#fbf1e7] border-[#ead3be]';
  return 'text-red-600 bg-red-50 border-red-100';
};

export const ResourceLogsPage = () => {
  const [items, setItems] = useState<ResourceLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [selectedItem, setSelectedItem] = useState<ResourceLogItem | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listResourceLogs({
        page,
        pageSize,
        q: appliedQ.trim() || undefined,
        method: methodFilter || undefined,
        statusCode: statusFilter || undefined
      });
      setItems(data.list);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [page, pageSize, appliedQ, methodFilter, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    setAppliedQ(q);
  };

  const handleReset = () => {
    setPage(1);
    setQ('');
    setAppliedQ('');
    setMethodFilter('');
    setStatusFilter('');
  };

  const metrics = useMemo(() => {
    const totalRequests = total;
    const errorCount = items.filter((i) => i.statusCode >= 400).length;
    const avgDuration =
      items.length > 0
        ? Math.round(items.reduce((sum, item) => sum + item.durationMs, 0) / items.length)
        : 0;

    return { totalRequests, errorCount, avgDuration };
  }, [items, total]);

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">调用日志</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">
            查看第三方应用和管理后台接口的实时调用流水日志，支持多维度检索与接口性能监控。
          </p>
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-5 rounded-2xl border border-[#e9e2d6] bg-white p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl bg-[#edf5ea] text-[#6f8b62]">
            📅
          </div>
          <div>
            <div className="text-sm text-[#8c8c8c]">今日总请求数</div>
            <div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{metrics.totalRequests} <span className="text-sm font-normal">次</span></div>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-2xl border border-[#e9e2d6] bg-white p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl bg-[#eef7fb] text-[#5f9bb3]">
            ⚡
          </div>
          <div>
            <div className="text-sm text-[#8c8c8c]">平均响应时间</div>
            <div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{metrics.avgDuration} <span className="text-sm font-normal">ms</span></div>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-2xl border border-[#e9e2d6] bg-white p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl bg-red-50 text-red-500">
            🚨
          </div>
          <div>
            <div className="text-sm text-[#8c8c8c]">本页接口异常数</div>
            <div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{metrics.errorCount} <span className="text-sm font-normal">次</span></div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1.5fr_2.5fr_auto_auto] items-end">
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#2f2f2f]">请求方法</span>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="">全部</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#2f2f2f]">状态码</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="">全部</option>
              <option value="200">200 (成功)</option>
              <option value="201">201 (创建成功)</option>
              <option value="400">400 (请求错误)</option>
              <option value="401">401 (未授权)</option>
              <option value="404">404 (未找到)</option>
              <option value="500">500 (服务器错误)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#2f2f2f]">关键词</span>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="搜索接口路径、API Key 前缀、IP地址或错误信息..."
              className="h-11 rounded-xl"
            />
          </div>

          <Button onClick={handleSearch} className="h-11 bg-[#2f6f2f] hover:bg-[#235623] px-6">
            查询
          </Button>
          <Button variant="ghost" onClick={handleReset} className="h-11 px-6">
            重置
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e9e2d6] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-[#fffdfc] text-xs text-[#8c8c8c]">
              <tr>
                <th className="border-b border-[#e9e2d6] px-4 py-4">调用时间</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">应用名称</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">API Key 前缀</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">请求方法</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">接口路径</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">状态码</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">耗时</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">IP</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">错误信息</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-[#8c8c8c]">
                    加载中...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-[#8c8c8c]">
                    暂无接口调用日志
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-[#fffdfc] cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-zinc-500 font-mono">
                      {new Date(item.calledAt).toLocaleString()}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 font-medium text-[#2f2f2f]">
                      {item.appName}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-zinc-600 font-mono">
                      {item.apiKeyPrefix ? `${item.apiKeyPrefix}***` : '管理员登录'}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${methodPillClass[item.method] || 'bg-zinc-50 border-zinc-200'}`}>
                        {item.method}
                      </span>
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-zinc-700 font-mono font-semibold max-w-xs truncate">
                      {item.path}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-mono font-semibold ${statusTone(item.statusCode)}`}>
                        {item.statusCode}
                      </span>
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f] font-mono">
                      {item.durationMs} ms
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-zinc-500 font-mono">
                      {item.ip || '-'}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-red-500 max-w-[200px] truncate">
                      {item.errorMessage || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between gap-4 border-t border-[#f1ece4] px-5 py-4 text-sm text-[#8c8c8c]">
          <span>共 {total} 条记录</span>
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

      {/* Details Drawer */}
      <Drawer
        title="日志详细信息"
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        widthClassName="max-w-xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-2">
                  <div className="text-xs text-[#8c8c8c]">日志 ID</div>
                  <div className="mt-1 text-sm font-mono text-zinc-700 break-all">{selectedItem.id}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">调用时间</div>
                  <div className="mt-1 text-sm font-mono text-zinc-600">
                    {new Date(selectedItem.calledAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">应用名称</div>
                  <div className="mt-1 text-sm font-semibold text-[#2f2f2f]">{selectedItem.appName}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">API Key 前缀</div>
                  <div className="mt-1 text-sm font-mono text-zinc-600">
                    {selectedItem.apiKeyPrefix ? `${selectedItem.apiKeyPrefix}***` : '管理员'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">IP 地址</div>
                  <div className="mt-1 text-sm font-mono text-zinc-600">{selectedItem.ip || '-'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-[#8c8c8c]">接口路径</div>
                  <div className="mt-1 text-sm font-mono text-zinc-700 break-all font-semibold">
                    {selectedItem.path}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">请求方法</div>
                  <div className="mt-1">
                    <span className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold ${methodPillClass[selectedItem.method] || 'bg-zinc-50 border-zinc-200'}`}>
                      {selectedItem.method}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">状态码</div>
                  <div className="mt-1">
                    <span className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-mono font-semibold ${statusTone(selectedItem.statusCode)}`}>
                      {selectedItem.statusCode}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">耗时时间</div>
                  <div className="mt-1 text-sm font-mono text-[#2f2f2f] font-semibold">
                    {selectedItem.durationMs} ms
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">记录创建时间</div>
                  <div className="mt-1 text-sm text-zinc-500">
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </div>
                </div>
                {selectedItem.errorMessage && (
                  <div className="col-span-2">
                    <div className="text-xs text-red-500 font-semibold">异常/错误信息</div>
                    <div className="mt-1 p-3 bg-red-50 border border-red-100 rounded-xl font-mono text-sm text-red-600 break-all whitespace-pre-wrap">
                      {selectedItem.errorMessage}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#f5f1ea]">
              <Button variant="ghost" onClick={() => setSelectedItem(null)}>
                关闭
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </section>
  );
};
