import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/l10n/l10n.dart';
import 'offline_banner.dart';

class HiveBottomNavShell extends StatelessWidget {
  final Widget child;
  const HiveBottomNavShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final l10n = context.l10n;

    final tabs = [
      (path: '/dashboard', label: l10n.navHome, icon: Icons.home_rounded),
      (path: '/attendance', label: l10n.navAttendance, icon: Icons.fingerprint_rounded),
      (path: '/leave', label: l10n.navLeave, icon: Icons.beach_access_rounded),
      (path: '/payslip', label: l10n.navPayslip, icon: Icons.receipt_long_rounded),
      (path: '/profile', label: l10n.navProfile, icon: Icons.person_rounded),
    ];

    final currentIndex = tabs.indexWhere((t) => location.startsWith(t.path));

    return Scaffold(
      body: OfflineBanner(child: child),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex < 0 ? 0 : currentIndex,
        onTap: (i) => context.go(tabs[i].path),
        items: tabs
            .map(
              (t) => BottomNavigationBarItem(
                icon: Icon(t.icon),
                label: t.label,
              ),
            )
            .toList(),
      ),
    );
  }
}
