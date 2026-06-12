import 'package:dio/dio.dart';
import '../auth/auth_storage.dart';
import 'api_endpoints.dart';

typedef UnauthorizedHandler = Future<void> Function();

class ApiClient {
  ApiClient._();

  static Dio? _instance;
  static UnauthorizedHandler? onUnauthorized;

  static Dio get instance {
    _instance ??= _createDio();
    return _instance!;
  }

  static Dio _createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final path = options.path;
          final isAuthRoute = path.contains('/auth/');
          if (!isAuthRoute) {
            final token = await AuthStorage.getToken();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await AuthStorage.clear();
            await onUnauthorized?.call();
          }
          handler.next(error);
        },
      ),
    );

    return dio;
  }

  /// GET that returns null when the endpoint is missing (404).
  static Future<Response<dynamic>?> getOptional(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await instance.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  /// Converts Dio errors into user-friendly messages.
  static String friendlyMessage(Object error) {
    if (error is DioException) {
      final status = error.response?.statusCode;
      if (status == 401) {
        return 'Sesi login telah berakhir. Silakan login kembali.';
      }
      if (status == 404) {
        return 'Fitur belum tersedia di server. Hubungi admin untuk update API.';
      }
      final data = error.response?.data;
      if (data is Map && data['message'] != null) {
        final message = data['message'];
        if (message is String) return message;
        if (message is List && message.isNotEmpty) {
          return message.first.toString();
        }
      }
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.connectionError) {
        return 'Tidak dapat terhubung ke server. Periksa koneksi jaringan.';
      }
      return error.message ?? error.toString();
    }
    return error.toString();
  }
}
