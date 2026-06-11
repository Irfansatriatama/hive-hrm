import 'package:flutter/material.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/navigation/app_menu_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';

class MenuGridItem extends StatelessWidget {
  final AppMenuItem item;
  final String label;
  final VoidCallback onTap;
  final bool primary;

  const MenuGridItem({
    super.key,
    required this.item,
    required this.label,
    required this.onTap,
    this.primary = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: primary ? AppColors.amberAccent : AppColors.surfaceBlue,
      borderRadius: BorderRadius.circular(AppTheme.radiusCard),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 88),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.xs,
              vertical: AppTheme.sm + AppTheme.xs,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  item.icon,
                  color: primary ? AppColors.primaryNavy : AppColors.tealSecondary,
                  size: 26,
                ),
                const SizedBox(height: AppTheme.xs),
                Text(
                  label,
                  style: AppTextStyle.caption.copyWith(
                    color: primary ? AppColors.primaryNavy : AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class MoreMenuGridItem extends StatelessWidget {
  final VoidCallback onTap;

  const MoreMenuGridItem({super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceBlue,
      borderRadius: BorderRadius.circular(AppTheme.radiusCard),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 88),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.xs,
              vertical: AppTheme.sm + AppTheme.xs,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.apps_rounded,
                  color: AppColors.amberAccent,
                  size: 26,
                ),
                const SizedBox(height: AppTheme.xs),
                Text(
                  context.l10n.menuMore,
                  style: AppTextStyle.caption.copyWith(
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

String menuLabel(BuildContext context, AppMenuId id) {
  final l10n = context.l10n;
  return switch (id) {
    AppMenuId.attendance => l10n.navAttendance,
    AppMenuId.leave => l10n.navLeave,
    AppMenuId.payslip => l10n.navPayslip,
    AppMenuId.reward => l10n.rewardTitle,
    AppMenuId.resources => l10n.resourcesTitle,
    AppMenuId.documents => l10n.documentsTitle,
    AppMenuId.assets => l10n.assetsTitle,
    AppMenuId.expense => l10n.expenseTitle,
    AppMenuId.shift => l10n.shiftTitle,
    AppMenuId.visitor => l10n.visitorTitle,
    AppMenuId.onboarding => l10n.onboardingTitle,
    AppMenuId.orgChart => l10n.orgChartTitle,
    AppMenuId.leaveCalendar => l10n.leaveCalendarTitle,
    AppMenuId.approval => l10n.approvalTitle,
    AppMenuId.announcement => l10n.announcementTitle,
  };
}
