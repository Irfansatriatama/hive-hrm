import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/feature_models.dart';

part 'assets_provider.g.dart';

@riverpod
class AssetsSubmitting extends _$AssetsSubmitting {
  @override
  bool build() => false;

  void setSubmitting(bool value) => state = value;
}

@riverpod
class Assets extends _$Assets {
  @override
  Future<AssetsData> build() async => _fetchAssets();

  Future<AssetsData> _fetchAssets() async {
    final responses = await Future.wait([
      ApiClient.instance.get(ApiEndpoints.assets),
      ApiClient.instance.get(ApiEndpoints.assetRequestsList),
    ]);

    final assets = (responses[0].data as List<dynamic>)
        .map((e) => AssetModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final requests = (responses[1].data as List<dynamic>)
        .map((e) => AssetRequestModel.fromJson(e as Map<String, dynamic>))
        .toList();

    return AssetsData(assets: assets, requests: requests);
  }

  Future<String?> createRequest({
    required String assetName,
    required String reason,
    required int duration,
  }) async {
    ref.read(assetsSubmittingProvider.notifier).setSubmitting(true);
    try {
      await ApiClient.instance.post(
        ApiEndpoints.assetRequests,
        data: {
          'assetName': assetName,
          'reason': reason,
          'duration': duration,
        },
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return _extractError(e);
    } finally {
      ref.read(assetsSubmittingProvider.notifier).setSubmitting(false);
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
