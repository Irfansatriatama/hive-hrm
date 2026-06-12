import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

extension AppNavigation on BuildContext {
  /// Opens a feature screen on the navigation stack (supports system back).
  void openFeature(String route) {
    if (GoRouterState.of(this).matchedLocation == route) return;
    push(route);
  }

  /// Pops the stack or falls back to home when there is no prior route.
  void navigateBack() {
    if (canPop()) {
      pop();
    } else {
      go('/home');
    }
  }
}
