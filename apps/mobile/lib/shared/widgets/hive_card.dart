import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class HiveCard extends StatelessWidget {
  final Widget child;
  final bool accentLeft;
  final Color? accentColor;
  final EdgeInsets? padding;
  final VoidCallback? onTap;

  const HiveCard({
    super.key,
    required this.child,
    this.accentLeft = false,
    this.accentColor,
    this.padding,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final stripe = accentColor ?? AppColors.amberAccent;

    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(AppTheme.radiusCard),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        splashColor: stripe.withOpacity(0.1),
        highlightColor: stripe.withOpacity(0.05),
        child: Ink(
          decoration: BoxDecoration(
            gradient: AppColors.cardSheen,
            borderRadius: BorderRadius.circular(AppTheme.radiusCard),
            border: Border.all(
              color: AppColors.dividerLine.withOpacity(0.55),
            ),
            boxShadow: accentLeft
                ? [
                    BoxShadow(
                      color: stripe.withOpacity(0.12),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppTheme.radiusCard),
              border: accentLeft
                  ? Border(left: BorderSide(color: stripe, width: 3))
                  : null,
            ),
            padding: padding ?? const EdgeInsets.all(AppTheme.md),
            child: child,
          ),
        ),
      ),
    );
  }
}
