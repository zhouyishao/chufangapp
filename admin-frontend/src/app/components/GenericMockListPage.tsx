import { useState, useMemo, type ReactNode } from 'react';
import { Button } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { Drawer } from './Drawer';
import { Input } from './Input';
import { StatusTag } from './StatusTag';

export interface ColumnConfig<T> {
  key: string;
  title: string;
  render?: (item: T) => ReactNode;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'input';
  options?: { label: string; value: string }[];
}

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: { label: string; value: string }[];
}

export interface GenericMockListPageProps<T> {
  title: string;
  description: string;
  primaryLabel: string;
  initialItems: T[];
  columns: ColumnConfig<T>[];
  filters?: FilterConfig[];
  fields?: FieldConfig[];
  defaultNewItem?: Partial<T>;
  searchPlaceholder?: string;
  searchField?: keyof T;
  stats?: {
    icon: string;
    title: string;
    value: string | number;
    suffix?: string;
    tone?: 'green' | 'orange' | 'blue' | 'red';
  }[];
}

export const GenericMockListPage = <T extends { id: string | number; status?: string; [key: string]: any }>({
  title,
  description,
  primaryLabel,
  initialItems,
  columns,
  filters = [],
  fields = [],
  defaultNewItem = {},
  searchPlaceholder = '请输入搜索内容',
  searchField = 'name' as keyof T,
  stats = []
}: GenericMockListPageProps<T>) => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    filters.forEach((f) => {
      init[f.key] = '';
    });
    return init;
  });

  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<T> | null>(null);
  const [deletingItem, setDeletingItem] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Apply actual filtering locally
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search query
      if (appliedSearchQuery) {
        const val = String(item[searchField] || '').toLowerCase();
        if (!val.includes(appliedSearchQuery.toLowerCase())) {
          return false;
        }
      }
      // Dropdown filters
      for (const [key, filterVal] of Object.entries(filterValues)) {
        if (filterVal) {
          const itemVal = String(item[key] || '');
          if (itemVal !== filterVal) {
            return false;
          }
        }
      }
      return true;
    });
  }, [items, appliedSearchQuery, filterValues, searchField]);

  // Pagination calculations
  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const handleSearch = () => {
    setPage(1);
    setAppliedSearchQuery(searchQuery);
  };

  const handleReset = () => {
    setPage(1);
    setSearchQuery('');
    setAppliedSearchQuery('');
    const resetFilters: Record<string, string> = {};
    filters.forEach((f) => {
      resetFilters[f.key] = '';
    });
    setFilterValues(resetFilters);
  };

  const openCreate = () => {
    setEditingItem({ ...defaultNewItem } as Partial<T>);
    setError(null);
    setDrawerOpen(true);
  };

  const openEdit = (item: T, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingItem({ ...item });
    setError(null);
    setDrawerOpen(true);
  };

  const updateEditingItem = (key: string, value: any) => {
    setEditingItem((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [key]: value
      } as unknown as Partial<T>;
    });
  };

  const handleSave = () => {
    if (!editingItem) return;

    // Save validation checking
    const missingFields = fields
      .filter((f) => f.required && !String(editingItem[f.key] ?? '').trim())
      .map((f) => f.label);

    if (missingFields.length > 0) {
      setError(`以下必填项未填写: ${missingFields.join(', ')}`);
      return;
    }

    setError(null);
    if (editingItem.id) {
      // Update
      setItems((prev) => prev.map((u) => (u.id === editingItem.id ? (editingItem as unknown as T) : u)));
      setNotice('更新成功');
    } else {
      // Create
      const newItem = {
        ...editingItem,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as unknown as T;
      setItems((prev) => [newItem, ...prev]);
      setNotice('新增成功');
    }

    setDrawerOpen(false);
    setEditingItem(null);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleToggleStatus = (item: T, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextStatus = item.status === '启用' || item.status === 'ACTIVE'
      ? (item.status === '启用' ? '禁用' : 'DISABLED')
      : (item.status === '禁用' ? '启用' : 'ACTIVE');

    setItems((prev) =>
      prev.map((u) => (u.id === item.id ? { ...u, status: nextStatus } : u))
    );
    setNotice('状态修改成功');
    setTimeout(() => setNotice(null), 3000);
  };

  const openDelete = (item: T, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeletingItem(item);
  };

  const handleDelete = () => {
    if (!deletingItem) return;
    setItems((prev) => prev.filter((u) => u.id !== deletingItem.id));
    setDeletingItem(null);
    setNotice('删除成功');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2f2f2f]">{title}</h1>
          <p className="mt-2 text-sm text-[#8c8c8c]">{description}</p>
        </div>
        {fields.length > 0 && (
          <Button onClick={openCreate} className="bg-[#2f6f2f] hover:bg-[#235623]">
            ＋ 新增{primaryLabel}
          </Button>
        )}
      </div>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div> : null}

      {/* Filters section */}
      {(filters.length > 0 || searchField) && (
        <div className="rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="flex flex-col gap-1 text-sm text-[#2f2f2f]">
                <span className="font-medium">{filter.label}</span>
                <select
                  value={filterValues[filter.key]}
                  onChange={(e) => {
                    setPage(1);
                    setFilterValues({ ...filterValues, [filter.key]: e.target.value });
                  }}
                  className="h-10 w-40 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
                >
                  <option value="">全部</option>
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="flex flex-1 flex-col gap-1 text-sm text-[#2f2f2f]">
              <span className="font-medium">关键词</span>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder={searchPlaceholder}
                className="h-10 rounded-xl"
              />
            </div>

            <Button onClick={handleSearch} className="h-10 bg-[#2f6f2f] hover:bg-[#235623] px-6">
              查询
            </Button>
            <Button variant="ghost" onClick={handleReset} className="h-10 px-6">
              重置
            </Button>
          </div>
        </div>
      )}

      {/* Statistics section */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {stats.map((stat, idx) => {
            const toneClass = {
              green: 'bg-[#edf5ea] text-[#6f8b62]',
              orange: 'bg-[#fbf1e7] text-[#c27b48]',
              blue: 'bg-blue-50 text-blue-600',
              red: 'bg-red-50 text-red-600'
            }[stat.tone ?? 'green'];
            return (
              <div key={idx} className="flex items-center gap-5 rounded-2xl border border-[#e9e2d6] bg-white p-5 shadow-sm">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${toneClass}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-xs text-[#8c8c8c]">{stat.title}</div>
                  <div className="mt-1 text-xl font-semibold text-[#2f2f2f]">
                    {stat.value}
                    {stat.suffix && <span className="ml-1 text-xs font-normal text-[#8c8c8c]">{stat.suffix}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Table List */}
      <div className="overflow-hidden rounded-2xl border border-[#e9e2d6] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-[#fffdfc] text-xs text-[#8c8c8c]">
              <tr>
                <th className="border-b border-[#e9e2d6] px-4 py-3.5">ID</th>
                {columns.map((col) => (
                  <th key={col.key} className="border-b border-[#e9e2d6] px-4 py-3.5">
                    {col.title}
                  </th>
                ))}
                {initialItems[0]?.status !== undefined && (
                  <th className="border-b border-[#e9e2d6] px-4 py-3.5">状态</th>
                )}
                <th className="sticky right-0 z-20 border-b border-[#e9e2d6] bg-[#fffdfc] px-4 py-3.5 text-right shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 3} className="px-4 py-12 text-center text-[#8c8c8c]">
                    暂无数据
                  </td>
                </tr>
              ) : (
                pageRows.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-[#fffdfc] cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="border-b border-[#f1ece4] px-4 py-3 text-zinc-500 font-mono text-xs">
                      {item.id}
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="border-b border-[#f1ece4] px-4 py-3 text-[#2f2f2f] max-w-xs truncate">
                        {col.render ? col.render(item) : String(item[col.key] ?? '-')}
                      </td>
                    ))}
                    {item.status !== undefined && (
                      <td className="border-b border-[#f1ece4] px-4 py-3">
                        <StatusTag
                          label={item.status === 'ACTIVE' || item.status === '启用' ? '启用' : '禁用'}
                          tone={item.status === 'ACTIVE' || item.status === '启用' ? 'green' : 'orange'}
                        />
                      </td>
                    )}
                    <td
                      className="sticky right-0 z-10 whitespace-nowrap border-b border-[#f1ece4] bg-white px-4 py-3 text-right shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.35)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="text-[#6f8b62] hover:text-[#2f6f2f] font-semibold"
                        >
                          查看
                        </button>
                        {fields.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => openEdit(item, e)}
                            className="text-[#6f8b62] hover:text-[#2f6f2f] font-semibold"
                          >
                            编辑
                          </button>
                        )}
                        {item.status !== undefined && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(item, e)}
                            className="text-[#c27b48] hover:text-[#a35f2f] font-semibold"
                          >
                            {item.status === 'ACTIVE' || item.status === '启用' ? '禁用' : '启用'}
                          </button>
                        )}
                        {fields.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => openDelete(item, e)}
                            className="text-red-500 hover:text-red-600 font-semibold"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between gap-4 border-t border-[#f1ece4] px-5 py-3 text-xs text-[#8c8c8c] overflow-x-auto whitespace-nowrap">
          <span>共 {total} 条</span>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs"
            >
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
              <option value={50}>50 条/页</option>
            </select>
            <Button
              variant="ghost"
              disabled={!canPrev}
              onClick={() => setPage((v) => Math.max(1, v - 1))}
              className="h-8 w-8 p-0 flex items-center justify-center"
            >
              ‹
            </Button>
            <span className="rounded-lg bg-[#6f8b62] px-2.5 py-1 text-white">{page}</span>
            <span>/ {totalPages}</span>
            <Button
              variant="ghost"
              disabled={!canNext}
              onClick={() => setPage((v) => v + 1)}
              className="h-8 w-8 p-0 flex items-center justify-center"
            >
              ›
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
      <Drawer
        title={editingItem?.id ? `编辑${primaryLabel}` : `新增${primaryLabel}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        widthClassName="max-w-xl"
      >
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-[#2f2f2f]">
                {field.label} {field.required ? '*' : ''}
              </span>
              {field.type === 'textarea' ? (
                <textarea
                  value={String(editingItem?.[field.key] ?? '')}
                  onChange={(e) => updateEditingItem(field.key, e.target.value)}
                  className="min-h-24 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#7a8b6f]"
                />
              ) : field.type === 'select' ? (
                <select
                  value={String(editingItem?.[field.key] ?? '')}
                  onChange={(e) => updateEditingItem(field.key, e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-[#7a8b6f]"
                >
                  <option value="">请选择</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingItem?.[field.key])}
                    onChange={(e) => updateEditingItem(field.key, e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 accent-[#7a8b6f]"
                  />
                  <span className="text-sm text-zinc-700">在 App 中启用</span>
                </label>
              ) : (
                <Input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={editingItem?.[field.key] === null ? '' : String(editingItem?.[field.key] ?? '')}
                  onChange={(e) =>
                    updateEditingItem(
                      field.key,
                      field.type === 'number' ? Number(e.target.value) : e.target.value
                    )
                  }
                  className="h-10 rounded-xl"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-4 border-t border-[#f5f1ea]">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} className="bg-[#2f6f2f] hover:bg-[#235623]">
              保存
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Details Drawer */}
      <Drawer
        title={`${primaryLabel}详情`}
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        widthClassName="max-w-xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#fffdfc] border border-[#e9e2d6] p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-[#8c8c8c]">ID</span>
                  <div className="mt-1 text-sm font-semibold text-[#2f2f2f]">{selectedItem.id}</div>
                </div>
                {columns.map((col) => (
                  <div key={col.key}>
                    <span className="text-xs text-[#8c8c8c]">{col.title}</span>
                    <div className="mt-1 text-sm text-[#2f2f2f]">
                      {col.render ? col.render(selectedItem) : String(selectedItem[col.key] ?? '-')}
                    </div>
                  </div>
                ))}
                {selectedItem.status !== undefined && (
                  <div>
                    <span className="text-xs text-[#8c8c8c]">状态</span>
                    <div className="mt-1">
                      <StatusTag
                        label={selectedItem.status === 'ACTIVE' || selectedItem.status === '启用' ? '启用' : '禁用'}
                        tone={selectedItem.status === 'ACTIVE' || selectedItem.status === '启用' ? 'green' : 'orange'}
                      />
                    </div>
                  </div>
                )}
                {selectedItem.createdAt && (
                  <div>
                    <span className="text-xs text-[#8c8c8c]">创建时间</span>
                    <div className="mt-1 text-sm text-[#2f2f2f]">
                      {new Date(selectedItem.createdAt).toLocaleString()}
                    </div>
                  </div>
                )}
                {selectedItem.updatedAt && (
                  <div>
                    <span className="text-xs text-[#8c8c8c]">更新时间</span>
                    <div className="mt-1 text-sm text-[#2f2f2f]">
                      {new Date(selectedItem.updatedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSelectedItem(null)}>
                关闭
              </Button>
              {fields.length > 0 && (
                <Button onClick={() => {
                  const item = selectedItem;
                  setSelectedItem(null);
                  openEdit(item);
                }} className="bg-[#7a8b6f] hover:bg-[#68775f]">
                  编辑
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete confirmation modal */}
      <ConfirmModal
        title={`确认删除${primaryLabel}`}
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        description={deletingItem ? `确定要删除 ${primaryLabel}「${deletingItem.name || deletingItem.title || deletingItem.id}」吗？该操作不可撤销。` : null}
        confirmText="确认删除"
        danger
        onConfirm={handleDelete}
      />
    </section>
  );
};
