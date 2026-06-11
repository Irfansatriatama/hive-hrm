import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/auth/user_role_provider.dart';

part 'login_provider.g.dart';

@riverpod
class LoginNotifier extends _$LoginNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<bool> signIn(String email, String password) async {
    state = const AsyncLoading();
    try {
      final response = await ApiClient.instance.post(
        ApiEndpoints.mobileSignIn,
        data: {'email': email, 'password': password},
      );
      final token = response.data['token'] as String;
      final user = response.data['user'] as Map<String, dynamic>;
      final role = user['role'] as String? ?? 'EMPLOYEE';
      await ref.read(authProvider.notifier).setToken(token);
      await ref.read(userRoleProvider.notifier).setRole(role);
      state = const AsyncData(null);
      return true;
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
      return false;
    }
  }
}
