import 'package:flutter/material.dart';
import '../../../shared/widgets/hive_app_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/approval_model.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../providers/approval_provider.dart';
import '../widgets/approval_inbox_tile.dart';

class ApprovalScreen extends ConsumerWidget {
  const ApprovalScreen({super.key});

  Future<void> _confirmApprove(
    BuildContext context,
    WidgetRef ref,
    ApprovalInboxModel item,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceBlue,
        title: Text(context.l10n.approve, style: AppTextStyle.h2),
        content: Text(
          context.l10n.approvalApproveConfirm,
          style: AppTextStyle.body2,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(context.l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(context.l10n.approve),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    final error =
        await ref.read(approvalInboxProvider.notifier).approve(item);
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
            context.l10n.approvalApproveSuccess,
            style: AppTextStyle.body2,
          ),
          backgroundColor: AppColors.successGreen,
        ),
      );
    }
  }

  Future<void> _confirmReject(
    BuildContext context,
    WidgetRef ref,
    ApprovalInboxModel item,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceBlue,
        title: Text(context.l10n.reject, style: AppTextStyle.h2),
        content: Text(
          context.l10n.approvalRejectConfirm,
          style: AppTextStyle.body2,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(context.l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.errorRed,
            ),
            child: Text(context.l10n.reject),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    final error =
        await ref.read(approvalInboxProvider.notifier).reject(item);
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
            context.l10n.approvalRejectSuccess,
            style: AppTextStyle.body2,
          ),
          backgroundColor: AppColors.successGreen,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inboxState = ref.watch(approvalInboxProvider);
    final isSubmitting = ref.watch(approvalSubmittingProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: HiveAppBar(
        title: Text(context.l10n.approvalTitle, style: AppTextStyle.h1),
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(approvalInboxProvider.future),
        child: switch (inboxState) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: ApprovalSkeleton(),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(approvalInboxProvider),
                ),
              ),
            ),
          AsyncData(:final value) => _ApprovalList(
              items: value,
              isSubmitting: isSubmitting,
              onApprove: (item) => _confirmApprove(context, ref, item),
              onReject: (item) => _confirmReject(context, ref, item),
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _ApprovalList extends StatelessWidget {
  final List<ApprovalInboxModel> items;
  final bool isSubmitting;
  final void Function(ApprovalInboxModel item) onApprove;
  final void Function(ApprovalInboxModel item) onReject;

  const _ApprovalList({
    required this.items,
    required this.isSubmitting,
    required this.onApprove,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.7,
          child: EmptyView(
            icon: Icons.task_alt_rounded,
            title: context.l10n.emptyApprovalInbox,
          ),
        ),
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
      itemBuilder: (context, index) {
        final item = items[index];
        return ApprovalInboxTile(
          item: item,
          isSubmitting: isSubmitting,
          onApprove: () => onApprove(item),
          onReject: () => onReject(item),
        );
      },
    );
  }
}
