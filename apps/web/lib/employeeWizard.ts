export interface EmployeeWizardData {
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  religion?: string;
  maritalStatus?: string;
  bloodType?: string;
  phone?: string;
  email?: string;
  address?: string;
  joinDate?: string;
  status?: string;
  employmentType?: string;
  departmentId?: string;
  positionId?: string;
  directManagerId?: string;
  workLocation?: string;
  workEmail?: string;
  basicSalary?: number;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  taxStatus?: string;
  bpjsKes?: string;
  bpjsTk?: string;
  npwp?: string;
  ktp?: string;
  kk?: string;
}

export interface EmployeeWizardSource {
  id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  gender?: string;
  birth_date?: string | null;
  birth_place?: string | null;
  religion?: string | null;
  marital_status?: string | null;
  blood_type?: string | null;
  phone?: string;
  email?: string;
  address?: string | null;
  join_date?: string | null;
  status?: string;
  employment_type?: string;
  department_id?: string | null;
  position_id?: string | null;
  direct_manager_id?: string | null;
  work_location?: string;
  work_email?: string;
  basic_salary?: number;
  bank_name?: string;
  bank_account?: string;
  bank_account_name?: string;
  tax_status?: string;
  bpjs_kes?: string;
  bpjs_tk?: string;
  npwp?: string;
  ktp?: string;
  kk?: string;
}

export function toDateInput(value?: string | null) {
  if (!value) return '';
  return value.split('T')[0];
}

export function employeeToWizardData(emp: EmployeeWizardSource): EmployeeWizardData {
  return {
    firstName: emp.first_name ?? '',
    lastName: emp.last_name ?? '',
    gender: emp.gender ?? 'male',
    birthDate: toDateInput(emp.birth_date),
    birthPlace: emp.birth_place ?? '',
    religion: emp.religion ?? 'Islam',
    maritalStatus: emp.marital_status ?? 'single',
    bloodType: emp.blood_type ?? 'O',
    phone: emp.phone ?? '',
    email: emp.email ?? '',
    address: emp.address ?? '',
    joinDate: toDateInput(emp.join_date),
    status: (emp.status ?? 'ACTIVE').toUpperCase(),
    employmentType: emp.employment_type ?? 'permanent',
    departmentId: emp.department_id ?? '',
    positionId: emp.position_id ?? '',
    directManagerId: emp.direct_manager_id ?? '',
    workLocation: emp.work_location ?? 'Head Office',
    workEmail: emp.work_email ?? '',
    basicSalary: emp.basic_salary ?? 5000000,
    bankName: emp.bank_name ?? 'BCA',
    bankAccount: emp.bank_account ?? '',
    bankAccountName: emp.bank_account_name ?? emp.full_name ?? '',
    taxStatus: emp.tax_status ?? 'TK/0',
    bpjsKes: emp.bpjs_kes ?? '',
    bpjsTk: emp.bpjs_tk ?? '',
    npwp: emp.npwp ?? '',
    ktp: emp.ktp ?? '',
    kk: emp.kk ?? '',
  };
}

export function defaultWizardData(): EmployeeWizardData {
  return {
    gender: 'male',
    maritalStatus: 'single',
    bloodType: 'O',
    status: 'ACTIVE',
    employmentType: 'permanent',
    taxStatus: 'TK/0',
    basicSalary: 5000000,
    bankName: 'BCA',
    workLocation: 'Head Office',
  };
}

export function validateWizardStep(
  step: number,
  data: EmployeeWizardData
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!data.firstName) errors.firstName = 'Nama Depan wajib diisi';
    if (!data.lastName) errors.lastName = 'Nama Belakang wajib diisi';
    if (!data.phone) errors.phone = 'Nomor Telepon wajib diisi';
    if (!data.email) errors.email = 'Email Pribadi wajib diisi';
  } else if (step === 2) {
    if (!data.joinDate) errors.joinDate = 'Tanggal Bergabung wajib diisi';
  } else if (step === 3) {
    if (!data.basicSalary) errors.basicSalary = 'Gaji Pokok wajib diisi';
    if (!data.ktp) errors.ktp = 'Nomor KTP wajib diisi';
  }
  return errors;
}
