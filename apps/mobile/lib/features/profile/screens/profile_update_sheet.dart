import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/employee_model.dart';
import '../providers/profile_provider.dart';

Future<void> showProfileUpdateSheet(
  BuildContext context,
  EmployeeModel employee,
) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(AppTheme.radiusCard),
      ),
    ),
    builder: (ctx) => ProfileUpdateSheet(employee: employee),
  );
}

class ProfileUpdateSheet extends ConsumerStatefulWidget {
  final EmployeeModel employee;

  const ProfileUpdateSheet({super.key, required this.employee});

  @override
  ConsumerState<ProfileUpdateSheet> createState() => _ProfileUpdateSheetState();
}

class _ProfileUpdateSheetState extends ConsumerState<ProfileUpdateSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _addressController;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.employee.name);
    _phoneController = TextEditingController(text: widget.employee.phone ?? '');
    _addressController =
        TextEditingController(text: widget.employee.address ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    final error = await ref.read(profileProvider.notifier).requestUpdate(
          name: _nameController.text.trim(),
          phone: _phoneController.text.trim(),
          address: _addressController.text.trim(),
          reason: context.l10n.profileUpdateReason,
        );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.errorRed,
          content: Text(
            context.l10n.profileUpdateFailed,
            style: AppTextStyle.body2.copyWith(color: AppColors.textPrimary),
          ),
        ),
      );
      return;
    }

    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.successGreen,
        content: Text(
          context.l10n.profileUpdateSuccess,
          style: AppTextStyle.body2.copyWith(color: AppColors.textPrimary),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: AppTheme.md,
        right: AppTheme.md,
        top: AppTheme.md,
        bottom: MediaQuery.viewInsetsOf(context).bottom + AppTheme.md,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(context.l10n.profileUpdateTitle, style: AppTextStyle.h2),
            const SizedBox(height: AppTheme.md),
            Text(context.l10n.nameLabel, style: AppTextStyle.overline),
            const SizedBox(height: AppTheme.xs),
            TextFormField(
              controller: _nameController,
              style: AppTextStyle.body2,
              decoration: InputDecoration(hintText: context.l10n.nameLabel),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return context.l10n.nameRequired;
                }
                return null;
              },
            ),
            const SizedBox(height: AppTheme.md),
            Text(context.l10n.phoneLabel, style: AppTextStyle.overline),
            const SizedBox(height: AppTheme.xs),
            TextFormField(
              controller: _phoneController,
              style: AppTextStyle.body2,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(hintText: context.l10n.phoneLabel),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return context.l10n.phoneRequired;
                }
                return null;
              },
            ),
            const SizedBox(height: AppTheme.md),
            Text(context.l10n.addressLabel, style: AppTextStyle.overline),
            const SizedBox(height: AppTheme.xs),
            TextFormField(
              controller: _addressController,
              style: AppTextStyle.body2,
              maxLines: 3,
              decoration: InputDecoration(hintText: context.l10n.addressLabel),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return context.l10n.addressRequired;
                }
                return null;
              },
            ),
            const SizedBox(height: AppTheme.lg),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primaryNavy,
                      ),
                    )
                  : Text(context.l10n.submit),
            ),
            const SizedBox(height: AppTheme.sm),
            OutlinedButton(
              onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(),
              child: Text(context.l10n.cancel),
            ),
          ],
        ),
      ),
    );
  }
}
