// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'visitor_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$visitorSubmittingHash() => r'd1c35c60e7d5c7a2d5b7f423e01627829d1b580a';

/// See also [VisitorSubmitting].
@ProviderFor(VisitorSubmitting)
final visitorSubmittingProvider =
    AutoDisposeNotifierProvider<VisitorSubmitting, bool>.internal(
  VisitorSubmitting.new,
  name: r'visitorSubmittingProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$visitorSubmittingHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$VisitorSubmitting = AutoDisposeNotifier<bool>;
String _$visitorHash() => r'9f6662da8642422747fd5a06a6ec1a790a5ea5cd';

/// See also [Visitor].
@ProviderFor(Visitor)
final visitorProvider =
    AutoDisposeAsyncNotifierProvider<Visitor, List<VisitorModel>>.internal(
  Visitor.new,
  name: r'visitorProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$visitorHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$Visitor = AutoDisposeAsyncNotifier<List<VisitorModel>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
