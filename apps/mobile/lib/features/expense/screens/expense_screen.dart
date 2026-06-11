import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/models/expense_model.dart';
import '../providers/expense_provider.dart';
import '../widgets/expense_claim_tile.dart';
import 'expense_create_sheet.dart';

class ExpenseScreen extends ConsumerWidget {
  const ExpenseScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expenseState = ref.watch(expenseProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.expenseTitle, style: AppTextStyle.h1),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppTheme.sm),
            child: ElevatedButton(
              onPressed: () => showExpenseCreateSheet(context),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: AppTheme.md),
                minimumSize: const Size(0, AppTheme.tapMin),
              ),
              child: Text(context.l10n.expenseCreate),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(expenseProvider.future),
        child: switch (expenseState) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: ExpenseSkeleton(),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(expenseProvider),
                ),
              ),
            ),
          AsyncData(:final value) => _ExpenseList(claims: value.claims),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _ExpenseList extends StatelessWidget {
  final List<ExpenseClaimModel> claims;

  const _ExpenseList({required this.claims});

  @override
  Widget build(BuildContext context) {
    if (claims.isEmpty) {
      return SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.7,
          child: EmptyView(
            icon: Icons.receipt_rounded,
            title: context.l10n.emptyExpense,
          ),
        ),
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      itemCount: claims.length,
      itemBuilder: (context, index) => ExpenseClaimTile(claim: claims[index]),
    );
  }
}

class ExpenseSkeleton extends StatelessWidget {
  const ExpenseSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppTheme.md),
      child: Column(
        children: List.generate(
          4,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: AppTheme.sm),
            child: SkeletonBox(height: 120),
          ),
        ),
      ),
    );
  }
}
