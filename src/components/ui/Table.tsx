import { ReactNode, useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  /** Hide this column on mobile viewports */
  hideOnMobile?: boolean;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  /** Render a mobile card for each row instead of a table on small screens */
  mobileCardRender?: (row: T, index: number) => ReactNode;
}

type SortState = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export function Table<T extends Record<string, any>>({
  data,
  columns,
  pagination,
  onSort,
  loading = false,
  emptyMessage = 'No data available',
  className,
  striped = false,
  hoverable = true,
  mobileCardRender,
}: TableProps<T>) {
  const [sortState, setSortState] = useState<SortState>(null);

  const handleSort = (key: string) => {
    if (!onSort) return;

    const newDirection =
      sortState?.key === key && sortState.direction === 'asc' ? 'desc' : 'asc';
    
    setSortState({ key, direction: newDirection });
    onSort(key, newDirection);
  };

  const renderCell = (column: Column<T>, row: T, rowIndex: number) => {
    const value = row[column.key];
    return column.render ? column.render(value, row, rowIndex) : value;
  };

  if (loading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className={cn('w-full', className)}>
          <thead className="bg-secondary-50 dark:bg-secondary-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-800">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full overflow-x-auto">
        <table className={cn('w-full', className)}>
          <thead className="bg-secondary-50 dark:bg-secondary-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider',
                    column.headerClassName
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-secondary-900">
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <p className="text-secondary-500 dark:text-secondary-400">{emptyMessage}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Mobile Card View */}
      {mobileCardRender && (
        <div className="block md:hidden space-y-3">
          {data.map((row, index) => mobileCardRender(row, index))}
        </div>
      )}

      {/* Desktop/Tablet Table View */}
      <div className={cn(
        'overflow-x-auto rounded-lg border border-secondary-200 dark:border-secondary-800 -webkit-overflow-scrolling-touch',
        mobileCardRender && 'hidden md:block'
      )}>
        <table className={cn('w-full', className)}>
          <thead className="bg-secondary-50 dark:bg-secondary-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider sm:px-6',
                    column.sortable && onSort && 'cursor-pointer select-none hover:bg-secondary-100 dark:hover:bg-secondary-700',
                    column.hideOnMobile && 'hidden sm:table-cell',
                    column.headerClassName
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && onSort && (
                      <span className="flex flex-col">
                        <ChevronUpIcon
                          className={cn(
                            'h-3 w-3 -mb-1',
                            sortState?.key === column.key && sortState.direction === 'asc'
                              ? 'text-primary-600'
                              : 'text-secondary-400'
                          )}
                        />
                        <ChevronDownIcon
                          className={cn(
                            'h-3 w-3',
                            sortState?.key === column.key && sortState.direction === 'desc'
                              ? 'text-primary-600'
                              : 'text-secondary-400'
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-800">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  striped && rowIndex % 2 === 1 && 'bg-secondary-50/50 dark:bg-secondary-800/50',
                  hoverable && 'hover:bg-secondary-50 dark:hover:bg-secondary-800/80 transition-colors'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-100 sm:px-6',
                      column.hideOnMobile && 'hidden sm:table-cell',
                      column.className
                    )}
                  >
                    {renderCell(column, row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-secondary-700 dark:text-secondary-300 text-center sm:text-left">
            Showing{' '}
            <span className="font-medium">
              {(pagination.currentPage - 1) * pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
            </span>{' '}
            of <span className="font-medium">{pagination.totalItems}</span> results
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1;
                const isCurrentPage = page === pagination.currentPage;
                const shouldShow =
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1);

                if (!shouldShow) {
                  if (
                    page === pagination.currentPage - 2 ||
                    page === pagination.currentPage + 2
                  ) {
                    return (
                      <span
                        key={page}
                        className="px-2 text-secondary-400 dark:text-secondary-500"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => pagination.onPageChange(page)}
                    className={cn(
                      'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      isCurrentPage
                        ? 'bg-primary-600 text-white'
                        : 'border border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
