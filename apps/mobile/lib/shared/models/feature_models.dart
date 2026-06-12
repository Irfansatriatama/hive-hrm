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
  final bool isOwn;

  const LeaveCalendarEventModel({
    required this.id,
    required this.title,
    required this.start,
    required this.end,
    required this.employeeId,
    required this.employeeName,
    this.departmentId,
    this.isOwn = false,
  });

  factory LeaveCalendarEventModel.fromJson(Map<String, dynamic> json) {
    return LeaveCalendarEventModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      start: json['start'] as String,
      end: json['end'] as String,
      employeeId: json['employeeId'] as String,
      employeeName: json['employeeName'] as String? ?? '',
      isOwn: json['isOwn'] as bool? ?? false,
      departmentId: json['departmentId'] as String?,
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
      isOwn: isOwn,
    );
  }
}

class LeaveCalendarHolidayModel {
  final String id;
  final String name;
  final String date;
  final String type;

  const LeaveCalendarHolidayModel({
    required this.id,
    required this.name,
    required this.date,
    required this.type,
  });

  factory LeaveCalendarHolidayModel.fromJson(Map<String, dynamic> json) {
    return LeaveCalendarHolidayModel(
      id: json['id'] as String,
      name: json['name'] as String,
      date: json['date'] as String,
      type: json['type'] as String? ?? 'national',
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
  final List<LeaveCalendarHolidayModel> holidays;
  final String? currentEmployeeId;

  const LeaveCalendarData({
    required this.events,
    required this.departments,
    this.holidays = const [],
    this.currentEmployeeId,
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

class BookableResourceModel {
  final String id;
  final String name;
  final String code;
  final String type;
  final String? location;
  final int? capacity;

  const BookableResourceModel({
    required this.id,
    required this.name,
    required this.code,
    required this.type,
    this.location,
    this.capacity,
  });

  factory BookableResourceModel.fromJson(Map<String, dynamic> json) {
    return BookableResourceModel(
      id: json['id'] as String,
      name: json['name'] as String,
      code: json['code'] as String? ?? '',
      type: json['type'] as String? ?? 'room',
      location: json['location'] as String?,
      capacity: (json['capacity'] as num?)?.toInt(),
    );
  }
}

class ResourceBookingModel {
  final String id;
  final String resourceId;
  final String? employeeId;
  final String? employeeName;
  final String title;
  final String? purpose;
  final DateTime startTime;
  final DateTime endTime;
  final String status;
  final DateTime? confirmedAt;
  final DateTime? completedAt;
  final BookableResourceModel? resource;

  const ResourceBookingModel({
    required this.id,
    required this.resourceId,
    this.employeeId,
    this.employeeName,
    required this.title,
    this.purpose,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.confirmedAt,
    this.completedAt,
    this.resource,
  });

  factory ResourceBookingModel.fromJson(Map<String, dynamic> json) {
    final employee = json['employee'] as Map<String, dynamic>?;
    return ResourceBookingModel(
      id: json['id'] as String,
      resourceId: json['resourceId'] as String,
      employeeId: json['employeeId'] as String? ?? employee?['id'] as String?,
      employeeName: employee?['fullName'] as String?,
      title: json['title'] as String,
      purpose: json['purpose'] as String?,
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      status: json['status'] as String? ?? 'pending',
      confirmedAt: json['confirmedAt'] != null
          ? DateTime.parse(json['confirmedAt'] as String)
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      resource: json['resource'] != null
          ? BookableResourceModel.fromJson(
              json['resource'] as Map<String, dynamic>,
            )
          : null,
    );
  }

  bool isTodayOrUpcoming() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final end = DateTime(endTime.year, endTime.month, endTime.day);
    return !end.isBefore(today);
  }
}

class ResourcesData {
  final List<BookableResourceModel> resources;
  final List<ResourceBookingModel> bookings;

  const ResourcesData({
    required this.resources,
    required this.bookings,
  });
}

class DocumentFolderModel {
  final String id;
  final String name;

  const DocumentFolderModel({required this.id, required this.name});

  factory DocumentFolderModel.fromJson(Map<String, dynamic> json) {
    return DocumentFolderModel(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}

class DocumentModel {
  final String id;
  final String name;
  final String category;
  final String fileType;
  final String? fileUrl;
  final String? size;
  final DateTime createdAt;

  const DocumentModel({
    required this.id,
    required this.name,
    required this.category,
    required this.fileType,
    this.fileUrl,
    this.size,
    required this.createdAt,
  });

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    return DocumentModel(
      id: json['id'] as String,
      name: json['name'] as String,
      category: (json['category'] ?? json['folder'] ?? '') as String,
      fileType: (json['fileType'] ?? json['type'] ?? 'PDF') as String,
      fileUrl: json['fileUrl'] as String?,
      size: json['size'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class DocumentsData {
  final List<DocumentModel> documents;
  final List<DocumentFolderModel> folders;

  const DocumentsData({
    required this.documents,
    required this.folders,
  });
}

class AssetModel {
  final String id;
  final String assetCode;
  final String name;
  final String category;
  final String condition;
  final String status;
  final String? location;
  final DateTime? assignedDate;

  const AssetModel({
    required this.id,
    required this.assetCode,
    required this.name,
    required this.category,
    required this.condition,
    required this.status,
    this.location,
    this.assignedDate,
  });

  factory AssetModel.fromJson(Map<String, dynamic> json) {
    return AssetModel(
      id: json['id'] as String,
      assetCode: json['assetCode'] as String? ?? '',
      name: json['name'] as String,
      category: json['category'] as String? ?? '',
      condition: json['condition'] as String? ?? '',
      status: json['status'] as String? ?? '',
      location: json['location'] as String?,
      assignedDate: json['assignedDate'] != null
          ? DateTime.tryParse(json['assignedDate'] as String)
          : null,
    );
  }
}

class AssetRequestModel {
  final String id;
  final String requestCode;
  final String assetName;
  final String reason;
  final int duration;
  final String status;
  final DateTime dateRequested;

  const AssetRequestModel({
    required this.id,
    required this.requestCode,
    required this.assetName,
    required this.reason,
    required this.duration,
    required this.status,
    required this.dateRequested,
  });

  factory AssetRequestModel.fromJson(Map<String, dynamic> json) {
    return AssetRequestModel(
      id: json['id'] as String,
      requestCode: json['requestCode'] as String? ?? '',
      assetName: json['assetName'] as String,
      reason: json['reason'] as String,
      duration: (json['duration'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'pending',
      dateRequested: DateTime.parse(json['dateRequested'] as String),
    );
  }
}

class AssetsData {
  final List<AssetModel> assets;
  final List<AssetRequestModel> requests;

  const AssetsData({required this.assets, required this.requests});
}

class VisitorModel {
  final String id;
  final String? badgeNumber;
  final String visitorName;
  final String? company;
  final String purpose;
  final String? hostName;
  final String? hostEmployeeId;
  final DateTime checkIn;
  final DateTime? checkOut;
  final String status;

  const VisitorModel({
    required this.id,
    this.badgeNumber,
    required this.visitorName,
    this.company,
    required this.purpose,
    this.hostName,
    this.hostEmployeeId,
    required this.checkIn,
    this.checkOut,
    required this.status,
  });

  factory VisitorModel.fromJson(Map<String, dynamic> json) {
    return VisitorModel(
      id: json['id'] as String,
      badgeNumber: json['badgeNumber'] as String? ?? json['badge_number'] as String?,
      visitorName: (json['visitorName'] ?? json['visitor_name'] ?? '') as String,
      company: json['company'] as String?,
      purpose: json['purpose'] as String? ?? '',
      hostName: json['hostName'] as String? ?? json['host_name'] as String?,
      hostEmployeeId: json['hostEmployeeId'] as String? ??
          json['host_employee_id'] as String?,
      checkIn: DateTime.parse(json['checkIn'] as String),
      checkOut: json['checkOut'] != null
          ? DateTime.tryParse(json['checkOut'] as String)
          : null,
      status: json['status'] as String? ?? 'checked_in',
    );
  }

  bool get isActive => status == 'checked_in';

  bool isToday() {
    final now = DateTime.now();
    return checkIn.year == now.year &&
        checkIn.month == now.month &&
        checkIn.day == now.day;
  }
}

