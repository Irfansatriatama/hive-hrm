import 'package:flutter/material.dart';
import '../../../shared/widgets/hive_app_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/models/feature_models.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../providers/leave_calendar_provider.dart';
import '../utils/leave_calendar_day_utils.dart';

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
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  static const _weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  void _navigateMonth(int delta) {
    final next = DateTime(_currentMonth.year, _currentMonth.month + delta);
    setState(() => _currentMonth = next);
    ref.read(leaveCalendarProvider.notifier).loadMonth(next.year, next.month);
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

  void _showDayDetails(LeaveDayInfo info) {
    if (!info.isInteractive) return;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceBlue,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.lg)),
      ),
      builder: (ctx) {
        final parsed = DateTime.tryParse(info.dateStr);
        final title = parsed != null
            ? DateTimeFormatter.formatDate(parsed)
            : info.dateStr;

        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.55,
          minChildSize: 0.35,
          maxChildSize: 0.9,
          builder: (_, controller) => Padding(
            padding: const EdgeInsets.all(AppTheme.md),
            child: ListView(
              controller: controller,
              children: [
                Text(title, style: AppTextStyle.h2),
                const SizedBox(height: AppTheme.sm),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: info.categories.map((cat) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: info.categoryColor(cat).withValues(alpha: 0.2),
                        border: Border.all(color: info.categoryColor(cat)),
                        borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                      ),
                      child: Text(
                        categoryLabel(cat),
                        style: AppTextStyle.overline.copyWith(
                          color: info.categoryColor(cat),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: AppTheme.md),
                if (info.isToday)
                  _ModalSection(
                    color: LeaveCalendarColors.today,
                    title: context.l10n.leaveCalendarLegendToday,
                    body: context.l10n.leaveCalendarTodayDesc,
                  ),
                if (info.isSunday)
                  _ModalSection(
                    color: LeaveCalendarColors.national,
                    title: context.l10n.leaveCalendarSundayTitle,
                    body: context.l10n.leaveCalendarSundayDesc,
                  ),
                if (info.holiday != null)
                  _ModalSection(
                    color: info.categoryColor(
                      info.holiday!.type == 'collective'
                          ? LeaveDayCategory.collective
                          : info.holiday!.type == 'company'
                              ? LeaveDayCategory.company
                              : LeaveDayCategory.nationalOrSunday,
                    ),
                    title: holidayTypeLabel(info.holiday!.type),
                    body: info.holiday!.name,
                  ),
                if (info.leaves.any((l) => l.isOwn))
                  _ModalSection(
                    color: LeaveCalendarColors.ownLeave,
                    title: context.l10n.leaveCalendarLegendOwnLeave,
                    body: info.leaves
                        .where((l) => l.isOwn)
                        .map((l) => '${l.title}\n${l.start} – ${l.end}')
                        .join('\n\n'),
                  ),
                if (info.leaves.any((l) => !l.isOwn))
                  _ModalSection(
                    color: LeaveCalendarColors.otherLeave,
                    title: context.l10n.leaveCalendarLegendOtherLeave,
                    body: info.leaves
                        .where((l) => !l.isOwn)
                        .map(
                          (l) =>
                              '${l.employeeName}\n${l.title}\n${l.start} – ${l.end}',
                        )
                        .join('\n\n'),
                  ),
              ],
            ),
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
      appBar: HiveAppBar(
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
                  message: ApiClient.friendlyMessage(error),
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
              onToday: () {
                final now = DateTime.now();
                setState(() => _currentMonth = DateTime(now.year, now.month));
                ref
                    .read(leaveCalendarProvider.notifier)
                    .loadMonth(now.year, now.month);
              },
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

class _ModalSection extends StatelessWidget {
  final Color color;
  final String title;
  final String body;

  const _ModalSection({
    required this.color,
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.sm),
      child: HiveCard(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 4,
              height: 48,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: AppTheme.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppTextStyle.h3),
                  const SizedBox(height: 4),
                  Text(body, style: AppTextStyle.caption),
                ],
              ),
            ),
          ],
        ),
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
  final void Function(LeaveDayInfo) onDayTap;

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
    final summary = buildMonthSummary(
      year: year,
      month: month,
      holidays: data.holidays,
      events: data.events,
    );

    final cells = <Widget>[];

    for (var i = 0; i < adjustedFirstDay; i++) {
      cells.add(const SizedBox(height: 76));
    }

    for (var day = 1; day <= totalDays; day++) {
      final date = DateTime(year, month, day);
      final dayStr = dateStr(date);
      final dayLeaves = eventsForDay(dayStr, data.events);
      final holiday = data.holidays.where((h) => h.date == dayStr).firstOrNull;
      final info = buildLeaveDayInfo(
        dateStr: dayStr,
        date: date,
        todayStr: todayStr,
        holiday: holiday,
        leaves: dayLeaves,
      );

      cells.add(_DayCell(info: info, onTap: () => onDayTap(info)));
    }

    while (cells.length % 7 != 0) {
      cells.add(const SizedBox(height: 76));
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      children: [
        HiveCard(
          child: DropdownButtonFormField<String?>(
            initialValue: filterDept?.isEmpty == true ? null : filterDept,
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
                  Text('${monthNames[month - 1]} $year', style: AppTextStyle.h2),
                  Row(
                    children: [
                      IconButton(
                        onPressed: onPrevMonth,
                        icon: const Icon(Icons.chevron_left_rounded),
                        color: AppColors.amberAccent,
                      ),
                      TextButton(
                        onPressed: onToday,
                        child: Text(context.l10n.shiftToday),
                      ),
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
        const SizedBox(height: AppTheme.md),
        HiveCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.l10n.leaveCalendarLegendTitle,
                style: AppTextStyle.h3,
              ),
              const SizedBox(height: AppTheme.sm),
              _LegendRow(
                color: LeaveCalendarColors.today.withValues(alpha: 0.5),
                label: context.l10n.leaveCalendarLegendToday,
                border: true,
              ),
              _LegendRow(
                color: LeaveCalendarColors.national.withValues(alpha: 0.5),
                label: context.l10n.leaveCalendarLegendNational,
              ),
              _LegendRow(
                color: LeaveCalendarColors.collective.withValues(alpha: 0.5),
                label: context.l10n.leaveCalendarLegendCollective,
              ),
              _LegendRow(
                color: LeaveCalendarColors.company.withValues(alpha: 0.5),
                label: context.l10n.leaveCalendarLegendCompany,
              ),
              _LegendRow(
                color: LeaveCalendarColors.ownLeave.withValues(alpha: 0.5),
                label: context.l10n.leaveCalendarLegendOwnLeave,
              ),
              _LegendRow(
                color: LeaveCalendarColors.otherLeave.withValues(alpha: 0.5),
                label: context.l10n.leaveCalendarLegendOtherLeave,
              ),
              Text(
                context.l10n.leaveCalendarMultiHint,
                style: AppTextStyle.caption,
              ),
            ],
          ),
        ),
        if (summary.isNotEmpty) ...[
          const SizedBox(height: AppTheme.md),
          HiveCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.l10n.leaveCalendarMonthSummary(
                    monthNames[month - 1],
                    year,
                  ),
                  style: AppTextStyle.h3,
                ),
                const SizedBox(height: AppTheme.md),
                ...summary.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: AppTheme.md),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 4,
                          height: 40,
                          decoration: BoxDecoration(
                            color: switch (item.category) {
                              LeaveDayCategory.today => LeaveCalendarColors.today,
                              LeaveDayCategory.nationalOrSunday =>
                                LeaveCalendarColors.national,
                              LeaveDayCategory.collective =>
                                LeaveCalendarColors.collective,
                              LeaveDayCategory.company =>
                                LeaveCalendarColors.company,
                              LeaveDayCategory.ownLeave =>
                                LeaveCalendarColors.ownLeave,
                              LeaveDayCategory.otherLeave =>
                                LeaveCalendarColors.otherLeave,
                            },
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: AppTheme.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.title, style: AppTextStyle.body1),
                              const SizedBox(height: 4),
                              Text(
                                item.subtitle,
                                style: AppTextStyle.caption,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _DayCell extends StatelessWidget {
  final LeaveDayInfo info;
  final VoidCallback onTap;

  const _DayCell({required this.info, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final dayNum = info.dateStr.split('-').last;

    return GestureDetector(
      onTap: info.isInteractive ? onTap : null,
      child: Container(
        height: 76,
        padding: const EdgeInsets.all(3),
        decoration: BoxDecoration(
          color: info.backgroundColor,
          border: Border.all(
            color: info.isToday
                ? LeaveCalendarColors.today
                : AppColors.textSubtle.withValues(alpha: 0.2),
            width: info.isToday ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              dayNum,
              style: AppTextStyle.caption.copyWith(
                fontWeight: info.isToday ? FontWeight.bold : FontWeight.normal,
                color: info.isToday ? LeaveCalendarColors.today : null,
              ),
            ),
            if (info.holiday != null)
              Text(
                info.holiday!.name,
                style: AppTextStyle.overline.copyWith(fontSize: 6),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            Expanded(
              child: info.leaves.isEmpty
                  ? const SizedBox.shrink()
                  : Text(
                      info.leaves.first.employeeName.split(' ').first,
                      style: AppTextStyle.overline.copyWith(fontSize: 8),
                      overflow: TextOverflow.ellipsis,
                    ),
            ),
            if (info.categories.length > 1)
              Row(
                children: [
                  ...info.categories.take(4).map(
                        (cat) => Padding(
                          padding: const EdgeInsets.only(right: 2),
                          child: Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: info.categoryColor(cat),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ),
                  if (info.categories.length > 4)
                    Text(
                      '+${info.categories.length - 4}',
                      style: AppTextStyle.overline.copyWith(fontSize: 7),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _LegendRow extends StatelessWidget {
  final Color color;
  final String label;
  final bool border;

  const _LegendRow({
    required this.color,
    required this.label,
    this.border = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              color: border ? Colors.transparent : color,
              border: border ? Border.all(color: color, width: 2) : null,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(width: AppTheme.sm),
          Expanded(child: Text(label, style: AppTextStyle.caption)),
        ],
      ),
    );
  }
}

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull {
    final iterator = this.iterator;
    if (!iterator.moveNext()) return null;
    return iterator.current;
  }
}
