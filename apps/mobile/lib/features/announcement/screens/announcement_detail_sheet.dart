import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/announcement_model.dart';

Future<void> showAnnouncementDetailSheet(
  BuildContext context,
  AnnouncementModel announcement,
) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(AppTheme.radiusCard),
      ),
    ),
    builder: (ctx) => AnnouncementDetailSheet(announcement: announcement),
  );
}

class AnnouncementDetailSheet extends StatelessWidget {
  final AnnouncementModel announcement;

  const AnnouncementDetailSheet({super.key, required this.announcement});

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context).languageCode;
    final formattedDate = DateFormat(
      'dd MMMM yyyy, HH:mm',
      locale,
    ).format(announcement.createdAt);

    final maxHeight = MediaQuery.sizeOf(context).height * 0.75;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: AppTheme.md,
          right: AppTheme.md,
          top: AppTheme.md,
          bottom: MediaQuery.viewInsetsOf(context).bottom + AppTheme.md,
        ),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxHeight),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      announcement.title,
                      style: AppTextStyle.h2,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded),
                    color: AppColors.textSubtle,
                    constraints: const BoxConstraints(
                      minWidth: AppTheme.tapMin,
                      minHeight: AppTheme.tapMin,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.xs),
              Text(
                formattedDate,
                style: AppTextStyle.caption,
              ),
              const SizedBox(height: AppTheme.md),
              Flexible(
                child: SingleChildScrollView(
                  child: Text(
                    announcement.content,
                    style: AppTextStyle.body1,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
