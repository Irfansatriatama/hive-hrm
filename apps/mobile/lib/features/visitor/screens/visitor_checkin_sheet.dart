import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/visitor_provider.dart';

Future<void> showVisitorCheckInSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.lg)),
    ),
    builder: (ctx) => const _VisitorCheckInSheet(),
  );
}

class _VisitorCheckInSheet extends ConsumerStatefulWidget {
  const _VisitorCheckInSheet();

  @override
  ConsumerState<_VisitorCheckInSheet> createState() =>
      _VisitorCheckInSheetState();
}

class _VisitorCheckInSheetState extends ConsumerState<_VisitorCheckInSheet> {
  final _nameController = TextEditingController();
  final _companyController = TextEditingController();
  final _idController = TextEditingController();
  final _phoneController = TextEditingController();
  final _purposeController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _companyController.dispose();
    _idController.dispose();
    _phoneController.dispose();
    _purposeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_nameController.text.trim().isEmpty ||
        _companyController.text.trim().isEmpty ||
        _idController.text.trim().isEmpty ||
        _phoneController.text.trim().isEmpty ||
        _purposeController.text.trim().isEmpty) {
      _showError(context.l10n.visitorCheckInIncomplete);
      return;
    }

    final error = await ref.read(visitorProvider.notifier).checkIn(
          visitorName: _nameController.text.trim(),
          company: _companyController.text.trim(),
          idNumber: _idController.text.trim(),
          phone: _phoneController.text.trim(),
          purpose: _purposeController.text.trim(),
        );

    if (!mounted) return;
    if (error != null) {
      _showError(error);
      return;
    }

    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.l10n.visitorCheckInSuccess),
        backgroundColor: AppColors.successGreen,
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: AppTextStyle.body2),
        backgroundColor: AppColors.errorRed,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isSubmitting = ref.watch(visitorSubmittingProvider);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppTheme.md,
        AppTheme.md,
        AppTheme.md,
        AppTheme.md + bottomInset,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(context.l10n.visitorCheckInTitle, style: AppTextStyle.h2),
            const SizedBox(height: AppTheme.md),
            _field(_nameController, context.l10n.visitorNameLabel),
            const SizedBox(height: AppTheme.sm),
            _field(_companyController, context.l10n.visitorCompanyLabel),
            const SizedBox(height: AppTheme.sm),
            _field(_idController, context.l10n.visitorIdLabel),
            const SizedBox(height: AppTheme.sm),
            _field(_phoneController, context.l10n.phoneLabel),
            const SizedBox(height: AppTheme.sm),
            _field(_purposeController, context.l10n.reasonLabel, maxLines: 2),
            const SizedBox(height: AppTheme.lg),
            ElevatedButton(
              onPressed: isSubmitting ? null : _submit,
              child: isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(context.l10n.visitorCheckIn),
            ),
            const SizedBox(height: AppTheme.sm),
          ],
        ),
      ),
    );
  }

  Widget _field(TextEditingController controller, String label, {int maxLines = 1}) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        ),
      ),
      style: AppTextStyle.body2,
    );
  }
}
