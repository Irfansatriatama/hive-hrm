import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lottie/lottie.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/attendance_provider.dart';

class ClockInOutButton extends ConsumerStatefulWidget {
  const ClockInOutButton({super.key});

  @override
  ConsumerState<ClockInOutButton> createState() => _ClockInOutButtonState();
}

class _ClockInOutButtonState extends ConsumerState<ClockInOutButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _lottieController;

  @override
  void initState() {
    super.initState();
    _lottieController = AnimationController(vsync: this);
  }

  @override
  void dispose() {
    _lottieController.dispose();
    super.dispose();
  }

  Future<void> _handleTap() async {
    final today = ref.read(attendanceProvider).valueOrNull?.today;
    final isCheckedIn =
        today?.checkIn != null && today?.checkOut == null;
    final isCheckedOut = today?.checkOut != null;
    if (isCheckedOut) return;

    _lottieController.forward(from: 0);

    final l10n = context.l10n;
    final notifier = ref.read(attendanceProvider.notifier);
    final String? error;
    final String successMessage;

    if (isCheckedIn) {
      error = await notifier.checkOut(context);
      successMessage = l10n.checkOutSuccess;
    } else {
      error = await notifier.checkIn(context);
      successMessage = l10n.checkInSuccess;
    }

    if (!mounted) return;

    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error, style: AppTextStyle.body2),
          backgroundColor: AppColors.errorRed,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(successMessage, style: AppTextStyle.body2),
          backgroundColor: AppColors.successGreen,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoadingGps = ref.watch(attendanceLoadingGpsProvider);
    final isSubmitting = ref.watch(attendanceSubmittingProvider);
    final showLoading = isLoadingGps || isSubmitting;
    final today = ref.watch(attendanceProvider).valueOrNull?.today;
    final isCheckedIn =
        today?.checkIn != null && today?.checkOut == null;
    final isCheckedOut = today?.checkOut != null;

    final lottieAsset = isCheckedIn
        ? 'assets/lottie/clock_out.json'
        : 'assets/lottie/clock_in.json';

    return Semantics(
      button: true,
      enabled: !showLoading && !isCheckedOut,
      label: isCheckedOut
          ? context.l10n.checkedOut
          : isCheckedIn
              ? context.l10n.tapToCheckOut
              : context.l10n.tapToCheckIn,
      child: GestureDetector(
        onTap: showLoading || isCheckedOut ? null : _handleTap,
        child: Container(
          width: AppTheme.tapMin * 2 + AppTheme.sm,
          height: AppTheme.tapMin * 2 + AppTheme.sm,
          constraints: const BoxConstraints(
            minWidth: AppTheme.tapMin,
            minHeight: AppTheme.tapMin,
          ),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: isCheckedOut
                  ? AppColors.textSubtle
                  : isCheckedIn
                      ? AppColors.tealSecondary
                      : AppColors.amberAccent,
              width: 3,
            ),
          ),
          child: ClipOval(
            child: showLoading
                ? const Center(
                    child: SizedBox(
                      width: AppTheme.lg,
                      height: AppTheme.lg,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.amberAccent,
                      ),
                    ),
                  )
                : Lottie.asset(
                    lottieAsset,
                    controller: _lottieController,
                    fit: BoxFit.cover,
                    repeat: false,
                    onLoaded: (composition) {
                      _lottieController.duration = composition.duration;
                    },
                  ),
          ),
        ),
      ),
    );
  }
}
