import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/feature_models.dart';

part 'leave_calendar_provider.g.dart';

@riverpod
class LeaveCalendar extends _$LeaveCalendar {
  @override
  Future<LeaveCalendarData> build() async => _fetchCalendar();

  Future<LeaveCalendarData> _fetchCalendar() async {
    final responses = await Future.wait([
      ApiClient.instance.get(ApiEndpoints.leaveCalendar),
      ApiClient.instance.get(ApiEndpoints.departments),
      ApiClient.instance.get(
        ApiEndpoints.employees,
        queryParameters: {'limit': '1000'},
      ),
    ]);

    final eventsRaw = responses[0].data as List<dynamic>;
    final departments = (responses[1].data as List<dynamic>)
        .map(
          (e) => LeaveCalendarDepartmentModel.fromJson(
            e as Map<String, dynamic>,
          ),
        )
        .toList();

    final employeesRaw = responses[2].data;
    final employeesList = employeesRaw is Map && employeesRaw['employees'] is List
        ? employeesRaw['employees'] as List<dynamic>
        : employeesRaw is List
            ? employeesRaw
            : <dynamic>[];

    final deptByEmployee = <String, String>{};
    for (final emp in employeesList) {
      final map = emp as Map<String, dynamic>;
      final id = map['id'] as String?;
      final deptId = map['departmentId'] as String?;
      if (id != null && deptId != null) {
        deptByEmployee[id] = deptId;
      }
    }

    final events = eventsRaw
        .map((e) {
          final event = LeaveCalendarEventModel.fromJson(
            e as Map<String, dynamic>,
          );
          return event.copyWithDepartment(deptByEmployee[event.employeeId]);
        })
        .toList();

    return LeaveCalendarData(events: events, departments: departments);
  }
}
