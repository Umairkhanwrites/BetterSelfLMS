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
  Sparkles,
  BookOpen,
  Search,
  GraduationCap,
  Brain,
  ClipboardList,
  BadgeCheck,
  TrendingUp
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
    <div className="min-h-screen bg-[#fafbfc]">
      {/* ========================================================= */}
      {/* 1. HERO SECTION — CLEAN MINIMAL                           */}
      {/* ========================================================= */}
      <section className="relative bg-gradient-to-b from-white via-white to-[#f4f8fb] pt-20 pb-20 lg:pt-28 lg:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute top-[-120px] right-[-80px] w-[500px] h-[500px] bg-[#2988C6]/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-100px] w-[400px] h-[400px] bg-[#66B151]/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10 text-center">
          {/* Headline */}
          <h1 className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] text-slate-900 mb-5">
            Evidence-based courses{' '}
            <br className="hidden sm:block" />
            for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2988C6] to-[#66B151]">
              mental wellness
            </span>
          </h1>

          {/* Sub-copy */}
          <p className="text-slate-500 text-[15px] sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
            Self-paced programs by Mental Health Practitioners
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <a
              href="#courses"
              className="px-7 py-3 rounded-full bg-[#2988C6] hover:bg-[#2479b0] text-white font-semibold text-[15px] shadow-lg shadow-[#2988C6]/20 transition-all flex items-center gap-2 group active:scale-[0.98]"
            >
              Explore Courses
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {user && enrollments.length > 0 && (
              <a
                href="#my-learning"
                className="px-6 py-3 rounded-full bg-white border border-slate-200 hover:border-[#2988C6]/40 text-slate-700 hover:text-[#2988C6] font-semibold text-[15px] shadow-sm transition-all flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                My Learning ({enrollments.length})
              </a>
            )}
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-slate-400 font-medium">
            {[
              'Free Lesson 1 Trial',
              'Worksheets',
              'Completion Certificates',
              'EasyPaisa / JazzCash',
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#66B151]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. ACTIVE LEARNING STRIP                                  */}
      {/* ========================================================= */}
      {user && enrollments.length > 0 && (
        <section id="my-learning" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#2988C6]/10 flex items-center justify-center">
                  <BookOpen className="w-4.5 h-4.5 text-[#2988C6]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Welcome back, {user.name || 'Learner'} 👋
                  </h2>
                  <p className="text-xs text-slate-500">Pick up where you left off</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#2988C6]/8 text-[#2988C6] self-start sm:self-auto">
                {enrollments.length} Active Course{enrollments.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* If 1 Enrollment: Full Width Card */}
            {enrollments.length === 1 ? (
              <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#66B151]/10 text-[#487d30] border border-[#66B151]/20">
                      ✓ In Progress
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{enrollments[0].courseTitle}</h3>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-[#487d30] font-semibold">{enrollments[0].progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#66B151] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(6, enrollments[0].progressPercent)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {enrollments[0].completedItemIds?.length || 0} items completed
                    </p>
                  </div>
                </div>

                <Link
                  href={`/learn/${enrollments[0].courseId}`}
                  className="px-5 py-2.5 rounded-xl bg-[#66B151] hover:bg-[#5ba746] text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2 self-start md:self-auto active:scale-[0.98]"
                >
                  Resume Learning
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              /* Multiple enrollments grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {enrollments.map((enr) => {
                  const isActive = enr.status === 'active';

                  return (
                    <div
                      key={enr.enrollmentId}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            isActive ? 'bg-[#66B151]/10 text-[#487d30]' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {isActive ? 'Active' : 'Under Review'}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{enr.courseTitle}</h3>

                        <div className="space-y-1 mt-2.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Progress</span>
                            <span className="text-[#487d30] font-semibold">{enr.progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-[#66B151] rounded-full"
                              style={{ width: `${Math.max(4, enr.progressPercent)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {enr.completedItemIds?.length || 0} items done
                        </span>
                        <Link
                          href={`/learn/${enr.courseId}`}
                          className="px-3.5 py-1.5 rounded-lg bg-[#66B151] hover:bg-[#5ba746] text-white font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-[0.98]"
                        >
                          {isActive ? 'Resume' : 'View'}
                          <ArrowRight className="w-3 h-3" />
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
      {/* 3. COURSE CATALOG                                         */}
      {/* ========================================================= */}
      <section id="courses" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Courses
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 max-w-md">
              Instant Lesson 1 free trial is unlocked for all visitors.
            </p>
          </div>

          {/* Search Bar & Category Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:border-[#2988C6] focus:ring-2 focus:ring-[#2988C6]/10 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg">
              {(['all', 'anxiety', 'adhd'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat === 'anxiety' ? 'Anxiety' : 'ADHD'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="inline-block w-7 h-7 border-[3px] border-[#2988C6] border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading courses...</p>
          </div>
        ) : apiError ? (
          <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            <p className="font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Connection Error
            </p>
            <p className="text-xs mt-1 text-amber-600">{apiError}</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-sm">
            No courses found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCourses.map((course) => {
              const enrolledRecord = enrollmentByCourseId[course.courseId];
              const isEnrolledActive = enrolledRecord?.status === 'active';
              const isEnrolledPending = enrolledRecord?.status === 'pending';

              const destinationHref = isEnrolledActive || isEnrolledPending
                ? `/learn/${course.courseId}`
                : `/course/${course.courseId}`;

              return (
                <Link
                  key={course.courseId}
                  href={destinationHref}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                    <img
                      src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {isEnrolledActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#66B151] text-white shadow">
                          <CheckCircle2 className="w-3 h-3" />
                          Enrolled · {enrolledRecord.progressPercent}%
                        </span>
                      ) : isEnrolledPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500 text-white shadow">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2988C6] text-white shadow">
                          <PlayCircle className="w-3 h-3" />
                          Free Preview
                        </span>
                      )}
                    </div>

                    {/* Difficulty */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-slate-700 uppercase tracking-wide">
                        {course.difficulty || 'Beginner'}
                      </span>
                    </div>

                    {/* Instructor */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-[13px] font-semibold text-white drop-shadow-sm">{course.instructorName}</p>
                      <p className="text-[11px] text-white/70">{course.instructorTitle}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2.5">
                      <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#2988C6] transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-slate-500 text-[13px] line-clamp-2 leading-relaxed">
                        {course.subtitle}
                      </p>

                      {/* Course meta */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {course.totalDurationMinutes} mins
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {course.totalItems} lessons
                        </span>
                        <span className="text-[11px] font-medium text-[#2988C6] bg-[#2988C6]/[0.07] px-2 py-0.5 rounded">
                          Self-Paced
                        </span>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      {isEnrolledActive ? (
                        <>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-[#487d30] block">Enrolled</span>
                            <span className="text-sm font-bold text-slate-900">{enrolledRecord.progressPercent}% done</span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#66B151] group-hover:bg-[#5ba746] text-white text-xs font-semibold transition-all shadow-sm">
                            Resume
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </>
                      ) : isEnrolledPending ? (
                        <>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-amber-600 block">Payment</span>
                            <span className="text-sm font-bold text-slate-900">Under Review</span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 group-hover:bg-amber-600 text-white text-xs font-semibold transition-all shadow-sm">
                            Status
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-[10px] uppercase font-medium text-slate-400 block">One-Time</span>
                            <span className="text-lg font-extrabold text-slate-900">
                              PKR {course.pricePKR.toLocaleString()}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2988C6] group-hover:bg-[#2479b0] text-white text-xs font-semibold transition-all shadow-sm">
                            Enroll Now
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 4. WHY BETTERSELF — FEATURE PILLARS                       */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight max-w-lg mx-auto">
            Programs designed for real clinical outcomes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Brain,
              color: '#2988C6',
              bg: 'bg-[#2988C6]/[0.07]',
              title: 'Evidence-Based CBT',
              desc: 'Every lesson is anchored in cognitive restructuring, somatic soothing, and graduated exposure paradigms.',
            },
            {
              icon: ClipboardList,
              color: '#66B151',
              bg: 'bg-[#66B151]/[0.07]',
              title: 'Practical Worksheets',
              desc: 'Downloadable thought records, vagus nerve reset guides, and clinical tools you can print and use daily.',
            },
            {
              icon: BadgeCheck,
              color: '#E8913A',
              bg: 'bg-[#E8913A]/[0.07]',
              title: 'Verified Certificates',
              desc: 'Earn QR-verifiable certificates on completion. Pay via JazzCash, EasyPaisa, or bank transfer.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 hover:shadow-md hover:border-slate-300 transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center`}>
                <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
              </div>
              <h3 className="font-bold text-slate-900 text-[15px]">{feature.title}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. BOTTOM CTA BANNER                                      */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="relative bg-gradient-to-r from-[#2988C6] to-[#1d6fa3] rounded-2xl px-8 py-12 sm:px-12 sm:py-14 text-center overflow-hidden">
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.06] rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/4" />

          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
              Start your wellness journey today
            </h2>
            <p className="text-blue-100 text-sm sm:text-base max-w-md mx-auto mb-7">
              Your first lesson is completely free. No credit card, no commitment — just learning.
            </p>
            <a
              href="#courses"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white text-[#2988C6] font-semibold text-[15px] shadow-lg hover:shadow-xl transition-all group active:scale-[0.98]"
            >
              Browse Courses
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
