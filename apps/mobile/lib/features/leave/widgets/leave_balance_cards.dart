import 'package:flutter/material.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/leave_model.dart';
import '../../../shared/widgets/hive_card.dart';

class LeaveBalanceCards extends StatelessWidget {
  final List<LeaveBalanceModel> balances;

  const LeaveBalanceCards({super.key, required this.balances});

  @override
  Widget build(BuildContext context) {
    if (balances.isEmpty) return const SizedBox.shrink();

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: AppTheme.sm,
        mainAxisSpacing: AppTheme.sm,
        childAspectRatio: 0.85,
      ),
      itemCount: balances.length,
      itemBuilder: (context, index) {
        final balance = balances[index];
        return _LeaveBalanceCard(balance: balance);
      },
    );
  }
}

class _LeaveBalanceCard extends StatelessWidget {
  final LeaveBalanceModel balance;

  const _LeaveBalanceCard({required this.balance});

  @override
  Widget build(BuildContext context) {
    final progress =
        balance.total > 0 ? balance.balance / balance.total : 0.0;

    return HiveCard(
      padding: const EdgeInsets.all(AppTheme.sm + AppTheme.xs),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '${balance.balance}',
            style: AppTextStyle.display.copyWith(color: AppColors.amberAccent),
          ),
          const SizedBox(height: AppTheme.xs),
          Text(
            balance.typeName,
            style: AppTextStyle.caption,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppTheme.sm),
          LayoutBuilder(
            builder: (context, constraints) {
              return Stack(
                children: [
                  Container(
                    height: AppTheme.xs - 1,
                    width: constraints.maxWidth,
                    decoration: BoxDecoration(
                      color: AppColors.dividerLine,
                      borderRadius: BorderRadius.circular(AppTheme.xs),
                    ),
                  ),
                  Container(
                    height: AppTheme.xs - 1,
                    width: constraints.maxWidth * progress.clamp(0.0, 1.0),
                    decoration: BoxDecoration(
                      color: AppColors.amberAccent,
                      borderRadius: BorderRadius.circular(AppTheme.xs),
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: AppTheme.xs),
          Text(
            context.l10n.leaveBalanceRemaining(
              balance.balance,
              balance.total,
            ),
            style: AppTextStyle.overline,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
