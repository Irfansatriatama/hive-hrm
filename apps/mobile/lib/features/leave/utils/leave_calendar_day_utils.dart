import 'package:flutter/material.dart';
import '../../../shared/models/feature_models.dart';

enum LeaveDayCategory {
  today,
  nationalOrSunday,
  collective,
  company,
  ownLeave,
  otherLeave,
}

class LeaveCalendarColors {
  static const today = Color(0xFF22C55E);
  static const national = Color(0xFFEF4444);
  static const collective = Color(0xFF7C3AED);
  static const company = Color(0xFF0891B2);
  static const ownLeave = Color(0xFFF59E0B);
  static const otherLeave = Color(0xFF3B82F6);
}

class LeaveDayInfo {
  final String dateStr;
  final bool isToday;
  final bool isSunday;
  final LeaveCalendarHolidayModel? holiday;
  final List<LeaveCalendarEventModel> leaves;
  final List<LeaveDayCategory> categories;

  const LeaveDayInfo({
    required this.dateStr,
    required this.isToday,
    required this.isSunday,
    this.holiday,
    required this.leaves,
    required this.categories,
  });

  bool get isInteractive => categories.isNotEmpty;

  LeaveDayCategory? get primaryCategory {
    for (final cat in const [
      LeaveDayCategory.nationalOrSunday,
      LeaveDayCategory.collective,
      LeaveDayCategory.company,
      LeaveDayCategory.ownLeave,
      LeaveDayCategory.otherLeave,
      LeaveDayCategory.today,
    ]) {
      if (categories.contains(cat)) return cat;
    }
    return null;
  }

  Color categoryColor(LeaveDayCategory cat) => switch (cat) {
        LeaveDayCategory.today => LeaveCalendarColors.today,
        LeaveDayCategory.nationalOrSunday => LeaveCalendarColors.national,
        LeaveDayCategory.collective => LeaveCalendarColors.collective,
        LeaveDayCategory.company => LeaveCalendarColors.company,
        LeaveDayCategory.ownLeave => LeaveCalendarColors.ownLeave,
        LeaveDayCategory.otherLeave => LeaveCalendarColors.otherLeave,
      };

  Color? get backgroundColor {
    final primary = primaryCategory;
    if (primary == null) return null;
    return categoryColor(primary).withValues(alpha: 0.2);
  }
}

LeaveDayInfo buildLeaveDayInfo({
  required String dateStr,
  required DateTime date,
  required String todayStr,
  required LeaveCalendarHolidayModel? holiday,
  required List<LeaveCalendarEventModel> leaves,
}) {
  final isToday = dateStr == todayStr;
  final isSunday = date.weekday == DateTime.sunday;
  final hasOwnLeave = leaves.any((l) => l.isOwn);
  final hasOtherLeave = leaves.any((l) => !l.isOwn);

  final categories = <LeaveDayCategory>[];
  if (isToday) categories.add(LeaveDayCategory.today);
  if (holiday?.type == 'national') {
    categories.add(LeaveDayCategory.nationalOrSunday);
  } else if (isSunday) {
    categories.add(LeaveDayCategory.nationalOrSunday);
  }
  if (holiday?.type == 'collective') {
    categories.add(LeaveDayCategory.collective);
  }
  if (holiday?.type == 'company') {
    categories.add(LeaveDayCategory.company);
  }
  if (hasOwnLeave) categories.add(LeaveDayCategory.ownLeave);
  if (hasOtherLeave) categories.add(LeaveDayCategory.otherLeave);

  return LeaveDayInfo(
    dateStr: dateStr,
    isToday: isToday,
    isSunday: isSunday,
    holiday: holiday,
    leaves: leaves,
    categories: categories,
  );
}

class LeaveMonthSummaryItem {
  final LeaveDayCategory category;
  final String title;
  final String subtitle;

  const LeaveMonthSummaryItem({
    required this.category,
    required this.title,
    required this.subtitle,
  });
}

List<LeaveMonthSummaryItem> buildMonthSummary({
  required int year,
  required int month,
  required List<LeaveCalendarHolidayModel> holidays,
  required List<LeaveCalendarEventModel> events,
}) {
  final items = <LeaveMonthSummaryItem>[];

  final national = holidays.where((h) => h.type == 'national').toList();
  if (national.isNotEmpty) {
    items.add(LeaveMonthSummaryItem(
      category: LeaveDayCategory.nationalOrSunday,
      title: 'Libur Nasional',
      subtitle: national.map((h) => '${_fmt(h.date)} — ${h.name}').join('\n'),
    ));
  }

  final collective = holidays.where((h) => h.type == 'collective').toList();
  if (collective.isNotEmpty) {
    items.add(LeaveMonthSummaryItem(
      category: LeaveDayCategory.collective,
      title: 'Cuti Bersama Pemerintah',
      subtitle:
          collective.map((h) => '${_fmt(h.date)} — ${h.name}').join('\n'),
    ));
  }

  final company = holidays.where((h) => h.type == 'company').toList();
  if (company.isNotEmpty) {
    items.add(LeaveMonthSummaryItem(
      category: LeaveDayCategory.company,
      title: 'Libur Kantor',
      subtitle: company.map((h) => '${_fmt(h.date)} — ${h.name}').join('\n'),
    ));
  }

  var sundayCount = 0;
  final totalDays = DateTime(year, month + 1, 0).day;
  for (var d = 1; d <= totalDays; d++) {
    if (DateTime(year, month, d).weekday == DateTime.sunday) sundayCount++;
  }
  if (sundayCount > 0) {
    items.add(LeaveMonthSummaryItem(
      category: LeaveDayCategory.nationalOrSunday,
      title: 'Hari Minggu',
      subtitle: '$sundayCount hari Minggu (libur mingguan)',
    ));
  }

  final own = events.where((e) => e.isOwn).toList();
  if (own.isNotEmpty) {
    items.add(LeaveMonthSummaryItem(
      category: LeaveDayCategory.ownLeave,
      title: 'Cuti Saya',
      subtitle: own
          .map((e) => '${_fmt(e.start)}–${_fmt(e.end)}: ${e.title}')
          .join('\n'),
    ));
  }

  final others = events.where((e) => !e.isOwn).toList();
  if (others.isNotEmpty) {
    items.add(LeaveMonthSummaryItem(
      category: LeaveDayCategory.otherLeave,
      title: 'Cuti Karyawan Lain',
      subtitle: others
          .map((e) => '${_fmt(e.start)}–${_fmt(e.end)}: ${e.employeeName}')
          .join('\n'),
    ));
  }

  return items;
}

String _fmt(String iso) {
  final parts = iso.split('-');
  if (parts.length != 3) return iso;
  return '${parts[2]}/${parts[1]}/${parts[0]}';
}

String holidayTypeLabel(String type) => switch (type) {
      'collective' => 'Cuti Bersama Pemerintah',
      'company' => 'Libur Kantor',
      _ => 'Libur Nasional',
    };

String categoryLabel(LeaveDayCategory cat) => switch (cat) {
      LeaveDayCategory.today => 'Hari Ini',
      LeaveDayCategory.nationalOrSunday => 'Libur Nasional / Minggu',
      LeaveDayCategory.collective => 'Cuti Bersama',
      LeaveDayCategory.company => 'Libur Kantor',
      LeaveDayCategory.ownLeave => 'Cuti Saya',
      LeaveDayCategory.otherLeave => 'Cuti Karyawan Lain',
    };
