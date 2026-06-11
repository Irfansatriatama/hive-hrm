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
  @JsonKey(name: 'employee_number')
  final String? employeeNumber;
  @JsonKey(name: 'join_date')
  final String? joinDate;
  final String? phone;
  final String? address;
  final DepartmentModel? department;
  final PositionModel? position;
  final ManagerModel? manager;

  const EmployeeModel({
    required this.id,
    required this.name,
    required this.email,
    this.photoUrl,
    this.role,
    this.status,
    this.employeeNumber,
    this.joinDate,
    this.phone,
    this.address,
    this.department,
    this.position,
    this.manager,
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

@JsonSerializable()
class ManagerModel {
  final String id;
  @JsonKey(name: 'full_name')
  final String? fullName;
  @JsonKey(name: 'fullName')
  final String? fullNameCamel;

  const ManagerModel({
    required this.id,
    this.fullName,
    this.fullNameCamel,
  });

  String get name => fullName ?? fullNameCamel ?? '';

  factory ManagerModel.fromJson(Map<String, dynamic> json) =>
      _$ManagerModelFromJson(json);

  Map<String, dynamic> toJson() => _$ManagerModelToJson(this);
}
