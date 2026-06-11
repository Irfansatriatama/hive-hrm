import 'package:json_annotation/json_annotation.dart';

part 'attendance_model.g.dart';

@JsonSerializable()
class AttendanceModel {
  final String id;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final String? status;
  final double? workHours;
  final double? latitude;
  final double? longitude;
  final String? selfieUrl;

  const AttendanceModel({
    required this.id,
    this.checkIn,
    this.checkOut,
    this.status,
    this.workHours,
    this.latitude,
    this.longitude,
    this.selfieUrl,
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) =>
      _$AttendanceModelFromJson(json);

  Map<String, dynamic> toJson() => _$AttendanceModelToJson(this);
}
