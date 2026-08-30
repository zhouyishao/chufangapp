import { useEffect, useMemo, useState } from 'react';

import { createAdmin, deleteAdmin, listAdmins, listRoles, resetAdminPassword, setAdminStatus, updateAdmin } from '../api';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { FilterPanel } from '../components/FilterPanel';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import { canAccess } from '../permissions';
import { loadAdminUser } from '../storage';
import type { AdminAccountItem, AdminRoleItem } from '../types';

type Draft = { username: string; nickname: string; password: string; roleId: number | ''; status: AdminAccountItem['status'] };
const emptyDraft: Draft = { username: '', nickname: '', password: '', roleId: '', status: 'ACTIVE' };

export const SettingsPage = () => {
  const currentAdmin = loadAdminUser();
  const canManage = canAccess('system:admin:manage');
  const [items, setItems] = useState<AdminAccountItem[]>([]);
  const [roles, setRoles] = useState<AdminRoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | AdminAccountItem['status']>('all');
  const [roleId, setRoleId] = useState<'all' | number>('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAccountItem | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [passwordTarget, setPasswordTarget] = useState<AdminAccountItem | null>(null);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState<AdminAccountItem | null>(null);

  const refresh = async () => {
    setLoading(true); setError(null);
    try {
      const [adminsResult, rolesResult] = await Promise.all([
        listAdmins({ page, pageSize, q, status: status === 'all' ? undefined : status, roleId: roleId === 'all' ? undefined : roleId }),
        listRoles({ page: 1, pageSize: 100, status: 'ACTIVE' })
      ]);
      setItems(adminsResult.list); setTotal(adminsResult.total); setRoles(rolesResult.list);
    } catch (reason) { setError(reason instanceof Error ? reason.message : '管理员加载失败'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, [page, pageSize, q, status, roleId]);

  const openCreate = () => { setEditing(null); setDraft(emptyDraft); setDrawerOpen(true); setError(null); };
  const openEdit = (item: AdminAccountItem) => { setEditing(item); setDraft({ username: item.username, nickname: item.nickname ?? '', password: '', roleId: item.role?.id ?? '', status: item.status }); setDrawerOpen(true); setError(null); };
  const save = async () => {
    if (!draft.nickname.trim() || !draft.roleId || (!editing && (!draft.username.trim() || !/^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(draft.password)))) return;
    setSubmitting(true); setError(null);
    try {
      if (editing) await updateAdmin(editing.id, { nickname: draft.nickname.trim(), roleId: draft.roleId, status: draft.status });
      else await createAdmin({ username: draft.username.trim(), nickname: draft.nickname.trim(), password: draft.password, roleId: draft.roleId, status: draft.status });
      setDrawerOpen(false); setNotice(editing ? '管理员已保存' : '管理员已新增'); await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : '保存失败'); }
    finally { setSubmitting(false); }
  };
  const toggleStatus = async (item: AdminAccountItem) => {
    setSubmitting(true); setError(null);
    try { await setAdminStatus(item.id, item.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'); setNotice(item.status === 'ACTIVE' ? '管理员已停用' : '管理员已启用'); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '状态修改失败'); }
    finally { setSubmitting(false); }
  };
  const savePassword = async () => {
    if (!passwordTarget || !/^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(password)) return;
    setSubmitting(true); setError(null);
    try { await resetAdminPassword(passwordTarget.id, password); setPasswordTarget(null); setPassword(''); setNotice('密码已重置'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '密码重置失败'); }
    finally { setSubmitting(false); }
  };
  const confirmDelete = async () => {
    if (!deleting) return; setSubmitting(true); setError(null);
    try { await deleteAdmin(deleting.id); setDeleting(null); setNotice('管理员已删除'); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '删除失败'); }
    finally { setSubmitting(false); }
  };

  const activeOnPage = useMemo(() => items.filter((item) => item.status === 'ACTIVE').length, [items]);
  const columns: DataTableColumn<AdminAccountItem>[] = [
    { key: 'username', title: '账号', render: (item) => <span className="font-medium text-[#2f2f2f]">{item.username}</span> },
    { key: 'nickname', title: '昵称', render: (item) => item.nickname ?? '-' },
    { key: 'role', title: '角色', render: (item) => item.role?.name ?? '未配置' },
    { key: 'status', title: '状态', render: (item) => <StatusTag label={item.status === 'ACTIVE' ? '启用' : '禁用'} tone={item.status === 'ACTIVE' ? 'green' : 'gray'} /> },
    { key: 'lastLoginAt', title: '最近登录', render: (item) => item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('zh-CN', { hour12: false }) : '从未登录' },
    { key: 'actions', title: '操作', render: (item) => canManage ? <div className="flex min-w-[260px] justify-end gap-2"><Button variant="ghost" onClick={() => openEdit(item)}>编辑</Button><Button variant="ghost" onClick={() => { setPasswordTarget(item); setPassword(''); }}>重置密码</Button><Button variant="ghost" disabled={submitting || item.id === currentAdmin?.id} onClick={() => void toggleStatus(item)}>{item.status === 'ACTIVE' ? '停用' : '启用'}</Button><Button variant="danger" disabled={submitting || item.id === currentAdmin?.id} onClick={() => setDeleting(item)}>删除</Button></div> : <span className="text-[#8c8c8c]">只读</span> }
  ];

  return <section className="space-y-6">
    <PageHeader title="管理员管理" description="真实维护后台管理员、单一角色、启用状态和登录记录。" actions={canManage ? <Button onClick={openCreate}>新增管理员</Button> : null} />
    {error ? <div className="flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><Button variant="ghost" onClick={() => void refresh()}>重试</Button></div> : null}
    {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{[{ label: '管理员总数', value: total }, { label: '本页启用账号', value: activeOnPage }, { label: '启用角色', value: roles.length }].map((metric) => <div key={metric.label} className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5"><div className="text-sm text-[#8c8c8c]">{metric.label}</div><div className="mt-3 text-3xl font-semibold text-[#2f2f2f]">{metric.value}</div></div>)}</div>
    <FilterPanel><div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3"><Input value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="搜索账号 / 昵称" /><select value={roleId} onChange={(e) => { setPage(1); setRoleId(e.target.value === 'all' ? 'all' : Number(e.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="all">全部角色</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as typeof status); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="all">全部状态</option><option value="ACTIVE">启用</option><option value="DISABLED">禁用</option></select></div><div className="flex items-center gap-2 text-sm text-[#8c8c8c]"><select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value={10}>10 / 页</option><option value={20}>20 / 页</option></select><Button variant="ghost" disabled={page <= 1 || loading} onClick={() => setPage((v) => Math.max(1, v - 1))}>上一页</Button><span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页</span><Button variant="ghost" disabled={page * pageSize >= total || loading} onClick={() => setPage((v) => v + 1)}>下一页</Button></div></FilterPanel>
    <DataTable columns={columns} data={items} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无管理员" />
    <Drawer title={editing ? '编辑管理员' : '新增管理员'} open={drawerOpen} onClose={() => !submitting && setDrawerOpen(false)} widthClassName="max-w-xl"><div className="space-y-4"><div><div className="mb-1 text-xs text-zinc-600">账号</div><Input value={draft.username} disabled={!!editing} onChange={(e) => setDraft({ ...draft, username: e.target.value })} /></div><div><div className="mb-1 text-xs text-zinc-600">昵称</div><Input value={draft.nickname} onChange={(e) => setDraft({ ...draft, nickname: e.target.value })} /></div>{!editing ? <div><div className="mb-1 text-xs text-zinc-600">初始密码</div><Input type="password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} /><div className="mt-1 text-xs text-[#8c8c8c]">至少 8 位，包含字母和数字</div></div> : null}<div><div className="mb-1 text-xs text-zinc-600">角色</div><select value={draft.roleId} onChange={(e) => setDraft({ ...draft, roleId: Number(e.target.value) || '' })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"><option value="">请选择角色</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.status === 'ACTIVE'} onChange={(e) => setDraft({ ...draft, status: e.target.checked ? 'ACTIVE' : 'DISABLED' })} />启用账号</label><div className="flex justify-end gap-2"><Button variant="ghost" disabled={submitting} onClick={() => setDrawerOpen(false)}>取消</Button><Button disabled={submitting || !draft.nickname.trim() || !draft.roleId} onClick={() => void save()}>{submitting ? '保存中...' : '保存'}</Button></div></div></Drawer>
    <Drawer title={`重置密码${passwordTarget ? ` · ${passwordTarget.username}` : ''}`} open={!!passwordTarget} onClose={() => !submitting && setPasswordTarget(null)} widthClassName="max-w-md"><div className="space-y-4"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 8 位，包含字母和数字" /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setPasswordTarget(null)}>取消</Button><Button disabled={submitting || !/^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(password)} onClick={() => void savePassword()}>确认重置</Button></div></div></Drawer>
    <ConfirmModal title="删除管理员" open={!!deleting} description={deleting ? `确认删除管理员「${deleting.nickname ?? deleting.username}」？` : null} confirmText="删除" danger onClose={() => setDeleting(null)} onConfirm={() => void confirmDelete()} />
  </section>;
};
