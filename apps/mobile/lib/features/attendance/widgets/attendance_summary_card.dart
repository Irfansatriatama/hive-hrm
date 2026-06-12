import 'package:flutter/material.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/attendance_model.dart';
import '../../../shared/widgets/hive_card.dart';

class AttendanceSummaryCard extends StatelessWidget {
  final AttendanceSummaryModel summary;
  final bool yearlyView;

  const AttendanceSummaryCard({
    super.key,
    required this.summary,
    required this.yearlyView,
  });

  @override
  Widget build(BuildContext context) {
    final title = yearlyView
        ? context.l10n.attendanceYearlyRecap(summary.year)
        : context.l10n.attendanceMonthlyRecap(summary.year, summary.month ?? 0);

    return HiveCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTextStyle.h3),
          const SizedBox(height: AppTheme.md),
          Wrap(
            spacing: AppTheme.sm,
            runSpacing: AppTheme.sm,
            children: [
              _StatChip(
                label: context.l10n.present,
                value: '${summary.present}',
                color: AppColors.successGreen,
              ),
              _StatChip(
                label: context.l10n.late,
                value: '${summary.late}',
                color: AppColors.amberAccent,
              ),
              _StatChip(
                label: context.l10n.absent,
                value: '${summary.absent}',
                color: AppColors.errorRed,
              ),
              _StatChip(
                label: context.l10n.attendanceTotalHours,
                value: '${summary.totalWorkHours}j',
                color: AppColors.tealSecondary,
              ),
              _StatChip(
                label: context.l10n.attendanceOvertimeLabel,
                value: '${summary.totalOvertimeHours}j',
                color: AppColors.amberAccent,
              ),
            ],
          ),
          if (summary.avgWorkHours > 0) ...[
            const SizedBox(height: AppTheme.sm),
            Text(
              context.l10n.attendanceAvgHours(summary.avgWorkHours),
              style: AppTextStyle.caption,
            ),
          ],
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatChip({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AppTheme.radiusBtn),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Column(
        children: [
          Text(value, style: AppTextStyle.h3.copyWith(color: color)),
          Text(label, style: AppTextStyle.overline),
        ],
      ),
    );
  }
}
