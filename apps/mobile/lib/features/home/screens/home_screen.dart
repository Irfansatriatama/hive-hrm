import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../dashboard/providers/dashboard_provider.dart';
import '../../dashboard/widgets/stats_grid.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/section_label.dart';
import '../widgets/announcement_carousel.dart';
import '../widgets/home_feed_section.dart';
import '../widgets/home_header.dart';
import '../widgets/home_menu_grid.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeState = ref.watch(dashboardProvider);

    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(gradient: AppColors.scaffoldGradient),
        child: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: AppColors.amberAccent,
          backgroundColor: AppColors.surfaceBlue,
          onRefresh: () => ref.refresh(dashboardProvider.future),
          child: switch (homeState) {
            AsyncLoading() => const SingleChildScrollView(
                physics: AlwaysScrollableScrollPhysics(),
                child: DashboardSkeleton(),
              ),
            AsyncError(:final error) => SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: SizedBox(
                  height: MediaQuery.sizeOf(context).height * 0.7,
                  child: ErrorView(
                    message: error.toString(),
                    onRetry: () => ref.invalidate(dashboardProvider),
                  ),
                ),
              ),
            AsyncData(:final value) => SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(AppTheme.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    HomeHeader(
                      name: value.employee.name,
                      photoUrl: value.employee.photoUrl,
                      attendance: value.todayAttendance,
                    ),
                    const SizedBox(height: AppTheme.md),
                    SectionLabel(context.l10n.recentAnnouncements),
                    const SizedBox(height: AppTheme.sm),
                    AnnouncementCarousel(announcements: value.announcements),
                    const SizedBox(height: AppTheme.md),
                    SectionLabel(context.l10n.homeSummaryTitle),
                    const SizedBox(height: AppTheme.sm),
                    StatsGrid(data: value),
                    const SizedBox(height: AppTheme.md),
                    const HomeMenuGrid(),
                    const SizedBox(height: AppTheme.md),
                    const HomeFeedSection(),
                    const SizedBox(height: AppTheme.lg),
                  ],
                ),
              ),
            _ => const SizedBox.shrink(),
          },
        ),
        ),
      ),
    );
  }
}
