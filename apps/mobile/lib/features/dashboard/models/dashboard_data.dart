import '../../../shared/models/announcement_model.dart';
import '../../../shared/models/attendance_model.dart';
import '../../../shared/models/employee_model.dart';
import '../../../shared/models/leave_model.dart';

class DashboardData {
  final EmployeeModel employee;
  final AttendanceModel? todayAttendance;
  final List<LeaveBalanceModel> leaveBalances;
  final List<LeaveRequestModel> leaveRequests;
  final List<AnnouncementModel> announcements;
  final int rewardPoints;
  final int rewardPointsToday;
  final int attendanceRatePercent;

  const DashboardData({
    required this.employee,
    required this.todayAttendance,
    required this.leaveBalances,
    required this.leaveRequests,
    required this.announcements,
    required this.rewardPoints,
    required this.rewardPointsToday,
    required this.attendanceRatePercent,
  });

  LeaveBalanceModel? get primaryLeaveBalance {
    if (leaveBalances.isEmpty) return null;
    return leaveBalances.reduce(
      (a, b) => a.total >= b.total ? a : b,
    );
  }

  int get pendingRequestCount =>
      leaveRequests.where((r) => r.isPending).length;
}
