import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/feature_models.dart';
import '../../profile/providers/profile_provider.dart';

part 'visitor_provider.g.dart';

@riverpod
class VisitorSubmitting extends _$VisitorSubmitting {
  @override
  bool build() => false;

  void setSubmitting(bool value) => state = value;
}

@riverpod
class Visitor extends _$Visitor {
  @override
  Future<List<VisitorModel>> build() async => _fetchVisitors();

  Future<List<VisitorModel>> _fetchVisitors() async {
    final response = await ApiClient.instance.get(ApiEndpoints.visitors);
    return (response.data as List<dynamic>)
        .map((e) => VisitorModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<String?> checkIn({
    required String visitorName,
    required String company,
    required String idNumber,
    required String phone,
    required String purpose,
    String? hostEmployeeId,
    String idType = 'KTP',
  }) async {
    ref.read(visitorSubmittingProvider.notifier).setSubmitting(true);
    try {
      final profile = await ref.read(profileProvider.future);
      await ApiClient.instance.post(
        ApiEndpoints.visitors,
        data: {
          'visitorName': visitorName,
          'company': company,
          'idNumber': idNumber,
          'phone': phone,
          'purpose': purpose,
          'idType': idType,
          'hostEmployeeId': hostEmployeeId ?? profile.id,
        },
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    } finally {
      ref.read(visitorSubmittingProvider.notifier).setSubmitting(false);
    }
  }

  Future<String?> checkOut(String id) async {
    try {
      await ApiClient.instance.post('${ApiEndpoints.visitors}/$id/check-out');
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
