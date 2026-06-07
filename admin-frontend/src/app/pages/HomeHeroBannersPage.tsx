import { useEffect, useMemo, useState } from 'react';

import {
  createHomeHeroBanner,
  deleteHomeHeroBanner,
  listHomeHeroBanners,
  updateHomeHeroBanner,
  updateHomeHeroBannerStatus,
  type HomeHeroBanner,
  type HomeHeroBannerPayload,
  type HomeHeroBannerStatus,
  type HomeHeroBannerTargetType
} from '../api';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { Drawer } from '../components/Drawer';
import { ImagePreview } from '../components/ImagePreview';
import { Input } from '../components/Input';
import { UploadImage } from '../components/UploadImage';

type Draft = {
  title: string;
  subtitle: string;
  buttonText: string;
  cover: string | null;
  targetType: HomeHeroBannerTargetType;
  targetId: string;
  link: string;
  sortOrder: number;
  status: HomeHeroBannerStatus;
  startAt: string;
  endAt: string;
};

const emptyDraft: Draft = {
  title: '',
  subtitle: '',
  buttonText: '',
  cover: null,
  targetType: 'NONE',
  targetId: '',
  link: '',
  sortOrder: 1,
  status: 'ENABLED',
  startAt: '',
  endAt: ''
};

const targetTypeOptions: { label: string; value: HomeHeroBannerTargetType }[] = [
  { label: '无跳转', value: 'NONE' },
  { label: '菜谱', value: 'RECIPE' },
  { label: '专题', value: 'TOPIC' },
  { label: '分类', value: 'CATEGORY' },
  { label: '食材', value: 'INGREDIENT' },
  { label: '菜单', value: 'MENU' },
  { label: '酒水', value: 'BEVERAGE' },
  { label: '链接', value: 'URL' }
];

const toDateTimeInput = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const toIsoOrNull = (value: string) => {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const compactString = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toDraft = (item: HomeHeroBanner): Draft => ({
  title: item.title,
  subtitle: item.subtitle ?? '',
  buttonText: item.buttonText ?? '',
  cover: item.cover,
  targetType: item.targetType,
  targetId: item.targetId ?? '',
  link: item.link ?? '',
  sortOrder: item.sortOrder,
  status: item.status,
  startAt: toDateTimeInput(item.startAt),
  endAt: toDateTimeInput(item.endAt)
});

const toPayload = (draft: Draft): HomeHeroBannerPayload => ({
  title: draft.title.trim(),
  subtitle: compactString(draft.subtitle),
  buttonText: compactString(draft.buttonText),
  cover: draft.cover ?? '',
  imageFocus: 'center',
  targetType: draft.targetType,
  targetId: compactString(draft.targetId),
  targetTitleSnapshot: null,
  link: compactString(draft.link),
  sortOrder: Number.isFinite(draft.sortOrder) ? draft.sortOrder : 0,
  status: draft.status,
  startAt: toIsoOrNull(draft.startAt),
  endAt: toIsoOrNull(draft.endAt),
  remark: null
});

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
};

export const HomeHeroBannersPage = () => {
  const [items, setItems] = useState<HomeHeroBanner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<HomeHeroBannerStatus | ''>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<HomeHeroBanner | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deleting, setDeleting] = useState<HomeHeroBanner | null>(null);

  const canSave = Boolean(draft.title.trim() && draft.cover);
  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listHomeHeroBanners({ page, pageSize, q, status: status || undefined });
      setItems(result.list);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [page, pageSize, q, status]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setDrawerOpen(true);
  };

  const openEdit = (item: HomeHeroBanner) => {
    setEditing(item);
    setDraft(toDraft(item));
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(draft);
      if (editing) {
        await updateHomeHeroBanner(editing.id, payload);
        setNotice('顶部轮播图已更新');
      } else {
        await createHomeHeroBanner(payload);
        setNotice('顶部轮播图已创建');
      }
      setDrawerOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: HomeHeroBanner) => {
    const nextStatus: HomeHeroBannerStatus = item.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    try {
      await updateHomeHeroBannerStatus(item.id, nextStatus);
      setNotice(nextStatus === 'ENABLED' ? '已启用' : '已停用');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '状态更新失败');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteHomeHeroBanner(deleting.id);
      setDeleting(null);
      setNotice('顶部轮播图已删除');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const columns = useMemo<DataTableColumn<HomeHeroBanner>[]>(() => [
    { key: 'cover', title: '封面图', render: (item) => <ImagePreview src={item.cover} alt={item.title} className="h-16 w-28 rounded-none" /> },
    { key: 'title', title: '标题', render: (item) => <div className="min-w-48 text-left"><div className="font-medium text-[#2f2f2f]">{item.title}</div><div className="mt-1 text-xs text-[#8c8c8c]">{item.subtitle ?? '-'}</div></div> },
    { key: 'target', title: '跳转', render: (item) => <div>{item.targetType}<div className="mt-1 text-xs text-[#8c8c8c]">{item.targetId ?? item.link ?? '-'}</div></div> },
    { key: 'sortOrder', title: '排序', render: (item) => item.sortOrder },
    { key: 'time', title: '生效时间', render: (item) => <div className="text-xs text-[#8c8c8c]"><div>{formatDateTime(item.startAt)}</div><div>{formatDateTime(item.endAt)}</div></div> },
    { key: 'status', title: '状态', render: (item) => <span className={['inline-flex rounded-full px-2 py-1 text-xs', item.status === 'ENABLED' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'].join(' ')}>{item.status === 'ENABLED' ? '启用' : '停用'}</span> },
    { key: 'actions', title: '操作', render: (item) => <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => openEdit(item)}>编辑</Button><Button variant="ghost" onClick={() => void toggleStatus(item)}>{item.status === 'ENABLED' ? '停用' : '启用'}</Button><Button variant="danger" onClick={() => setDeleting(item)}>删除</Button></div> }
  ], []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-[#2f2f2f]">首页顶部轮播图</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">配置 HOME_HERO_CAROUSEL，独立展示在搜索栏和顶部导航下方，不参与首页 4 个内容模块排序。</p>
        </div>
        <Button onClick={openCreate}>新增轮播图</Button>
      </div>

      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}

      <div className="rounded-2xl border border-[#e9e2d6] bg-[#fffdfc] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-2">
            <Input value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} placeholder="搜索标题..." />
            <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as HomeHeroBannerStatus | ''); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200">
              <option value="">全部状态</option>
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">停用</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200">
              {[10, 20, 50].map((value) => <option key={value} value={value}>{value} / 页</option>)}
            </select>
            <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button>
            <div className="text-sm text-zinc-600">第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页</div>
            <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((value) => value + 1)}>下一页</Button>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={items} loading={loading} error={error} rowKey={(item) => item.id} emptyTitle="暂无首页顶部轮播图" emptyDescription="新增启用后的 Banner 会展示在 C 端首页首屏 Hero Carousel。" />

      <Drawer title={editing ? '编辑顶部轮播图' : '新增顶部轮播图'} open={drawerOpen} onClose={() => setDrawerOpen(false)} widthClassName="max-w-3xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><div className="mb-1 text-xs text-[#8c8c8c]">标题</div><Input value={draft.title} maxLength={120} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div>
          <div><div className="mb-1 text-xs text-[#8c8c8c]">按钮文案</div><Input value={draft.buttonText} maxLength={32} placeholder="例如：查看菜谱" onChange={(event) => setDraft({ ...draft, buttonText: event.target.value })} /></div>
          <div className="md:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">副标题</div><Input value={draft.subtitle} maxLength={160} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} /></div>
          <div className="md:col-span-2"><UploadImage label="封面图" value={draft.cover} helperText="C 端按 393px 全屏宽、510px 高、cover 裁切展示，请上传适合竖向首屏裁切的图片。" onChange={(cover) => setDraft({ ...draft, cover })} /></div>
          <div><div className="mb-1 text-xs text-[#8c8c8c]">跳转类型</div><select value={draft.targetType} onChange={(event) => setDraft({ ...draft, targetType: event.target.value as HomeHeroBannerTargetType })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200">{targetTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          <div><div className="mb-1 text-xs text-[#8c8c8c]">跳转 ID</div><Input value={draft.targetId} placeholder="菜谱 / 专题 / 分类 ID" onChange={(event) => setDraft({ ...draft, targetId: event.target.value })} /></div>
          <div className="md:col-span-2"><div className="mb-1 text-xs text-[#8c8c8c]">跳转链接</div><Input value={draft.link} placeholder="/pages/recipes/index 或 https://..." onChange={(event) => setDraft({ ...draft, link: event.target.value })} /></div>
          <div><div className="mb-1 text-xs text-[#8c8c8c]">排序</div><Input type="number" value={draft.sortOrder} min={0} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })} /></div>
          <div><div className="mb-1 text-xs text-[#8c8c8c]">状态</div><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as HomeHeroBannerStatus })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"><option value="ACTIVE">启用</option><option value="DISABLED">停用</option></select></div>
          <div><div className="mb-1 text-xs text-[#8c8c8c]">开始时间</div><Input type="datetime-local" value={draft.startAt} onChange={(event) => setDraft({ ...draft, startAt: event.target.value })} /></div>
          <div><div className="mb-1 text-xs text-[#8c8c8c]">结束时间</div><Input type="datetime-local" value={draft.endAt} onChange={(event) => setDraft({ ...draft, endAt: event.target.value })} /></div>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setDrawerOpen(false)}>取消</Button><Button disabled={!canSave || saving} onClick={() => void handleSave()}>{saving ? '保存中...' : '保存'}</Button></div>
      </Drawer>

      <ConfirmModal title="确认删除顶部轮播图" open={!!deleting} onClose={() => setDeleting(null)} description={deleting ? `删除「${deleting.title}」后，C 端首页不会再展示该 Banner。` : null} confirmText="删除" danger onConfirm={handleDelete} />
    </div>
  );
};
