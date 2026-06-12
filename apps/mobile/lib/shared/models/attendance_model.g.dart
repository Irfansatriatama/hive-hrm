// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attendance_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AttendanceModel _$AttendanceModelFromJson(Map<String, dynamic> json) =>
    AttendanceModel(
      id: json['id'] as String,
      date:
          json['date'] == null ? null : DateTime.parse(json['date'] as String),
      checkIn: json['checkIn'] == null
          ? null
          : DateTime.parse(json['checkIn'] as String),
      checkOut: json['checkOut'] == null
          ? null
          : DateTime.parse(json['checkOut'] as String),
      status: json['status'] as String?,
      workHours: (json['workHours'] as num?)?.toDouble(),
      lateMinutes: (json['lateMinutes'] as num?)?.toInt(),
      overtimeMinutes: (json['overtimeMinutes'] as num?)?.toInt(),
      earlyLeaveMinutes: (json['earlyLeaveMinutes'] as num?)?.toInt(),
      location: json['location'] as String?,
      notes: json['notes'] as String?,
      checkInNote: json['checkInNote'] as String?,
      checkOutNote: json['checkOutNote'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      checkInLatitude: (json['checkInLatitude'] as num?)?.toDouble(),
      checkInLongitude: (json['checkInLongitude'] as num?)?.toDouble(),
      checkOutLatitude: (json['checkOutLatitude'] as num?)?.toDouble(),
      checkOutLongitude: (json['checkOutLongitude'] as num?)?.toDouble(),
      selfieUrl: json['selfieUrl'] as String?,
    );

Map<String, dynamic> _$AttendanceModelToJson(AttendanceModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'date': instance.date?.toIso8601String(),
      'checkIn': instance.checkIn?.toIso8601String(),
      'checkOut': instance.checkOut?.toIso8601String(),
      'status': instance.status,
      'workHours': instance.workHours,
      'lateMinutes': instance.lateMinutes,
      'overtimeMinutes': instance.overtimeMinutes,
      'earlyLeaveMinutes': instance.earlyLeaveMinutes,
      'location': instance.location,
      'notes': instance.notes,
      'checkInNote': instance.checkInNote,
      'checkOutNote': instance.checkOutNote,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'checkInLatitude': instance.checkInLatitude,
      'checkInLongitude': instance.checkInLongitude,
      'checkOutLatitude': instance.checkOutLatitude,
      'checkOutLongitude': instance.checkOutLongitude,
      'selfieUrl': instance.selfieUrl,
    };

AttendanceSummaryModel _$AttendanceSummaryModelFromJson(
        Map<String, dynamic> json) =>
    AttendanceSummaryModel(
      period: json['period'] as String,
      month: (json['month'] as num?)?.toInt(),
      year: (json['year'] as num).toInt(),
      totalRecords: (json['totalRecords'] as num).toInt(),
      present: (json['present'] as num).toInt(),
      late: (json['late'] as num).toInt(),
      absent: (json['absent'] as num).toInt(),
      totalWorkHours: (json['totalWorkHours'] as num).toDouble(),
      avgWorkHours: (json['avgWorkHours'] as num).toDouble(),
      totalOvertimeMinutes: (json['totalOvertimeMinutes'] as num).toInt(),
      totalOvertimeHours: (json['totalOvertimeHours'] as num).toDouble(),
      totalLateMinutes: (json['totalLateMinutes'] as num).toInt(),
    );

Map<String, dynamic> _$AttendanceSummaryModelToJson(
        AttendanceSummaryModel instance) =>
    <String, dynamic>{
      'period': instance.period,
      'month': instance.month,
      'year': instance.year,
      'totalRecords': instance.totalRecords,
      'present': instance.present,
      'late': instance.late,
      'absent': instance.absent,
      'totalWorkHours': instance.totalWorkHours,
      'avgWorkHours': instance.avgWorkHours,
      'totalOvertimeMinutes': instance.totalOvertimeMinutes,
      'totalOvertimeHours': instance.totalOvertimeHours,
      'totalLateMinutes': instance.totalLateMinutes,
    };
