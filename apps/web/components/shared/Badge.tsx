'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n';

interface BadgeProps {
  status?: string;
  className?: string;
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const { t } = useI18n();

  if (!status) return null;

  const norm = status.toLowerCase().trim();

  let bg = 'bg-slate-100';
  let text = 'text-slate-700';
  let label = status;

  if (norm === 'pending') {
    bg = 'bg-[#FEF3C7]';
    text = 'text-[#92400E]';
    label = t('pending');
  } else if (
    ['approved', 'success', 'active', 'hadir', 'on time', 'paid', 'checked_out', 'on_time'].includes(norm)
  ) {
    bg = 'bg-[#DCFCE7]';
    text = 'text-[#166534]';
    if (norm === 'approved') label = t('approved');
    else if (norm === 'active') label = t('active');
    else if (norm === 'success') label = t('success', 'Success');
    else if (norm === 'hadir') label = t('present', 'Hadir');
    else if (norm === 'on time' || norm === 'on_time') label = t('on_time', 'On Time');
    else if (norm === 'paid') label = t('paid', 'Paid');
    else if (norm === 'checked_out') label = t('checked_out', 'Checked Out');
  } else if (
    ['rejected', 'absent', 'inactive', 'cancelled', 'damaged', 'sakit', 'izin', 'alpha'].includes(norm)
  ) {
    bg = 'bg-[#FEE2E2]';
    text = 'text-[#991B1B]';
    if (norm === 'rejected') label = t('rejected');
    else if (norm === 'inactive') label = t('inactive');
    else if (norm === 'cancelled') label = t('cancelled', 'Batal');
    else if (norm === 'sakit') label = t('sick', 'Sakit');
    else if (norm === 'izin') label = t('permission', 'Izin');
    else if (norm === 'alpha') label = t('absent_unexcused', 'Alpha');
  } else if (['leave', 'on leave', 'cuti', 'on_leave'].includes(norm)) {
    bg = 'bg-[#EDE9FE]';
    text = 'text-[#5B21B6]';
    label = t('on_leave');
  } else if (['late', 'terlambat', 'draft', 'expected'].includes(norm)) {
    bg = 'bg-amber-100';
    text = 'text-amber-850';
    if (norm === 'terlambat' || norm === 'late') label = t('late', 'Terlambat');
    else if (norm === 'draft') label = t('draft', 'Draft');
  } else if (['in_use', 'checked_in', 'in_use'].includes(norm)) {
    bg = 'bg-blue-100';
    text = 'text-blue-800';
    label = norm === 'in_use' ? t('in_use', 'In Use') : t('checked_in', 'Checked In');
  } else if (norm === 'in_repair') {
    bg = 'bg-orange-100';
    text = 'text-orange-850';
    label = t('in_repair', 'In Repair');
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${bg} ${text} select-none uppercase tracking-wider ${className}`}
    >
      {label}
    </span>
  );
}
