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

class LeaveSkeleton extends StatelessWidget {
  const LeaveSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppTheme.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SkeletonBox(width: 80, height: 10),
          const SizedBox(height: AppTheme.sm),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            crossAxisSpacing: AppTheme.sm,
            mainAxisSpacing: AppTheme.sm,
            childAspectRatio: 0.85,
            physics: const NeverScrollableScrollPhysics(),
            children: List.generate(
              3,
              (_) => const SkeletonBox(height: 100),
            ),
          ),
          const SizedBox(height: AppTheme.md),
          const SkeletonBox(width: 120, height: 10),
          const SizedBox(height: AppTheme.sm),
          ...List.generate(
            2,
            (_) => const Padding(
              padding: EdgeInsets.only(bottom: AppTheme.sm),
              child: SkeletonBox(height: 96),
            ),
          ),
          const SizedBox(height: AppTheme.md),
          const SkeletonBox(width: 60, height: 10),
          const SizedBox(height: AppTheme.sm),
          ...List.generate(
            3,
            (_) => const Padding(
              padding: EdgeInsets.only(bottom: AppTheme.sm),
              child: SkeletonBox(height: 96),
            ),
          ),
        ],
      ),
    );
  }
}

class AnnouncementSkeleton extends StatelessWidget {
  const AnnouncementSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppTheme.md),
      child: Column(
        children: List.generate(
          5,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: AppTheme.sm),
            child: SkeletonBox(height: 112),
          ),
        ),
      ),
    );
  }
}

class ProfileSkeleton extends StatelessWidget {
  const ProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppTheme.md),
      child: Column(
        children: [
          const SkeletonBox(
            width: AppTheme.tapMin + AppTheme.xs,
            height: AppTheme.tapMin + AppTheme.xs,
            radius: AppTheme.tapMin,
          ),
          const SizedBox(height: AppTheme.sm),
          const SkeletonBox(width: 180, height: 22),
          const SizedBox(height: AppTheme.xs),
          const SkeletonBox(width: 120, height: 14),
          const SizedBox(height: AppTheme.sm),
          const SkeletonBox(width: 72, height: 24, radius: AppTheme.radiusPill),
          const SizedBox(height: AppTheme.lg),
          ...List.generate(
            4,
            (_) => const Padding(
              padding: EdgeInsets.only(bottom: AppTheme.sm),
              child: SkeletonBox(height: 56),
            ),
          ),
          const SizedBox(height: AppTheme.md),
          const SkeletonBox(height: 56),
          const SizedBox(height: AppTheme.sm),
          const SkeletonBox(height: 56),
        ],
      ),
    );
  }
}

class PayslipSkeleton extends StatelessWidget {
  const PayslipSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppTheme.md),
      child: Column(
        children: List.generate(
          4,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: AppTheme.sm),
            child: SkeletonBox(height: 120),
          ),
        ),
      ),
    );
  }
}

class ApprovalSkeleton extends StatelessWidget {
  const ApprovalSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppTheme.md),
      child: Column(
        children: List.generate(
          3,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: AppTheme.sm),
            child: SkeletonBox(height: 180),
          ),
        ),
      ),
    );
  }
}

class AttendanceSkeleton extends StatelessWidget {
  const AttendanceSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppTheme.md),
      child: Column(
        children: [
          const SkeletonBox(width: 120, height: 12),
          const SizedBox(height: AppTheme.sm + AppTheme.xs),
          const SkeletonBox(
            width: AppTheme.tapMin * 2 + AppTheme.sm,
            height: AppTheme.tapMin * 2 + AppTheme.sm,
            radius: AppTheme.tapMin + AppTheme.sm,
          ),
          const SizedBox(height: AppTheme.lg),
          Row(
            children: List.generate(
              3,
              (_) => const Expanded(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: AppTheme.xs),
                  child: SkeletonBox(height: 72),
                ),
              ),
            ),
          ),
          const SizedBox(height: AppTheme.md),
          const SkeletonBox(width: 80, height: 10),
          const SizedBox(height: AppTheme.sm),
          Row(
            children: List.generate(
              5,
              (_) => const Expanded(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: AppTheme.xs),
                  child: SkeletonBox(height: 48, radius: AppTheme.lg),
                ),
              ),
            ),
          ),
          const SizedBox(height: AppTheme.md),
          const SkeletonBox(width: 60, height: 10),
          const SizedBox(height: AppTheme.sm),
          ...List.generate(
            3,
            (_) => const Padding(
              padding: EdgeInsets.only(bottom: AppTheme.sm),
              child: SkeletonBox(height: 96),
            ),
          ),
        ],
      ),
    );
  }
}
