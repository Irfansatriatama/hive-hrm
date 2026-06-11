import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class HiveCard extends StatelessWidget {
  final Widget child;
  final bool accentLeft;
  final EdgeInsets? padding;
  final VoidCallback? onTap;

  const HiveCard({
    super.key,
    required this.child,
    this.accentLeft = false,
    this.padding,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceBlue,
      borderRadius: BorderRadius.circular(AppTheme.radiusCard),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        splashColor: AppColors.amberAccent.withOpacity(0.08),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppTheme.radiusCard),
            border: accentLeft
                ? const Border(left: BorderSide(color: AppColors.amberAccent, width: 3))
                : null,
          ),
          padding: padding ?? const EdgeInsets.all(AppTheme.md),
          child: child,
        ),
      ),
    );
  }
}
