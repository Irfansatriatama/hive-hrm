'use client';

import React from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const { lang, t } = useI18n();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null; // No pagination required if only 1 page

  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalItems);

  // Sliding window pagination array builder
  const delta = 1;
  const left = currentPage - delta;
  const right = currentPage + delta + 1;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];
  let l: number | undefined;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l !== undefined) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l > 2) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-white border-t border-slate-100 select-none">
      {/* Entry Counts Text */}
      <div className="text-xs text-slate-500 font-medium">
        {lang === 'id' ? (
          <>
            Menampilkan <span className="font-bold text-slate-700">{startEntry}</span> hingga{' '}
            <span className="font-bold text-slate-700">{endEntry}</span> dari{' '}
            <span className="font-bold text-slate-700">{totalItems}</span> entri
          </>
        ) : (
          <>
            Showing <span className="font-bold text-slate-700">{startEntry}</span> to{' '}
            <span className="font-bold text-slate-700">{endEntry}</span> of{' '}
            <span className="font-bold text-slate-700">{totalItems}</span> entries
          </>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Page Button */}
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-1 text-slate-650 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          aria-label="Previous Page"
        >
          <Lucide.ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Numbers */}
        {rangeWithDots.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} className="px-2.5 py-1 text-slate-400 text-xs font-medium">
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === currentPage;
          const buttonClass = isActive
            ? 'bg-primary border-primary text-white font-bold'
            : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold';

          return (
            <button
              key={`page-${pageNum}`}
              onClick={() => onPageChange(pageNum)}
              disabled={isActive}
              className={`min-w-[32px] h-8 px-2 rounded-lg border text-xs flex items-center justify-center transition cursor-pointer ${buttonClass}`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Page Button */}
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-1 text-slate-650 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          aria-label="Next Page"
        >
          <Lucide.ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
