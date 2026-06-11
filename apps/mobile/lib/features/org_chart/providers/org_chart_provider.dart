import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/feature_models.dart';

part 'org_chart_provider.g.dart';

@Riverpod(keepAlive: true)
class OrgChartFilter extends _$OrgChartFilter {
  @override
  String? build() => null;

  void setDepartment(String? departmentId) => state = departmentId;
}

@riverpod
class OrgChart extends _$OrgChart {
  @override
  Future<OrgChartData> build() async {
    final deptFilter = ref.watch(orgChartFilterProvider);
    return _fetchOrgChart(deptFilter);
  }

  Future<OrgChartData> _fetchOrgChart(String? deptFilter) async {
    final responses = await Future.wait([
      ApiClient.instance.get(
        ApiEndpoints.orgChart,
        queryParameters: deptFilter != null && deptFilter.isNotEmpty
            ? {'dept': deptFilter}
            : null,
      ),
      ApiClient.instance.get(ApiEndpoints.departments),
    ]);

    final employees = (responses[0].data as List<dynamic>)
        .map(
          (e) => OrgChartEmployeeModel.fromJson(e as Map<String, dynamic>),
        )
        .toList();

    final departments = (responses[1].data as List<dynamic>)
        .map(
          (e) => OrgChartDepartmentModel.fromJson(e as Map<String, dynamic>),
        )
        .toList();

    return OrgChartData(employees: employees, departments: departments);
  }
}
