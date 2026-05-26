import type { ReactNode } from 'react';

import { EmptyState } from './EmptyState';

export type DataTableColumn<T> = {
  key: string;
  title: string;
  widthClassName?: string;
  render: (item: T) => ReactNode;
};

type Props<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  rowKey: (item: T) => string | number;
  emptyTitle?: string;
  emptyDescription?: string;
};

export const DataTable = <T,>({
  columns,
  data,
  loading,
  error,
  rowKey,
  emptyTitle,
  emptyDescription
}: Props<T>) => (
  <div className="overflow-hidden rounded-3xl border border-[#e9e2d6] bg-[#fffdfc]">
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead className="text-xs text-[#8c8c8c]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={['border-b border-[#e9e2d6] px-4 py-3 font-medium', column.widthClassName ?? ''].join(' ')}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-sm text-[#8c8c8c]">
                加载中...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-sm text-red-700">
                {error}
              </td>
            </tr>
          ) : data.length ? (
            data.map((item) => (
              <tr key={rowKey(item)} className="hover:bg-[#f5f1ea]/60">
                {columns.map((column) => (
                  <td key={column.key} className="border-b border-[#f0eadf] px-4 py-4 align-middle last:border-b">
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="p-4">
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
