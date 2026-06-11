import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_style.dart';
import '../../core/theme/app_theme.dart';
import 'hive_card.dart';

class MenuListTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final int? badgeCount;
  final VoidCallback onTap;

  const MenuListTile({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.subtitle,
    this.badgeCount,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.sm),
      child: HiveCard(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: AppTheme.tapMin),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.amberAccent.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                ),
                child: Icon(icon, color: AppColors.amberAccent, size: 22),
              ),
              const SizedBox(width: AppTheme.sm + AppTheme.xs),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: AppTextStyle.body1),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(subtitle!, style: AppTextStyle.caption),
                    ],
                  ],
                ),
              ),
              if (badgeCount != null && badgeCount! > 0) ...[
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.sm,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.errorRed.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                    border: Border.all(color: AppColors.errorRed),
                  ),
                  child: Text(
                    '$badgeCount',
                    style: AppTextStyle.caption.copyWith(
                      color: AppColors.errorRed,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: AppTheme.xs),
              ],
              Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textSubtle,
                size: AppTheme.md + AppTheme.xs,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
