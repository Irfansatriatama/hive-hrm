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

  // Leave
  static const String leaveBalances = '/leave/balances';
  static const String leaveRequests = '/leave/requests';
  static const String leaveCalendar = '/leave/calendar';
  static const String leaveTypes = '/leave/types';

  // Announcements
  static const String announcementFeed = '/core/announcements/feed';

  // Payslip
  static const String myPayslips = '/payroll/my-payslips';
}
