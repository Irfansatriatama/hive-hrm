// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'leave_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$leaveTypesHash() => r'1e457abf308520447749be7e30bb9f47614f36dc';

/// See also [leaveTypes].
@ProviderFor(leaveTypes)
final leaveTypesProvider =
    AutoDisposeFutureProvider<List<LeaveTypeModel>>.internal(
  leaveTypes,
  name: r'leaveTypesProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$leaveTypesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef LeaveTypesRef = AutoDisposeFutureProviderRef<List<LeaveTypeModel>>;
String _$leaveSubmittingHash() => r'd231a401b4d4affd9f477623a820b3683c9a7394';

/// See also [LeaveSubmitting].
@ProviderFor(LeaveSubmitting)
final leaveSubmittingProvider =
    AutoDisposeNotifierProvider<LeaveSubmitting, bool>.internal(
  LeaveSubmitting.new,
  name: r'leaveSubmittingProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$leaveSubmittingHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$LeaveSubmitting = AutoDisposeNotifier<bool>;
String _$leaveHash() => r'3f1c179daa17f8daf0ba8cbbd04af297acfe27f3';

/// See also [Leave].
@ProviderFor(Leave)
final leaveProvider =
    AutoDisposeAsyncNotifierProvider<Leave, LeaveData>.internal(
  Leave.new,
  name: r'leaveProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$leaveHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$Leave = AutoDisposeAsyncNotifier<LeaveData>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
