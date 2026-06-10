import { useAuth } from './useAuth';
import { MODULE_PERMISSIONS, UserRole } from '@hive-hrm/types';
import { usePermissionsContext } from '@/lib/permissions-context';

export function normalizeRole(role?: string): UserRole {
  if (!role) return 'EMPLOYEE';
  return role.toUpperCase().replace(/-/g, '_') as UserRole;
}

export function isHRRole(role?: string): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'SUPER_ADMIN' || normalized === 'HR_ADMIN';
}

export function usePermission() {
  const { user, isLoading } = useAuth();
  const { matrix } = usePermissionsContext();
  const userRole = normalizeRole(user?.role);

  const hasAccess = (moduleKey: string): boolean => {
    if (!user) return false;

    const allowedRoles = matrix[moduleKey] ?? MODULE_PERMISSIONS[moduleKey];
    if (!allowedRoles) {
      return true;
    }

    return allowedRoles.includes(userRole);
  };

  return { hasAccess, userRole, isLoading };
}
