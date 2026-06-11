import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/section_label.dart';
import '../models/attendance_data.dart';
import '../providers/attendance_provider.dart';
import '../widgets/attendance_history_list.dart';
import '../widgets/clock_in_out_button.dart';
import '../widgets/time_summary_cards.dart';
import '../widgets/week_dots_view.dart';

class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  String _statusText(BuildContext context, AttendanceData data) {
    final today = data.today;
    if (today == null || today.checkIn == null) {
      return context.l10n.tapToCheckIn;
    }
    if (today.checkOut != null) {
      return context.l10n.checkedOut;
    }
    return context.l10n.tapToCheckOut;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attendanceState = ref.watch(attendanceProvider);
    final todayFormatted = DateFormat('EEE, d MMM', 'id_ID').format(DateTime.now());

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.attendanceTitle, style: AppTextStyle.h1),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppTheme.md),
            child: Center(
              child: Text(todayFormatted, style: AppTextStyle.caption),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(attendanceProvider.future),
        child: switch (attendanceState) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: AttendanceSkeleton(),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(attendanceProvider),
                ),
              ),
            ),
          AsyncData(:final value) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(AppTheme.md),
              child: Column(
                children: [
                  Text(
                    _statusText(context, value),
                    style: AppTextStyle.caption,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppTheme.sm + AppTheme.xs),
                  const ClockInOutButton(),
                  const SizedBox(height: AppTheme.sm + AppTheme.xs),
                  const SizedBox(height: AppTheme.md),
                  TimeSummaryCards(today: value.today),
                  const SizedBox(height: AppTheme.md),
                  SectionLabel(context.l10n.thisWeek),
                  WeekDotsView(weekDays: value.weekDays),
                  const SizedBox(height: AppTheme.md),
                  SectionLabel(context.l10n.history),
                  AttendanceHistoryList(history: value.history),
                  const SizedBox(height: AppTheme.lg),
                ],
              ),
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}
