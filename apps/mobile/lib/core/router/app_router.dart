import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../auth/auth_provider.dart';
import '../../features/announcement/screens/announcement_screen.dart';
import '../../features/attendance/screens/attendance_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/leave/screens/leave_screen.dart';
import '../../features/payslip/screens/payslip_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../shared/widgets/bottom_nav.dart';

part 'app_router.g.dart';

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
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => HiveBottomNavShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (_, __) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/attendance',
            builder: (_, __) => const AttendanceScreen(),
          ),
          GoRoute(
            path: '/leave',
            builder: (_, __) => const LeaveScreen(),
          ),
          GoRoute(
            path: '/announcement',
            builder: (_, __) => const AnnouncementScreen(),
          ),
          GoRoute(
            path: '/payslip',
            builder: (_, __) => const PayslipScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (_, __) => const ProfileScreen(),
          ),
        ],
      ),
    ],
  );
}
