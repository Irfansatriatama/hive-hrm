// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'leave_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LeaveBalanceModel _$LeaveBalanceModelFromJson(Map<String, dynamic> json) =>
    LeaveBalanceModel(
      leaveTypeId: json['id'] as String,
      typeName: json['name'] as String,
      balance: (json['remaining'] as num).toInt(),
      used: (json['used'] as num).toInt(),
      total: (json['quota'] as num).toInt(),
      pending: (json['pending'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$LeaveBalanceModelToJson(LeaveBalanceModel instance) =>
    <String, dynamic>{
      'id': instance.leaveTypeId,
      'name': instance.typeName,
      'remaining': instance.balance,
      'used': instance.used,
      'quota': instance.total,
      'pending': instance.pending,
    };

LeaveRequestModel _$LeaveRequestModelFromJson(Map<String, dynamic> json) =>
    LeaveRequestModel(
      id: json['id'] as String,
      leaveTypeId: json['leaveTypeId'] as String?,
      startDate: json['startDate'] == null
          ? null
          : DateTime.parse(json['startDate'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
      totalDays: (json['totalDays'] as num?)?.toInt(),
      status: json['status'] as String?,
      reason: json['reason'] as String?,
      leaveType: json['leaveType'] == null
          ? null
          : LeaveTypeRef.fromJson(json['leaveType'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$LeaveRequestModelToJson(LeaveRequestModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'leaveTypeId': instance.leaveTypeId,
      'startDate': instance.startDate?.toIso8601String(),
      'endDate': instance.endDate?.toIso8601String(),
      'totalDays': instance.totalDays,
      'status': instance.status,
      'reason': instance.reason,
      'leaveType': instance.leaveType,
    };

LeaveTypeRef _$LeaveTypeRefFromJson(Map<String, dynamic> json) => LeaveTypeRef(
      id: json['id'] as String,
      name: json['name'] as String,
    );

Map<String, dynamic> _$LeaveTypeRefToJson(LeaveTypeRef instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
    };
