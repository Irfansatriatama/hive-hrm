import '../../../core/l10n/app_localizations.dart';
import '../models/home_feed_item.dart';

String formatHomeFeedMessage(AppLocalizations l10n, HomeFeedItem item) {
  switch (item.messageKey) {
    case HomeFeedMessageKey.bookingToday:
      return l10n.homeFeedBooking(
        item.params['time'] ?? '',
        item.params['title'] ?? '',
        item.params['room'] ?? '',
      );
    case HomeFeedMessageKey.visitorsActive:
      return l10n.homeFeedVisitorsActive(
        int.tryParse(item.params['count'] ?? '0') ?? 0,
      );
    case HomeFeedMessageKey.visitorSingle:
      return l10n.homeFeedVisitorSingle(
        item.params['name'] ?? '',
        item.params['purpose'] ?? '',
      );
    case HomeFeedMessageKey.approvalPending:
      return l10n.homeFeedApproval(
        item.params['requester'] ?? '',
        item.params['summary'] ?? '',
      );
    case HomeFeedMessageKey.leavePending:
      return l10n.homeFeedLeavePending(item.params['detail'] ?? '');
    case HomeFeedMessageKey.bookingApprove:
      return l10n.homeFeedBookingApprove(
        item.params['title'] ?? '',
        item.params['employee'] ?? '',
      );
  }
}
