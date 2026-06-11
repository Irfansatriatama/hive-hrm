import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/announcement_model.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/hive_card.dart';

class AnnouncementCarousel extends StatefulWidget {
  final List<AnnouncementModel> announcements;

  const AnnouncementCarousel({super.key, required this.announcements});

  @override
  State<AnnouncementCarousel> createState() => _AnnouncementCarouselState();
}

class _AnnouncementCarouselState extends State<AnnouncementCarousel> {
  late final PageController _controller;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _controller = PageController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _relativeTime(BuildContext context, DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 60) {
      return context.l10n.minutesAgo(diff.inMinutes);
    }
    if (diff.inHours < 24) return context.l10n.hoursAgo(diff.inHours);
    if (diff.inDays == 1) return context.l10n.yesterday;
    if (diff.inDays < 7) return context.l10n.daysAgo(diff.inDays);
    return DateFormat('dd MMM yyyy', 'id').format(dateTime);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.announcements.isEmpty) {
      return EmptyView(
        title: context.l10n.emptyAnnouncement,
        icon: Icons.campaign_rounded,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 132,
          child: PageView.builder(
            controller: _controller,
            itemCount: widget.announcements.length,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemBuilder: (context, index) {
              final item = widget.announcements[index];
              return Padding(
                padding: const EdgeInsets.only(right: AppTheme.xs),
                child: HiveCard(
                  onTap: () => context.go('/announcement'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.campaign_rounded,
                            color: AppColors.amberAccent,
                            size: 18,
                          ),
                          const SizedBox(width: AppTheme.xs),
                          Expanded(
                            child: Text(
                              item.title,
                              style: AppTextStyle.body1.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppTheme.sm),
                      Expanded(
                        child: Text(
                          item.content,
                          style: AppTextStyle.body2.copyWith(
                            color: AppColors.textSubtle,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        _relativeTime(context, item.createdAt),
                        style: AppTextStyle.caption,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        if (widget.announcements.length > 1) ...[
          const SizedBox(height: AppTheme.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(widget.announcements.length, (index) {
              final active = index == _currentPage;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: active ? 16 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: active
                      ? AppColors.amberAccent
                      : AppColors.textSubtle.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                ),
              );
            }),
          ),
        ],
      ],
    );
  }
}
