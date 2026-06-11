import 'package:json_annotation/json_annotation.dart';

part 'announcement_model.g.dart';

@JsonSerializable()
class AnnouncementModel {
  final String id;
  final String title;
  final String content;
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  @JsonKey(name: 'isRead', defaultValue: false)
  final bool isRead;

  const AnnouncementModel({
    required this.id,
    required this.title,
    required this.content,
    required this.createdAt,
    this.isRead = false,
  });

  factory AnnouncementModel.fromJson(Map<String, dynamic> json) =>
      _$AnnouncementModelFromJson(json);

  Map<String, dynamic> toJson() => _$AnnouncementModelToJson(this);
}
