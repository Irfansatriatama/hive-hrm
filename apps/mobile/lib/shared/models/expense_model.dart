class ExpenseCategoryModel {
  final String id;
  final String name;
  final String code;
  final int? maxAmount;
  final bool requireReceipt;
  final bool isActive;

  const ExpenseCategoryModel({
    required this.id,
    required this.name,
    required this.code,
    this.maxAmount,
    required this.requireReceipt,
    required this.isActive,
  });

  factory ExpenseCategoryModel.fromJson(Map<String, dynamic> json) {
    return ExpenseCategoryModel(
      id: json['id'] as String,
      name: json['name'] as String,
      code: json['code'] as String,
      maxAmount: (json['maxAmount'] as num?)?.toInt(),
      requireReceipt: json['requireReceipt'] as bool? ?? true,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}

class ExpenseClaimItemModel {
  final String id;
  final String? categoryId;
  final String description;
  final int amount;
  final DateTime expenseDate;
  final String? receiptUrl;
  final String? notes;
  final ExpenseCategoryModel? category;

  const ExpenseClaimItemModel({
    required this.id,
    this.categoryId,
    required this.description,
    required this.amount,
    required this.expenseDate,
    this.receiptUrl,
    this.notes,
    this.category,
  });

  factory ExpenseClaimItemModel.fromJson(Map<String, dynamic> json) {
    return ExpenseClaimItemModel(
      id: json['id'] as String,
      categoryId: json['categoryId'] as String?,
      description: json['description'] as String,
      amount: (json['amount'] as num).toInt(),
      expenseDate: DateTime.parse(json['expenseDate'] as String),
      receiptUrl: json['receiptUrl'] as String?,
      notes: json['notes'] as String?,
      category: json['category'] is Map<String, dynamic>
          ? ExpenseCategoryModel.fromJson(
              json['category'] as Map<String, dynamic>,
            )
          : null,
    );
  }
}

class ExpenseClaimModel {
  final String id;
  final String claimNumber;
  final String title;
  final String? description;
  final int totalAmount;
  final String currency;
  final String status;
  final DateTime? submittedAt;
  final String? rejectedReason;
  final DateTime createdAt;
  final List<ExpenseClaimItemModel> items;

  const ExpenseClaimModel({
    required this.id,
    required this.claimNumber,
    required this.title,
    this.description,
    required this.totalAmount,
    required this.currency,
    required this.status,
    this.submittedAt,
    this.rejectedReason,
    required this.createdAt,
    required this.items,
  });

  factory ExpenseClaimModel.fromJson(Map<String, dynamic> json) {
    return ExpenseClaimModel(
      id: json['id'] as String,
      claimNumber: json['claimNumber'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      totalAmount: (json['totalAmount'] as num).toInt(),
      currency: json['currency'] as String? ?? 'IDR',
      status: json['status'] as String,
      submittedAt: json['submittedAt'] != null
          ? DateTime.parse(json['submittedAt'] as String)
          : null,
      rejectedReason: json['rejectedReason'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) =>
              ExpenseClaimItemModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  bool get isDraft => status == 'draft';
  bool get isPending => status == 'submitted';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  bool get isPaid => status == 'paid';
}

class ExpenseData {
  final List<ExpenseClaimModel> claims;
  final List<ExpenseCategoryModel> categories;

  const ExpenseData({
    required this.claims,
    required this.categories,
  });
}
