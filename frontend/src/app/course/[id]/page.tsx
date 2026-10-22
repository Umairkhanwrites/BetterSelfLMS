'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  FileText,
  PlayCircle,
  Award,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';
import CheckoutDrawer from '@/components/CheckoutDrawer';

export default function CourseLandingPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    m_01: true
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!courseId) return;
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/courses/${courseId}`);
        if (!res.ok) throw new Error('Course not found');
        const data = await res.json();
        setCourse(data.course);

        // Auto-expand all modules
        if (data.course?.modules) {
          const exp: Record<string, boolean> = {};
          data.course.modules.forEach((m: any) => { exp[m.moduleId] = true; });
          setExpandedModules(exp);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error fetching course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2988C6] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-sm">Loading course curriculum...</p>
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
        <p className="text-red-600 font-bold text-lg mb-2">Notice</p>
        <p className="text-slate-600 text-sm mb-6">{errorMsg || 'Course not available'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  // Find preview lesson
  const previewLesson = course.modules?.[0]?.lessons?.find((l: any) => l.isFreePreview && l.youtubeVideoId);

  return (
    <div className="min-h-screen bg-[#fafbfc] pb-24">
      {/* Hero Section — Minimal, Clean & Light */}
      <section className="relative bg-gradient-to-b from-white via-white to-[#f4f8fb] border-b border-slate-100 pt-12 pb-16 lg:pt-16 lg:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-[-100px] right-[-60px] w-[450px] h-[450px] bg-[#2988C6]/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-80px] w-[350px] h-[350px] bg-[#66B151]/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="max-w-3xl">
            {/* Tag / Category */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2988C6]/[0.08] text-[#2988C6] text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{course.difficulty || 'All Levels'} Course</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              {course.title}
            </h1>

            <p className="mt-4 text-slate-500 text-base sm:text-lg leading-relaxed">
              {course.subtitle}
            </p>

            {/* Vitals row */}
            <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-[13px] text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#2988C6]" />
                {course.totalDurationMinutes} mins self-paced
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#2988C6]" />
                {course.totalItems} worksheets & lessons
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#66B151]" />
                Completion Certificate
              </span>
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {previewLesson && (
                <button
                  onClick={() => setPreviewVideoId(previewLesson.youtubeVideoId)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2988C6] hover:bg-[#2077ad] text-white font-semibold text-sm shadow-md shadow-[#2988C6]/20 transition-all active:scale-[0.98]"
                >
                  <PlayCircle className="w-4 h-4" />
                  Watch Free Intro
                </button>
              )}

              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-sm shadow-sm transition-all active:scale-[0.98]"
              >
                <span>Enroll for PKR {course.pricePKR.toLocaleString()}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Curriculum Accordion */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Curriculum Syllabus</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {course.modules?.length || 0} Modules • {course.totalItems || 12} Lessons & Worksheets
              </p>
            </div>
            <span className="text-xs text-[#2988C6] bg-[#2988C6]/10 px-3 py-1 rounded-full font-semibold">
              Free Preview Available
            </span>
          </div>

          <div className="space-y-3.5">
            {course.modules?.map((mod: any, mIdx: number) => {
              const isExpanded = !!expandedModules[mod.moduleId];
              const isFirstModule = mIdx === 0;

              return (
                <div
                  key={mod.moduleId}
                  className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpandedModules(prev => ({ ...prev, [mod.moduleId]: !prev[mod.moduleId] }))}
                    className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50/70 transition-colors text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#2988C6]">Module {mIdx + 1}</span>
                        {isFirstModule && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Free Trial Lesson
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-[15px] mt-0.5">{mod.title}</h3>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-slate-100 border-t border-slate-100 p-1.5">
                      {mod.lessons?.map((lesson: any) => {
                        const isPreview = lesson.isFreePreview;

                        return (
                          <div
                            key={lesson.lessonId}
                            className="p-3 sm:px-4 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0">
                                {isPreview ? (
                                  <div className="w-6 h-6 rounded-full bg-[#2988C6]/10 flex items-center justify-center">
                                    <PlayCircle className="w-3.5 h-3.5 text-[#2988C6]" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Lock className="w-3 h-3 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs sm:text-[13px] font-semibold text-slate-800">
                                  {lesson.title}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                  {lesson.summaryText}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 ml-4">
                              <span className="text-xs text-slate-400 font-mono">
                                {lesson.durationMinutes}m
                              </span>
                              {isPreview ? (
                                <button
                                  onClick={() => setPreviewVideoId(lesson.youtubeVideoId)}
                                  className="px-2.5 py-1 rounded-full bg-[#2988C6]/10 hover:bg-[#2988C6]/20 text-[#2988C6] text-xs font-semibold transition-colors"
                                >
                                  Preview
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                  <Lock className="w-3 h-3" />
                                  Locked
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Instructor & Pricing Cards */}
        <div className="space-y-6">
          {/* Instructor Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instructor</p>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#2988C6] text-white flex items-center justify-center font-bold text-sm shadow-inner">
                {course.instructorName ? course.instructorName.slice(0, 2).toUpperCase() : 'IN'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-[15px]">{course.instructorName}</h3>
                <p className="text-xs text-slate-500">{course.instructorTitle}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Specialized in Cognitive Behavioral Therapy (CBT), somatic nervous system soothing, and stress regulation.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#66B151]" />
                <span>100% Self-Paced Access</span>
              </div>
              <p className="text-[11px] text-slate-500">Study at your own rhythm with lifetime access to all worksheets and video lessons.</p>
            </div>
          </div>

          {/* Pricing & Checkout Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enrollment Fee</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">PKR {course.pricePKR.toLocaleString()}</span>
                <span className="text-xs text-slate-400 font-medium">one-time</span>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-b border-slate-100 py-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                <span>Instant access to Module 1 upon submission</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                <span>All downloadable CBT worksheets & PDF guides</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                <span>Auto-graded quizzes with full explanations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                <span>QR-verifiable certificate upon 100% completion</span>
              </li>
            </ul>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full py-3 px-4 rounded-full bg-[#2988C6] hover:bg-[#2077ad] text-white font-semibold text-sm shadow-md shadow-[#2988C6]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Enroll Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-slate-400 text-center font-medium">
              EasyPaisa · JazzCash · Bank Transfer
            </p>
          </div>
        </div>
      </div>

      {/* Free Preview Video Modal */}
      {previewVideoId && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-[#2988C6]" />
                <span className="text-sm font-semibold">Lesson 1 Free Preview</span>
              </div>
              <button
                onClick={() => setPreviewVideoId(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1&rel=0`}
                title="Lesson Preview"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Checkout Drawer */}
      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        course={{
          courseId: course.courseId,
          title: course.title,
          pricePKR: course.pricePKR,
          instructorName: course.instructorName
        }}
        onSuccess={() => {
          setIsCheckoutOpen(false);
          router.push(`/learn/${course.courseId}`);
        }}
      />
    </div>
  );
}
