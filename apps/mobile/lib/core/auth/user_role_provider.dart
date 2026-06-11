import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'auth_storage.dart';

part 'user_role_provider.g.dart';

const approverRoles = {'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'};

const resourceApproverRoles = {'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'};

const visitorStaffRoles = {'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'};

bool canApproveInbox(String? role) =>
    approverRoles.contains(role?.toUpperCase());

bool isResourceApprover(String? role) =>
    resourceApproverRoles.contains(role?.toUpperCase());

bool isVisitorStaff(String? role) =>
    visitorStaffRoles.contains(role?.toUpperCase());

@Riverpod(keepAlive: true)
class UserRole extends _$UserRole {
  @override
  Future<String?> build() async => AuthStorage.getRole();

  Future<void> setRole(String role) async {
    await AuthStorage.saveRole(role);
    state = AsyncValue.data(role);
  }

  Future<void> clear() async {
    await AuthStorage.deleteRole();
    state = const AsyncValue.data(null);
  }
}

@riverpod
bool canApprove(CanApproveRef ref) {
  final role = ref.watch(userRoleProvider).valueOrNull;
  return canApproveInbox(role);
}

@riverpod
bool canApproveResources(CanApproveResourcesRef ref) {
  final role = ref.watch(userRoleProvider).valueOrNull;
  return isResourceApprover(role);
}

@riverpod
bool canViewAllVisitors(CanViewAllVisitorsRef ref) {
  final role = ref.watch(userRoleProvider).valueOrNull;
  return isVisitorStaff(role);
}
