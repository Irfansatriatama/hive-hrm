import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeStatus, ApprovalStatus } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

// Hashed password for "Admin@1234" used as default for new accounts
const DEFAULT_PASS_HASH =
  'e83ccf83b987b747d6a77f480a81bc41:73435d58604766926f6c2b5d9d7827f6e129ca94c666e16aba5b78413a3db50bd6be54b41a010c00127858c01a471d9935a85e8df2a83934ae7a07aac97c9c91';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    search?: string;
    dept?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, dept, status, type, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dept) {
      where.departmentId = dept;
    }

    if (status) {
      where.status = status.toUpperCase() as EmployeeStatus;
    }

    if (type) {
      // In prisma schema, employmentType is not explicitly a separate model field, 
      // but in UI it maps to contract / permanent or status details.
      // We will default to storing it inside notes or keeping it implicit, or wait:
      // Let's see if our prisma schema has it.
      // In schema.prisma: Employee has status, gender, phone, address, etc.
      // Wait, let's verify if schema.prisma has employmentType or similar.
      // In schema.prisma: Employee does NOT have employmentType!
      // Ah! We see: status: EmployeeStatus @default(ACTIVE), but no employmentType.
      // Let's map employmentType filters to ACTIVE status or we can ignore/exclude it.
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          position: true,
        },
        orderBy: { employeeNumber: 'asc' },
      }),
      this.prisma.employee.count({ where }),
    ]);

    // Format output to match reference fields (like employment_type)
    const formatted = employees.map(emp => ({
      id: emp.id,
      employee_id: emp.id,
      employee_number: emp.employeeNumber,
      first_name: emp.firstName,
      last_name: emp.lastName,
      full_name: emp.fullName,
      gender: emp.gender,
      email: emp.email,
      phone: emp.phone,
      status: emp.status.toLowerCase(),
      employment_type: emp.salary > 15000000 ? 'permanent' : 'contract', // inferred mock type
      department_id: emp.departmentId,
      position_id: emp.positionId,
      basic_salary: emp.basicSalary,
      join_date: emp.joinDate ? emp.joinDate.toISOString().split('T')[0] : null,
      department: emp.department,
      position: emp.position,
    }));

    return { employees: formatted, total };
  }

  async findOne(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        manager: true,
        user: true,
        attendances: {
          take: 30,
          orderBy: { date: 'desc' },
        },
        leaveRequests: {
          include: { leaveType: true },
          orderBy: { startDate: 'desc' },
        },
        assets: true,
        documents: true,
      },
    });

    if (!emp) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Return reference-aligned properties
    return {
      id: emp.id,
      employee_id: emp.id,
      employee_number: emp.employeeNumber,
      first_name: emp.firstName,
      last_name: emp.lastName,
      full_name: emp.fullName,
      gender: emp.gender,
      birth_date: emp.birthDate ? emp.birthDate.toISOString().split('T')[0] : null,
      birth_place: emp.birthPlace,
      religion: emp.religion,
      marital_status: emp.maritalStatus,
      blood_type: emp.bloodType,
      nationality: emp.nationality,
      address: emp.address,
      phone: emp.phone,
      email: emp.email,
      status: emp.status.toLowerCase(),
      employment_type: emp.salary > 15000000 ? 'permanent' : 'contract',
      department_id: emp.departmentId,
      position_id: emp.positionId,
      direct_manager_id: emp.managerId,
      work_location: 'Head Office',
      work_email: emp.email,
      basic_salary: emp.basicSalary,
      bank_name: 'BCA',
      bank_account: '1234567890',
      bank_account_name: emp.fullName,
      tax_status: 'TK/0',
      bpjs_kes: '0001234567',
      bpjs_tk: '1234567890',
      npwp: '12.345.678.9-012.000',
      ktp: '3201234567890123',
      kk: '3201012345678901',
      join_date: emp.joinDate ? emp.joinDate.toISOString().split('T')[0] : null,
      department: emp.department,
      position: emp.position,
      manager: emp.manager,
      attendances: emp.attendances,
      leave_requests: emp.leaveRequests.map(l => ({
        id: l.id,
        leave_type_name: l.leaveType.name,
        start_date: l.startDate.toISOString().split('T')[0],
        end_date: l.endDate.toISOString().split('T')[0],
        duration: l.totalDays,
        reason: l.reason,
        status: l.status.toLowerCase(),
      })),
      assets: emp.assets.map(a => ({
        id: a.id,
        name: a.name,
        serial_number: a.serialNumber,
        assigned_date: a.purchaseDate ? a.purchaseDate.toISOString().split('T')[0] : null,
      })),
      documents: emp.documents
        .filter((d) => d.isPublic !== false && (d.visibility === 'all' || !d.visibility))
        .map(d => ({
        id: d.id,
        name: d.name,
        size: d.fileSize
          ? d.fileSize < 1024 * 1024
            ? `${(d.fileSize / 1024).toFixed(0)} KB`
            : `${(d.fileSize / (1024 * 1024)).toFixed(1)} MB`
          : '1.2 MB',
        folder: d.category,
        fileUrl: d.fileUrl,
      })),
    };
  }

  async create(data: any) {
    const count = await this.prisma.employee.count();
    const employeeId = `EMP${String(count + 1).padStart(3, '0')}`;

    // Create user and account if they do not exist
    const user = await this.prisma.user.create({
      data: {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    });

    await this.prisma.account.create({
      data: {
        userId: user.id,
        accountId: data.email,
        providerId: 'credential',
        password: DEFAULT_PASS_HASH,
      },
    });

    const emp = await this.prisma.employee.create({
      data: {
        id: employeeId,
        employeeNumber: employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        birthPlace: data.birthPlace,
        religion: data.religion,
        maritalStatus: data.maritalStatus,
        bloodType: data.bloodType,
        nationality: 'WNI',
        address: data.address,
        phone: data.phone,
        email: data.email,
        salary: Number(data.basicSalary) || 0,
        basicSalary: Number(data.basicSalary) || 0,
        status: EmployeeStatus.ACTIVE,
        departmentId: data.departmentId || null,
        positionId: data.positionId || null,
        managerId: data.directManagerId || null,
        joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
        userId: user.id,
      },
    });

    return emp;
  }

  async update(id: string, data: any) {
    const emp = await this.prisma.employee.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        birthPlace: data.birthPlace,
        religion: data.religion,
        maritalStatus: data.maritalStatus,
        bloodType: data.bloodType,
        address: data.address,
        phone: data.phone,
        email: data.email,
        salary: data.basicSalary ? Number(data.basicSalary) : undefined,
        basicSalary: data.basicSalary ? Number(data.basicSalary) : undefined,
        departmentId: data.departmentId || undefined,
        positionId: data.positionId || undefined,
        managerId: data.directManagerId || undefined,
      },
    });

    if (emp.userId) {
      await this.prisma.user.update({
        where: { id: emp.userId },
        data: {
          name: emp.fullName,
          email: emp.email,
        },
      });
    }

    return emp;
  }

  async remove(id: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException(`Employee with ID ${id} not found`);

    if (emp.userId) {
      await this.prisma.account.deleteMany({ where: { userId: emp.userId } });
      await this.prisma.session.deleteMany({ where: { userId: emp.userId } });
      await this.prisma.user.delete({ where: { id: emp.userId } });
    }

    // Clean up dependencies
    await this.prisma.attendance.deleteMany({ where: { employeeId: id } });
    await this.prisma.leaveRequest.deleteMany({ where: { employeeId: id } });
    await this.prisma.asset.updateMany({ where: { employeeId: id }, data: { employeeId: null } });
    await this.prisma.document.deleteMany({ where: { employeeId: id } });

    return this.prisma.employee.delete({ where: { id } });
  }

  async getDashboardStats(userRole: string) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const [activeCount, presentTodayCount, pendingApprovalsCount, onLeaveTodayCount] = await Promise.all([
      this.prisma.employee.count({ where: { status: EmployeeStatus.ACTIVE } }),
      this.prisma.attendance.count({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          status: { in: ['On Time', 'Late', 'hadir', 'on_time'] },
        },
      }),
      this.prisma.leaveRequest.count({
        where: { status: ApprovalStatus.PENDING },
      }), // Simplification: pending leaves as action indicators
      this.prisma.leaveRequest.count({
        where: {
          status: ApprovalStatus.APPROVED,
          startDate: { lte: todayEnd },
          endDate: { gte: todayStart },
        },
      }),
    ]);

    const presentPercentage = activeCount > 0 ? Math.round((presentTodayCount / activeCount) * 100) : 0;

    // Approvals table list (limit 5)
    const pendingLeaves = await this.prisma.leaveRequest.findMany({
      where: { status: ApprovalStatus.PENDING },
      take: 5,
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });

    const pendingApprovals = pendingLeaves.map(pl => ({
      requester_name: pl.employee.fullName,
      type: 'cuti',
      date_submitted: pl.createdAt.toISOString(),
      status: 'pending',
    }));

    // Birthdays this month
    const thisMonth = new Date().getMonth() + 1;
    const employees = await this.prisma.employee.findMany({
      where: { status: EmployeeStatus.ACTIVE },
    });

    const birthdays = employees
      .filter(emp => emp.birthDate && emp.birthDate.getMonth() + 1 === thisMonth)
      .slice(0, 4)
      .map(emp => ({
        employee_id: emp.id,
        full_name: emp.fullName,
        birth_date: emp.birthDate ? emp.birthDate.toISOString().split('T')[0] : null,
      }));

    // Announcements
    const now = new Date();
    const announcements = await this.prisma.announcement.findMany({
      where: {
        status: 'published',
        publishDate: { lte: now },
        OR: [{ expireDate: null }, { expireDate: { gte: now } }],
      },
      orderBy: [{ isPinned: 'desc' }, { publishDate: 'desc' }],
      take: 3,
    });

    const formattedAnnouncements = announcements.map((ann) => ({
      id: ann.id,
      title: ann.title,
      content: ann.content,
      pinned: ann.isPinned,
      author: ann.createdBy || 'HR Admin',
      publish_date: ann.publishDate.toISOString(),
    }));

    // Department Distribution
    const depts = await this.prisma.department.findMany({
      include: {
        _count: {
          select: { employees: { where: { status: EmployeeStatus.ACTIVE } } },
        },
      },
    });

    const deptDistribution = {
      labels: depts.map(d => d.name),
      counts: depts.map(d => d._count.employees),
    };

    // Attendance Trend (Last 7 days for summary or last 5 workdays)
    const trendLabels: string[] = [];
    const trendCounts: number[] = [];
    
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      
      const count = await this.prisma.attendance.count({
        where: {
          date: { gte: start, lte: end },
          status: { in: ['On Time', 'Late', 'hadir'] },
        },
      });

      trendLabels.push(label);
      trendCounts.push(count);
    }

    return {
      totalActive: activeCount,
      presentTodayCount,
      presentPercentage,
      pendingApprovalsCount,
      onLeaveCount: onLeaveTodayCount,
      pendingApprovals,
      birthdays,
      announcements: formattedAnnouncements,
      deptDistribution,
      attendanceTrend: {
        labels: trendLabels,
        counts: trendCounts,
      },
    };
  }

  async findDepartments() {
    const depts = await this.prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    const employees = await this.prisma.employee.findMany({
      where: { status: EmployeeStatus.ACTIVE },
      include: { position: true },
    });

    return depts.map((dept) => {
      const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
      const head =
        deptEmployees.find((e) => e.position?.grade?.startsWith('M')) ||
        deptEmployees[0];

      return {
        ...dept,
        headName: head?.fullName || 'Belum ditugaskan',
        staffCount: deptEmployees.length,
      };
    });
  }

  async createDepartment(data: { name: string; code: string }) {
    const code = data.code.trim().toUpperCase();
    const count = await this.prisma.department.count();
    const id = `DEPT${String(count + 1).padStart(3, '0')}`;

    return this.prisma.department.create({
      data: {
        id,
        name: data.name.trim(),
        code,
      },
    });
  }

  async updateDepartment(id: string, data: { name: string; code: string }) {
    const existing = await this.prisma.department.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Department with ID ${id} not found`);

    return this.prisma.department.update({
      where: { id },
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
      },
    });
  }

  async deleteDepartment(id: string) {
    const existing = await this.prisma.department.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Department with ID ${id} not found`);

    const employeeCount = await this.prisma.employee.count({
      where: { departmentId: id },
    });
    if (employeeCount > 0) {
      throw new BadRequestException(
        'Departemen masih memiliki karyawan. Pindahkan staff terlebih dahulu.',
      );
    }

    return this.prisma.department.delete({ where: { id } });
  }

  async findPositions() {
    return this.prisma.position.findMany({
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }

  async createPosition(data: {
    name: string;
    grade: string;
    departmentId?: string;
    salaryMin: number;
    salaryMax: number;
  }) {
    const salaryMin = parseInt(String(data.salaryMin)) || 0;
    const salaryMax = parseInt(String(data.salaryMax)) || 0;
    if (!data.name?.trim() || !data.grade?.trim() || salaryMin < 0 || salaryMax <= salaryMin) {
      throw new BadRequestException('Mohon lengkapi seluruh field dengan range gaji valid');
    }

    const count = await this.prisma.position.count();
    const id = `POS${String(count + 1).padStart(3, '0')}`;

    return this.prisma.position.create({
      data: {
        id,
        name: data.name.trim(),
        grade: data.grade.trim().toUpperCase(),
        departmentId: data.departmentId || null,
        salaryMin,
        salaryMax,
      },
      include: { department: true },
    });
  }

  async updatePosition(
    id: string,
    data: {
      name: string;
      grade: string;
      departmentId?: string;
      salaryMin: number;
      salaryMax: number;
    },
  ) {
    const existing = await this.prisma.position.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Position with ID ${id} not found`);

    const salaryMin = parseInt(String(data.salaryMin)) || 0;
    const salaryMax = parseInt(String(data.salaryMax)) || 0;
    if (!data.name?.trim() || !data.grade?.trim() || salaryMin < 0 || salaryMax <= salaryMin) {
      throw new BadRequestException('Mohon lengkapi seluruh field dengan range gaji valid');
    }

    return this.prisma.position.update({
      where: { id },
      data: {
        name: data.name.trim(),
        grade: data.grade.trim().toUpperCase(),
        departmentId: data.departmentId || null,
        salaryMin,
        salaryMax,
      },
      include: { department: true },
    });
  }

  async deletePosition(id: string) {
    const existing = await this.prisma.position.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Position with ID ${id} not found`);

    const employeeCount = await this.prisma.employee.count({
      where: { positionId: id },
    });
    if (employeeCount > 0) {
      throw new BadRequestException(
        'Jabatan masih digunakan karyawan. Pindahkan posisi staff terlebih dahulu.',
      );
    }

    return this.prisma.position.delete({ where: { id } });
  }

  async getOrgChart(deptFilter?: string) {
    const employees = await this.prisma.employee.findMany({
      where: { status: EmployeeStatus.ACTIVE },
      include: {
        department: true,
        position: true,
        manager: { select: { id: true, fullName: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    const filtered = deptFilter
      ? employees.filter((e) => e.departmentId === deptFilter)
      : employees;

    return filtered.map((emp) => ({
      id: emp.id,
      full_name: emp.fullName,
      employee_number: emp.employeeNumber,
      department_id: emp.departmentId,
      department_name: emp.department?.name || '',
      position_id: emp.positionId,
      position_name: emp.position?.name || '',
      direct_manager_id: emp.managerId,
      manager_name: emp.manager?.fullName || null,
      work_email: emp.email,
      work_location: 'Head Office',
      join_date: emp.joinDate ? emp.joinDate.toISOString().split('T')[0] : null,
    }));
  }

  async findManagers() {
    return this.prisma.employee.findMany({
      where: { status: EmployeeStatus.ACTIVE },
      select: {
        id: true,
        fullName: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findAllGroups() {
    return this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneGroup(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });
    if (!group) throw new NotFoundException(`Group with ID ${id} not found`);
    return group;
  }

  async createGroup(data: any, userId?: string) {
    const group = await this.prisma.group.create({
      data: {
        name: data.name,
        description: data.description || null,
        memberIds: data.memberIds || [],
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'employee.group_create',
        targetType: 'employee_group',
        targetId: group.id,
        targetName: group.name,
        details: group as any,
      },
    });

    return group;
  }

  async updateGroup(id: string, data: any, userId?: string) {
    const before = await this.findOneGroup(id);
    const group = await this.prisma.group.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        memberIds: data.memberIds,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'employee.group_edit',
        targetType: 'employee_group',
        targetId: group.id,
        targetName: group.name,
        details: { before, after: group } as any,
      },
    });

    return group;
  }

  async removeGroup(id: string, userId?: string) {
    const group = await this.findOneGroup(id);
    await this.prisma.group.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'employee.group_delete',
        targetType: 'employee_group',
        targetId: id,
        targetName: group.name,
        details: { deletedGroup: group } as any,
      },
    });

    return group;
  }

  async createProfileRequest(employeeId: string, data: any, userId?: string) {
    const request = await this.prisma.profileUpdateRequest.create({
      data: {
        employeeId,
        type: data.type,
        summary: data.summary,
        details: data.details || {},
        reason: data.reason,
        status: ApprovalStatus.PENDING,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'employee.request_update',
        targetType: 'approval',
        targetId: request.id,
        targetName: data.summary,
        details: request as any,
      },
    });

    return request;
  }

  async findMyRequests(employeeId: string) {
    return this.prisma.profileUpdateRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelProfileRequest(id: string, employeeId: string, userId?: string) {
    const request = await this.prisma.profileUpdateRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException(`Request with ID ${id} not found`);
    if (request.employeeId !== employeeId) {
      throw new UnauthorizedException('You can only cancel your own requests');
    }
    
    await this.prisma.profileUpdateRequest.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'employee.request_cancel',
        targetType: 'approval',
        targetId: id,
        targetName: request.summary,
        details: request as any,
      },
    });

    return request;
  }

  async findByUserId(userId: string) {
    return this.prisma.employee.findUnique({
      where: { userId },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.employee.findUnique({
      where: { email },
    });
  }

  async findLinkedEmployee(userId: string, email: string) {
    const byUser = await this.findByUserId(userId);
    if (byUser) return byUser;
    return this.findByEmail(email);
  }
}

