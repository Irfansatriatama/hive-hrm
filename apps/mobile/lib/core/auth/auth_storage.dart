import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthStorage {
  AuthStorage._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _tokenKey = 'auth_token';
  static const _userKey = 'user_id';
  static const _roleKey = 'user_role';

  static Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  static Future<String?> getToken() => _storage.read(key: _tokenKey);

  static Future<void> deleteToken() => _storage.delete(key: _tokenKey);

  static Future<void> saveRole(String role) =>
      _storage.write(key: _roleKey, value: role);

  static Future<String?> getRole() => _storage.read(key: _roleKey);

  static Future<void> deleteRole() => _storage.delete(key: _roleKey);

  static Future<bool> hasToken() async => (await getToken()) != null;

  static Future<void> clear() => _storage.deleteAll();
}
