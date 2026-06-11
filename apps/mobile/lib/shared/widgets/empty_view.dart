import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_style.dart';
import '../../core/theme/app_theme.dart';

class EmptyView extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final Widget? action;

  const EmptyView({
    super.key,
    required this.title,
    this.subtitle,
    this.icon = Icons.inbox_rounded,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: AppColors.textSubtle),
            const SizedBox(height: AppTheme.md),
            Text(title, style: AppTextStyle.h2, textAlign: TextAlign.center),
            if (subtitle != null) ...[
              const SizedBox(height: AppTheme.sm),
              Text(
                subtitle!,
                style: AppTextStyle.body2.copyWith(color: AppColors.textSubtle),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: AppTheme.lg),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
