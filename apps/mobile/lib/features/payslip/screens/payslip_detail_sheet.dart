import 'package:flutter/material.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/payslip_model.dart';
import '../../../shared/utils/currency_formatter.dart';
import '../../../shared/widgets/section_label.dart';

Future<void> showPayslipDetailSheet(
  BuildContext context,
  PayslipModel payslip,
) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(AppTheme.radiusCard),
      ),
    ),
    builder: (ctx) => PayslipDetailSheet(payslip: payslip),
  );
}

class PayslipDetailSheet extends StatelessWidget {
  final PayslipModel payslip;

  const PayslipDetailSheet({super.key, required this.payslip});

  @override
  Widget build(BuildContext context) {
    final earnings =
        payslip.items.where((item) => item.isEarning).toList();
    final deductions =
        payslip.items.where((item) => item.isDeduction).toList();
    final maxHeight = MediaQuery.sizeOf(context).height * 0.75;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: AppTheme.md,
          right: AppTheme.md,
          top: AppTheme.md,
          bottom: MediaQuery.viewInsetsOf(context).bottom + AppTheme.md,
        ),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxHeight),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      payslip.periodName,
                      style: AppTextStyle.h2,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded),
                    color: AppColors.textSubtle,
                    constraints: const BoxConstraints(
                      minWidth: AppTheme.tapMin,
                      minHeight: AppTheme.tapMin,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.md),
              Flexible(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SectionLabel(context.l10n.earningsSection),
                      ...earnings.map(
                        (item) => _PayslipItemRow(
                          name: item.name,
                          amount: formatIDR(item.amount),
                        ),
                      ),
                      if (earnings.isEmpty)
                        Padding(
                          padding: const EdgeInsets.only(bottom: AppTheme.sm),
                          child: Text(
                            context.l10n.notAvailable,
                            style: AppTextStyle.caption,
                          ),
                        ),
                      const Divider(color: AppColors.dividerLine),
                      const SizedBox(height: AppTheme.sm),
                      SectionLabel(context.l10n.deductionsSection),
                      ...deductions.map(
                        (item) => _PayslipItemRow(
                          name: item.name,
                          amount: formatIDR(item.amount),
                        ),
                      ),
                      if (deductions.isEmpty)
                        Padding(
                          padding: const EdgeInsets.only(bottom: AppTheme.sm),
                          child: Text(
                            context.l10n.notAvailable,
                            style: AppTextStyle.caption,
                          ),
                        ),
                      const SizedBox(height: AppTheme.sm),
                      const Divider(
                        color: AppColors.dividerLine,
                        thickness: 2,
                      ),
                      const SizedBox(height: AppTheme.md),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            context.l10n.netSalary,
                            style: AppTextStyle.h3,
                          ),
                          Text(
                            formatIDR(payslip.netSalary),
                            style: AppTextStyle.h1.copyWith(
                              color: AppColors.amberAccent,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PayslipItemRow extends StatelessWidget {
  final String name;
  final String amount;

  const _PayslipItemRow({
    required this.name,
    required this.amount,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.sm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(name, style: AppTextStyle.body2),
          ),
          const SizedBox(width: AppTheme.sm),
          Text(
            amount,
            style: AppTextStyle.body2.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
