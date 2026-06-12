import 'package:flutter/material.dart';
import '../../core/navigation/app_navigation.dart';
import '../../core/theme/app_text_style.dart';

class HiveAppBar extends StatelessWidget implements PreferredSizeWidget {
  final Widget title;
  final List<Widget>? actions;
  final PreferredSizeWidget? bottom;
  final bool showBack;

  const HiveAppBar({
    super.key,
    required this.title,
    this.actions,
    this.bottom,
    this.showBack = true,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      leading: showBack
          ? IconButton(
              icon: const Icon(Icons.arrow_back_rounded),
              onPressed: () => context.navigateBack(),
            )
          : null,
      automaticallyImplyLeading: false,
      title: title,
      actions: actions,
      bottom: bottom,
    );
  }

  @override
  Size get preferredSize {
    final bottomHeight = bottom?.preferredSize.height ?? 0;
    return Size.fromHeight(kToolbarHeight + bottomHeight);
  }
}

/// Convenience for screens that use styled title text.
PreferredSizeWidget hiveAppBar(
  BuildContext context, {
  required String title,
  List<Widget>? actions,
  PreferredSizeWidget? bottom,
  bool showBack = true,
}) {
  return HiveAppBar(
    title: Text(title, style: AppTextStyle.h1),
    actions: actions,
    bottom: bottom,
    showBack: showBack,
  );
}
