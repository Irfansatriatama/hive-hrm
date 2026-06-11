import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';

Future<XFile?> showSelfiePromptSheet(BuildContext context) {
  return showModalBottomSheet<XFile?>(
    context: context,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(AppTheme.radiusCard),
      ),
    ),
    builder: (context) => const SelfiePromptSheet(),
  );
}

class SelfiePromptSheet extends StatelessWidget {
  const SelfiePromptSheet({super.key});

  Future<void> _takePhoto(BuildContext context) async {
    final permission = await Permission.camera.request();
    if (!context.mounted) return;

    if (!permission.isGranted) {
      Navigator.pop(context, null);
      return;
    }

    final picker = ImagePicker();
    final photo = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 60,
      maxWidth: 800,
    );

    if (!context.mounted) return;
    Navigator.pop(context, photo);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              context.l10n.selfieQuestion,
              style: AppTextStyle.h2,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppTheme.lg),
            ElevatedButton(
              onPressed: () => _takePhoto(context),
              child: Text(context.l10n.takePhoto),
            ),
            const SizedBox(height: AppTheme.sm),
            TextButton(
              onPressed: () => Navigator.pop(context, null),
              child: Text(
                context.l10n.skipPhoto,
                style: AppTextStyle.body2.copyWith(color: AppColors.tealSecondary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
