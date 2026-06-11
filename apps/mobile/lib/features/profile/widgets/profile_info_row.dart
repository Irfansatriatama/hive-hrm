import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/hive_card.dart';

class ProfileInfoRow extends StatelessWidget {
  final String label;
  final String value;

  const ProfileInfoRow({
    super.key,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.sm),
      child: HiveCard(
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: AppTextStyle.caption.copyWith(color: AppColors.textSubtle),
              ),
            ),
            const SizedBox(width: AppTheme.sm),
            Expanded(
              child: Text(
                value,
                style: AppTextStyle.body2.copyWith(fontWeight: FontWeight.w600),
                textAlign: TextAlign.end,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
