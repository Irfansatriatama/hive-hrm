import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/section_label.dart';
import '../providers/home_feed_provider.dart';
import '../utils/home_feed_formatter.dart';

class HomeFeedSection extends ConsumerWidget {
  const HomeFeedSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedState = ref.watch(homeFeedProvider);

    return switch (feedState) {
      AsyncData(:final value) when value.isEmpty => const SizedBox.shrink(),
      AsyncData(:final value) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SectionLabel(context.l10n.homeFeedTitle),
            const SizedBox(height: AppTheme.sm),
            ...value.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: AppTheme.sm),
                child: HiveCard(
                  onTap: () => context.openFeature(item.route),
                  child: Row(
                    children: [
                      Icon(item.icon, color: AppColors.amberAccent, size: 22),
                      const SizedBox(width: AppTheme.sm),
                      Expanded(
                        child: Text(
                          formatHomeFeedMessage(context.l10n, item),
                          style: AppTextStyle.body2,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Icon(
                        Icons.chevron_right_rounded,
                        color: AppColors.textSubtle,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      _ => const SizedBox.shrink(),
    };
  }
}
