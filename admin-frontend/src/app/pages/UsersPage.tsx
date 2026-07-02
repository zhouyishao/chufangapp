import { Download, Search, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  ApiError,
  listUsers,
  setUserStatus,
  createUser,
  updateUser,
  deleteUser
} from '../api';
import { Button } from '../components/Button';
import { Drawer } from '../components/Drawer';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { ImagePreview } from '../components/ImagePreview';
import { ImageEditorUploader } from '../components/ImageEditorUploader';
import { StatusTag } from '../components/StatusTag';
import type { AdminUserListItem, PageResult } from '../types';

const initialPage: PageResult<AdminUserListItem> = {
  list: [],
  page: 1,
  pageSize: 20,
  total: 0
};

const registrationLabel: Record<AdminUserListItem['registerSource'], string> = {
  WECHAT: '微信',
  PHONE: '手机号'
};

const statusLabel: Record<AdminUserListItem['status'], string> = {
  ACTIVE: '正常',
  DISABLED: '禁用'
};

const sourceLabel: Record<string, string> = {
  USER: 'App 注册',
  ADMIN_CREATED: '后台创建',
  BACKOFFICE: '系统添加'
};

const roleLabel: Record<string, string> = {
  USER: '普通用户',
  ADMIN: '管理员',
  OPERATOR: '运营编辑'
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('zh-CN', { hour12: false });
};

const formatPhone = (value?: string | null) => {
  if (!value) return '—';
  if (value.length < 7) return value;
  return `${value.slice(0, 3)}****${value.slice(-4)}`;
};

const normalizeErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return '后端服务未连接，请确认 3002 服务已启动。';
  }
  return error instanceof Error ? error.message : '操作失败';
};

const initialForm = {
  nickname: '',
  phone: '',
  email: '',
  password: '',
  avatar: '',
  gender: '未知',
  birthday: '',
  region: '',
  status: 'ACTIVE' as 'ACTIVE' | 'DISABLED',
  role: 'USER',
  source: 'ADMIN_CREATED'
};

export const UsersPage = () => {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | AdminUserListItem['status']>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [familyCount, setFamilyCount] = useState<'all' | 'NONE' | 'ONE' | 'MULTIPLE'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Drawer States
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'detail' | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);

  // Deletion States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUserListItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Status Toggle States
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<AdminUserListItem | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  
  // Form States
  const [formState, setFormState] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const stats = useMemo(() => {
    const active = data.list.filter((item) => item.status === 'ACTIVE').length;
    const disabled = data.list.filter((item) => item.status === 'DISABLED').length;
    const adminCreated = data.list.filter((item) => item.source === 'ADMIN_CREATED' || item.source === 'BACKOFFICE').length;
    return [
      { label: '用户总数', value: data.total, tone: 'green' },
      { label: '本页正常', value: active, tone: 'green' },
      { label: '本页禁用', value: disabled, tone: 'red' },
      { label: '本页后台创建', value: adminCreated, tone: 'orange' },
      { label: '今日新增', value: data.list.filter((item) => new Date(item.createdAt).toDateString() === new Date().toDateString()).length, tone: 'green' }
    ];
  }, [data.list, data.total]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listUsers({
        page,
        pageSize,
        q: keyword,
        status: status === 'all' ? undefined : status,
        source: sourceFilter === 'all' ? undefined : sourceFilter,
        role: roleFilter === 'all' ? undefined : roleFilter,
        familyCount: familyCount === 'all' ? undefined : familyCount,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      setData(result);
    } catch (err) {
      setData({ ...initialPage, page, pageSize });
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    void loadData();
  };

  const handleReset = () => {
    setKeyword('');
    setStatus('all');
    setSourceFilter('all');
    setRoleFilter('all');
    setFamilyCount('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setNotice('筛选条件已重置');
    setTimeout(() => setNotice(null), 3000);
    setTimeout(() => void loadData(), 0);
  };

  const handleToggleStatus = (item: AdminUserListItem) => {
    setUserToToggle(item);
    setToggleError(null);
    setStatusModalOpen(true);
  };

  const openDeleteModal = (item: AdminUserListItem) => {
    setUserToDelete(item);
    setDeleteConfirmText('');
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
    setDeleteConfirmText('');
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setSaving(true);
    setDeleteError(null);
    try {
      await deleteUser(userToDelete.legacyId);
      setNotice(`用户「${userToDelete.nickname ?? userToDelete.code}」已成功注销`);
      setTimeout(() => setNotice(null), 3000);
      setPage(1);
      closeDeleteModal();
      await loadData();
    } catch (err) {
      setDeleteError(normalizeErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Open creation drawer
  const openCreateDrawer = () => {
    setFormState(initialForm);
    setFormError(null);
    setDrawerMode('create');
  };

  // Open edit drawer
  const openEditDrawer = (item: AdminUserListItem) => {
    setSelectedUser(item);
    setFormState({
      nickname: item.nickname ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      password: '', // exclude password on edit
      avatar: item.avatar ?? '',
      gender: item.gender ?? '未知',
      birthday: item.birthday ?? '',
      region: item.region ?? '',
      status: item.status,
      role: item.role,
      source: item.source
    });
    setFormError(null);
    setDrawerMode('edit');
  };

  // Open details drawer
  const openDetailDrawer = (item: AdminUserListItem) => {
    setSelectedUser(item);
    setDrawerMode('detail');
  };

  // Handle Form submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nickname.trim()) {
      setFormError('昵称不能为空');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload: Record<string, any> = { ...formState };
      // Remove password if blank or editing
      if (drawerMode === 'edit' || !payload.password) {
        delete payload.password;
      }
      if (!payload.phone) delete payload.phone;
      if (!payload.email) delete payload.email;

      if (drawerMode === 'create') {
        await createUser(payload);
        setNotice(`成功创建新用户：「${formState.nickname}」`);
      } else if (drawerMode === 'edit' && selectedUser) {
        // delete password from payload on edit as updates to password use dedicated routes
        delete payload.password;
        await updateUser(selectedUser.legacyId, payload);
        setNotice(`用户信息「${formState.nickname}」已更新`);
      }

      setDrawerMode(null);
      setTimeout(() => setNotice(null), 3000);
      await loadData();
    } catch (err) {
      setFormError(normalizeErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">用户管理</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">管理时令 App 的用户账户与权限设置，支持查看活跃统计、新增/编辑档案及账号启用与注销。</p>
        </div>
        <Button onClick={openCreateDrawer} className="h-11 bg-[#7a8b6f] hover:bg-[#6d7f63] font-semibold flex items-center gap-1.5 shadow-sm rounded-xl">
          <Plus className="h-4.5 w-4.5" />
          新增用户
        </Button>
      </div>

      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl border border-[#d8e9d1] bg-[#edf5ea] px-5 py-4 text-sm text-[#5f7f59]">{notice}</div> : null}

      {/* Filter panel */}
      <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-6 shadow-xs">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#4d463f]">关键词检索</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79d91]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-11 w-full rounded-xl border border-[#e6ded2] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#7a8b6f] focus:ring-2 focus:ring-[#7a8b6f]/10"
                placeholder="昵称 / 手机号 / 邮箱"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#4d463f]">账号状态</span>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}
              className="h-11 w-full rounded-xl border border-[#e6ded2] bg-white px-4 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="all">全部状态</option>
              <option value="ACTIVE">正常</option>
              <option value="DISABLED">禁用</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#4d463f]">用户来源</span>
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              className="h-11 w-full rounded-xl border border-[#e6ded2] bg-white px-4 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="all">全部来源</option>
              <option value="USER">App 注册</option>
              <option value="ADMIN_CREATED">后台创建</option>
              <option value="BACKOFFICE">系统添加</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#4d463f]">用户角色</span>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="h-11 w-full rounded-xl border border-[#e6ded2] bg-white px-4 text-sm outline-none focus:border-[#7a8b6f]"
            >
              <option value="all">全部角色</option>
              <option value="USER">普通用户</option>
              <option value="ADMIN">管理员</option>
              <option value="OPERATOR">运营编辑</option>
            </select>
          </label>

          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <span className="text-xs font-semibold text-[#4d463f]">注册日期范围</span>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-[#e6ded2] bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]" />
              <span className="text-[#a79d91]">~</span>
              <input type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-[#e6ded2] bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 pt-4 border-t border-zinc-100">
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#4d463f]">家庭组关联</span>
            <select value={familyCount} onChange={(event) => { setFamilyCount(event.target.value as typeof familyCount); setPage(1); }} className="h-9 rounded-lg border border-[#e6ded2] bg-white px-3 text-xs outline-none focus:border-[#7a8b6f]">
              <option value="all">任意家庭</option>
              <option value="NONE">无关联家庭</option>
              <option value="ONE">已加入家庭</option>
              <option value="MULTIPLE">已创建家庭组</option>
            </select>
          </label>
          <div className="flex items-center gap-3">
            <Button onClick={handleSearch} className="h-10 px-6 bg-[#7a8b6f] hover:bg-[#6d7f63]">查询</Button>
            <Button variant="ghost" onClick={handleReset} className="h-10 px-6">重置</Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8c8c8c] font-semibold">{item.label}</span>
              <StatusTag label="状态" tone={item.tone as any} />
            </div>
            <div className="mt-3.5 text-2xl font-bold text-[#2f2f2f]">
              {item.value.toLocaleString('zh-CN')}
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1450px] w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-[#fffaf3] text-xs text-[#8c8c8c] border-b border-[#eadfce]">
              <tr>
                {['用户编码', '头像', '昵称', '手机号', '电子邮箱', '来源', '角色', '关联家庭', '收藏/浏览', '注册时间', '账号状态', '操作'].map((item) => (
                  <th key={item} className="border-b border-[#eadfce] px-4.5 py-4 font-semibold whitespace-nowrap">{item}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4.5 py-16 text-center text-[#8c8c8c]">加载中...</td>
                </tr>
              ) : data.list.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4.5 py-16 text-center text-[#8c8c8c]">暂无符合条件的用户数据</td>
                </tr>
              ) : (
                data.list.map((item) => (
                  <tr key={item.id} className="transition hover:bg-[#faf7f1]">
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5 font-mono text-xs text-[#2f2f2f]">{item.code}</td>
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5">
                      <ImagePreview src={item.avatar} alt={item.nickname ?? item.code} className="h-9 w-9 rounded-full object-cover border border-[#e9e2d6]" emptyText="—" />
                    </td>
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5 whitespace-nowrap">
                      <button type="button" onClick={() => openDetailDrawer(item)} className="font-bold text-[#2f2f2f] hover:text-[#7a8b6f] hover:underline">
                        {item.nickname ?? '未设置昵称'}
                      </button>
                    </td>
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5 text-zinc-600 font-mono">{formatPhone(item.phone)}</td>
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5 text-zinc-500 font-mono truncate max-w-[160px]" title={item.email ?? ''}>{item.email || '—'}</td>
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-50 border border-zinc-150 text-zinc-600">
                        {sourceLabel[item.source] || item.source}
                      </span>
                    </td>
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5 text-sm text-zinc-600">
                      {roleLabel[item.role] || item.role}
                    </td>
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5 text-xs text-zinc-500">
                      加入:{item.joinedFamilyCount} | 拥有:{item.createdFamilyCount}
                    </td>
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5 text-xs text-zinc-500">
                      收藏:{item.favoriteCount} | 历史:{item.recentViewCount}
                    </td>
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5 text-zinc-400 text-xs">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5">
                      <StatusTag label={statusLabel[item.status]} tone={item.status === 'ACTIVE' ? 'green' : 'red'} />
                    </td>
                    <td className="border-b border-[#f0e8dc] px-4.5 py-3.5">
                      <div className="flex items-center gap-3 text-sm">
                        <button type="button" className="font-bold text-[#7a8b6f] hover:underline" onClick={() => openDetailDrawer(item)}>详情</button>
                        <button type="button" className="font-bold text-zinc-600 hover:underline" onClick={() => openEditDrawer(item)}>编辑</button>
                        <button type="button" className={item.status === 'ACTIVE' ? 'font-bold text-red-500 hover:underline' : 'font-bold text-emerald-600 hover:underline'} onClick={() => void handleToggleStatus(item)}>
                          {item.status === 'ACTIVE' ? '禁用' : '启用'}
                        </button>
                        <button type="button" className="font-bold text-red-700 hover:underline" onClick={() => openDeleteModal(item)}>注销</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e8dc] px-5 py-4 text-sm text-[#8c8c8c]">
          <span>共 {data.total.toLocaleString('zh-CN')} 条记录</span>
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-10 rounded-xl border border-[#e6ded2] bg-white px-3 text-xs outline-none">
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
              <option value={50}>50 条/页</option>
            </select>
            <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button>
            <span className="bg-[#7a8b6f] text-white font-medium px-3 py-1.5 rounded-lg text-xs">第 {data.page} / {totalPages} 页</span>
            <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>下一页</Button>
          </div>
        </div>
      </div>

      {/* Drawer: Add / Edit User */}
      <Drawer
        title={drawerMode === 'create' ? '新增用户' : '编辑用户'}
        open={drawerMode === 'create' || drawerMode === 'edit'}
        onClose={() => setDrawerMode(null)}
        widthClassName="max-w-xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
              {formError}
            </div>
          ) : null}

          {/* Avatar Upload */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#4d463f]">用户头像</span>
            <ImageEditorUploader
              title="用户头像"
              max={1}
              coverUrl={formState.avatar || null}
              images={[]}
              onCoverChange={(url) => setFormState({ ...formState, avatar: url || '' })}
              onImagesChange={() => {}}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#4d463f]">用户昵称 *</span>
            <Input
              value={formState.nickname}
              onChange={(e) => setFormState({ ...formState, nickname: e.target.value })}
              placeholder="请输入昵称"
              required
              className="h-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#4d463f]">手机号码</span>
              <Input
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                placeholder="11位手机号"
                type="tel"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#4d463f]">电子邮箱</span>
              <Input
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                placeholder="邮箱地址"
                type="email"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          {drawerMode === 'create' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#4d463f]">登录密码 (留空则默认为无)</span>
              <Input
                value={formState.password}
                onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                placeholder="不少于 6 位密码数字/字母"
                type="password"
                className="h-10 rounded-xl"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#4d463f]">用户性别</span>
              <select
                value={formState.gender}
                onChange={(e) => setFormState({ ...formState, gender: e.target.value })}
                className="h-10 rounded-xl border border-[#e6ded2] bg-white px-3 text-sm outline-none"
              >
                <option value="未知">未知/保密</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#4d463f]">生日时间</span>
              <Input
                value={formState.birthday}
                onChange={(e) => setFormState({ ...formState, birthday: e.target.value })}
                type="date"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#4d463f]">地区/城市</span>
            <Input
              value={formState.region}
              onChange={(e) => setFormState({ ...formState, region: e.target.value })}
              placeholder="例如：北京 朝阳"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#4d463f]">账号角色</span>
              <select
                value={formState.role}
                onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                className="h-10 rounded-xl border border-[#e6ded2] bg-white px-3 text-sm outline-none"
              >
                <option value="USER">普通用户 (USER)</option>
                <option value="ADMIN">管理员 (ADMIN)</option>
                <option value="OPERATOR">运营编辑 (OPERATOR)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#4d463f]">账号状态</span>
              <select
                value={formState.status}
                onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                className="h-10 rounded-xl border border-[#e6ded2] bg-white px-3 text-sm outline-none"
              >
                <option value="ACTIVE">启用 (ACTIVE)</option>
                <option value="DISABLED">禁用 (DISABLED)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-zinc-150">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#7a8b6f] hover:bg-[#6d7f63] h-11 rounded-xl text-white font-semibold"
            >
              {saving ? '保存中...' : '确认保存'}
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setDrawerMode(null)}
              className="px-6 h-11"
            >
              取消
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Drawer: Detailed Profile */}
      <Drawer
        title="用户详细档案"
        open={drawerMode === 'detail'}
        onClose={() => setDrawerMode(null)}
        widthClassName="max-w-xl"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-5">
              <ImagePreview src={selectedUser.avatar} alt={selectedUser.nickname ?? selectedUser.code} className="h-16 w-16 rounded-full border border-[#e9e2d6] object-cover" />
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{selectedUser.nickname ?? '未设置昵称'}</h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">{selectedUser.code}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-50 border border-zinc-150 text-zinc-600">
                    {sourceLabel[selectedUser.source] || selectedUser.source}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-50 border border-zinc-150 text-zinc-600">
                    {roleLabel[selectedUser.role] || selectedUser.role}
                  </span>
                  <StatusTag label={statusLabel[selectedUser.status]} tone={selectedUser.status === 'ACTIVE' ? 'green' : 'red'} />
                </div>
              </div>
            </div>

            {/* Basic Info Details */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400">基本资料</span>
              <div className="rounded-2xl border border-zinc-150 bg-[#fbfbfa] p-4.5 space-y-3 text-sm">
                {[
                  ['手机号码', selectedUser.phone || '未绑定'],
                  ['电子邮箱', selectedUser.email || '未绑定'],
                  ['性别', selectedUser.gender || '保密'],
                  ['生日时间', selectedUser.birthday || '未设置'],
                  ['所在地区', selectedUser.region || '未设置']
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-1">
                    <span className="text-[#8c8c8c]">{label}</span>
                    <span className="font-semibold text-zinc-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400">互动指标与家庭关系</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-150 bg-[#fbfbfa] p-4 text-center">
                  <span className="text-xs text-[#8c8c8c] block">创建家庭组</span>
                  <span className="text-xl font-bold text-zinc-800 block mt-1">{selectedUser.createdFamilyCount} 个</span>
                </div>
                <div className="rounded-2xl border border-zinc-150 bg-[#fbfbfa] p-4 text-center">
                  <span className="text-xs text-[#8c8c8c] block">加入家庭数</span>
                  <span className="text-xl font-bold text-zinc-800 block mt-1">{selectedUser.joinedFamilyCount} / 8</span>
                </div>
                <div className="rounded-2xl border border-zinc-150 bg-[#fbfbfa] p-4 text-center">
                  <span className="text-xs text-[#8c8c8c] block">收藏菜谱数</span>
                  <span className="text-xl font-bold text-zinc-800 block mt-1">{selectedUser.favoriteCount} 篇</span>
                </div>
                <div className="rounded-2xl border border-zinc-150 bg-[#fbfbfa] p-4 text-center">
                  <span className="text-xs text-[#8c8c8c] block">浏览历史数</span>
                  <span className="text-xl font-bold text-zinc-800 block mt-1">{selectedUser.recentViewCount} 条</span>
                </div>
                <div className="rounded-2xl border border-zinc-150 bg-[#fbfbfa] p-4 text-center">
                  <span className="text-xs text-[#8c8c8c] block">菜谱投稿</span>
                  <span className="text-xl font-bold text-zinc-800 block mt-1">{selectedUser.recipeCount} 篇</span>
                </div>
                <div className="rounded-2xl border border-zinc-150 bg-[#fbfbfa] p-4 text-center">
                  <span className="text-xs text-[#8c8c8c] block">动态发布/晒菜</span>
                  <span className="text-xl font-bold text-zinc-800 block mt-1">{selectedUser.postCount ?? 0} 条</span>
                </div>
              </div>
            </div>

            {/* Time Metrics */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400">时间日志</span>
              <div className="rounded-2xl border border-zinc-150 bg-[#fbfbfa] p-4.5 space-y-3 text-sm">
                {[
                  ['注册时间', formatDateTime(selectedUser.createdAt)],
                  ['最近活跃', formatDateTime(selectedUser.lastActiveAt)],
                  ['最近登录', formatDateTime(selectedUser.lastLoginAt)]
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-1">
                    <span className="text-[#8c8c8c]">{label}</span>
                    <span className="font-semibold text-zinc-800 text-xs font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-150">
              <Button
                className="flex-1 bg-[#7a8b6f] hover:bg-[#6d7f63] h-11"
                onClick={() => {
                  setDrawerMode(null);
                  openEditDrawer(selectedUser);
                }}
              >
                ✏️ 编辑该用户档案
              </Button>
              <Button
                variant="ghost"
                className="px-6 h-11"
                onClick={() => setDrawerMode(null)}
              >
                关闭
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal: Delete/Deactivate Confirmation */}
      <Modal
        title="安全警告：确认注销用户账号"
        open={deleteModalOpen}
        onClose={closeDeleteModal}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800 space-y-2">
            <p className="font-semibold text-red-900">⚠️ 您正在执行账号注销操作：</p>
            <p>1. 此操作为**软注销**，用户将不能正常使用该账号登录 App。</p>
            <p>2. 用户拥有的家庭组、历史投稿及收藏数据将被保留在系统，但用户将无法再访问。</p>
          </div>

          {deleteError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700 font-semibold font-mono">
              {deleteError}
            </div>
          ) : null}

          {userToDelete && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#4d463f]">
                为了确认安全，请输入用户的昵称或编码 
                <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-red-600 font-bold ml-1">
                  {userToDelete.nickname || userToDelete.code}
                </span>
              </span>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="在此输入以解锁确认按钮"
                className="h-10 rounded-xl"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <Button variant="ghost" onClick={closeDeleteModal}>
              取消
            </Button>
            <Button
              variant="danger"
              disabled={
                saving ||
                !userToDelete ||
                deleteConfirmText !== (userToDelete.nickname || userToDelete.code)
              }
              onClick={handleConfirmDelete}
            >
              {saving ? '处理中...' : '确认注销'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Status Toggle Confirmation */}
      <Modal
        title={`确认${userToToggle?.status === 'ACTIVE' ? '禁用' : '启用'}用户账号`}
        open={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setUserToToggle(null);
          setToggleError(null);
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            您即将**{userToToggle?.status === 'ACTIVE' ? '禁用' : '启用'}**用户「
            <span className="font-semibold text-zinc-900">{userToToggle?.nickname ?? userToToggle?.code}</span>
            」的账号。
          </p>
          <p className="text-xs text-zinc-400">
            {userToToggle?.status === 'ACTIVE'
              ? '禁用后，该用户将无法通过 App 进行登录或提交数据，直至账号被重新启用。'
              : '启用后，该用户将恢复 App 的全部正常使用功能。'}
          </p>

          {toggleError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700 font-semibold font-mono">
              {toggleError}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <Button
              variant="ghost"
              onClick={() => {
                setStatusModalOpen(false);
                setUserToToggle(null);
                setToggleError(null);
              }}
            >
              取消
            </Button>
            <Button
              className={userToToggle?.status === 'ACTIVE' ? 'bg-red-500 hover:bg-red-600 text-white font-semibold' : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'}
              disabled={saving}
              onClick={async () => {
                if (!userToToggle) return;
                setSaving(true);
                setToggleError(null);
                const nextStatus = userToToggle.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
                const actionName = nextStatus === 'DISABLED' ? '禁用' : '启用';
                try {
                  await setUserStatus(userToToggle.legacyId, nextStatus);
                  setNotice(`用户「${userToToggle.nickname ?? userToToggle.code}」已${actionName}`);
                  setTimeout(() => setNotice(null), 3000);
                  setStatusModalOpen(false);
                  setUserToToggle(null);
                  await loadData();
                } catch (err) {
                  setToggleError(normalizeErrorMessage(err));
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? '处理中...' : '确认'}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
