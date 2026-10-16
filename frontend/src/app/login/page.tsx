'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  LogIn,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Workflow,
  Zap,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
        throw new Error(errMsg);
      }

      // Extract and save token
      const token = data.access_token || data.token || data.jwt || `jwt_${Date.now()}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token);

      const userInfo = data.user || {
        email: email.trim(),
        name: email.split('@')[0],
        role: 'ADMIN',
      };
      localStorage.setItem('user', JSON.stringify(userInfo));

      // Trigger local storage event for Navbar
      window.dispatchEvent(new Event('auth-changed'));

      setSuccess(true);
      setTimeout(() => {
        router.push('/tickets');
      }, 400);
    } catch (err: any) {
      setError(
        err.message || 'Không thể kết nối đến máy chủ xác thực (http://localhost:4000). Vui lòng thử chế độ Demo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    const demoToken = `demo_jwt_token_${Date.now()}`;
    localStorage.setItem('auth_token', demoToken);
    localStorage.setItem('token', demoToken);
    localStorage.setItem(
      'user',
      JSON.stringify({
        email: 'admin.enterprise@support.vn',
        name: 'Quản Trị Viên (Demo)',
        role: 'SUPER_ADMIN',
      })
    );
    window.dispatchEvent(new Event('auth-changed'));
    router.push('/tickets');
  };

  const fillQuickCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center items-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand & Badge Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200/80 rounded-full text-xs font-semibold text-rose-600 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-spin" />
            <span>Hệ Thống Tự Động Hóa Doanh Nghiệp</span>
          </div>

          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center font-bold text-white shadow-lg shadow-rose-200">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Email AI CRM</h1>
              <p className="text-xs text-slate-400 font-medium">Enterprise Helpdesk &amp; CRM Platform</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-md p-7 sm:p-8 rounded-3xl border border-rose-150 shadow-xl shadow-rose-100/40 space-y-6">
          <div className="border-b border-rose-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">Đăng Nhập Cổng Điều Hành</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập thông tin tài khoản chuyên viên hoặc quản trị viên hệ thống.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đăng nhập thành công! Đang chuyển hướng vào hệ thống...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="email">
                Địa Chỉ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-rose-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@enterprise.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="password">
                  Mật Khẩu
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-rose-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label="Ẩn hiện mật khẩu"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-200 hover:shadow-lg hover:shadow-rose-300 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực tài khoản...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Hệ Thống</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
              hoặc
            </span>
          </div>

          {/* Demo Mode Button */}
          <button
            type="button"
            onClick={handleDemoMode}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-rose-50/80 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-600 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 group shadow-xs cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
            <span>Truy Cập Chế Độ Demo (Bỏ Qua Đăng Nhập)</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 text-slate-400 group-hover:translate-x-1 transition" />
          </button>

          {/* Quick Demo Credentials */}
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 text-[11px] text-slate-500 space-y-1.5">
            <div className="font-semibold text-slate-600 flex items-center justify-between">
              <span>Tài khoản kiểm thử nhanh:</span>
              <span className="text-[10px] text-rose-500">Bấm để điền</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin@enterprise.vn', 'password123')}
                className="text-left p-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 text-[11px] transition"
              >
                <div className="font-medium text-slate-700">Quản Trị Viên</div>
                <div className="text-[10px] text-slate-400 truncate">admin@enterprise.vn</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('support@enterprise.vn', 'support123')}
                className="text-left p-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 text-[11px] transition"
              >
                <div className="font-medium text-slate-700">Kỹ Thuật Viên</div>
                <div className="text-[10px] text-slate-400 truncate">support@enterprise.vn</div>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Badges Footer */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-medium">
          <div className="p-2 bg-white/70 rounded-xl border border-rose-100 flex flex-col items-center gap-1 shadow-xs">
            <Workflow className="w-4 h-4 text-rose-500" />
            <span>Quy Trình Tự Động</span>
          </div>
          <div className="p-2 bg-white/70 rounded-xl border border-indigo-100 flex flex-col items-center gap-1 shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Trí Tuệ Nhân Tạo AI</span>
          </div>
          <div className="p-2 bg-white/70 rounded-xl border border-emerald-100 flex flex-col items-center gap-1 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Chuẩn SLA Cam Kết</span>
          </div>
        </div>
      </div>
    </div>
  );
}
