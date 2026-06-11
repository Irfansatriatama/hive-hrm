import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/feature_models.dart';

part 'documents_provider.g.dart';

@riverpod
class Documents extends _$Documents {
  @override
  Future<DocumentsData> build() async => _fetchDocuments();

  Future<DocumentsData> _fetchDocuments() async {
    final responses = await Future.wait([
      ApiClient.instance.get(ApiEndpoints.documents),
      ApiClient.instance.get(ApiEndpoints.documentFolders),
    ]);

    final documents = (responses[0].data as List<dynamic>)
        .map((e) => DocumentModel.fromJson(e as Map<String, dynamic>))
        .toList();

    final folders = (responses[1].data as List<dynamic>)
        .map((e) => DocumentFolderModel.fromJson(e as Map<String, dynamic>))
        .toList();

    return DocumentsData(documents: documents, folders: folders);
  }

  Future<String?> createDocument({
    required String name,
    required String fileUrl,
    required String fileType,
    String? size,
    String? folder,
  }) async {
    try {
      await ApiClient.instance.post(
        ApiEndpoints.documents,
        data: {
          'name': name,
          'fileUrl': fileUrl,
          'fileType': fileType,
          if (size != null) 'size': size,
          if (folder != null) 'folder': folder,
        },
      );
      ref.invalidateSelf();
      await future;
      return null;
    } catch (e) {
      return e.toString();
    }
  }
}
