import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/expense_model.dart';
import '../providers/expense_provider.dart';
import '../services/receipt_upload_service.dart';

Future<void> showExpenseCreateSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(AppTheme.radiusCard),
      ),
    ),
    builder: (ctx) => const ExpenseCreateSheet(),
  );
}

class ExpenseCreateSheet extends ConsumerStatefulWidget {
  const ExpenseCreateSheet({super.key});

  @override
  ConsumerState<ExpenseCreateSheet> createState() =>
      _ExpenseCreateSheetState();
}

class _ExpenseCreateSheetState extends ConsumerState<ExpenseCreateSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _itemDescriptionController = TextEditingController();
  final _amountController = TextEditingController();
  final _notesController = TextEditingController();

  String? _categoryId;
  DateTime _expenseDate = DateTime.now();
  String? _receiptUrl;
  bool _uploadingReceipt = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _itemDescriptionController.dispose();
    _amountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _expenseDate,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
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
    if (picked != null) setState(() => _expenseDate = picked);
  }

  Future<void> _pickReceipt() async {
    final photo = await ImagePicker().pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );
    if (photo == null) return;

    setState(() => _uploadingReceipt = true);
    final url = await ReceiptUploadService.upload(photo);
    if (mounted) {
      setState(() {
        _uploadingReceipt = false;
        _receiptUrl = url;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final categories =
        ref.read(expenseProvider).valueOrNull?.categories ?? [];
    ExpenseCategoryModel? category;
    for (final c in categories) {
      if (c.id == _categoryId) {
        category = c;
        break;
      }
    }

    if (category != null &&
        category.requireReceipt &&
        (_receiptUrl == null || _receiptUrl!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.l10n.expenseReceiptRequired,
            style: AppTextStyle.body2,
          ),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    final amount = int.tryParse(_amountController.text.replaceAll('.', ''));
    if (amount == null || amount <= 0) return;

    final error = await ref.read(expenseProvider.notifier).createAndSubmit(
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim(),
          items: [
            {
              if (_categoryId != null) 'categoryId': _categoryId,
              'description': _itemDescriptionController.text.trim(),
              'amount': amount,
              'expenseDate':
                  DateFormat('yyyy-MM-dd').format(_expenseDate),
              if (_receiptUrl != null) 'receiptUrl': _receiptUrl,
              if (_notesController.text.trim().isNotEmpty)
                'notes': _notesController.text.trim(),
            },
          ],
        );

    if (!mounted) return;

    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error, style: AppTextStyle.body2),
          backgroundColor: AppColors.errorRed,
        ),
      );
    } else {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.l10n.expenseSubmitSuccess,
            style: AppTextStyle.body2,
          ),
          backgroundColor: AppColors.successGreen,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final expenseState = ref.watch(expenseProvider);
    final isSubmitting = ref.watch(expenseSubmittingProvider);
    final categories = expenseState.valueOrNull?.categories ?? [];
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
              Text(context.l10n.expenseCreateTitle, style: AppTextStyle.h2),
              const SizedBox(height: AppTheme.md),
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(labelText: context.l10n.expenseTitleLabel),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? context.l10n.expenseTitleRequired : null,
              ),
              const SizedBox(height: AppTheme.sm),
              TextFormField(
                controller: _descriptionController,
                maxLines: 2,
                decoration: InputDecoration(
                  labelText: context.l10n.expenseDescriptionLabel,
                ),
              ),
              const SizedBox(height: AppTheme.md),
              Text(context.l10n.expenseItemSection, style: AppTextStyle.h3),
              const SizedBox(height: AppTheme.sm),
              DropdownButtonFormField<String>(
                value: _categoryId,
                decoration: InputDecoration(
                  labelText: context.l10n.expenseCategoryLabel,
                ),
                items: categories
                    .map(
                      (c) => DropdownMenuItem(
                        value: c.id,
                        child: Text(c.name),
                      ),
                    )
                    .toList(),
                onChanged: (v) => setState(() => _categoryId = v),
              ),
              const SizedBox(height: AppTheme.sm),
              TextFormField(
                controller: _itemDescriptionController,
                decoration: InputDecoration(
                  labelText: context.l10n.expenseItemDescriptionLabel,
                ),
                validator: (v) => v == null || v.trim().isEmpty
                    ? context.l10n.expenseItemDescriptionRequired
                    : null,
              ),
              const SizedBox(height: AppTheme.sm),
              TextFormField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: context.l10n.expenseAmountLabel,
                ),
                validator: (v) {
                  final amount = int.tryParse(v?.replaceAll('.', '') ?? '');
                  if (amount == null || amount <= 0) {
                    return context.l10n.expenseAmountRequired;
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppTheme.sm),
              InkWell(
                onTap: _pickDate,
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: context.l10n.expenseDateLabel,
                  ),
                  child: Text(
                    DateFormat('d MMM yyyy', 'id_ID').format(_expenseDate),
                    style: AppTextStyle.body2,
                  ),
                ),
              ),
              const SizedBox(height: AppTheme.sm),
              OutlinedButton.icon(
                onPressed: _uploadingReceipt ? null : _pickReceipt,
                icon: _uploadingReceipt
                    ? const SizedBox(
                        width: AppTheme.md,
                        height: AppTheme.md,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.receipt_long_rounded),
                label: Text(
                  _receiptUrl != null
                      ? context.l10n.expenseReceiptAttached
                      : context.l10n.expenseAttachReceipt,
                ),
              ),
              const SizedBox(height: AppTheme.sm),
              TextFormField(
                controller: _notesController,
                decoration: InputDecoration(labelText: context.l10n.expenseNotesLabel),
              ),
              const SizedBox(height: AppTheme.lg),
              ElevatedButton(
                onPressed: isSubmitting ? null : _submit,
                child: isSubmitting
                    ? const SizedBox(
                        width: AppTheme.md,
                        height: AppTheme.md,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(context.l10n.expenseSubmit),
              ),
              const SizedBox(height: AppTheme.md),
            ],
          ),
        ),
      ),
    );
  }
}
