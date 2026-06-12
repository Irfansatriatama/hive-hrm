import 'package:flutter/widgets.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/l10n/l10n.dart';
import '../../../shared/models/attendance_model.dart';
import '../models/attendance_data.dart';
import '../services/gps_service.dart';
import '../services/selfie_upload_service.dart';
import '../widgets/selfie_prompt_sheet.dart';

part 'attendance_provider.g.dart';

@riverpod
class AttendanceSubmitting extends _$AttendanceSubmitting {
  @override
  bool build() => false;

  void setSubmitting(bool value) => state = value;
}

@riverpod
class AttendanceLoadingGps extends _$AttendanceLoadingGps {
  @override
  bool build() => false;

  void setLoading(bool value) => state = value;
}

@riverpod
class Attendance extends _$Attendance {
  int? _month;
  int? _year;
  bool _yearlyView = false;

  @override
  Future<AttendanceData> build() async {
    final now = DateTime.now();
    return _fetchAttendance(
      _month ?? now.month,
      _year ?? now.year,
      yearly: _yearlyView,
    );
  }

  void setPeriod({
    required int month,
    required int year,
    bool yearly = false,
  }) {
    _month = month;
    _year = year;
    _yearlyView = yearly;
    ref.invalidateSelf();
  }

  Future<AttendanceData> _fetchAttendance(
    int month,
    int year, {
    required bool yearly,
  }) async {
    final summaryParams = yearly
        ? {'year': year.toString()}
        : {'month': month.toString(), 'year': year.toString()};

    final historyParams = {'month': month.toString(), 'year': year.toString()};

    final responses = await Future.wait([
      ApiClient.instance.get(ApiEndpoints.attendanceToday),
      ApiClient.instance.get(
        ApiEndpoints.attendanceHistory,
        queryParameters: historyParams,
      ),
      ApiClient.instance.get(
        ApiEndpoints.attendanceSummary,
        queryParameters: summaryParams,
      ),
    ]);

    final AttendanceModel? today =
        AttendanceModel.fromJsonOrNull(responses[0].data);

    final historyRaw = responses[1].data;
    final history = historyRaw is List
        ? historyRaw
            .map((e) => AttendanceModel.fromJson(e as Map<String, dynamic>))
            .toList()
        : <AttendanceModel>[];

    AttendanceSummaryModel? summary;
    if (responses[2].data is Map<String, dynamic>) {
      summary = AttendanceSummaryModel.fromJson(
        responses[2].data as Map<String, dynamic>,
      );
    }

    return AttendanceData(
      today: today,
      history: history,
      summary: summary,
    );
  }

  Future<AttendanceModel?> fetchRecordDetail(String id) async {
    final response = await ApiClient.instance.get(
      '${ApiEndpoints.attendanceRecord}/$id',
    );
    return AttendanceModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<String?> checkIn(BuildContext context) async {
    ref.read(attendanceLoadingGpsProvider.notifier).setLoading(true);
    GpsResult gps;
    try {
      gps = await GpsService.resolve(required: true);
    } finally {
      ref.read(attendanceLoadingGpsProvider.notifier).setLoading(false);
    }

    if (gps.failure != null) {
      if (!context.mounted) return null;
      return _gpsFailureMessage(context, gps.failure!);
    }

    String? selfieUrl;
    if (context.mounted) {
      final photo = await showSelfiePromptSheet(context);
      if (photo != null) {
        selfieUrl = await SelfieUploadService.upload(photo);
      }
    }

    ref.read(attendanceSubmittingProvider.notifier).setSubmitting(true);
    try {
      await ApiClient.instance.post(
        ApiEndpoints.checkIn,
        data: {
          'latitude': gps.latitude,
          'longitude': gps.longitude,
          if (selfieUrl != null) 'selfieUrl': selfieUrl,
        },
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return ApiClient.friendlyMessage(e);
    } finally {
      ref.read(attendanceSubmittingProvider.notifier).setSubmitting(false);
    }
  }

  Future<String?> checkOut(BuildContext context) async {
    ref.read(attendanceLoadingGpsProvider.notifier).setLoading(true);
    GpsResult gps;
    try {
      gps = await GpsService.resolve(required: false);
    } finally {
      ref.read(attendanceLoadingGpsProvider.notifier).setLoading(false);
    }

    ref.read(attendanceSubmittingProvider.notifier).setSubmitting(true);
    try {
      await ApiClient.instance.post(
        ApiEndpoints.checkOut,
        data: {
          if (gps.latitude != null) 'latitude': gps.latitude,
          if (gps.longitude != null) 'longitude': gps.longitude,
        },
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return ApiClient.friendlyMessage(e);
    } finally {
      ref.read(attendanceSubmittingProvider.notifier).setSubmitting(false);
    }
  }

  String _gpsFailureMessage(BuildContext context, GpsFailure failure) {
    final l10n = context.l10n;
    return switch (failure) {
      GpsFailure.permissionDenied => l10n.locationPermissionRequired,
      GpsFailure.serviceDisabled => l10n.gpsServiceDisabled,
      GpsFailure.unavailable => l10n.gpsUnavailable,
    };
  }
}
