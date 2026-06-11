// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'employee_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

EmployeeModel _$EmployeeModelFromJson(Map<String, dynamic> json) =>
    EmployeeModel(
      id: json['id'] as String,
      name: json['full_name'] as String,
      email: json['email'] as String,
      photoUrl: json['photo_url'] as String?,
      role: json['role'] as String?,
      status: json['status'] as String?,
      employeeNumber: json['employee_number'] as String?,
      joinDate: json['join_date'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      department: json['department'] == null
          ? null
          : DepartmentModel.fromJson(
              json['department'] as Map<String, dynamic>),
      position: json['position'] == null
          ? null
          : PositionModel.fromJson(json['position'] as Map<String, dynamic>),
      manager: json['manager'] == null
          ? null
          : ManagerModel.fromJson(json['manager'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$EmployeeModelToJson(EmployeeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'full_name': instance.name,
      'email': instance.email,
      'photo_url': instance.photoUrl,
      'role': instance.role,
      'status': instance.status,
      'employee_number': instance.employeeNumber,
      'join_date': instance.joinDate,
      'phone': instance.phone,
      'address': instance.address,
      'department': instance.department,
      'position': instance.position,
      'manager': instance.manager,
    };

DepartmentModel _$DepartmentModelFromJson(Map<String, dynamic> json) =>
    DepartmentModel(
      id: json['id'] as String,
      name: json['name'] as String,
    );

Map<String, dynamic> _$DepartmentModelToJson(DepartmentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
    };

PositionModel _$PositionModelFromJson(Map<String, dynamic> json) =>
    PositionModel(
      id: json['id'] as String,
      name: json['name'] as String,
    );

Map<String, dynamic> _$PositionModelToJson(PositionModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
    };

ManagerModel _$ManagerModelFromJson(Map<String, dynamic> json) => ManagerModel(
      id: json['id'] as String,
      fullName: json['full_name'] as String?,
      fullNameCamel: json['fullName'] as String?,
    );

Map<String, dynamic> _$ManagerModelToJson(ManagerModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'full_name': instance.fullName,
      'fullName': instance.fullNameCamel,
    };
