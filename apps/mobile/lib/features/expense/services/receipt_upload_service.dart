import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

class ReceiptUploadService {
  ReceiptUploadService._();

  static Future<String?> upload(XFile photo) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          photo.path,
          filename: photo.name,
        ),
      });

      final response = await ApiClient.instance.post(
        ApiEndpoints.expenseReceiptUpload,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      final url = response.data['url'];
      return url is String ? url : null;
    } catch (_) {
      return null;
    }
  }
}
