'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  subscribeToAuth,
  getCurrentAuthToken,
  BetterSelfUser
} from '@/lib/firebaseClient';
import YouTubePlayer from '@/components/YouTubePlayer';
import QuizEngine from '@/components/QuizEngine';
import {
  Play,
  CheckCircle2,
  Lock,
  FileText,
  Clock,
  Sparkles,
  Download,
  Award,
  AlertCircle,
  Video,
  BookOpen,
  Calendar,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Plus
} from 'lucide-react';

export default function ClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const [classroom, setClassroom] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'notes'>('overview');
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [user, setUser] = useState<BetterSelfUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [certGenerating, setCertGenerating] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);

  const getCurrentTimeRef = useRef<(() => number) | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u));
    return () => unsub();
  }, []);

  const ensureCertificateExists = async () => {
    try {
      const token = await getCurrentAuthToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/learn/${courseId}/certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.certificate?.certificateId) {
          setCertificateId(data.certificate.certificateId);
        }
      }
    } catch (err) {
      console.error('Error fetching certificate status:', err);
    }
  };

  const fetchClassroomData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const token = await getCurrentAuthToken();
      if (!token) {
        setErrorMsg('Please sign in to access classroom materials.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/learn/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to enter course classroom');
      }

      setClassroom(data);

      if (data.progress?.progressPercent >= 100) {
        ensureCertificateExists();
      }

      // Select first unlocked lesson if none selected
      if (!currentLesson && data.course?.modules?.length > 0) {
        for (const m of data.course.modules) {
          const firstUnlocked = m.lessons?.find((l: any) => !l.isLocked);
          if (firstUnlocked) {
            setCurrentLesson(firstUnlocked);
            break;
          }
        }
      }

      // Fetch saved notes
      const notesRes = await fetch(`${API_URL}/learn/${courseId}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.notes || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to course classroom');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchClassroomData();
    }
  }, [courseId, user]);

  const handleLessonEnded = async () => {
    if (!currentLesson) return;

    try {
      const token = await getCurrentAuthToken();
      await fetch(`${API_URL}/learn/${courseId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itemId: currentLesson.lessonId })
      });

      // Reload progress
      await fetchClassroomData();

      // Find next lesson
      findAndSetNextLesson(currentLesson.lessonId);
    } catch (err) {
      console.error('Error recording completion:', err);
    }
  };

  const handleQuizPassed = (quizResult: any) => {
    // Update progress in local state silently without triggering full loading spinner or unmounting currentLesson!
    if (quizResult?.updatedProgress) {
      setClassroom((prev: any) => ({
        ...prev,
        progress: quizResult.updatedProgress
      }));

      if (quizResult.updatedProgress.progressPercent >= 100) {
        ensureCertificateExists();
      }
    }
  };

  const findAndSetNextLesson = (currId: string) => {
    if (!classroom?.course?.modules) return;
    const allLessons: any[] = [];
    classroom.course.modules.forEach((m: any) => {
      m.lessons?.forEach((l: any) => allLessons.push(l));
    });

    const currentIndex = allLessons.findIndex(l => l.lessonId === currId);
    if (currentIndex >= 0 && currentIndex + 1 < allLessons.length) {
      const nextL = allLessons[currentIndex + 1];
      if (!nextL.isLocked) {
        setCurrentLesson(nextL);
      }
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !currentLesson) return;

    try {
      setSavingNote(true);
      const token = await getCurrentAuthToken();
      const timestamp = getCurrentTimeRef.current ? getCurrentTimeRef.current() : 0;

      const res = await fetch(`${API_URL}/learn/${courseId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lessonId: currentLesson.lessonId,
          videoTimestampSeconds: timestamp,
          content: newNoteContent.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setNotes(prev => [data.note, ...prev]);
        setNewNoteContent('');
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      setCertGenerating(true);
      const token = await getCurrentAuthToken();
      const res = await fetch(`${API_URL}/learn/${courseId}/certificate?format=pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to generate certificate');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${courseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Error generating certificate PDF');
    } finally {
      setCertGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-sm">Preparing distraction-free classroom...</p>
      </div>
    );
  }

  if (errorMsg) {
    const isPending = errorMsg.toLowerCase().includes('pending') || errorMsg.toLowerCase().includes('review');

    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-xl space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
          isPending ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
        }`}>
          {isPending ? <Clock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
        </div>

        <h2 className="text-xl font-extrabold text-slate-900">
          {isPending ? 'Enrollment Under Administrative Review' : 'Course Enrollment Required'}
        </h2>

        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
          {errorMsg}
        </p>

        {isPending ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              What happens next?
            </p>
            <p className="text-slate-600 leading-relaxed">
              Our clinical admissions team reviews incoming wallet payments (JazzCash / EasyPaisa / IBFT). You will receive full access to all modules, downloadable worksheets, and weekly Live Q&A once verified.
            </p>
          </div>
        ) : null}

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => router.push(`/course/${courseId}`)}
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md transition-colors"
          >
            {isPending ? 'View Course Overview' : 'View Course & Enroll'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Browse Catalog
          </button>
        </div>
      </div>
    );
  }

  const { course, access, progress } = classroom || {};
  const isTrial = access?.isTrial;
  const progressPercent = progress?.progressPercent || 0;
  const isComplete = progressPercent >= 100;

  // Collect all resources for the Resources tab
  const allResources: any[] = [];
  course?.modules?.forEach((m: any) => {
    m.lessons?.forEach((l: any) => {
      l.resources?.forEach((r: any) => {
        allResources.push({
          ...r,
          lessonTitle: l.title,
          moduleTitle: m.title
        });
      });
    });
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 24-Hour Trial Status Banner (Action Accent #F4A261) */}
      {isTrial && (
        <div className="bg-gradient-to-r from-[#da7e3e] via-[#F4A261] to-[#da7e3e] text-white px-4 py-2.5 shadow-sm text-center text-xs font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-white shrink-0" />
          <span>
            <strong>Module 1 Instant Trial Active:</strong> You have {Math.round(access.trialHoursRemaining || 0)} hours of trial access remaining while our team verifies your wallet payment receipt!
          </span>
        </div>
      )}

      {/* Main Split-View Stage (SEC-07: 70% Stage / 30% Sidebar) */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* 70% Main Stage */}
        <div className="lg:w-[70%] flex flex-col gap-6">
          {/* Main Stage Media: YouTube Shield or Quiz Engine */}
          {currentLesson?.type === 'quiz' ? (
            <QuizEngine
              courseId={courseId}
              quizId={currentLesson.quizId || 'q_01'}
              onQuizPassed={handleQuizPassed}
              onDownloadCertificate={handleDownloadCertificate}
            />
          ) : currentLesson?.youtubeVideoId ? (
            <YouTubePlayer
              videoId={currentLesson.youtubeVideoId}
              lessonId={currentLesson.lessonId}
              onEnded={handleLessonEnded}
              getCurrentTimeRef={getCurrentTimeRef}
            />
          ) : (
            <div className="aspect-video bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <FileText className="w-12 h-12 text-[#2988C6] mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">{currentLesson?.title}</h3>
              <p className="text-xs text-slate-500 max-w-md mb-6">{currentLesson?.summaryText}</p>
              <button
                onClick={handleLessonEnded}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#66B151] hover:bg-[#589c44] text-white text-xs font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Worksheet Lab as Completed
              </button>
            </div>
          )}

          {/* Lesson Header Title */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#206394]">Currently Learning:</span>
              <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{currentLesson?.title}</h1>
              <p className="text-xs text-slate-500 mt-1">{currentLesson?.summaryText}</p>
            </div>

            {currentLesson?.type === 'quiz' ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ddedf8] text-[#206394] text-xs font-bold border border-[#c1e0f3] shrink-0">
                <HelpCircle className="w-4 h-4 text-[#2988C6]" />
                <span>Assessment Stage (Score &ge; 70% to Complete)</span>
              </div>
            ) : (
              <button
                onClick={handleLessonEnded}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#66B151] hover:bg-[#589c44] text-white text-xs font-bold transition-all shadow-sm hover:scale-[1.02] shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                Mark as Finished
              </button>
            )}
          </div>

          {/* 3-Tab Below Player */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200 px-4 bg-slate-50/70">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'border-[#2988C6] text-[#206394]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Overview
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'resources'
                    ? 'border-[#2988C6] text-[#206394]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Resources ({allResources.length})
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'notes'
                    ? 'border-[#2988C6] text-[#206394]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                My Notes ({notes.length})
              </button>
            </div>

            <div className="p-6">
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-base">{course.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{course.subtitle}</p>
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                    <span>Clinical Instructor: <strong className="text-slate-800">{course.instructorName}</strong></span>
                    <span>•</span>
                    <span>{course.instructorTitle}</span>
                  </div>
                </div>
              )}

              {/* Tab 2: Resources (All PDFs) */}
              {activeTab === 'resources' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 mb-2">Centralized clinical worksheets and guides:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allResources.map((res: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-[#2988C6] shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">{res.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{res.lessonTitle}</p>
                          </div>
                        </div>

                        {res.pdfUrl ? (
                          <a
                            href={res.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-[#ddedf8] hover:bg-[#c1e0f3] text-[#206394] text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Timestamped Private Notes */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  <form onSubmit={handleSaveNote} className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Add Timestamped Note for Current Lesson:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Notice how chest tightness triggers catastrophizing..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#2988C6] focus:ring-1 focus:ring-[#2988C6]"
                      />
                      <button
                        type="submit"
                        disabled={savingNote}
                        className="px-4 py-2.5 rounded-xl bg-[#66B151] hover:bg-[#589c44] text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {savingNote ? 'Saving...' : 'Add Note'}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2.5">
                    {notes.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No private notes yet. Notes you create will save with the current video timestamp.</p>
                    ) : (
                      notes.map((note) => (
                        <div key={note.noteId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-3">
                          <span className="px-2 py-0.5 rounded bg-[#ddedf8] text-[#206394] font-mono font-bold text-[10px] shrink-0">
                            {Math.floor(note.videoTimestampSeconds / 60)}:{(note.videoTimestampSeconds % 60).toString().padStart(2, '0')}
                          </span>
                          <div className="flex-1">
                            <p className="text-slate-800 font-medium">{note.content}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(note.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 30% Curriculum Sidebar */}
        <div className="lg:w-[30%] flex flex-col justify-between space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            {/* Progress Metric */}
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Course Completion</span>
                <span className="text-[#487d30]">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#66B151] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Module Tree */}
            <h3 className="font-bold text-slate-900 text-sm">Course Curriculum</h3>
            <div className="space-y-4">
              {course.modules?.map((mod: any, mIdx: number) => (
                <div key={mod.moduleId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>{mod.title}</span>
                    {mod.isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                  </div>

                  <div className="space-y-1">
                    {mod.lessons?.map((lesson: any) => {
                      const isSelected = currentLesson?.lessonId === lesson.lessonId;
                      const isFinished = progress?.completedItemIds?.includes(lesson.lessonId) || progress?.completedItemIds?.includes(lesson.quizId);

                      return (
                        <button
                          key={lesson.lessonId}
                          type="button"
                          disabled={lesson.isLocked}
                          onClick={() => setCurrentLesson(lesson)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#2988C6] text-white font-bold shadow-sm'
                              : lesson.isLocked
                              ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                              : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isFinished ? (
                              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-[#66B151]'}`} />
                            ) : lesson.type === 'quiz' ? (
                              <HelpCircle className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            ) : (
                              <Play className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>

                          <span className="text-[10px] opacity-75 font-mono ml-2 shrink-0">
                            {lesson.durationMinutes}m
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Bottom Certificate CTA */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#2988C6]" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Official Clinical Certificate</h4>
                <p className="text-[10px] text-slate-400">QR-stamped for LinkedIn verification</p>
              </div>
            </div>

            {isComplete ? (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadCertificate}
                  disabled={certGenerating}
                  className="w-full py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all bg-[#66B151] hover:bg-[#589c44] text-white shadow-md shadow-[#66B151]/20 hover:scale-[1.02]"
                >
                  {certGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating PDF...</span>
                    </div>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PDF Certificate</span>
                    </>
                  )}
                </button>

                <a
                  href={`/verify/${certificateId || 'cert_anxiety_101_001'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-[#2988C6]/40 bg-[#ddedf8]/70 hover:bg-[#ddedf8] text-[#206394] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#2988C6]" />
                  <span>View Verified Certificate</span>
                </a>
              </div>
            ) : (
              <button
                disabled
                className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Complete 100% to Unlock Certificate</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
