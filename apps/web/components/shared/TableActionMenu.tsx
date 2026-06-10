'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';

export type TableActionItem = {
  label: string;
  onClick?: () => void;
  href?: string;
  target?: string;
  variant?: 'default' | 'primary' | 'danger' | 'warning';
  /** Marks this item as the row's primary detail action (used for row click navigation). */
  isDetail?: boolean;
};

export function findDetailAction(items: TableActionItem[]): TableActionItem | undefined {
  return items.find((item) => item.isDetail);
}

export function triggerDetailAction(
  item: TableActionItem,
  navigate?: (href: string) => void,
): void {
  if (item.href) {
    if (item.target === '_blank') {
      window.open(item.href, '_blank', 'noopener,noreferrer');
    } else if (navigate) {
      navigate(item.href);
    } else {
      window.location.href = item.href;
    }
    return;
  }
  item.onClick?.();
}

interface TableActionMenuProps {
  items: TableActionItem[];
}

const variantClass: Record<NonNullable<TableActionItem['variant']>, string> = {
  default: 'text-slate-700 hover:bg-slate-50',
  primary: 'text-primary hover:bg-blue-50',
  danger: 'text-red-600 hover:bg-red-50',
  warning: 'text-amber-600 hover:bg-amber-50',
};

export default function TableActionMenu({ items }: TableActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (items.length === 0) {
    return <span className="text-slate-300">-</span>;
  }

  return (
    <div ref={ref} className="relative inline-flex justify-end">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        aria-label="Aksi"
      >
        <Lucide.MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-white border border-slate-200 rounded-lg shadow-lg py-1">
          {items.map((item, idx) => {
            const className = `block w-full text-left px-3 py-2 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              variantClass[item.variant || 'default']
            }`;

            if (item.href) {
              return (
                <Link
                  key={idx}
                  href={item.href}
                  target={item.target}
                  rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                  className={className}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                className={className}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
