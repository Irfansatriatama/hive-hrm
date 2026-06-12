import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/attendance_model.dart';

class AttendanceLocationRow extends StatelessWidget {
  final AttendanceModel record;

  const AttendanceLocationRow({super.key, required this.record});

  Future<void> _openMaps(BuildContext context) async {
    if (!record.hasGps) return;
    final lat = record.effectiveCheckInLat!;
    final lng = record.effectiveCheckInLng!;
    final uri = Uri.parse('https://maps.google.com/?q=$lat,$lng');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final location = record.displayLocation;
    if (location == null) return const SizedBox.shrink();

    final content = Row(
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
                style: AppTextStyle.caption.copyWith(
                  color: record.hasGps ? AppColors.tealSecondary : null,
                  decoration: record.hasGps ? TextDecoration.underline : null,
                ),
                maxLines: 2,
              ),
              if (record.hasGps)
                Text(
                  context.l10n.openInMaps,
                  style: AppTextStyle.caption.copyWith(
                    color: AppColors.textSubtle,
                    fontSize: 10,
                  ),
                ),
            ],
          ),
        ),
      ],
    );

    if (!record.hasGps) return content;

    return Semantics(
      button: true,
      label: context.l10n.openInMaps,
      child: InkWell(
        onTap: () => _openMaps(context),
        borderRadius: BorderRadius.circular(AppTheme.radiusBtn),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppTheme.xs),
          child: content,
        ),
      ),
    );
  }
}
