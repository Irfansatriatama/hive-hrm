import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/hive_card.dart';
import '../models/dashboard_data.dart';

class StatCard extends StatelessWidget {
  final String value;
  final String label;
  final String sub;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.value,
    required this.label,
    required this.sub,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return HiveCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: AppTextStyle.display.copyWith(color: AppColors.amberAccent),
          ),
          const SizedBox(height: AppTheme.xs),
          Text(label, style: AppTextStyle.h3),
          Text(sub, style: AppTextStyle.caption),
        ],
      ),
    );
  }
}

class StatsGrid extends StatelessWidget {
  final DashboardData data;

  const StatsGrid({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    final leave = data.primaryLeaveBalance;
    final leaveValue = leave?.balance.toString() ?? '0';
    final leaveTotal = leave?.total ?? 0;
    final attendanceValue = '${data.attendanceRatePercent}%';
    final pendingValue = data.pendingRequestCount.toString();
    final rewardValue = NumberFormat('#,###', 'id_ID').format(data.rewardPoints);

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      crossAxisSpacing: AppTheme.sm,
      mainAxisSpacing: AppTheme.sm,
      childAspectRatio: 1.5,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        StatCard(
          value: leaveValue,
          label: context.l10n.statLeaveRemaining,
          sub: context.l10n.statLeaveFromTotal(leaveTotal),
        ),
        StatCard(
          value: attendanceValue,
          label: context.l10n.statAttendance,
          sub: context.l10n.statAttendanceSub,
        ),
        StatCard(
          value: pendingValue,
          label: context.l10n.statPendingRequests,
          sub: context.l10n.statPendingSub,
        ),
        StatCard(
          value: rewardValue,
          label: context.l10n.statRewardPoints,
          sub: context.l10n.statRewardToday(data.rewardPointsToday),
        ),
      ],
    );
  }
}
