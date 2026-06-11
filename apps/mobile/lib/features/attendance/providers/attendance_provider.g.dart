// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attendance_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$attendanceSubmittingHash() =>
    r'b9adcb1dd3b9461b82568a8dc65cdb9ccbb601b6';

/// See also [AttendanceSubmitting].
@ProviderFor(AttendanceSubmitting)
final attendanceSubmittingProvider =
    AutoDisposeNotifierProvider<AttendanceSubmitting, bool>.internal(
  AttendanceSubmitting.new,
  name: r'attendanceSubmittingProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$attendanceSubmittingHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$AttendanceSubmitting = AutoDisposeNotifier<bool>;
String _$attendanceHash() => r'feeab8703f23911c95dcfdf349c26f7875effd7e';

/// See also [Attendance].
@ProviderFor(Attendance)
final attendanceProvider =
    AutoDisposeAsyncNotifierProvider<Attendance, AttendanceData>.internal(
  Attendance.new,
  name: r'attendanceProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$attendanceHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$Attendance = AutoDisposeAsyncNotifier<AttendanceData>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
