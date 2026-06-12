import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/l10n/l10n.dart';
import '../../core/network/connectivity_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_style.dart';
import '../../core/theme/app_theme.dart';

class OfflineBanner extends ConsumerWidget {
  final Widget child;

  const OfflineBanner({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(networkStatusProvider).valueOrNull ?? true;

    return Column(
      children: [
        AnimatedSize(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeInOut,
          child: isOnline
              ? const SizedBox.shrink()
              : SafeArea(
                  bottom: false,
                  child: Container(
                    width: double.infinity,
                    color: AppColors.errorRed,
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.md,
                      vertical: AppTheme.sm,
                    ),
                    child: Text(
                      context.l10n.noInternetConnection,
                      style: AppTextStyle.caption.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
        ),
        Expanded(child: child),
      ],
    );
  }
}
