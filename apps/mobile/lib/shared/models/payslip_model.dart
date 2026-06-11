import 'package:json_annotation/json_annotation.dart';

part 'payslip_model.g.dart';

@JsonSerializable()
class PayslipModel {
  final String id;
  final int grossSalary;
  final int totalDeduct;
  final int netSalary;
  final String status;
  final PayslipPeriodModel period;
  final List<PayslipItemModel> items;

  const PayslipModel({
    required this.id,
    required this.grossSalary,
    required this.totalDeduct,
    required this.netSalary,
    required this.status,
    required this.period,
    required this.items,
  });

  String get periodName => period.name;

  int get month => period.month;

  int get year => period.year;

  factory PayslipModel.fromJson(Map<String, dynamic> json) =>
      _$PayslipModelFromJson(json);

  Map<String, dynamic> toJson() => _$PayslipModelToJson(this);
}

@JsonSerializable()
class PayslipPeriodModel {
  final String name;
  final int month;
  final int year;
  final DateTime? payDate;

  const PayslipPeriodModel({
    required this.name,
    required this.month,
    required this.year,
    this.payDate,
  });

  factory PayslipPeriodModel.fromJson(Map<String, dynamic> json) =>
      _$PayslipPeriodModelFromJson(json);

  Map<String, dynamic> toJson() => _$PayslipPeriodModelToJson(this);
}

@JsonSerializable()
class PayslipItemModel {
  final String id;
  final String name;
  final String type;
  final int amount;

  const PayslipItemModel({
    required this.id,
    required this.name,
    required this.type,
    required this.amount,
  });

  bool get isEarning => type == 'earning';

  bool get isDeduction => type == 'deduction';

  factory PayslipItemModel.fromJson(Map<String, dynamic> json) =>
      _$PayslipItemModelFromJson(json);

  Map<String, dynamic> toJson() => _$PayslipItemModelToJson(this);
}
