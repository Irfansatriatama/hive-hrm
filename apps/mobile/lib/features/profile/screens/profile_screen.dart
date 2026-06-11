import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/employee_model.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/status_badge.dart';
import '../providers/profile_provider.dart';
import '../widgets/profile_info_row.dart';
import 'profile_update_sheet.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  StatusType _employeeStatusType(String? status) {
    if (status == 'active') return StatusType.active;
    return StatusType.inactive;
  }

  String _formatJoinDate(BuildContext context, String? joinDate) {
    if (joinDate == null || joinDate.isEmpty) {
      return context.l10n.notAvailable;
    }
    final parsed = DateTime.tryParse(joinDate);
    if (parsed == null) return joinDate;
    return DateFormat('dd MMM yyyy', 'id_ID').format(parsed);
  }

  Future<void> _confirmSignOut(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceBlue,
        title: Text(context.l10n.logout, style: AppTextStyle.h2),
        content: Text(context.l10n.logoutConfirm, style: AppTextStyle.body2),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(context.l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(context.l10n.logout),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(profileProvider.notifier).signOut();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: AppBar(
        title: Text(context.l10n.profileTitle, style: AppTextStyle.h1),
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(profileProvider.future),
        child: switch (profileState) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: ProfileSkeleton(),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(profileProvider),
                ),
              ),
            ),
          AsyncData(:final value) => _ProfileContent(
              employee: value,
              initials: _initials(value.name),
              statusType: _employeeStatusType(value.status),
              joinDateLabel: _formatJoinDate(context, value.joinDate),
              onRequestUpdate: () => showProfileUpdateSheet(context, value),
              onSignOut: () => _confirmSignOut(context, ref),
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _ProfileContent extends StatelessWidget {
  final EmployeeModel employee;
  final String initials;
  final StatusType statusType;
  final String joinDateLabel;
  final VoidCallback onRequestUpdate;
  final VoidCallback onSignOut;

  const _ProfileContent({
    required this.employee,
    required this.initials,
    required this.statusType,
    required this.joinDateLabel,
    required this.onRequestUpdate,
    required this.onSignOut,
  });

  @override
  Widget build(BuildContext context) {
    final employeeId = employee.employeeNumber ?? employee.id;
    final departmentName = employee.department?.name ?? context.l10n.notAvailable;
    final managerName = employee.manager?.name.isNotEmpty == true
        ? employee.manager!.name
        : context.l10n.notAvailable;
    final statusLabel = statusType == StatusType.active
        ? context.l10n.active
        : context.l10n.inactive;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      child: Column(
        children: [
          _ProfileAvatar(
            photoUrl: employee.photoUrl,
            initials: initials,
          ),
          const SizedBox(height: AppTheme.sm),
          Text(employee.name, style: AppTextStyle.h1, textAlign: TextAlign.center),
          if (employee.position != null) ...[
            const SizedBox(height: AppTheme.xs),
            Text(
              employee.position!.name,
              style: AppTextStyle.body2,
              textAlign: TextAlign.center,
            ),
          ],
          const SizedBox(height: AppTheme.sm),
          StatusBadge(status: statusType, label: statusLabel),
          const SizedBox(height: AppTheme.lg),
          ProfileInfoRow(
            label: context.l10n.department,
            value: departmentName,
          ),
          ProfileInfoRow(
            label: context.l10n.joinDate,
            value: joinDateLabel,
          ),
          ProfileInfoRow(
            label: context.l10n.employeeId,
            value: employeeId,
          ),
          ProfileInfoRow(
            label: context.l10n.supervisor,
            value: managerName,
          ),
          const SizedBox(height: AppTheme.md),
          _ProfileActionTile(
            label: context.l10n.requestDataUpdate,
            icon: Icons.edit_outlined,
            onTap: onRequestUpdate,
          ),
          const SizedBox(height: AppTheme.sm),
          _ProfileActionTile(
            label: context.l10n.logout,
            icon: Icons.logout_rounded,
            color: AppColors.errorRed,
            onTap: onSignOut,
          ),
          const SizedBox(height: AppTheme.xl),
        ],
      ),
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  final String? photoUrl;
  final String initials;

  const _ProfileAvatar({
    required this.photoUrl,
    required this.initials,
  });

  @override
  Widget build(BuildContext context) {
    const avatarSize = AppTheme.tapMin + AppTheme.xs;
    final hasPhoto = photoUrl != null && photoUrl!.isNotEmpty;

    return Container(
      width: avatarSize,
      height: avatarSize,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.amberAccent, width: 2),
      ),
      child: ClipOval(
        child: hasPhoto
            ? CachedNetworkImage(
                imageUrl: photoUrl!,
                fit: BoxFit.cover,
                width: avatarSize,
                height: avatarSize,
                placeholder: (_, __) => ColoredBox(
                  color: AppColors.amberAccent,
                  child: Center(
                    child: Text(
                      initials,
                      style: AppTextStyle.h3.copyWith(color: AppColors.primaryNavy),
                    ),
                  ),
                ),
                errorWidget: (_, __, ___) => ColoredBox(
                  color: AppColors.amberAccent,
                  child: Center(
                    child: Text(
                      initials,
                      style: AppTextStyle.h3.copyWith(color: AppColors.primaryNavy),
                    ),
                  ),
                ),
              )
            : ColoredBox(
                color: AppColors.amberAccent,
                child: Center(
                  child: Text(
                    initials,
                    style: AppTextStyle.h3.copyWith(color: AppColors.primaryNavy),
                  ),
                ),
              ),
      ),
    );
  }
}

class _ProfileActionTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color? color;
  final VoidCallback onTap;

  const _ProfileActionTile({
    required this.label,
    required this.icon,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final tileColor = color ?? AppColors.textPrimary;

    return HiveCard(
      onTap: onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: AppTheme.tapMin),
        child: Row(
          children: [
            Icon(icon, color: tileColor, size: AppTheme.md + AppTheme.xs),
            const SizedBox(width: AppTheme.sm + AppTheme.xs),
            Expanded(
              child: Text(
                label,
                style: AppTextStyle.body1.copyWith(color: tileColor),
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: AppColors.textSubtle,
              size: AppTheme.md + AppTheme.xs,
            ),
          ],
        ),
      ),
    );
  }
}
