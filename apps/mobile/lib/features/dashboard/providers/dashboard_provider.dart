import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/announcement_model.dart';
import '../../../shared/models/attendance_model.dart';
import '../../../shared/models/employee_model.dart';
import '../../../shared/models/leave_model.dart';
import '../models/dashboard_data.dart';

part 'dashboard_provider.g.dart';

@riverpod
class Dashboard extends _$Dashboard {
  @override
  Future<DashboardData> build() async {
    return _fetchDashboard();
  }

  Future<DashboardData> _fetchDashboard() async {
    final now = DateTime.now();

    final responses = await Future.wait([
      ApiClient.instance.get(ApiEndpoints.me),
      ApiClient.instance.get(ApiEndpoints.attendanceToday),
      ApiClient.instance.get(ApiEndpoints.leaveBalances),
      ApiClient.instance.get(ApiEndpoints.announcementFeed),
      ApiClient.instance.get(ApiEndpoints.rewardBalance),
      ApiClient.instance.get(
        ApiEndpoints.attendanceHistory,
        queryParameters: {
          'month': now.month.toString(),
          'year': now.year.toString(),
        },
      ),
      ApiClient.instance.get(ApiEndpoints.leaveMyRequests),
      ApiClient.instance.get(ApiEndpoints.rewardTransactions),
    ]);

    final employee = EmployeeModel.fromJson(
      responses[0].data as Map<String, dynamic>,
    );

    final todayData = responses[1].data;
    final AttendanceModel? todayAttendance = todayData == null
        ? null
        : AttendanceModel.fromJson(todayData as Map<String, dynamic>);

    final leaveBalances = (responses[2].data as List<dynamic>)
        .map((e) => LeaveBalanceModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final announcements = (responses[3].data as List<dynamic>)
        .map((e) => AnnouncementModel.fromJson(e as Map<String, dynamic>))
        .take(3)
        .toList();

    final rewardPoints = _parseRewardBalance(responses[4].data);

    final monthAttendances = (responses[5].data as List<dynamic>)
        .map((e) => AttendanceModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final leaveRequests = (responses[6].data as List<dynamic>)
        .map((e) => LeaveRequestModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final rewardPointsToday = _sumTodayRewardPoints(responses[7].data);

    return DashboardData(
      employee: employee,
      todayAttendance: todayAttendance,
      leaveBalances: leaveBalances,
      leaveRequests: leaveRequests,
      announcements: announcements,
      rewardPoints: rewardPoints,
      rewardPointsToday: rewardPointsToday,
      attendanceRatePercent: _computeAttendanceRate(monthAttendances, now),
    );
  }

  int _parseRewardBalance(dynamic data) {
    if (data is int) return data;
    if (data is num) return data.toInt();
    if (data is Map<String, dynamic>) {
      final balance = data['balance'];
      if (balance is num) return balance.toInt();
    }
    return 0;
  }

  int _sumTodayRewardPoints(dynamic data) {
    if (data is! List<dynamic>) return 0;
    final today = DateTime.now();
    var sum = 0;
    for (final item in data) {
      if (item is! Map<String, dynamic>) continue;
      final type = item['type'] as String?;
      final points = item['points'];
      final createdAtRaw = item['createdAt'] ?? item['created_at'];
      if (type != 'received' || points is! num || createdAtRaw == null) {
        continue;
      }
      final createdAt = DateTime.tryParse(createdAtRaw.toString());
      if (createdAt == null) continue;
      if (createdAt.year == today.year &&
          createdAt.month == today.month &&
          createdAt.day == today.day) {
        sum += points.toInt();
      }
    }
    return sum;
  }

  int _computeAttendanceRate(List<AttendanceModel> records, DateTime now) {
    final weekdaysElapsed = _countWeekdaysInRange(
      DateTime(now.year, now.month, 1),
      now,
    );
    if (weekdaysElapsed == 0) return 0;

    final presentDays = records
        .where((r) => r.checkIn != null)
        .length;

    return ((presentDays / weekdaysElapsed) * 100).round().clamp(0, 100);
  }

  int _countWeekdaysInRange(DateTime start, DateTime end) {
    var count = 0;
    var current = DateTime(start.year, start.month, start.day);
    final last = DateTime(end.year, end.month, end.day);

    while (!current.isAfter(last)) {
      if (current.weekday >= DateTime.monday &&
          current.weekday <= DateTime.friday) {
        count++;
      }
      current = current.add(const Duration(days: 1));
    }
    return count;
  }
}
