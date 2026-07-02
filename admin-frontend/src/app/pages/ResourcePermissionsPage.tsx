import { useEffect, useState, useMemo } from 'react';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';
import { StatusTag } from '../components/StatusTag';
import {
  listResourcePermissions,
  createResourcePermission,
  updateResourcePermission,
  setResourcePermissionStatus,
  deleteResourcePermission
} from '../api';
import type { ResourcePermissionItem } from '../types';

type DraftPermission = {
  name: string;
  code: string;
  path: string;
  method: string;
  module: ResourcePermissionItem['module'];
  authRequired: boolean;
  status: ResourcePermissionItem['status'];
};

const emptyDraft: DraftPermission = {
  name: '',
  code: '',
  path: '',
  method: 'GET',
  module: 'RECIPE',
  authRequired: true,
  status: 'ACTIVE'
};

const moduleLabels: Record<string, string> = {
  RECIPE: '菜谱',
  INGREDIENT: '食材',
  FRUIT: '水果',
  SEASONING: '调料',
  BEVERAGE: '酒水',
  PRICE: '价格',
  CATEGORY: '分类'
};

const moduleOptions = [
  { label: '菜谱', value: 'RECIPE' },
  { label: '食材', value: 'INGREDIENT' },
  { label: '水果', value: 'FRUIT' },
  { label: '调料', value: 'SEASONING' },
  { label: '酒水', value: 'BEVERAGE' },
  { label: '价格', value: 'PRICE' },
  { label: '分类', value: 'CATEGORY' }
];

const methodPillClass: Record<string, string> = {
  GET: 'bg-[#edf5ea] text-[#6f8b62] border-[#d8e9d1]',
  POST: 'bg-[#f0ecfb] text-[#8f6ad8] border-[#e3d7f4]',
  PUT: 'bg-[#eef7fb] text-[#5f9bb3] border-[#d5edf4]',
  DELETE: 'bg-red-50 text-red-600 border-red-100'
};

export const ResourcePermissionsPage = () => {
  const [items, setItems] = useState<ResourcePermissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [selectedItem, setSelectedItem] = useState<ResourcePermissionItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ResourcePermissionItem | null>(null);
  const [draft, setDraft] = useState<DraftPermission>(emptyDraft);
  const [deleting, setDeleting] = useState<ResourcePermissionItem | null>(null);

  const canSave = useMemo(() => {
    return (
      draft.name.trim().length > 0 &&
      draft.code.trim().length > 0 &&
      draft.path.trim().length > 0 &&
      draft.method.trim().length > 0
    );
  }, [draft]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listResourcePermissions({
        page,
        pageSize,
        q: appliedQ.trim() || undefined,
        status: (statusFilter || undefined) as ResourcePermissionItem['status'],
        module: (moduleFilter || undefined) as ResourcePermissionItem['module']
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
  }, [page, pageSize, appliedQ, moduleFilter, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    setAppliedQ(q);
  };

  const handleReset = () => {
    setPage(1);
    setQ('');
    setAppliedQ('');
    setModuleFilter('');
    setStatusFilter('');
  };

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setError(null);
    setDrawerOpen(true);
  };

  const openEdit = (item: ResourcePermissionItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditing(item);
    setDraft({
      name: item.name,
      code: item.code,
      path: item.path,
      method: item.method,
      module: item.module,
      authRequired: item.authRequired,
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
        code: draft.code.trim(),
        path: draft.path.trim(),
        method: draft.method.trim(),
        module: draft.module,
        authRequired: draft.authRequired,
        status: draft.status
      };

      if (editing) {
        await updateResourcePermission(editing.id, payload);
        setNotice('更新成功');
      } else {
        await createResourcePermission(payload);
        setNotice('新增成功');
      }
      setDrawerOpen(false);
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setError(null);
    try {
      await deleteResourcePermission(deleting.id);
      setDeleting(null);
      setNotice('删除成功');
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleToggleStatus = async (item: ResourcePermissionItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setError(null);
    const nextStatus = item.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await setResourcePermissionStatus(item.id, nextStatus);
      setNotice(nextStatus === 'ACTIVE' ? '权限已启用' : '权限已停用');
      await refresh();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">接口权限</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">
            配置 API 接口路由与系统权限编码的映射关系，控制不同角色和 API Key 的数据读取和写入权限。
          </p>
        </div>
        <Button onClick={openCreate} className="bg-[#2f6f2f] hover:bg-[#235623]">
          ＋ 新增权限
        </Button>
      </div>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1.5fr_2fr_auto_auto] items-end">
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#2f2f2f]">所属模块</span>
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="">全部</option>
              {moduleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
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
              placeholder="输入权限名称、编码或路由路径搜索..."
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
                <th className="border-b border-[#e9e2d6] px-4 py-4">权限名称</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">权限编码</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">接口路径</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">请求方法</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">所属模块</th>
                <th className="border-b border-[#e9e2d6] px-4 py-4">是否需要授权</th>
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
                    暂无权限配置
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
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-zinc-700 font-mono font-semibold">
                      {item.code}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-zinc-600 font-mono break-all">
                      {item.path}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4">
                      <span className={`inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold ${methodPillClass[item.method] || 'bg-zinc-50 border-zinc-200'}`}>
                        {item.method}
                      </span>
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">
                      {moduleLabels[item.module] || item.module}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4 text-[#2f2f2f]">
                      {item.authRequired ? (
                        <span className="inline-flex rounded-md border border-emerald-100 bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">
                          是 (Required)
                        </span>
                      ) : (
                        <span className="inline-flex rounded-md border border-zinc-200 bg-zinc-50 text-zinc-600 px-2 py-0.5 text-xs">
                          否 (Public)
                        </span>
                      )}
                    </td>
                    <td className="border-b border-[#f1ece4] px-4 py-4">
                      <StatusTag
                        label={item.status === 'ACTIVE' ? '启用' : '停用'}
                        tone={item.status === 'ACTIVE' ? 'green' : 'orange'}
                      />
                    </td>
                    <td
                      className="sticky right-0 z-10 whitespace-nowrap border-b border-[#f1ece4] bg-white px-4 py-4 text-right shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]"
                      onClick={(e) => e.stopPropagation()}
                    >
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
        title={editing ? '编辑权限' : '新增权限'}
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
            <span className="text-xs font-semibold text-[#2f2f2f]">权限名称 *</span>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="例如：查询菜谱列表"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">权限编码 *</span>
            <Input
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
              placeholder="例如：recipe:list"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">接口路径 *</span>
            <Input
              value={draft.path}
              onChange={(e) => setDraft({ ...draft, path: e.target.value })}
              placeholder="例如：/api/admin/recipes"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">请求方法 *</span>
            <select
              value={draft.method}
              onChange={(e) => setDraft({ ...draft, method: e.target.value })}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">所属模块 *</span>
            <select
              value={draft.module}
              onChange={(e) =>
                setDraft({ ...draft, module: e.target.value as ResourcePermissionItem['module'] })
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
            >
              {moduleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 py-2 cursor-pointer">
            <input
              type="checkbox"
              id="authRequired"
              checked={draft.authRequired}
              onChange={(e) => setDraft({ ...draft, authRequired: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300 accent-[#7a8b6f]"
            />
            <label htmlFor="authRequired" className="text-sm text-zinc-700 cursor-pointer select-none">
              需要接口访问授权 (API Key 鉴权)
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#2f2f2f]">状态</span>
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as ResourcePermissionItem['status'] })
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

      {/* Details Drawer */}
      <Drawer
        title="接口权限详情"
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        widthClassName="max-w-lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-[#8c8c8c]">权限名称</div>
                  <div className="mt-1 text-sm font-semibold text-[#2f2f2f]">{selectedItem.name}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">权限编码</div>
                  <div className="mt-1 text-sm font-mono text-zinc-700 font-semibold">
                    {selectedItem.code}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-[#8c8c8c]">接口路径</div>
                  <div className="mt-1 text-sm font-mono text-zinc-700 break-all">{selectedItem.path}</div>
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
                  <div className="text-xs text-[#8c8c8c]">所属模块</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">
                    {moduleLabels[selectedItem.module] || selectedItem.module}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">需要授权</div>
                  <div className="mt-1 text-sm text-[#2f2f2f]">
                    {selectedItem.authRequired ? '需要授权访问' : '公开访问'}
                  </div>
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
                编辑权限
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        title="确认删除权限"
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        description={
          deleting ? (
            <span>
              确定要删除权限「<strong>{deleting.name}</strong>」吗？删除该映射配置将可能导致依赖它的第三方客户端鉴权失效或请求被拒。
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
