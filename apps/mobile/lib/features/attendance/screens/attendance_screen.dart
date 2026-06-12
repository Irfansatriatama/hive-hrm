import 'package:flutter/material.dart';
import '../../../shared/widgets/hive_app_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/section_label.dart';
import '../providers/attendance_provider.dart';
import '../widgets/attendance_detail_sheet.dart';
import '../widgets/attendance_history_list.dart';
import '../widgets/attendance_location_row.dart';
import '../widgets/attendance_period_filter.dart';
import '../widgets/attendance_summary_card.dart';
import '../widgets/clock_in_out_button.dart';
import '../widgets/time_summary_cards.dart';
import '../widgets/week_dots_view.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  late int _month;
  late int _year;
  bool _yearlyView = false;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _month = now.month;
    _year = now.year;
  }

  void _applyPeriod() {
    ref.read(attendanceProvider.notifier).setPeriod(
          month: _month,
          year: _year,
          yearly: _yearlyView,
        );
  }

  String _statusText(BuildContext context, dynamic data) {
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
  Widget build(BuildContext context) {
    final attendanceState = ref.watch(attendanceProvider);
    final todayFormatted = DateFormat('EEE, d MMM', 'id_ID').format(DateTime.now());

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: HiveAppBar(
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
                  message: ApiClient.friendlyMessage(error),
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
                  TimeSummaryCards(today: value.today),
                  if (value.today != null &&
                      (value.today!.hasOvertime ||
                          value.today!.checkIn != null)) ...[
                    const SizedBox(height: AppTheme.sm),
                    GestureDetector(
                      onTap: () => showAttendanceDetailSheet(context, value.today!),
                      child: Text(
                        context.l10n.attendanceTapForDetail,
                        style: AppTextStyle.caption.copyWith(
                          color: AppColors.amberAccent,
                          decoration: TextDecoration.underline,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                  if (value.today?.displayLocation != null) ...[
                    const SizedBox(height: AppTheme.sm),
                    AttendanceLocationRow(record: value.today!),
                  ],
                  const SizedBox(height: AppTheme.md),
                  AttendancePeriodFilter(
                    month: _month,
                    year: _year,
                    yearlyView: _yearlyView,
                    onMonthChanged: (m) {
                      setState(() => _month = m);
                      _applyPeriod();
                    },
                    onYearChanged: (y) {
                      setState(() => _year = y);
                      _applyPeriod();
                    },
                    onYearlyViewChanged: (yearly) {
                      setState(() => _yearlyView = yearly);
                      _applyPeriod();
                    },
                  ),
                  if (value.summary != null) ...[
                    const SizedBox(height: AppTheme.md),
                    AttendanceSummaryCard(
                      summary: value.summary!,
                      yearlyView: _yearlyView,
                    ),
                  ],
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
