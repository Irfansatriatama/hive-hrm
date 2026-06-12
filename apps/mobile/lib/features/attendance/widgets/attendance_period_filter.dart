import 'package:flutter/material.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/hive_card.dart';

class AttendancePeriodFilter extends StatelessWidget {
  final int month;
  final int year;
  final bool yearlyView;
  final ValueChanged<int> onMonthChanged;
  final ValueChanged<int> onYearChanged;
  final ValueChanged<bool> onYearlyViewChanged;

  static const _monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const AttendancePeriodFilter({
    super.key,
    required this.month,
    required this.year,
    required this.yearlyView,
    required this.onMonthChanged,
    required this.onYearChanged,
    required this.onYearlyViewChanged,
  });

  @override
  Widget build(BuildContext context) {
    final years = List.generate(3, (i) => DateTime.now().year - i);

    return HiveCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  context.l10n.attendancePeriodFilter,
                  style: AppTextStyle.h3,
                ),
              ),
              FilterChip(
                label: Text(context.l10n.attendanceYearlyView),
                selected: yearlyView,
                onSelected: onYearlyViewChanged,
              ),
            ],
          ),
          const SizedBox(height: AppTheme.sm),
          Row(
            children: [
              if (!yearlyView)
                Expanded(
                  child: DropdownButtonFormField<int>(
                    initialValue: month,
                    decoration: InputDecoration(
                      labelText: context.l10n.attendanceMonthLabel,
                      border: InputBorder.none,
                    ),
                    items: List.generate(
                      12,
                      (i) => DropdownMenuItem(
                        value: i + 1,
                        child: Text(_monthNames[i]),
                      ),
                    ),
                    onChanged: (v) {
                      if (v != null) onMonthChanged(v);
                    },
                  ),
                ),
              if (!yearlyView) const SizedBox(width: AppTheme.sm),
              Expanded(
                child: DropdownButtonFormField<int>(
                  initialValue: year,
                  decoration: InputDecoration(
                    labelText: context.l10n.attendanceYearLabel,
                    border: InputBorder.none,
                  ),
                  items: years
                      .map(
                        (y) => DropdownMenuItem(
                          value: y,
                          child: Text('$y'),
                        ),
                      )
                      .toList(),
                  onChanged: (v) {
                    if (v != null) onYearChanged(v);
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
