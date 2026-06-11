import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/feature_models.dart';
import '../providers/shift_provider.dart';

Future<void> showShiftSwapSheet(
  BuildContext context, {
  required List<ShiftColleagueModel> colleagues,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.lg)),
    ),
    builder: (ctx) => _ShiftSwapSheet(colleagues: colleagues),
  );
}

class _ShiftSwapSheet extends ConsumerStatefulWidget {
  final List<ShiftColleagueModel> colleagues;

  const _ShiftSwapSheet({required this.colleagues});

  @override
  ConsumerState<_ShiftSwapSheet> createState() => _ShiftSwapSheetState();
}

class _ShiftSwapSheetState extends ConsumerState<_ShiftSwapSheet> {
  String? _partnerId;
  DateTime? _date;
  final _detailsController = TextEditingController();

  @override
  void dispose() {
    _detailsController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_partnerId == null || _date == null) {
      _showError(context.l10n.shiftSwapIncomplete);
      return;
    }
    if (_detailsController.text.trim().isEmpty) {
      _showError(context.l10n.shiftSwapDetailsRequired);
      return;
    }

    final error = await ref.read(shiftProvider.notifier).createSwap(
          partnerId: _partnerId!,
          date: formatDateOnly(_date!),
          shiftDetails: _detailsController.text.trim(),
        );

    if (!mounted) return;
    if (error != null) {
      _showError(error);
      return;
    }

    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          context.l10n.shiftSwapSuccess,
          style: AppTextStyle.body2,
        ),
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
    final isSubmitting = ref.watch(shiftSubmittingProvider);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppTheme.md,
        AppTheme.md,
        AppTheme.md,
        AppTheme.md + bottomInset,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(context.l10n.shiftSwapTitle, style: AppTextStyle.h2),
          const SizedBox(height: AppTheme.md),
          DropdownButtonFormField<String>(
            value: _partnerId,
            decoration: InputDecoration(
              labelText: context.l10n.shiftSwapPartner,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusCard),
              ),
            ),
            dropdownColor: AppColors.cardElevated,
            items: widget.colleagues
                .map(
                  (c) => DropdownMenuItem(
                    value: c.id,
                    child: Text(c.name, style: AppTextStyle.body2),
                  ),
                )
                .toList(),
            onChanged: (value) => setState(() => _partnerId = value),
          ),
          const SizedBox(height: AppTheme.sm),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(context.l10n.shiftSwapDate, style: AppTextStyle.body2),
            subtitle: Text(
              _date != null
                  ? formatDateOnly(_date!)
                  : context.l10n.selectDateRange,
              style: AppTextStyle.caption,
            ),
            trailing: const Icon(Icons.calendar_today_rounded),
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime.now(),
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (picked != null) setState(() => _date = picked);
            },
          ),
          const SizedBox(height: AppTheme.sm),
          TextField(
            controller: _detailsController,
            decoration: InputDecoration(
              labelText: context.l10n.shiftSwapDetails,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusCard),
              ),
            ),
            maxLines: 2,
            style: AppTextStyle.body2,
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
    );
  }
}
