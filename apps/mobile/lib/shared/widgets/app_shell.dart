import 'package:flutter/material.dart';
import 'offline_banner.dart';

class HiveAppShell extends StatelessWidget {
  final Widget child;

  const HiveAppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: OfflineBanner(child: child),
    );
  }
}
