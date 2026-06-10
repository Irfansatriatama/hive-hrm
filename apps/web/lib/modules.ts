import { getModuleKeyFromPath } from '@hive-hrm/types';

export function menuKeyToModuleKey(menuKey: string): string {
  if (menuKey === 'org_chart') return 'org-chart';
  if (menuKey === 'user_access') return 'user-access';
  return menuKey;
}

export { getModuleKeyFromPath };
