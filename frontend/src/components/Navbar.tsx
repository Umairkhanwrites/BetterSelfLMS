'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  subscribeToAuth,
  logOutUser,
  BetterSelfUser
} from '@/lib/firebaseClient';
import {
  BookOpen,
  GraduationCap,
  ShieldAlert,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  LogIn,
  UserPlus
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<BetterSelfUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuth((currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => {
    logOutUser();
    setDropdownOpen(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with Official Pebble Shapes */}
          <div className="flex items-center gap-8">
            <Link href="/" className="group transition-transform hover:scale-[1.02]">
              <BrandLogo showText={true} />
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              <Link
                href="/"
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  pathname === '/'
                    ? 'text-[#206394] bg-[#ddedf8]/60 border border-[#c1e0f3]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#3B97D3]" />
                  Explore Courses
                </span>
              </Link>

              {user && (
                <Link
                  href="/#my-learning"
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    pathname.startsWith('/learn')
                      ? 'text-[#206394] bg-[#ddedf8]/60 border border-[#c1e0f3]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#3B97D3]" />
                    My Learning
                  </span>
                </Link>
              )}

              {user?.admin && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'text-[#904e2b] bg-[#fbf0e3] border border-[#f6dec4]'
                      : 'text-[#b5602e] hover:bg-[#fdf8f3]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-[#F4A261]" />
                    Admin Command Center
                  </span>
                </Link>
              )}
            </nav>
          </div>

          {/* User Auth Section (No Persona Switcher - Real Session Locked) */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#3B97D3] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div className="hidden sm:block text-xs">
                    <p className="font-bold text-slate-800 leading-tight max-w-[130px] truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-[10px] text-[#206394] font-bold uppercase tracking-wider">
                      {user.admin ? 'Administrator' : 'Student Account'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.admin ? 'bg-[#fbf0e3] text-[#b5602e] border border-[#f6dec4]' : 'bg-[#ddedf8] text-[#206394]'
                      }`}>
                        {user.admin ? 'Admin Role' : 'Student Role'}
                      </span>
                    </div>

                    <div className="py-1">
                      {user.admin && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-xs font-semibold text-[#904e2b] hover:bg-[#fdf8f3]"
                        >
                          Open Admin Command Center
                        </Link>
                      )}
                      <Link
                        href="/#my-learning"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        My Learning Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#3B97D3]" />
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#7CC157] hover:bg-[#6eb249] text-white shadow-sm transition-all hover:scale-[1.02]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
