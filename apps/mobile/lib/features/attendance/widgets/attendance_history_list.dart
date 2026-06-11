import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/attendance_model.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/status_badge.dart';

class AttendanceHistoryList extends StatelessWidget {
  final List<AttendanceModel> history;

  const AttendanceHistoryList({super.key, required this.history});

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty) {
      return EmptyView(
        icon: Icons.history_rounded,
        title: context.l10n.emptyAttendanceHistory,
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: history.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
      itemBuilder: (context, index) {
        return AttendanceHistoryTile(record: history[index]);
      },
    );
  }
}

class AttendanceHistoryTile extends StatelessWidget {
  final AttendanceModel record;

  const AttendanceHistoryTile({super.key, required this.record});

  String _formatTime(DateTime? time) {
    if (time == null) return '—';
    return DateFormat('HH:mm').format(time);
  }

  String _formatDate(DateTime date) {
    return DateFormat('EEE, d MMM yyyy', 'id_ID').format(date);
  }

  String _formatDuration(BuildContext context) {
    if (record.workHours != null && record.workHours! > 0) {
      final totalMinutes = (record.workHours! * 60).round();
      final hours = totalMinutes ~/ 60;
      final minutes = totalMinutes % 60;
      return context.l10n.durationHoursMinutes(hours, minutes);
    }
    if (record.checkIn != null && record.checkOut != null) {
      final diff = record.checkOut!.difference(record.checkIn!);
      return context.l10n.durationHoursMinutes(
        diff.inHours,
        diff.inMinutes % 60,
      );
    }
    return '—';
  }

  StatusType _resolveStatus() {
    if (record.checkIn == null) return StatusType.absent;
    final status = record.status?.toLowerCase() ?? '';
    if (status.contains('late') || status.contains('terlambat')) {
      return StatusType.late;
    }
    if (status.contains('on time') || status.contains('ontime')) {
      return StatusType.onTime;
    }
    return StatusType.present;
  }

  String _statusLabel(BuildContext context) {
    return switch (_resolveStatus()) {
      StatusType.absent => context.l10n.absent,
      StatusType.late => context.l10n.late,
      StatusType.onTime => context.l10n.onTime,
      StatusType.present => context.l10n.present,
      _ => context.l10n.present,
    };
  }

  String? _locationText() {
    if (record.location != null && record.location!.isNotEmpty) {
      return record.location;
    }
    if (record.latitude != null && record.longitude != null) {
      return '${record.latitude!.toStringAsFixed(4)}, ${record.longitude!.toStringAsFixed(4)}';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final recordDate = record.date ?? record.checkIn ?? DateTime.now();
    final location = _locationText();

    return HiveCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  _formatDate(recordDate),
                  style: AppTextStyle.body1.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              StatusBadge(
                status: _resolveStatus(),
                label: _statusLabel(context),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.sm),
          Row(
            children: [
              Expanded(
                child: _InfoColumn(
                  label: context.l10n.timeIn,
                  value: _formatTime(record.checkIn),
                ),
              ),
              Expanded(
                child: _InfoColumn(
                  label: context.l10n.timeOut,
                  value: _formatTime(record.checkOut),
                ),
              ),
              Expanded(
                child: _InfoColumn(
                  label: context.l10n.durationLabel,
                  value: _formatDuration(context),
                ),
              ),
            ],
          ),
          if (location != null) ...[
            const SizedBox(height: AppTheme.sm),
            Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: AppTheme.md,
                  color: AppColors.textSubtle,
                ),
                const SizedBox(width: AppTheme.xs),
                Expanded(
                  child: Text(
                    location,
                    style: AppTextStyle.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoColumn extends StatelessWidget {
  final String label;
  final String value;

  const _InfoColumn({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyle.caption),
        const SizedBox(height: AppTheme.xs),
        Text(value, style: AppTextStyle.body2),
      ],
    );
  }
}
