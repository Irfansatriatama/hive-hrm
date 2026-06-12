import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/navigation/app_menu_config.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/menu_grid_item.dart';
import '../../../shared/widgets/section_label.dart';

class HomeMenuGrid extends StatelessWidget {
  const HomeMenuGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionLabel(context.l10n.homeMenuTitle),
        const SizedBox(height: AppTheme.sm),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            crossAxisSpacing: AppTheme.sm,
            mainAxisSpacing: AppTheme.sm,
            childAspectRatio: 0.82,
          ),
          itemCount: homeMenuItems.length + 1,
          itemBuilder: (context, index) {
            if (index == homeMenuItems.length) {
              return MoreMenuGridItem(onTap: () => context.openFeature('/more'));
            }
            final item = homeMenuItems[index];
            return MenuGridItem(
              item: item,
              label: menuLabel(context, item.id),
              onTap: () => context.openFeature(item.route),
              primary: item.id == AppMenuId.attendance,
            );
          },
        ),
      ],
    );
  }
}
