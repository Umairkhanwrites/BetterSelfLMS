'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  FileText,
  PlayCircle,
  ShieldCheck,
  Award,
  ChevronDown,
  ChevronUp,
  Lock,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X
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
        <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-sm">Loading course curriculum...</p>
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-lg">
        <p className="text-red-600 font-bold text-lg mb-2">Error</p>
        <p className="text-slate-600 text-sm mb-6">{errorMsg || 'Course not available'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  // Find preview lesson
  const previewLesson = course.modules?.[0]?.lessons?.find((l: any) => l.isFreePreview && l.youtubeVideoId);

  return (
    <div className="min-h-screen pb-24">
      {/* Trust Header Hero (Logo Blue Foundation) */}
      <section className="bg-gradient-to-b from-[#102a3f] via-[#1d4666] to-[#102a3f] text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#2988C6]/30">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2988C6]/20 border border-[#2988C6]/40 text-[#ddedf8] text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#2988C6]" />
            <span>{course.difficulty} Level Psychoeducation Track</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-4xl leading-tight">
            {course.title}
          </h1>
          <p className="mt-4 text-slate-300 text-base sm:text-xl max-w-3xl font-normal leading-relaxed">
            {course.subtitle}
          </p>

          {/* Vitals Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300 py-3 px-5 rounded-2xl bg-white/5 backdrop-blur border border-white/10 w-fit">
            <span className="flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-[#2988C6]" />
              {course.totalDurationMinutes} Minutes Self-Paced
            </span>
            <span className="flex items-center gap-2 font-medium">
              <FileText className="w-4 h-4 text-[#2988C6]" />
              {course.totalItems} Worksheets & Quizzes
            </span>
            <span className="flex items-center gap-2 font-medium">
              <Award className="w-4 h-4 text-[#66B151]" />
              Verifiable QR Certificate
            </span>
          </div>

          {/* CTAs: Free Preview & Enroll Drawer (Actionable Green) */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {previewLesson && (
              <button
                onClick={() => setPreviewVideoId(previewLesson.youtubeVideoId)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#66B151] hover:bg-[#589c44] text-white font-extrabold text-sm shadow-lg shadow-[#66B151]/20 transition-all hover:scale-105"
              >
                <PlayCircle className="w-5 h-5 text-white" />
                Watch Free Intro Video (Lesson 1)
              </button>
            )}

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-[#102a3f] font-extrabold text-sm shadow-xl transition-all"
            >
              <span>Enroll for PKR {course.pricePKR.toLocaleString()}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Curriculum Accordion */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Curriculum Syllabus</h2>
              <p className="text-xs text-slate-500 mt-0.5">{course.modules?.length || 0} Modules • 12 Total Clinical Items</p>
            </div>
            <span className="text-xs text-[#206394] bg-[#ddedf8] border border-[#c1e0f3] px-3 py-1 rounded-full font-bold">
              Instant 24h Module 1 Trial
            </span>
          </div>

          <div className="space-y-4">
            {course.modules?.map((mod: any, mIdx: number) => {
              const isExpanded = !!expandedModules[mod.moduleId];
              const isFirstModule = mIdx === 0;

              return (
                <div
                  key={mod.moduleId}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpandedModules(prev => ({ ...prev, [mod.moduleId]: !prev[mod.moduleId] }))}
                    className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/60 transition-colors text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-[#206394]">Module {mIdx + 1}</span>
                        {isFirstModule && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fbf0e3] text-[#904e2b] border border-[#f6dec4]">
                            Instant Unlock Available
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">{mod.title}</h3>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-slate-100 p-2">
                      {mod.lessons?.map((lesson: any) => {
                        const isPreview = lesson.isFreePreview;

                        return (
                          <div
                            key={lesson.lessonId}
                            className="p-3 sm:px-4 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {isPreview ? (
                                  <PlayCircle className="w-4 h-4 text-[#2988C6]" />
                                ) : (
                                  <Lock className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                                  {lesson.title}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
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
                                  className="px-2.5 py-1 rounded-lg bg-[#ddedf8] hover:bg-[#c1e0f3] text-[#206394] text-[11px] font-bold transition-colors"
                                >
                                  Preview
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                  <Lock className="w-3 h-3" />
                                  Enroll to Unlock
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

        {/* Right Column: Instructor Authority Card & Checkout Box */}
        <div className="space-y-6">
          {/* Instructor Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-[#206394] uppercase tracking-wider mb-3">Clinical Instructor</p>
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#2988C6] text-white flex items-center justify-center font-bold text-sm shadow-md">
                AS
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{course.instructorName}</h3>
                <p className="text-xs text-[#206394] font-medium">{course.instructorTitle}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Specialized in Cognitive Behavioral Therapy (CBT), exposure hierarchies, and stress regulation for clinical anxiety management.
            </p>
            <div className="p-3 rounded-xl bg-[#ddedf8]/60 border border-[#c1e0f3] text-[#1d4666] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#206394]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#66B151]" />
                <span>100% Self-Paced Psychoeducation</span>
              </div>
              <p className="text-[11px] text-slate-600">Study at your own rhythm with lifetime access to all worksheets and video labs.</p>
            </div>
          </div>

          {/* Sticky Checkout Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#102a3f] to-[#1d4666] text-white shadow-xl border border-[#2988C6]/40">
            <p className="text-xs font-bold text-[#ddedf8]">Complete Self-Paced Access</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black">PKR {course.pricePKR.toLocaleString()}</span>
              <span className="text-xs text-slate-300">one-time payment</span>
            </div>

            <ul className="mt-5 space-y-2.5 text-xs text-slate-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                <span>Instant 24-hour access to Module 1 upon submission</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                <span>All downloadable CBT worksheets & PDF labs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                <span>Auto-graded quizzes with clinical explanations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#66B151] shrink-0" />
                <span>Verifiable QR-stamped completion certificate</span>
              </li>
            </ul>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="mt-6 w-full py-3.5 px-4 rounded-xl bg-[#66B151] hover:bg-[#589c44] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#66B151]/20 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <span>Instant Checkout (JazzCash / EasyPaisa)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Free Preview Video Modal */}
      {previewVideoId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-bold">Lesson 1 Free Preview: Welcome & The 3 Loops of Anxiety</span>
              </div>
              <button
                onClick={() => setPreviewVideoId(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
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
