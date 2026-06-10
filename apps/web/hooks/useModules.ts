'use client';

import { useModulesContext } from '@/lib/modules-context';

export interface SystemModule {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  isCore: boolean;
  isEnabled: boolean;
  sortOrder: number;
}

export function useModules() {
  return useModulesContext();
}
