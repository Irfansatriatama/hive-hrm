import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';

class GreetingRow extends StatelessWidget {
  final String name;
  final String? photoUrl;
  final bool hasUnread;

  const GreetingRow({
    super.key,
    required this.name,
    this.photoUrl,
    this.hasUnread = false,
  });

  String _greeting(BuildContext context) {
    final hour = DateTime.now().hour;
    if (hour < 12) return context.l10n.greeting;
    if (hour < 17) return context.l10n.greetingAfternoon;
    return context.l10n.greetingEvening;
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_greeting(context), style: AppTextStyle.caption),
              Text(name, style: AppTextStyle.h1),
            ],
          ),
        ),
        GestureDetector(
          onTap: () => context.go('/announcement'),
          child: SizedBox(
            width: AppTheme.tapMin,
            height: AppTheme.tapMin,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Center(
                  child: CircleAvatar(
                    radius: 15,
                    backgroundColor: AppColors.cardElevated,
                    backgroundImage: photoUrl != null && photoUrl!.isNotEmpty
                        ? CachedNetworkImageProvider(photoUrl!)
                        : null,
                    child: photoUrl == null || photoUrl!.isEmpty
                        ? Text(_initials(name), style: AppTextStyle.caption)
                        : null,
                  ),
                ),
                if (hasUnread)
                  Positioned(
                    top: AppTheme.sm,
                    right: AppTheme.sm,
                    child: Container(
                      width: AppTheme.sm,
                      height: AppTheme.sm,
                      decoration: const BoxDecoration(
                        color: AppColors.amberAccent,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
