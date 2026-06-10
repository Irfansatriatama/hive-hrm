'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

const translations = {
  id: {
    // Common Menu / Module Names
    dashboard: "Dasbor",
    attendance: "Kehadiran",
    attendance_report: "Laporan Kehadiran",
    attendance_settings: "Pengaturan Kehadiran",
    leave: "Cuti",
    leave_apply: "Ajukan Cuti",
    leave_summary: "Rekap Cuti",
    leave_balance: "Kelola Saldo",
    leave_calendar: "Kalender Cuti",
    reward: "Penghargaan",
    reward_hashtag: "Laporan Nilai",
    reward_manage: "Kelola Katalog",
    reward_approval: "Persetujuan Reward",
    reward_transactions: "Ledger Transaksi",
    employee: "Data Karyawan",
    employee_request: "Pengajuan Mandiri",
    employee_grouping: "Grup Kustom",
    approval: "Persetujuan",
    approval_rules: "Aturan Persetujuan",
    approval_settings: "Pengaturan Alur",
    reporting: "Pusat Laporan",
    company: "Profil Perusahaan",
    billing: "Langganan & Billing",
    settings: "Pengaturan Global",
    settings_hiring: "Rekrutmen Pipeline",
    settings_procurement: "Aturan Pengadaan",
    settings_custom_form: "Kustom Form Builder",
    settings_leave: "Aturan Cuti",
    settings_assets: "Kategori Aset",
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
    procurement_po: "Purchase Order",
    procurement_report: "Analisis PO",

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
    date: "Tanggal"
  },
  en: {
    // Common Menu / Module Names
    dashboard: "Dashboard",
    attendance: "Attendance",
    attendance_report: "Attendance Report",
    attendance_settings: "Attendance Settings",
    leave: "Leave / Absences",
    leave_apply: "Apply for Leave",
    leave_summary: "Leave Summary",
    leave_balance: "Manage Balances",
    leave_calendar: "Leave Calendar",
    reward: "Rewards & Points",
    reward_hashtag: "Company Values",
    reward_manage: "Manage Catalog",
    reward_approval: "Reward Approvals",
    reward_transactions: "Transaction Ledger",
    employee: "Employee Directory",
    employee_request: "Self Service Requests",
    employee_grouping: "Custom Groups",
    approval: "Approvals Inbox",
    approval_rules: "Approval Rules",
    approval_settings: "Workflow Settings",
    reporting: "Reports Hub",
    company: "Company Profile",
    billing: "Billing & Plans",
    settings: "System Settings",
    settings_hiring: "Hiring Pipeline",
    settings_procurement: "Procurement Rules",
    settings_custom_form: "Custom Form Builder",
    settings_leave: "Leave Settings",
    settings_assets: "Asset Setup",
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
    procurement_po: "Purchase Orders",
    procurement_report: "Purchase Analytics",

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
    date: "Date"
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
