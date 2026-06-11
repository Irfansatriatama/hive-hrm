// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'approval_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$approvalSubmittingHash() =>
    r'25cd810f5ba36004a39b434e6aa756654cd52fa6';

/// See also [ApprovalSubmitting].
@ProviderFor(ApprovalSubmitting)
final approvalSubmittingProvider =
    AutoDisposeNotifierProvider<ApprovalSubmitting, bool>.internal(
  ApprovalSubmitting.new,
  name: r'approvalSubmittingProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$approvalSubmittingHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ApprovalSubmitting = AutoDisposeNotifier<bool>;
String _$approvalInboxHash() => r'16875f296f332104fc7f1c40e7470ec9ad7d54fd';

/// See also [ApprovalInbox].
@ProviderFor(ApprovalInbox)
final approvalInboxProvider = AutoDisposeAsyncNotifierProvider<ApprovalInbox,
    List<ApprovalInboxModel>>.internal(
  ApprovalInbox.new,
  name: r'approvalInboxProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$approvalInboxHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ApprovalInbox = AutoDisposeAsyncNotifier<List<ApprovalInboxModel>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
