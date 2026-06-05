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
      <table className="w-full min-w-max border-separate border-spacing-0 text-center text-sm">
        <thead className="text-xs text-[#8c8c8c]">
          <tr>
            {columns.map((column) => {
              const isActionColumn = column.key === 'actions' || column.title === '操作';

              return (
                <th
                  key={column.key}
                  className={[
                    'whitespace-nowrap border-b border-[#e9e2d6] px-4 py-3 font-medium',
                    isActionColumn ? 'sticky right-0 z-20 bg-[#fffdfc] shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.45)]' : '',
                    column.widthClassName ?? ''
                  ].join(' ')}
                >
                  {column.title}
                </th>
              );
            })}
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
                {columns.map((column) => {
                  const isActionColumn = column.key === 'actions' || column.title === '操作';

                  return (
                    <td
                      key={column.key}
                      className={[
                        'whitespace-nowrap border-b border-[#f0eadf] px-4 py-4 align-middle last:border-b',
                        isActionColumn ? 'sticky right-0 z-10 bg-[#fffdfc] shadow-[-12px_0_18px_-18px_rgba(47,47,47,0.45)]' : ''
                      ].join(' ')}
                    >
                      {column.render(item)}
                    </td>
                  );
                })}
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
