import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class HiveFab extends StatelessWidget {
  final VoidCallback? onPressed;
  final IconData icon;
  final String? tooltip;

  const HiveFab({
    super.key,
    required this.onPressed,
    this.icon = Icons.add_rounded,
    this.tooltip,
  });

  /// Extra bottom offset so FAB sits above gesture/nav bars comfortably.
  static double bottomInset(BuildContext context) {
    final padding = MediaQuery.paddingOf(context);
    final viewPadding = MediaQuery.viewPaddingOf(context);
    final systemBottom = padding.bottom > 0 ? padding.bottom : viewPadding.bottom;

    // Gesture navigation (small inset): lift FAB higher.
    if (systemBottom < 24) return 28;

    // 3-button navigation: sit above the bar with breathing room.
    return systemBottom + 12;
  }

  static Widget wrap(BuildContext context, Widget fab) {
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset(context)),
      child: fab,
    );
  }

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: onPressed,
      backgroundColor: AppColors.amberAccent,
      foregroundColor: AppColors.primaryNavy,
      elevation: 4,
      tooltip: tooltip,
      child: Icon(icon),
    );
  }
}
