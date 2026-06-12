import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/feature_models.dart';

part 'resources_provider.g.dart';

@riverpod
class ResourcesSubmitting extends _$ResourcesSubmitting {
  @override
  bool build() => false;

  void setSubmitting(bool value) => state = value;
}

@riverpod
class Resources extends _$Resources {
  @override
  Future<ResourcesData> build() async => _fetchResources();

  Future<ResourcesData> _fetchResources() async {
    final responses = await Future.wait([
      ApiClient.instance.get(ApiEndpoints.resources),
      ApiClient.instance.get(ApiEndpoints.resourceBookings),
    ]);

    final resources = (responses[0].data as List<dynamic>)
        .map((e) => BookableResourceModel.fromJson(e as Map<String, dynamic>))
        .where((r) => r.type == 'room' || r.type == 'equipment' || r.type == 'vehicle')
        .toList();

    final bookings = (responses[1].data as List<dynamic>)
        .map((e) => ResourceBookingModel.fromJson(e as Map<String, dynamic>))
        .toList();

    return ResourcesData(resources: resources, bookings: bookings);
  }

  Future<List<ResourceBookingModel>> fetchCalendarBookings(DateTime date) async {
    final start = DateTime(date.year, date.month, date.day);
    final end = start.add(const Duration(days: 1));
    final response = await ApiClient.instance.get(
      ApiEndpoints.resourceBookingsCalendar,
      queryParameters: {
        'start': start.toUtc().toIso8601String(),
        'end': end.toUtc().toIso8601String(),
      },
    );
    return (response.data as List<dynamic>)
        .map((e) => ResourceBookingModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<String?> createBooking({
    required String resourceId,
    required String title,
    required DateTime startTime,
    required DateTime endTime,
    String? purpose,
    int? attendees,
  }) async {
    ref.read(resourcesSubmittingProvider.notifier).setSubmitting(true);
    try {
      await ApiClient.instance.post(
        ApiEndpoints.resourceBookings,
        data: {
          'resourceId': resourceId,
          'title': title,
          if (purpose != null && purpose.isNotEmpty) 'purpose': purpose,
          'startTime': startTime.toUtc().toIso8601String(),
          'endTime': endTime.toUtc().toIso8601String(),
          if (attendees != null) 'attendees': attendees,
        },
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    } finally {
      ref.read(resourcesSubmittingProvider.notifier).setSubmitting(false);
    }
  }

  Future<String?> cancelBooking(String id) async {
    try {
      await ApiClient.instance.post('${ApiEndpoints.resourceBookings}/$id/cancel');
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    }
  }

  Future<String?> approveBooking(String id) async {
    try {
      await ApiClient.instance.post(
        '${ApiEndpoints.resourceBookings}/$id/approve',
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    }
  }

  Future<String?> rejectBooking(String id, {String? reason}) async {
    try {
      await ApiClient.instance.post(
        '${ApiEndpoints.resourceBookings}/$id/reject',
        data: {if (reason != null && reason.isNotEmpty) 'reason': reason},
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    }
  }

  Future<String?> confirmBooking(String id) async {
    try {
      await ApiClient.instance.post(ApiEndpoints.resourceBookingConfirm(id));
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    }
  }

  Future<String?> completeBooking(String id) async {
    try {
      await ApiClient.instance.post(ApiEndpoints.resourceBookingComplete(id));
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
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
