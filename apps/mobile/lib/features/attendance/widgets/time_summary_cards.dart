import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/attendance_model.dart';
import '../../../shared/widgets/hive_card.dart';

class TimeSummaryCards extends StatelessWidget {
  final AttendanceModel? today;

  const TimeSummaryCards({super.key, required this.today});

  String _formatTime(DateTime? time) {
    if (time == null) return '—';
    return DateFormat('HH:mm').format(time);
  }

  String _formatDuration(BuildContext context, AttendanceModel? attendance) {
    if (attendance?.checkIn == null) return '—';

    if (attendance!.workHours != null && attendance.workHours! > 0) {
      final totalMinutes = (attendance.workHours! * 60).round();
      final hours = totalMinutes ~/ 60;
      final minutes = totalMinutes % 60;
      return context.l10n.durationHoursMinutes(hours, minutes);
    }

    if (attendance.checkOut != null) {
      final diff = attendance.checkOut!.difference(attendance.checkIn!);
      final hours = diff.inHours;
      final minutes = diff.inMinutes % 60;
      return context.l10n.durationHoursMinutes(hours, minutes);
    }

    final diff = DateTime.now().difference(attendance.checkIn!);
    final hours = diff.inHours;
    final minutes = diff.inMinutes % 60;
    return context.l10n.durationHoursMinutes(hours, minutes);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _TimeCard(
            label: context.l10n.timeIn,
            value: _formatTime(today?.checkIn),
            valueColor: today?.checkIn != null
                ? AppColors.successGreen
                : AppColors.textSubtle,
          ),
        ),
        const SizedBox(width: AppTheme.sm),
        Expanded(
          child: _TimeCard(
            label: context.l10n.timeOut,
            value: _formatTime(today?.checkOut),
            valueColor: today?.checkOut != null
                ? AppColors.textPrimary
                : AppColors.textSubtle,
          ),
        ),
        const SizedBox(width: AppTheme.sm),
        Expanded(
          child: _TimeCard(
            label: context.l10n.durationLabel,
            value: _formatDuration(context, today),
            valueColor: today?.checkIn != null
                ? AppColors.amberAccent
                : AppColors.textSubtle,
          ),
        ),
      ],
    );
  }
}

class _TimeCard extends StatelessWidget {
  final String label;
  final String value;
  final Color valueColor;

  const _TimeCard({
    required this.label,
    required this.value,
    required this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return HiveCard(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.sm,
        vertical: AppTheme.md,
      ),
      child: Column(
        children: [
          Text(label, style: AppTextStyle.caption, textAlign: TextAlign.center),
          const SizedBox(height: AppTheme.xs),
          Text(
            value,
            style: AppTextStyle.h2.copyWith(color: valueColor),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
