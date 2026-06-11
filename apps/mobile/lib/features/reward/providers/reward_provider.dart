import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/reward_model.dart';

part 'reward_provider.g.dart';

@riverpod
class RewardSubmitting extends _$RewardSubmitting {
  @override
  bool build() => false;

  void setSubmitting(bool value) => state = value;
}

@riverpod
class Reward extends _$Reward {
  @override
  Future<RewardData> build() async => _fetchReward();

  Future<RewardData> _fetchReward() async {
    final responses = await Future.wait([
      ApiClient.instance.get(ApiEndpoints.rewardBalance),
      ApiClient.instance.get(ApiEndpoints.rewardCatalog),
      ApiClient.instance.get(ApiEndpoints.rewardHashtags),
      ApiClient.instance.get(ApiEndpoints.rewardFeed),
      ApiClient.instance.get(ApiEndpoints.rewardTransactions),
      ApiClient.instance.get(
        ApiEndpoints.employees,
        queryParameters: {'limit': '1000'},
      ),
      ApiClient.instance.get(ApiEndpoints.me),
    ]);

    final balance = _parseBalance(responses[0].data);
    final catalog = (responses[1].data as List<dynamic>)
        .map((e) => RewardCatalogModel.fromJson(e as Map<String, dynamic>))
        .where((e) => e.isActive)
        .toList();
    final hashtags = (responses[2].data as List<dynamic>)
        .map((e) => RewardHashtagModel.fromJson(e as Map<String, dynamic>))
        .where((e) => e.isActive)
        .toList();
    final feed = (responses[3].data as List<dynamic>)
        .map((e) =>
            RewardTransactionModel.fromJson(e as Map<String, dynamic>))
        .toList();
    final transactions = (responses[4].data as List<dynamic>)
        .map((e) =>
            RewardTransactionModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final employeesRaw = responses[5].data;
    final myProfile = responses[6].data as Map<String, dynamic>;
    final myId = myProfile['id'] as String?;

    final employeesList = employeesRaw is Map && employeesRaw['employees'] is List
        ? employeesRaw['employees'] as List<dynamic>
        : employeesRaw is List
            ? employeesRaw
            : <dynamic>[];

    final colleagues = employeesList
        .map((e) => RewardColleagueModel.fromJson(e as Map<String, dynamic>))
        .where((e) => e.id != myId && e.name.isNotEmpty)
        .toList();

    return RewardData(
      balance: balance,
      catalog: catalog,
      hashtags: hashtags,
      feed: feed,
      transactions: transactions,
      colleagues: colleagues,
    );
  }

  int _parseBalance(dynamic data) {
    if (data is num) return data.toInt();
    if (data is Map && data['balance'] is num) {
      return (data['balance'] as num).toInt();
    }
    return 0;
  }

  Future<String?> redeem(String itemId) async {
    ref.read(rewardSubmittingProvider.notifier).setSubmitting(true);
    try {
      await ApiClient.instance.post(
        ApiEndpoints.rewardRedeem,
        data: {'itemId': itemId},
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    } finally {
      ref.read(rewardSubmittingProvider.notifier).setSubmitting(false);
    }
  }

  Future<String?> sendAppreciation({
    required String recipientId,
    required String hashtag,
    required int points,
    required String message,
  }) async {
    ref.read(rewardSubmittingProvider.notifier).setSubmitting(true);
    try {
      await ApiClient.instance.post(
        ApiEndpoints.rewardAppreciation,
        data: {
          'recipientId': recipientId,
          'hashtag': hashtag,
          'points': points,
          'message': message,
        },
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    } finally {
      ref.read(rewardSubmittingProvider.notifier).setSubmitting(false);
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
