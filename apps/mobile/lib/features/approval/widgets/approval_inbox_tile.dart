import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/approval_model.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/status_badge.dart';

class ApprovalInboxTile extends StatelessWidget {
  final ApprovalInboxModel item;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  final bool isSubmitting;

  const ApprovalInboxTile({
    super.key,
    required this.item,
    this.onApprove,
    this.onReject,
    this.isSubmitting = false,
  });

  String _typeLabel(BuildContext context) {
    if (item.isLeave) return context.l10n.approvalTypeLeave;
    if (item.isProfileUpdate) return context.l10n.approvalTypeProfileUpdate;
    return item.type;
  }

  String _dateLabel() {
    return DateFormat('d MMM yyyy, HH:mm', 'id_ID').format(item.dateSubmitted);
  }

  String? _detailsText() {
    final details = item.details;
    if (details == null) return null;
    if (item.isLeave) {
      final start = details['startDate'] as String?;
      final end = details['endDate'] as String?;
      final days = details['totalDays'];
      if (start != null && end != null) {
        return '$start – $end${days != null ? ' ($days hari)' : ''}';
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final detailsText = _detailsText();

    return HiveCard(
      accentLeft: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.summary,
                  style: AppTextStyle.body1.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              StatusBadge(
                status: StatusType.pending,
                label: context.l10n.pending,
              ),
            ],
          ),
          const SizedBox(height: AppTheme.xs),
          Text(
            item.requesterName,
            style: AppTextStyle.body2.copyWith(color: AppColors.tealSecondary),
          ),
          const SizedBox(height: AppTheme.xs),
          Text(_typeLabel(context), style: AppTextStyle.caption),
          const SizedBox(height: AppTheme.xs),
          Text(_dateLabel(), style: AppTextStyle.caption),
          if (detailsText != null) ...[
            const SizedBox(height: AppTheme.xs),
            Text(detailsText, style: AppTextStyle.caption),
          ],
          if (item.reason != null && item.reason!.isNotEmpty) ...[
            const SizedBox(height: AppTheme.xs),
            Text(
              item.reason!,
              style: AppTextStyle.caption,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: AppTheme.md),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: isSubmitting ? null : onReject,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.errorRed,
                    side: const BorderSide(color: AppColors.errorRed),
                    minimumSize: const Size(0, AppTheme.tapMin),
                  ),
                  child: Text(context.l10n.reject),
                ),
              ),
              const SizedBox(width: AppTheme.sm),
              Expanded(
                child: ElevatedButton(
                  onPressed: isSubmitting ? null : onApprove,
                  child: isSubmitting
                      ? const SizedBox(
                          width: AppTheme.md,
                          height: AppTheme.md,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(context.l10n.approve),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
