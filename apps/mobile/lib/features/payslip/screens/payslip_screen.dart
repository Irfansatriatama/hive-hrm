import 'package:flutter/material.dart';
import '../../../shared/widgets/hive_app_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/payslip_model.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../providers/payslip_provider.dart';
import '../widgets/payslip_card.dart';
import 'payslip_detail_sheet.dart';

class PayslipScreen extends ConsumerWidget {
  const PayslipScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final payslipState = ref.watch(payslipProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: HiveAppBar(
        title: Text(context.l10n.payslipTitle, style: AppTextStyle.h1),
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(payslipProvider.future),
        child: switch (payslipState) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: PayslipSkeleton(),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(payslipProvider),
                ),
              ),
            ),
          AsyncData(:final value) => _PayslipList(payslips: value),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _PayslipList extends StatelessWidget {
  final List<PayslipModel> payslips;

  const _PayslipList({required this.payslips});

  @override
  Widget build(BuildContext context) {
    if (payslips.isEmpty) {
      return SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.7,
          child: EmptyView(
            icon: Icons.receipt_long_rounded,
            title: context.l10n.emptyPayslip,
          ),
        ),
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      itemCount: payslips.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppTheme.sm),
      itemBuilder: (context, index) {
        final payslip = payslips[index];
        return PayslipCard(
          payslip: payslip,
          onTap: () => showPayslipDetailSheet(context, payslip),
        );
      },
    );
  }
}
