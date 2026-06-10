'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as Lucide from 'lucide-react';
import { useLayout } from '@/lib/layout-context';
import { useI18n, Language } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';

interface NotificationItem {
  id: string;
  user_id: string; // role or 'all'
  title: string;
  message: string;
  type: 'info' | 'approval' | 'reward' | 'announcement';
  created_at: string;
  read: boolean;
  link?: string;
}

interface SearchResult {
  type: 'employee' | 'document' | 'asset';
  id: string;
  name: string;
  subText: string;
  link: string;
}

export default function Topbar() {
  const { toggleMobile } = useLayout();
  const { lang, setLanguage, t } = useI18n();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Dropdown States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Search input & results
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Refs for click outside
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Sync / initialize notifications in localStorage
  useEffect(() => {
    const initNotifications = () => {
      const stored = localStorage.getItem('hive_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        const defaultNotifs: NotificationItem[] = [
          {
            id: 'n1',
            user_id: 'SUPER_ADMIN',
            title: 'Pengajuan Cuti Baru',
            message: 'Maya Putri Handayani mengajukan cuti tahunan selama 3 hari.',
            type: 'approval',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
            read: false,
            link: '/approval',
          },
          {
            id: 'n2',
            user_id: 'all',
            title: 'Pengumuman Penting',
            message: 'Townhall Meeting Q3 diadakan pada Jumat ini pukul 14:00 WIB.',
            type: 'announcement',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            read: false,
            link: '/announcement',
          },
          {
            id: 'n3',
            user_id: 'EMPLOYEE',
            title: 'Poin Reward Diterima',
            message: 'Selamat! Anda menerima 50 poin dari Budi Santoso dengan hashtag #TeamWork.',
            type: 'reward',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            read: true,
            link: '/reward/transactions',
          },
        ];
        localStorage.setItem('hive_notifications', JSON.stringify(defaultNotifs));
        setNotifications(defaultNotifs);
      }
    };
    initNotifications();

    // Listen to storage events to keep notifications synced in other places
    const handleStorage = () => {
      const stored = localStorage.getItem('hive_notifications');
      if (stored) setNotifications(JSON.parse(stored));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Click outside handler
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(target)) {
        setIsUserOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  // Filter notifications by user role
  const userRole = user?.role || 'EMPLOYEE';
  const relevantNotifs = notifications.filter(
    n => n.user_id === userRole || n.user_id === 'all'
  );
  const unreadCount = relevantNotifs.filter(n => !n.read).length;

  // Breadcrumbs Generator
  const generateBreadcrumbs = () => {
    const pathParts = pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      <Link key="home" href="/dashboard" className="hover:text-primary transition font-semibold text-slate-800">
        HIVE
      </Link>
    ];

    pathParts.forEach((part, index) => {
      // Don't duplicate dashboard
      if (part === 'dashboard' && index === 0) return;
      
      const translationKey = part.replace('-', '_');
      const label = t(translationKey, part);
      const url = '/' + pathParts.slice(0, index + 1).join('/');

      breadcrumbs.push(
        <span key={`separator-${index}`} className="text-slate-300 font-normal">/</span>
      );

      if (index === pathParts.length - 1) {
        breadcrumbs.push(
          <span key={`label-${index}`} className="text-slate-500 font-medium capitalize">
            {label}
          </span>
        );
      } else {
        breadcrumbs.push(
          <Link key={`link-${index}`} href={url} className="hover:text-primary transition font-semibold text-slate-800 capitalize">
            {label}
          </Link>
        );
      }
    });

    return breadcrumbs;
  };

  // Search Engine
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    // Mock search corpus mirroring the realistic seed database
    const mockEmployees = [
      { id: 'EMP001', name: 'Arief Budiman', dept: 'Teknologi & Produk', role: 'Head of Tech' },
      { id: 'EMP002', name: 'Sari Dewi Lestari', dept: 'Human Resources', role: 'HR Manager' },
      { id: 'EMP003', name: 'Budi Santoso', dept: 'Teknologi & Produk', role: 'Tech Lead' },
      { id: 'EMP004', name: 'Maya Putri Handayani', dept: 'Teknologi & Produk', role: 'Developer' },
      { id: 'EMP018', name: 'Putri Maharani', dept: 'Finance & Accounting', role: 'Finance Staff' },
    ];

    const mockDocuments = [
      { id: 'DOC001', name: 'SOP Cuti Tahunan', cat: 'HRD', folder: 'Peraturan' },
      { id: 'DOC002', name: 'Form Pengadaan Laptop', cat: 'Finance', folder: 'Template' },
      { id: 'DOC003', name: 'Struktur Organisasi 2026', cat: 'HRD', folder: 'Umum' },
    ];

    const mockAssets = [
      { id: 'AST001', name: 'MacBook Pro M2 16"', sn: 'SN-MBP-897', status: 'Diberikan' },
      { id: 'AST002', name: 'Monitor LG 24"', sn: 'SN-MON-124', status: 'Tersedia' },
      { id: 'AST003', name: 'Kursi Kerja Ergonomis', sn: 'SN-CHR-561', status: 'Diberikan' },
    ];

    const qLower = query.toLowerCase();

    const emps = mockEmployees
      .filter(emp => emp.name.toLowerCase().includes(qLower) || emp.id.toLowerCase().includes(qLower))
      .map(emp => ({
        type: 'employee' as const,
        id: emp.id,
        name: emp.name,
        subText: `${emp.id} - ${emp.role} (${emp.dept})`,
        link: `/employee/${emp.id}`
      }));

    const docs = mockDocuments
      .filter(doc => doc.name.toLowerCase().includes(qLower))
      .map(doc => ({
        type: 'document' as const,
        id: doc.id,
        name: doc.name,
        subText: `${doc.folder} - ${doc.cat}`,
        link: `/documents`
      }));

    const asts = mockAssets
      .filter(ast => ast.name.toLowerCase().includes(qLower) || ast.id.toLowerCase().includes(qLower))
      .map(ast => ({
        type: 'asset' as const,
        id: ast.id,
        name: ast.name,
        subText: `${ast.id} - S/N: ${ast.sn} [${ast.status}]`,
        link: `/assets`
      }));

    setSearchResults([...emps, ...docs, ...asts]);
    setIsSearchOpen(true);
  };

  // Language toggle
  const toggleLanguage = () => {
    const nextLang: Language = lang === 'id' ? 'en' : 'id';
    setLanguage(nextLang);
  };

  // Mark all notifications read
  const markAllRead = () => {
    const updated = notifications.map(n => {
      if (n.user_id === userRole || n.user_id === 'all') {
        return { ...n, read: true };
      }
      return n;
    });
    localStorage.setItem('hive_notifications', JSON.stringify(updated));
    setNotifications(updated);
  };

  // Read single notification
  const readNotification = (id: string, link?: string) => {
    const updated = notifications.map(n => {
      if (n.id === id) return { ...n, read: true };
      return n;
    });
    localStorage.setItem('hive_notifications', JSON.stringify(updated));
    setNotifications(updated);
    setIsNotifOpen(false);
    if (link) router.push(link);
  };

  // Time-ago formatting helper
  const timeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return lang === 'id' ? `${interval} thn lalu` : `${interval} yr ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return lang === 'id' ? `${interval} bln lalu` : `${interval} mo ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return lang === 'id' ? `${interval} hari lalu` : `${interval} d ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return lang === 'id' ? `${interval} jam lalu` : `${interval} h ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return lang === 'id' ? `${interval} mnt lalu` : `${interval} m ago`;
    
    return lang === 'id' ? 'baru saja' : 'just now';
  };

  // Logout actions
  const handleLogoutConfirm = async () => {
    setIsLogoutModalOpen(false);
    await signOut();
    router.push('/login');
  };

  // User details
  const userName = user?.name || 'Standard Karyawan';
  const userRoleText = userRole.replace('_', ' ');
  const userInitials = userName
    .split(/\s+/)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  return (
    <>
      <div className="flex-1 flex items-center justify-between h-full">
        {/* Left side: Mobile Hamburger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobile}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
            aria-label="Toggle menu"
          >
            <Lucide.Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 select-none">
            {generateBreadcrumbs()}
          </div>
        </div>

        {/* Center: Global Search */}
        <div ref={searchRef} className="hidden sm:block max-w-md w-72 lg:w-96 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Lucide.Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder={t('search_placeholder')}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/15 focus:border-primary transition"
          />
          
          {/* Search results dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 p-2 max-h-64 overflow-y-auto z-40 text-xs animate-scale-up">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-slate-400 font-medium select-none">
                  {lang === 'id' ? 'Tidak ada hasil cocok.' : 'No results matched.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {/* Categorized rendering */}
                  {['employee', 'document', 'asset'].map(type => {
                    const typedResults = searchResults.filter(r => r.type === type);
                    if (typedResults.length === 0) return null;

                    const titleMap = {
                      employee: lang === 'id' ? 'Karyawan' : 'Employees',
                      document: lang === 'id' ? 'Dokumen' : 'Documents',
                      asset: lang === 'id' ? 'Aset' : 'Assets'
                    };

                    const iconMap = {
                      employee: <Lucide.User className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
                      document: <Lucide.File className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
                      asset: <Lucide.Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    };

                    return (
                      <div key={type} className="py-1">
                        <div className="font-bold text-[10px] text-slate-400 px-2 py-1 uppercase tracking-wider bg-slate-50 border-b border-slate-100 select-none rounded">
                          {titleMap[type as keyof typeof titleMap]}
                        </div>
                        {typedResults.map(item => (
                          <Link
                            key={item.id}
                            href={item.link}
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-2 p-2 hover:bg-slate-50 transition rounded-md truncate text-slate-700 mt-0.5"
                          >
                            {iconMap[type as keyof typeof iconMap]}
                            <span className="truncate">
                              <strong className="text-slate-900">{item.name}</strong>{' '}
                              <span className="text-slate-400 text-[10px]">({item.subText})</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: Language, Notifications, User */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition bg-white select-none cursor-pointer"
          >
            {lang === 'id' ? (
              <span className="w-5 h-3.5 bg-red-600 border border-slate-300 block shadow-sm rounded-sm relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1/2 after:bg-white shrink-0"></span>
            ) : (
              <span className="w-5 h-3.5 bg-blue-900 border border-slate-300 block shadow-sm rounded-sm flex items-center justify-center text-[6px] text-white font-bold leading-none shrink-0">
                US
              </span>
            )}
            <span className="uppercase">{lang}</span>
          </button>

          {/* Notification Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 relative transition cursor-pointer"
              aria-label="Notifications"
            >
              <Lucide.Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Container */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-40 animate-scale-up">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs">{t('notifications')}</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      {t('mark_all_read')}
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {relevantNotifs.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      <Lucide.BellOff className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <span>{lang === 'id' ? 'Belum ada notifikasi baru' : 'No new notifications'}</span>
                    </div>
                  ) : (
                    relevantNotifs.slice(0, 5).map(n => {
                      const activeClass = n.read ? 'bg-white' : 'bg-blue-50/40 hover:bg-blue-50/60';
                      const readBadge = !n.read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1"></span>;

                      let icon = <Lucide.Info className="w-4 h-4 text-blue-500" />;
                      let colorClass = 'bg-blue-50';

                      if (n.type === 'approval') {
                        icon = <Lucide.CheckSquare className="w-4 h-4 text-amber-500" />;
                        colorClass = 'bg-amber-50';
                      } else if (n.type === 'reward') {
                        icon = <Lucide.Award className="w-4 h-4 text-emerald-500" />;
                        colorClass = 'bg-emerald-50';
                      } else if (n.type === 'announcement') {
                        icon = <Lucide.Megaphone className="w-4 h-4 text-purple-500" />;
                        colorClass = 'bg-purple-50';
                      }

                      return (
                        <button
                          key={n.id}
                          onClick={() => readNotification(n.id, n.link)}
                          className={`w-full flex items-start text-left gap-3 p-3 text-xs transition duration-150 cursor-pointer ${activeClass}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-700 truncate pr-2">{n.title}</span>
                              <span className="text-[9px] text-slate-400 shrink-0 font-medium">{timeAgo(n.created_at)}</span>
                            </div>
                            <p className="text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                          </div>
                          {readBadge}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <Link
                    href="/announcement"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    {t('view_all')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div ref={userRef} className="relative border-l border-slate-200 pl-3">
            <button
              onClick={() => setIsUserOpen(!isUserOpen)}
              className="flex items-center gap-2 select-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-xs text-primary border border-slate-200 shrink-0">
                {userInitials}
              </div>
              <Lucide.ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Container */}
            {isUserOpen && (
              <div className="absolute right-0 mt-2.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-40 animate-scale-up">
                <div className="px-4 py-2 border-b border-slate-100 select-none">
                  <p className="font-bold text-slate-800 text-xs truncate leading-tight">{userName}</p>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5 truncate">{userRoleText}</p>
                </div>
                <Link
                  href={`/employee/${user?.id || 'EMP001'}`}
                  onClick={() => setIsUserOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Lucide.User className="w-4 h-4 text-slate-400" />
                  <span>{t('profile')}</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsUserOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Lucide.Settings className="w-4 h-4 text-slate-400" />
                  <span>{t('settings')}</span>
                </Link>
                <hr className="border-slate-100 my-1" />
                <button
                  onClick={() => {
                    setIsUserOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left font-medium cursor-pointer"
                >
                  <Lucide.LogOut className="w-4 h-4 text-red-400" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{t('confirm_logout_title')}</h3>
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                <Lucide.X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 text-slate-600 text-xs">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-red-500 bg-red-50">
                  <Lucide.LogOut className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-slate-700 font-medium leading-relaxed">{t('confirm_logout_msg')}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow transition cursor-pointer"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
