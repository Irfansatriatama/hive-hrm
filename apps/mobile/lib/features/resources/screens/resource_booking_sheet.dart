import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/feature_models.dart';
import '../providers/resources_provider.dart';

Future<void> showResourceBookingSheet(
  BuildContext context, {
  required List<BookableResourceModel> resources,
  String? initialResourceId,
  DateTime? initialDate,
  TimeOfDay? initialStartTime,
  TimeOfDay? initialEndTime,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.lg)),
    ),
    builder: (ctx) => _ResourceBookingSheet(
      resources: resources,
      initialResourceId: initialResourceId,
      initialDate: initialDate,
      initialStartTime: initialStartTime,
      initialEndTime: initialEndTime,
    ),
  );
}

class _ResourceBookingSheet extends ConsumerStatefulWidget {
  final List<BookableResourceModel> resources;
  final String? initialResourceId;
  final DateTime? initialDate;
  final TimeOfDay? initialStartTime;
  final TimeOfDay? initialEndTime;

  const _ResourceBookingSheet({
    required this.resources,
    this.initialResourceId,
    this.initialDate,
    this.initialStartTime,
    this.initialEndTime,
  });

  @override
  ConsumerState<_ResourceBookingSheet> createState() =>
      _ResourceBookingSheetState();
}

class _ResourceBookingSheetState extends ConsumerState<_ResourceBookingSheet> {
  String? _resourceId;
  DateTime? _date;
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;
  final _titleController = TextEditingController();
  final _purposeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _resourceId = widget.initialResourceId;
    _date = widget.initialDate;
    _startTime = widget.initialStartTime;
    _endTime = widget.initialEndTime;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _purposeController.dispose();
    super.dispose();
  }

  DateTime? _buildDateTime(DateTime? date, TimeOfDay? time) {
    if (date == null || time == null) return null;
    return DateTime(date.year, date.month, date.day, time.hour, time.minute);
  }

  Future<void> _submit() async {
    if (_resourceId == null ||
        _titleController.text.trim().isEmpty ||
        _buildDateTime(_date, _startTime) == null ||
        _buildDateTime(_date, _endTime) == null) {
      _showError(context.l10n.resourcesBookingIncomplete);
      return;
    }

    final start = _buildDateTime(_date, _startTime)!;
    final end = _buildDateTime(_date, _endTime)!;
    if (!end.isAfter(start)) {
      _showError(context.l10n.resourcesBookingTimeInvalid);
      return;
    }

    final error = await ref.read(resourcesProvider.notifier).createBooking(
          resourceId: _resourceId!,
          title: _titleController.text.trim(),
          purpose: _purposeController.text.trim(),
          startTime: start,
          endTime: end,
        );

    if (!mounted) return;
    if (error != null) {
      _showError(error);
      return;
    }

    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.l10n.resourcesBookingSuccess),
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

  Future<void> _pickTime(bool isStart) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart
          ? (_startTime ?? TimeOfDay.now())
          : (_endTime ?? TimeOfDay.now()),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startTime = picked;
      } else {
        _endTime = picked;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isSubmitting = ref.watch(resourcesSubmittingProvider);
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
            Text(context.l10n.resourcesBookingTitle, style: AppTextStyle.h2),
            const SizedBox(height: AppTheme.md),
            DropdownButtonFormField<String>(
              initialValue: _resourceId,
              decoration: InputDecoration(
                labelText: context.l10n.resourcesSelectRoom,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                ),
              ),
              dropdownColor: AppColors.cardElevated,
              items: widget.resources
                  .map(
                    (r) => DropdownMenuItem(
                      value: r.id,
                      child: Text(r.name, style: AppTextStyle.body2),
                    ),
                  )
                  .toList(),
              onChanged: (value) => setState(() => _resourceId = value),
            ),
            const SizedBox(height: AppTheme.sm),
            TextField(
              controller: _titleController,
              decoration: InputDecoration(
                labelText: context.l10n.resourcesBookingTitleLabel,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                ),
              ),
              style: AppTextStyle.body2,
            ),
            const SizedBox(height: AppTheme.sm),
            TextField(
              controller: _purposeController,
              decoration: InputDecoration(
                labelText: context.l10n.reasonLabel,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                ),
              ),
              style: AppTextStyle.body2,
            ),
            const SizedBox(height: AppTheme.sm),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(context.l10n.expenseDateLabel, style: AppTextStyle.body2),
              subtitle: Text(
                _date != null
                    ? '${_date!.year}-${_date!.month.toString().padLeft(2, '0')}-${_date!.day.toString().padLeft(2, '0')}'
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
            Row(
              children: [
                Expanded(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(context.l10n.timeIn, style: AppTextStyle.body2),
                    subtitle: Text(
                      _startTime?.format(context) ?? '—',
                      style: AppTextStyle.caption,
                    ),
                    onTap: () => _pickTime(true),
                  ),
                ),
                Expanded(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(context.l10n.timeOut, style: AppTextStyle.body2),
                    subtitle: Text(
                      _endTime?.format(context) ?? '—',
                      style: AppTextStyle.caption,
                    ),
                    onTap: () => _pickTime(false),
                  ),
                ),
              ],
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
