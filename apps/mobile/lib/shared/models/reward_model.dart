class RewardCatalogModel {
  final String id;
  final String name;
  final String? description;
  final int points;
  final int stock;
  final String category;
  final String status;

  const RewardCatalogModel({
    required this.id,
    required this.name,
    this.description,
    required this.points,
    required this.stock,
    required this.category,
    required this.status,
  });

  factory RewardCatalogModel.fromJson(Map<String, dynamic> json) {
    return RewardCatalogModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      points: (json['points'] as num).toInt(),
      stock: (json['stock'] as num).toInt(),
      category: json['category'] as String? ?? '',
      status: json['status'] as String? ?? 'active',
    );
  }

  bool get isActive => status == 'active';
}

class RewardHashtagModel {
  final String id;
  final String tag;
  final String? description;
  final String status;

  const RewardHashtagModel({
    required this.id,
    required this.tag,
    this.description,
    required this.status,
  });

  factory RewardHashtagModel.fromJson(Map<String, dynamic> json) {
    return RewardHashtagModel(
      id: json['id'] as String,
      tag: json['tag'] as String,
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'active',
    );
  }

  bool get isActive => status == 'active';
}

class RewardTransactionModel {
  final String id;
  final String type;
  final int points;
  final String? hashtag;
  final String? message;
  final String senderReceiverName;
  final DateTime date;

  const RewardTransactionModel({
    required this.id,
    required this.type,
    required this.points,
    this.hashtag,
    this.message,
    required this.senderReceiverName,
    required this.date,
  });

  factory RewardTransactionModel.fromJson(Map<String, dynamic> json) {
    final dateRaw = json['date'] ?? json['createdAt'];
    return RewardTransactionModel(
      id: json['id'] as String,
      type: json['type'] as String,
      points: (json['points'] as num).toInt(),
      hashtag: json['hashtag'] as String?,
      message: json['message'] as String?,
      senderReceiverName: json['senderReceiverName'] as String? ?? '',
      date: DateTime.parse(dateRaw as String),
    );
  }

  bool get isReceived => type == 'received';
  bool get isRedeemed => type == 'redeemed';
}

class RewardColleagueModel {
  final String id;
  final String name;

  const RewardColleagueModel({required this.id, required this.name});

  factory RewardColleagueModel.fromJson(Map<String, dynamic> json) {
    return RewardColleagueModel(
      id: json['id'] as String,
      name: json['full_name'] as String? ?? json['fullName'] as String? ?? '',
    );
  }
}

class RewardData {
  final int balance;
  final List<RewardCatalogModel> catalog;
  final List<RewardHashtagModel> hashtags;
  final List<RewardTransactionModel> feed;
  final List<RewardTransactionModel> transactions;
  final List<RewardColleagueModel> colleagues;

  const RewardData({
    required this.balance,
    required this.catalog,
    required this.hashtags,
    required this.feed,
    required this.transactions,
    required this.colleagues,
  });
}
