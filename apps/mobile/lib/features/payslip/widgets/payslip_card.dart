import 'package:flutter/material.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/payslip_model.dart';
import '../../../shared/utils/currency_formatter.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/status_badge.dart';

class PayslipCard extends StatelessWidget {
  final PayslipModel payslip;
  final VoidCallback onTap;

  const PayslipCard({
    super.key,
    required this.payslip,
    required this.onTap,
  });

  StatusType _statusType(String status) {
    return switch (status.toLowerCase()) {
      'approved' => StatusType.approved,
      'paid' => StatusType.approved,
      'draft' => StatusType.pending,
      _ => StatusType.pending,
    };
  }

  String? _statusLabel(BuildContext context, String status) {
    return switch (status.toLowerCase()) {
      'paid' => context.l10n.statusPaid,
      'draft' => context.l10n.statusDraft,
      _ => null,
    };
  }

  @override
  Widget build(BuildContext context) {
    return HiveCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  payslip.periodName,
                  style: AppTextStyle.body1.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              StatusBadge(
                status: _statusType(payslip.status),
                label: _statusLabel(context, payslip.status),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.md),
          Row(
            children: [
              Expanded(
                child: _AmountColumn(
                  label: context.l10n.grossSalary,
                  amount: formatIDR(payslip.grossSalary),
                ),
              ),
              Expanded(
                child: _AmountColumn(
                  label: context.l10n.totalDeduction,
                  amount: formatIDR(payslip.totalDeduct),
                  amountStyle: AppTextStyle.body2.copyWith(
                    color: AppColors.errorRed,
                  ),
                ),
              ),
              Expanded(
                child: _AmountColumn(
                  label: context.l10n.netSalary,
                  amount: formatIDR(payslip.netSalary),
                  amountStyle: AppTextStyle.body2.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.amberAccent,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AmountColumn extends StatelessWidget {
  final String label;
  final String amount;
  final TextStyle? amountStyle;

  const _AmountColumn({
    required this.label,
    required this.amount,
    this.amountStyle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyle.overline),
        const SizedBox(height: AppTheme.xs),
        Text(
          amount,
          style: amountStyle ?? AppTextStyle.body2,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}
