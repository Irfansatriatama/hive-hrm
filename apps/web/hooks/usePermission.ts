import { useAuth } from './useAuth';
import { MODULE_PERMISSIONS, UserRole } from '@hive-hrm/types';

export function usePermission() {
  const { user } = useAuth();

  const hasAccess = (moduleKey: string): boolean => {
    if (!user) return false;
    
    // Normalize role string (Better Auth returns string, we cast to UserRole enum format)
    const userRole = user.role as UserRole;
    
    const allowedRoles = MODULE_PERMISSIONS[moduleKey];
    if (!allowedRoles) {
      return true; // If not configured in permissions, allow access
    }

    return allowedRoles.includes(userRole);
  };

  return { hasAccess };
}
