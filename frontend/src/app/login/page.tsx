'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  signInWithCredentials,
  registerStudent,
  PRE_SEEDED_ACCOUNTS
} from '@/lib/firebaseClient';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Phone
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await signInWithCredentials(email, password);
        if (user.admin) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        const user = await registerStudent(name, email, password, phone);
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (acc: typeof PRE_SEEDED_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMsg(null);
    setLoading(true);

    try {
      const user = await signInWithCredentials(acc.email, acc.password);
      if (user.admin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-slate-100 flex flex-col justify-center items-center">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4 hover:scale-105 transition-transform">
            <BrandLogo showText={true} />
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'login' ? 'Log in to your account' : 'Create your student account'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your evidence-based CBT courses, worksheets, and clinical community
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-white rounded-3xl p-7 shadow-xl border border-slate-200/80 space-y-6">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login' ? 'bg-[#2988C6] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register' ? 'bg-[#2988C6] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register New
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fatima Ali"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-[#3B97D3] focus:ring-1 focus:ring-[#3B97D3] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / WhatsApp Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="+92 300 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-[#3B97D3] focus:ring-1 focus:ring-[#3B97D3] outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Used for payment verification & clinical updates</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-[#3B97D3] focus:ring-1 focus:ring-[#3B97D3] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-[#3B97D3] focus:ring-1 focus:ring-[#3B97D3] outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#66B151] hover:bg-[#589c44] text-white font-extrabold text-xs shadow-md shadow-[#66B151]/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Log In & Enter Classroom' : 'Create Student Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Credentials Card Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-[#2988C6]" />
              <span>Dedicated Test Accounts & Credentials:</span>
            </div>

            <div className="space-y-2">
              {PRE_SEEDED_ACCOUNTS.map((acc, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#2988C6]/40 hover:bg-[#ddedf8]/20 transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{acc.role}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      acc.badge.includes('Admin')
                        ? 'bg-[#fbf0e3] text-[#904e2b] border border-[#f6dec4]'
                        : 'bg-[#ddedf8] text-[#206394] border border-[#c1e0f3]'
                    }`}>
                      {acc.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{acc.description}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-mono text-[11px]">
                    <span className="text-slate-600 truncate max-w-[170px]">{acc.email}</span>
                    <button
                      type="button"
                      onClick={() => handleQuickFill(acc)}
                      className="px-2.5 py-1 rounded-lg bg-[#66B151] text-white font-sans font-bold text-[10px] hover:bg-[#589c44] transition-colors"
                    >
                      Use & Log In
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
            ← Back to Public Course Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
