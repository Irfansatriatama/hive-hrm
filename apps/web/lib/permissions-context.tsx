'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import { MODULE_PERMISSIONS } from '@hive-hrm/types';

type PermissionMatrix = Record<string, string[]>;

interface PermissionsContextValue {
  matrix: PermissionMatrix;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [matrix, setMatrix] = useState<PermissionMatrix>(MODULE_PERMISSIONS as PermissionMatrix);
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    try {
      const data = await fetchAPI<PermissionMatrix>('/core/permissions');
      if (data && typeof data === 'object') {
        setMatrix(data);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
      setMatrix(MODULE_PERMISSIONS as PermissionMatrix);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const refreshPermissions = useCallback(async () => {
    setLoading(true);
    await loadPermissions();
  }, [loadPermissions]);

  return (
    <PermissionsContext.Provider value={{ matrix, loading, refreshPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissionsContext must be used within PermissionsProvider');
  }
  return ctx;
}
