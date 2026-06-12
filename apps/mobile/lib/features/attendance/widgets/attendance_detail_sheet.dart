import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/attendance_model.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/status_badge.dart';

Future<void> showAttendanceDetailSheet(
  BuildContext context,
  AttendanceModel record,
) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.lg)),
    ),
    builder: (ctx) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      minChildSize: 0.45,
      maxChildSize: 0.95,
      builder: (_, controller) => _AttendanceDetailBody(
        record: record,
        controller: controller,
      ),
    ),
  );
}

class _AttendanceDetailBody extends StatelessWidget {
  final AttendanceModel record;
  final ScrollController controller;

  const _AttendanceDetailBody({
    required this.record,
    required this.controller,
  });

  StatusType _resolveStatus() {
    if (record.checkIn == null) return StatusType.absent;
    final status = record.status?.toLowerCase() ?? '';
    if (status.contains('late') || (record.lateMinutes ?? 0) > 0) {
      return StatusType.late;
    }
    if (status.contains('on time')) return StatusType.onTime;
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

  String _formatDuration(BuildContext context) {
    if (record.workHours != null && record.workHours! > 0) {
      final totalMinutes = (record.workHours! * 60).round();
      return context.l10n.durationHoursMinutes(
        totalMinutes ~/ 60,
        totalMinutes % 60,
      );
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

  String _formatOvertime(BuildContext context) {
    final mins = record.overtimeMinutes ?? 0;
    if (mins <= 0) return '—';
    return context.l10n.durationHoursMinutes(mins ~/ 60, mins % 60);
  }

  Future<void> _openMaps(double lat, double lng) async {
    final uri = Uri.parse('https://maps.google.com/?q=$lat,$lng');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final recordDate = record.date ?? record.checkIn ?? DateTime.now();

    return ListView(
      controller: controller,
      padding: const EdgeInsets.all(AppTheme.md),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                DateTimeFormatter.formatDate(recordDate, locale: 'id_ID'),
                style: AppTextStyle.h2,
              ),
            ),
            StatusBadge(status: _resolveStatus(), label: _statusLabel(context)),
          ],
        ),
        const SizedBox(height: AppTheme.md),
        if (record.hasSelfie) ...[
          ClipRRect(
            borderRadius: BorderRadius.circular(AppTheme.md),
            child: AspectRatio(
              aspectRatio: 4 / 3,
              child: Image.network(
                record.selfieUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: AppColors.cardElevated,
                  child: const Center(
                    child: Icon(Icons.broken_image_outlined, size: 48),
                  ),
                ),
                loadingBuilder: (_, child, progress) {
                  if (progress == null) return child;
                  return Container(
                    color: AppColors.cardElevated,
                    child: const Center(child: CircularProgressIndicator()),
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: AppTheme.sm),
          Text(context.l10n.attendanceSelfieLabel, style: AppTextStyle.caption),
          const SizedBox(height: AppTheme.md),
        ],
        HiveCard(
          child: Column(
            children: [
              _DetailRow(
                label: context.l10n.timeIn,
                value: DateTimeFormatter.formatTime(record.checkIn),
              ),
              _DetailRow(
                label: context.l10n.timeOut,
                value: DateTimeFormatter.formatTime(record.checkOut),
              ),
              _DetailRow(
                label: context.l10n.durationLabel,
                value: _formatDuration(context),
              ),
              _DetailRow(
                label: context.l10n.attendanceOvertimeLabel,
                value: _formatOvertime(context),
                highlight: record.hasOvertime,
              ),
              if ((record.lateMinutes ?? 0) > 0)
                _DetailRow(
                  label: context.l10n.attendanceLateMinutes,
                  value: context.l10n.durationMinutes(record.lateMinutes!),
                ),
              if ((record.earlyLeaveMinutes ?? 0) > 0)
                _DetailRow(
                  label: context.l10n.attendanceEarlyLeave,
                  value: context.l10n.durationMinutes(record.earlyLeaveMinutes!),
                ),
            ],
          ),
        ),
        const SizedBox(height: AppTheme.md),
        if (record.checkInLocationLabel != null)
          HiveCard(
            child: _LocationBlock(
              title: context.l10n.attendanceCheckInLocation,
              location: record.checkInLocationLabel!,
              lat: record.effectiveCheckInLat,
              lng: record.effectiveCheckInLng,
              onOpenMaps: _openMaps,
            ),
          ),
        if (record.checkOutLocationLabel != null) ...[
          const SizedBox(height: AppTheme.sm),
          HiveCard(
            child: _LocationBlock(
              title: context.l10n.attendanceCheckOutLocation,
              location: record.checkOutLocationLabel!,
              lat: record.checkOutLatitude,
              lng: record.checkOutLongitude,
              onOpenMaps: _openMaps,
            ),
          ),
        ],
        if (record.checkInNote != null && record.checkInNote!.isNotEmpty) ...[
          const SizedBox(height: AppTheme.md),
          HiveCard(
            child: _NoteBlock(
              title: context.l10n.attendanceCheckInNote,
              body: record.checkInNote!,
            ),
          ),
        ],
        if (record.checkOutNote != null && record.checkOutNote!.isNotEmpty) ...[
          const SizedBox(height: AppTheme.sm),
          HiveCard(
            child: _NoteBlock(
              title: context.l10n.attendanceCheckOutNote,
              body: record.checkOutNote!,
            ),
          ),
        ],
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool highlight;

  const _DetailRow({
    required this.label,
    required this.value,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTextStyle.caption),
          Text(
            value,
            style: AppTextStyle.body1.copyWith(
              color: highlight ? AppColors.amberAccent : null,
              fontWeight: highlight ? FontWeight.bold : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _LocationBlock extends StatelessWidget {
  final String title;
  final String location;
  final double? lat;
  final double? lng;
  final Future<void> Function(double, double) onOpenMaps;

  const _LocationBlock({
    required this.title,
    required this.location,
    this.lat,
    this.lng,
    required this.onOpenMaps,
  });

  @override
  Widget build(BuildContext context) {
    final hasGps = lat != null && lng != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppTextStyle.h3),
        const SizedBox(height: AppTheme.sm),
        InkWell(
          onTap: hasGps ? () => onOpenMaps(lat!, lng!) : null,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.location_on_outlined,
                size: 20,
                color: hasGps ? AppColors.successGreen : AppColors.textSubtle,
              ),
              const SizedBox(width: AppTheme.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(location, style: AppTextStyle.body2),
                    if (hasGps)
                      Text(
                        context.l10n.openInMaps,
                        style: AppTextStyle.caption.copyWith(
                          color: AppColors.tealSecondary,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _NoteBlock extends StatelessWidget {
  final String title;
  final String body;

  const _NoteBlock({required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AppTextStyle.h3),
        const SizedBox(height: AppTheme.sm),
        Text(body, style: AppTextStyle.body2),
      ],
    );
  }
}
