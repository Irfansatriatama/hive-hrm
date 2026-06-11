import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/payslip_model.dart';

part 'payslip_provider.g.dart';

@riverpod
class Payslip extends _$Payslip {
  @override
  Future<List<PayslipModel>> build() async {
    final response = await ApiClient.instance.get(ApiEndpoints.myPayslips);
    final payslips = (response.data as List<dynamic>)
        .map((e) => PayslipModel.fromJson(e as Map<String, dynamic>))
        .toList();
    payslips.sort((a, b) {
      final yearCompare = b.year.compareTo(a.year);
      if (yearCompare != 0) return yearCompare;
      return b.month.compareTo(a.month);
    });
    return payslips;
  }
}
