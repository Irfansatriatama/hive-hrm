'use client';

import React from 'react';

interface AvatarProps {
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const COLORS = [
  { bg: 'bg-blue-600', text: 'text-white' },
  { bg: 'bg-emerald-600', text: 'text-white' },
  { bg: 'bg-amber-600', text: 'text-white' },
  { bg: 'bg-violet-600', text: 'text-white' },
  { bg: 'bg-cyan-600', text: 'text-white' },
  { bg: 'bg-rose-600', text: 'text-white' },
  { bg: 'bg-teal-600', text: 'text-white' },
  { bg: 'bg-indigo-600', text: 'text-white' },
];

export default function Avatar({ name = 'User', size = 'md', className = '' }: AvatarProps) {
  const cleanName = name.trim();
  const parts = cleanName.split(/\s+/);
  
  let initials = '';
  if (parts.length > 1 && parts[0] && parts[1]) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (cleanName) {
    initials = cleanName.substring(0, 2).toUpperCase();
  } else {
    initials = 'US';
  }

  // Pick deterministic color based on hash of the name
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash += cleanName.charCodeAt(i);
  }
  const colorPair = COLORS[hash % COLORS.length];

  // Sizing definitions matching reference sizes
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl',
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`${selectedSizeClass} rounded-full flex items-center justify-center font-bold ${colorPair.bg} ${colorPair.text} shrink-0 select-none shadow-sm ${className}`}
    >
      {initials}
    </div>
  );
}
