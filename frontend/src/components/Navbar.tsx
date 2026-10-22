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
  LogIn,
  UserPlus,
  Search
} from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<BetterSelfUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (pathname === '/') {
      // Dispatches instant filter event to homepage catalog
      window.dispatchEvent(new CustomEvent('header-search', { detail: q }));
      const coursesSection = document.getElementById('courses');
      if (coursesSection) {
        coursesSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(`/?search=${encodeURIComponent(q)}#courses`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Brand Logo & Main Navigation */}
          <div className="flex items-center gap-5 lg:gap-7 shrink-0">
            <Link href="/">
              <BrandLogo showText={true} showSubtitle={false} />
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5">
              <Link
                href="/"
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  pathname === '/'
                    ? 'text-[#206394] bg-[#ddedf8]/60 border border-[#c1e0f3]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#2988C6]" />
                  Explore Courses
                </span>
              </Link>

              {user && (
                <Link
                  href="/#my-learning"
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    pathname.startsWith('/learn')
                      ? 'text-[#206394] bg-[#ddedf8]/60 border border-[#c1e0f3]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#2988C6]" />
                    My Learning
                  </span>
                </Link>
              )}

              {user?.admin && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'text-[#904e2b] bg-[#fbf0e3] border border-[#f6dec4]'
                      : 'text-[#b5602e] hover:bg-[#fdf8f3]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-[#F4A261]" />
                    Admin CMS Studio
                  </span>
                </Link>
              )}
            </nav>
          </div>

          {/* Center Search Bar — Exact reference pill with circular blue button */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm md:max-w-md lg:max-w-lg mx-1 sm:mx-3">
            <div className="relative flex items-center bg-[#f0f4f9] hover:bg-[#e9f0f7] focus-within:bg-white border border-transparent focus-within:border-[#2988C6] focus-within:ring-2 focus-within:ring-[#2988C6]/20 rounded-full transition-all pl-4 sm:pl-5 pr-1 py-1 shadow-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you want to learn?"
                className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-500 focus:outline-none pr-2 font-normal"
              />
              <button
                type="submit"
                aria-label="Search courses"
                className="w-8 h-8 rounded-full bg-[#2988C6] hover:bg-[#2072a7] active:scale-95 text-white flex items-center justify-center shrink-0 transition-all shadow-sm"
              >
                <Search className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>

          {/* User Auth Section: Log In & Create Account */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#2988C6] text-white flex items-center justify-center font-bold text-xs shadow-inner">
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
                          Open Admin CMS Studio
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
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#2988C6]" />
                  <span>Log In</span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-[#66B151] hover:bg-[#579c44] text-white shadow-sm transition-all hover:scale-[1.02]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Create Account</span>
                  <span className="sm:hidden">Join</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
