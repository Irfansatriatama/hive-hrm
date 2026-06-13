import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/l10n/l10n.dart';
import '../../core/theme/app_colors.dart';
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
    final activeIndex = currentIndex < 0 ? 0 : currentIndex;

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      body: OfflineBanner(child: child),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.surfaceBlue.withOpacity(0.95),
              AppColors.primaryNavy,
            ],
          ),
          border: Border(
            top: BorderSide(color: AppColors.dividerLine.withOpacity(0.6)),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: activeIndex,
          backgroundColor: Colors.transparent,
          elevation: 0,
          onTap: (i) => context.go(tabs[i].path),
          items: tabs
              .map(
                (t) => BottomNavigationBarItem(
                  icon: Icon(t.icon),
                  activeIcon: DecoratedBox(
                    decoration: BoxDecoration(
                      color: AppColors.amberAccent.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      child: Icon(t.icon, color: AppColors.amberAccent),
                    ),
                  ),
                  label: t.label,
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}
