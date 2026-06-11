import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/expense_model.dart';

part 'expense_provider.g.dart';

@riverpod
class ExpenseSubmitting extends _$ExpenseSubmitting {
  @override
  bool build() => false;

  void setSubmitting(bool value) => state = value;
}

@riverpod
class Expense extends _$Expense {
  @override
  Future<ExpenseData> build() async => _fetchExpense();

  Future<ExpenseData> _fetchExpense() async {
    final responses = await Future.wait([
      ApiClient.instance.get(ApiEndpoints.expenseClaims),
      ApiClient.instance.get(ApiEndpoints.expenseCategories),
    ]);

    final claims = (responses[0].data as List<dynamic>)
        .map((e) => ExpenseClaimModel.fromJson(e as Map<String, dynamic>))
        .toList();
    final categories = (responses[1].data as List<dynamic>)
        .map((e) => ExpenseCategoryModel.fromJson(e as Map<String, dynamic>))
        .where((e) => e.isActive)
        .toList();

    return ExpenseData(claims: claims, categories: categories);
  }

  Future<String?> createAndSubmit({
    required String title,
    String? description,
    required List<Map<String, dynamic>> items,
  }) async {
    ref.read(expenseSubmittingProvider.notifier).setSubmitting(true);
    try {
      final claimRes = await ApiClient.instance.post(
        ApiEndpoints.expenseClaims,
        data: {
          'title': title,
          if (description != null && description.isNotEmpty)
            'description': description,
        },
      );
      final claimId = (claimRes.data as Map<String, dynamic>)['id'] as String;

      for (final item in items) {
        await ApiClient.instance.post(
          '${ApiEndpoints.expenseClaims}/$claimId/items',
          data: item,
        );
      }

      await ApiClient.instance.post(
        '${ApiEndpoints.expenseClaims}/$claimId/submit',
      );

      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    } finally {
      ref.read(expenseSubmittingProvider.notifier).setSubmitting(false);
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
