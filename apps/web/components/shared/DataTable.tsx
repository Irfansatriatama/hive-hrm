'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';

interface DataTableProps<T> {
  headers: string[];
  rows: T[];
  columns: (keyof T | ((row: T) => React.ReactNode))[];
  actions?: (row: T) => React.ReactNode;
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T, index: number) => void;
  selectedIndex?: number;
}

export default function DataTable<T>({
  headers = [],
  rows = [],
  columns = [],
  actions,
  loading = false,
  emptyText,
  onRowClick,
  selectedIndex = -1,
}: DataTableProps<T>) {
  const { t } = useI18n();
  const defaultEmptyText = emptyText || t('no_data');

  if (loading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse select-none">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-3.5">
                  <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3.5 text-right">
                  <div className="h-3 w-12 bg-slate-200 rounded ml-auto animate-pulse" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-100">
                {headers.map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse" />
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-right">
                    <div className="h-3.5 w-16 bg-slate-100 rounded ml-auto animate-pulse" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (rows.length === 0) {
    const totalCols = headers.length + (actions ? 1 : 0);
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td colSpan={totalCols} className="px-6 py-16 text-center select-none">
                <svg
                  className="mx-auto h-12 w-12 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-4 text-sm font-semibold text-slate-700">{t('no_data')}</h3>
                <p className="mt-1 text-xs text-slate-400">{defaultEmptyText}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-max">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 select-none">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                {t('action', 'Aksi')}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
          {rows.map((row, rowIndex) => {
            const isSelected = rowIndex === selectedIndex;
            const rowClass = isSelected
              ? 'bg-blue-50/50 text-slate-900 border-l-2 border-primary'
              : 'hover:bg-slate-50/80 transition duration-150';

            return (
              <tr
                key={rowIndex}
                className={`${rowClass} cursor-pointer`}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {columns.map((col, colIndex) => {
                  let cellContent: React.ReactNode;

                  if (typeof col === 'function') {
                    cellContent = col(row);
                  } else {
                    const value = row[col];
                    cellContent = value !== undefined && value !== null ? String(value) : '';
                  }

                  return (
                    <td key={colIndex} className="px-6 py-4 font-medium max-w-xs truncate">
                      {cellContent}
                    </td>
                  );
                })}
                {actions && (
                  <td
                    className="px-6 py-4 text-right font-medium space-x-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions(row)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
