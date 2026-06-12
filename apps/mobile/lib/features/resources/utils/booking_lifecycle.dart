import '../../../shared/models/feature_models.dart';

enum ResourceBookingPhase {
  pendingApproval,
  rejected,
  cancelled,
  waiting,
  awaitingConfirmation,
  inProgress,
  readyToComplete,
  completed,
  expired,
}

ResourceBookingPhase resolveResourceBookingPhase(ResourceBookingModel booking) {
  final now = DateTime.now();

  switch (booking.status) {
    case 'pending':
      return ResourceBookingPhase.pendingApproval;
    case 'rejected':
      return ResourceBookingPhase.rejected;
    case 'cancelled':
      return ResourceBookingPhase.cancelled;
    case 'completed':
      return ResourceBookingPhase.completed;
    case 'expired':
      return ResourceBookingPhase.expired;
    case 'in_progress':
      if (now.isBefore(booking.endTime)) {
        return ResourceBookingPhase.inProgress;
      }
      return ResourceBookingPhase.readyToComplete;
    case 'approved':
      if (now.isBefore(booking.startTime)) {
        return ResourceBookingPhase.waiting;
      }
      if (now.isBefore(booking.endTime)) {
        return ResourceBookingPhase.awaitingConfirmation;
      }
      return ResourceBookingPhase.expired;
    default:
      return ResourceBookingPhase.waiting;
  }
}

bool resourceBookingBlocksSlot(ResourceBookingModel booking) {
  return booking.status == 'pending' ||
      booking.status == 'approved' ||
      booking.status == 'in_progress';
}
