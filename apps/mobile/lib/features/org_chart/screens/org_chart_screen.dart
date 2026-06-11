import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/feature_models.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../providers/org_chart_provider.dart';

class OrgChartScreen extends ConsumerWidget {
  const OrgChartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orgChartState = ref.watch(orgChartProvider);
    final filterDept = ref.watch(orgChartFilterProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.orgChartTitle, style: AppTextStyle.h1),
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(orgChartProvider.future),
        child: switch (orgChartState) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: EdgeInsets.all(AppTheme.md),
                child: SkeletonBox(height: 320),
              ),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(orgChartProvider),
                ),
              ),
            ),
          AsyncData(:final value) => _OrgChartContent(
              data: value,
              filterDept: filterDept,
              onFilterChanged: (dept) {
                ref.read(orgChartFilterProvider.notifier).setDepartment(dept);
              },
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _OrgChartContent extends StatelessWidget {
  final OrgChartData data;
  final String? filterDept;
  final ValueChanged<String?> onFilterChanged;

  const _OrgChartContent({
    required this.data,
    required this.filterDept,
    required this.onFilterChanged,
  });

  List<OrgChartEmployeeModel> get _roots {
    final ids = data.employees.map((e) => e.id).toSet();
    return data.employees
        .where(
          (e) =>
              e.directManagerId == null || !ids.contains(e.directManagerId),
        )
        .toList()
      ..sort((a, b) => a.fullName.compareTo(b.fullName));
  }

  List<OrgChartEmployeeModel> _children(String managerId) {
    return data.employees
        .where((e) => e.directManagerId == managerId)
        .toList()
      ..sort((a, b) => a.fullName.compareTo(b.fullName));
  }

  @override
  Widget build(BuildContext context) {
    if (data.employees.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
          EmptyView(
            icon: Icons.account_tree_rounded,
            title: context.l10n.emptyOrgChart,
          ),
        ],
      );
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      children: [
        HiveCard(
          child: DropdownButtonFormField<String?>(
            value: filterDept?.isEmpty == true ? null : filterDept,
            decoration: InputDecoration(
              labelText: context.l10n.department,
              border: InputBorder.none,
            ),
            dropdownColor: AppColors.cardElevated,
            items: [
              DropdownMenuItem<String?>(
                value: null,
                child: Text(
                  context.l10n.leaveCalendarAllDepts,
                  style: AppTextStyle.body2,
                ),
              ),
              ...data.departments.map(
                (d) => DropdownMenuItem<String?>(
                  value: d.id,
                  child: Text(d.name, style: AppTextStyle.body2),
                ),
              ),
            ],
            onChanged: onFilterChanged,
          ),
        ),
        const SizedBox(height: AppTheme.md),
        ..._roots.map(
          (root) => _OrgNodeTile(
            employee: root,
            depth: 0,
            getChildren: _children,
          ),
        ),
        const SizedBox(height: AppTheme.lg),
      ],
    );
  }
}

class _OrgNodeTile extends StatefulWidget {
  final OrgChartEmployeeModel employee;
  final int depth;
  final List<OrgChartEmployeeModel> Function(String managerId) getChildren;

  const _OrgNodeTile({
    required this.employee,
    required this.depth,
    required this.getChildren,
  });

  @override
  State<_OrgNodeTile> createState() => _OrgNodeTileState();
}

class _OrgNodeTileState extends State<_OrgNodeTile> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final children = widget.getChildren(widget.employee.id);
    final hasChildren = children.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: EdgeInsets.only(
            left: widget.depth * AppTheme.md.toDouble(),
            bottom: AppTheme.sm,
          ),
          child: HiveCard(
            child: InkWell(
              onTap: hasChildren
                  ? () => setState(() => _expanded = !_expanded)
                  : null,
              borderRadius: BorderRadius.circular(AppTheme.radiusCard),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: AppColors.amberAccent.withOpacity(0.2),
                    child: Text(
                      widget.employee.fullName.isNotEmpty
                          ? widget.employee.fullName[0].toUpperCase()
                          : '?',
                      style: AppTextStyle.body2.copyWith(
                        color: AppColors.amberAccent,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppTheme.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.employee.fullName,
                          style: AppTextStyle.body1,
                        ),
                        Text(
                          widget.employee.positionName.isNotEmpty
                              ? widget.employee.positionName
                              : context.l10n.notAvailable,
                          style: AppTextStyle.caption,
                        ),
                        if (widget.employee.departmentName.isNotEmpty)
                          Text(
                            widget.employee.departmentName,
                            style: AppTextStyle.caption,
                          ),
                      ],
                    ),
                  ),
                  if (hasChildren)
                    Icon(
                      _expanded
                          ? Icons.expand_less_rounded
                          : Icons.expand_more_rounded,
                      color: AppColors.textSubtle,
                    ),
                ],
              ),
            ),
          ),
        ),
        if (_expanded && hasChildren)
          ...children.map(
            (child) => _OrgNodeTile(
              employee: child,
              depth: widget.depth + 1,
              getChildren: widget.getChildren,
            ),
          ),
      ],
    );
  }
}
