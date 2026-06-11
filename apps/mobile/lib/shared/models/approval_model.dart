class ApprovalInboxModel {
  final String id;
  final String type;
  final String summary;
  final String requesterName;
  final DateTime dateSubmitted;
  final String status;
  final String? reason;
  final Map<String, dynamic>? details;

  const ApprovalInboxModel({
    required this.id,
    required this.type,
    required this.summary,
    required this.requesterName,
    required this.dateSubmitted,
    required this.status,
    this.reason,
    this.details,
  });

  factory ApprovalInboxModel.fromJson(Map<String, dynamic> json) {
    return ApprovalInboxModel(
      id: json['id'] as String,
      type: json['type'] as String,
      summary: json['summary'] as String,
      requesterName: json['requester_name'] as String,
      dateSubmitted: DateTime.parse(json['date_submitted'] as String),
      status: json['status'] as String? ?? 'pending',
      reason: json['reason'] as String?,
      details: json['details'] as Map<String, dynamic>?,
    );
  }

  bool get isLeave => type == 'leave';

  bool get isProfileUpdate => type == 'profile_update';
}
