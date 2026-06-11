import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/attendance_model.dart';
import '../models/attendance_data.dart';

part 'attendance_provider.g.dart';

@riverpod
class AttendanceSubmitting extends _$AttendanceSubmitting {
  @override
  bool build() => false;

  void setSubmitting(bool value) => state = value;
}

@riverpod
class Attendance extends _$Attendance {
  @override
  Future<AttendanceData> build() async => _fetchAttendance();

  Future<AttendanceData> _fetchAttendance() async {
    final responses = await Future.wait([
      ApiClient.instance.get(ApiEndpoints.attendanceToday),
      ApiClient.instance.get(ApiEndpoints.attendanceHistory),
    ]);

    final todayData = responses[0].data;
    final AttendanceModel? today = todayData == null
        ? null
        : AttendanceModel.fromJson(todayData as Map<String, dynamic>);

    final historyRaw = responses[1].data;
    final history = historyRaw is List
        ? historyRaw
            .map((e) => AttendanceModel.fromJson(e as Map<String, dynamic>))
            .toList()
        : <AttendanceModel>[];

    return AttendanceData(today: today, history: history);
  }

  Future<String?> checkIn() async {
    ref.read(attendanceSubmittingProvider.notifier).setSubmitting(true);
    try {
      await ApiClient.instance.post(ApiEndpoints.checkIn, data: {});
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    } finally {
      ref.read(attendanceSubmittingProvider.notifier).setSubmitting(false);
    }
  }

  Future<String?> checkOut() async {
    ref.read(attendanceSubmittingProvider.notifier).setSubmitting(true);
    try {
      await ApiClient.instance.post(ApiEndpoints.checkOut, data: {});
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    } finally {
      ref.read(attendanceSubmittingProvider.notifier).setSubmitting(false);
    }
  }

  String _extractError(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map && data['message'] != null) {
        final message = data['message'];
        if (message is String) return message;
        if (message is List && message.isNotEmpty) {
          return message.first.toString();
        }
      }
      return error.message ?? error.toString();
    }
    return error.toString();
  }
}
