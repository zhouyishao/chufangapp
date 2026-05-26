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

type RoleStatus = 'ACTIVE' | 'DISABLED';

type RoleItem = {
  id: number;
  name: string;
  description: string;
  adminCount: number;
  permissionCount: number;
  status: RoleStatus;
  updatedAt: string;
};

const initialRoles: RoleItem[] = [
  { id: 1, name: '超级管理员', description: '拥有所有菜单和按钮权限', adminCount: 1, permissionCount: 98, status: 'ACTIVE', updatedAt: '2026-05-25 09:20' },
  { id: 2, name: '内容运营', description: '管理内容、首页运营、文件和评论', adminCount: 3, permissionCount: 46, status: 'ACTIVE', updatedAt: '2026-05-24 17:45' },
  { id: 3, name: '审核员', description: '处理投稿、评论和举报审核', adminCount: 2, permissionCount: 18, status: 'ACTIVE', updatedAt: '2026-05-23 11:08' }
];

const emptyDraft: Omit<RoleItem, 'id' | 'adminCount' | 'permissionCount' | 'updatedAt'> = {
  name: '',
  description: '',
  status: 'ACTIVE'
};

const permissionGroups = [
  { title: '内容管理', children: ['菜谱查看', '菜谱编辑', '食材管理', '分类标签'] },
  { title: '运营配置', children: ['首页运营', 'Banner 管理', '推荐位管理', '搜索运营'] },
  { title: '系统能力', children: ['管理员管理', '角色权限', '操作日志', '基础配置'] }
];

export const RolesPage = () => {
  const [sourceItems, setSourceItems] = useState<RoleItem[]>(initialRoles);
  const [items, setItems] = useState<RoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | RoleStatus>('all');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<RoleItem | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [deleting, setDeleting] = useState<RoleItem | null>(null);

  const filteredItems = useMemo(() => {
    return sourceItems.filter((item) => {
      const matchKeyword = q.trim() ? item.name.includes(q.trim()) || item.description.includes(q.trim()) : true;
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

  const openEdit = (item: RoleItem) => {
    setEditing(item);
    setDraft({ name: item.name, description: item.description, status: item.status });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    if (editing) {
      setSourceItems((prev) => prev.map((item) => (item.id === editing.id ? { ...item, ...draft, updatedAt: now } : item)));
      setNotice('角色已保存');
    } else {
      setSourceItems((prev) => [{ id: Math.max(...prev.map((item) => item.id)) + 1, ...draft, adminCount: 0, permissionCount: 0, updatedAt: now }, ...prev]);
      setNotice('角色已新增');
    }
    setDrawerOpen(false);
  };

  const handleDelete = () => {
    if (!deleting) return;
    setSourceItems((prev) => prev.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    setNotice('角色已删除');
  };

  const columns: DataTableColumn<RoleItem>[] = [
    { key: 'id', title: 'ID', render: (item) => item.id },
    { key: 'name', title: '角色名称', render: (item) => <span className="font-medium text-[#2f2f2f]">{item.name}</span> },
    { key: 'description', title: '说明', render: (item) => item.description },
    { key: 'adminCount', title: '管理员数', render: (item) => item.adminCount },
    { key: 'permissionCount', title: '权限数', render: (item) => item.permissionCount },
    { key: 'status', title: '状态', render: (item) => <StatusTag label={item.status === 'ACTIVE' ? '启用' : '禁用'} tone={item.status === 'ACTIVE' ? 'green' : 'gray'} /> },
    {
      key: 'actions',
      title: '操作',
      render: (item) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => openEdit(item)}>编辑</Button>
          <Button variant="ghost" onClick={() => setNotice(`权限树已选择：${item.name}`)}>配置权限</Button>
          <Button variant="danger" onClick={() => setDeleting(item)}>删除</Button>
        </div>
      )
    }
  ];

  return (
    <section className="space-y-6">
      <PageHeader title="角色权限" description="配置后台角色、菜单权限、按钮权限和权限树，后续接入真实 RBAC 接口。" actions={<Button onClick={openCreate}>新增角色</Button>} />

      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <FilterPanel>
            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
              <Input value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="搜索角色名称..." />
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
          <DataTable columns={columns} data={items} loading={loading} rowKey={(item) => item.id} emptyTitle="暂无角色" />
        </div>

        <div className="rounded-3xl border border-[#e9e2d6] bg-[#fffdfc] p-5">
          <h2 className="text-lg font-semibold text-[#2f2f2f]">权限树占位</h2>
          <p className="mt-2 text-sm text-[#8c8c8c]">前端先展示菜单与按钮权限层级，后续接 RBAC 权限接口。</p>
          <div className="mt-5 space-y-4">
            {permissionGroups.map((group) => (
              <div key={group.title} className="rounded-2xl bg-[#f5f1ea] p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-[#2f2f2f]">
                  <input type="checkbox" defaultChecked />
                  {group.title}
                </label>
                <div className="mt-3 space-y-2 pl-6">
                  {group.children.map((child) => (
                    <label key={child} className="flex items-center gap-2 text-sm text-[#8c8c8c]">
                      <input type="checkbox" defaultChecked />
                      {child}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Drawer title={editing ? '编辑角色' : '新增角色'} open={drawerOpen} onClose={() => setDrawerOpen(false)} widthClassName="max-w-xl">
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-xs text-zinc-600">角色名称</div>
            <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </div>
          <div>
            <div className="mb-1 text-xs text-zinc-600">角色说明</div>
            <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={draft.status === 'ACTIVE'} onChange={(event) => setDraft({ ...draft, status: event.target.checked ? 'ACTIVE' : 'DISABLED' })} />
            启用角色
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button disabled={!draft.name.trim()} onClick={handleSave}>保存</Button>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        title="删除角色"
        open={!!deleting}
        description={deleting ? `确认删除角色「${deleting.name}」？删除前应先迁移该角色下的管理员。` : null}
        confirmText="删除"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
};
