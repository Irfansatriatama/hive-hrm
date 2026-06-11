'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

const translations = {
  id: {
    // Common Menu / Module Names
    dashboard: "Dasbor",
    attendance: "Kehadiran",
    attendance_today: "Absensi Hari Ini",
    attendance_report: "Laporan Kehadiran",
    attendance_settings: "Pengaturan Kehadiran",
    leave: "Cuti",
    leave_overview: "Ringkasan Cuti",
    leave_apply: "Ajukan Cuti",
    leave_summary: "Rekap Cuti",
    leave_balance: "Kelola Saldo",
    leave_calendar: "Kalender Cuti",
    reward: "Penghargaan",
    reward_home: "Berikan & Tukar Poin",
    reward_hashtag: "Laporan Nilai",
    reward_manage: "Kelola Katalog",
    reward_approval: "Persetujuan Reward",
    reward_transactions: "Ledger Transaksi",
    employee: "Data Karyawan",
    employee_list: "Daftar Karyawan",
    employee_request: "Pengajuan Mandiri",
    employee_grouping: "Grup Kustom",
    approval: "Persetujuan",
    approval_inbox: "Kotak Masuk",
    approval_rules: "Aturan Persetujuan",
    approval_settings: "Pengaturan Alur",
    reporting: "Pusat Laporan",
    reporting_attendance: "Kehadiran",
    reporting_leave: "Cuti",
    reporting_payroll: "Penggajian",
    reporting_headcount: "Headcount",
    reporting_expense: "Pengeluaran",
    company: "Profil Perusahaan",
    billing: "Langganan & Billing",
    settings: "Pengaturan Global",
    settings_overview: "Semua Pengaturan",
    settings_hiring: "Rekrutmen Pipeline",
    settings_procurement: "Aturan Pengadaan",
    settings_custom_form: "Kustom Form Builder",
    settings_leave: "Aturan Cuti",
    settings_assets: "Kategori Aset",
    settings_payroll: "Komponen Gaji",
    settings_expense: "Kategori Pengeluaran",
    settings_others: "Pengaturan Umum",
    modules: "Daftar Modul",
    user_access: "Akses Pengguna",
    announcement: "Pengumuman",
    assets: "Manajemen Aset",
    documents: "Berbagi Dokumen",
    org_chart: "Struktur Organisasi",
    shift: "Jadwal Shift",
    visitor: "Manajemen Tamu",
    procurement: "Pengadaan PO",
    procurement_dashboard: "Dasbor Pengadaan",
    procurement_po: "Purchase Order",
    procurement_report: "Analisis PO",
    payroll: "Penggajian",
    payroll_periods: "Periode Gaji",
    payroll_my_payslips: "Slip Gaji Saya",
    payroll_components: "Komponen Gaji",
    payroll_process: "Proses Gaji",
    payroll_finalize: "Finalisasi",
    onboarding: "Onboarding",
    onboarding_assignments: "Daftar Onboarding",
    onboarding_templates: "Template Onboarding",
    onboarding_tasks: "Daftar Tugas",
    onboarding_my: "Onboarding Saya",
    expense: "Klaim Pengeluaran",
    expense_claims: "Daftar Klaim",
    expense_categories: "Kategori Pengeluaran",
    expense_my: "Klaim Saya",
    expense_submit: "Ajukan Klaim",
    expense_approve: "Setujui",
    expense_reject: "Tolak",
    resources: "Pemesanan Sumber Daya",
    resources_booking: "Kalender Booking",
    resources_calendar: "Kalender",
    resources_manage: "Sumber Daya",
    polls: "Polling & Survei",
    polls_active: "Polling Aktif",
    polls_manage: "Kelola",
    polls_vote: "Vote",
    polls_results: "Hasil",
    licenses: "Lisensi & Sertifikasi",
    licenses_expiring: "Hampir Kadaluarsa",
    licenses_types: "Tipe Lisensi",
    licenses_my: "Lisensi Saya",
    hiring: "Rekrutmen",
    hiring_jobs: "Lowongan",
    hiring_pipeline: "Pipeline Kanban",
    hiring_applications: "Pelamar",

    // Sidebar sections
    sidebar_main: "Utama",
    sidebar_operations: "Operasional",
    sidebar_resources: "Aset & Layanan",
    sidebar_reports: "Laporan",
    sidebar_admin: "Administrasi",
    collapse_sidebar: "Ciutkan Sidebar",

    // Topbar & Common Elements
    search_placeholder: "Cari karyawan, dokumen, aset...",
    notifications: "Notifikasi",
    mark_all_read: "Tandai semua dibaca",
    view_all: "Lihat Semua",
    profile: "Profil Saya",
    logout: "Keluar",
    confirm_logout_title: "Konfirmasi Keluar",
    confirm_logout_msg: "Apakah Anda yakin ingin keluar dari sistem?",
    welcome: "Selamat Datang",
    greeting_morning: "Selamat Pagi",
    greeting_noon: "Selamat Siang",
    greeting_afternoon: "Selamat Sore",
    greeting_evening: "Selamat Malam",
    
    // Actions & Badges
    add: "Tambah",
    edit: "Edit",
    delete: "Hapus",
    detail: "Detail",
    save: "Simpan",
    cancel: "Batal",
    submit: "Submit",
    approve: "Setujui",
    reject: "Tolak",
    status: "Status",
    action: "Aksi",
    search: "Cari",
    export_csv: "Ekspor CSV",
    import_csv: "Impor CSV",
    pending: "Pending",
    approved: "Disetujui",
    rejected: "Ditolak",
    active: "Aktif",
    inactive: "Nonaktif",
    on_leave: "Cuti",
    yes: "Ya",
    no: "Tidak",
    no_data: "Belum ada data",
    loading: "Memuat...",
    all: "Semua",
    date: "Tanggal",

    // Login screen translations
    login_title: "Selamat Datang kembali",
    login_subtitle: "Silakan masuk menggunakan akun demo Anda",
    login_email: "Alamat Email",
    login_password: "Kata Sandi",
    login_forgot: "Lupa kata sandi?",
    login_remember: "Ingat saya untuk 30 hari",
    login_submit: "Masuk",
    login_invalid: "Email atau password salah. Silakan coba lagi.",
    forgot_title: "Reset Kata Sandi",
    forgot_desc: "Masukkan alamat email Anda untuk menerima instruksi pemulihan kata sandi (Simulasi).",
    forgot_label: "Email Pemulihan",
    forgot_success: "Instruksi pemulihan kata sandi telah dikirim ke email Anda (Telah disimulasikan).",
    demo_accounts: "Akun Demo (Klik untuk Isi Otomatis)"
  },
  en: {
    // Common Menu / Module Names
    dashboard: "Dashboard",
    attendance: "Attendance",
    attendance_today: "Today's Attendance",
    attendance_report: "Attendance Report",
    attendance_settings: "Attendance Settings",
    leave: "Leave / Absences",
    leave_overview: "Leave Overview",
    leave_apply: "Apply for Leave",
    leave_summary: "Leave Summary",
    leave_balance: "Manage Balances",
    leave_calendar: "Leave Calendar",
    reward: "Rewards & Points",
    reward_home: "Give & Redeem Points",
    reward_hashtag: "Company Values",
    reward_manage: "Manage Catalog",
    reward_approval: "Reward Approvals",
    reward_transactions: "Transaction Ledger",
    employee: "Employee Directory",
    employee_list: "Employee List",
    employee_request: "Self Service Requests",
    employee_grouping: "Custom Groups",
    approval: "Approvals Inbox",
    approval_inbox: "Approval Inbox",
    approval_rules: "Approval Rules",
    approval_settings: "Workflow Settings",
    reporting: "Reports Hub",
    reporting_attendance: "Attendance",
    reporting_leave: "Leave",
    reporting_payroll: "Payroll",
    reporting_headcount: "Headcount",
    reporting_expense: "Expenses",
    company: "Company Profile",
    billing: "Billing & Plans",
    settings: "System Settings",
    settings_overview: "All Settings",
    settings_hiring: "Hiring Pipeline",
    settings_procurement: "Procurement Rules",
    settings_custom_form: "Custom Form Builder",
    settings_leave: "Leave Settings",
    settings_assets: "Asset Setup",
    settings_payroll: "Payroll Components",
    settings_expense: "Expense Categories",
    settings_others: "General Settings",
    modules: "Module Toggle",
    user_access: "User Permissions",
    announcement: "Announcements",
    assets: "Assets Management",
    documents: "Document Hub",
    org_chart: "Organization Chart",
    shift: "Shift Scheduler",
    visitor: "Visitor System",
    procurement: "Procurement",
    procurement_dashboard: "Procurement Dashboard",
    procurement_po: "Purchase Orders",
    procurement_report: "Purchase Analytics",
    payroll: "Payroll",
    payroll_periods: "Pay Periods",
    payroll_my_payslips: "My Payslips",
    payroll_components: "Salary Components",
    payroll_process: "Process Payroll",
    payroll_finalize: "Finalize",
    onboarding: "Onboarding",
    onboarding_assignments: "Onboarding List",
    onboarding_templates: "Templates",
    onboarding_tasks: "Task List",
    onboarding_my: "My Onboarding",
    expense: "Expense Claims",
    expense_claims: "Claim List",
    expense_categories: "Expense Categories",
    expense_my: "My Claims",
    expense_submit: "Submit Claim",
    expense_approve: "Approve",
    expense_reject: "Reject",
    resources: "Resource Booking",
    resources_booking: "Booking Calendar",
    resources_calendar: "Calendar",
    resources_manage: "Resources",
    polls: "Polling & Survey",
    polls_active: "Active Polls",
    polls_manage: "Manage",
    polls_vote: "Vote",
    polls_results: "Results",
    licenses: "Licenses & Certifications",
    licenses_expiring: "Expiring Soon",
    licenses_types: "License Types",
    licenses_my: "My Licenses",
    hiring: "Hiring",
    hiring_jobs: "Job Postings",
    hiring_pipeline: "Kanban Pipeline",
    hiring_applications: "Applicants",

    // Sidebar sections
    sidebar_main: "Main",
    sidebar_operations: "Operations",
    sidebar_resources: "Assets & Services",
    sidebar_reports: "Reports",
    sidebar_admin: "Administration",
    collapse_sidebar: "Collapse Sidebar",

    // Topbar & Common Elements
    search_placeholder: "Search employees, documents, assets...",
    notifications: "Notifications",
    mark_all_read: "Mark all as read",
    view_all: "View All",
    profile: "My Profile",
    logout: "Log Out",
    confirm_logout_title: "Confirm Log Out",
    confirm_logout_msg: "Are you sure you want to log out of the system?",
    welcome: "Welcome",
    greeting_morning: "Good Morning",
    greeting_noon: "Good Afternoon",
    greeting_afternoon: "Good Afternoon",
    greeting_evening: "Good Evening",

    // Actions & Badges
    add: "Add New",
    edit: "Edit",
    delete: "Delete",
    detail: "View Detail",
    save: "Save Changes",
    cancel: "Cancel",
    submit: "Submit",
    approve: "Approve",
    reject: "Reject",
    status: "Status",
    action: "Action",
    search: "Search",
    export_csv: "Export CSV",
    import_csv: "Import CSV",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    active: "Active",
    inactive: "Inactive",
    on_leave: "On Leave",
    yes: "Yes",
    no: "No",
    no_data: "No data available",
    loading: "Loading...",
    all: "All",
    date: "Date",

    // Login screen translations
    login_title: "Welcome Back",
    login_subtitle: "Please sign in using your demo account",
    login_email: "Email Address",
    login_password: "Password",
    login_forgot: "Forgot password?",
    login_remember: "Remember me for 30 days",
    login_submit: "Sign In",
    login_invalid: "Invalid email or password. Please try again.",
    forgot_title: "Reset Password",
    forgot_desc: "Enter your email address to receive password recovery instructions (Simulated).",
    forgot_label: "Recovery Email",
    forgot_success: "Password recovery instructions have been sent to your email (Simulated).",
    demo_accounts: "Demo Accounts (Click to Autofill)"
  }
};

interface I18nContextProps {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('id');

  useEffect(() => {
    const stored = localStorage.getItem('hive_language') as Language;
    if (stored === 'id' || stored === 'en') {
      setLang(stored);
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('hive_language', newLang);
  };

  const t = (key: string, fallback = '') => {
    const dict = (translations[lang] || translations['id']) as Record<string, string>;
    return dict[key] || fallback || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
