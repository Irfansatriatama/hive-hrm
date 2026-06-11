import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class SkeletonBox extends StatelessWidget {
  final double width;
  final double height;
  final double radius;

  const SkeletonBox({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.radius = AppTheme.radiusCard,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surfaceBlue,
      highlightColor: AppColors.cardElevated,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.surfaceBlue,
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppTheme.md),
      child: Column(
        children: [
          Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  SkeletonBox(width: 80, height: 10),
                  SizedBox(height: AppTheme.xs),
                  SkeletonBox(width: 160, height: 20),
                ],
              ),
              const Spacer(),
              const SkeletonBox(width: 40, height: 40, radius: 20),
            ],
          ),
          const SizedBox(height: AppTheme.md),
          const SkeletonBox(height: 80),
          const SizedBox(height: AppTheme.md),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            crossAxisSpacing: AppTheme.sm,
            mainAxisSpacing: AppTheme.sm,
            childAspectRatio: 1.5,
            physics: const NeverScrollableScrollPhysics(),
            children: List.generate(4, (_) => const SkeletonBox(height: 80)),
          ),
        ],
      ),
    );
  }
}
