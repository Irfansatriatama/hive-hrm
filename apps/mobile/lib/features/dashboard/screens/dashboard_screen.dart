import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../providers/dashboard_provider.dart';
import '../widgets/announcement_preview.dart';
import '../widgets/greeting_row.dart';
import '../widgets/quick_actions_row.dart';
import '../widgets/stats_grid.dart';
import '../widgets/today_status_card.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardState = ref.watch(dashboardProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        toolbarHeight: 0,
        elevation: 0,
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(dashboardProvider.future),
        child: switch (dashboardState) {
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GreetingRow(
                    name: value.employee.name,
                    photoUrl: value.employee.photoUrl,
                    hasUnread: value.announcements.any((a) => !a.isRead),
                  ),
                  const SizedBox(height: AppTheme.md),
                  TodayStatusCard(attendance: value.todayAttendance),
                  const SizedBox(height: AppTheme.sm + AppTheme.xs),
                  StatsGrid(data: value),
                  const SizedBox(height: AppTheme.sm + AppTheme.xs),
                  const QuickActionsRow(),
                  const SizedBox(height: AppTheme.md),
                  Text(
                    context.l10n.recentAnnouncements,
                    style: AppTextStyle.overline,
                  ),
                  const SizedBox(height: AppTheme.sm),
                  AnnouncementPreview(announcements: value.announcements),
                  const SizedBox(height: AppTheme.lg),
                ],
              ),
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}
