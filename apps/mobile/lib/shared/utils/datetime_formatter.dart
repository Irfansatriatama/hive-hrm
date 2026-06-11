import 'package:intl/intl.dart';

class DateTimeFormatter {
  DateTimeFormatter._();

  static String formatTime(DateTime? time) {
    if (time == null) return '—';
    return DateFormat('HH:mm').format(time.toLocal());
  }

  static String formatDate(
    DateTime date, {
    String pattern = 'EEE, d MMM yyyy',
    String? locale,
  }) {
    return DateFormat(pattern, locale).format(date.toLocal());
  }
}
