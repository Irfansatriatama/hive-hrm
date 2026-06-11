class ApiEndpoints {
  ApiEndpoints._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000',
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
}
