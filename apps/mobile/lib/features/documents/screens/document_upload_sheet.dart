import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/feature_models.dart';
import '../providers/documents_provider.dart';
import '../services/document_upload_service.dart';

Future<void> showDocumentUploadSheet(
  BuildContext context, {
  required List<DocumentFolderModel> folders,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surfaceBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(AppTheme.radiusCard),
      ),
    ),
    builder: (ctx) => DocumentUploadSheet(folders: folders),
  );
}

class DocumentUploadSheet extends ConsumerStatefulWidget {
  final List<DocumentFolderModel> folders;

  const DocumentUploadSheet({super.key, required this.folders});

  @override
  ConsumerState<DocumentUploadSheet> createState() =>
      _DocumentUploadSheetState();
}

class _DocumentUploadSheetState extends ConsumerState<DocumentUploadSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();

  PlatformFile? _selectedFile;
  String? _selectedFolder;
  bool _uploading = false;
  bool _submitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'webp'],
    );
    if (result == null || result.files.isEmpty) return;

    final file = result.files.first;
    if (file.path == null) return;

    setState(() {
      _selectedFile = file;
      if (_nameController.text.isEmpty) {
        _nameController.text = file.name;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.documentUploadSelectFile)),
      );
      return;
    }

    setState(() => _uploading = true);
    final url = await DocumentUploadService.upload(_selectedFile!);
    if (!mounted) return;

    if (url == null) {
      setState(() => _uploading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.documentUploadFailed),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    setState(() {
      _uploading = false;
      _submitting = true;
    });

    final error = await ref.read(documentsProvider.notifier).createDocument(
          name: _nameController.text.trim(),
          fileUrl: url,
          fileType: DocumentUploadService.inferFileType(_selectedFile!.name),
          size: DocumentUploadService.formatFileSize(_selectedFile!.size),
          folder: _selectedFolder,
        );

    if (!mounted) return;
    setState(() => _submitting = false);

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
        content: Text(context.l10n.documentUploadSuccess),
        backgroundColor: AppColors.successGreen,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final isBusy = _uploading || _submitting;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppTheme.md,
        AppTheme.md,
        AppTheme.md,
        AppTheme.md + bottomInset,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(context.l10n.documentUploadTitle, style: AppTextStyle.h2),
            const SizedBox(height: AppTheme.md),
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: context.l10n.documentUploadNameLabel,
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return context.l10n.documentUploadIncomplete;
                }
                return null;
              },
            ),
            const SizedBox(height: AppTheme.sm),
            if (widget.folders.isNotEmpty)
              DropdownButtonFormField<String>(
                value: _selectedFolder,
                decoration: InputDecoration(
                  labelText: context.l10n.documentUploadFolderLabel,
                ),
                items: widget.folders
                    .map(
                      (folder) => DropdownMenuItem(
                        value: folder.name,
                        child: Text(folder.name),
                      ),
                    )
                    .toList(),
                onChanged: isBusy ? null : (value) => setState(() => _selectedFolder = value),
              ),
            const SizedBox(height: AppTheme.sm),
            OutlinedButton.icon(
              onPressed: isBusy ? null : _pickFile,
              icon: const Icon(Icons.attach_file_rounded),
              label: Text(
                _selectedFile?.name ?? context.l10n.documentUploadSelectFile,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(height: AppTheme.md),
            ElevatedButton(
              onPressed: isBusy ? null : _submit,
              child: isBusy
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(context.l10n.submit),
            ),
          ],
        ),
      ),
    );
  }
}
