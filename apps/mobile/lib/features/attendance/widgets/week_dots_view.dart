import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../models/attendance_data.dart';

class WeekDotsView extends StatelessWidget {
  final List<WeekDayStatus> weekDays;

  const WeekDotsView({super.key, required this.weekDays});

  String _dayLabel(BuildContext context, int weekday) {
    return switch (weekday) {
      DateTime.monday => context.l10n.weekMon,
      DateTime.tuesday => context.l10n.weekTue,
      DateTime.wednesday => context.l10n.weekWed,
      DateTime.thursday => context.l10n.weekThu,
      DateTime.friday => context.l10n.weekFri,
      _ => '',
    };
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: weekDays.map((day) {
        final dotColor = day.isPresent
            ? AppColors.successGreen
            : day.isFuture
                ? AppColors.dividerLine
                : AppColors.cardElevated;

        return Expanded(
          child: Column(
            children: [
              Text(
                _dayLabel(context, day.date.weekday),
                style: AppTextStyle.caption.copyWith(
                  color: day.isToday
                      ? AppColors.amberAccent
                      : AppColors.textSubtle,
                  fontWeight:
                      day.isToday ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
              const SizedBox(height: AppTheme.sm),
              Container(
                width: AppTheme.lg,
                height: AppTheme.lg,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: day.isPresent ? dotColor.withOpacity(0.2) : dotColor,
                  border: day.isToday
                      ? Border.all(color: AppColors.amberAccent, width: 2)
                      : day.isPresent
                          ? Border.all(color: AppColors.successGreen, width: 1.5)
                          : null,
                ),
                child: day.isPresent
                    ? Center(
                        child: Container(
                          width: AppTheme.sm,
                          height: AppTheme.sm,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.successGreen,
                          ),
                        ),
                      )
                    : null,
              ),
              const SizedBox(height: AppTheme.xs),
              Text(
                DateFormat('d').format(day.date),
                style: AppTextStyle.caption.copyWith(
                  color: day.isToday
                      ? AppColors.amberAccent
                      : AppColors.textSubtle,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
