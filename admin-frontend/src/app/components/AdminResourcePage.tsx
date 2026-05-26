import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { createAdminResource, deleteAdminResource, listAdminResource, updateAdminResource } from '../api';
import type { AdminResourceItem, ResourceStatus } from '../types';
import { Button } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { Drawer } from './Drawer';
import { Input } from './Input';
import { UploadImage } from './UploadImage';

type FieldValue = string | number | boolean | null;

type FieldConfig = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'boolean' | 'select' | 'image';
  required?: boolean;
  options?: { label: string; value: string }[];
};

type ColumnConfig<T extends AdminResourceItem> = {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
};

type Props<T extends AdminResourceItem> = {
  title: string;
  description: string;
  resource: string;
  primaryLabel: string;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  defaults: Record<string, FieldValue>;
};

const stringifyCell = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (typeof value === 'object') return '-';
  return String(value);
};

const normalizeValue = (field: FieldConfig, value: FieldValue) => {
  if (field.type === 'number') return value === '' || value === null ? null : Number(value);
  if (field.type === 'boolean') return Boolean(value);
  if (field.type === 'image') return typeof value === 'string' && value.trim() ? value.trim() : null;
  return typeof value === 'string' && value.trim() === '' ? null : value;
};

export const AdminResourcePage = <T extends AdminResourceItem>({
  title,
  description,
  resource,
  primaryLabel,
  columns,
  fields,
  defaults
}: Props<T>) => {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ResourceStatus | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [draft, setDraft] = useState<Record<string, FieldValue>>(defaults);
  const [deleting, setDeleting] = useState<T | null>(null);

  const canSave = useMemo(() => fields.every((field) => !field.required || String(draft[field.key] ?? '').trim()), [draft, fields]);
  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listAdminResource<T>(resource, {
        page,
        pageSize,
        q: q.trim() || undefined,
        status: status || undefined
      });
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
  }, [page, pageSize, q, status, resource]);

  const openCreate = () => {
    setEditing(null);
    setDraft(defaults);
    setDrawerOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    const nextDraft = { ...defaults };
    fields.forEach((field) => {
      const value = item[field.key];
      nextDraft[field.key] = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null ? value : defaults[field.key];
    });
    setDraft(nextDraft);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!canSave) return;
    const payload = fields.reduce<Record<string, unknown>>((result, field) => {
      result[field.key] = normalizeValue(field, draft[field.key]);
      return result;
    }, {});
    try {
      if (editing) {
        await updateAdminResource<T>(resource, editing.id, payload);
        setNotice('编辑成功');
      } else {
        await createAdminResource<T>(resource, payload);
        setNotice('新增成功');
      }
      setDrawerOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteAdminResource<T>(resource, deleting.id);
      setDeleting(null);
      setNotice('删除成功');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-semibold">{title}</div>
          <div className="mt-1 text-sm text-zinc-500">{description}</div>
        </div>
        <Button onClick={openCreate}>新增{primaryLabel}</Button>
      </div>

      {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div> : null}

      <div className="rounded-2xl border border-zinc-100 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-2">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder={`搜索${primaryLabel}...`} />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ResourceStatus | '')}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="">全部状态</option>
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">禁用</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <select
              value={pageSize}
              onChange={(event) => {
                setPage(1);
                setPageSize(Number(event.target.value));
              }}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              {[10, 20, 50].map((value) => (
                <option key={value} value={value}>
                  {value} / 页
                </option>
              ))}
            </select>
            <Button variant="ghost" disabled={!canPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              上一页
            </Button>
            <div className="text-sm text-zinc-600">
              第 {page} 页 / 共 {Math.max(1, Math.ceil(total / pageSize))} 页
            </div>
            <Button variant="ghost" disabled={!canNext || loading} onClick={() => setPage((value) => value + 1)}>
              下一页
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-100 px-4 py-3 text-xs text-zinc-500">
          <div className="col-span-1">ID</div>
          {columns.map((column) => (
            <div key={String(column.key)} className="col-span-2">
              {column.label}
            </div>
          ))}
          <div className="col-span-2">状态</div>
          <div className="col-span-3 text-right">操作</div>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-zinc-500">加载中...</div>
        ) : items.length ? (
          items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-zinc-50">
              <div className="col-span-1 text-zinc-500">{item.id}</div>
              {columns.map((column) => (
                <div key={String(column.key)} className="col-span-2 truncate">
                  {column.render ? column.render(item) : stringifyCell(item[column.key])}
                </div>
              ))}
              <div className="col-span-2">
                <span className={['inline-flex rounded-full px-2 py-0.5 text-xs', item.status === 'DISABLED' ? 'bg-zinc-100 text-zinc-600' : 'bg-emerald-50 text-emerald-700'].join(' ')}>
                  {item.status === 'DISABLED' ? '禁用' : '启用'}
                </span>
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => openEdit(item)}>
                  编辑
                </Button>
                <Button variant="danger" onClick={() => setDeleting(item)}>
                  删除
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-zinc-500">暂无数据。</div>
        )}
      </div>

      <Drawer title={editing ? `编辑${primaryLabel}` : `新增${primaryLabel}`} open={drawerOpen} onClose={() => setDrawerOpen(false)} widthClassName="max-w-2xl">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.type === 'textarea' || field.type === 'image' ? 'md:col-span-2' : undefined}>
              {field.type === 'image' ? null : <div className="mb-1 text-xs text-zinc-600">{field.label}</div>}
              {field.type === 'image' ? (
                <UploadImage
                  label={field.label}
                  value={typeof draft[field.key] === 'string' ? String(draft[field.key]) : null}
                  onChange={(url) => setDraft({ ...draft, [field.key]: url })}
                />
              ) : field.type === 'textarea' ? (
                <textarea
                  value={String(draft[field.key] ?? '')}
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                  className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                />
              ) : field.type === 'boolean' ? (
                <label className="flex h-10 items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" checked={Boolean(draft[field.key])} onChange={(event) => setDraft({ ...draft, [field.key]: event.target.checked })} />
                  是
                </label>
              ) : field.type === 'select' ? (
                <select
                  value={String(draft[field.key] ?? '')}
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={draft[field.key] === null ? '' : String(draft[field.key] ?? '')}
                  onChange={(event) => setDraft({ ...draft, [field.key]: field.type === 'number' ? Number(event.target.value) : event.target.value })}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
            取消
          </Button>
          <Button disabled={!canSave} onClick={() => void handleSave()}>
            保存
          </Button>
        </div>
      </Drawer>

      <ConfirmModal
        title="确认删除"
        open={!!deleting}
        onClose={() => setDeleting(null)}
        description={deleting ? `删除 ${primaryLabel} #${deleting.id} 后将无法恢复。` : null}
        confirmText="删除"
        danger
        onConfirm={handleDelete}
      />
    </div>
  );
};
