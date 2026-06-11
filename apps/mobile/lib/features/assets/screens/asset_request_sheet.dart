import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/assets_provider.dart';

Future<void> showAssetRequestSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.lg)),
    ),
    builder: (ctx) => const _AssetRequestSheet(),
  );
}

class _AssetRequestSheet extends ConsumerStatefulWidget {
  const _AssetRequestSheet();

  @override
  ConsumerState<_AssetRequestSheet> createState() => _AssetRequestSheetState();
}

class _AssetRequestSheetState extends ConsumerState<_AssetRequestSheet> {
  final _nameController = TextEditingController();
  final _reasonController = TextEditingController();
  int _duration = 7;

  @override
  void dispose() {
    _nameController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_nameController.text.trim().isEmpty ||
        _reasonController.text.trim().isEmpty) {
      _showError(context.l10n.assetsRequestIncomplete);
      return;
    }

    final error = await ref.read(assetsProvider.notifier).createRequest(
          assetName: _nameController.text.trim(),
          reason: _reasonController.text.trim(),
          duration: _duration,
        );

    if (!mounted) return;
    if (error != null) {
      _showError(error);
      return;
    }

    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.l10n.assetsRequestSuccess),
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
    final isSubmitting = ref.watch(assetsSubmittingProvider);
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
            Text(context.l10n.assetsRequestTitle, style: AppTextStyle.h2),
            const SizedBox(height: AppTheme.md),
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: context.l10n.assetsRequestNameLabel,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                ),
              ),
              style: AppTextStyle.body2,
            ),
            const SizedBox(height: AppTheme.sm),
            TextField(
              controller: _reasonController,
              decoration: InputDecoration(
                labelText: context.l10n.reasonLabel,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                ),
              ),
              maxLines: 2,
              style: AppTextStyle.body2,
            ),
            const SizedBox(height: AppTheme.sm),
            Text(context.l10n.assetsDurationLabel, style: AppTextStyle.body2),
            Slider(
              value: _duration.toDouble(),
              min: 1,
              max: 30,
              divisions: 29,
              label: '$_duration',
              onChanged: (value) => setState(() => _duration = value.round()),
            ),
            Text(
              context.l10n.assetsDurationDays(_duration),
              style: AppTextStyle.caption,
            ),
            const SizedBox(height: AppTheme.lg),
            ElevatedButton(
              onPressed: isSubmitting ? null : _submit,
              child: isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(context.l10n.submit),
            ),
            const SizedBox(height: AppTheme.sm),
          ],
        ),
      ),
    );
  }
}
