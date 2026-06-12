import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/attendance_model.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/status_badge.dart';

class HomeHeader extends StatefulWidget {
  final String name;
  final String? photoUrl;
  final AttendanceModel? attendance;

  const HomeHeader({
    super.key,
    required this.name,
    this.photoUrl,
    this.attendance,
  });

  @override
  State<HomeHeader> createState() => _HomeHeaderState();
}

class _HomeHeaderState extends State<HomeHeader> {
  late Timer _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  StatusType _resolveStatusType() {
    final attendance = widget.attendance;
    if (attendance == null || attendance.checkIn == null) {
      return StatusType.absent;
    }
    final status = attendance.status?.toLowerCase() ?? '';
    if (status.contains('late') || status.contains('terlambat')) {
      return StatusType.late;
    }
    if (status.contains('on time') || status.contains('ontime')) {
      return StatusType.onTime;
    }
    return StatusType.present;
  }

  String _statusText(BuildContext context) {
    final attendance = widget.attendance;
    if (attendance == null || attendance.checkIn == null) {
      return context.l10n.notCheckedIn;
    }
    if (attendance.checkOut != null) return context.l10n.checkedOut;
    final status = attendance.status?.toLowerCase() ?? '';
    if (status.contains('late') || status.contains('terlambat')) {
      return context.l10n.late;
    }
    if (status.contains('on time') || status.contains('ontime')) {
      return context.l10n.onTime;
    }
    return context.l10n.present;
  }

  String _timeSubtitle() {
    final attendance = widget.attendance;
    if (attendance?.checkIn == null) return '—';
    if (attendance!.checkOut != null) {
      return '${DateTimeFormatter.formatTime(attendance.checkIn)} – ${DateTimeFormatter.formatTime(attendance.checkOut)}';
    }
    return DateTimeFormatter.formatTime(attendance.checkIn);
  }

  @override
  Widget build(BuildContext context) {
    final dateLabel = DateFormat('EEEE, d MMM yyyy', 'id_ID').format(_now);
    final timeLabel = DateFormat('HH:mm').format(_now);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(dateLabel, style: AppTextStyle.caption),
                  const SizedBox(height: 2),
                  Text(
                    '$timeLabel WIB',
                    style: AppTextStyle.h1.copyWith(color: AppColors.amberAccent),
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => context.openFeature('/profile'),
              child: CircleAvatar(
                radius: 22,
                backgroundColor: AppColors.cardElevated,
                backgroundImage: widget.photoUrl != null &&
                        widget.photoUrl!.isNotEmpty
                    ? CachedNetworkImageProvider(widget.photoUrl!)
                    : null,
                child: widget.photoUrl == null || widget.photoUrl!.isEmpty
                    ? Text(
                        _initials(widget.name),
                        style: AppTextStyle.caption,
                      )
                    : null,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppTheme.md),
        HiveCard(
          accentLeft: true,
          onTap: () => context.openFeature('/attendance'),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(context.l10n.todayStatus, style: AppTextStyle.overline),
                    const SizedBox(height: AppTheme.xs),
                    Text(_statusText(context), style: AppTextStyle.h3),
                    Text(_timeSubtitle(), style: AppTextStyle.caption),
                  ],
                ),
              ),
              StatusBadge(status: _resolveStatusType()),
              const SizedBox(width: AppTheme.xs),
              Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textSubtle,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
