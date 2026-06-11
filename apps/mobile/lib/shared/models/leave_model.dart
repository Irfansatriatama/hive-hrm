import 'package:json_annotation/json_annotation.dart';

part 'leave_model.g.dart';

@JsonSerializable()
class LeaveBalanceModel {
  @JsonKey(name: 'id')
  final String leaveTypeId;
  @JsonKey(name: 'name')
  final String typeName;
  @JsonKey(name: 'remaining')
  final int balance;
  final int used;
  @JsonKey(name: 'quota')
  final int total;
  final int pending;

  const LeaveBalanceModel({
    required this.leaveTypeId,
    required this.typeName,
    required this.balance,
    required this.used,
    required this.total,
    this.pending = 0,
  });

  factory LeaveBalanceModel.fromJson(Map<String, dynamic> json) =>
      _$LeaveBalanceModelFromJson(json);

  Map<String, dynamic> toJson() => _$LeaveBalanceModelToJson(this);
}

@JsonSerializable()
class LeaveRequestModel {
  final String id;
  final String? leaveTypeId;
  final DateTime? startDate;
  final DateTime? endDate;
  final int? totalDays;
  final String? status;
  final String? reason;
  final LeaveTypeRef? leaveType;

  const LeaveRequestModel({
    required this.id,
    this.leaveTypeId,
    this.startDate,
    this.endDate,
    this.totalDays,
    this.status,
    this.reason,
    this.leaveType,
  });

  factory LeaveRequestModel.fromJson(Map<String, dynamic> json) =>
      _$LeaveRequestModelFromJson(json);

  Map<String, dynamic> toJson() => _$LeaveRequestModelToJson(this);

  bool get isPending => status?.toLowerCase() == 'pending';
}

@JsonSerializable()
class LeaveTypeRef {
  final String id;
  final String name;

  const LeaveTypeRef({required this.id, required this.name});

  factory LeaveTypeRef.fromJson(Map<String, dynamic> json) =>
      _$LeaveTypeRefFromJson(json);

  Map<String, dynamic> toJson() => _$LeaveTypeRefToJson(this);
}

@JsonSerializable()
class LeaveTypeModel {
  final String id;
  final String name;
  @JsonKey(name: 'maxDays')
  final int maxDays;

  const LeaveTypeModel({
    required this.id,
    required this.name,
    required this.maxDays,
  });

  factory LeaveTypeModel.fromJson(Map<String, dynamic> json) =>
      _$LeaveTypeModelFromJson(json);

  Map<String, dynamic> toJson() => _$LeaveTypeModelToJson(this);
}
