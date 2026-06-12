class ApiEndpoints {
  ApiEndpoints._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api-hrm.tehlink.my.id',
  );

  // Auth
  static const String mobileSignIn = '/auth/mobile/sign-in';
  static const String signOut = '/auth/sign-out';

  // Employee
  static const String me = '/employees/me';
  static const String profileRequest = '/employees/requests';

  // Attendance
  static const String attendanceToday = '/attendance/today';
  static const String checkIn = '/attendance/check-in';
  static const String checkOut = '/attendance/check-out';
  static const String attendanceHistory = '/attendance/history';
  static const String attendanceSummary = '/attendance/summary';
  static const String attendanceRecord = '/attendance/records';
  static const String selfieUpload = '/attendance/selfie-upload';

  // Leave
  static const String leaveBalances = '/leave/balances';
  static const String leaveRequests = '/leave/requests';
  static const String leaveMyRequests = '/leave/requests/my';
  static const String leaveCalendar = '/leave/calendar';
  static const String leaveTypes = '/leave/types';

  // Announcements
  static const String announcementFeed = '/core/announcements/feed';

  // Payslip
  static const String myPayslips = '/payroll/my-payslips';

  // Approval
  static const String approvalInbox = '/approval/inbox';
  static const String approvalAction = '/approval/action';

  // Reward
  static const String rewardBalance = '/reward/balance';
  static const String rewardTransactions = '/reward/transactions';
  static const String rewardCatalog = '/reward/catalog';
  static const String rewardHashtags = '/reward/hashtags';
  static const String rewardFeed = '/reward/feed';
  static const String rewardAppreciation = '/reward/appreciation';
  static const String rewardRedeem = '/reward/redeem';

  // Expense
  static const String expenseCategories = '/expense/categories';
  static const String expenseClaims = '/expense/claims';
  static const String expenseReceiptUpload = '/expense/receipt-upload';

  // Employees
  static const String employees = '/employees';
  static const String orgChart = '/employees/org-chart';
  static const String departments = '/employees/departments';

  // Onboarding
  static const String onboardingMy = '/onboarding/my';
  static String onboardingTask(String assignmentId, String taskId) =>
      '/onboarding/assignments/$assignmentId/tasks/$taskId';

  // Shift
  static const String shiftTypes = '/shift/types';
  static const String shiftSchedules = '/shift/schedules';
  static const String shiftSwaps = '/shift/swaps';

  // Resources
  static const String resources = '/resources';
  static const String resourceBookings = '/resources/bookings';
  static const String resourceBookingsCalendar = '/resources/bookings/calendar';
  static String resourceBookingConfirm(String id) =>
      '/resources/bookings/$id/confirm';
  static String resourceBookingComplete(String id) =>
      '/resources/bookings/$id/complete';

  // Documents & Assets & Visitors (core)
  static const String documents = '/core/documents';
  static const String documentFolders = '/core/documents/folders';
  static const String documentUpload = '/core/documents/upload';
  static const String assets = '/core/assets';
  static const String assetRequests = '/core/assets/requests';
  static const String assetRequestsList = '/core/assets/requests/list';
  static const String visitors = '/core/visitors';
}
