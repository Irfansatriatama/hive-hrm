export type UserRole = 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE';

export const MODULE_PERMISSIONS: Record<string, UserRole[]> = {
  dashboard:   ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE'],
  attendance:  ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  leave:       ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  reward:      ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  employee:    ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  approval:    ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  reporting:   ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'FINANCE'],
  company:     ['SUPER_ADMIN', 'HR_ADMIN'],
  billing:     ['SUPER_ADMIN', 'FINANCE'],
  settings:    ['SUPER_ADMIN', 'HR_ADMIN'],
  'user-access': ['SUPER_ADMIN'],
  announcement: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  assets:      ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'],
  documents:   ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  'org-chart': ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  shift:       ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  visitor:     ['SUPER_ADMIN', 'HR_ADMIN'],
  procurement: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'FINANCE'],
};
