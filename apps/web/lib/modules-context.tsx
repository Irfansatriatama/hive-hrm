'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import type { SystemModule } from '@/hooks/useModules';

interface ModulesContextValue {
  modules: SystemModule[];
  loading: boolean;
  isModuleEnabled: (key: string) => boolean;
  refreshModules: () => Promise<void>;
}

const ModulesContext = createContext<ModulesContextValue | null>(null);

export function ModulesProvider({ children }: { children: React.ReactNode }) {
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadModules = useCallback(async () => {
    try {
      const data = await fetchAPI<SystemModule[]>('/core/modules');
      setModules(data);
    } catch (err) {
      console.error('Failed to load modules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const isModuleEnabled = useCallback(
    (key: string): boolean => {
      const mod = modules.find((m) => m.key === key);
      if (!mod) return true;
      return mod.isEnabled;
    },
    [modules],
  );

  const refreshModules = useCallback(async () => {
    setLoading(true);
    await loadModules();
  }, [loadModules]);

  return (
    <ModulesContext.Provider value={{ modules, loading, isModuleEnabled, refreshModules }}>
      {children}
    </ModulesContext.Provider>
  );
}

export function useModulesContext() {
  const ctx = useContext(ModulesContext);
  if (!ctx) {
    throw new Error('useModulesContext must be used within ModulesProvider');
  }
  return ctx;
}
