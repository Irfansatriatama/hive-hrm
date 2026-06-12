import '../../../shared/models/attendance_model.dart';

class AttendanceData {
  final AttendanceModel? today;
  final List<AttendanceModel> history;
  final AttendanceSummaryModel? summary;

  const AttendanceData({
    required this.today,
    required this.history,
    this.summary,
  });

  List<WeekDayStatus> get weekDays {
    final now = DateTime.now();
    final monday = DateTime(now.year, now.month, now.day)
        .subtract(Duration(days: now.weekday - DateTime.monday));

    return List.generate(5, (index) {
      final day = monday.add(Duration(days: index));
      final record = _findRecordForDay(day);
      final isToday = _isSameDay(day, now);
      final isFuture = day.isAfter(DateTime(now.year, now.month, now.day));

      return WeekDayStatus(
        date: day,
        isPresent: record?.checkIn != null,
        isToday: isToday,
        isFuture: isFuture,
      );
    });
  }

  AttendanceModel? _findRecordForDay(DateTime day) {
    for (final record in history) {
      final recordDate = record.date ?? record.checkIn;
      if (recordDate != null && _isSameDay(recordDate, day)) {
        return record;
      }
    }
    if (today != null) {
      final todayDate = today!.date ?? today!.checkIn;
      if (todayDate != null && _isSameDay(todayDate, day)) {
        return today;
      }
    }
    return null;
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}

class WeekDayStatus {
  final DateTime date;
  final bool isPresent;
  final bool isToday;
  final bool isFuture;

  const WeekDayStatus({
    required this.date,
    required this.isPresent,
    required this.isToday,
    required this.isFuture,
  });
}
