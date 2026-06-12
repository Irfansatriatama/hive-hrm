import 'package:flutter/material.dart';
import '../../../shared/widgets/hive_app_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/announcement_model.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../providers/announcement_provider.dart';
import '../widgets/announcement_tile.dart';
import 'announcement_detail_sheet.dart';

class AnnouncementScreen extends ConsumerWidget {
  const AnnouncementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final announcementState = ref.watch(announcementProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: HiveAppBar(
        title: Text(context.l10n.announcementTitle, style: AppTextStyle.h1),
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(announcementProvider.future),
        child: switch (announcementState) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: AnnouncementSkeleton(),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(announcementProvider),
                ),
              ),
            ),
          AsyncData(:final value) => _AnnouncementList(announcements: value),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _AnnouncementList extends StatelessWidget {
  final List<AnnouncementModel> announcements;

  const _AnnouncementList({required this.announcements});

  @override
  Widget build(BuildContext context) {
    if (announcements.isEmpty) {
      return SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.7,
          child: EmptyView(
            icon: Icons.campaign_rounded,
            title: context.l10n.emptyAnnouncement,
          ),
        ),
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      itemCount: announcements.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
      itemBuilder: (context, index) {
        final announcement = announcements[index];
        return AnnouncementTile(
          announcement: announcement,
          onTap: () => showAnnouncementDetailSheet(context, announcement),
        );
      },
    );
  }
}
