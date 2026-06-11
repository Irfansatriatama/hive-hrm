import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/feature_models.dart';
import '../../profile/providers/profile_provider.dart';

part 'shift_provider.g.dart';

DateTime getMonday(DateTime date) {
  final d = DateTime(date.year, date.month, date.day);
  final weekday = d.weekday;
  return d.subtract(Duration(days: weekday - 1));
}

String formatDateOnly(DateTime date) {
  final y = date.year.toString().padLeft(4, '0');
  final m = date.month.toString().padLeft(2, '0');
  final d = date.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}

@Riverpod(keepAlive: true)
class ShiftWeekStart extends _$ShiftWeekStart {
  @override
  DateTime build() => getMonday(DateTime.now());

  void setWeek(DateTime monday) => state = getMonday(monday);

  void previousWeek() => state = state.subtract(const Duration(days: 7));

  void nextWeek() => state = state.add(const Duration(days: 7));

  void goToToday() => state = getMonday(DateTime.now());
}

@riverpod
class ShiftSubmitting extends _$ShiftSubmitting {
  @override
  bool build() => false;

  void setSubmitting(bool value) => state = value;
}

@riverpod
class Shift extends _$Shift {
  @override
  Future<ShiftData> build() async {
    final weekStart = ref.watch(shiftWeekStartProvider);
    return _fetchShift(weekStart);
  }

  Future<ShiftData> _fetchShift(DateTime weekStart) async {
    final weekStartStr = formatDateOnly(weekStart);
    final profile = await ref.watch(profileProvider.future);

    final responses = await Future.wait([
      ApiClient.instance.get(
        ApiEndpoints.shiftSchedules,
        queryParameters: {'weekStart': weekStartStr},
      ),
      ApiClient.instance.get(ApiEndpoints.shiftSwaps),
      ApiClient.instance.get(
        ApiEndpoints.employees,
        queryParameters: {'limit': '1000'},
      ),
    ]);

    final scheduleData = responses[0].data as Map<String, dynamic>;
    final allSchedules = (scheduleData['schedules'] as List<dynamic>? ?? [])
        .map(
          (e) => ShiftScheduleEntryModel.fromJson(e as Map<String, dynamic>),
        )
        .where((s) => s.employeeId == profile.id)
        .toList();

    final swaps = (responses[1].data as List<dynamic>)
        .map((e) => ShiftSwapModel.fromJson(e as Map<String, dynamic>))
        .where(
          (s) => s.requesterId == profile.id || s.partnerId == profile.id,
        )
        .toList();

    final employeesRaw = responses[2].data;
    final employeesList = employeesRaw is Map && employeesRaw['employees'] is List
        ? employeesRaw['employees'] as List<dynamic>
        : employeesRaw is List
            ? employeesRaw
            : <dynamic>[];

    final colleagues = employeesList
        .map((e) => ShiftColleagueModel.fromJson(e as Map<String, dynamic>))
        .where((e) => e.id != profile.id && e.name.isNotEmpty)
        .toList()
      ..sort((a, b) => a.name.compareTo(b.name));

    return ShiftData(
      employeeId: profile.id,
      weekStart: weekStart,
      mySchedules: allSchedules,
      swaps: swaps,
      colleagues: colleagues,
    );
  }

  Future<String?> createSwap({
    required String partnerId,
    required String date,
    required String shiftDetails,
  }) async {
    ref.read(shiftSubmittingProvider.notifier).setSubmitting(true);
    try {
      await ApiClient.instance.post(
        ApiEndpoints.shiftSwaps,
        data: {
          'partnerId': partnerId,
          'date': date,
          'shiftDetails': shiftDetails,
        },
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return e.toString();
    } finally {
      ref.read(shiftSubmittingProvider.notifier).setSubmitting(false);
    }
  }
}
