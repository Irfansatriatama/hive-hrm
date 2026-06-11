import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/reward_model.dart';
import '../../../shared/widgets/hive_card.dart';

class RewardTransactionTile extends StatelessWidget {
  final RewardTransactionModel transaction;

  const RewardTransactionTile({super.key, required this.transaction});

  @override
  Widget build(BuildContext context) {
    final isPositive = transaction.isReceived;
    final color = isPositive ? AppColors.successGreen : AppColors.errorRed;
    final prefix = isPositive ? '+' : '-';

    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.sm),
      child: HiveCard(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: AppTheme.tapMin - AppTheme.xs,
              height: AppTheme.tapMin - AppTheme.xs,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isPositive ? Icons.favorite_rounded : Icons.redeem_rounded,
                color: color,
                size: AppTheme.md,
              ),
            ),
            const SizedBox(width: AppTheme.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    transaction.senderReceiverName,
                    style: AppTextStyle.body1.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (transaction.hashtag != null &&
                      transaction.hashtag!.isNotEmpty) ...[
                    const SizedBox(height: AppTheme.xs),
                    Text(transaction.hashtag!, style: AppTextStyle.caption),
                  ],
                  if (transaction.message != null &&
                      transaction.message!.isNotEmpty) ...[
                    const SizedBox(height: AppTheme.xs),
                    Text(
                      transaction.message!,
                      style: AppTextStyle.body2,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: AppTheme.xs),
                  Text(
                    DateFormat('d MMM yyyy, HH:mm', 'id_ID')
                        .format(transaction.date.toLocal()),
                    style: AppTextStyle.caption,
                  ),
                ],
              ),
            ),
            Text(
              '$prefix${transaction.points}',
              style: AppTextStyle.body1.copyWith(
                color: color,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
