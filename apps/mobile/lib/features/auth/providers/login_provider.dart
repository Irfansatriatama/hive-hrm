import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/auth/auth_provider.dart';

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
      await ref.read(authProvider.notifier).setToken(token);
      state = const AsyncData(null);
      return true;
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
      return false;
    }
  }
}
