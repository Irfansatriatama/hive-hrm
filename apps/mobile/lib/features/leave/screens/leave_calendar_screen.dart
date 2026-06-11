import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/feature_models.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../providers/leave_calendar_provider.dart';

class LeaveCalendarScreen extends ConsumerStatefulWidget {
  const LeaveCalendarScreen({super.key});

  @override
  ConsumerState<LeaveCalendarScreen> createState() =>
      _LeaveCalendarScreenState();
}

class _LeaveCalendarScreenState extends ConsumerState<LeaveCalendarScreen> {
  DateTime _currentMonth = DateTime(DateTime.now().year, DateTime.now().month);
  String? _filterDept;

  static const _monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  static const _weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  void _navigateMonth(int delta) {
    setState(() {
      _currentMonth = DateTime(
        _currentMonth.year,
        _currentMonth.month + delta,
      );
    });
  }

  String _dateStr(DateTime date) {
    final y = date.year.toString().padLeft(4, '0');
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  List<LeaveCalendarEventModel> _eventsForDay(
    String dateStr,
    List<LeaveCalendarEventModel> events,
  ) {
    return events.where((evt) {
      if (_filterDept != null && _filterDept!.isNotEmpty) {
        if (evt.departmentId != _filterDept) return false;
      }
      return dateStr.compareTo(evt.start) >= 0 &&
          dateStr.compareTo(evt.end) <= 0;
    }).toList();
  }

  void _showDayDetails(String dateStr, List<LeaveCalendarEventModel> leaves) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surfaceBlue,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.lg)),
      ),
      builder: (ctx) {
        final parsed = DateTime.tryParse(dateStr);
        final title = parsed != null
            ? DateTimeFormatter.formatDate(parsed)
            : dateStr;

        return Padding(
          padding: const EdgeInsets.all(AppTheme.md),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                context.l10n.leaveCalendarDayDetail(title, leaves.length),
                style: AppTextStyle.h2,
              ),
              const SizedBox(height: AppTheme.md),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: leaves.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
                  itemBuilder: (_, index) {
                    final leave = leaves[index];
                    return HiveCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(leave.employeeName, style: AppTextStyle.h3),
                          const SizedBox(height: 4),
                          Text(leave.title, style: AppTextStyle.caption),
                          Text(
                            '${leave.start} – ${leave.end}',
                            style: AppTextStyle.caption,
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: AppTheme.sm),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final calendarState = ref.watch(leaveCalendarProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.leaveCalendarTitle, style: AppTextStyle.h1),
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(leaveCalendarProvider.future),
        child: switch (calendarState) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: EdgeInsets.all(AppTheme.md),
                child: SkeletonBox(height: 360),
              ),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(leaveCalendarProvider),
                ),
              ),
            ),
          AsyncData(:final value) => _CalendarBody(
              data: value,
              currentMonth: _currentMonth,
              filterDept: _filterDept,
              monthNames: _monthNames,
              weekdays: _weekdays,
              onFilterChanged: (dept) => setState(() => _filterDept = dept),
              onPrevMonth: () => _navigateMonth(-1),
              onNextMonth: () => _navigateMonth(1),
              onToday: () => setState(
                () => _currentMonth = DateTime(
                  DateTime.now().year,
                  DateTime.now().month,
                ),
              ),
              dateStr: _dateStr,
              eventsForDay: _eventsForDay,
              onDayTap: _showDayDetails,
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _CalendarBody extends StatelessWidget {
  final LeaveCalendarData data;
  final DateTime currentMonth;
  final String? filterDept;
  final List<String> monthNames;
  final List<String> weekdays;
  final ValueChanged<String?> onFilterChanged;
  final VoidCallback onPrevMonth;
  final VoidCallback onNextMonth;
  final VoidCallback onToday;
  final String Function(DateTime) dateStr;
  final List<LeaveCalendarEventModel> Function(
    String,
    List<LeaveCalendarEventModel>,
  ) eventsForDay;
  final void Function(String, List<LeaveCalendarEventModel>) onDayTap;

  const _CalendarBody({
    required this.data,
    required this.currentMonth,
    required this.filterDept,
    required this.monthNames,
    required this.weekdays,
    required this.onFilterChanged,
    required this.onPrevMonth,
    required this.onNextMonth,
    required this.onToday,
    required this.dateStr,
    required this.eventsForDay,
    required this.onDayTap,
  });

  @override
  Widget build(BuildContext context) {
    final year = currentMonth.year;
    final month = currentMonth.month;
    final firstDayIndex = DateTime(year, month, 1).weekday;
    final adjustedFirstDay = firstDayIndex == 7 ? 0 : firstDayIndex - 1;
    final totalDays = DateTime(year, month + 1, 0).day;
    final todayStr = dateStr(DateTime.now());

    final cells = <Widget>[];

    for (var i = 0; i < adjustedFirstDay; i++) {
      cells.add(const SizedBox(height: 72));
    }

    for (var day = 1; day <= totalDays; day++) {
      final date = DateTime(year, month, day);
      final dayStr = dateStr(date);
      final dayLeaves = eventsForDay(dayStr, data.events);
      final isToday = dayStr == todayStr;

      cells.add(
        GestureDetector(
          onTap: dayLeaves.isEmpty ? null : () => onDayTap(dayStr, dayLeaves),
          child: Container(
            height: 72,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              border: Border.all(
                color: isToday
                    ? AppColors.amberAccent
                    : AppColors.textSubtle.withOpacity(0.2),
              ),
              color: isToday
                  ? AppColors.amberAccent.withOpacity(0.08)
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$day',
                  style: AppTextStyle.caption.copyWith(
                    fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                    color: isToday ? AppColors.amberAccent : null,
                  ),
                ),
                Expanded(
                  child: ListView(
                    padding: EdgeInsets.zero,
                    children: dayLeaves.take(2).map((leave) {
                      final firstName =
                          leave.employeeName.split(' ').firstOrNull ?? '';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Text(
                          firstName,
                          style: AppTextStyle.overline.copyWith(fontSize: 9),
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }).toList(),
                  ),
                ),
                if (dayLeaves.length > 2)
                  Text(
                    '+${dayLeaves.length - 2}',
                    style: AppTextStyle.overline.copyWith(fontSize: 8),
                  ),
              ],
            ),
          ),
        ),
      );
    }

    while (cells.length % 7 != 0) {
      cells.add(const SizedBox(height: 72));
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      children: [
        HiveCard(
          child: DropdownButtonFormField<String?>(
            value: filterDept?.isEmpty == true ? null : filterDept,
            decoration: InputDecoration(
              labelText: context.l10n.department,
              border: InputBorder.none,
            ),
            dropdownColor: AppColors.cardElevated,
            items: [
              DropdownMenuItem<String?>(
                value: null,
                child: Text(
                  context.l10n.leaveCalendarAllDepts,
                  style: AppTextStyle.body2,
                ),
              ),
              ...data.departments.map(
                (d) => DropdownMenuItem<String?>(
                  value: d.id,
                  child: Text(d.name, style: AppTextStyle.body2),
                ),
              ),
            ],
            onChanged: onFilterChanged,
          ),
        ),
        const SizedBox(height: AppTheme.md),
        HiveCard(
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${monthNames[month - 1]} $year',
                    style: AppTextStyle.h2,
                  ),
                  Row(
                    children: [
                      IconButton(
                        onPressed: onPrevMonth,
                        icon: const Icon(Icons.chevron_left_rounded),
                        color: AppColors.amberAccent,
                      ),
                      TextButton(onPressed: onToday, child: Text(context.l10n.shiftToday)),
                      IconButton(
                        onPressed: onNextMonth,
                        icon: const Icon(Icons.chevron_right_rounded),
                        color: AppColors.amberAccent,
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.sm),
              Row(
                children: weekdays
                    .map(
                      (d) => Expanded(
                        child: Center(
                          child: Text(d, style: AppTextStyle.overline),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: AppTheme.sm),
              GridView.count(
                crossAxisCount: 7,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: cells,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

extension _FirstOrNull on List<String> {
  String? get firstOrNull => isEmpty ? null : first;
}
