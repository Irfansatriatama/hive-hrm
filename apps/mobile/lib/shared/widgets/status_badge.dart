import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

enum StatusType {
  present,
  onTime,
  late,
  absent,
  approved,
  pending,
  rejected,
  active,
  inactive,
}

class StatusBadge extends StatelessWidget {
  final StatusType status;
  final String? label;

  const StatusBadge({super.key, required this.status, this.label});

  @override
  Widget build(BuildContext context) {
    final (text, color) = switch (status) {
      StatusType.present => ('HADIR', AppColors.successGreen),
      StatusType.onTime => ('ON TIME', AppColors.successGreen),
      StatusType.late => ('TERLAMBAT', AppColors.warningAmber),
      StatusType.absent => ('ABSEN', AppColors.errorRed),
      StatusType.approved => ('DISETUJUI', AppColors.successGreen),
      StatusType.pending => ('MENUNGGU', AppColors.warningAmber),
      StatusType.rejected => ('DITOLAK', AppColors.errorRed),
      StatusType.active => ('AKTIF', AppColors.successGreen),
      StatusType.inactive => ('NONAKTIF', AppColors.textSubtle),
    };

    final displayText = label ?? text;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        border: Border.all(color: color),
        borderRadius: BorderRadius.circular(AppTheme.radiusPill),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
