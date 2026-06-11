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
  payroll: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE'],
  onboarding: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  expense: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE'],
  resources: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'],
  modules:     ['SUPER_ADMIN'],
};

export const CORE_MODULE_KEYS = [
  'dashboard',
  'employee',
  'user-access',
  'settings',
  'company',
] as const;

export const DEFAULT_SYSTEM_MODULES = [
  { key: 'dashboard', name: 'Dashboard', description: 'Main analytical panels, birthdays, and calendar previews.', icon: 'layout-dashboard', isCore: true, sortOrder: 1 },
  { key: 'employee', name: 'Employee Directory', description: 'Detailed profiles database registry, wizard additions, and groups.', icon: 'users', isCore: true, sortOrder: 2 },
  { key: 'user-access', name: 'User Permission Access', description: 'Manage roles and dynamic permission grid matrices.', icon: 'shield', isCore: true, sortOrder: 3 },
  { key: 'settings', name: 'Global Settings', description: 'Global parameters configurations.', icon: 'settings', isCore: true, sortOrder: 4 },
  { key: 'company', name: 'Company Details & Structure', description: 'Corporate profiles, branches, levels, and public holidays.', icon: 'building-2', isCore: true, sortOrder: 5 },
  { key: 'attendance', name: 'Attendance Logging & Reports', description: 'Checkin/checkout logging tracker, logs records edit, and settings.', icon: 'clock', isCore: false, sortOrder: 6 },
  { key: 'leave', name: 'Leave & Absences Tracker', description: 'Apply leave forms, leave calendars, and balance adjusters.', icon: 'calendar', isCore: false, sortOrder: 7 },
  { key: 'reward', name: 'Gamification Reward Points', description: 'Give points boards, values reports, catalogs, and point claims.', icon: 'award', isCore: false, sortOrder: 8 },
  { key: 'approval', name: 'Approval Workflow', description: 'Multi-level approval rules and submission tracking.', icon: 'check-square', isCore: false, sortOrder: 9 },
  { key: 'shift', name: 'Shift Work Scheduler', description: 'Define morning/afternoon shifts, and assign schedules.', icon: 'calendar-days', isCore: false, sortOrder: 10 },
  { key: 'org-chart', name: 'Organization Hierarchy Tree', description: 'Recursive parent sitemaps generator representing command structures.', icon: 'sitemap', isCore: false, sortOrder: 11 },
  { key: 'announcement', name: 'Announcements Board Feed', description: 'Targeted HR notifications feed updates.', icon: 'megaphone', isCore: false, sortOrder: 12 },
  { key: 'assets', name: 'Asset Management Checkouts', description: 'Office properties checkout forms, logs trackers, and registers.', icon: 'package', isCore: false, sortOrder: 13 },
  { key: 'documents', name: 'Document Hub Directory', description: 'Bilingual company policies directories and folders tree sharing.', icon: 'folder-open', isCore: false, sortOrder: 14 },
  { key: 'visitor', name: 'Visitor System Registration', description: 'Badge generator forms, check-in overlays, and historical logs.', icon: 'visitor', isCore: false, sortOrder: 15 },
  { key: 'procurement', name: 'Procurement Purchases PO', description: 'Purchase requests, order items lines, and vendor logs.', icon: 'shopping-cart', isCore: false, sortOrder: 16 },
  { key: 'reporting', name: 'Analytical Reports Center', description: 'Preview payroll summaries, asset stats, and export CSV files.', icon: 'bar-chart-2', isCore: false, sortOrder: 17 },
  { key: 'billing', name: 'Billing / Subscription Tiers', description: 'Manage payment credentials cards and upgrade storage limits.', icon: 'credit-card', isCore: false, sortOrder: 18 },
  { key: 'payroll', name: 'Payroll & Penggajian', description: 'Pengelolaan periode gaji, slip gaji karyawan, dan komponen tunjangan.', icon: 'banknote', isCore: false, sortOrder: 19 },
  { key: 'onboarding', name: 'Employee Onboarding', description: 'Template task onboarding dan tracking progress karyawan baru.', icon: 'clipboard-check', isCore: false, sortOrder: 20 },
  { key: 'expense', name: 'Expense & Klaim', description: 'Pengajuan klaim pengeluaran, approval, dan reimbursement karyawan.', icon: 'receipt', isCore: false, sortOrder: 21 },
  { key: 'resources', name: 'Pemesanan Sumber Daya', description: 'Booking ruang rapat, kendaraan, dan peralatan kantor.', icon: 'calendar-range', isCore: false, sortOrder: 22 },
] as const;

export function getModuleKeyFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'dashboard';
  return segments[0];
}
