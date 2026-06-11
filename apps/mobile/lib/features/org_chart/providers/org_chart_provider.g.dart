// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'org_chart_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$orgChartFilterHash() => r'ab4a5fe42276f2ddf172b6f5a5ec4a48287bbc64';

/// See also [OrgChartFilter].
@ProviderFor(OrgChartFilter)
final orgChartFilterProvider =
    NotifierProvider<OrgChartFilter, String?>.internal(
  OrgChartFilter.new,
  name: r'orgChartFilterProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$orgChartFilterHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$OrgChartFilter = Notifier<String?>;
String _$orgChartHash() => r'df97892ff075621201a8c6e2a82b13f2595fd72e';

/// See also [OrgChart].
@ProviderFor(OrgChart)
final orgChartProvider =
    AutoDisposeAsyncNotifierProvider<OrgChart, OrgChartData>.internal(
  OrgChart.new,
  name: r'orgChartProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$orgChartHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$OrgChart = AutoDisposeAsyncNotifier<OrgChartData>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
