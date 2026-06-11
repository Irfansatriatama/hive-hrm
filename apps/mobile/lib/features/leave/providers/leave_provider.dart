import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/leave_model.dart';
import '../models/leave_data.dart';

part 'leave_provider.g.dart';

@riverpod
class LeaveSubmitting extends _$LeaveSubmitting {
  @override
  bool build() => false;

  void setSubmitting(bool value) => state = value;
}

@riverpod
Future<List<LeaveTypeModel>> leaveTypes(Ref ref) async {
  final response = await ApiClient.instance.get(ApiEndpoints.leaveTypes);
  return (response.data as List<dynamic>)
      .map((e) => LeaveTypeModel.fromJson(e as Map<String, dynamic>))
      .toList();
}

@riverpod
class Leave extends _$Leave {
  @override
  Future<LeaveData> build() async => _fetchLeave();

  Future<LeaveData> _fetchLeave() async {
    final responses = await Future.wait([
      ApiClient.instance.get(ApiEndpoints.leaveBalances),
      ApiClient.instance.get(ApiEndpoints.leaveMyRequests),
    ]);

    final balances = (responses[0].data as List<dynamic>)
        .map((e) => LeaveBalanceModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final allRequests = (responses[1].data as List<dynamic>)
        .map((e) => LeaveRequestModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final activeRequests =
        allRequests.where((r) => r.isPending).toList(growable: false);
    final history =
        allRequests.where((r) => !r.isPending).toList(growable: false);

    return LeaveData(
      balances: balances,
      activeRequests: activeRequests,
      history: history,
    );
  }

  Future<String?> applyLeave({
    required String leaveTypeId,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
  }) async {
    ref.read(leaveSubmittingProvider.notifier).setSubmitting(true);
    try {
      final totalDays = endDate.difference(startDate).inDays + 1;
      await ApiClient.instance.post(
        ApiEndpoints.leaveRequests,
        data: {
          'leaveTypeId': leaveTypeId,
          'startDate': _formatDate(startDate),
          'endDate': _formatDate(endDate),
          'totalDays': totalDays,
          'reason': reason,
        },
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    } finally {
      ref.read(leaveSubmittingProvider.notifier).setSubmitting(false);
    }
  }

  String _formatDate(DateTime date) =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

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
