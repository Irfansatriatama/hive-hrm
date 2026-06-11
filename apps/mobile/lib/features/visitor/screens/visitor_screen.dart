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
import '../../profile/providers/profile_provider.dart';
import '../providers/visitor_provider.dart';
import 'visitor_checkin_sheet.dart';

class VisitorScreen extends ConsumerStatefulWidget {
  const VisitorScreen({super.key});

  @override
  ConsumerState<VisitorScreen> createState() => _VisitorScreenState();
}

class _VisitorScreenState extends ConsumerState<VisitorScreen>
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

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  @override
  Widget build(BuildContext context) {
    final visitorState = ref.watch(visitorProvider);
    final profileId = ref.watch(profileProvider).valueOrNull?.id;
    final canViewAll = ref.watch(canViewAllVisitorsProvider);
    final tabCount = canViewAll ? 2 : 1;
    _ensureTabController(tabCount);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.visitorTitle, style: AppTextStyle.h1),
        bottom: canViewAll
            ? TabBar(
                controller: _tabController,
                indicatorColor: AppColors.amberAccent,
                labelColor: AppColors.amberAccent,
                unselectedLabelColor: AppColors.textSubtle,
                tabs: [
                  Tab(text: context.l10n.visitorTabMine),
                  Tab(text: context.l10n.visitorTabAll),
                ],
              )
            : null,
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_rounded),
            onPressed: () => showVisitorCheckInSheet(context),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(visitorProvider.future),
        child: switch (visitorState) {
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
                  onRetry: () => ref.invalidate(visitorProvider),
                ),
              ),
            ),
          AsyncData(:final value) => canViewAll
              ? TabBarView(
                  controller: _tabController,
                  children: [
                    _VisitorListBody(
                      visitors: value,
                      profileId: profileId,
                      isToday: _isToday,
                      mineOnly: true,
                    ),
                    _VisitorListBody(
                      visitors: value,
                      profileId: profileId,
                      isToday: _isToday,
                      mineOnly: false,
                    ),
                  ],
                )
              : _VisitorListBody(
                  visitors: value,
                  profileId: profileId,
                  isToday: _isToday,
                  mineOnly: true,
                ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _VisitorListBody extends StatelessWidget {
  final List<VisitorModel> visitors;
  final String? profileId;
  final bool Function(DateTime date) isToday;
  final bool mineOnly;

  const _VisitorListBody({
    required this.visitors,
    required this.profileId,
    required this.isToday,
    required this.mineOnly,
  });

  @override
  Widget build(BuildContext context) {
    final filtered = mineOnly && profileId != null
        ? visitors.where((v) => v.hostEmployeeId == profileId).toList()
        : visitors;

    final todayActive =
        filtered.where((v) => v.isActive && isToday(v.checkIn)).toList();

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      children: [
        if (todayActive.isNotEmpty) ...[
          Text(context.l10n.visitorTodayActive, style: AppTextStyle.overline),
          const SizedBox(height: AppTheme.sm),
          ...todayActive.map(
            (visitor) => _VisitorTile(visitor: visitor, showCheckOut: true),
          ),
          const SizedBox(height: AppTheme.md),
        ],
        Text(context.l10n.visitorHistory, style: AppTextStyle.overline),
        const SizedBox(height: AppTheme.sm),
        if (filtered.isEmpty)
          SizedBox(
            height: MediaQuery.sizeOf(context).height * 0.35,
            child: EmptyView(
              icon: Icons.person_pin_rounded,
              title: context.l10n.emptyVisitors,
              action: ElevatedButton(
                onPressed: () => showVisitorCheckInSheet(context),
                child: Text(context.l10n.visitorCheckIn),
              ),
            ),
          )
        else
          ...filtered.map(
            (visitor) => Padding(
              padding: const EdgeInsets.only(bottom: AppTheme.sm),
              child: _VisitorTile(visitor: visitor),
            ),
          ),
      ],
    );
  }
}

class _VisitorTile extends ConsumerWidget {
  final VisitorModel visitor;
  final bool showCheckOut;

  const _VisitorTile({
    required this.visitor,
    this.showCheckOut = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return HiveCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(visitor.visitorName, style: AppTextStyle.h3),
              ),
              if (visitor.badgeNumber != null)
                Text(visitor.badgeNumber!, style: AppTextStyle.caption),
            ],
          ),
          if (visitor.company != null)
            Text(visitor.company!, style: AppTextStyle.body2),
          Text(visitor.purpose, style: AppTextStyle.caption),
          Text(
            '${DateTimeFormatter.formatTime(visitor.checkIn)} · ${visitor.hostName ?? '—'}',
            style: AppTextStyle.caption,
          ),
          if (showCheckOut && visitor.isActive) ...[
            const SizedBox(height: AppTheme.sm),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: () async {
                  final error = await ref
                      .read(visitorProvider.notifier)
                      .checkOut(visitor.id);
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
                child: Text(context.l10n.visitorCheckOut),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
