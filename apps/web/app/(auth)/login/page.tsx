'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { signIn } from '@/lib/auth';
import { useToast } from '@/components/shared/NotifyToast';

export default function LoginPage() {
  const { lang, setLanguage, t } = useI18n();
  const router = useRouter();
  const toast = useToast();

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Forgot password modal
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Quick autofill helper
  const handleAutofill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin@1234');
    setErrorMsg('');
  };

  // Submit sign in handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { error } = await signIn.email({
        email: email.trim(),
        password: password,
        callbackURL: '/dashboard',
      });

      if (error) {
        setErrorMsg(error.message || t('login_invalid'));
        setIsLoading(false);
      } else {
        toast.success(lang === 'id' ? 'Berhasil masuk ke portal' : 'Successfully signed in to portal');
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setErrorMsg(t('login_invalid'));
      setIsLoading(false);
    }
  };

  // Forgot password submit
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotEmail.trim()) {
      setForgotSuccess(true);
      setTimeout(() => {
        setIsForgotOpen(false);
        setForgotEmail('');
        setForgotSuccess(false);
      }, 2500);
    }
  };

  return (
    <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-fade-in">
      
      {/* Left panel (Branding Illustration) */}
      <div className="hidden md:flex md:w-1/2 bg-sidebar p-12 flex-col justify-between text-white relative select-none">
        {/* Background subtle radial pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">H</div>
          <span className="text-xl font-bold tracking-tight">HIVE <span className="text-blue-500 font-semibold">HRM</span></span>
        </div>

        <div className="relative z-10 my-auto py-8">
          <h1 className="text-4xl font-bold leading-tight mb-4 text-white">People at the center of everything.</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">Human Intelligence & Value Engine. Complete, seamless corporate management platform built for modern workspaces.</p>
          
          {/* Simplified SVG Illustration */}
          <div className="mt-8 flex justify-center">
            <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-light">
              <rect x="20" y="30" width="240" height="130" rx="12" fill="#2A3347" stroke="#38BDF8" strokeWidth="2" />
              <rect x="40" y="50" width="50" height="50" rx="6" fill="#2563EB" fillOpacity="0.3" />
              <circle cx="65" cy="70" r="12" fill="#38BDF8" />
              <rect x="105" y="55" width="130" height="10" rx="5" fill="#475569" />
              <rect x="105" y="75" width="90" height="10" rx="5" fill="#475569" />
              <rect x="40" y="115" width="200" height="30" rx="6" fill="#1E293B" stroke="#475569" />
              <circle cx="55" cy="130" r="6" fill="#16A34A" />
              <rect x="75" y="125" width="80" height="10" rx="5" fill="#475569" />
              <rect x="195" y="123" width="35" height="14" rx="4" fill="#2563EB" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 flex justify-between text-[10px] text-slate-400">
          <span>&copy; 2026 PT. Nusantara Digital Inovasi</span>
          <span>v1.0 (MVP)</span>
        </div>
      </div>

      {/* Right panel (Login Form) */}
      <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
        
        {/* Language Selector */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setLanguage(lang === 'id' ? 'en' : 'id')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition bg-white select-none cursor-pointer"
          >
            {lang === 'id' ? (
              <span className="w-5 h-3.5 bg-red-600 border border-slate-300 block shadow-sm rounded-sm relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1/2 after:bg-white shrink-0"></span>
            ) : (
              <span className="w-5 h-3.5 bg-blue-900 border border-slate-300 block shadow-sm rounded-sm flex items-center justify-center text-[6px] text-white font-bold leading-none shrink-0">US</span>
            )}
            <span>{lang === 'id' ? 'Bahasa Indonesia' : 'English'}</span>
          </button>
        </div>

        <div className="mb-8 select-none">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('login_title')}</h2>
          <p className="text-xs text-slate-400">{t('login_subtitle')}</p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-3 animate-fade-in">
            <Lucide.AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('login_email')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Lucide.Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition form-input-focus"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t('login_password')}
              </label>
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                {t('login_forgot')}
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Lucide.Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition form-input-focus"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Lucide.EyeOff className="w-5 h-5" /> : <Lucide.Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center select-none cursor-pointer">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-350 text-primary focus:ring-primary w-4.5 h-4.5 cursor-pointer"
              />
              <span className="ml-2 text-xs text-slate-500 font-semibold">{t('login_remember')}</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>{isLoading ? t('loading') : t('login_submit')}</span>
            {!isLoading && <Lucide.ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        {/* Account Helpers Accordion */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 select-none">
            {t('demo_accounts')}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <button
              type="button"
              onClick={() => handleAutofill('superadmin@hive.id')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-slate-700 font-bold transition block truncate cursor-pointer"
            >
              <strong>Super Admin:</strong><br />
              <span className="text-slate-400 font-normal">superadmin@hive.id</span>
            </button>
            <button
              type="button"
              onClick={() => handleAutofill('hradmin@hive.id')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-slate-700 font-bold transition block truncate cursor-pointer"
            >
              <strong>HR Admin:</strong><br />
              <span className="text-slate-400 font-normal">hradmin@hive.id</span>
            </button>
            <button
              type="button"
              onClick={() => handleAutofill('manager@hive.id')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-slate-700 font-bold transition block truncate cursor-pointer"
            >
              <strong>Manager:</strong><br />
              <span className="text-slate-400 font-normal">manager@hive.id</span>
            </button>
            <button
              type="button"
              onClick={() => handleAutofill('karyawan@hive.id')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-slate-700 font-bold transition block truncate cursor-pointer"
            >
              <strong>Karyawan:</strong><br />
              <span className="text-slate-400 font-normal">karyawan@hive.id</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal (Simulated) */}
      {isForgotOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleForgotSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{t('forgot_title')}</h3>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                <Lucide.X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-405 leading-relaxed">{t('forgot_desc')}</p>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('forgot_label')}
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full px-4 py-2.5 rounded-lg border border-slate-205 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              {forgotSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-[10px] font-semibold animate-fade-in">
                  {t('forgot_success')}
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                {lang === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
              >
                {lang === 'id' ? 'Kirim Instruksi' : 'Send Instructions'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
