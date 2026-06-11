import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/leave_model.dart';
import '../providers/leave_provider.dart';

Future<void> showLeaveApplySheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(AppTheme.radiusCard),
      ),
    ),
    builder: (ctx) => const LeaveApplySheet(),
  );
}

class LeaveApplySheet extends ConsumerStatefulWidget {
  const LeaveApplySheet({super.key});

  @override
  ConsumerState<LeaveApplySheet> createState() => _LeaveApplySheetState();
}

class _LeaveApplySheetState extends ConsumerState<LeaveApplySheet> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();

  String? _selectedTypeId;
  DateTimeRange? _dateRange;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _pickDateRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: now,
      lastDate: DateTime(now.year + 1),
      initialDateRange: _dateRange,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.amberAccent,
              onPrimary: AppColors.primaryNavy,
              surface: AppColors.surfaceBlue,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _dateRange = picked);
      _formKey.currentState?.validate();
    }
  }

  String _formatDateRange() {
    if (_dateRange == null) return context.l10n.selectDateRange;
    final fmt = DateFormat('d MMM yyyy', 'id_ID');
    return '${fmt.format(_dateRange!.start)} – ${fmt.format(_dateRange!.end)}';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedTypeId == null || _dateRange == null) return;

    final error = await ref.read(leaveProvider.notifier).applyLeave(
          leaveTypeId: _selectedTypeId!,
          startDate: _dateRange!.start,
          endDate: _dateRange!.end,
          reason: _reasonController.text.trim(),
        );

    if (!mounted) return;

    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.l10n.leaveApplySuccess),
        backgroundColor: AppColors.successGreen,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final typesState = ref.watch(leaveTypesProvider);
    final isSubmitting = ref.watch(leaveSubmittingProvider);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppTheme.md),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: AppTheme.lg,
                  height: AppTheme.xs,
                  margin: const EdgeInsets.only(bottom: AppTheme.md),
                  decoration: BoxDecoration(
                    color: AppColors.dividerLine,
                    borderRadius: BorderRadius.circular(AppTheme.xs),
                  ),
                ),
              ),
              Text(context.l10n.applyLeaveTitle, style: AppTextStyle.h2),
              const SizedBox(height: AppTheme.md),
              Text(context.l10n.leaveTypeLabel.toUpperCase(),
                  style: AppTextStyle.overline),
              const SizedBox(height: AppTheme.xs),
              typesState.when(
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(AppTheme.md),
                    child: CircularProgressIndicator(),
                  ),
                ),
                error: (e, _) => Text(e.toString(), style: AppTextStyle.caption),
                data: (types) => DropdownButtonFormField<String>(
                  initialValue: _selectedTypeId,
                  decoration: InputDecoration(
                    hintText: context.l10n.leaveTypeLabel,
                  ),
                  items: types
                      .map((LeaveTypeModel t) => DropdownMenuItem(
                            value: t.id,
                            child: Text(t.name, style: AppTextStyle.body2),
                          ))
                      .toList(),
                  onChanged: isSubmitting
                      ? null
                      : (value) => setState(() => _selectedTypeId = value),
                  validator: (_) =>
                      _selectedTypeId == null ? context.l10n.leaveTypeRequired : null,
                ),
              ),
              const SizedBox(height: AppTheme.md),
              Text(context.l10n.dateRangeLabel.toUpperCase(),
                  style: AppTextStyle.overline),
              const SizedBox(height: AppTheme.xs),
              FormField<void>(
                validator: (_) =>
                    _dateRange == null ? context.l10n.dateRequired : null,
                builder: (field) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    InkWell(
                      onTap: isSubmitting ? null : _pickDateRange,
                      borderRadius:
                          BorderRadius.circular(AppTheme.radiusInput),
                      child: InputDecorator(
                        decoration: InputDecoration(
                          errorText: field.errorText,
                          suffixIcon: const Icon(
                            Icons.calendar_today_rounded,
                            color: AppColors.textSubtle,
                          ),
                        ),
                        child: Text(
                          _formatDateRange(),
                          style: AppTextStyle.body2.copyWith(
                            color: _dateRange == null
                                ? AppColors.textSubtle
                                : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppTheme.md),
              Text(context.l10n.reasonLabel.toUpperCase(),
                  style: AppTextStyle.overline),
              const SizedBox(height: AppTheme.xs),
              TextFormField(
                controller: _reasonController,
                maxLines: 3,
                enabled: !isSubmitting,
                decoration: InputDecoration(
                  hintText: context.l10n.reasonLabel,
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return context.l10n.reasonRequired;
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppTheme.lg),
              SizedBox(
                height: AppTheme.tapMin,
                child: ElevatedButton(
                  onPressed: isSubmitting ? null : _submit,
                  child: isSubmitting
                      ? const SizedBox(
                          width: AppTheme.md + AppTheme.xs,
                          height: AppTheme.md + AppTheme.xs,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.primaryNavy,
                          ),
                        )
                      : Text(context.l10n.submitLeave),
                ),
              ),
              SizedBox(height: AppTheme.md + MediaQuery.paddingOf(context).bottom),
            ],
          ),
        ),
      ),
    );
  }
}
