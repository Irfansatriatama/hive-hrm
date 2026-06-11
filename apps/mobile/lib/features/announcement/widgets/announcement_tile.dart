import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/announcement_model.dart';
import '../../../shared/widgets/hive_card.dart';

String announcementRelativeTime(BuildContext context, DateTime dateTime) {
  final diff = DateTime.now().difference(dateTime);
  if (diff.inMinutes < 60) {
    return context.l10n.minutesAgo(diff.inMinutes);
  }
  if (diff.inHours < 24) return context.l10n.hoursAgo(diff.inHours);
  if (diff.inDays == 1) return context.l10n.yesterday;
  if (diff.inDays < 7) return context.l10n.daysAgo(diff.inDays);
  final locale = Localizations.localeOf(context).languageCode;
  return DateFormat('dd MMM yyyy', locale).format(dateTime);
}

class AnnouncementTile extends StatelessWidget {
  final AnnouncementModel announcement;
  final VoidCallback onTap;

  const AnnouncementTile({
    super.key,
    required this.announcement,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return HiveCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!announcement.isRead) ...[
                Container(
                  width: AppTheme.sm,
                  height: AppTheme.sm,
                  margin: const EdgeInsets.only(
                    top: AppTheme.xs,
                    right: AppTheme.sm,
                  ),
                  decoration: const BoxDecoration(
                    color: AppColors.successGreen,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
              Expanded(
                child: Text(
                  announcement.title,
                  style: AppTextStyle.body1.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.xs),
          Text(
            announcement.content,
            style: AppTextStyle.body2.copyWith(color: AppColors.textSubtle),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppTheme.xs),
          Text(
            announcementRelativeTime(context, announcement.createdAt),
            style: AppTextStyle.caption,
          ),
        ],
      ),
    );
  }
}
