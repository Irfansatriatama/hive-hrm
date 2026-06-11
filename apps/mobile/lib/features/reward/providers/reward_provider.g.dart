// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reward_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$rewardSubmittingHash() => r'46eb07ac686b411e629242ce85dd7ebb67515cc5';

/// See also [RewardSubmitting].
@ProviderFor(RewardSubmitting)
final rewardSubmittingProvider =
    AutoDisposeNotifierProvider<RewardSubmitting, bool>.internal(
  RewardSubmitting.new,
  name: r'rewardSubmittingProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$rewardSubmittingHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$RewardSubmitting = AutoDisposeNotifier<bool>;
String _$rewardHash() => r'b5a24bdcd374027d9f32b80f5404514365b5a10c';

/// See also [Reward].
@ProviderFor(Reward)
final rewardProvider =
    AutoDisposeAsyncNotifierProvider<Reward, RewardData>.internal(
  Reward.new,
  name: r'rewardProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$rewardHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$Reward = AutoDisposeAsyncNotifier<RewardData>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
