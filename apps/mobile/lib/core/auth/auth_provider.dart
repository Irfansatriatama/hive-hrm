import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'auth_storage.dart';

part 'auth_provider.g.dart';

@Riverpod(keepAlive: true)
class Auth extends _$Auth {
  @override
  Future<String?> build() async {
    return AuthStorage.getToken();
  }

  Future<void> setToken(String token) async {
    await AuthStorage.saveToken(token);
    state = AsyncValue.data(token);
  }

  Future<void> signOut() async {
    await AuthStorage.clear();
    state = const AsyncValue.data(null);
  }

  bool get isAuthenticated => state.valueOrNull != null;
}
