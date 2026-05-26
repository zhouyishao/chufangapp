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

type TagStatus = 'ACTIVE' | 'DISABLED';

type TagItem = {
  id: number;
  name: string;
  group: '口味' | '场景' | '人群' | '运营';
  contentCount: number;
  sort: number;
  status: TagStatus;
  updatedAt: string;
};

const initialTags: TagItem[] = [
  { id: 1, name: '快手菜', group: '场景', contentCount: 128, sort: 1, status: 'ACTIVE', updatedAt: '2026-05-25 09:12' },
  { id: 2, name: '清淡', group: '口味', contentCount: 96, sort: 2, status: 'ACTIVE', updatedAt: '2026-05-24 18:20' },
  { id: 3, name: '儿童友好', group: '人群', contentCount: 42, sort: 6, status: 'ACTIVE', updatedAt: '2026-05-23 16:08' },
  { id: 4, name: '首页精选', group: '运营', contentCount: 18, sort: 9, status: 'DISABLED', updatedAt: '2026-05-22 11:30' }
];

const emptyDraft: Omit<TagItem, 'id' | 'contentCount' | 'updatedAt'> = {
  name: '',
  group: '场景',
  sort: 0,
  status: 'ACTIVE'
};

export const TagsPage = () => {
  const [sourceItems, setSourceItems] = useState<TagItem[]>(initialTags);
  const [items, setItems] = useState<TagItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<'all' | TagItem['group']>('all');
  const [status, setStatus] = useState<'all' | TagStatus>('all');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [deleting, setDeleting] = useState<TagItem | null>(null);

  const filteredItems = useMemo(() => {
    return sourceItems.filter((item) => {
      const matchKeyword = q.trim() ? item.name.includes(q.trim()) : true;
      const matchGroup = group === 'all' ? true : item.group === group;
      const matchStatus = status === 'all' ? true : item.status === status;
      return matchKeyword && matchGroup && matchStatus;
    });
  }, [group, q, sourceItems, status]);

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

  const openEdit = (item: TagItem) => {
    setEditing(item);
    setDraft({ name: item.name, group: item.group, sort: item.sort, status: item.status });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    if (editing) {
      setSourceItems((prev) => prev.map((item) => (item.id === editing.id ? { ...item, ...draft, updatedAt: now } : item)));
      setNotice('标签已保存');
    } else {
      setSourceItems((prev) => [{ id: Math.max(...prev.map((item) => item.id)) + 1, ...draft, contentCount: 0, updatedAt: now }, ...prev]);
      setNotice('标签已新增');
    }
    setDrawerOpen(false);
  };

  const handleToggleStatus = (item: TagItem) => {
    setSourceItems((prev) =>
      prev.map((record) =>
        record.id === item.id ? { ...record, status: record.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE', updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) } : record
      )
    );
    setNotice(item.status === 'ACTIVE' ? '标签已禁用' : '标签已启用');
  };

  const handleDelete = () => {
    if (!deleting) return;
    setSourceItems((prev) => prev.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    setNotice('标签已删除');
  };

  const columns: DataTableColumn<TagItem>[] = [
    { key: 'id', title: 'ID', render: (item) => item.id },
    { key: 'name', title: '标签名称', render: (item) => <span className="font-medium text-[#2f2f2f]">{item.name}</span> },
    { key: 'group', title: '标签分组', render: (item) => item.group },
    { key: 'contentCount', title: '关联内容', render: (item) => `${item.contentCount} 条` },
    { key: 'sort', title: '排序', render: (item) => item.sort },
    { key: 'status', title: '状态', render: (item) => <StatusTag label={item.status === 'ACTIVE' ? '启用' : '禁用'} tone={item.status === 'ACTIVE' ? 'green' : 'gray'} /> },
    { key: 'updatedAt', title: '更新时间', render: (item) => item.updatedAt },
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
      <PageHeader
        title="标签管理"
        description="维护内容标签、场景标签、口味标签和运营标签，支持启用、禁用、排序和删除。"
        actions={<Button onClick={openCreate}>新增标签</Button>}
      />

      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      <FilterPanel>
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          <Input value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="搜索标签名称..." />
          <select value={group} onChange={(event) => { setPage(1); setGroup(event.target.value as typeof group); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm">
            <option value="all">全部分组</option>
            <option value="口味">口味</option>
            <option value="场景">场景</option>
            <option value="人群">人群</option>
            <option value="运营">运营</option>
          </select>
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

      <DataTable columns={columns} data={items} loading={loading} rowKey={(item) => item.id} emptyTitle="暂无标签" />

      <Drawer title={editing ? '编辑标签' : '新增标签'} open={drawerOpen} onClose={() => setDrawerOpen(false)} widthClassName="max-w-xl">
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-xs text-zinc-600">标签名称</div>
            <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </div>
          <div>
            <div className="mb-1 text-xs text-zinc-600">标签分组</div>
            <select value={draft.group} onChange={(event) => setDraft({ ...draft, group: event.target.value as TagItem['group'] })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm">
              <option value="口味">口味</option>
              <option value="场景">场景</option>
              <option value="人群">人群</option>
              <option value="运营">运营</option>
            </select>
          </div>
          <div>
            <div className="mb-1 text-xs text-zinc-600">排序</div>
            <Input type="number" value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: Number(event.target.value) })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={draft.status === 'ACTIVE'} onChange={(event) => setDraft({ ...draft, status: event.target.checked ? 'ACTIVE' : 'DISABLED' })} />
            启用标签
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button disabled={!draft.name.trim()} onClick={handleSave}>保存</Button>
          </div>
        </div>
      </Drawer>

      <ConfirmModal
        title="删除标签"
        open={!!deleting}
        description={deleting ? `确认删除「${deleting.name}」？删除后将不会在内容编辑器中展示。` : null}
        confirmText="删除"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
};
