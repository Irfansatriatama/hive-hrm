import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/api/api_client.dart';
import 'core/auth/auth_provider.dart';
import 'core/l10n/l10n.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    debugPrint('FlutterError: ${details.exceptionAsString()}');
    if (details.stack != null) {
      debugPrint(details.stack.toString());
    }
  };

  runApp(const ProviderScope(child: HiveHrmApp()));
}

class HiveHrmApp extends ConsumerStatefulWidget {
  const HiveHrmApp({super.key});

  @override
  ConsumerState<HiveHrmApp> createState() => _HiveHrmAppState();
}

class _HiveHrmAppState extends ConsumerState<HiveHrmApp> {
  @override
  void initState() {
    super.initState();
    ApiClient.onUnauthorized = () async {
      if (!mounted) return;
      await ref.read(authProvider.notifier).signOut();
    };
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'HIVE HRM',
      theme: AppTheme.darkTheme,
      routerConfig: router,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('id'),
        Locale('en'),
      ],
      locale: const Locale('id'),
      debugShowCheckedModeBanner: false,
    );
  }
}
