import { PrismaClient, EmployeeStatus } from '@prisma/client';
import { DEFAULT_ROLES, DEFAULT_PERMISSION_MATRIX } from '../src/core/default-roles';
import { hashPassword } from 'better-auth/crypto';
import { DEFAULT_SYSTEM_MODULES } from '@hive-hrm/types';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Admin@1234';

async function main() {
  const hashedPassword = await hashPassword(DEMO_PASSWORD);
  console.log('Clearing database tables...');
  
  // Clear tables in dependency order
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.document.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.publicHoliday.deleteMany();
  await prisma.systemModule.deleteMany();
  await prisma.roleDefinition.deleteMany();
  await prisma.company.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.shift.deleteMany();

  console.log('Seeding company profile...');
  await prisma.company.create({
    data: {
      name: 'PT. Nusantara Digital Inovasi',
      tagline: 'Transformasi Digital untuk Indonesia',
      industry: 'Teknologi Informasi',
      address: 'Jl. TB Simatupang No. 88, Jakarta Selatan, DKI Jakarta 12560',
      phone: '(021) 7890-1234',
      email: 'info@ndi.co.id',
      website: 'www.ndi.co.id',
      npwp: '01.234.567.8-901.000',
    },
  });

  console.log('Seeding branches...');
  await prisma.branch.createMany({
    data: [
      { name: 'Head Office - Jakarta', address: 'Jl. TB Simatupang No. 88, Jakarta Selatan', pic: 'Sari Dewi Lestari', staffCount: 15 },
      { name: 'R&D Center - Bandung', address: 'Jl. Dago No. 100, Bandung', pic: 'Arief Budiman', staffCount: 5 },
    ],
  });

  console.log('Seeding shifts...');
  await prisma.shift.createMany({
    data: [
      { name: 'Morning Shift', startTime: '06:00', endTime: '14:00', breakTime: 60, isDefault: false },
      { name: 'Day Shift', startTime: '08:00', endTime: '17:00', breakTime: 60, isDefault: true },
      { name: 'Afternoon Shift', startTime: '14:00', endTime: '22:00', breakTime: 60, isDefault: false },
      { name: 'Night Shift', startTime: '22:00', endTime: '06:00', breakTime: 60, isDefault: false },
    ],
  });

  console.log('Seeding departments...');
  const depts = [
    { id: 'DEPT001', name: 'Teknologi & Produk', code: 'TECH' },
    { id: 'DEPT002', name: 'Human Resources', code: 'HRD' },
    { id: 'DEPT003', name: 'Finance & Accounting', code: 'FIN' },
    { id: 'DEPT004', name: 'Marketing & Growth', code: 'MKT' },
    { id: 'DEPT005', name: 'Operations', code: 'OPS' },
    { id: 'DEPT006', name: 'Customer Success', code: 'CS' },
  ];
  for (const dept of depts) {
    await prisma.department.create({ data: dept });
  }

  console.log('Seeding positions...');
  const positions = [
    { id: 'POS001', name: 'CEO / President Director', grade: 'M1', departmentId: null, salaryMin: 50000000, salaryMax: 80000000 },
    { id: 'POS002', name: 'Head of Technology', grade: 'M2', departmentId: 'DEPT001', salaryMin: 25000000, salaryMax: 45000000 },
    { id: 'POS003', name: 'Tech Lead', grade: 'M3', departmentId: 'DEPT001', salaryMin: 15000000, salaryMax: 25000000 },
    { id: 'POS004', name: 'Full Stack Developer', grade: 'S1', departmentId: 'DEPT001', salaryMin: 8000000, salaryMax: 15000000 },
    { id: 'POS005', name: 'Backend Developer', grade: 'S1', departmentId: 'DEPT001', salaryMin: 8000000, salaryMax: 15000000 },
    { id: 'POS006', name: 'QA Engineer', grade: 'S2', departmentId: 'DEPT001', salaryMin: 6000000, salaryMax: 11000000 },
    { id: 'POS007', name: 'UI/UX Designer', grade: 'S2', departmentId: 'DEPT001', salaryMin: 7000000, salaryMax: 12000000 },
    { id: 'POS008', name: 'DevOps Engineer', grade: 'S1', departmentId: 'DEPT001', salaryMin: 10000000, salaryMax: 18000000 },
    { id: 'POS009', name: 'Product Manager', grade: 'S1', departmentId: 'DEPT001', salaryMin: 12000000, salaryMax: 22000000 },
    { id: 'POS010', name: 'Data Analyst', grade: 'S2', departmentId: 'DEPT001', salaryMin: 8000000, salaryMax: 14000000 },
    { id: 'POS011', name: 'HR Manager', grade: 'M2', departmentId: 'DEPT002', salaryMin: 15000000, salaryMax: 25000000 },
    { id: 'POS012', name: 'HR Staff', grade: 'S2', departmentId: 'DEPT002', salaryMin: 6000000, salaryMax: 9000000 },
    { id: 'POS013', name: 'HR Generalist', grade: 'S2', departmentId: 'DEPT002', salaryMin: 7000000, salaryMax: 11000000 },
    { id: 'POS014', name: 'Finance Manager', grade: 'M2', departmentId: 'DEPT003', salaryMin: 15000000, salaryMax: 25000000 },
    { id: 'POS015', name: 'Accountant', grade: 'S2', departmentId: 'DEPT003', salaryMin: 7000000, salaryMax: 12000000 },
    { id: 'POS016', name: 'Finance Staff', grade: 'S3', departmentId: 'DEPT003', salaryMin: 5500000, salaryMax: 8500000 },
    { id: 'POS017', name: 'Marketing Manager', grade: 'M2', departmentId: 'DEPT004', salaryMin: 14000000, salaryMax: 23000000 },
    { id: 'POS018', name: 'Content Marketing', grade: 'S2', departmentId: 'DEPT004', salaryMin: 6000000, salaryMax: 10000000 },
    { id: 'POS019', name: 'Digital Marketing', grade: 'S2', departmentId: 'DEPT004', salaryMin: 6500000, salaryMax: 11000000 },
    { id: 'POS020', name: 'Operations Manager', grade: 'M2', departmentId: 'DEPT005', salaryMin: 12000000, salaryMax: 20000000 },
    { id: 'POS021', name: 'Customer Success Lead', grade: 'S1', departmentId: 'DEPT006', salaryMin: 9000000, salaryMax: 15000000 },
  ];
  for (const pos of positions) {
    await prisma.position.create({ data: pos });
  }

  console.log('Seeding employees...');
  const employeesData = [
    { id: 'EMP001', first: 'Arief', last: 'Budiman', pos: 'POS002', dept: 'DEPT001', gender: 'male', email: 'arief.budiman@hive.id', salary: 35000000 },
    { id: 'EMP002', first: 'Sari', last: 'Dewi Lestari', pos: 'POS011', dept: 'DEPT002', gender: 'female', email: 'hradmin@hive.id', salary: 20000000 },
    { id: 'EMP003', first: 'Budi', last: 'Santoso', pos: 'POS003', dept: 'DEPT001', gender: 'male', email: 'manager@hive.id', salary: 18000000 },
    { id: 'EMP004', first: 'Rina', last: 'Agustina', pos: 'POS004', dept: 'DEPT001', gender: 'female', email: 'karyawan@hive.id', salary: 9500000 },
    { id: 'EMP005', first: 'Reza', last: 'Firmansyah', pos: 'POS014', dept: 'DEPT003', gender: 'male', email: 'reza.firmansyah@hive.id', salary: 19000000 },
    { id: 'EMP006', first: 'Anisa', last: 'Rahmawati', pos: 'POS017', dept: 'DEPT004', gender: 'female', email: 'anisa.rahmawati@hive.id', salary: 17500000 },
    { id: 'EMP007', first: 'Doni', last: 'Prasetyo', pos: 'POS008', dept: 'DEPT001', gender: 'male', email: 'doni.prasetyo@hive.id', salary: 11000000 },
    { id: 'EMP008', first: 'Fitri', last: 'Nuraini', pos: 'POS012', dept: 'DEPT002', gender: 'female', email: 'fitri.nuraini@hive.id', salary: 6500000 },
    { id: 'EMP009', first: 'Galih', last: 'Wicaksono', pos: 'POS009', dept: 'DEPT001', gender: 'male', email: 'galih.wicaksono@hive.id', salary: 15000000 },
    { id: 'EMP010', first: 'Hani', last: 'Kusuma Dewi', pos: 'POS007', dept: 'DEPT001', gender: 'female', email: 'hani.kusuma@hive.id', salary: 8500000 },
    { id: 'EMP011', first: 'Irfan', last: 'Setiawan', pos: 'POS015', dept: 'DEPT003', gender: 'male', email: 'irfan.setiawan@hive.id', salary: 8500000 },
    { id: 'EMP012', first: 'Joko', last: 'Widodo Santoso', pos: 'POS020', dept: 'DEPT005', gender: 'male', email: 'joko.widodo@hive.id', salary: 16000000 },
    { id: 'EMP013', first: 'Kartika', last: 'Sari', pos: 'POS018', dept: 'DEPT004', gender: 'female', email: 'kartika.sari@hive.id', salary: 7000000 },
    { id: 'EMP014', first: 'Lutfi', last: 'Hakim', pos: 'POS005', dept: 'DEPT001', gender: 'male', email: 'lutfi.hakim@hive.id', salary: 9000000 },
    { id: 'EMP015', first: 'Mia', last: 'Ramadhani', pos: 'POS021', dept: 'DEPT006', gender: 'female', email: 'mia.ramadhani@hive.id', salary: 11000000 },
    { id: 'EMP016', first: 'Nanda', last: 'Purnama', pos: 'POS010', dept: 'DEPT001', gender: 'female', email: 'nanda.purnama@hive.id', salary: 8000000 },
    { id: 'EMP017', first: 'Oki', last: 'Setiawan', pos: 'POS006', dept: 'DEPT001', gender: 'male', email: 'oki.setiawan@hive.id', salary: 7500000 },
    { id: 'EMP018', first: 'Dani', last: 'Firmansyah', pos: 'POS016', dept: 'DEPT003', gender: 'male', email: 'finance@hive.id', salary: 12000000 },
    { id: 'EMP019', first: 'Qori', last: 'Abdillah', pos: 'POS019', dept: 'DEPT004', gender: 'male', email: 'qori.abdillah@hive.id', salary: 7500000 },
    { id: 'EMP020', first: 'Ratna', last: 'Komala', pos: 'POS013', dept: 'DEPT002', gender: 'female', email: 'ratna.komala@hive.id', salary: 8000000 },
  ];

  for (const emp of employeesData) {
    await prisma.employee.create({
      data: {
        id: emp.id,
        employeeNumber: emp.id,
        firstName: emp.first,
        lastName: emp.last,
        fullName: `${emp.first} ${emp.last}`,
        gender: emp.gender,
        email: emp.email,
        salary: emp.salary,
        basicSalary: emp.salary,
        status: EmployeeStatus.ACTIVE,
        positionId: emp.pos,
        departmentId: emp.dept,
        joinDate: new Date('2022-01-15'),
      },
    });
  }

  console.log('Seeding users and Better Auth accounts...');
  // Standard demo users mapping
  const demoUsers = [
    { email: 'superadmin@hive.id', role: 'SUPER_ADMIN', name: 'System Administrator', empId: 'EMP001' },
    { email: 'hradmin@hive.id', role: 'HR_ADMIN', name: 'Sari Dewi Lestari', empId: 'EMP002' },
    { email: 'manager@hive.id', role: 'MANAGER', name: 'Budi Santoso', empId: 'EMP003' },
    { email: 'karyawan@hive.id', role: 'EMPLOYEE', name: 'Rina Agustina', empId: 'EMP004' },
    { email: 'finance@hive.id', role: 'FINANCE', name: 'Dani Firmansyah', empId: 'EMP018' },
  ];

  for (const demoUser of demoUsers) {
    // 1. Create User
    const user = await prisma.user.create({
      data: {
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        emailVerified: true,
      },
    });

    // Link User to Employee
    await prisma.employee.update({
      where: { id: demoUser.empId },
      data: { userId: user.id },
    });

    // 2. Create Account for password login
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: demoUser.email,
        providerId: 'credential',
        password: hashedPassword,
      },
    });
  }

  // Create accounts for all other employees so they can login too if needed
  for (const emp of employeesData) {
    const isDemo = demoUsers.some(d => d.empId === emp.id);
    if (!isDemo) {
      const user = await prisma.user.create({
        data: {
          email: emp.email,
          name: `${emp.first} ${emp.last}`,
          role: emp.id === 'EMP001' ? 'SUPER_ADMIN' : emp.id === 'EMP002' ? 'HR_ADMIN' : emp.id === 'EMP003' ? 'MANAGER' : 'EMPLOYEE',
          emailVerified: true,
        },
      });

      await prisma.employee.update({
        where: { id: emp.id },
        data: { userId: user.id },
      });

      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: emp.email,
          providerId: 'credential',
          password: hashedPassword,
        },
      });
    }
  }

  console.log('Seeding leave types...');
  await prisma.leaveType.createMany({
    data: [
      { name: 'Cuti Tahunan', maxDays: 12, isPaid: true },
      { name: 'Sakit (Dengan Surat Dokter)', maxDays: 30, isPaid: true },
      { name: 'Izin Alasan Penting', maxDays: 5, isPaid: false },
      { name: 'Cuti Melahirkan', maxDays: 90, isPaid: true },
    ],
  });

  console.log('Seeding role definitions...');
  for (const role of DEFAULT_ROLES) {
    await prisma.roleDefinition.create({
      data: {
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    });
  }

  console.log('Seeding permission matrix...');
  await prisma.appSetting.create({
    data: { key: 'permission_matrix', value: DEFAULT_PERMISSION_MATRIX as any },
  });

  console.log('Seeding system modules...');
  for (const mod of DEFAULT_SYSTEM_MODULES) {
    await prisma.systemModule.create({
      data: {
        key: mod.key,
        name: mod.name,
        description: mod.description,
        icon: mod.icon,
        isCore: mod.isCore,
        isEnabled: true,
        sortOrder: mod.sortOrder,
      },
    });
  }

  console.log('Seeding public holidays...');
  await prisma.publicHoliday.createMany({
    data: [
      { name: 'Tahun Baru Masehi', date: new Date('2026-01-01'), type: 'national' },
      { name: 'Hari Buruh Internasional', date: new Date('2026-05-01'), type: 'national' },
      { name: 'Hari Kemerdekaan RI', date: new Date('2026-08-17'), type: 'national' },
      { name: 'Hari Natal', date: new Date('2026-12-25'), type: 'national' },
    ],
  });

  console.log('Seeding billing settings...');
  const employeeCount = await prisma.employee.count({ where: { status: EmployeeStatus.ACTIVE } });
  await prisma.appSetting.create({
    data: {
      key: 'billing_details',
      value: {
        plan_name: 'Professional Plan',
        price_monthly: 1500000,
        seats_total: 100,
        seats_used: employeeCount,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        card_brand: 'Visa',
        card_last4: '4242',
        card_holder: 'PT. Nusantara Digital Inovasi',
        card_exp: '08/29',
        invoices: [
          { id: 'INV-2026-005', period: 'Mei 2026', amount: 1500000, status: 'Paid', pay_date: '2026-05-01' },
          { id: 'INV-2026-004', period: 'April 2026', amount: 1500000, status: 'Paid', pay_date: '2026-04-01' },
          { id: 'INV-2026-003', period: 'Maret 2026', amount: 1500000, status: 'Paid', pay_date: '2026-03-01' },
          { id: 'INV-2026-002', period: 'Februari 2026', amount: 1500000, status: 'Paid', pay_date: '2026-02-01' },
          { id: 'INV-2026-001', period: 'Januari 2026', amount: 1500000, status: 'Paid', pay_date: '2026-01-01' },
        ],
      },
    },
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
