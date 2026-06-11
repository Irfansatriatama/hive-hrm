import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/expense_model.dart';
import '../../../shared/utils/currency_formatter.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/status_badge.dart';

class ExpenseClaimTile extends StatelessWidget {
  final ExpenseClaimModel claim;

  const ExpenseClaimTile({super.key, required this.claim});

  StatusType _statusType() {
    return switch (claim.status) {
      'approved' => StatusType.approved,
      'rejected' => StatusType.rejected,
      'submitted' => StatusType.pending,
      'paid' => StatusType.approved,
      _ => StatusType.pending,
    };
  }

  String? _statusLabel(BuildContext context) {
    return switch (claim.status) {
      'draft' => context.l10n.statusDraft,
      'submitted' => context.l10n.pending,
      'approved' => context.l10n.approved,
      'rejected' => context.l10n.rejected,
      'paid' => context.l10n.expenseStatusPaid,
      _ => null,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.sm),
      child: HiveCard(
        accentLeft: claim.isPending,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    claim.title,
                    style: AppTextStyle.body1.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                StatusBadge(
                  status: _statusType(),
                  label: _statusLabel(context),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.xs),
            Text(claim.claimNumber, style: AppTextStyle.caption),
            const SizedBox(height: AppTheme.xs),
            Text(
              formatIDR(claim.totalAmount),
              style: AppTextStyle.body2.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: AppTheme.xs),
            Text(
              DateFormat('d MMM yyyy', 'id_ID').format(claim.createdAt.toLocal()),
              style: AppTextStyle.caption,
            ),
            if (claim.isRejected && claim.rejectedReason != null) ...[
              const SizedBox(height: AppTheme.xs),
              Text(
                claim.rejectedReason!,
                style: AppTextStyle.caption,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
