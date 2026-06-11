class ShiftTypeModel {
  final String id;
  final String name;
  final String startTime;
  final String endTime;
  final String color;

  const ShiftTypeModel({
    required this.id,
    required this.name,
    required this.startTime,
    required this.endTime,
    required this.color,
  });

  factory ShiftTypeModel.fromJson(Map<String, dynamic> json) {
    return ShiftTypeModel(
      id: json['id'] as String,
      name: json['name'] as String,
      startTime: json['startTime'] as String? ?? '',
      endTime: json['endTime'] as String? ?? '',
      color: json['color'] as String? ?? '#3B82F6',
    );
  }

  String get timeRange => '$startTime – $endTime';
}

class ShiftScheduleEntryModel {
  final String id;
  final String employeeId;
  final String date;
  final String? shiftId;
  final ShiftTypeModel? shift;

  const ShiftScheduleEntryModel({
    required this.id,
    required this.employeeId,
    required this.date,
    this.shiftId,
    this.shift,
  });

  factory ShiftScheduleEntryModel.fromJson(Map<String, dynamic> json) {
    return ShiftScheduleEntryModel(
      id: json['id'] as String,
      employeeId: json['employeeId'] as String,
      date: json['date'] as String,
      shiftId: json['shiftId'] as String?,
      shift: json['shift'] != null
          ? ShiftTypeModel.fromJson(json['shift'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ShiftSwapModel {
  final String id;
  final String requesterId;
  final String partnerId;
  final String date;
  final String shiftDetails;
  final String status;
  final String? requesterName;
  final String? partnerName;

  const ShiftSwapModel({
    required this.id,
    required this.requesterId,
    required this.partnerId,
    required this.date,
    required this.shiftDetails,
    required this.status,
    this.requesterName,
    this.partnerName,
  });

  factory ShiftSwapModel.fromJson(Map<String, dynamic> json) {
    final requester = json['requester'] as Map<String, dynamic>?;
    final partner = json['partner'] as Map<String, dynamic>?;

    return ShiftSwapModel(
      id: json['id'] as String,
      requesterId: json['requesterId'] as String,
      partnerId: json['partnerId'] as String,
      date: _parseDate(json['date']),
      shiftDetails: json['shiftDetails'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      requesterName: requester?['fullName'] as String?,
      partnerName: partner?['fullName'] as String?,
    );
  }

  static String _parseDate(dynamic value) {
    if (value is String) return value.split('T').first;
    return value.toString();
  }
}

class ShiftColleagueModel {
  final String id;
  final String name;

  const ShiftColleagueModel({required this.id, required this.name});

  factory ShiftColleagueModel.fromJson(Map<String, dynamic> json) {
    return ShiftColleagueModel(
      id: json['id'] as String,
      name: (json['full_name'] ?? json['fullName'] ?? '') as String,
    );
  }
}

class ShiftData {
  final String employeeId;
  final DateTime weekStart;
  final List<ShiftScheduleEntryModel> mySchedules;
  final List<ShiftSwapModel> swaps;
  final List<ShiftColleagueModel> colleagues;

  const ShiftData({
    required this.employeeId,
    required this.weekStart,
    required this.mySchedules,
    required this.swaps,
    required this.colleagues,
  });
}

class LeaveCalendarEventModel {
  final String id;
  final String title;
  final String start;
  final String end;
  final String employeeId;
  final String employeeName;
  final String? departmentId;

  const LeaveCalendarEventModel({
    required this.id,
    required this.title,
    required this.start,
    required this.end,
    required this.employeeId,
    required this.employeeName,
    this.departmentId,
  });

  factory LeaveCalendarEventModel.fromJson(Map<String, dynamic> json) {
    return LeaveCalendarEventModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      start: json['start'] as String,
      end: json['end'] as String,
      employeeId: json['employeeId'] as String,
      employeeName: json['employeeName'] as String? ?? '',
    );
  }

  LeaveCalendarEventModel copyWithDepartment(String? departmentId) {
    return LeaveCalendarEventModel(
      id: id,
      title: title,
      start: start,
      end: end,
      employeeId: employeeId,
      employeeName: employeeName,
      departmentId: departmentId,
    );
  }
}

class LeaveCalendarDepartmentModel {
  final String id;
  final String name;

  const LeaveCalendarDepartmentModel({required this.id, required this.name});

  factory LeaveCalendarDepartmentModel.fromJson(Map<String, dynamic> json) {
    return LeaveCalendarDepartmentModel(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}

class LeaveCalendarData {
  final List<LeaveCalendarEventModel> events;
  final List<LeaveCalendarDepartmentModel> departments;

  const LeaveCalendarData({
    required this.events,
    required this.departments,
  });
}

class OrgChartEmployeeModel {
  final String id;
  final String fullName;
  final String employeeNumber;
  final String? departmentId;
  final String departmentName;
  final String positionName;
  final String? directManagerId;
  final String? managerName;
  final String workEmail;

  const OrgChartEmployeeModel({
    required this.id,
    required this.fullName,
    required this.employeeNumber,
    this.departmentId,
    required this.departmentName,
    required this.positionName,
    this.directManagerId,
    this.managerName,
    required this.workEmail,
  });

  factory OrgChartEmployeeModel.fromJson(Map<String, dynamic> json) {
    return OrgChartEmployeeModel(
      id: json['id'] as String,
      fullName: json['full_name'] as String? ?? '',
      employeeNumber: json['employee_number'] as String? ?? '',
      departmentId: json['department_id'] as String?,
      departmentName: json['department_name'] as String? ?? '',
      positionName: json['position_name'] as String? ?? '',
      directManagerId: json['direct_manager_id'] as String?,
      managerName: json['manager_name'] as String?,
      workEmail: json['work_email'] as String? ?? '',
    );
  }
}

class OrgChartDepartmentModel {
  final String id;
  final String name;

  const OrgChartDepartmentModel({required this.id, required this.name});

  factory OrgChartDepartmentModel.fromJson(Map<String, dynamic> json) {
    return OrgChartDepartmentModel(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}

class OrgChartData {
  final List<OrgChartEmployeeModel> employees;
  final List<OrgChartDepartmentModel> departments;

  const OrgChartData({
    required this.employees,
    required this.departments,
  });
}
