import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:dio/dio.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import 'auth_storage.dart';
import 'user_role_provider.dart';

part 'auth_provider.g.dart';

@Riverpod(keepAlive: true)
class Auth extends _$Auth {
  @override
  Future<String?> build() async {
    final token = await AuthStorage.getToken();
    if (token == null) return null;

    try {
      await ApiClient.instance.get(ApiEndpoints.me);
      return token;
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        await AuthStorage.clear();
        return null;
      }
      // Network/server unreachable — keep stored token for offline retry
      return token;
    }
  }

  Future<void> setToken(String token) async {
    await AuthStorage.saveToken(token);
    state = AsyncValue.data(token);
  }

  Future<void> signOut() async {
    await AuthStorage.clear();
    await ref.read(userRoleProvider.notifier).clear();
    state = const AsyncValue.data(null);
  }

  bool get isAuthenticated => state.valueOrNull != null;
}
