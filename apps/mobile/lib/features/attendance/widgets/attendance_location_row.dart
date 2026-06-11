import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/attendance_model.dart';

class AttendanceLocationRow extends StatelessWidget {
  final AttendanceModel record;

  const AttendanceLocationRow({super.key, required this.record});

  @override
  Widget build(BuildContext context) {
    final location = record.displayLocation;
    if (location == null) return const SizedBox.shrink();

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          Icons.location_on_outlined,
          size: AppTheme.md,
          color: record.hasGps ? AppColors.successGreen : AppColors.textSubtle,
        ),
        const SizedBox(width: AppTheme.xs),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (record.hasGps)
                Text(
                  'GPS',
                  style: AppTextStyle.caption.copyWith(
                    color: AppColors.successGreen,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              Text(
                location,
                style: AppTextStyle.caption,
                maxLines: 2,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
