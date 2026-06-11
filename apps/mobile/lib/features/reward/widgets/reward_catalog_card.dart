import 'package:flutter/material.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/reward_model.dart';
import '../../../shared/widgets/hive_card.dart';

class RewardCatalogCard extends StatelessWidget {
  final RewardCatalogModel item;
  final int balance;
  final VoidCallback? onRedeem;

  const RewardCatalogCard({
    super.key,
    required this.item,
    required this.balance,
    this.onRedeem,
  });

  bool get canRedeem => balance >= item.points && item.stock > 0;

  @override
  Widget build(BuildContext context) {
    return HiveCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 72,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.cardElevated,
              borderRadius: BorderRadius.circular(AppTheme.radiusBtn),
            ),
            child: const Icon(
              Icons.card_giftcard_rounded,
              color: AppColors.textSubtle,
              size: 32,
            ),
          ),
          const SizedBox(height: AppTheme.sm),
          Text(item.category.toUpperCase(), style: AppTextStyle.overline),
          const SizedBox(height: AppTheme.xs),
          Text(
            item.name,
            style: AppTextStyle.body1.copyWith(fontWeight: FontWeight.w600),
          ),
          if (item.description != null && item.description!.isNotEmpty) ...[
            const SizedBox(height: AppTheme.xs),
            Text(
              item.description!,
              style: AppTextStyle.caption,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: AppTheme.md),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.l10n.rewardPointsCount(item.points),
                      style: AppTextStyle.body2.copyWith(
                        color: AppColors.amberAccent,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      context.l10n.rewardStockCount(item.stock),
                      style: AppTextStyle.caption,
                    ),
                  ],
                ),
              ),
              ElevatedButton(
                onPressed: canRedeem ? onRedeem : null,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(0, AppTheme.tapMin - AppTheme.xs),
                  padding: const EdgeInsets.symmetric(horizontal: AppTheme.md),
                ),
                child: Text(context.l10n.rewardRedeem),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
