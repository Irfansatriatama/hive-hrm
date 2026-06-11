import 'package:flutter/material.dart';

enum HomeFeedType { booking, visitor, approval, leave }

enum HomeFeedMessageKey {
  bookingToday,
  visitorsActive,
  visitorSingle,
  approvalPending,
  leavePending,
  bookingApprove,
}

class HomeFeedItem {
  final HomeFeedType type;
  final HomeFeedMessageKey messageKey;
  final Map<String, String> params;
  final String route;
  final IconData icon;

  const HomeFeedItem({
    required this.type,
    required this.messageKey,
    this.params = const {},
    required this.route,
    required this.icon,
  });
}
