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
  final String? location;
  final double? latitude;
  final double? longitude;
  final String? selfieUrl;

  const AttendanceModel({
    required this.id,
    this.date,
    this.checkIn,
    this.checkOut,
    this.status,
    this.workHours,
    this.location,
    this.latitude,
    this.longitude,
    this.selfieUrl,
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) =>
      _$AttendanceModelFromJson(json);

  /// Handles API responses where no attendance record exists yet (empty body).
  static AttendanceModel? fromJsonOrNull(dynamic json) {
    if (json == null || json is! Map<String, dynamic>) return null;
    return AttendanceModel.fromJson(json);
  }

  Map<String, dynamic> toJson() => _$AttendanceModelToJson(this);
}
