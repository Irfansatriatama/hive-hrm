import 'package:flutter/material.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/auth/user_role_provider.dart';
import '../../../shared/models/approval_model.dart';
import '../../../shared/models/feature_models.dart';
import '../../../shared/models/leave_model.dart';
import '../../../shared/utils/datetime_formatter.dart';
import '../../profile/providers/profile_provider.dart';
import '../models/home_feed_item.dart';

part 'home_feed_provider.g.dart';

@riverpod
Future<List<HomeFeedItem>> homeFeed(HomeFeedRef ref) async {
  final profile = await ref.watch(profileProvider.future);
  final canApprove = ref.watch(canApproveProvider);
  final viewAllVisitors = ref.watch(canViewAllVisitorsProvider);
  final canApproveBooking = ref.watch(canApproveResourcesProvider);

  final futures = <Future<dynamic>>[
    ApiClient.instance.get(ApiEndpoints.resourceBookings),
    ApiClient.instance.get(ApiEndpoints.visitors),
    ApiClient.instance.get(ApiEndpoints.leaveMyRequests),
  ];
  if (canApprove) {
    futures.add(ApiClient.instance.get(ApiEndpoints.approvalInbox));
  }

  final responses = await Future.wait(futures);

  final bookings = (responses[0].data as List<dynamic>)
      .map((e) => ResourceBookingModel.fromJson(e as Map<String, dynamic>))
      .toList();

  final visitors = (responses[1].data as List<dynamic>)
      .map((e) => VisitorModel.fromJson(e as Map<String, dynamic>))
      .toList();

  final leaveRequests = (responses[2].data as List<dynamic>)
      .map((e) => LeaveRequestModel.fromJson(e as Map<String, dynamic>))
      .toList();

  final approvals = canApprove && responses.length > 3
      ? (responses[3].data as List<dynamic>)
          .map((e) => ApprovalInboxModel.fromJson(e as Map<String, dynamic>))
          .toList()
      : <ApprovalInboxModel>[];

  final items = <HomeFeedItem>[];

  final myTodayBookings = bookings
      .where(
        (b) =>
            b.employeeId == profile.id &&
            b.isTodayOrUpcoming() &&
            (b.status == 'approved' || b.status == 'pending'),
      )
      .toList()
    ..sort((a, b) => a.startTime.compareTo(b.startTime));

  for (final booking in myTodayBookings.take(2)) {
    items.add(
      HomeFeedItem(
        type: HomeFeedType.booking,
        messageKey: HomeFeedMessageKey.bookingToday,
        params: {
          'time': DateTimeFormatter.formatTime(booking.startTime),
          'title': booking.title,
          'room': booking.resource?.name ?? '',
        },
        route: '/resources',
        icon: Icons.meeting_room_rounded,
      ),
    );
  }

  final activeVisitors = visitors.where((v) => v.isActive && v.isToday());
  final relevantVisitors = viewAllVisitors
      ? activeVisitors
      : activeVisitors.where((v) => v.hostEmployeeId == profile.id);

  final visitorList = relevantVisitors.toList();
  if (visitorList.isNotEmpty) {
    if (viewAllVisitors && visitorList.length > 1) {
      items.add(
        HomeFeedItem(
          type: HomeFeedType.visitor,
          messageKey: HomeFeedMessageKey.visitorsActive,
          params: {'count': '${visitorList.length}'},
          route: '/visitor',
          icon: Icons.person_pin_rounded,
        ),
      );
    } else {
      final visitor = visitorList.first;
      items.add(
        HomeFeedItem(
          type: HomeFeedType.visitor,
          messageKey: HomeFeedMessageKey.visitorSingle,
          params: {
            'name': visitor.visitorName,
            'purpose': visitor.purpose,
          },
          route: '/visitor',
          icon: Icons.person_pin_rounded,
        ),
      );
    }
  }

  for (final approval in approvals.take(2)) {
    items.add(
      HomeFeedItem(
        type: HomeFeedType.approval,
        messageKey: HomeFeedMessageKey.approvalPending,
        params: {
          'requester': approval.requesterName,
          'summary': approval.summary,
        },
        route: '/approval',
        icon: Icons.task_alt_rounded,
      ),
    );
  }

  for (final leave in leaveRequests.where((r) => r.isPending).take(1)) {
    items.add(
      HomeFeedItem(
        type: HomeFeedType.leave,
        messageKey: HomeFeedMessageKey.leavePending,
        params: {
          'detail': leave.leaveType?.name ?? leave.reason ?? '',
        },
        route: '/leave',
        icon: Icons.beach_access_rounded,
      ),
    );
  }

  if (canApproveBooking) {
    for (final booking in bookings.where((b) => b.status == 'pending').take(2)) {
      if (booking.employeeId == profile.id) continue;
      items.add(
        HomeFeedItem(
          type: HomeFeedType.booking,
          messageKey: HomeFeedMessageKey.bookingApprove,
          params: {
            'title': booking.title,
            'employee': booking.employeeName ?? '',
          },
          route: '/resources',
          icon: Icons.pending_actions_rounded,
        ),
      );
    }
  }

  return items.take(6).toList();
}
