import { PrismaClient, EmployeeStatus } from '@prisma/client';
import { DEFAULT_ROLES, DEFAULT_PERMISSION_MATRIX, PERMISSION_MATRIX_MODULES } from '../src/core/default-roles';
import { hashPassword } from 'better-auth/crypto';
import { DEFAULT_SYSTEM_MODULES } from '@hive-hrm/types';

const prisma = new PrismaClient();

const SUPERADMIN_EMAIL = 'superadmin@hive.id';
const SUPERADMIN_PASSWORD = 'Admin@1234';

function buildFullSuperAdminPermissionMatrix(): Record<string, string[]> {
  const matrix: Record<string, string[]> = {};
  for (const mod of PERMISSION_MATRIX_MODULES) {
    const roles = new Set(DEFAULT_PERMISSION_MATRIX[mod.key] || []);
    roles.add('SUPER_ADMIN');
    matrix[mod.key] = Array.from(roles);
  }
  return matrix;
}

async function main() {
  const hashedPassword = await hashPassword(SUPERADMIN_PASSWORD);
  console.log('Clearing database tables...');
  
  // Clear tables in dependency order
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.rewardPointTransaction.deleteMany();
  await prisma.rewardRedemption.deleteMany();
  await prisma.employeePointBalance.deleteMany();
  await prisma.rewardHashtag.deleteMany();
  await prisma.rewardCatalogItem.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.announcementRead.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.document.deleteMany();
  await prisma.documentFolder.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.shiftSwap.deleteMany();
  await prisma.employeeShiftSchedule.deleteMany();
  await prisma.payrollItem.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.payrollPeriod.deleteMany();
  await prisma.payrollComponent.deleteMany();
  await prisma.onboardingTaskProgress.deleteMany();
  await prisma.onboardingAssignment.deleteMany();
  await prisma.onboardingTemplateTask.deleteMany();
  await prisma.onboardingTemplate.deleteMany();
  await prisma.expenseClaimItem.deleteMany();
  await prisma.expenseClaim.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.publicHoliday.deleteMany();
  await prisma.applicationFormField.deleteMany();
  await prisma.recruitmentSource.deleteMany();
  await prisma.jobTemplate.deleteMany();
  await prisma.hiringPipelineStage.deleteMany();
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
      { name: 'Morning Shift', startTime: '06:00', endTime: '14:00', color: '#3B82F6', breakTime: 60, isDefault: false },
      { name: 'Day Shift', startTime: '08:00', endTime: '17:00', color: '#10B981', breakTime: 60, isDefault: true },
      { name: 'Afternoon Shift', startTime: '14:00', endTime: '22:00', color: '#F59E0B', breakTime: 60, isDefault: false },
      { name: 'Night Shift', startTime: '22:00', endTime: '06:00', color: '#EF4444', breakTime: 60, isDefault: false },
      { name: 'Split Shift', startTime: '08:00', endTime: '20:00', color: '#8B5CF6', split: true, breakTime: 60, isDefault: false },
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
    { id: 'EMP000', first: 'System', last: 'Administrator', pos: 'POS001', dept: 'DEPT001', manager: null, gender: 'male', email: SUPERADMIN_EMAIL, salary: 50000000 },
    { id: 'EMP001', first: 'Arief', last: 'Budiman', pos: 'POS002', dept: 'DEPT001', manager: 'EMP000', gender: 'male', email: 'arief.budiman@hive.id', salary: 35000000 },
    { id: 'EMP002', first: 'Sari', last: 'Dewi Lestari', pos: 'POS011', dept: 'DEPT002', manager: 'EMP000', gender: 'female', email: 'hradmin@hive.id', salary: 20000000 },
    { id: 'EMP003', first: 'Budi', last: 'Santoso', pos: 'POS003', dept: 'DEPT001', manager: 'EMP001', gender: 'male', email: 'manager@hive.id', salary: 18000000 },
    { id: 'EMP004', first: 'Rina', last: 'Agustina', pos: 'POS004', dept: 'DEPT001', manager: 'EMP003', gender: 'female', email: 'karyawan@hive.id', salary: 9500000 },
    { id: 'EMP005', first: 'Reza', last: 'Firmansyah', pos: 'POS014', dept: 'DEPT003', manager: 'EMP000', gender: 'male', email: 'reza.firmansyah@hive.id', salary: 19000000 },
    { id: 'EMP006', first: 'Anisa', last: 'Rahmawati', pos: 'POS017', dept: 'DEPT004', manager: 'EMP000', gender: 'female', email: 'anisa.rahmawati@hive.id', salary: 17500000 },
    { id: 'EMP007', first: 'Doni', last: 'Prasetyo', pos: 'POS008', dept: 'DEPT001', manager: 'EMP003', gender: 'male', email: 'doni.prasetyo@hive.id', salary: 11000000 },
    { id: 'EMP008', first: 'Fitri', last: 'Nuraini', pos: 'POS012', dept: 'DEPT002', manager: 'EMP002', gender: 'female', email: 'fitri.nuraini@hive.id', salary: 6500000 },
    { id: 'EMP009', first: 'Galih', last: 'Wicaksono', pos: 'POS009', dept: 'DEPT001', manager: 'EMP001', gender: 'male', email: 'galih.wicaksono@hive.id', salary: 15000000 },
    { id: 'EMP010', first: 'Hani', last: 'Kusuma Dewi', pos: 'POS007', dept: 'DEPT001', manager: 'EMP009', gender: 'female', email: 'hani.kusuma@hive.id', salary: 8500000 },
    { id: 'EMP011', first: 'Irfan', last: 'Setiawan', pos: 'POS015', dept: 'DEPT003', manager: 'EMP005', gender: 'male', email: 'irfan.setiawan@hive.id', salary: 8500000 },
    { id: 'EMP012', first: 'Joko', last: 'Widodo Santoso', pos: 'POS020', dept: 'DEPT005', manager: 'EMP000', gender: 'male', email: 'joko.widodo@hive.id', salary: 16000000 },
    { id: 'EMP013', first: 'Kartika', last: 'Sari', pos: 'POS018', dept: 'DEPT004', manager: 'EMP006', gender: 'female', email: 'kartika.sari@hive.id', salary: 7000000 },
    { id: 'EMP014', first: 'Lutfi', last: 'Hakim', pos: 'POS005', dept: 'DEPT001', manager: 'EMP003', gender: 'male', email: 'lutfi.hakim@hive.id', salary: 9000000 },
    { id: 'EMP015', first: 'Mia', last: 'Ramadhani', pos: 'POS021', dept: 'DEPT006', manager: 'EMP000', gender: 'female', email: 'mia.ramadhani@hive.id', salary: 11000000 },
    { id: 'EMP016', first: 'Nanda', last: 'Purnama', pos: 'POS010', dept: 'DEPT001', manager: 'EMP009', gender: 'female', email: 'nanda.purnama@hive.id', salary: 8000000 },
    { id: 'EMP017', first: 'Oki', last: 'Setiawan', pos: 'POS006', dept: 'DEPT001', manager: 'EMP003', gender: 'male', email: 'oki.setiawan@hive.id', salary: 7500000 },
    { id: 'EMP018', first: 'Dani', last: 'Firmansyah', pos: 'POS016', dept: 'DEPT003', manager: 'EMP005', gender: 'male', email: 'finance@hive.id', salary: 12000000 },
    { id: 'EMP019', first: 'Qori', last: 'Abdillah', pos: 'POS019', dept: 'DEPT004', manager: 'EMP006', gender: 'male', email: 'qori.abdillah@hive.id', salary: 7500000 },
    { id: 'EMP020', first: 'Ratna', last: 'Komala', pos: 'POS013', dept: 'DEPT002', manager: 'EMP002', gender: 'female', email: 'ratna.komala@hive.id', salary: 8000000 },
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
        managerId: emp.manager,
        joinDate: new Date('2022-01-15'),
      },
    });
  }

  console.log('Seeding onboarding template...');
  await prisma.onboardingTemplate.create({
    data: {
      name: 'Standard Onboarding Karyawan Baru',
      description: 'Template onboarding standar untuk semua karyawan baru',
      tasks: {
        create: [
          { title: 'Pengurusan Dokumen Kontrak', category: 'document', dueAfterDays: 1, assignedTo: 'hr', sortOrder: 1 },
          { title: 'Setup Akun Email & Sistem', category: 'access', dueAfterDays: 1, assignedTo: 'hr', sortOrder: 2 },
          { title: 'Pengenalan Tim & Departemen', category: 'training', dueAfterDays: 3, assignedTo: 'manager', sortOrder: 3 },
          { title: 'Penerimaan Peralatan Kerja', category: 'equipment', dueAfterDays: 3, assignedTo: 'hr', sortOrder: 4 },
          { title: 'Orientasi Kebijakan Perusahaan', category: 'training', dueAfterDays: 7, assignedTo: 'employee', sortOrder: 5 },
          { title: 'Penyelesaian Data Profil', category: 'document', dueAfterDays: 7, assignedTo: 'employee', sortOrder: 6 },
          { title: 'Meeting Review Pertama dengan Manager', category: 'training', dueAfterDays: 14, assignedTo: 'manager', sortOrder: 7 },
        ],
      },
    },
  });

  console.log('Seeding payroll components...');
  await prisma.payrollComponent.createMany({
    data: [
      { name: 'Gaji Pokok', type: 'earning', category: 'basic', isDefault: true, isFixed: true, taxable: true, sortOrder: 1 },
      { name: 'Tunjangan Makan', type: 'earning', category: 'allowance', isDefault: true, isFixed: true, taxable: false, sortOrder: 2 },
      { name: 'BPJS Ketenagakerjaan', type: 'deduction', category: 'bpjs', isDefault: true, isFixed: false, taxable: false, sortOrder: 10 },
      { name: 'BPJS Kesehatan', type: 'deduction', category: 'bpjs', isDefault: true, isFixed: false, taxable: false, sortOrder: 11 },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding expense categories...');
  await prisma.expenseCategory.createMany({
    data: [
      { name: 'Transportasi', code: 'TRANS', requireReceipt: true },
      { name: 'Akomodasi', code: 'HOTEL', requireReceipt: true },
      { name: 'Makan & Entertain', code: 'MEAL', requireReceipt: false, maxAmount: 500000 },
      { name: 'Perlengkapan Kantor', code: 'OFFICE', requireReceipt: true },
      { name: 'Komunikasi', code: 'COMM', requireReceipt: false },
      { name: 'Lain-lain', code: 'OTHER', requireReceipt: false },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding superadmin account...');
  const superAdminUser = await prisma.user.create({
    data: {
      email: SUPERADMIN_EMAIL,
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
      emailVerified: true,
      status: 'active',
    },
  });

  await prisma.employee.update({
    where: { id: 'EMP000' },
    data: { userId: superAdminUser.id },
  });

  await prisma.account.create({
    data: {
      userId: superAdminUser.id,
      accountId: SUPERADMIN_EMAIL,
      providerId: 'credential',
      password: hashedPassword,
    },
  });

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
    data: { key: 'permission_matrix', value: buildFullSuperAdminPermissionMatrix() as any },
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

  console.log('Seeding announcements...');
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Kebijakan Cuti Bersama Idul Fitri 1447H',
        content:
          'Diberitahukan kepada seluruh karyawan bahwa cuti bersama Idul Fitri ditetapkan dari tanggal 18 Maret sampai 22 Maret 2026. Operasional kantor akan diliburkan secara penuh selama periode tersebut.',
        target: 'all',
        isPinned: true,
        status: 'published',
        publishDate: new Date('2026-05-25'),
        expireDate: new Date('2026-06-15'),
        createdBy: 'Sari Dewi Lestari',
      },
      {
        title: 'Townhall Meeting Triwulan II - 2026',
        content:
          'Undangan Townhall Meeting Triwulan II untuk seluruh divisi pada Jumat, 12 Juni 2026, pukul 14:00 WIB di Main Auditorium. CEO akan memaparkan update kinerja kuartal lalu serta arah strategi korporasi ke depan.',
        target: 'all',
        isPinned: false,
        status: 'published',
        publishDate: new Date('2026-06-01'),
        expireDate: new Date('2026-06-13'),
        createdBy: 'Arief Budiman',
      },
      {
        title: 'Pelatihan Kemanan Data & ISO 27001 - Divisi IT',
        content:
          'Wajib bagi seluruh staff Teknologi dan Produk untuk mengikuti seminar ISO 27001 yang akan diadakan secara online pada Senin depan pukul 09:00 WIB.',
        target: 'DEPT001',
        isPinned: false,
        status: 'published',
        publishDate: new Date('2026-06-08'),
        expireDate: new Date('2026-06-16'),
        createdBy: 'Arief Budiman',
      },
    ],
  });

  console.log('Seeding document folders & sample documents...');
  const documentFolders = [
    'Peraturan Perusahaan',
    'Panduan Karyawan',
    'Formulir',
    'HR Policies',
    'Template Surat',
  ];
  await prisma.documentFolder.createMany({
    data: documentFolders.map((name) => ({ name })),
  });
  await prisma.document.createMany({
    data: [
      {
        name: 'Peraturan Perusahaan NDI 2026.pdf',
        category: 'Peraturan Perusahaan',
        fileUrl: 'https://cloudinary.com/simulated/peraturan_2026.pdf',
        fileType: 'PDF',
        fileSize: 2516582,
        visibility: 'all',
        isPublic: true,
      },
      {
        name: 'Handbook Karyawan Baru.pdf',
        category: 'Panduan Karyawan',
        fileUrl: 'https://cloudinary.com/simulated/handbook.pdf',
        fileType: 'PDF',
        fileSize: 5347737,
        visibility: 'all',
        isPublic: true,
      },
      {
        name: 'Formulir Klaim Medis Rawat Jalan.docx',
        category: 'Formulir',
        fileUrl: 'https://cloudinary.com/simulated/klaim_medis.docx',
        fileType: 'DOC',
        fileSize: 122880,
        visibility: 'all',
        isPublic: true,
      },
      {
        name: 'Struktur Organisasi 2026.jpg',
        category: 'HR Policies',
        fileUrl: 'https://cloudinary.com/simulated/org_chart.jpg',
        fileType: 'IMG',
        fileSize: 870400,
        visibility: 'all',
        isPublic: true,
      },
      {
        name: 'Format Surat Pengunduran Diri.docx',
        category: 'Template Surat',
        fileUrl: 'https://cloudinary.com/simulated/resign_template.docx',
        fileType: 'DOC',
        fileSize: 97280,
        visibility: 'all',
        isPublic: true,
      },
    ],
  });

  console.log('Seeding attendance settings...');
  await prisma.appSetting.create({
    data: {
      key: 'attendance_settings',
      value: {
        check_in_limit: '08:00',
        check_out_limit: '17:00',
        late_tolerance: 15,
        early_checkout_tolerance: 10,
        overtime_start_delay: 30,
        overtime_calculation_method: 'hourly',
        working_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
        fingerprint_integration: false,
      },
    },
  });

  console.log('Seeding reward settings...');
  await prisma.appSetting.create({
    data: {
      key: 'reward_settings',
      value: {
        max_give_daily: 100,
        max_receive_monthly: 500,
        manager_multiplier: 1.5,
      },
    },
  });

  console.log('Seeding reward catalog...');
  const rewardCatalog = [
    { id: 'RWD001', name: 'Voucher Sodexo Rp 100k', description: 'Dapat ditukarkan di berbagai merchant supermarket dan restoran', points: 100, stock: 25, category: 'Voucher', status: 'active' },
    { id: 'RWD002', name: 'Extra Day Off', description: 'Satu hari cuti ekstra berbayar yang bisa ditambahkan ke saldo Anda', points: 250, stock: 10, category: 'Benefit', status: 'active' },
    { id: 'RWD003', name: 'HIVE HRM Custom Hoodie', description: 'Hoodie eksklusif dengan bordir logo HIVE berkualitas premium', points: 500, stock: 15, category: 'Merchandise', status: 'active' },
    { id: 'RWD004', name: 'Voucher Kopi Janji Jiwa Rp 50k', description: 'Voucher elektronik senilai Rp 50.000', points: 50, stock: 50, category: 'Voucher', status: 'active' },
    { id: 'RWD005', name: 'Bose SoundLink Speaker', description: 'Speaker bluetooth portable dengan suara jernih premium', points: 2500, stock: 2, category: 'Elektronik', status: 'active' },
    { id: 'RWD006', name: 'Tiket Nonton XXI', description: '2 tiket nonton studio reguler XXI', points: 120, stock: 20, category: 'Hiburan', status: 'active' },
  ];
  for (const item of rewardCatalog) {
    await prisma.rewardCatalogItem.create({ data: item });
  }

  console.log('Seeding reward hashtags...');
  const rewardHashtags = [
    { tag: '#Inovatif', description: 'Menciptakan terobosan baru dan cara kerja kreatif', usageCount: 24, status: 'active' },
    { tag: '#Kolaborasi', description: 'Bekerja sama lintas tim dengan harmoni dan saling mendukung', usageCount: 35, status: 'active' },
    { tag: '#ProAktif', description: 'Mengambil inisiatif sebelum diminta demi kebaikan bersama', usageCount: 18, status: 'active' },
    { tag: '#Jujur', description: 'Mengedepankan kebenaran, transparansi, dan integritas tinggi', usageCount: 12, status: 'active' },
    { tag: '#Bertumbuh', description: 'Haus belajar dan selalu ingin meningkatkan kapasitas diri', usageCount: 15, status: 'active' },
    { tag: '#Integritas', description: 'Komitmen moral yang kokoh pada prinsip etika kerja', usageCount: 20, status: 'active' },
    { tag: '#CustomerFirst', description: 'Memprioritaskan kepuasan klien dan user', usageCount: 28, status: 'active' },
    { tag: '#Disiplin', description: 'Tepat waktu dan bertanggung jawab atas tugasnya', usageCount: 14, status: 'active' },
  ];
  for (const ht of rewardHashtags) {
    await prisma.rewardHashtag.create({ data: ht });
  }

  console.log('Seeding employee point balances & sample transactions...');
  const employeeIds = employeesData.map(e => e.id);
  const balances: Record<string, number> = {};
  for (const empId of employeeIds) {
    const balance = 100 + Math.floor(Math.random() * 800);
    balances[empId] = balance;
    await prisma.employeePointBalance.create({
      data: { employeeId: empId, balance },
    });
  }

  for (let i = 1; i <= 30; i++) {
    const fromIdx = i % employeeIds.length;
    const toIdx = (i + 3) % employeeIds.length;
    const fromId = employeeIds[fromIdx];
    const toId = employeeIds[toIdx];
    if (fromId === toId) continue;

    const fromEmp = employeesData.find(e => e.id === fromId)!;
    const toEmp = employeesData.find(e => e.id === toId)!;
    const ht = rewardHashtags[i % rewardHashtags.length];
    const points = 10 * ((i % 3) + 1);
    const txDate = new Date();
    txDate.setDate(txDate.getDate() - (30 - i));

    balances[toId] += points;
    await prisma.employeePointBalance.update({
      where: { employeeId: toId },
      data: { balance: balances[toId] },
    });

    await prisma.rewardPointTransaction.create({
      data: {
        employeeId: toId,
        senderEmployeeId: fromId,
        type: 'received',
        points,
        hashtag: ht.tag,
        message: `Terima kasih atas bantuannya dalam menyelesaikan ${i % 2 === 0 ? 'proyek migrasi server' : 'desain presentasi klien'}. Kerja kerasmu sangat membantu!`,
        balanceAfter: balances[toId],
        counterpartyName: `${fromEmp.first} ${fromEmp.last}`,
        createdAt: txDate,
      },
    });
  }

  console.log('Seeding reward redemptions...');
  await prisma.rewardRedemption.create({
    data: {
      id: 'RED001',
      employeeId: 'EMP004',
      rewardCatalogId: 'RWD001',
      points: 100,
      status: 'approved',
      dateProcessed: new Date('2026-06-02'),
      notes: 'Kode voucher dikirim via email',
      createdAt: new Date('2026-06-01'),
    },
  });
  await prisma.rewardRedemption.create({
    data: {
      id: 'RED002',
      employeeId: 'EMP007',
      rewardCatalogId: 'RWD003',
      points: 500,
      status: 'pending',
      createdAt: new Date('2026-06-05'),
    },
  });

  console.log('Seeding visitors...');
  const visitors = [
    {
      id: 'VIS001',
      badgeNumber: 'V-001',
      visitorName: 'Andi Wijaya',
      company: 'PT. Mitra Sejahtera',
      idType: 'KTP',
      idNumber: '3201021503920002',
      phone: '08123456789',
      email: 'andi@mitra.co.id',
      purpose: 'Meeting bisnis pengembangan sistem',
      hostEmployeeId: 'EMP003',
      vehicleNumber: 'B 1234 ABC',
      checkIn: new Date('2026-06-09T09:30:00'),
      checkOut: new Date('2026-06-09T11:15:00'),
      status: 'checked_out',
      notes: 'Sudah selesai',
    },
    {
      id: 'VIS002',
      badgeNumber: 'V-002',
      visitorName: 'Dewi Lestari',
      company: 'BPJS Kesehatan',
      idType: 'KTP',
      idNumber: '3201026005900004',
      phone: '08198765432',
      email: 'dewi@bpjs.go.id',
      purpose: 'Sosialisasi update program jaminan',
      hostEmployeeId: 'EMP002',
      vehicleNumber: 'B 7789 XYZ',
      checkIn: new Date('2026-06-09T10:00:00'),
      checkOut: null,
      status: 'checked_in',
      notes: 'Lantai 3',
    },
    {
      id: 'VIS003',
      badgeNumber: 'V-003',
      visitorName: 'Roy Kiyoshi',
      company: 'Gojek Indonesia',
      idType: 'SIM',
      idNumber: '8809182394',
      phone: '08521199334',
      email: 'roy.k@gojek.com',
      purpose: 'Kunjungan kurir instan PO',
      hostEmployeeId: 'EMP005',
      vehicleNumber: 'F 4321 AC',
      checkIn: new Date('2026-06-09T11:45:00'),
      checkOut: null,
      status: 'checked_in',
      notes: 'Kirim invoice',
    },
    {
      id: 'VIS004',
      badgeNumber: 'V-004',
      visitorName: 'Joni Iskandar',
      company: 'PT. Sarana Jaya',
      idType: 'KTP',
      idNumber: '3201101004880005',
      phone: '0811223344',
      email: 'joni@saranajaya.com',
      purpose: 'Survei AC kantor pusat',
      hostEmployeeId: 'EMP012',
      vehicleNumber: 'B 9901 AA',
      checkIn: new Date('2026-06-09T08:30:00'),
      checkOut: new Date('2026-06-09T10:30:00'),
      status: 'checked_out',
      notes: 'Instalasi selesai',
    },
  ];
  for (const visitor of visitors) {
    await prisma.visitor.create({ data: visitor });
  }

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

  console.log('Seeding hiring settings...');
  await prisma.hiringPipelineStage.createMany({
    data: [
      { name: 'Screening Resume', sequence: 1, pic: 'Fitri Nuraini', duration: 3 },
      { name: 'Psikotes / Technical Test', sequence: 2, pic: 'Fitri Nuraini', duration: 5 },
      { name: 'Wawancara HR', sequence: 3, pic: 'Sari Dewi Lestari', duration: 4 },
      { name: 'Wawancara User (Tech Lead)', sequence: 4, pic: 'Budi Santoso', duration: 7 },
      { name: 'Offering Letter', sequence: 5, pic: 'Sari Dewi Lestari', duration: 3 },
      { name: 'Onboarding Coordinator', sequence: 6, pic: 'Ratna Komala', duration: 1 },
    ],
  });
  await prisma.jobTemplate.createMany({
    data: [
      {
        position: 'Senior Full Stack Engineer',
        description: 'Membangun dan memelihara aplikasi inti HIVE HRM.',
        qualification: 'Pengalaman 5+ tahun PHP/React/Vue. Terbiasa dengan clean architecture.',
        benefits: 'Gaji kompetitif, Asuransi swasta, WFH 2 hari seminggu.',
      },
      {
        position: 'HR Generalist Specialist',
        description: 'Mengelola administrasi kepengurusan karyawan, onboarding, dan payroll.',
        qualification: 'S1 Psikologi/Hukum. Paham UU Ketenagakerjaan.',
        benefits: 'BPJS, Bonus tahunan, Katering makan siang.',
      },
    ],
  });
  await prisma.recruitmentSource.createMany({
    data: [
      { name: 'LinkedIn Profile Apply', active: true },
      { name: 'Jobstreet Portal', active: true },
      { name: 'Website Karir Internal', active: true },
      { name: 'Rekomendasi Karyawan (Referral)', active: true },
      { name: 'Walk-in Interview & Drop CV', active: false },
    ],
  });
  await prisma.applicationFormField.createMany({
    data: [
      { key: 'full_name', label: 'Nama Lengkap Karyawan', required: true, isSystem: true, sortOrder: 1 },
      { key: 'email', label: 'Email Pribadi', required: true, isSystem: true, sortOrder: 2 },
      { key: 'phone', label: 'Nomor Telepon', required: true, isSystem: true, sortOrder: 3 },
      { key: 'resume', label: 'Berkas CV / Resume PDF', required: true, isSystem: false, sortOrder: 4 },
      { key: 'portfolio', label: 'Tautan Portofolio / GitHub Link', required: false, isSystem: false, sortOrder: 5 },
      { key: 'expected_salary', label: 'Ekspektasi Gaji Bulanan (IDR)', required: true, isSystem: false, sortOrder: 6 },
      { key: 'notice_period', label: 'Masa Notice Pengunduran Diri (Hari)', required: false, isSystem: false, sortOrder: 7 },
      { key: 'emergency_contact', label: 'Kontak Darurat Kerabat', required: false, isSystem: false, sortOrder: 8 },
    ],
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
