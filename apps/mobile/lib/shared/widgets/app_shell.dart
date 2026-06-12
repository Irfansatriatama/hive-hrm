import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/navigation/app_navigation.dart';
import 'offline_banner.dart';

class HiveAppShell extends StatelessWidget {
  final Widget child;

  const HiveAppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final isHome = GoRouterState.of(context).matchedLocation == '/home';
    final canPopStack = context.canPop();

    return PopScope(
      canPop: isHome || canPopStack,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && !isHome) {
          context.navigateBack();
        }
      },
      child: OfflineBanner(child: child),
    );
  }
}
