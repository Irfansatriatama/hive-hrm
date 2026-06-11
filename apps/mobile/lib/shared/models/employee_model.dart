import 'package:json_annotation/json_annotation.dart';

part 'employee_model.g.dart';

@JsonSerializable()
class EmployeeModel {
  final String id;
  @JsonKey(name: 'full_name')
  final String name;
  final String email;
  @JsonKey(name: 'photo_url')
  final String? photoUrl;
  final String? role;
  final String? status;
  final DepartmentModel? department;
  final PositionModel? position;

  const EmployeeModel({
    required this.id,
    required this.name,
    required this.email,
    this.photoUrl,
    this.role,
    this.status,
    this.department,
    this.position,
  });

  factory EmployeeModel.fromJson(Map<String, dynamic> json) =>
      _$EmployeeModelFromJson(json);

  Map<String, dynamic> toJson() => _$EmployeeModelToJson(this);
}

@JsonSerializable()
class DepartmentModel {
  final String id;
  final String name;

  const DepartmentModel({required this.id, required this.name});

  factory DepartmentModel.fromJson(Map<String, dynamic> json) =>
      _$DepartmentModelFromJson(json);

  Map<String, dynamic> toJson() => _$DepartmentModelToJson(this);
}

@JsonSerializable()
class PositionModel {
  final String id;
  final String name;

  const PositionModel({required this.id, required this.name});

  factory PositionModel.fromJson(Map<String, dynamic> json) =>
      _$PositionModelFromJson(json);

  Map<String, dynamic> toJson() => _$PositionModelToJson(this);
}
