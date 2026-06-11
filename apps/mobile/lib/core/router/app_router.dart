import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../auth/auth_provider.dart';
import '../../features/announcement/screens/announcement_screen.dart';
import '../../features/approval/screens/approval_screen.dart';
import '../../features/attendance/screens/attendance_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/leave/screens/leave_screen.dart';
import '../../features/payslip/screens/payslip_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../shared/widgets/bottom_nav.dart';

part 'app_router.g.dart';

CustomTransitionPage<void> _fadeTransitionPage({
  required GoRouterState state,
  required Widget child,
}) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 250),
    reverseTransitionDuration: const Duration(milliseconds: 200),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeInOut,
      );
      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.02),
            end: Offset.zero,
          ).animate(curved),
          child: child,
        ),
      );
    },
  );
}

@Riverpod(keepAlive: true)
GoRouter appRouter(AppRouterRef ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final token = authState.valueOrNull;
      final isLoggedIn = token != null;
      final isLoginRoute = state.matchedLocation == '/login';

      if (!isLoggedIn && !isLoginRoute) return '/login';
      if (isLoggedIn && isLoginRoute) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) => _fadeTransitionPage(
          state: state,
          child: const LoginScreen(),
        ),
      ),
      ShellRoute(
        builder: (context, state, child) => HiveBottomNavShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const DashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/attendance',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const AttendanceScreen(),
            ),
          ),
          GoRoute(
            path: '/leave',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const LeaveScreen(),
            ),
          ),
          GoRoute(
            path: '/announcement',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const AnnouncementScreen(),
            ),
          ),
          GoRoute(
            path: '/approval',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const ApprovalScreen(),
            ),
          ),
          GoRoute(
            path: '/payslip',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const PayslipScreen(),
            ),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const ProfileScreen(),
            ),
          ),
        ],
      ),
    ],
  );
}
