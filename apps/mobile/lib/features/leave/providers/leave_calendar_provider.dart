import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/feature_models.dart';

part 'leave_calendar_provider.g.dart';

@riverpod
class LeaveCalendar extends _$LeaveCalendar {
  int? _year;
  int? _month;

  @override
  Future<LeaveCalendarData> build() async {
    final now = DateTime.now();
    return _fetchCalendar(_year ?? now.year, _month ?? now.month);
  }

  Future<void> loadMonth(int year, int month) async {
    _year = year;
    _month = month;
    ref.invalidateSelf();
    await future;
  }

  Future<LeaveCalendarData> _fetchCalendar(int year, int month) async {
    final response = await ApiClient.instance.get(
      ApiEndpoints.leaveCalendar,
      queryParameters: {
        'year': year.toString(),
        'month': month.toString(),
      },
    );

    final calendarRaw = response.data as Map<String, dynamic>;
    final eventsRaw = calendarRaw['events'] as List<dynamic>? ?? [];
    final holidaysRaw = calendarRaw['holidays'] as List<dynamic>? ?? [];
    final departmentsRaw = calendarRaw['departments'] as List<dynamic>? ?? [];
    final currentEmployeeId = calendarRaw['currentEmployeeId'] as String?;

    final events = eventsRaw
        .map(
          (e) => LeaveCalendarEventModel.fromJson(e as Map<String, dynamic>),
        )
        .toList();

    final holidays = holidaysRaw
        .map(
          (e) => LeaveCalendarHolidayModel.fromJson(
            e as Map<String, dynamic>,
          ),
        )
        .toList();

    final departments = departmentsRaw
        .map(
          (e) => LeaveCalendarDepartmentModel.fromJson(
            e as Map<String, dynamic>,
          ),
        )
        .toList();

    return LeaveCalendarData(
      events: events,
      departments: departments,
      holidays: holidays,
      currentEmployeeId: currentEmployeeId,
    );
  }
}
