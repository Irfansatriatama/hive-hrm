import 'package:json_annotation/json_annotation.dart';

part 'attendance_model.g.dart';

@JsonSerializable()
class AttendanceModel {
  final String id;
  final DateTime? date;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final String? status;
  final double? workHours;
  final int? lateMinutes;
  final int? overtimeMinutes;
  final int? earlyLeaveMinutes;
  final String? location;
  final String? notes;
  final String? checkInNote;
  final String? checkOutNote;
  final double? latitude;
  final double? longitude;
  final double? checkInLatitude;
  final double? checkInLongitude;
  final double? checkOutLatitude;
  final double? checkOutLongitude;
  final String? selfieUrl;

  const AttendanceModel({
    required this.id,
    this.date,
    this.checkIn,
    this.checkOut,
    this.status,
    this.workHours,
    this.lateMinutes,
    this.overtimeMinutes,
    this.earlyLeaveMinutes,
    this.location,
    this.notes,
    this.checkInNote,
    this.checkOutNote,
    this.latitude,
    this.longitude,
    this.checkInLatitude,
    this.checkInLongitude,
    this.checkOutLatitude,
    this.checkOutLongitude,
    this.selfieUrl,
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) =>
      _$AttendanceModelFromJson(json);

  static AttendanceModel? fromJsonOrNull(dynamic json) {
    if (json == null || json is! Map<String, dynamic>) return null;
    return AttendanceModel.fromJson(json);
  }

  double? get effectiveCheckInLat => checkInLatitude ?? latitude;
  double? get effectiveCheckInLng => checkInLongitude ?? longitude;

  bool get hasCheckInGps =>
      effectiveCheckInLat != null && effectiveCheckInLng != null;

  bool get hasCheckOutGps =>
      checkOutLatitude != null && checkOutLongitude != null;

  String? get checkInLocationLabel {
    if (hasCheckInGps) {
      return '${effectiveCheckInLat!.toStringAsFixed(5)}, ${effectiveCheckInLng!.toStringAsFixed(5)}';
    }
    if (location != null && location!.isNotEmpty) return location;
    return null;
  }

  String? get checkOutLocationLabel {
    if (hasCheckOutGps) {
      return '${checkOutLatitude!.toStringAsFixed(5)}, ${checkOutLongitude!.toStringAsFixed(5)}';
    }
    return null;
  }

  bool get hasGps => hasCheckInGps;

  String? get displayLocation => checkInLocationLabel;

  bool get hasOvertime => (overtimeMinutes ?? 0) > 0;

  bool get hasSelfie => selfieUrl != null && selfieUrl!.isNotEmpty;

  Map<String, dynamic> toJson() => _$AttendanceModelToJson(this);
}

@JsonSerializable()
class AttendanceSummaryModel {
  final String period;
  final int? month;
  final int year;
  final int totalRecords;
  final int present;
  final int late;
  final int absent;
  final double totalWorkHours;
  final double avgWorkHours;
  final int totalOvertimeMinutes;
  final double totalOvertimeHours;
  final int totalLateMinutes;

  const AttendanceSummaryModel({
    required this.period,
    this.month,
    required this.year,
    required this.totalRecords,
    required this.present,
    required this.late,
    required this.absent,
    required this.totalWorkHours,
    required this.avgWorkHours,
    required this.totalOvertimeMinutes,
    required this.totalOvertimeHours,
    required this.totalLateMinutes,
  });

  factory AttendanceSummaryModel.fromJson(Map<String, dynamic> json) =>
      _$AttendanceSummaryModelFromJson(json);
}
