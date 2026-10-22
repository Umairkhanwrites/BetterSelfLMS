'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  subscribeToAuth,
  getCurrentAuthToken,
  BetterSelfUser
} from '@/lib/firebaseClient';
import {
  Clock,
  FileText,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Search,
  Award,
  Star,
  GraduationCap,
  Check,
  Layers,
  Sparkle
} from 'lucide-react';

interface Course {
  courseId: string;
  title: string;
  subtitle: string;
  instructorName: string;
  instructorTitle: string;
  pricePKR: number;
  difficulty: string;
  totalDurationMinutes: number;
  totalItems: number;
  thumbnailUrl: string;
  isPublished: boolean;
}

interface Enrollment {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  pricePKR: number;
  status: 'active' | 'pending' | 'rejected';
  progressPercent: number;
  trialExpired?: boolean;
  trialHoursRemaining?: number;
  completedItemIds?: string[];
}

export default function CatalogAndDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [user, setUser] = useState<BetterSelfUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'anxiety' | 'adhd'>('all');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Listen to header search events & URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search') || params.get('q');
      if (q) setSearchQuery(q);
    }
    const handleHeaderSearch = (e: any) => {
      if (typeof e.detail === 'string') {
        setSearchQuery(e.detail);
      }
    };
    window.addEventListener('header-search', handleHeaderSearch as EventListener);
    return () => window.removeEventListener('header-search', handleHeaderSearch as EventListener);
  }, []);

  // Auth subscriber
  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Fetch catalog & enrollments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setApiError(null);

        // Fetch public catalog
        const cRes = await fetch(`${API_URL}/courses`);
        if (!cRes.ok) throw new Error('Failed to load courses from API');
        const cData = await cRes.json();
        setCourses(cData.courses || []);

        // Fetch my enrollments if authenticated
        const token = await getCurrentAuthToken();
        if (token) {
          const eRes = await fetch(`${API_URL}/enrollments/my`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (eRes.ok) {
            const eData = await eRes.json();
            setEnrollments(eData.enrollments || []);
          }
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setApiError(err.message || 'Error connecting to LMS backend');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Lookup map for fast enrollment state checking on course cards
  const enrollmentByCourseId: Record<string, Enrollment> = {};
  enrollments.forEach((enr) => {
    enrollmentByCourseId[enr.courseId] = enr;
  });

  // Filter courses by search & category
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'anxiety' && c.courseId.includes('anxiety')) ||
      (selectedCategory === 'adhd' && c.courseId.includes('adhd'));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* ========================================================= */}
      {/* 1. HERO SECTION (HIGH IMPACT & BALANCED BRAND BLUE FOUNDATION) */}
      {/* ========================================================= */}
      <section className="relative bg-gradient-to-br from-[#102a3f] via-[#1d4666] to-[#102a3f] text-white pt-14 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#2988C6]/30 overflow-hidden">
        {/* Subtle Ambient Mesh Grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2988C6_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#2988C6]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#66B151]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left 7 Columns: Headlines, Value Badges & Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2988C6]/20 border border-[#2988C6]/40 text-[#ddedf8] text-xs font-bold shadow-sm backdrop-blur">
                <Sparkles className="w-3.5 h-3.5 text-[#2988C6]" />
                <span>Pakistan's Clinical LMS • 100% Self-Paced</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15] text-white">
                Evidence-based mental wellness, structured for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#94c9eb] via-[#66B151] to-[#ddedf8]">
                  real clinical transformation.
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                Self-paced CBT courses crafted by licensed clinical psychologists. Enjoy zero-barrier instant Lesson 1 free trial, interactive downloadable worksheets, and local Pakistan wallet checkout.
              </p>

              {/* Trust Checkmarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                  <span>Instant Lesson 1 Free Video Trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                  <span>Downloadable CBT PDF Worksheets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                  <span>Verified Completion Certificates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                  <span>EasyPaisa, JazzCash & IBFT Support</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <a
                  href="#courses"
                  className="px-6 py-3.5 rounded-xl bg-[#66B151] hover:bg-[#589c44] text-white font-extrabold text-xs shadow-lg shadow-[#66B151]/30 transition-all flex items-center gap-2 group hover:scale-[1.02]"
                >
                  <span>Explore Available Courses</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>

                {user && enrollments.length > 0 && (
                  <a
                    href="#my-learning"
                    className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#ddedf8] border border-white/20 font-bold text-xs backdrop-blur transition-all flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4 text-[#2988C6]" />
                    <span>My Learning ({enrollments.length})</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right 5 Columns: Clinical Platform Showcase Widget */}
            <div className="lg:col-span-5">
              <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#66B151] animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">Active Clinical Track</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#F4A261] text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-[#F4A261] text-[#F4A261]" />
                    <span>4.9 / 5.0 Rating</span>
                  </div>
                </div>

                {/* Flagship Course Feature Snapshot */}
                <div className="bg-[#102a3f]/80 border border-[#2988C6]/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80"
                      alt="Instructor"
                      className="w-12 h-12 rounded-xl object-cover border border-[#2988C6]/40 shrink-0"
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-100">Mastering Anxiety & CBT</p>
                      <p className="text-[11px] text-[#94c9eb]">Dr. Ayesha Siddiqui, MS • Clinical Lead</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Evidence-based cognitive restructuring for autonomic arousal, trigger mapping, and somatic regulation.
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                    <span className="text-[#66B151] font-bold flex items-center gap-1">
                      <PlayCircle className="w-3.5 h-3.5" />
                      Free Intro Preview Ready
                    </span>
                    <span className="text-slate-400">100% Self-Paced</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-lg font-black text-[#66B151]">{courses.length}</p>
                    <p className="text-[10px] text-slate-300 uppercase font-semibold">Tracks</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-lg font-black text-[#2988C6]">100%</p>
                    <p className="text-[10px] text-slate-300 uppercase font-semibold">Self-Paced</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-lg font-black text-[#F4A261]">PKR</p>
                    <p className="text-[10px] text-slate-300 uppercase font-semibold">Wallets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. ACTIVE LEARNING STRIP (SEAMLESS INTEGRATION) */}
      {/* ========================================================= */}
      {user && enrollments.length > 0 && (
        <section id="my-learning" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ddedf8] border border-[#c1e0f3] flex items-center justify-center text-[#206394] shadow-sm">
                  <BookOpen className="w-5 h-5 text-[#2988C6]" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Welcome back, {user.name || 'Learner'} 👋
                  </h2>
                  <p className="text-xs text-slate-500">Pick up right where you left off in your clinical track</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ddedf8] text-[#206394] border border-[#c1e0f3] self-start sm:self-auto">
                {enrollments.length} Active Course{enrollments.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* If 1 Enrollment: Full Width Master Cockpit Card */}
            {enrollments.length === 1 ? (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#f0f7fc] via-slate-50 to-white border border-[#c1e0f3] flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#e4f6dc] text-[#345326] border border-[#ccedbc]">
                      ✓ Enrolled & In Progress
                    </span>
                    <span className="text-xs font-mono text-slate-400">Course ID: {enrollments[0].courseId}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">{enrollments[0].courseTitle}</h3>

                  {/* Progress Bar (Brand Green) */}
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Curriculum Progress</span>
                      <span className="text-[#487d30]">{enrollments[0].progressPercent}% Complete</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#66B151] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(6, enrollments[0].progressPercent)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {enrollments[0].completedItemIds?.length || 0} completed items & worksheets
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <Link
                    href={`/learn/${enrollments[0].courseId}`}
                    className="px-6 py-3.5 rounded-2xl bg-[#66B151] hover:bg-[#589c44] text-white font-extrabold text-xs shadow-md shadow-[#66B151]/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
                  >
                    <span>Resume Learning</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              /* If multiple enrollments: Grid of cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments.map((enr) => {
                  const isActive = enr.status === 'active';

                  return (
                    <div
                      key={enr.enrollmentId}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#2988C6]/40 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-slate-400">{enr.courseId}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isActive ? 'bg-[#e4f6dc] text-[#345326]' : 'bg-[#fbf0e3] text-[#904e2b]'
                          }`}>
                            {isActive ? 'Active' : 'Under Review'}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base leading-snug">{enr.courseTitle}</h3>

                        <div className="space-y-1.5 mt-3">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-500">Progress</span>
                            <span className="text-[#487d30] font-bold">{enr.progressPercent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-[#66B151] rounded-full"
                              style={{ width: `${Math.max(4, enr.progressPercent)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {enr.completedItemIds?.length || 0} items done
                        </span>
                        <Link
                          href={`/learn/${enr.courseId}`}
                          className="px-4 py-2 rounded-xl bg-[#66B151] hover:bg-[#589c44] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 hover:scale-[1.02]"
                        >
                          <span>{isActive ? 'Resume' : 'View Status'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 3. CATALOG & COURSE EXPLORER SECTION */}
      {/* ========================================================= */}
      <section id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[#206394] font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#2988C6]" />
              <span>Self-Paced Clinical Curriculum</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Explore Available Courses
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Zero buyer's remorse: Instant Lesson 1 free trial is unlocked for all visitors and students.
            </p>
          </div>

          {/* Search Bar & Category Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search tracks or faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-[#2988C6] focus:ring-1 focus:ring-[#2988C6] outline-none shadow-sm transition-all"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === 'all' ? 'bg-[#2988C6] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('anxiety')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === 'anxiety' ? 'bg-[#2988C6] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Anxiety
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('adhd')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === 'adhd' ? 'bg-[#2988C6] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ADHD
              </button>
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-4 border-[#2988C6] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-xs font-medium">Loading clinical course catalog...</p>
          </div>
        ) : apiError ? (
          <div className="p-6 rounded-2xl bg-[#fbf0e3] border border-[#f6dec4] text-[#904e2b]">
            <p className="font-semibold text-sm">Catalog Notice:</p>
            <p className="text-xs mt-1 text-[#904e2b]">{apiError}</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No courses found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const enrolledRecord = enrollmentByCourseId[course.courseId];
              const isEnrolledActive = enrolledRecord?.status === 'active';
              const isEnrolledPending = enrolledRecord?.status === 'pending';

              return (
                <div
                  key={course.courseId}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#2988C6]/40 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Thumbnail Banner with Overlays */}
                  <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                    <img
                      src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/30" />

                    {/* Context Aware Top-Left Badge */}
                    <div className="absolute top-3 left-3">
                      {isEnrolledActive ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#66B151] text-white shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Enrolled ({enrolledRecord.progressPercent}%)
                        </span>
                      ) : isEnrolledPending ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#F4A261] text-white shadow-md">
                          <Clock className="w-3.5 h-3.5" />
                          Verification Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#2988C6] text-white shadow-md">
                          <PlayCircle className="w-3.5 h-3.5" />
                          Lesson 1 Free Preview
                        </span>
                      )}
                    </div>

                    {/* Difficulty Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur text-slate-800 shadow-sm uppercase tracking-wider">
                        {course.difficulty || 'Beginner'}
                      </span>
                    </div>

                    {/* Instructor Tag over Thumbnail with High Contrast */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-xs font-bold text-white drop-shadow-md">{course.instructorName}</p>
                      <p className="text-[10px] text-[#94c9eb] drop-shadow">{course.instructorTitle}</p>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-[#206394] transition-colors leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                        {course.subtitle}
                      </p>

                      {/* Course Vitals */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2 pb-3 border-b border-slate-100">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#2988C6]" />
                          {course.totalDurationMinutes} mins
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <FileText className="w-3.5 h-3.5 text-[#2988C6]" />
                          {course.totalItems} Worksheets & Lessons
                        </span>
                        <span className="text-[11px] font-bold text-[#206394] bg-[#ddedf8] px-2 py-0.5 rounded">
                          Self-Paced
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      {isEnrolledActive ? (
                        <>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#487d30] block">Enrolled Student</span>
                            <span className="text-sm font-extrabold text-slate-800">{enrolledRecord.progressPercent}% Finished</span>
                          </div>
                          <Link
                            href={`/learn/${course.courseId}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#66B151] hover:bg-[#589c44] text-white text-xs font-bold transition-all shadow-md hover:scale-[1.02]"
                          >
                            <span>Resume</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </>
                      ) : isEnrolledPending ? (
                        <>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#904e2b] block">Payment Proof</span>
                            <span className="text-sm font-extrabold text-slate-800">Under Review</span>
                          </div>
                          <Link
                            href={`/learn/${course.courseId}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F4A261] hover:bg-[#e99f69] text-white text-xs font-bold transition-all shadow-md hover:scale-[1.02]"
                          >
                            <span>Status</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">One-Time Fee</span>
                            <span className="text-xl font-black text-slate-900">
                              PKR {course.pricePKR.toLocaleString()}
                            </span>
                          </div>
                          <Link
                            href={`/course/${course.courseId}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#66B151] hover:bg-[#589c44] text-white text-xs font-bold transition-all shadow-md hover:scale-[1.02]"
                          >
                            <span>Enroll Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 4. CLINICAL METHODOLOGY & TRUST BENCHMARK */}
      {/* ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-10 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#206394] bg-[#ddedf8] px-3 py-1 rounded-full border border-[#c1e0f3]">
              The BetterSelf Clinical Standard
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Why our psychoeducation programs deliver real outcomes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Benchmarked against Coursera, Khan Academy, and clinical CBT treatment guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#ddedf8] text-[#206394] flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Evidence-Based CBT Architecture</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every video lesson is anchored in cognitive restructuring, somatic nervous system soothing, and graduated exposure paradigms.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#e4f6dc] text-[#345326] flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Practical Somatic Worksheets</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Downloadable clinical tools, thought records, and vagus nerve reset guides you can print and integrate into your daily routine.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#fbf0e3] text-[#904e2b] flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Verified Credentials & Pakistan Checkout</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Earn public QR-verifiable certificates on 100% completion. Frictionless enrollment through JazzCash, EasyPaisa, or direct bank transfer.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
