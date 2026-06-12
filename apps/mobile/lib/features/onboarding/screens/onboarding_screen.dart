import 'package:flutter/material.dart';
import '../../../shared/widgets/hive_app_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/onboarding_model.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/section_label.dart';
import '../../../shared/widgets/status_badge.dart';
import '../providers/onboarding_provider.dart';

class OnboardingScreen extends ConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final onboardingState = ref.watch(onboardingProvider);
    final updatingTaskId = ref.watch(onboardingUpdatingProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: HiveAppBar(
        title: Text(context.l10n.onboardingTitle, style: AppTextStyle.h1),
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(onboardingProvider.future),
        child: switch (onboardingState) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: EdgeInsets.all(AppTheme.md),
                child: SkeletonBox(height: 200),
              ),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(onboardingProvider),
                ),
              ),
            ),
          AsyncData(:final value) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(AppTheme.md),
              child: value == null
                  ? EmptyView(
                      icon: Icons.checklist_rounded,
                      title: context.l10n.emptyOnboarding,
                    )
                  : _OnboardingContent(
                      assignment: value,
                      updatingTaskId: updatingTaskId,
                      onMarkDone: (taskId) async {
                        final error = await ref
                            .read(onboardingProvider.notifier)
                            .markTaskDone(
                              assignmentId: value.id,
                              taskId: taskId,
                            );
                        if (!context.mounted) return;
                        if (error != null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(error, style: AppTextStyle.body2),
                              backgroundColor: AppColors.errorRed,
                            ),
                          );
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                context.l10n.onboardingTaskDone,
                                style: AppTextStyle.body2,
                              ),
                              backgroundColor: AppColors.successGreen,
                            ),
                          );
                        }
                      },
                    ),
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _OnboardingContent extends StatelessWidget {
  final OnboardingAssignmentModel assignment;
  final String? updatingTaskId;
  final ValueChanged<String> onMarkDone;

  const _OnboardingContent({
    required this.assignment,
    required this.updatingTaskId,
    required this.onMarkDone,
  });

  @override
  Widget build(BuildContext context) {
    final startDate = DateTime.tryParse(assignment.startDate);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        HiveCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          assignment.template.name,
                          style: AppTextStyle.h2,
                        ),
                        if (assignment.template.description != null) ...[
                          const SizedBox(height: AppTheme.xs),
                          Text(
                            assignment.template.description!,
                            style: AppTextStyle.caption,
                          ),
                        ],
                        if (startDate != null) ...[
                          const SizedBox(height: AppTheme.sm),
                          Text(
                            '${context.l10n.onboardingStartDate}: ${DateTimeFormatter.formatDate(startDate)}',
                            style: AppTextStyle.caption,
                          ),
                        ],
                      ],
                    ),
                  ),
                  StatusBadge(
                    status: assignment.status == 'completed'
                        ? StatusType.approved
                        : StatusType.pending,
                    label: assignment.status == 'completed'
                        ? context.l10n.approved
                        : context.l10n.onboardingInProgress,
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.md),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    context.l10n.onboardingProgress,
                    style: AppTextStyle.overline,
                  ),
                  Text(
                    context.l10n.onboardingProgressCount(
                      assignment.doneCount,
                      assignment.taskProgress.length,
                      assignment.progressPercent,
                    ),
                    style: AppTextStyle.caption,
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.sm),
              ClipRRect(
                borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                child: LinearProgressIndicator(
                  value: assignment.progressPercent / 100,
                  minHeight: 8,
                  backgroundColor: AppColors.surfaceBlue,
                  color: AppColors.amberAccent,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppTheme.md),
        SectionLabel(context.l10n.onboardingTasks),
        ...assignment.taskProgress.map(
          (progress) => _TaskTile(
            progress: progress,
            assignmentCompleted: assignment.status == 'completed',
            isUpdating: updatingTaskId == progress.taskId,
            onMarkDone: () => onMarkDone(progress.taskId),
          ),
        ),
        const SizedBox(height: AppTheme.lg),
      ],
    );
  }
}

class _TaskTile extends StatelessWidget {
  final OnboardingTaskProgressModel progress;
  final bool assignmentCompleted;
  final bool isUpdating;
  final VoidCallback onMarkDone;

  const _TaskTile({
    required this.progress,
    required this.assignmentCompleted,
    required this.isUpdating,
    required this.onMarkDone,
  });

  @override
  Widget build(BuildContext context) {
    final task = progress.task;
    final isEmployeeTask = task.assignedTo == 'employee';
    final canMark = isEmployeeTask &&
        progress.status == 'pending' &&
        !assignmentCompleted;

    final icon = switch (progress.status) {
      'done' => Icons.check_circle_rounded,
      'skipped' => Icons.remove_circle_outline_rounded,
      _ => Icons.radio_button_unchecked_rounded,
    };

    final iconColor = switch (progress.status) {
      'done' => AppColors.successGreen,
      'skipped' => AppColors.textSubtle,
      _ when canMark => AppColors.amberAccent,
      _ => AppColors.textSubtle,
    };

    Widget statusIcon;
    if (isUpdating) {
      statusIcon = const SizedBox(
        width: 22,
        height: 22,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: AppColors.amberAccent,
        ),
      );
    } else {
      statusIcon = Icon(icon, color: iconColor, size: 22);
    }

    final content = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        statusIcon,
        const SizedBox(width: AppTheme.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                task.title,
                style: AppTextStyle.body1.copyWith(
                  decoration: progress.isDone
                      ? TextDecoration.lineThrough
                      : null,
                  color: progress.status == 'done'
                      ? AppColors.successGreen
                      : isUpdating
                          ? AppColors.textSubtle
                          : AppColors.textPrimary,
                ),
              ),
              if (task.description != null) ...[
                const SizedBox(height: 2),
                Text(task.description!, style: AppTextStyle.caption),
              ],
              const SizedBox(height: 4),
              Text(
                isUpdating
                    ? context.l10n.onboardingUpdating
                    : '${task.category} · H+${task.dueAfterDays}'
                        '${!isEmployeeTask ? ' · ${task.assignedTo}' : ''}',
                style: AppTextStyle.caption.copyWith(
                  color: isUpdating ? AppColors.amberAccent : null,
                ),
              ),
            ],
          ),
        ),
        if (canMark && !isUpdating)
          Icon(
            Icons.touch_app_outlined,
            size: 16,
            color: AppColors.textSubtle.withValues(alpha: 0.6),
          ),
      ],
    );

    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.sm),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: isUpdating ? 0.75 : 1,
        child: HiveCard(
          onTap: canMark && !isUpdating ? onMarkDone : null,
          child: content,
        ),
      ),
    );
  }
}
