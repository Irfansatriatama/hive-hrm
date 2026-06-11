import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/user_role_provider.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/navigation/app_menu_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/menu_grid_item.dart';
import '../../../shared/widgets/menu_list_tile.dart';
import '../../../shared/widgets/section_label.dart';
import '../../approval/providers/approval_provider.dart';

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  String _sectionLabel(BuildContext context, AppMenuSection section) {
    return switch (section) {
      AppMenuSection.operational => context.l10n.menuSectionOperational,
      AppMenuSection.hrTeam => context.l10n.menuSectionHrTeam,
      AppMenuSection.manager => context.l10n.menuSectionManager,
      AppMenuSection.general => context.l10n.menuSectionGeneral,
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canApprove = ref.watch(canApproveProvider);
    final approvalCount =
        ref.watch(approvalInboxProvider).valueOrNull?.length ?? 0;

    final visibleItems = moreMenuItems.where((item) {
      if (item.requiresApprover && !canApprove) return false;
      return true;
    }).toList();

    final sections = AppMenuSection.values.where((section) {
      return visibleItems.any((item) => item.section == section);
    });

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.menuMore, style: AppTextStyle.h1),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppTheme.md),
        children: [
          for (final section in sections) ...[
            SectionLabel(_sectionLabel(context, section)),
            const SizedBox(height: AppTheme.sm),
            ...visibleItems.where((item) => item.section == section).map(
              (item) => MenuListTile(
                icon: item.icon,
                label: menuLabel(context, item.id),
                badgeCount: item.id == AppMenuId.approval ? approvalCount : null,
                onTap: () => context.go(item.route),
              ),
            ),
            const SizedBox(height: AppTheme.md),
          ],
        ],
      ),
    );
  }
}
