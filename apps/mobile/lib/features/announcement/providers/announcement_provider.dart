import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/announcement_model.dart';

part 'announcement_provider.g.dart';

@riverpod
class Announcement extends _$Announcement {
  @override
  Future<List<AnnouncementModel>> build() async {
    final response = await ApiClient.instance.get(ApiEndpoints.announcementFeed);
    final announcements = (response.data as List<dynamic>)
        .map((e) => AnnouncementModel.fromJson(e as Map<String, dynamic>))
        .toList();
    announcements.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return announcements;
  }
}
