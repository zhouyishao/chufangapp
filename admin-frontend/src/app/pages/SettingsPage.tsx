import { useEffect, useMemo, useState } from 'react';

import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { FilterPanel } from '../components/FilterPanel';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import { resolveMockList } from '../mockApi';

type AdminStatus = 'ACTIVE' | 'DISABLED';

type AdminItem = {
  id: number;
  username: string;
  nickname: string;
  role: string;
  status: AdminStatus;
  lastLoginAt: string;
  createdAt: string;
};

const initialAdmins: AdminItem[] = [
  { id: 1, username: 'admin', nickname: '超级管理员', role: '超级管理员', status: 'ACTIVE', lastLoginAt: '2026-05-25 09:55', createdAt: '2026-05-01 10:00' },
  { id: 2, username: 'editor', nickname: '内容运营', role: '内容运营', status: 'ACTIVE', lastLoginAt: '2026-05-24 18:12', createdAt: '2026-05-10 15:22' },
  { id: 3, username: 'auditor', nickname: '审核员', role: '审核员', status: 'DISABLED', lastLoginAt: '2026-05-20 11:30', createdAt: '2026-05-11 08:10' }
];

const emptyDraft: Omit<AdminItem, 'id' | 'lastLoginAt' | 'createdAt'> = {
  username: '',
  nickname: '',
  role: '内容运营',
  status: 'ACTIVE'
};

export const SettingsPage = () => {
  const [sourceItems, setSourceItems] = useState<AdminItem[]>(initialAdmins);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | AdminStatus>('all');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminItem | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [deleting, setDeleting] = useState<AdminItem | null>(null);

  const filteredItems = useMemo(() => {
    return sourceItems.filter((item) => {
      const matchKeyword = q.trim() ? item.username.includes(q.trim()) || item.nickname.includes(q.trim()) : true;
      const matchStatus = status === 'all' ? true : item.status === status;
      return matchKeyword && matchStatus;
    });
  }, [q, sourceItems, status]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const response = await resolveMockList(filteredItems, page, pageSize);
      if (!alive) return;
      setItems(response.data.list);
      setTotal(response.data.pagination.total);
      setLoading(false);
    };
    void load();
    return () => {
      alive = false;
    };
  }, [filteredItems, page, pageSize]);

  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setDrawerOpen(true);
  };

  const openEdit = (item: AdminItem) => {
    setEditing(item);
    setDraft({ username: item.username, nickname: item.nickname, role: item.role, status: item.status });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    if (editing) {
      setSourceItems((prev) => prev.map((item) => (item.id === editing.id ? { ...item, ...draft } : item)));
      setNotice('管理员已保存');
    } else {
      setSourceItems((prev) => [{ id: Math.max(...prev.map((item) => item.id)) + 1, ...draft, lastLoginAt: '-', createdAt: now }, ...prev]);
      setNotice('管理员已新增');
    }
    setDrawerOpen(false);
  };

  const handleToggleStatus = (item: AdminItem) => {
    setSourceItems((prev) => prev.map((record) => (record.id === item.id ? { ...record, status: record.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } : record)));
    setNotice(item.status === 'ACTIVE' ? '管理员已禁用' : '管理员已启用');
  };

  const handleDelete = () => {
    if (!deleting) return;
    setSourceItems((prev) => prev.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    setNotice('管理员已删除');
  };

  const columns: DataTableColumn<AdminItem>[] = [
    { key: 'id', title: 'ID', render: (item) => item.id },
    { key: 'username', title: '账号', render: (item) => <span className="font-medium text-[#2f2f2f]">{item.username}</span> },
    { key: 'nickname', title: '昵称', render: (item) => item.nickname },
    { key: 'role', title: '角色', render: (item) => item.role },
    { key: 'status', title: '状态', render: (item) => <StatusTag label={item.status === 'ACTIVE' ? '启用' : '禁用'} tone={item.status === 'ACTIVE' ? 'green' : 'gray'} /> },
    { key: 'lastLoginAt', title: '最近登录', render: (item) => item.lastLoginAt },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => openEdit(item)}>编辑</Button>
          <Button variant="ghost" onClick={() => handleToggleStatus(item)}>{item.status === 'ACTIVE' ? '禁用' : '启用'}</Button>
          <Button variant="danger" onClick={() => setDeleting(item)}>删除</Button>
        </div>
      )
    }
  ];

  return (
    <section className="space-y-6">
      <PageHeader title="管理员管理" description="维护后台管理员账号、角色归属、启用状态和登录记录。" actions={<Button onClick={openCreate}>新增管理员</Button>} />

      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {[
          { label: '管理员', value: sourceItems.length },
          { label: '启用账号', value: sourceItems.filter((item) => item.status === 'ACTIVE').length },
          { label: '角色数', value: 3 },
          { label: '今日操作', value: 28 }
        ].map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
            <div className="text-sm text-[#8c8c8c]">{metric.label}</div>
            <div className="mt-3 text-3xl font-semibold text-[#2f2f2f]">{metric.value}</div>
          </div>
        ))}
      </div>

      <FilterPanel>
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          <Input value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="搜索账号 / 昵称..." />
          <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as typeof status); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value="all">全部状态</option>
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8c8c8c]">
          <select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value={10}>10 / 页</option>
            <option value={20}>20 / 页</option>
          </select>
          <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button>
          <span>第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页</span>
          <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((value) => value + 1)}>下一页</Button>
        </div>
      </FilterPanel>

      <DataTable columns={columns} data={items} loading={loading} rowKey={(item) => item.id} emptyTitle="暂无管理员" />

      <Drawer title={editing ? '编辑管理员' : '新增管理员'} open={drawerOpen} onClose={() => setDrawerOpen(false)} widthClassName="max-w-xl">
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-xs text-zinc-600">账号</div>
            <Input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} />
          </div>
          <div>
            <div className="mb-1 text-xs text-zinc-600">昵称</div>
            <Input value={draft.nickname} onChange={(event) => setDraft({ ...draft, nickname: event.target.value })} />
          </div>
          <div>
            <div className="mb-1 text-xs text-zinc-600">角色</div>
            <select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
              <option value="超级管理员">超级管理员</option>
              <option value="内容运营">内容运营</option>
              <option value="审核员">审核员</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={draft.status === 'ACTIVE'} onChange={(event) => setDraft({ ...draft, status: event.target.checked ? 'ACTIVE' : 'DISABLED' })} />
            启用账号
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button disabled={!draft.username.trim()} onClick={handleSave}>保存</Button>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        title="删除管理员"
        open={!!deleting}
        description={deleting ? `确认删除管理员「${deleting.nickname}」？删除后该账号无法登录后台。` : null}
        confirmText="删除"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
};
