import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
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
import '../../../shared/widgets/section_label.dart';
import '../../../shared/widgets/status_badge.dart';
import '../providers/shift_provider.dart';
import 'shift_swap_sheet.dart';

class ShiftScreen extends ConsumerStatefulWidget {
  const ShiftScreen({super.key});

  @override
  ConsumerState<ShiftScreen> createState() => _ShiftScreenState();
}

class _ShiftScreenState extends ConsumerState<ShiftScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _openSwapSheet(List<ShiftColleagueModel> colleagues) {
    showShiftSwapSheet(context, colleagues: colleagues);
  }

  @override
  Widget build(BuildContext context) {
    final shiftState = ref.watch(shiftProvider);
    final colleagues = shiftState.valueOrNull?.colleagues ?? const [];

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.shiftTitle, style: AppTextStyle.h1),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.amberAccent,
          labelColor: AppColors.amberAccent,
          unselectedLabelColor: AppColors.textSubtle,
          tabs: [
            Tab(text: context.l10n.shiftTabSchedule),
            Tab(text: context.l10n.shiftTabSwaps),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: colleagues.isEmpty
                ? null
                : () => _openSwapSheet(colleagues),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(shiftProvider.future),
        child: switch (shiftState) {
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
                  onRetry: () => ref.invalidate(shiftProvider),
                ),
              ),
            ),
          AsyncData(:final value) => TabBarView(
              controller: _tabController,
              children: [
                _ScheduleTab(data: value),
                _SwapsTab(
                  swaps: value.swaps,
                  onCreate: () => _openSwapSheet(value.colleagues),
                ),
              ],
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _ScheduleTab extends ConsumerWidget {
  final ShiftData data;

  const _ScheduleTab({required this.data});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weekStart = ref.watch(shiftWeekStartProvider);
    final weekDates = List.generate(7, (i) {
      return weekStart.add(Duration(days: i));
    });

    final scheduleByDate = {
      for (final s in data.mySchedules) s.date: s,
    };

    final weekEnd = weekDates.last;
    final weekLabel =
        '${DateTimeFormatter.formatDate(weekStart, pattern: 'd MMM')} – '
        '${DateTimeFormatter.formatDate(weekEnd, pattern: 'd MMM yyyy')}';

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          HiveCard(
            child: Row(
              children: [
                IconButton(
                  onPressed: () {
                    ref.read(shiftWeekStartProvider.notifier).previousWeek();
                  },
                  icon: const Icon(Icons.chevron_left_rounded),
                  color: AppColors.amberAccent,
                ),
                Expanded(
                  child: Column(
                    children: [
                      Text(weekLabel, style: AppTextStyle.h3),
                      TextButton(
                        onPressed: () {
                          ref.read(shiftWeekStartProvider.notifier).goToToday();
                        },
                        child: Text(
                          context.l10n.shiftToday,
                          style: AppTextStyle.caption.copyWith(
                            color: AppColors.amberAccent,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () {
                    ref.read(shiftWeekStartProvider.notifier).nextWeek();
                  },
                  icon: const Icon(Icons.chevron_right_rounded),
                  color: AppColors.amberAccent,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.md),
          SectionLabel(context.l10n.shiftMySchedule),
          ...weekDates.map((date) {
            final dateStr = formatDateOnly(date);
            final entry = scheduleByDate[dateStr];
            final weekday = DateFormat('EEE', 'id_ID').format(date);

            return Padding(
              padding: const EdgeInsets.only(bottom: AppTheme.sm),
              child: HiveCard(
                child: Row(
                  children: [
                    SizedBox(
                      width: 56,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(weekday, style: AppTextStyle.overline),
                          Text(
                            DateFormat('d MMM').format(date),
                            style: AppTextStyle.h3,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 4,
                      height: 40,
                      decoration: BoxDecoration(
                        color: entry?.shift != null
                            ? _parseColor(entry!.shift!.color)
                            : AppColors.textSubtle.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: AppTheme.sm),
                    Expanded(
                      child: entry?.shift != null
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  entry!.shift!.name,
                                  style: AppTextStyle.body1,
                                ),
                                Text(
                                  entry.shift!.timeRange,
                                  style: AppTextStyle.caption,
                                ),
                              ],
                            )
                          : Text(
                              context.l10n.shiftNoAssignment,
                              style: AppTextStyle.caption,
                            ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Color _parseColor(String hex) {
    try {
      final cleaned = hex.replaceFirst('#', '');
      return Color(int.parse('FF$cleaned', radix: 16));
    } catch (_) {
      return AppColors.amberAccent;
    }
  }
}

class _SwapsTab extends StatelessWidget {
  final List<ShiftSwapModel> swaps;
  final VoidCallback onCreate;

  const _SwapsTab({required this.swaps, required this.onCreate});

  @override
  Widget build(BuildContext context) {
    if (swaps.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
          EmptyView(
            icon: Icons.swap_horiz_rounded,
            title: context.l10n.emptyShiftSwaps,
            action: ElevatedButton(
              onPressed: onCreate,
              child: Text(context.l10n.shiftRequestSwap),
            ),
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      itemCount: swaps.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
      itemBuilder: (context, index) {
        final swap = swaps[index];
        final status = switch (swap.status) {
          'approved' => StatusType.approved,
          'rejected' => StatusType.rejected,
          _ => StatusType.pending,
        };

        return HiveCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      DateTimeFormatter.formatDate(
                        DateTime.parse(swap.date),
                      ),
                      style: AppTextStyle.h3,
                    ),
                  ),
                  StatusBadge(status: status),
                ],
              ),
              const SizedBox(height: AppTheme.sm),
              Text(
                '${swap.requesterName ?? '—'} ↔ ${swap.partnerName ?? '—'}',
                style: AppTextStyle.body2,
              ),
              if (swap.shiftDetails.isNotEmpty) ...[
                const SizedBox(height: AppTheme.xs),
                Text(swap.shiftDetails, style: AppTextStyle.caption),
              ],
            ],
          ),
        );
      },
    );
  }
}
