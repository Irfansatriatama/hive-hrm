import 'package:flutter/material.dart';
import '../../../shared/widgets/hive_fab.dart';
import '../../../shared/widgets/hive_app_bar.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/feature_models.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../providers/documents_provider.dart';
import 'document_upload_sheet.dart';

class DocumentsScreen extends ConsumerStatefulWidget {
  const DocumentsScreen({super.key});

  @override
  ConsumerState<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends ConsumerState<DocumentsScreen> {
  String? _selectedFolder;

  Future<void> _openDocument(String? url) async {
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(documentsProvider);

    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      appBar: HiveAppBar(
        title: Text(context.l10n.documentsTitle, style: AppTextStyle.h1),
      ),
      floatingActionButton: HiveFab.wrap(
        context,
        HiveFab(
          icon: Icons.upload_file_rounded,
          tooltip: context.l10n.documentUploadTitle,
          onPressed: state.valueOrNull == null
              ? null
              : () => showDocumentUploadSheet(
                    context,
                    folders: state.value!.folders,
                  ),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.amberAccent,
        backgroundColor: AppColors.surfaceBlue,
        onRefresh: () => ref.refresh(documentsProvider.future),
        child: switch (state) {
          AsyncLoading() => const SingleChildScrollView(
              physics: AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: EdgeInsets.all(AppTheme.md),
                child: SkeletonBox(height: 320),
              ),
            ),
          AsyncError(:final error) => SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: SizedBox(
                height: MediaQuery.sizeOf(context).height * 0.7,
                child: ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(documentsProvider),
                ),
              ),
            ),
          AsyncData(:final value) => _DocumentsList(
              data: value,
              selectedFolder: _selectedFolder,
              onFolderChanged: (folder) =>
                  setState(() => _selectedFolder = folder),
              onOpen: _openDocument,
            ),
          _ => const SizedBox.shrink(),
        },
      ),
    );
  }
}

class _DocumentsList extends StatelessWidget {
  final DocumentsData data;
  final String? selectedFolder;
  final ValueChanged<String?> onFolderChanged;
  final Future<void> Function(String? url) onOpen;

  const _DocumentsList({
    required this.data,
    required this.selectedFolder,
    required this.onFolderChanged,
    required this.onOpen,
  });

  IconData _fileIcon(String type) {
    return switch (type.toUpperCase()) {
      'PDF' => Icons.picture_as_pdf_rounded,
      'DOC' || 'DOCX' => Icons.description_rounded,
      'XLS' || 'XLSX' => Icons.table_chart_rounded,
      'IMG' || 'PNG' || 'JPG' => Icons.image_rounded,
      _ => Icons.insert_drive_file_rounded,
    };
  }

  @override
  Widget build(BuildContext context) {
    final filtered = selectedFolder == null
        ? data.documents
        : data.documents.where((d) => d.category == selectedFolder).toList();

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppTheme.md),
      children: [
        if (data.folders.isNotEmpty) ...[
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: AppTheme.sm),
                  child: FilterChip(
                    label: Text(context.l10n.leaveCalendarAllDepts),
                    selected: selectedFolder == null,
                    onSelected: (_) => onFolderChanged(null),
                  ),
                ),
                ...data.folders.map(
                  (folder) => Padding(
                    padding: const EdgeInsets.only(right: AppTheme.sm),
                    child: FilterChip(
                      label: Text(folder.name),
                      selected: selectedFolder == folder.name,
                      onSelected: (_) => onFolderChanged(folder.name),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.md),
        ],
        if (filtered.isEmpty)
          SizedBox(
            height: MediaQuery.sizeOf(context).height * 0.4,
            child: EmptyView(
              icon: Icons.folder_open_rounded,
              title: context.l10n.emptyDocuments,
            ),
          )
        else
          ...filtered.map(
            (doc) => Padding(
              padding: const EdgeInsets.only(bottom: AppTheme.sm),
              child: HiveCard(
                onTap: () => onOpen(doc.fileUrl),
                child: Row(
                  children: [
                    Icon(_fileIcon(doc.fileType), color: AppColors.amberAccent),
                    const SizedBox(width: AppTheme.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(doc.name, style: AppTextStyle.body1),
                          Text(
                            '${doc.fileType} · ${doc.size ?? '—'} · ${doc.category}',
                            style: AppTextStyle.caption,
                          ),
                        ],
                      ),
                    ),
                    if (doc.fileUrl != null)
                      Icon(
                        Icons.open_in_new_rounded,
                        color: AppColors.textSubtle,
                        size: 18,
                      ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
