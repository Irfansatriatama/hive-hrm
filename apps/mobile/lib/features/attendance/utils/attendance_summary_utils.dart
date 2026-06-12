import '../../../shared/models/attendance_model.dart';

AttendanceSummaryModel computeAttendanceSummary({
  required List<AttendanceModel> records,
  required int year,
  int? month,
}) {
  var present = 0;
  var late = 0;
  var absent = 0;
  var totalWorkHours = 0.0;
  var totalOvertimeMinutes = 0;
  var totalLateMinutes = 0;
  var workDayCount = 0;

  for (final row in records) {
    final status = (row.status ?? '').toLowerCase();

    if (status.contains('absent') || status.contains('alpha')) {
      absent += 1;
    } else if ((row.lateMinutes ?? 0) > 0) {
      late += 1;
      present += 1;
    } else if (row.checkIn != null) {
      present += 1;
    }

    if (row.workHours != null && row.workHours! > 0) {
      totalWorkHours += row.workHours!;
      workDayCount += 1;
    }
    totalOvertimeMinutes += row.overtimeMinutes ?? 0;
    totalLateMinutes += row.lateMinutes ?? 0;
  }

  final periodLabel = month != null ? '$month/$year' : '$year';

  return AttendanceSummaryModel(
    period: periodLabel,
    month: month,
    year: year,
    totalRecords: records.length,
    present: present,
    late: late,
    absent: absent,
    totalWorkHours: (totalWorkHours * 10).round() / 10,
    avgWorkHours: workDayCount > 0
        ? ((totalWorkHours / workDayCount) * 10).round() / 10
        : 0,
    totalOvertimeMinutes: totalOvertimeMinutes,
    totalOvertimeHours: ((totalOvertimeMinutes / 60) * 10).round() / 10,
    totalLateMinutes: totalLateMinutes,
  );
}
