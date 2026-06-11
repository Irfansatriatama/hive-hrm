import 'package:flutter/material.dart';
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
import 'resource_booking_sheet.dart';

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

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(resourcesProvider);
    final canApprove = ref.watch(canApproveResourcesProvider);
    final tabCount = canApprove ? 3 : 2;
    _ensureTabController(tabCount);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.resourcesTitle, style: AppTextStyle.h1),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.amberAccent,
          labelColor: AppColors.amberAccent,
          unselectedLabelColor: AppColors.textSubtle,
          tabs: [
            Tab(text: context.l10n.resourcesTabRooms),
            Tab(text: context.l10n.resourcesTabBookings),
            if (canApprove) Tab(text: context.l10n.resourcesTabApproval),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: state.valueOrNull == null
                ? null
                : () => showResourceBookingSheet(
                      context,
                      resources: state.value!.resources,
                    ),
          ),
        ],
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
                _ResourcesList(resources: value.resources),
                _BookingsList(
                  bookings: value.bookings,
                  profileId: ref.watch(profileProvider).valueOrNull?.id,
                ),
                if (canApprove)
                  _ApprovalList(
                    bookings: value.bookings,
                    profileId: ref.watch(profileProvider).valueOrNull?.id,
                  ),
              ],
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _ResourcesList extends StatelessWidget {
  final List<BookableResourceModel> resources;

  const _ResourcesList({required this.resources});

  @override
  Widget build(BuildContext context) {
    if (resources.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
          EmptyView(
            icon: Icons.meeting_room_rounded,
            title: context.l10n.emptyResources,
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      itemCount: resources.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
      itemBuilder: (context, index) {
        final item = resources[index];
        return HiveCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(item.name, style: AppTextStyle.h3),
              if (item.location != null) ...[
                const SizedBox(height: 4),
                Text(item.location!, style: AppTextStyle.caption),
              ],
              if (item.capacity != null)
                Text(
                  context.l10n.resourcesCapacity(item.capacity!),
                  style: AppTextStyle.caption,
                ),
            ],
          ),
        );
      },
    );
  }
}

class _BookingsList extends ConsumerWidget {
  final List<ResourceBookingModel> bookings;
  final String? profileId;

  const _BookingsList({required this.bookings, this.profileId});

  StatusType _status(String status) => switch (status) {
        'approved' => StatusType.approved,
        'rejected' => StatusType.rejected,
        _ => StatusType.pending,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mine = profileId == null
        ? bookings
        : bookings.where((b) => b.employeeId == profileId).toList();

    if (mine.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
          EmptyView(
            icon: Icons.event_rounded,
            title: context.l10n.emptyResourceBookings,
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      itemCount: mine.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
      itemBuilder: (context, index) {
        final booking = mine[index];
        final canCancel = booking.employeeId == profileId &&
            (booking.status == 'pending' || booking.status == 'approved');

        return HiveCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(booking.title, style: AppTextStyle.h3),
                  ),
                  StatusBadge(status: _status(booking.status)),
                ],
              ),
              const SizedBox(height: AppTheme.xs),
              Text(booking.resource?.name ?? '—', style: AppTextStyle.body2),
              Text(
                '${DateTimeFormatter.formatDate(booking.startTime, pattern: 'd MMM yyyy HH:mm')} – ${DateTimeFormatter.formatTime(booking.endTime)}',
                style: AppTextStyle.caption,
              ),
              if (canCancel) ...[
                const SizedBox(height: AppTheme.sm),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () async {
                      final error = await ref
                          .read(resourcesProvider.notifier)
                          .cancelBooking(booking.id);
                      if (!context.mounted) return;
                      if (error != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(error),
                            backgroundColor: AppColors.errorRed,
                          ),
                        );
                      }
                    },
                    child: Text(context.l10n.cancel),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _ApprovalList extends ConsumerWidget {
  final List<ResourceBookingModel> bookings;
  final String? profileId;

  const _ApprovalList({required this.bookings, this.profileId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pending = bookings
        .where((b) => b.status == 'pending' && b.employeeId != profileId)
        .toList();

    if (pending.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
          EmptyView(
            icon: Icons.pending_actions_rounded,
            title: context.l10n.emptyResourceApprovals,
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      itemCount: pending.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
      itemBuilder: (context, index) {
        final booking = pending[index];
        return HiveCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(booking.title, style: AppTextStyle.h3),
              Text(
                booking.employeeName ?? '—',
                style: AppTextStyle.body2,
              ),
              Text(
                booking.resource?.name ?? '—',
                style: AppTextStyle.caption,
              ),
              Text(
                '${DateTimeFormatter.formatDate(booking.startTime, pattern: 'd MMM yyyy HH:mm')} – ${DateTimeFormatter.formatTime(booking.endTime)}',
                style: AppTextStyle.caption,
              ),
              const SizedBox(height: AppTheme.sm),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () async {
                      final error = await ref
                          .read(resourcesProvider.notifier)
                          .rejectBooking(booking.id);
                      if (!context.mounted) return;
                      if (error != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(error),
                            backgroundColor: AppColors.errorRed,
                          ),
                        );
                      }
                    },
                    child: Text(context.l10n.reject),
                  ),
                  const SizedBox(width: AppTheme.sm),
                  ElevatedButton(
                    onPressed: () async {
                      final error = await ref
                          .read(resourcesProvider.notifier)
                          .approveBooking(booking.id);
                      if (!context.mounted) return;
                      if (error != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(error),
                            backgroundColor: AppColors.errorRed,
                          ),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(context.l10n.resourcesApproveSuccess),
                            backgroundColor: AppColors.successGreen,
                          ),
                        );
                      }
                    },
                    child: Text(context.l10n.approve),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
