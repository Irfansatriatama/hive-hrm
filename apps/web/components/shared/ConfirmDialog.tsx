'use client';

import React from 'react';
import * as Lucide from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '@/lib/i18n';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'success' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'warning',
}: ConfirmDialogProps) {
  const { t } = useI18n();

  const cText = confirmText || t('yes', 'Ya');
  const cnText = cancelText || t('cancel', 'Batal');

  let icon = <Lucide.AlertTriangle className="w-5 h-5 text-amber-500" />;
  let colorClass = 'bg-amber-50';
  let btnClass = 'bg-primary hover:bg-primary-dark';

  if (type === 'danger') {
    icon = <Lucide.Trash2 className="w-5 h-5 text-red-500" />;
    colorClass = 'bg-red-50';
    btnClass = 'bg-red-600 hover:bg-red-700';
  } else if (type === 'success') {
    icon = <Lucide.CheckCircle className="w-5 h-5 text-green-500" />;
    colorClass = 'bg-green-50';
    btnClass = 'bg-green-600 hover:bg-green-700';
  } else if (type === 'info') {
    icon = <Lucide.Info className="w-5 h-5 text-blue-500" />;
    colorClass = 'bg-blue-50';
    btnClass = 'bg-blue-600 hover:bg-blue-700';
  }

  const footer = (
    <>
      <button
        onClick={onClose}
        className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
      >
        {cnText}
      </button>
      <button
        onClick={() => {
          onConfirm();
          onClose();
        }}
        className={`px-4 py-2 ${btnClass} text-white text-xs font-semibold rounded-lg shadow transition cursor-pointer`}
      >
        {cText}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="sm">
      <div className="flex gap-4 items-start text-xs select-none">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
          {icon}
        </div>
        <div className="space-y-1 py-1">
          <p className="text-slate-700 font-medium leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
