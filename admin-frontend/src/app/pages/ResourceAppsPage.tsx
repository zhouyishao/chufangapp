import { useEffect, useState, useMemo } from 'react';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';
import { StatusTag } from '../components/StatusTag';
import {
  listResourceApps,
  createResourceApp,
  updateResourceApp,
  setResourceAppStatus,
  deleteResourceApp
} from '../api';
import type { ResourceAppItem } from '../types';

type DraftApp = {
  name: string;
  appId: string;
  appType: ResourceAppItem['appType'];
  owner: string;
  status: ResourceAppItem['status'];
};

const emptyDraft: DraftApp = {
  name: '',
  appId: '',
  appType: 'APP',
  owner: '',
  status: 'ACTIVE'
};

const appTypeLabels: Record<string, string> = {
  ADMIN: '后台',
  APP: 'C端',
  THIRD_PARTY: '第三方'
};

const appTypePillClass: Record<string, string> = {
  ADMIN: 'bg-[#f0ecfb] text-[#8f6ad8] border-[#e3d7f4]',
  APP: 'bg-[#edf5ea] text-[#6f8b62] border-[#d8e9d1]',
  THIRD_PARTY: 'bg-[#eef7fb] text-[#5f9bb3] border-[#d5edf4]'
};

export const ResourceAppsPage = () => {
  const [items, setItems] = useState<ResourceAppItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [selectedItem, setSelectedItem] = useState<ResourceAppItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceAppItem | null>(null);
  const [draft, setDraft] = useState<DraftApp>(emptyDraft);
  const [deleting, setDeleting] = useState<ResourceAppItem | null>(null);

  const canSave = useMemo(() => {
    return (
      draft.name.trim().length > 0 &&
      draft.appId.trim().length > 0 &&
      draft.owner.trim().length > 0
    );
  }, [draft]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listResourceApps({
        page,
        pageSize,
        q: appliedQ.trim() || undefined,
        status: (statusFilter || undefined) as ResourceAppItem['status'],
        appType: (typeFilter || undefined) as ResourceAppItem['appType']
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
  }, [page, pageSize, appliedQ, typeFilter, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    setAppliedQ(q);
  };

  const handleReset = () => {
    setPage(1);
    setQ('');
    setAppliedQ('');
    setTypeFilter('');
    setStatusFilter('');
  };

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setError(null);
    setDrawerOpen(true);
  };

  const openEdit = (item: ResourceAppItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditing(item);
    setDraft({
      name: item.name,
      appId: item.appId,
      appType: item.appType,
      owner: item.owner,
      status: item.status
    });
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setError(null);
    try {
      const payload = {
        name: draft.name.trim(),
        appId: draft.appId.trim(),
        appType: draft.appType,
        owner: draft.owner.trim(),
        status: draft.status
      };

      if (editing) {
        await updateResourceApp(editing.id, payload);
        setNotice('更新成功');
      } else {
        await createResourceApp(payload);
        setNotice('新增成功');
      }
      setDrawerOpen(false);
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setError(null);
    try {
      await deleteResourceApp(deleting.id);
      setDeleting(null);
      setNotice('删除成功');
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleToggleStatus = async (item: ResourceAppItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setError(null);
    const nextStatus = item.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await setResourceAppStatus(item.id, nextStatus);
      setNotice(nextStatus === 'ACTIVE' ? '已启用' : '已停用');
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const metrics = useMemo(() => {
    const totalApps = items.length;
    const activeApps = items.filter((i) => i.status === 'ACTIVE').length;
    const totalKeys = items.reduce((sum, item) => sum + item.apiKeyCount, 0);
    const totalCalls = items.reduce((sum, item) => sum + item.todayCallCount, 0);
    return { totalApps, activeApps, totalKeys, totalCalls };
  }, [items]);

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">应用管理</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">
            管理接入平台接口的各应用客户端，支持应用 App ID 分配、负责人及调用统计。
          </p>
        </div>
        <Button onClick={openCreate} className="bg-[#2f6f2f] hover:bg-[#235623]">
          ＋ 新增应用
        </Button>
      </div>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="flex items-center gap-5 rounded-2xl border border-[#e9e2d6] bg-white p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl bg-[#edf5ea] text-[#6f8b62]">
            📱
          </div>
          <div>
            <div className="text-sm text-[#8c8c8c]">应用总数</div>
            <div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{metrics.totalApps} <span className="text-sm font-normal">个</span></div>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-2xl border border-[#e9e2d6] bg-white p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl bg-[#edf5ea] text-[#6f8b62]">
            ✓
          </div>
          <div>
            <div className="text-sm text-[#8c8c8c]">运行中应用</div>
            <div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{metrics.activeApps} <span className="text-sm font-normal">个</span></div>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-2xl border border-[#e9e2d6] bg-white p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl bg-[#fbf1e7] text-[#c27b48]">
            🔑
          </div>
          <div>
            <div className="text-sm text-[#8c8c8c]">API Key 总数</div>
            <div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{metrics.totalKeys} <span className="text-sm font-normal">个</span></div>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-2xl border border-[#e9e2d6] bg-white p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl bg-[#eef7fb] text-[#5f9bb3]">
            📊
          </div>
          <div>
            <div className="text-sm text-[#8c8c8c]">今日总调用</div>
            <div className="mt-1 text-3xl font-semibold text-[#2f2f2f]">{metrics.totalCalls} <span className="text-sm font-normal">次</span></div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1.5fr_2fr_auto_auto] items-end">
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#2f2f2f]">应用类型</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="">全部</option>
              <option value="ADMIN">后台</option>
              <option value="APP">C端</option>
              <option value="THIRD_PARTY">第三方</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#2f2f2f]">状态</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="">全部</option>
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">停用</option>
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
              placeholder="输入应用名称或 App ID 搜索..."
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
          <table className="w-full min-w-[1000px] border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-[#fffdfc] text-xs text-[#8c8c8c]">
              <tr>
                <th className="border-b border-[#e9e2d6] px-4 py-4">应用名称</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">App ID</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">应用类型</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">负责人</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">API Key 数量</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">今日调用次数</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">最后调用时间</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">状态</th>
                <th className="sticky right-0 z-20 border-b border-[#e9e2d6] bg-[#fffdfc] px-4 py-4 text-right shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]">
                  操作
                </th>
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
                    暂无应用
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-[#fffdfc] cursor-pointer" onClick={() => setSelectedItem(item)}>
                    <td className="border-b border-[#f1ece4] px-4 py-4 font-medium text-[#2f2f2f]">
                      {item.name}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-zinc-600 font-mono">
                      {item.appId}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4">
                      <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${appTypePillClass[item.appType]}`}>
                        {appTypeLabels[item.appType] || item.appType}
                      </span>
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">
                      {item.owner}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">
                      {item.apiKeyCount} 个
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-[#c27b48] font-medium">
                      {item.todayCallCount} 次
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-zinc-500">
                      {item.lastCalledAt ? new Date(item.lastCalledAt).toLocaleString() : '-'}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4">
                      <StatusTag
                        label={item.status === 'ACTIVE' ? '启用' : '停用'}
                        tone={item.status === 'ACTIVE' ? 'green' : 'orange'}
                      />
                    </td>
                    <td className="sticky right-0 z-10 whitespace-nowrap border-b border-[#f1ece4] bg-white px-4 py-4 text-right shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3 text-sm">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="text-[#6f8b62] hover:text-[#2f6f2f] font-semibold"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={(e) => void handleToggleStatus(item, e)}
                          className="text-[#c27b48] hover:text-[#a35f2f] font-semibold"
                        >
                          {item.status === 'ACTIVE' ? '停用' : '启用'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(item)}
                          className="text-red-500 hover:text-red-600 font-semibold"
                        >
                          删除
                        </button>
                      </div>
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

      {/* Edit Drawer */}
      <Drawer
        title={editing ? '编辑应用' : '新增应用'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        widthClassName="max-w-xl"
      >
        <div className="space-y-4">
          {error ? (
            <div className="rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-100">
              {error}
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">应用名称 *</span>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="请输入应用展示名称"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">App ID *</span>
            <Input
              value={draft.appId}
              onChange={(e) => setDraft({ ...draft, appId: e.target.value })}
              placeholder="小程序 AppID 或服务唯一标识"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">应用类型 *</span>
            <select
              value={draft.appType}
              onChange={(e) =>
                setDraft({ ...draft, appType: e.target.value as ResourceAppItem['appType'] })
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="APP">C端</option>
              <option value="ADMIN">后台</option>
              <option value="THIRD_PARTY">第三方</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">负责人 *</span>
            <Input
              value={draft.owner}
              onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
              placeholder="请输入应用管理员/负责人姓名"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">状态</span>
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as ResourceAppItem['status'] })
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">停用</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#f5f1ea]">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
              取消
            </Button>
            <Button disabled={!canSave} onClick={handleSave} className="bg-[#2f6f2f] hover:bg-[#235623]">
              保存
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Detail Drawer */}
      <Drawer
        title="应用详情"
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        widthClassName="max-w-lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-[#8c8c8c]">应用名称</div>
                  <div className="mt-1 text-sm font-semibold text-[#2f2f2f]">{selectedItem.name}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">App ID</div>
                  <div className="mt-1 text-sm font-mono text-zinc-700">{selectedItem.appId}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">应用类型</div>
                  <div className="mt-1">
                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${appTypePillClass[selectedItem.appType]}`}>
                      {appTypeLabels[selectedItem.appType] || selectedItem.appType}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">负责人</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">{selectedItem.owner}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">状态</div>
                  <div className="mt-1">
                    <StatusTag
                      label={selectedItem.status === 'ACTIVE' ? '启用' : '停用'}
                      tone={selectedItem.status === 'ACTIVE' ? 'green' : 'orange'}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">API Key 数量</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">{selectedItem.apiKeyCount} 个</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">今日调用次数</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">{selectedItem.todayCallCount} 次</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">最后调用时间</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">
                    {selectedItem.lastCalledAt ? new Date(selectedItem.lastCalledAt).toLocaleString() : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">创建时间</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">更新时间</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">
                    {new Date(selectedItem.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#f5f1ea]">
              <Button variant="ghost" onClick={() => setSelectedItem(null)}>
                关闭
              </Button>
              <Button
                onClick={() => {
                  const item = selectedItem;
                  setSelectedItem(null);
                  openEdit(item);
                }}
                className="bg-[#7a8b6f] hover:bg-[#68775f]"
              >
                编辑应用
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        title="确认删除应用"
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        description={
          deleting ? (
            <span>
              确定要删除应用「<strong>{deleting.name}</strong>」吗？删除后，该应用下的所有 API Key 和调用日志都将被清空，且不可恢复。
            </span>
          ) : null
        }
        confirmText="删除"
        danger
        onConfirm={handleDelete}
      />
    </section>
  );
};
