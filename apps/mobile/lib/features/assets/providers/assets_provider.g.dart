// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'assets_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$assetsSubmittingHash() => r'fc4f0f0e3b119268f22e1a8a7db499ab2e96aa4b';

/// See also [AssetsSubmitting].
@ProviderFor(AssetsSubmitting)
final assetsSubmittingProvider =
    AutoDisposeNotifierProvider<AssetsSubmitting, bool>.internal(
  AssetsSubmitting.new,
  name: r'assetsSubmittingProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$assetsSubmittingHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$AssetsSubmitting = AutoDisposeNotifier<bool>;
String _$assetsHash() => r'd8ad26fd1ed3e55dee12f8740d3ec86b8ae5e676';

/// See also [Assets].
@ProviderFor(Assets)
final assetsProvider =
    AutoDisposeAsyncNotifierProvider<Assets, AssetsData>.internal(
  Assets.new,
  name: r'assetsProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$assetsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$Assets = AutoDisposeAsyncNotifier<AssetsData>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
