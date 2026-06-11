import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../shared/models/employee_model.dart';

part 'profile_provider.g.dart';

@riverpod
class Profile extends _$Profile {
  @override
  Future<EmployeeModel> build() async {
    final response = await ApiClient.instance.get(ApiEndpoints.me);
    return EmployeeModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> signOut() async {
    await ref.read(authProvider.notifier).signOut();
  }

  Future<String?> requestUpdate({
    required String name,
    required String phone,
    required String address,
    required String reason,
  }) async {
    try {
      await ApiClient.instance.post(
        ApiEndpoints.profileRequest,
        data: {
          'type': 'profile',
          'summary': 'Update Data Pribadi',
          'details': {
            'full_name': name,
            'phone': phone,
            'address': address,
          },
          'reason': reason,
        },
      );
      return null;
    } catch (e) {
      return e.toString();
    }
  }
}
