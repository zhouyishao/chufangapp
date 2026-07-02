import { useEffect, useState, useMemo } from 'react';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';
import { StatusTag } from '../components/StatusTag';
import {
  listResourceApiKeys,
  createResourceApiKey,
  resetResourceApiKey,
  setResourceApiKeyStatus,
  deleteResourceApiKey,
  listResourceApps
} from '../api';
import type { ResourceApiKeyItem, ResourceAppItem } from '../types';

type DraftKey = {
  name: string;
  appId: number;
  permissionScope: string;
  status: ResourceApiKeyItem['status'];
  expiresAt: string;
};

const emptyDraft = (apps: ResourceAppItem[]): DraftKey => ({
  name: '',
  appId: apps[0]?.id || 0,
  permissionScope: 'recipe:view,ingredient:view',
  status: 'ACTIVE',
  expiresAt: ''
});

export const ResourceApiKeysPage = () => {
  const [items, setItems] = useState<ResourceApiKeyItem[]>([]);
  const [apps, setApps] = useState<ResourceAppItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [selectedItem, setSelectedItem] = useState<ResourceApiKeyItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<DraftKey>({
    name: '',
    appId: 0,
    permissionScope: '*',
    status: 'ACTIVE',
    expiresAt: ''
  });
  const [deleting, setDeleting] = useState<ResourceApiKeyItem | null>(null);
  const [resetting, setResetting] = useState<ResourceApiKeyItem | null>(null);

  // Raw key display modal (crucial security requirement)
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canSave = useMemo(() => {
    return (
      draft.name.trim().length > 0 &&
      draft.appId > 0 &&
      draft.permissionScope.trim().length > 0
    );
  }, [draft]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const refreshApps = async () => {
    try {
      const data = await listResourceApps({ page: 1, pageSize: 100 });
      setApps(data.list);
      if (data.list.length > 0 && draft.appId === 0) {
        setDraft((prev) => ({ ...prev, appId: data.list[0].id }));
      }
    } catch {
      // ignore silently
    }
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listResourceApiKeys({
        page,
        pageSize,
        q: appliedQ.trim() || undefined,
        status: (statusFilter || undefined) as ResourceApiKeyItem['status']
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
    void refreshApps();
  }, []);

  useEffect(() => {
    void refresh();
  }, [page, pageSize, appliedQ, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    setAppliedQ(q);
  };

  const handleReset = () => {
    setPage(1);
    setQ('');
    setAppliedQ('');
    setStatusFilter('');
  };

  const openCreate = () => {
    setDraft(emptyDraft(apps));
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setError(null);
    try {
      const payload = {
        name: draft.name.trim(),
        appId: Number(draft.appId),
        permissionScope: draft.permissionScope.trim(),
        status: draft.status,
        expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null
      };

      const result = await createResourceApiKey(payload);
      setDrawerOpen(false);
      
      // Store the rawKey to display it to the user once
      if (result.rawKey) {
        setNewRawKey(result.rawKey);
        setCopied(false);
      } else {
        setNotice('密钥新增成功');
      }
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    }
  };

  const handleResetKey = async () => {
    if (!resetting) return;
    setError(null);
    try {
      const result = await resetResourceApiKey(resetting.id);
      setResetting(null);
      if (result.rawKey) {
        setNewRawKey(result.rawKey);
        setCopied(false);
      } else {
        setNotice('密钥重置成功');
      }
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setError(null);
    try {
      await deleteResourceApiKey(deleting.id);
      setDeleting(null);
      setNotice('密钥删除成功');
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleToggleStatus = async (item: ResourceApiKeyItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setError(null);
    const nextStatus = item.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await setResourceApiKeyStatus(item.id, nextStatus);
      setNotice(nextStatus === 'ACTIVE' ? '密钥已启用' : '密钥已停用');
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleCopyKey = () => {
    if (!newRawKey) return;
    navigator.clipboard.writeText(newRawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">API Key 管理</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">
            管理用于接口访问授权的 API Key。为了系统安全，页面仅展示密钥前缀，支持密钥分配、重置与每日限额。
          </p>
        </div>
        <Button onClick={openCreate} disabled={apps.length === 0} className="bg-[#2f6f2f] hover:bg-[#235623]">
          ＋ 创建密钥
        </Button>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-2xl bg-[#fbf1e7] border border-[#ead3be] p-4 text-sm text-[#c27b48]">
          当前暂无可用应用。在创建 API Key 之前，请先前往应用管理创建一个应用。
        </div>
      ) : null}

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_3fr_auto_auto] items-end">
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
              <option value="EXPIRED">已过期</option>
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
              placeholder="输入密钥名称或前缀搜索..."
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
                <th className="border-b border-[#e9e2d6] px-4 py-4">Key 名称</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">所属应用</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">Key 前缀</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">权限范围</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">过期时间</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">今日调用</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">状态</th>
                <th className="sticky right-0 z-20 border-b border-[#e9e2d6] bg-[#fffdfc] px-4 py-4 text-right shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-[#8c8c8c]">
                    加载中...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-[#8c8c8c]">
                    暂无密钥密钥
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-[#fffdfc] cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="border-b border-[#f1ece4] px-4 py-4 font-medium text-[#2f2f2f]">
                      {item.name}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">
                      {item.appName}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-zinc-600 font-mono">
                      {item.keyPrefix}***
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-zinc-500 font-mono truncate max-w-xs">
                      {item.permissionScope}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-zinc-500">
                      {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : '永久有效'}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-[#c27b48] font-medium">
                      {item.todayCallCount} 次
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4">
                      <StatusTag
                        label={
                          item.status === 'ACTIVE'
                            ? '启用'
                            : item.status === 'DISABLED'
                            ? '停用'
                            : '已过期'
                        }
                        tone={
                          item.status === 'ACTIVE'
                            ? 'green'
                            : item.status === 'DISABLED'
                            ? 'orange'
                            : 'red'
                        }
                      />
                    </td>
                    <td
                      className="sticky right-0 z-10 whitespace-nowrap border-b border-[#f1ece4] bg-white px-4 py-4 text-right shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-3 text-sm">
                        <button
                          type="button"
                          onClick={() => setResetting(item)}
                          className="text-[#6f8b62] hover:text-[#2f6f2f] font-semibold"
                        >
                          重置密钥
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

      {/* Create Key Drawer */}
      <Drawer
        title="创建 API Key"
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
            <span className="text-xs font-semibold text-[#2f2f2f]">Key 名称 *</span>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="请输入用途说明，例：微信小程序核心 Key"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">所属应用 *</span>
            <select
              value={draft.appId}
              onChange={(e) => setDraft({ ...draft, appId: Number(e.target.value) })}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="0">请选择应用</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.appId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">权限范围 (Scopes) *</span>
            <Input
              value={draft.permissionScope}
              onChange={(e) => setDraft({ ...draft, permissionScope: e.target.value })}
              placeholder="例如: * (代表全部) 或逗号分隔：recipe:view,ingredient:view"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">过期时间 (留空为永久)</span>
            <Input
              type="date"
              value={draft.expiresAt}
              onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">状态</span>
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as ResourceApiKeyItem['status'] })
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
              创建
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Key Details Drawer */}
      <Drawer
        title="API Key 详情"
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        widthClassName="max-w-lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-[#8c8c8c]">Key 名称</div>
                  <div className="mt-1 text-sm font-semibold text-[#2f2f2f]">{selectedItem.name}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">所属应用</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">{selectedItem.appName}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">Key 前缀</div>
                  <div className="mt-1 text-sm font-mono text-zinc-700">
                    {selectedItem.keyPrefix}*** (明文已隐藏)
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">状态</div>
                  <div className="mt-1">
                    <StatusTag
                      label={
                        selectedItem.status === 'ACTIVE'
                          ? '启用'
                          : selectedItem.status === 'DISABLED'
                          ? '停用'
                          : '已过期'
                      }
                      tone={
                        selectedItem.status === 'ACTIVE'
                          ? 'green'
                          : selectedItem.status === 'DISABLED'
                          ? 'orange'
                          : 'red'
                      }
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">今日已调用</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">{selectedItem.todayCallCount} 次</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">过期时间</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">
                    {selectedItem.expiresAt ? new Date(selectedItem.expiresAt).toLocaleString() : '永久有效'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">权限范围 (Scopes)</div>
                  <div className="mt-1 text-sm text-zinc-700 font-mono break-all col-span-2">
                    {selectedItem.permissionScope}
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
                  setResetting(item);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                重置密钥
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Raw Key Display Modal (Show-Once warning alert) */}
      <ConfirmModal
        title="⚠️ 请立即复制保存您的 API Key"
        open={Boolean(newRawKey)}
        onClose={() => setNewRawKey(null)}
        description={
          <div className="space-y-4 text-left">
            <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
              安全提示：为了系统安全，该密钥<strong>仅会在当前窗口中显示一次</strong>。关闭此窗口后，您将无法再查看明文密钥，只能重新生成。
            </p>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-zinc-500">完整 API Key</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value={newRawKey || ''}
                  className="flex-1 h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-sm outline-none"
                />
                <Button onClick={handleCopyKey} className="bg-[#7a8b6f] hover:bg-[#68775f] whitespace-nowrap">
                  {copied ? '已复制 ✓' : '复制'}
                </Button>
              </div>
            </div>
          </div>
        }
        confirmText="我已安全保存并关闭"
        danger={false}
        onConfirm={() => setNewRawKey(null)}
      />

      {/* Reset Key Confirmation Modal */}
      <ConfirmModal
        title="确认重置 API Key"
        open={Boolean(resetting)}
        onClose={() => setResetting(null)}
        description={
          resetting ? (
            <span>
              确定要重置密钥「<strong>{resetting.name}</strong>」吗？重置后，原有的密钥将会<strong>立即失效</strong>，并生成全新密钥以供替换。
            </span>
          ) : null
        }
        confirmText="重置"
        danger
        onConfirm={handleResetKey}
      />

      {/* Delete Key Confirmation Modal */}
      <ConfirmModal
        title="确认删除 API Key"
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        description={
          deleting ? (
            <span>
              确定要永久删除密钥「<strong>{deleting.name}</strong>」吗？此操作将导致依赖它的客户端<strong>无法访问接口</strong>，且不可撤销。
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
