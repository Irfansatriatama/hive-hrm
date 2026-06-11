import 'package:flutter/material.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';

/// Placeholder screen — full implementation in M9.
class PayslipScreen extends StatelessWidget {
  const PayslipScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.payslipTitle, style: AppTextStyle.h1),
      ),
      body: Center(
        child: Text(context.l10n.loading, style: AppTextStyle.body1),
      ),
    );
  }
}
