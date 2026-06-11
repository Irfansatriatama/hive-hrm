import '../../../shared/models/leave_model.dart';

class LeaveData {
  final List<LeaveBalanceModel> balances;
  final List<LeaveRequestModel> activeRequests;
  final List<LeaveRequestModel> history;

  const LeaveData({
    required this.balances,
    required this.activeRequests,
    required this.history,
  });
}
