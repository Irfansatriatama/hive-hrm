import 'package:flutter/material.dart';
import '../../../shared/widgets/hive_fab.dart';
import '../../../shared/widgets/hive_app_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/auth/user_role_provider.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/feature_models.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../profile/providers/profile_provider.dart';
import '../providers/resources_provider.dart';
import '../utils/booking_lifecycle.dart';
import 'resource_availability_tab.dart';
import 'resource_booking_detail_sheet.dart';
import 'resource_booking_sheet.dart';

const _bookingCardHeight = 132.0;

class ResourcesScreen extends ConsumerStatefulWidget {
  const ResourcesScreen({super.key});

  @override
  ConsumerState<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends ConsumerState<ResourcesScreen>
    with SingleTickerProviderStateMixin {
  TabController? _tabController;

  @override
  void dispose() {
    _tabController?.dispose();
    super.dispose();
  }

  void _ensureTabController(int length) {
    if (_tabController?.length == length) return;
    _tabController?.dispose();
    _tabController = TabController(length: length, vsync: this);
  }

  void _openBookingSheet(List<BookableResourceModel> resources) {
    showResourceBookingSheet(context, resources: resources);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(resourcesProvider);
    final canApprove = ref.watch(canApproveResourcesProvider);
    final tabCount = canApprove ? 3 : 2;
    _ensureTabController(tabCount);
    final resources = state.valueOrNull?.resources ?? const [];

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: HiveAppBar(
        title: Text(context.l10n.resourcesTitle, style: AppTextStyle.h1),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.amberAccent,
          labelColor: AppColors.amberAccent,
          unselectedLabelColor: AppColors.textSubtle,
          tabs: [
            Tab(text: context.l10n.resourcesTabAvailability),
            Tab(text: context.l10n.resourcesTabBookings),
            if (canApprove) Tab(text: context.l10n.resourcesTabApproval),
          ],
        ),
      ),
      floatingActionButton: HiveFab.wrap(
        context,
        HiveFab(
          tooltip: context.l10n.resourcesBookingTitle,
          onPressed: state.valueOrNull == null
              ? null
              : () => _openBookingSheet(resources),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(resourcesProvider.future),
        child: switch (state) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: EdgeInsets.all(AppTheme.md),
                child: SkeletonBox(height: 280),
              ),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(resourcesProvider),
                ),
              ),
            ),
          AsyncData(:final value) => TabBarView(
              controller: _tabController,
              children: [
                ResourceAvailabilityTab(resources: value.resources),
                _BookingsList(
                  bookings: value.bookings,
                  profileId: ref.watch(profileProvider).valueOrNull?.id,
                  canApproveOthers: false,
                ),
                if (canApprove)
                  _BookingsList(
                    bookings: value.bookings
                        .where((b) => b.status == 'pending')
                        .toList(),
                    profileId: ref.watch(profileProvider).valueOrNull?.id,
                    canApproveOthers: true,
                    filterOwnPending: true,
                  ),
              ],
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _BookingsList extends ConsumerWidget {
  final List<ResourceBookingModel> bookings;
  final String? profileId;
  final bool canApproveOthers;
  final bool filterOwnPending;

  const _BookingsList({
    required this.bookings,
    required this.profileId,
    this.canApproveOthers = false,
    this.filterOwnPending = false,
  });

  StatusType _status(ResourceBookingModel booking) {
    final phase = resolveResourceBookingPhase(booking);
    return switch (phase) {
      ResourceBookingPhase.completed || ResourceBookingPhase.inProgress =>
        StatusType.approved,
      ResourceBookingPhase.rejected ||
      ResourceBookingPhase.expired ||
      ResourceBookingPhase.cancelled =>
        StatusType.rejected,
      _ => StatusType.pending,
    };
  }

  String _statusLabel(BuildContext context, ResourceBookingModel booking) {
    final phase = resolveResourceBookingPhase(booking);
    return switch (phase) {
      ResourceBookingPhase.pendingApproval =>
        context.l10n.resourcesPhasePendingApproval,
      ResourceBookingPhase.waiting => context.l10n.resourcesPhaseWaiting,
      ResourceBookingPhase.awaitingConfirmation =>
        context.l10n.resourcesPhaseAwaitingConfirm,
      ResourceBookingPhase.inProgress => context.l10n.resourcesPhaseInProgress,
      ResourceBookingPhase.readyToComplete =>
        context.l10n.resourcesPhaseReadyComplete,
      ResourceBookingPhase.completed => context.l10n.resourcesPhaseCompleted,
      ResourceBookingPhase.expired => context.l10n.resourcesPhaseExpired,
      ResourceBookingPhase.cancelled => context.l10n.resourcesPhaseCancelled,
      ResourceBookingPhase.rejected => context.l10n.rejected,
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = filterOwnPending
        ? bookings
            .where((b) => b.employeeId != profileId)
            .toList()
        : profileId == null
            ? bookings
            : bookings.where((b) => b.employeeId == profileId).toList();

    if (list.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
          EmptyView(
            icon: canApproveOthers
                ? Icons.pending_actions_rounded
                : Icons.event_rounded,
            title: canApproveOthers
                ? context.l10n.emptyResourceApprovals
                : context.l10n.emptyResourceBookings,
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
      itemBuilder: (context, index) {
        final booking = list[index];
        return SizedBox(
          height: _bookingCardHeight,
          child: HiveCard(
            onTap: () => showResourceBookingDetailSheet(
              context,
              booking: booking,
              profileId: profileId,
              canApproveOthers: canApproveOthers,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        booking.title,
                        style: AppTextStyle.h3,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    StatusBadge(
                      status: _status(booking),
                      label: _statusLabel(context, booking),
                    ),
                  ],
                ),
                const SizedBox(height: AppTheme.xs),
                Text(
                  booking.resource?.name ?? '—',
                  style: AppTextStyle.body2,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (canApproveOthers && booking.employeeName != null)
                  Text(
                    booking.employeeName!,
                    style: AppTextStyle.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                const Spacer(),
                Text(
                  '${DateTimeFormatter.formatDate(booking.startTime, pattern: 'd MMM yyyy HH:mm')} – ${DateTimeFormatter.formatTime(booking.endTime)}',
                  style: AppTextStyle.caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (booking.purpose != null && booking.purpose!.isNotEmpty)
                  Text(
                    booking.purpose!,
                    style: AppTextStyle.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  )
                else
                  const SizedBox(height: 14),
              ],
            ),
          ),
        );
      },
    );
  }
}
