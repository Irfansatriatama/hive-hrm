// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'resources_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$resourcesSubmittingHash() =>
    r'8e450f49ec7bd744f9dffc918fc447e2de0c7be6';

/// See also [ResourcesSubmitting].
@ProviderFor(ResourcesSubmitting)
final resourcesSubmittingProvider =
    AutoDisposeNotifierProvider<ResourcesSubmitting, bool>.internal(
  ResourcesSubmitting.new,
  name: r'resourcesSubmittingProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$resourcesSubmittingHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ResourcesSubmitting = AutoDisposeNotifier<bool>;
String _$resourcesHash() => r'c5a873a966cf863e83e707e90cb41892e4998d60';

/// See also [Resources].
@ProviderFor(Resources)
final resourcesProvider =
    AutoDisposeAsyncNotifierProvider<Resources, ResourcesData>.internal(
  Resources.new,
  name: r'resourcesProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$resourcesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$Resources = AutoDisposeAsyncNotifier<ResourcesData>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
