import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

class DocumentUploadService {
  DocumentUploadService._();

  static Future<String?> upload(PlatformFile file) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path!,
          filename: file.name,
        ),
      });

      final response = await ApiClient.instance.post(
        ApiEndpoints.documentUpload,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      final url = response.data['url'];
      return url is String ? url : null;
    } catch (_) {
      return null;
    }
  }

  static String inferFileType(String filename) {
    final ext = filename.split('.').last.toUpperCase();
    return switch (ext) {
      'PDF' => 'PDF',
      'DOC' => 'DOC',
      'DOCX' => 'DOCX',
      'XLS' => 'XLS',
      'XLSX' => 'XLSX',
      'JPG' || 'JPEG' => 'JPG',
      'PNG' => 'PNG',
      'WEBP' => 'IMG',
      _ => ext.isNotEmpty ? ext : 'PDF',
    };
  }

  static String formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    }
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
