import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/section_label.dart';
import '../models/leave_data.dart';
import '../providers/leave_provider.dart';
import '../widgets/leave_balance_cards.dart';
import '../widgets/leave_request_tile.dart';
import 'leave_apply_sheet.dart';

class LeaveScreen extends ConsumerWidget {
  const LeaveScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaveState = ref.watch(leaveProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.leaveTitle, style: AppTextStyle.h1),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month_rounded),
            tooltip: context.l10n.leaveCalendarTitle,
            onPressed: () => context.go('/leave/calendar'),
          ),
          Padding(
            padding: const EdgeInsets.only(right: AppTheme.sm),
            child: ElevatedButton(
              onPressed: () => showLeaveApplySheet(context),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: AppTheme.md),
                minimumSize: const Size(0, AppTheme.tapMin),
              ),
              child: Text(context.l10n.applyLeave),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(leaveProvider.future),
        child: switch (leaveState) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: LeaveSkeleton(),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(leaveProvider),
                ),
              ),
            ),
          AsyncData(:final value) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(AppTheme.md),
              child: _LeaveContent(data: value),
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _LeaveContent extends StatelessWidget {
  final LeaveData data;

  const _LeaveContent({required this.data});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionLabel(context.l10n.leaveBalance),
        LeaveBalanceCards(balances: data.balances),
        const SizedBox(height: AppTheme.md),
        SectionLabel(context.l10n.activeRequests),
        if (data.activeRequests.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppTheme.md),
            child: EmptyView(
              icon: Icons.pending_actions_rounded,
              title: context.l10n.emptyActiveRequests,
            ),
          )
        else
          ...data.activeRequests.map(
            (request) => LeaveRequestTile(request: request),
          ),
        const SizedBox(height: AppTheme.md),
        SectionLabel(context.l10n.history),
        if (data.history.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppTheme.md),
            child: EmptyView(
              icon: Icons.history_rounded,
              title: context.l10n.emptyLeaveHistory,
            ),
          )
        else
          ...data.history.map(
            (request) => LeaveRequestTile(request: request),
          ),
        const SizedBox(height: AppTheme.lg),
      ],
    );
  }
}
