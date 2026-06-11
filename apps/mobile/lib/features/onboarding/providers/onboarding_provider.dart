import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/onboarding_model.dart';

part 'onboarding_provider.g.dart';

@riverpod
class OnboardingUpdating extends _$OnboardingUpdating {
  @override
  String? build() => null;

  void setUpdating(String? taskId) => state = taskId;
}

@riverpod
class Onboarding extends _$Onboarding {
  @override
  Future<OnboardingAssignmentModel?> build() async => _fetchAssignment();

  Future<OnboardingAssignmentModel?> _fetchAssignment() async {
    final response = await ApiClient.instance.get(ApiEndpoints.onboardingMy);
    final data = response.data;
    if (data == null) return null;
    return OnboardingAssignmentModel.fromJson(data as Map<String, dynamic>);
  }

  Future<String?> markTaskDone({
    required String assignmentId,
    required String taskId,
  }) async {
    ref.read(onboardingUpdatingProvider.notifier).setUpdating(taskId);
    try {
      await ApiClient.instance.put(
        '/onboarding/assignments/$assignmentId/tasks/$taskId',
        data: {'status': 'done'},
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    } finally {
      ref.read(onboardingUpdatingProvider.notifier).setUpdating(null);
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
