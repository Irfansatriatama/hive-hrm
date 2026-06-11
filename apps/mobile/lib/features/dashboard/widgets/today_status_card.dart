import 'package:flutter/material.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/attendance_model.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/status_badge.dart';

class TodayStatusCard extends StatelessWidget {
  final AttendanceModel? attendance;

  const TodayStatusCard({super.key, required this.attendance});

  StatusType _resolveStatusType() {
    if (attendance == null || attendance!.checkIn == null) {
      return StatusType.absent;
    }
    final status = attendance!.status?.toLowerCase() ?? '';
    if (status.contains('late') || status.contains('terlambat')) {
      return StatusType.late;
    }
    if (status.contains('on time') || status.contains('ontime')) {
      return StatusType.onTime;
    }
    if (attendance!.checkOut != null) {
      return StatusType.present;
    }
    return StatusType.present;
  }

  String _statusText(BuildContext context) {
    if (attendance == null || attendance!.checkIn == null) {
      return context.l10n.notCheckedIn;
    }
    if (attendance!.checkOut != null) {
      return context.l10n.checkedOut;
    }
    final status = attendance!.status?.toLowerCase() ?? '';
    if (status.contains('late') || status.contains('terlambat')) {
      return context.l10n.late;
    }
    if (status.contains('on time') || status.contains('ontime')) {
      return context.l10n.onTime;
    }
    return context.l10n.present;
  }

  String _timeSubtitle() {
    if (attendance?.checkIn == null) return '—';
    if (attendance!.checkOut != null) {
      return '${DateTimeFormatter.formatTime(attendance!.checkIn)} – ${DateTimeFormatter.formatTime(attendance!.checkOut)}';
    }
    return DateTimeFormatter.formatTime(attendance!.checkIn);
  }

  String _badgeLabel(BuildContext context) {
    final type = _resolveStatusType();
    return switch (type) {
      StatusType.absent => context.l10n.absent,
      StatusType.late => context.l10n.late,
      StatusType.onTime => context.l10n.onTime,
      StatusType.present => context.l10n.present,
      _ => context.l10n.present,
    };
  }

  @override
  Widget build(BuildContext context) {
    return HiveCard(
      accentLeft: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(context.l10n.todayStatus, style: AppTextStyle.overline),
          const SizedBox(height: AppTheme.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_statusText(context), style: AppTextStyle.h2),
                    const SizedBox(height: AppTheme.xs),
                    Text(_timeSubtitle(), style: AppTextStyle.caption),
                  ],
                ),
              ),
              StatusBadge(
                status: _resolveStatusType(),
                label: _badgeLabel(context),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
