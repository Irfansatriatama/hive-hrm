// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payslip_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PayslipModel _$PayslipModelFromJson(Map<String, dynamic> json) => PayslipModel(
      id: json['id'] as String,
      grossSalary: (json['grossSalary'] as num).toInt(),
      totalDeduct: (json['totalDeduct'] as num).toInt(),
      netSalary: (json['netSalary'] as num).toInt(),
      status: json['status'] as String,
      period:
          PayslipPeriodModel.fromJson(json['period'] as Map<String, dynamic>),
      items: (json['items'] as List<dynamic>)
          .map((e) => PayslipItemModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$PayslipModelToJson(PayslipModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'grossSalary': instance.grossSalary,
      'totalDeduct': instance.totalDeduct,
      'netSalary': instance.netSalary,
      'status': instance.status,
      'period': instance.period,
      'items': instance.items,
    };

PayslipPeriodModel _$PayslipPeriodModelFromJson(Map<String, dynamic> json) =>
    PayslipPeriodModel(
      name: json['name'] as String,
      month: (json['month'] as num).toInt(),
      year: (json['year'] as num).toInt(),
      payDate: json['payDate'] == null
          ? null
          : DateTime.parse(json['payDate'] as String),
    );

Map<String, dynamic> _$PayslipPeriodModelToJson(PayslipPeriodModel instance) =>
    <String, dynamic>{
      'name': instance.name,
      'month': instance.month,
      'year': instance.year,
      'payDate': instance.payDate?.toIso8601String(),
    };

PayslipItemModel _$PayslipItemModelFromJson(Map<String, dynamic> json) =>
    PayslipItemModel(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String,
      amount: (json['amount'] as num).toInt(),
    );

Map<String, dynamic> _$PayslipItemModelToJson(PayslipItemModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'type': instance.type,
      'amount': instance.amount,
    };
