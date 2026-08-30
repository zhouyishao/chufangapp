import { useEffect, useState } from 'react';

import { createRole, deleteRole, listAdminPermissions, listRoles, replaceRolePermissions, setRoleStatus, updateRole } from '../api';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { FilterPanel } from '../components/FilterPanel';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import { canAccess } from '../permissions';
import type { AdminPermissionGroup, AdminRoleItem } from '../types';

type RoleDraft = { code: string; name: string; description: string; status: AdminRoleItem['status'] };
const emptyDraft: RoleDraft = { code: '', name: '', description: '', status: 'ACTIVE' };

export const RolesPage = () => {
  const canManage = canAccess('system:role:manage');
  const [items, setItems] = useState<AdminRoleItem[]>([]);
  const [groups, setGroups] = useState<AdminPermissionGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | AdminRoleItem['status']>('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRoleItem | null>(null);
  const [draft, setDraft] = useState<RoleDraft>(emptyDraft);
  const [permissionRole, setPermissionRole] = useState<AdminRoleItem | null>(null);
  const [permissionIds, setPermissionIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState<AdminRoleItem | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesResult, permissionGroups] = await Promise.all([
        listRoles({ page, pageSize, q, status: status === 'all' ? undefined : status }),
        listAdminPermissions()
      ]);
      setItems(rolesResult.list);
      setTotal(rolesResult.total);
      setGroups(permissionGroups);
      setPermissionRole((current) => current ? rolesResult.list.find((role) => role.id === current.id) ?? null : null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '角色权限加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [page, pageSize, q, status]);

  const openCreate = () => { setEditing(null); setDraft(emptyDraft); setDrawerOpen(true); setError(null); };
  const openEdit = (role: AdminRoleItem) => {
    setEditing(role);
    setDraft({ code: role.code, name: role.name, description: role.description ?? '', status: role.status });
    setDrawerOpen(true);
    setError(null);
  };
  const openPermissions = (role: AdminRoleItem) => {
    setPermissionRole(role);
    setPermissionIds(role.code === 'SUPER_ADMIN' ? groups.flatMap((group) => group.permissions.map((permission) => permission.id)) : role.permissionIds);
  };
  const saveRole = async () => {
    if (!draft.name.trim() || (!editing && !/^[A-Z][A-Z0-9_]{1,63}$/.test(draft.code))) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editing) await updateRole(editing.id, { name: draft.name.trim(), description: draft.description.trim() || null, status: draft.status });
      else await createRole({ code: draft.code.trim(), name: draft.name.trim(), description: draft.description.trim() || null, status: draft.status });
      setDrawerOpen(false);
      setNotice(editing ? '角色已保存' : '角色已新增，请继续配置权限');
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '角色保存失败');
    } finally {
      setSubmitting(false);
    }
  };
  const togglePermission = (id: number) => setPermissionIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const toggleGroup = (group: AdminPermissionGroup) => {
    const ids = group.permissions.map((permission) => permission.id);
    const allSelected = ids.every((id) => permissionIds.includes(id));
    setPermissionIds((current) => allSelected ? current.filter((id) => !ids.includes(id)) : Array.from(new Set([...current, ...ids])));
  };
  const savePermissions = async () => {
    if (!permissionRole || permissionRole.code === 'SUPER_ADMIN') return;
    setSubmitting(true);
    setError(null);
    try {
      await replaceRolePermissions(permissionRole.id, permissionIds);
      setNotice('角色权限已保存');
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '权限保存失败');
    } finally {
      setSubmitting(false);
    }
  };
  const toggleStatus = async (role: AdminRoleItem) => {
    setSubmitting(true);
    setError(null);
    try {
      await setRoleStatus(role.id, role.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE');
      setNotice(role.status === 'ACTIVE' ? '角色已停用' : '角色已启用');
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '状态修改失败');
    } finally {
      setSubmitting(false);
    }
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteRole(deleting.id);
      setDeleting(null);
      setNotice('角色已删除');
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '角色删除失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<AdminRoleItem>[] = [
    { key: 'code', title: '角色编码', render: (role) => <span className="font-medium text-[#2f2f2f]">{role.code}</span> },
    { key: 'name', title: '角色名称', render: (role) => role.name },
    { key: 'adminCount', title: '管理员数', render: (role) => role.adminCount },
    { key: 'permissionCount', title: '权限数', render: (role) => role.permissionCount ?? '全部' },
    { key: 'status', title: '状态', render: (role) => <StatusTag label={role.status === 'ACTIVE' ? '启用' : '禁用'} tone={role.status === 'ACTIVE' ? 'green' : 'gray'} /> },
    { key: 'updatedAt', title: '更新时间', render: (role) => new Date(role.updatedAt).toLocaleString('zh-CN', { hour12: false }) },
    { key: 'actions', title: '操作', render: (role) => <div className="flex min-w-[260px] justify-end gap-2">
      <Button variant="ghost" onClick={() => openPermissions(role)}>查看权限</Button>
      {canManage ? <><Button variant="ghost" onClick={() => openEdit(role)}>编辑</Button><Button variant="ghost" disabled={submitting || role.isSystem || role.adminCount > 0} onClick={() => void toggleStatus(role)}>{role.status === 'ACTIVE' ? '停用' : '启用'}</Button><Button variant="danger" disabled={submitting || role.isSystem || role.adminCount > 0} onClick={() => setDeleting(role)}>删除</Button></> : null}
    </div> }
  ];

  return <section className="space-y-6">
    <PageHeader title="角色权限" description="真实维护后台角色及菜单、页面与操作权限；超级管理员权限固定为全部。" actions={canManage ? <Button onClick={openCreate}>新增角色</Button> : null} />
    {error ? <div className="flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><Button variant="ghost" onClick={() => void refresh()}>重试</Button></div> : null}
    {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="space-y-4">
        <FilterPanel><div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2"><Input value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="搜索角色名称 / 编码" /><select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as typeof status); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="all">全部状态</option><option value="ACTIVE">启用</option><option value="DISABLED">禁用</option></select></div><div className="flex items-center gap-2 text-sm text-[#8c8c8c]"><select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value={10}>10 / 页</option><option value={20}>20 / 页</option></select><Button variant="ghost" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button><span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页</span><Button variant="ghost" disabled={page * pageSize >= total || loading} onClick={() => setPage((value) => value + 1)}>下一页</Button></div></FilterPanel>
        <DataTable columns={columns} data={items} loading={loading} error={error} rowKey={(role) => role.id} emptyTitle="暂无角色" />
      </div>
      <aside className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
        <h2 className="text-lg font-semibold text-[#2f2f2f]">{permissionRole ? `${permissionRole.name} · 权限` : '权限配置'}</h2>
        <p className="mt-2 text-sm text-[#8c8c8c]">{permissionRole ? (permissionRole.code === 'SUPER_ADMIN' ? '系统超级管理员自动拥有全部权限，不可修改。' : '权限按业务模块分组，保存后该角色账号重新请求即生效。') : '请从角色列表选择“查看权限”。'}</p>
        {permissionRole ? <div className="mt-5 max-h-[620px] space-y-4 overflow-y-auto pr-1">{groups.map((group) => {
          const groupIds = group.permissions.map((permission) => permission.id);
          const checked = groupIds.every((id) => permissionIds.includes(id));
          const disabled = !canManage || permissionRole.code === 'SUPER_ADMIN';
          return <div key={group.module} className="rounded-2xl bg-[#f5f1ea] p-4"><label className="flex items-center gap-2 text-sm font-medium text-[#2f2f2f]"><input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleGroup(group)} />{group.moduleName}</label><div className="mt-3 space-y-2 pl-6">{group.permissions.map((permission) => <label key={permission.id} className="flex items-start gap-2 text-sm text-[#666]"><input className="mt-1" type="checkbox" checked={permissionIds.includes(permission.id)} disabled={disabled} onChange={() => togglePermission(permission.id)} /><span>{permission.name}<small className="block text-[#9b9185]">{permission.key}</small></span></label>)}</div></div>;
        })}{canManage && permissionRole.code !== 'SUPER_ADMIN' ? <Button disabled={submitting} onClick={() => void savePermissions()}>{submitting ? '保存中...' : '保存权限'}</Button> : null}</div> : null}
      </aside>
    </div>
    <Drawer title={editing ? '编辑角色' : '新增角色'} open={drawerOpen} onClose={() => !submitting && setDrawerOpen(false)} widthClassName="max-w-xl"><div className="space-y-4"><div><div className="mb-1 text-xs text-zinc-600">角色编码</div><Input value={draft.code} disabled={!!editing} onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })} placeholder="例如 REVIEW_OPERATOR" /><div className="mt-1 text-xs text-[#8c8c8c]">大写字母开头，仅允许大写字母、数字和下划线</div></div><div><div className="mb-1 text-xs text-zinc-600">角色名称</div><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div><div><div className="mb-1 text-xs text-zinc-600">角色说明</div><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.status === 'ACTIVE'} disabled={editing?.code === 'SUPER_ADMIN'} onChange={(event) => setDraft({ ...draft, status: event.target.checked ? 'ACTIVE' : 'DISABLED' })} />启用角色</label><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDrawerOpen(false)}>取消</Button><Button disabled={submitting || !draft.name.trim() || (!editing && !/^[A-Z][A-Z0-9_]{1,63}$/.test(draft.code))} onClick={() => void saveRole()}>{submitting ? '保存中...' : '保存'}</Button></div></div></Drawer>
    <ConfirmModal title="删除角色" open={!!deleting} description={deleting ? `确认删除角色「${deleting.name}」？仅无关联管理员的非系统角色可删除。` : null} confirmText="删除" danger onClose={() => setDeleting(null)} onConfirm={() => void confirmDelete()} />
  </section>;
};
