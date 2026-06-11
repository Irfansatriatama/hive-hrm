import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../auth/auth_provider.dart';
import '../../features/announcement/screens/announcement_screen.dart';
import '../../features/approval/screens/approval_screen.dart';
import '../../features/attendance/screens/attendance_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/home/screens/more_screen.dart';
import '../../features/leave/screens/leave_calendar_screen.dart';
import '../../features/leave/screens/leave_screen.dart';
import '../../features/expense/screens/expense_screen.dart';
import '../../features/reward/screens/reward_screen.dart';
import '../../features/payslip/screens/payslip_screen.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../features/org_chart/screens/org_chart_screen.dart';
import '../../features/shift/screens/shift_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/resources/screens/resources_screen.dart';
import '../../features/documents/screens/documents_screen.dart';
import '../../features/assets/screens/assets_screen.dart';
import '../../features/visitor/screens/visitor_screen.dart';
import '../../shared/widgets/app_shell.dart';

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
    initialLocation: '/home',
    redirect: (context, state) {
      final token = authState.valueOrNull;
      final isLoggedIn = token != null;
      final isLoginRoute = state.matchedLocation == '/login';
      final location = state.matchedLocation;

      if (!isLoggedIn && !isLoginRoute) return '/login';
      if (isLoggedIn && isLoginRoute) return '/home';
      if (isLoggedIn && location == '/dashboard') return '/home';
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
        builder: (context, state, child) => HiveAppShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const HomeScreen(),
            ),
          ),
          GoRoute(
            path: '/dashboard',
            redirect: (_, __) => '/home',
          ),
          GoRoute(
            path: '/more',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const MoreScreen(),
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
            path: '/reward',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const RewardScreen(),
            ),
          ),
          GoRoute(
            path: '/expense',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const ExpenseScreen(),
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
            path: '/leave/calendar',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const LeaveCalendarScreen(),
            ),
          ),
          GoRoute(
            path: '/onboarding',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const OnboardingScreen(),
            ),
          ),
          GoRoute(
            path: '/shift',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const ShiftScreen(),
            ),
          ),
          GoRoute(
            path: '/org-chart',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const OrgChartScreen(),
            ),
          ),
          GoRoute(
            path: '/resources',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const ResourcesScreen(),
            ),
          ),
          GoRoute(
            path: '/documents',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const DocumentsScreen(),
            ),
          ),
          GoRoute(
            path: '/assets',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const AssetsScreen(),
            ),
          ),
          GoRoute(
            path: '/visitor',
            pageBuilder: (context, state) => _fadeTransitionPage(
              state: state,
              child: const VisitorScreen(),
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
