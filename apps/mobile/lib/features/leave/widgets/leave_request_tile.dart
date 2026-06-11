import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/l10n/l10n.dart';
import '../../../core/theme/app_text_style.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/leave_model.dart';
import '../../../shared/widgets/hive_card.dart';
import '../../../shared/widgets/status_badge.dart';

class LeaveRequestTile extends StatelessWidget {
  final LeaveRequestModel request;

  const LeaveRequestTile({super.key, required this.request});

  StatusType _statusType(String? status) {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return StatusType.approved;
      case 'REJECTED':
        return StatusType.rejected;
      default:
        return StatusType.pending;
    }
  }

  String? _statusLabel(BuildContext context, String? status) {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return context.l10n.approved;
      case 'REJECTED':
        return context.l10n.rejected;
      case 'PENDING':
        return context.l10n.pending;
      default:
        return null;
    }
  }

  String _dateRange() {
    final start = request.startDate;
    final end = request.endDate;
    if (start == null || end == null) return '-';
    final fmt = DateFormat('d MMM yyyy', 'id_ID');
    if (_isSameDay(start, end)) return fmt.format(start);
    return '${fmt.format(start)} – ${fmt.format(end)}';
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  @override
  Widget build(BuildContext context) {
    final typeName = request.leaveType?.name ?? '-';
    final totalDays = request.totalDays ?? 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.sm),
      child: HiveCard(
        accentLeft: request.isPending,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(typeName, style: AppTextStyle.body1.copyWith(
                    fontWeight: FontWeight.w600,
                  )),
                ),
                StatusBadge(
                  status: _statusType(request.status),
                  label: _statusLabel(context, request.status),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.xs),
            Text(_dateRange(), style: AppTextStyle.body2),
            const SizedBox(height: AppTheme.xs),
            Text(
              context.l10n.leaveDaysCount(totalDays),
              style: AppTextStyle.caption,
            ),
            if (request.reason != null && request.reason!.isNotEmpty) ...[
              const SizedBox(height: AppTheme.xs),
              Text(
                request.reason!,
                style: AppTextStyle.caption,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
