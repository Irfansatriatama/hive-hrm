import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/approval_model.dart';

part 'approval_provider.g.dart';

@riverpod
class ApprovalSubmitting extends _$ApprovalSubmitting {
  @override
  bool build() => false;

  void setSubmitting(bool value) => state = value;
}

@riverpod
class ApprovalInbox extends _$ApprovalInbox {
  @override
  Future<List<ApprovalInboxModel>> build() async => _fetchInbox();

  Future<List<ApprovalInboxModel>> _fetchInbox() async {
    final response = await ApiClient.instance.get(ApiEndpoints.approvalInbox);
    final raw = response.data;
    if (raw is! List) return [];
    return raw
        .map((e) => ApprovalInboxModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<String?> approve(ApprovalInboxModel item) =>
      _submitAction(item, 'approve');

  Future<String?> reject(ApprovalInboxModel item) =>
      _submitAction(item, 'reject');

  Future<String?> _submitAction(
    ApprovalInboxModel item,
    String action,
  ) async {
    ref.read(approvalSubmittingProvider.notifier).setSubmitting(true);
    try {
      await ApiClient.instance.post(
        ApiEndpoints.approvalAction,
        data: {
          'type': item.type,
          'id': item.id,
          'action': action,
        },
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    } finally {
      ref.read(approvalSubmittingProvider.notifier).setSubmitting(false);
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
