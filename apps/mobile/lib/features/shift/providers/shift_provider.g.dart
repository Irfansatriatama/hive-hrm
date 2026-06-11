// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shift_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$shiftWeekStartHash() => r'cd321c01a81e091789b854c5ec9f7652c876e43d';

/// See also [ShiftWeekStart].
@ProviderFor(ShiftWeekStart)
final shiftWeekStartProvider =
    NotifierProvider<ShiftWeekStart, DateTime>.internal(
  ShiftWeekStart.new,
  name: r'shiftWeekStartProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$shiftWeekStartHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ShiftWeekStart = Notifier<DateTime>;
String _$shiftSubmittingHash() => r'3f6bbed50aed7a2ae5eecbff0091324a9705f9c9';

/// See also [ShiftSubmitting].
@ProviderFor(ShiftSubmitting)
final shiftSubmittingProvider =
    AutoDisposeNotifierProvider<ShiftSubmitting, bool>.internal(
  ShiftSubmitting.new,
  name: r'shiftSubmittingProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$shiftSubmittingHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ShiftSubmitting = AutoDisposeNotifier<bool>;
String _$shiftHash() => r'67747ccd19d047330b805cd7b26de46591e423a1';

/// See also [Shift].
@ProviderFor(Shift)
final shiftProvider =
    AutoDisposeAsyncNotifierProvider<Shift, ShiftData>.internal(
  Shift.new,
  name: r'shiftProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$shiftHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$Shift = AutoDisposeAsyncNotifier<ShiftData>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
