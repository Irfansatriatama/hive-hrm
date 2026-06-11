import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/user_role_provider.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';

class QuickActionsRow extends ConsumerWidget {
  const QuickActionsRow({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canApprove = ref.watch(canApproveProvider);

    return Row(
      children: [
        Expanded(
          child: _QuickAction(
            icon: Icons.fingerprint_rounded,
            label: context.l10n.quickActionAttendance,
            primary: true,
            onTap: () => context.go('/attendance'),
          ),
        ),
        const SizedBox(width: AppTheme.sm),
        Expanded(
          child: _QuickAction(
            icon: Icons.beach_access_rounded,
            label: context.l10n.quickActionApplyLeave,
            onTap: () => context.go('/leave'),
          ),
        ),
        const SizedBox(width: AppTheme.sm),
        Expanded(
          child: _QuickAction(
            icon: canApprove
                ? Icons.task_alt_rounded
                : Icons.notifications_rounded,
            label: canApprove
                ? context.l10n.quickActionApproval
                : context.l10n.quickActionAnnouncement,
            onTap: () => context.go(canApprove ? '/approval' : '/announcement'),
          ),
        ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool primary;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    this.primary = false,
    required this.onTap,
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
          constraints: const BoxConstraints(minHeight: AppTheme.tapMin),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.sm,
              vertical: AppTheme.md,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  icon,
                  color: primary ? AppColors.primaryNavy : AppColors.tealSecondary,
                  size: 24,
                ),
                const SizedBox(height: AppTheme.xs),
                Text(
                  label,
                  style: primary
                      ? AppTextStyle.caption.copyWith(
                          color: AppColors.primaryNavy,
                          fontWeight: FontWeight.w600,
                        )
                      : AppTextStyle.caption.copyWith(
                          color: AppColors.textPrimary,
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
