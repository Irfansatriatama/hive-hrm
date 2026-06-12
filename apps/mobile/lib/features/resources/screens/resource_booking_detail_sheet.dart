import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/feature_models.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../../shared/widgets/status_badge.dart';
import '../providers/resources_provider.dart';
import '../utils/booking_lifecycle.dart';

Future<void> showResourceBookingDetailSheet(
  BuildContext context, {
  required ResourceBookingModel booking,
  required String? profileId,
  required bool canApproveOthers,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.lg)),
    ),
    builder: (ctx) => _ResourceBookingDetailSheet(
      booking: booking,
      profileId: profileId,
      canApproveOthers: canApproveOthers,
    ),
  );
}

class _ResourceBookingDetailSheet extends ConsumerStatefulWidget {
  final ResourceBookingModel booking;
  final String? profileId;
  final bool canApproveOthers;

  const _ResourceBookingDetailSheet({
    required this.booking,
    required this.profileId,
    required this.canApproveOthers,
  });

  @override
  ConsumerState<_ResourceBookingDetailSheet> createState() =>
      _ResourceBookingDetailSheetState();
}

class _ResourceBookingDetailSheetState
    extends ConsumerState<_ResourceBookingDetailSheet> {
  bool _acting = false;

  String _phaseLabel(BuildContext context, ResourceBookingPhase phase) {
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

  StatusType _phaseBadge(ResourceBookingPhase phase) => switch (phase) {
        ResourceBookingPhase.completed ||
        ResourceBookingPhase.inProgress =>
          StatusType.approved,
        ResourceBookingPhase.rejected ||
        ResourceBookingPhase.expired ||
        ResourceBookingPhase.cancelled =>
          StatusType.rejected,
        _ => StatusType.pending,
      };

  Future<void> _runAction(
    Future<String?> Function() action, {
    required String successMessage,
  }) async {
    setState(() => _acting = true);
    final error = await action();
    if (!mounted) return;
    setState(() => _acting = false);
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: AppColors.errorRed),
      );
      return;
    }
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(successMessage),
        backgroundColor: AppColors.successGreen,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final booking = widget.booking;
    final phase = resolveResourceBookingPhase(booking);
    final isOwner = booking.employeeId == widget.profileId;

    final canCancel = isOwner && phase == ResourceBookingPhase.waiting;
    final canConfirm =
        isOwner && phase == ResourceBookingPhase.awaitingConfirmation;
    final canComplete = isOwner && phase == ResourceBookingPhase.readyToComplete;
    final canApprove = widget.canApproveOthers &&
        phase == ResourceBookingPhase.pendingApproval &&
        booking.employeeId != widget.profileId;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppTheme.md,
        AppTheme.md,
        AppTheme.md,
        AppTheme.lg,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  context.l10n.resourcesBookingDetail,
                  style: AppTextStyle.h2,
                ),
              ),
              StatusBadge(
                status: _phaseBadge(phase),
                label: _phaseLabel(context, phase),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.md),
          _DetailRow(
            label: context.l10n.resourcesBookingTitleLabel,
            value: booking.title,
          ),
          if (booking.purpose != null && booking.purpose!.isNotEmpty)
            _DetailRow(label: context.l10n.reasonLabel, value: booking.purpose!),
          _DetailRow(
            label: context.l10n.resourcesSelectRoom,
            value: booking.resource?.name ?? '—',
          ),
          if (booking.employeeName != null)
            _DetailRow(
              label: context.l10n.resourcesEmployeeLabel,
              value: booking.employeeName!,
            ),
          _DetailRow(
            label: context.l10n.timeIn,
            value: DateTimeFormatter.formatDate(
              booking.startTime,
              pattern: 'd MMM yyyy HH:mm',
            ),
          ),
          _DetailRow(
            label: context.l10n.timeOut,
            value: DateTimeFormatter.formatDate(
              booking.endTime,
              pattern: 'd MMM yyyy HH:mm',
            ),
          ),
          if (_acting) ...[
            const SizedBox(height: AppTheme.md),
            const Center(
              child: CircularProgressIndicator(color: AppColors.amberAccent),
            ),
          ] else if (canCancel || canConfirm || canComplete || canApprove) ...[
            const SizedBox(height: AppTheme.lg),
            if (canCancel)
              OutlinedButton(
                onPressed: () => _runAction(
                  () => ref
                      .read(resourcesProvider.notifier)
                      .cancelBooking(booking.id),
                  successMessage: context.l10n.resourcesCancelSuccess,
                ),
                child: Text(context.l10n.cancel),
              ),
            if (canConfirm)
              ElevatedButton(
                onPressed: () => _runAction(
                  () => ref
                      .read(resourcesProvider.notifier)
                      .confirmBooking(booking.id),
                  successMessage: context.l10n.resourcesConfirmSuccess,
                ),
                child: Text(context.l10n.resourcesConfirmMeeting),
              ),
            if (canComplete)
              ElevatedButton(
                onPressed: () => _runAction(
                  () => ref
                      .read(resourcesProvider.notifier)
                      .completeBooking(booking.id),
                  successMessage: context.l10n.resourcesCompleteSuccess,
                ),
                child: Text(context.l10n.resourcesCompleteMeeting),
              ),
            if (canApprove) ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _runAction(
                        () => ref
                            .read(resourcesProvider.notifier)
                            .rejectBooking(booking.id),
                        successMessage: context.l10n.approvalRejectSuccess,
                      ),
                      child: Text(context.l10n.reject),
                    ),
                  ),
                  const SizedBox(width: AppTheme.sm),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _runAction(
                        () => ref
                            .read(resourcesProvider.notifier)
                            .approveBooking(booking.id),
                        successMessage: context.l10n.resourcesApproveSuccess,
                      ),
                      child: Text(context.l10n.approve),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTextStyle.overline),
          const SizedBox(height: 2),
          Text(value, style: AppTextStyle.body1),
        ],
      ),
    );
  }
}
