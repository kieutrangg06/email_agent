'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Mail,
  CheckCircle,
  BarChart2,
  Users,
  FileText,
  Bell,
  LogIn,
  LogOut,
  UserCheck,
  LayoutDashboard,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [mounted, setMounted] = useState(false);

  const checkAuth = () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token) {
      setIsLoggedIn(true);
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          setUserName(parsed.name || parsed.email?.split('@')[0] || 'User');
        } catch {
          setUserName('Admin');
        }
      } else {
        setUserName('Admin');
      }
    } else {
      setIsLoggedIn(false);
      setUserName('');
    }
  };

  useEffect(() => {
    setMounted(true);
    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-changed'));
    }
    setIsLoggedIn(false);
    setUserName('');
    router.push('/login');
  };

  const navLinks = [
    {
      href: '/tickets',
      label: 'Hộp Thư',
      icon: Mail,
      activeColor: 'text-rose-600 bg-rose-50 border-rose-200/80',
      iconColor: 'text-rose-500',
    },
    {
      href: '/approval',
      label: 'Duyệt Thư',
      icon: CheckCircle,
      activeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
      iconColor: 'text-indigo-500',
    },
    {
      href: '/analytics',
      label: 'Báo Cáo',
      icon: BarChart2,
      activeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
      iconColor: 'text-emerald-500',
    },
    {
      href: '/crm',
      label: 'CRM Leads',
      icon: Users,
      activeColor: 'text-amber-600 bg-amber-50 border-amber-200/80',
      iconColor: 'text-amber-500',
    },
    {
      href: '/invoices',
      label: 'Hóa Đơn & OCR',
      icon: FileText,
      activeColor: 'text-purple-600 bg-purple-50 border-purple-200/80',
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <header className="border-b border-rose-150 bg-white/85 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-rose-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center font-bold text-white shadow-md shadow-rose-200 group-hover:scale-105 transition">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-1.5">
              Email AI CRM
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Enterprise Helpdesk &amp; CRM Platform
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 text-xs lg:text-sm overflow-x-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 lg:px-3 py-1.5 rounded-lg transition font-semibold flex items-center gap-1.5 border ${
                  isActive
                    ? link.activeColor
                    : 'text-slate-700 border-transparent hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? '' : link.iconColor}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badge */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden sm:inline">Hệ Thống Trực Tuyến</span>
          </div>
        </div>
      </div>

      {/* Mobile Subnavigation Row */}
      <div className="md:hidden flex items-center space-x-1 px-4 py-1.5 border-t border-rose-100/60 overflow-x-auto text-[11px] bg-white/70">
        <Link
          href="/"
          className={`px-2 py-1 rounded-md shrink-0 flex items-center gap-1 font-semibold ${
            pathname === '/' ? 'text-rose-600 bg-rose-50' : 'text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-rose-500" />
          <span>Tổng Quan</span>
        </Link>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2 py-1 rounded-md shrink-0 flex items-center gap-1 font-semibold ${
                isActive ? 'text-rose-600 bg-rose-50' : 'text-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
