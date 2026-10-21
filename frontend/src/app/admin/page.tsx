'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  subscribeToAuth,
  getCurrentAuthToken,
  BetterSelfUser
} from '@/lib/firebaseClient';
import {
  ShieldAlert,
  BarChart3,
  CreditCard,
  Users,
  BookOpen,
  Plus,
  Check,
  X,
  Eye,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  Award,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  AlertCircle,
  Video,
  HelpCircle,
  ChevronRight,
  Filter,
  Edit,
  ArrowLeft,
  Layers,
  Save,
  CheckCircle2,
  PlayCircle,
  Upload,
  Image as ImageIcon,
  Phone,
  KeyRound,
  CalendarRange,
  PieChart,
  Wallet,
  Percent,
  BadgePercent
} from 'lucide-react';
import { BrandMark } from '@/components/BrandLogo';

interface RevenueByCourse {
  courseId: string;
  title: string;
  instructorName: string;
  instructorTitle: string;
  instructorSharePercent: number;
  pricePKR: number;
  activeSalesCount: number;
  grossRevenuePKR: number;
  instructorEarningsPKR: number;
  platformRevenuePKR: number;
}

interface InstructorCourseBreakdown {
  courseId: string;
  courseTitle: string;
  pricePKR: number;
  sharePercent: number;
  salesCount: number;
  grossRevenuePKR: number;
  instructorEarningsPKR: number;
  platformRevenuePKR: number;
}

interface RevenueByInstructor {
  instructorName: string;
  instructorTitle: string;
  coursesCount: number;
  coursesTaught: string[];
  totalSalesCount: number;
  grossRevenuePKR: number;
  instructorEarningsPKR: number;
  platformRetainedPKR: number;
  coursesBreakdown: InstructorCourseBreakdown[];
}

interface Stats {
  totalRevenuePKR: number;
  totalInstructorPayoutPKR?: number;
  netPlatformRevenuePKR?: number;
  totalStudents: number;
  pendingApprovals: number;
  activeEnrollments: number;
  rejectedEnrollments: number;
  totalCourses: number;
  totalCertificatesIssued: number;
  completionRate: number;
  revenueByCourse?: RevenueByCourse[];
  revenueByInstructor?: RevenueByInstructor[];
  dateFilter?: {
    period: string;
    startDate: string | null;
    endDate: string | null;
  };
}

interface StudentCertificate {
  certificateId: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  completionDate: string;
  passingScore: number;
  verificationUrl: string;
}

interface Student {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  role: string;
  createdAt: string;
  enrollments: any[];
  certificates?: StudentCertificate[];
}

interface LessonResource {
  title: string;
  pdfUrl: string;
}

interface Lesson {
  lessonId: string;
  title: string;
  type: 'video' | 'pdf' | 'quiz';
  durationMinutes: number;
  isFreePreview: boolean;
  youtubeVideoId: string | null;
  summaryText: string;
  resources: LessonResource[];
  quizId: string | null;
}

interface Module {
  moduleId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Question {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

interface Quiz {
  quizId: string;
  passingScore: number;
  questions: Question[];
}

interface CourseFormData {
  courseId: string;
  title: string;
  subtitle: string;
  instructorName: string;
  instructorTitle: string;
  instructorSharePercent: number;
  pricePKR: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  totalDurationMinutes: number;
  totalItems: number;
  isPublished: boolean;
  thumbnailUrl: string;
  liveMeetLink: string;
  liveMeetSchedule: string;
  modules: Module[];
  quizzes: Quiz[];
}

const emptyCourseTemplate: CourseFormData = {
  courseId: '',
  title: '',
  subtitle: '',
  instructorName: 'Dr. Ayesha Siddiqui',
  instructorTitle: 'Clinical Psychologist, MS',
  instructorSharePercent: 40,
  pricePKR: 3500,
  difficulty: 'Beginner',
  totalDurationMinutes: 60,
  totalItems: 2,
  isPublished: true,
  thumbnailUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  liveMeetLink: '',
  liveMeetSchedule: '',
  modules: [
    {
      moduleId: 'm_01',
      title: 'Module 1: Foundations & Clinical Triggers',
      order: 1,
      lessons: [
        {
          lessonId: 'l_01',
          title: 'Welcome & Introduction (Free Preview)',
          type: 'video',
          durationMinutes: 12,
          isFreePreview: true,
          youtubeVideoId: 'dQw4w9WgXcQ',
          summaryText: 'Overview of clinical frameworks and psychoeducation loops.',
          resources: [
            { title: 'Introductory Clinical Handout', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
          ],
          quizId: null
        },
        {
          lessonId: 'l_02',
          title: 'The Fight-or-Flight Mechanism',
          type: 'video',
          durationMinutes: 18,
          isFreePreview: false,
          youtubeVideoId: '9mS0_6Qc6oU',
          summaryText: 'Neurobiology of autonomic arousal and somatic tension.',
          resources: [
            { title: 'Somatic Protocol Sheet', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
          ],
          quizId: null
        }
      ]
    }
  ],
  quizzes: [
    {
      quizId: 'q_01',
      passingScore: 70,
      questions: [
        {
          questionText: 'What is the primary role of cognitive reframing in CBT?',
          options: [
            'Examining verifiable evidence to replace catastrophic distortions with objective thoughts',
            'Suppressing all emotional feelings completely',
            'Avoiding social interaction',
            'Memorizing psychological terms'
          ],
          correctOptionIndex: 0,
          explanation: 'Cognitive reframing systematically challenges irrational distortions by anchoring reactions in verifiable empirical facts.'
        }
      ]
    }
  ]
};

// Helper to extract clean YouTube ID from any URL or raw ID
const extractYouTubeId = (input: string): string => {
  if (!input) return '';
  const val = input.trim();
  if (val.includes('v=')) {
    return val.split('v=')[1].split('&')[0];
  }
  if (val.includes('youtu.be/')) {
    return val.split('youtu.be/')[1].split('?')[0];
  }
  if (val.includes('embed/')) {
    return val.split('embed/')[1].split('?')[0];
  }
  return val;
};

export default function AdminCommandCenter() {
  const router = useRouter();
  const [user, setUser] = useState<BetterSelfUser | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'students' | 'builder'>('overview');

  // Stats & Entities
  const [stats, setStats] = useState<Stats | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [adminCourses, setAdminCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [receiptModalUrl, setReceiptModalUrl] = useState<string | null>(null);

  // Filters & Search
  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('pending');
  const [studentSearch, setStudentSearch] = useState('');

  // Date & Period Filter for Analytics
  const [datePeriod, setDatePeriod] = useState<'all' | 'today' | '7d' | '30d' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Password Update Modal
  const [passwordModalUser, setPasswordModalUser] = useState<Student | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordUpdateStatus, setPasswordUpdateStatus] = useState<string | null>(null);
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  // Certificate Modal
  const [certModalUser, setCertModalUser] = useState<Student | null>(null);

  // Expanded Instructor Payout Breakdown
  const [expandedInstructor, setExpandedInstructor] = useState<string | null>(null);

  // Course Studio State: 'list' (manager table) or 'editor' (form builder)
  const [studioMode, setStudioMode] = useState<'list' | 'editor'>('list');
  const [courseForm, setCourseForm] = useState<CourseFormData>(emptyCourseTemplate);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [courseSaveStatus, setCourseSaveStatus] = useState<string | null>(null);
  const [activeStudioTab, setActiveStudioTab] = useState<'vitals' | 'curriculum' | 'quizzes'>('vitals');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const unsub = subscribeToAuth((u) => setUser(u));
    return () => unsub();
  }, []);

  const fetchAdminData = async (periodParam = datePeriod, startParam = customStartDate, endParam = customEndDate) => {
    try {
      setLoading(true);
      const token = await getCurrentAuthToken();
      if (!token) return;

      // 1. Fetch Stats with Date Filter
      let statsUrl = `${API_URL}/admin/stats?period=${periodParam}`;
      if (periodParam === 'custom') {
        if (startParam) statsUrl += `&startDate=${startParam}`;
        if (endParam) statsUrl += `&endDate=${endParam}`;
      }

      const statsRes = await fetch(statsUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.stats);
      }

      // 2. Fetch Enrollments Queue
      const enrRes = await fetch(`${API_URL}/admin/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (enrRes.ok) {
        const eData = await enrRes.json();
        setEnrollments(eData.enrollments || []);
      }

      // 3. Fetch Student Directory
      const stuRes = await fetch(`${API_URL}/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (stuRes.ok) {
        const stuData = await stuRes.json();
        setStudents(stuData.students || []);
      }

      // 4. Fetch All Admin Courses
      const cRes = await fetch(`${API_URL}/admin/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        setAdminCourses(cData.courses || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: 'all' | 'today' | '7d' | '30d' | 'this_month' | 'custom') => {
    setDatePeriod(newPeriod);
    if (newPeriod !== 'custom') {
      fetchAdminData(newPeriod, '', '');
    }
  };

  const handleApplyCustomDateFilter = () => {
    if (!customStartDate || !customEndDate) {
      alert('Please specify both Start Date and End Date.');
      return;
    }
    fetchAdminData('custom', customStartDate, customEndDate);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (newPasswordInput.trim().length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      setPasswordUpdating(true);
      setPasswordUpdateStatus(null);
      const token = await getCurrentAuthToken();
      const res = await fetch(`${API_URL}/admin/students/${passwordModalUser.uid}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: newPasswordInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setPasswordUpdateStatus('✓ Password updated successfully!');
      await fetchAdminData();
      setTimeout(() => {
        setPasswordModalUser(null);
        setNewPasswordInput('');
        setPasswordUpdateStatus(null);
      }, 1500);
    } catch (err: any) {
      setPasswordUpdateStatus(`Error: ${err.message}`);
    } finally {
      setPasswordUpdating(false);
    }
  };

  useEffect(() => {
    if (user?.admin) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Handle Enrollment Status update (Approve/Reject)
  const handleUpdateStatus = async (enrollmentId: string, status: 'active' | 'rejected') => {
    try {
      setActionLoading(enrollmentId);
      const token = await getCurrentAuthToken();
      const res = await fetch(`${API_URL}/admin/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        await fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setActionLoading(null);
    }
  };

  // Open Studio to Create New Course
  const handleOpenCreateStudio = () => {
    const randomId = `c_course_${Date.now().toString().slice(-4)}`;
    setCourseForm({
      ...emptyCourseTemplate,
      courseId: randomId
    });
    setIsEditingExisting(false);
    setStudioMode('editor');
    setActiveStudioTab('vitals');
    setCourseSaveStatus(null);
  };

  // Open Studio to Edit Existing Course
  const handleOpenEditStudio = async (courseId: string) => {
    try {
      setCourseSaveStatus('Loading full course materials...');
      const token = await getCurrentAuthToken();
      const res = await fetch(`${API_URL}/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        alert('Failed to load course details');
        return;
      }

      const data = await res.json();
      const loaded = data.course;

      setCourseForm({
        courseId: loaded.courseId,
        title: loaded.title || '',
        subtitle: loaded.subtitle || '',
        instructorName: loaded.instructorName || 'Dr. Ayesha Siddiqui',
        instructorTitle: loaded.instructorTitle || 'Clinical Psychologist, MS',
        instructorSharePercent: Number(loaded.instructorSharePercent !== undefined ? loaded.instructorSharePercent : 40),
        pricePKR: Number(loaded.pricePKR) || 3500,
        difficulty: loaded.difficulty || 'Beginner',
        totalDurationMinutes: Number(loaded.totalDurationMinutes) || 60,
        totalItems: Number(loaded.totalItems) || 2,
        isPublished: loaded.isPublished !== false,
        thumbnailUrl: loaded.thumbnailUrl || '',
        liveMeetLink: loaded.liveMeetLink || '',
        liveMeetSchedule: loaded.liveMeetSchedule || '',
        modules: loaded.modules && loaded.modules.length > 0 ? loaded.modules : emptyCourseTemplate.modules,
        quizzes: loaded.quizzes && loaded.quizzes.length > 0 ? loaded.quizzes : emptyCourseTemplate.quizzes
      });

      setIsEditingExisting(true);
      setStudioMode('editor');
      setActiveStudioTab('vitals');
      setCourseSaveStatus(null);
    } catch (err) {
      console.error(err);
      alert('Error fetching course for editing');
    }
  };

  // Handle Course Save (Create or Update)
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseForm.courseId.trim()) {
      alert('Course ID is required.');
      return;
    }
    if (!courseForm.title.trim()) {
      alert('Course Title is required.');
      return;
    }

    // Auto-calculate total items & duration
    let calcDuration = 0;
    let calcItems = 0;

    courseForm.modules.forEach(m => {
      (m.lessons || []).forEach(l => {
        calcDuration += Number(l.durationMinutes) || 0;
        calcItems += 1;
      });
    });

    courseForm.quizzes.forEach(() => {
      calcItems += 1;
    });

    // Enforce Requirement 4: Free Intro Video is ONLY permitted in Module 1
    const sanitizedModules = courseForm.modules.map((m, mIdx) => ({
      ...m,
      lessons: (m.lessons || []).map(l => ({
        ...l,
        isFreePreview: mIdx === 0 ? Boolean(l.isFreePreview) : false
      }))
    }));

    const payload = {
      ...courseForm,
      modules: sanitizedModules,
      totalDurationMinutes: Math.max(calcDuration, courseForm.totalDurationMinutes || 1),
      totalItems: Math.max(calcItems, 1)
    };

    try {
      setCourseSaveStatus('Saving to Firestore...');
      const token = await getCurrentAuthToken();
      const res = await fetch(`${API_URL}/admin/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save course');
      }

      setCourseSaveStatus('✓ Course successfully saved & live in catalog!');
      await fetchAdminData();
      setTimeout(() => {
        setCourseSaveStatus(null);
        setStudioMode('list');
      }, 1500);
    } catch (err: any) {
      setCourseSaveStatus(`Error: ${err.message}`);
    }
  };

  // Handle Course Delete
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm(`Are you sure you want to permanently delete course "${courseId}"?`)) return;
    try {
      const token = await getCurrentAuthToken();
      const res = await fetch(`${API_URL}/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic Module Builders
  const handleAddModule = () => {
    const nextIdx = courseForm.modules.length + 1;
    const newMod: Module = {
      moduleId: `m_0${nextIdx}`,
      title: `Module ${nextIdx}: New Psychoeducation Module`,
      order: nextIdx,
      lessons: [
        {
          lessonId: `l_m${nextIdx}_01`,
          title: 'Lesson 1: Introduction to Module Concept',
          type: 'video',
          durationMinutes: 15,
          isFreePreview: false,
          youtubeVideoId: 'dQw4w9WgXcQ',
          summaryText: 'Core clinical explanation and cognitive exercise.',
          resources: [],
          quizId: null
        }
      ]
    };
    setCourseForm(prev => ({
      ...prev,
      modules: [...prev.modules, newMod]
    }));
  };

  const handleDeleteModule = (modIdx: number) => {
    if (courseForm.modules.length <= 1) {
      alert('A course must contain at least one module.');
      return;
    }
    const updated = courseForm.modules.filter((_, i) => i !== modIdx);
    setCourseForm(prev => ({ ...prev, modules: updated }));
  };

  // Dynamic Lesson Builders inside a Module
  const handleAddLesson = (modIdx: number) => {
    const mod = courseForm.modules[modIdx];
    const nextLessonNum = (mod.lessons?.length || 0) + 1;
    const newLesson: Lesson = {
      lessonId: `l_${mod.moduleId}_${nextLessonNum}`,
      title: `Lesson ${nextLessonNum}: Clinical Strategy`,
      type: 'video',
      durationMinutes: 15,
      isFreePreview: false,
      youtubeVideoId: 'dQw4w9WgXcQ',
      summaryText: 'Practical therapeutic intervention and client practice.',
      resources: [],
      quizId: null
    };

    const updatedMods = [...courseForm.modules];
    updatedMods[modIdx].lessons = [...(updatedMods[modIdx].lessons || []), newLesson];
    setCourseForm(prev => ({ ...prev, modules: updatedMods }));
  };

  const handleDeleteLesson = (modIdx: number, lessonIdx: number) => {
    const updatedMods = [...courseForm.modules];
    if (updatedMods[modIdx].lessons.length <= 1) {
      alert('Each module must contain at least one lesson.');
      return;
    }
    updatedMods[modIdx].lessons = updatedMods[modIdx].lessons.filter((_, i) => i !== lessonIdx);
    setCourseForm(prev => ({ ...prev, modules: updatedMods }));
  };

  // Dynamic Worksheet / PDF Resource Builders
  const handleAddResource = (modIdx: number, lessonIdx: number) => {
    const updatedMods = [...courseForm.modules];
    const currentLesson = updatedMods[modIdx].lessons[lessonIdx];
    currentLesson.resources = [
      ...(currentLesson.resources || []),
      { title: 'Clinical Worksheet (PDF)', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ];
    setCourseForm(prev => ({ ...prev, modules: updatedMods }));
  };

  const handleDeleteResource = (modIdx: number, lessonIdx: number, rIdx: number) => {
    const updatedMods = [...courseForm.modules];
    const currentLesson = updatedMods[modIdx].lessons[lessonIdx];
    currentLesson.resources = currentLesson.resources.filter((_, i) => i !== rIdx);
    setCourseForm(prev => ({ ...prev, modules: updatedMods }));
  };

  // Requirement 1: Handle Worksheet File Upload (PDF)
  const handleWorksheetFileUpload = (modIdx: number, lessonIdx: number, file: File, existingResourceIdx?: number) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const cleanFileName = file.name.replace(/\.[^/.]+$/, "");
      const updatedMods = [...courseForm.modules];
      const currentLesson = updatedMods[modIdx].lessons[lessonIdx];

      if (existingResourceIdx !== undefined && currentLesson.resources[existingResourceIdx]) {
        currentLesson.resources[existingResourceIdx].pdfUrl = dataUrl;
        if (!currentLesson.resources[existingResourceIdx].title || currentLesson.resources[existingResourceIdx].title === 'Clinical Worksheet (PDF)') {
          currentLesson.resources[existingResourceIdx].title = cleanFileName;
        }
      } else {
        currentLesson.resources = [
          ...(currentLesson.resources || []),
          {
            title: cleanFileName || 'Clinical Worksheet (PDF)',
            pdfUrl: dataUrl
          }
        ];
      }
      setCourseForm(prev => ({ ...prev, modules: updatedMods }));
    };
    reader.readAsDataURL(file);
  };

  // Dynamic Quiz Questions Builder
  const handleAddQuestion = (quizIdx: number) => {
    const newQ: Question = {
      questionText: 'What thought pattern is described by this clinical scenario?',
      options: [
        'Catastrophizing',
        'Mind Reading',
        'Black-and-White Thinking',
        'Emotional Reasoning'
      ],
      correctOptionIndex: 0,
      explanation: 'Catastrophizing leaps directly to the worst-case scenario from a minor trigger.'
    };
    const updatedQuizzes = [...courseForm.quizzes];
    updatedQuizzes[quizIdx].questions.push(newQ);
    setCourseForm(prev => ({ ...prev, quizzes: updatedQuizzes }));
  };

  const handleDeleteQuestion = (quizIdx: number, qIdx: number) => {
    const updatedQuizzes = [...courseForm.quizzes];
    if (updatedQuizzes[quizIdx].questions.length <= 1) {
      alert('A quiz must contain at least 1 question.');
      return;
    }
    updatedQuizzes[quizIdx].questions = updatedQuizzes[quizIdx].questions.filter((_, i) => i !== qIdx);
    setCourseForm(prev => ({ ...prev, quizzes: updatedQuizzes }));
  };

  // Non-admin guard screen
  if (!loading && (!user || !user.admin)) {
    return (
      <div className="min-h-screen py-24 px-4 bg-slate-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Administrator Access Required</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            This area is restricted to BetterSelf platform administrators. Please sign in with the admin credentials.
          </p>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono text-left">
            <p className="font-bold text-slate-800 font-sans mb-1">Admin Account:</p>
            <p>Email: admin@betterself.pk</p>
            <p>Password: Admin@12345</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            Sign In with Admin Account
          </Link>
        </div>
      </div>
    );
  }

  // Filtered Queue
  const filteredQueue = enrollments.filter(e => {
    if (queueFilter === 'all') return true;
    return e.status === queueFilter;
  });

  // Filtered Students
  const filteredStudents = students.filter(s => {
    if (!studentSearch.trim()) return true;
    const term = studentSearch.toLowerCase();
    return s.name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      {/* Top Header (Logo Blue Foundation) */}
      <section className="bg-gradient-to-r from-[#102a3f] via-[#1d4666] to-[#102a3f] text-white pt-10 pb-8 px-4 sm:px-6 lg:px-8 border-b border-[#3B97D3]/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <BrandMark className="w-12 h-10 mt-1 shrink-0" />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4A261]/20 text-[#f6dec4] border border-[#F4A261]/30 text-xs font-bold mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-[#F4A261]" />
                BetterSelf LMS Administrator Console
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Command Center & CMS
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Signed in as: <strong className="text-[#94c9eb]">{user?.name}</strong> ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-center">
              <p className="text-[10px] text-slate-300 uppercase font-semibold">Pending Review</p>
              <p className="text-xl font-black text-[#F4A261]">{stats?.pendingApprovals || 0}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-center">
              <p className="text-[10px] text-slate-300 uppercase font-semibold">Total Revenue</p>
              <p className="text-xl font-black text-[#7CC157]">PKR {stats?.totalRevenuePKR?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-3 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'overview'
                  ? 'border-[#3B97D3] text-[#206394] bg-[#ddedf8]/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#3B97D3]" />
              Overview & Analytics
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`py-4 px-3 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'queue'
                  ? 'border-[#3B97D3] text-[#206394] bg-[#ddedf8]/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4 text-[#3B97D3]" />
              Payment Verification Queue
              {Boolean(stats?.pendingApprovals) && (
                <span className="px-2 py-0.5 rounded-full bg-[#F4A261] text-white text-[10px] font-extrabold animate-pulse">
                  {stats?.pendingApprovals}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-3 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'students'
                  ? 'border-[#3B97D3] text-[#206394] bg-[#ddedf8]/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-[#3B97D3]" />
              Student Directory ({students.length})
            </button>

            <button
              onClick={() => setActiveTab('builder')}
              className={`py-4 px-3 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'builder'
                  ? 'border-[#3B97D3] text-[#206394] bg-[#ddedf8]/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Plus className="w-4 h-4 text-[#3B97D3]" />
              Course & Curriculum CMS Studio ({adminCourses.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Interactive Date & Period Filter Toolbar */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <CalendarRange className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Revenue & Analytics Date Filter</h3>
                    <p className="text-[11px] text-slate-500">Filter total revenue, course sales, and instructor shares by date range</p>
                  </div>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: '7d', label: 'Last 7 Days' },
                    { id: '30d', label: 'Last 30 Days' },
                    { id: 'this_month', label: 'This Month' },
                    { id: 'custom', label: 'Custom Range' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePeriodChange(p.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        datePeriod === p.id
                          ? 'bg-teal-800 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Pickers */}
              {datePeriod === 'custom' && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-600">Start Date:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-600">End Date:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyCustomDateFilter}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    Apply Custom Filter
                  </button>
                </div>
              )}
            </div>

            {/* 4 Financial & Enrollment KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Gross Platform Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    PKR {stats?.totalRevenuePKR?.toLocaleString() || 0}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Verified IBFT sales in filtered period
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Instructors Revenue Share</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-purple-700">
                    PKR {stats?.totalInstructorPayoutPKR?.toLocaleString() || 0}
                  </p>
                  <p className="text-[11px] text-purple-600 font-medium mt-1">
                    Total shared across all instructors
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Net Platform Retained</span>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-teal-800">
                    PKR {stats?.netPlatformRevenuePKR?.toLocaleString() || 0}
                  </p>
                  <p className="text-[11px] text-teal-600 font-medium mt-1">
                    Platform net margin retained
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Students & Completion</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {stats?.activeEnrollments || 0} <span className="text-xs text-slate-400 font-normal">Active</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {stats?.totalCertificatesIssued || 0} certificates ({stats?.completionRate || 0}% rate)
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown by Course Matrix */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Course Revenue & Payout Matrix</h3>
                  <p className="text-xs text-slate-500">Gross sales, instructor revenue share %, and platform margins per clinical course</p>
                </div>
                <span className="text-xs font-extrabold text-teal-800 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 self-start sm:self-auto">
                  {stats?.revenueByCourse?.length || 0} Courses Tracked
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Instructor</th>
                      <th className="py-3 px-4">Price (PKR)</th>
                      <th className="py-3 px-4">Instructor Share</th>
                      <th className="py-3 px-4">Sales</th>
                      <th className="py-3 px-4">Gross Revenue</th>
                      <th className="py-3 px-4 text-purple-700">Instructor Cut</th>
                      <th className="py-3 px-4 text-teal-800">Platform Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.revenueByCourse?.map((c) => (
                      <tr key={c.courseId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <p>{c.title}</p>
                          <p className="text-[10px] font-mono text-slate-400 font-normal">{c.courseId}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{c.instructorName}</p>
                          <p className="text-[10px] text-slate-400">{c.instructorTitle}</p>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          PKR {c.pricePKR?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[11px]">
                            {c.instructorSharePercent}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-800">
                          {c.activeSalesCount}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          PKR {c.grossRevenuePKR?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-purple-700">
                          PKR {c.instructorEarningsPKR?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-teal-800">
                          PKR {c.platformRevenuePKR?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Faculty & Instructor Revenue Sharing (Individual & Aggregated) */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Faculty & Instructor Revenue Sharing</h3>
                  <p className="text-xs text-slate-500">
                    Aggregated payouts for each clinical instructor across single or multiple courses taught
                  </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-bold text-xs self-start sm:self-auto">
                  Total Faculty Payout: <strong>PKR {stats?.totalInstructorPayoutPKR?.toLocaleString() || 0}</strong>
                </div>
              </div>

              <div className="space-y-4">
                {stats?.revenueByInstructor?.map((inst) => {
                  const isExpanded = expandedInstructor === inst.instructorName;

                  return (
                    <div key={inst.instructorName} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-base">{inst.instructorName}</h4>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                              {inst.coursesCount} Course(s)
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{inst.instructorTitle}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {inst.coursesTaught.map((t, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-700">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 sm:text-right">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Total Sales</p>
                            <p className="text-sm font-extrabold text-slate-800">{inst.totalSalesCount} Students</p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Gross Generated</p>
                            <p className="text-sm font-extrabold text-slate-900">PKR {inst.grossRevenuePKR?.toLocaleString()}</p>
                          </div>

                          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                            <p className="text-[10px] uppercase font-bold text-emerald-800">Instructor Share</p>
                            <p className="text-base font-black text-emerald-800">PKR {inst.instructorEarningsPKR?.toLocaleString()}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedInstructor(isExpanded ? null : inst.instructorName)}
                            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
                            title="View course-by-course breakdown"
                          >
                            {isExpanded ? 'Hide Details ↑' : 'Course Breakdown ↓'}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Course Breakdown */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-200/80 animate-in fade-in duration-150">
                          <p className="text-[11px] font-bold text-slate-600 mb-2 uppercase">Course-by-Course Share Breakdown:</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs bg-white rounded-xl overflow-hidden border border-slate-200">
                              <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                                <tr>
                                  <th className="py-2.5 px-3">Course Title</th>
                                  <th className="py-2.5 px-3">Price</th>
                                  <th className="py-2.5 px-3">Share %</th>
                                  <th className="py-2.5 px-3">Paid Students</th>
                                  <th className="py-2.5 px-3">Gross</th>
                                  <th className="py-2.5 px-3 text-emerald-800 font-bold">Instructor Payout</th>
                                  <th className="py-2.5 px-3 text-teal-800 font-bold">Platform Retained</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {inst.coursesBreakdown.map((cb) => (
                                  <tr key={cb.courseId} className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-semibold text-slate-800">{cb.courseTitle}</td>
                                    <td className="py-2.5 px-3 font-mono">PKR {cb.pricePKR?.toLocaleString()}</td>
                                    <td className="py-2.5 px-3 font-bold text-purple-700">{cb.sharePercent}%</td>
                                    <td className="py-2.5 px-3 font-bold">{cb.salesCount}</td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">PKR {cb.grossRevenuePKR?.toLocaleString()}</td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">PKR {cb.instructorEarningsPKR?.toLocaleString()}</td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-teal-800">PKR {cb.platformRevenuePKR?.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions & Live Courses List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Administrative Shortcuts</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('queue')}
                    className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-700" />
                      Review Verification Queue
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px]">
                      {stats?.pendingApprovals} Pending
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('builder');
                      handleOpenCreateStudio();
                    }}
                    className="w-full p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-teal-700" />
                      Create & Publish New Course
                    </span>
                    <ChevronRight className="w-4 h-4 text-teal-600" />
                  </button>

                  <button
                    onClick={() => setActiveTab('students')}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-600" />
                      Inspect Student Directory ({students.length})
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Live Courses ({adminCourses.length})</h3>
                  <button
                    onClick={() => {
                      setActiveTab('builder');
                      handleOpenCreateStudio();
                    }}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800"
                  >
                    + Add New Course
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {adminCourses.map(c => (
                    <div key={c.courseId} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{c.title}</p>
                        <p className="text-[11px] text-slate-500">Instructor: {c.instructorName} • Share: {c.instructorSharePercent || 40}%</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-900">PKR {c.pricePKR?.toLocaleString()}</span>
                        <button
                          onClick={() => {
                            setActiveTab('builder');
                            handleOpenEditStudio(c.courseId);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px]"
                        >
                          Edit Course
                        </button>
                        <Link
                          href={`/course/${c.courseId}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Open public page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PAYMENT VERIFICATION & RECEIPT GALLERY */}
        {/* ========================================================= */}
        {activeTab === 'queue' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Payment Verification & Receipt Center</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect attached screenshots, verify TID, and approve access with 1 click.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                {(['pending', 'active', 'rejected', 'all'] as const).map(tabKey => (
                  <button
                    key={tabKey}
                    onClick={() => setQueueFilter(tabKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      queueFilter === tabKey ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tabKey}
                  </button>
                ))}
              </div>
            </div>

            {filteredQueue.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No enrollments found matching filter "{queueFilter}".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Student & Contact</th>
                      <th className="py-3 px-4">Applied Course</th>
                      <th className="py-3 px-4">Wallet & TID</th>
                      <th className="py-3 px-4">Receipt Screenshot</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueue.map((enr) => {
                      const isPending = enr.status === 'pending';
                      const isBusy = actionLoading === enr.enrollmentId;

                      return (
                        <tr key={enr.enrollmentId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-900">{enr.userName || enr.userEmail}</p>
                            <p className="text-[11px] text-slate-400">{enr.userEmail}</p>
                            {enr.userPhone && (
                              <p className="text-[11px] font-mono font-bold text-teal-800 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-teal-600" />
                                {enr.userPhone}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-0.5">UID: {enr.userId}</p>
                          </td>

                          <td className="py-4 px-4">
                            <p className="font-semibold text-slate-900">{enr.courseTitle || enr.courseId}</p>
                            <p className="text-[11px] font-extrabold text-teal-800">PKR {enr.pricePKR?.toLocaleString()}</p>
                          </td>

                          <td className="py-4 px-4">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                              {enr.paymentMethod}
                            </span>
                            <p className="font-mono font-bold text-xs text-slate-800 mt-1">{enr.transactionId}</p>
                            <p className="text-[10px] text-slate-400">{new Date(enr.createdAt).toLocaleString()}</p>
                          </td>

                          <td className="py-4 px-4">
                            {enr.receiptImageUrl ? (
                              <button
                                type="button"
                                onClick={() => setReceiptModalUrl(enr.receiptImageUrl)}
                                className="group relative w-14 h-14 rounded-xl overflow-hidden border border-slate-300 hover:border-teal-600 transition-all shadow-sm"
                                title="Click to view full receipt"
                              >
                                <img
                                  src={enr.receiptImageUrl}
                                  alt="Receipt proof"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">No image</span>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                                enr.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : enr.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-900 animate-pulse'
                              }`}
                            >
                              {enr.status}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleUpdateStatus(enr.enrollmentId, 'active')}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleUpdateStatus(enr.enrollmentId, 'rejected')}
                                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Verified {enr.verifiedBy ? `by ${enr.verifiedBy}` : ''}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STUDENT DIRECTORY */}
        {/* ========================================================= */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Student Directory ({students.length})</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  All registered learner accounts, enrollment records, and clinical progress
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search student by name or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-600"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No students found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Student & Contact</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4">Enrolled Courses</th>
                      <th className="py-3 px-4">Status & Progress</th>
                      <th className="py-3 px-4">Certificates</th>
                      <th className="py-3 px-4 text-right">Account Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((stu) => (
                      <tr key={stu.uid} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{stu.name || 'Unnamed Student'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{stu.email}</p>
                          {stu.phoneNumber ? (
                            <p className="text-[11px] font-mono font-bold text-teal-800 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-teal-600" />
                              {stu.phoneNumber}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">No phone attached</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">UID: {stu.uid}</p>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {stu.createdAt ? new Date(stu.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="py-3.5 px-4">
                          {stu.enrollments.length === 0 ? (
                            <span className="text-slate-400 italic">No enrollments yet</span>
                          ) : (
                            <div className="space-y-1">
                              {stu.enrollments.map((enr: any) => (
                                <div key={enr.enrollmentId} className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-800">{enr.courseTitle}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {stu.enrollments.length === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">Visitor</span>
                          ) : (
                            <div className="space-y-1">
                              {stu.enrollments.map((enr: any) => (
                                <div key={enr.enrollmentId} className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                    enr.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {enr.status}
                                  </span>
                                  {enr.status === 'active' && (
                                    <span className="text-teal-700 font-bold">{enr.progressPercent}%</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {stu.certificates && stu.certificates.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setCertModalUser(stu)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs transition-colors shadow-sm"
                              title="Inspect earned certificates"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-600" />
                              <span>{stu.certificates.length} Certificate(s)</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">None yet</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordModalUser(stu);
                              setNewPasswordInput('');
                              setPasswordUpdateStatus(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors shadow-sm"
                            title="Update or reset student password"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-teal-700" />
                            <span>Change Password</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: COURSE & CURRICULUM CMS STUDIO */}
        {/* ========================================================= */}
        {activeTab === 'builder' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* SUB-VIEW 1: COURSE MANAGER TABLE */}
            {studioMode === 'list' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Course Catalog & Curriculum CMS</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage published clinical tracks, add new courses, and edit modules, videos, and quizzes.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenCreateStudio}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Course
                  </button>
                </div>

                {/* Course List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-4">Instructor</th>
                        <th className="py-3 px-4">Pricing</th>
                        <th className="py-3 px-4">Difficulty</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminCourses.map((c) => (
                        <tr key={c.courseId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={c.thumbnailUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80'}
                                alt=""
                                className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-snug">{c.title}</p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{c.courseId}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <p className="font-semibold text-slate-800">{c.instructorName}</p>
                            <p className="text-[10px] text-slate-400">{c.instructorTitle}</p>
                          </td>

                          <td className="py-4 px-4 font-extrabold text-slate-900">
                            PKR {Number(c.pricePKR).toLocaleString()}
                          </td>

                          <td className="py-4 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {c.difficulty || 'Beginner'}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              c.isPublished !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {c.isPublished !== false ? 'Published' : 'Draft'}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditStudio(c.courseId)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Edit Course
                              </button>

                              <Link
                                href={`/course/${c.courseId}`}
                                target="_blank"
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                                title="Preview Public Page"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                onClick={() => handleDeleteCourse(c.courseId)}
                                className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors"
                                title="Delete Course"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: FULL INTERACTIVE COURSE STUDIO (BUILDER / EDITOR) */}
            {studioMode === 'editor' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
                {/* Studio Navigation Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setStudioMode('list')}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                      title="Back to courses list"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {isEditingExisting ? `Editing Course: ${courseForm.title}` : 'Create & Publish New Course'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure course metadata, embed unlisted YouTube video lectures, and build clinical assessments.
                      </p>
                    </div>
                  </div>

                  {/* Studio Section Tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setActiveStudioTab('vitals')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeStudioTab === 'vitals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      1. Course Vitals
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStudioTab('curriculum')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        activeStudioTab === 'curriculum' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      2. Modules & Videos ({courseForm.modules.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStudioTab('quizzes')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        activeStudioTab === 'quizzes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      3. Quizzes & MCQs ({courseForm.quizzes.length})
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveCourse} className="space-y-8">
                  {/* SECTION 1: COURSE VITALS & PRICING */}
                  {activeStudioTab === 'vitals' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Course ID (Unique Identifier) *
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isEditingExisting}
                            placeholder="e.g. c_adhd_101"
                            value={courseForm.courseId}
                            onChange={(e) => setCourseForm({ ...courseForm, courseId: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-slate-50 disabled:opacity-60"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Course Title *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ADHD & Executive Function Mastery"
                            value={courseForm.title}
                            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Subtitle & Clinical Promise *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Cognitive scaffolding and dopamine regulation tools for everyday productivity"
                            value={courseForm.subtitle}
                            onChange={(e) => setCourseForm({ ...courseForm, subtitle: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Pricing in PKR *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">PKR</span>
                            <input
                              type="number"
                              required
                              value={courseForm.pricePKR}
                              onChange={(e) => setCourseForm({ ...courseForm, pricePKR: Number(e.target.value) })}
                              className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Instructor Share (%) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              required
                              value={courseForm.instructorSharePercent}
                              onChange={(e) => setCourseForm({ ...courseForm, instructorSharePercent: Number(e.target.value) })}
                              className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs font-bold font-mono"
                            />
                            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">%</span>
                          </div>
                          <p className="text-[10px] text-teal-700 mt-1 font-semibold truncate">
                            Earns PKR {Math.round((courseForm.pricePKR || 0) * ((courseForm.instructorSharePercent || 0) / 100)).toLocaleString()}/sale
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Difficulty Level
                          </label>
                          <select
                            value={courseForm.difficulty}
                            onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value as any })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Publication Status
                          </label>
                          <select
                            value={courseForm.isPublished ? 'published' : 'draft'}
                            onChange={(e) => setCourseForm({ ...courseForm, isPublished: e.target.value === 'published' })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                          >
                            <option value="published">Published (Live in Catalog)</option>
                            <option value="draft">Draft (Hidden)</option>
                          </select>
                        </div>

                        {/* Requirement 6: Course Thumbnail Upload & Preview */}
                        <div className="sm:col-span-4">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Course Thumbnail Image *
                          </label>
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            {courseForm.thumbnailUrl ? (
                              <div className="relative w-36 h-24 rounded-2xl overflow-hidden border-2 border-teal-600 shadow-sm shrink-0 bg-slate-100 group">
                                <img
                                  src={courseForm.thumbnailUrl}
                                  alt="Course Thumbnail"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => setCourseForm({ ...courseForm, thumbnailUrl: '' })}
                                  className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove Image"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-36 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 bg-slate-50">
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                                <span className="text-[10px] mt-1 font-semibold">No Image Selected</span>
                              </div>
                            )}

                            <div className="flex-1 space-y-2 w-full">
                              <div className="flex flex-wrap items-center gap-2">
                                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload Thumbnail from Device</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setCourseForm({ ...courseForm, thumbnailUrl: reader.result as string });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                                <span className="text-xs text-slate-400 font-medium">or paste direct image URL below</span>
                              </div>

                              <input
                                type="text"
                                value={courseForm.thumbnailUrl}
                                onChange={(e) => setCourseForm({ ...courseForm, thumbnailUrl: e.target.value })}
                                placeholder="https://images.unsplash.com/... or image data URL"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Requirement 7: Instructor Credentials Only (Self-Paced Courses — No Meet Schedule or Room Link) */}
                      <div className="pt-6 border-t border-slate-100">
                        <div className="mb-4">
                          <h3 className="font-bold text-slate-900 text-sm">
                            Instructor Credentials & Author
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Self-paced clinical course. Students proceed through modules on-demand without scheduled live calls.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Instructor Full Name</label>
                            <input
                              type="text"
                              value={courseForm.instructorName}
                              onChange={(e) => setCourseForm({ ...courseForm, instructorName: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Title & MS Credentials</label>
                            <input
                              type="text"
                              value={courseForm.instructorTitle}
                              onChange={(e) => setCourseForm({ ...courseForm, instructorTitle: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: DYNAMIC MODULES & LESSONS */}
                  {activeStudioTab === 'curriculum' && (
                    <div className="space-y-8 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">Curriculum Architecture & Lectures</h3>
                          <p className="text-xs text-slate-500">
                            Create modules, paste YouTube links, upload downloadable worksheets, and mark the Free Intro Video.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddModule}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add New Module
                        </button>
                      </div>

                      <div className="space-y-6">
                        {courseForm.modules.map((mod, modIdx) => (
                          <div
                            key={modIdx}
                            className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-sm space-y-5"
                          >
                            {/* Module Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-teal-800 text-white font-mono font-bold text-xs">
                                  Module {modIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={mod.title}
                                  onChange={(e) => {
                                    const updated = [...courseForm.modules];
                                    updated[modIdx].title = e.target.value;
                                    setCourseForm({ ...courseForm, modules: updated });
                                  }}
                                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold w-72 bg-white"
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddLesson(modIdx)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors"
                                >
                                  <Plus className="w-3 h-3 text-teal-700" />
                                  Add Lesson
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteModule(modIdx)}
                                  className="p-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors"
                                  title="Delete Module"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Lessons List in this Module */}
                            <div className="space-y-4">
                              {mod.lessons.map((lesson, lessonIdx) => {
                                const cleanVideoId = extractYouTubeId(lesson.youtubeVideoId || '');

                                return (
                                  <div
                                    key={lessonIdx}
                                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-slate-400">
                                          #{lessonIdx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          value={lesson.title}
                                          onChange={(e) => {
                                            const updated = [...courseForm.modules];
                                            updated[modIdx].lessons[lessonIdx].title = e.target.value;
                                            setCourseForm({ ...courseForm, modules: updated });
                                          }}
                                          placeholder="Lesson Title"
                                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold w-64 sm:w-80"
                                        />
                                      </div>

                                      <div className="flex items-center gap-3">
                                        {/* Requirement 4: Free Preview Toggle strictly for Module 1 */}
                                        {modIdx === 0 && (
                                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200">
                                            <input
                                              type="checkbox"
                                              checked={lesson.isFreePreview}
                                              onChange={(e) => {
                                                const updated = [...courseForm.modules];
                                                updated[modIdx].lessons[lessonIdx].isFreePreview = e.target.checked;
                                                setCourseForm({ ...courseForm, modules: updated });
                                              }}
                                              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                            />
                                            <span className={lesson.isFreePreview ? 'text-teal-800 font-bold' : 'text-slate-600'}>
                                              Free Intro Video (Module 1 Only)
                                            </span>
                                          </label>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteLesson(modIdx, lessonIdx)}
                                          className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                          title="Delete Lesson"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Video / Duration Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                          Lesson Type
                                        </label>
                                        <select
                                          value={lesson.type}
                                          onChange={(e) => {
                                            const updated = [...courseForm.modules];
                                            updated[modIdx].lessons[lessonIdx].type = e.target.value as any;
                                            setCourseForm({ ...courseForm, modules: updated });
                                          }}
                                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                                        >
                                          <option value="video">Video Lecture (YouTube)</option>
                                          <option value="pdf">PDF Worksheet Lab</option>
                                          <option value="quiz">Quiz Assessment</option>
                                        </select>
                                      </div>

                                      <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                          YouTube URL or Video ID (Unlisted videos supported)
                                        </label>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={lesson.youtubeVideoId || ''}
                                            onChange={(e) => {
                                              const updated = [...courseForm.modules];
                                              updated[modIdx].lessons[lessonIdx].youtubeVideoId = e.target.value;
                                              setCourseForm({ ...courseForm, modules: updated });
                                            }}
                                            placeholder="Paste e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                                          />
                                          {cleanVideoId && (
                                            <a
                                              href={`https://www.youtube.com/watch?v=${cleanVideoId}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                              title="Test video link"
                                            >
                                              <PlayCircle className="w-4 h-4 text-teal-600" />
                                            </a>
                                          )}
                                        </div>
                                      </div>

                                      <div className="sm:col-span-3">
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                          Lesson Clinical Summary
                                        </label>
                                        <input
                                          type="text"
                                          value={lesson.summaryText}
                                          onChange={(e) => {
                                            const updated = [...courseForm.modules];
                                            updated[modIdx].lessons[lessonIdx].summaryText = e.target.value;
                                            setCourseForm({ ...courseForm, modules: updated });
                                          }}
                                          placeholder="Brief description of the CBT concepts taught in this lesson"
                                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                                        />
                                      </div>
                                    </div>

                                    {/* Requirement 1: Downloadable PDF Worksheets with Direct File Upload & URL */}
                                    <div className="pt-3 border-t border-slate-100 space-y-3">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                          <FileText className="w-3.5 h-3.5 text-teal-700" />
                                          Downloadable Worksheets & PDF Resources ({lesson.resources?.length || 0}):
                                        </span>

                                        <div className="flex items-center gap-2">
                                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-xs cursor-pointer transition-colors shadow-sm">
                                            <Upload className="w-3.5 h-3.5 text-teal-700" />
                                            <span>Upload Worksheet (PDF)</span>
                                            <input
                                              type="file"
                                              accept=".pdf,application/pdf"
                                              className="hidden"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  handleWorksheetFileUpload(modIdx, lessonIdx, file);
                                                  e.target.value = '';
                                                }
                                              }}
                                            />
                                          </label>

                                          <button
                                            type="button"
                                            onClick={() => handleAddResource(modIdx, lessonIdx)}
                                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-600 transition-colors"
                                          >
                                            + Add URL Link
                                          </button>
                                        </div>
                                      </div>

                                      {lesson.resources && lesson.resources.length > 0 && (
                                        <div className="space-y-2">
                                          {lesson.resources.map((r, rIdx) => {
                                            const isDataUri = r.pdfUrl?.startsWith('data:');

                                            return (
                                              <div
                                                key={rIdx}
                                                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                                              >
                                                <input
                                                  type="text"
                                                  value={r.title}
                                                  onChange={(e) => {
                                                    const updated = [...courseForm.modules];
                                                    updated[modIdx].lessons[lessonIdx].resources[rIdx].title = e.target.value;
                                                    setCourseForm({ ...courseForm, modules: updated });
                                                  }}
                                                  placeholder="Worksheet Title (e.g. CBT Thought Record)"
                                                  className="w-full sm:w-56 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                                                />

                                                <div className="flex-1 flex items-center gap-2">
                                                  {isDataUri ? (
                                                    <div className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                                                      <span className="flex items-center gap-1.5 font-mono text-[11px]">
                                                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                                        Uploaded Worksheet Document
                                                      </span>
                                                      <a
                                                        href={r.pdfUrl}
                                                        download={`${r.title || 'worksheet'}.pdf`}
                                                        className="text-emerald-700 font-bold underline hover:text-emerald-900 text-[11px]"
                                                      >
                                                        Download/Preview
                                                      </a>
                                                    </div>
                                                  ) : (
                                                    <input
                                                      type="text"
                                                      value={r.pdfUrl}
                                                      onChange={(e) => {
                                                        const updated = [...courseForm.modules];
                                                        updated[modIdx].lessons[lessonIdx].resources[rIdx].pdfUrl = e.target.value;
                                                        setCourseForm({ ...courseForm, modules: updated });
                                                      }}
                                                      placeholder="https://storage.../worksheet.pdf or URL"
                                                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                                                    />
                                                  )}

                                                  {/* Replace / Upload file icon */}
                                                  <label
                                                    className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer shrink-0"
                                                    title="Upload/Replace PDF file for this worksheet"
                                                  >
                                                    <Upload className="w-3.5 h-3.5 text-slate-700" />
                                                    <input
                                                      type="file"
                                                      accept=".pdf,application/pdf"
                                                      className="hidden"
                                                      onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                          handleWorksheetFileUpload(modIdx, lessonIdx, file, rIdx);
                                                          e.target.value = '';
                                                        }
                                                      }}
                                                    />
                                                  </label>

                                                  {/* Remove worksheet */}
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteResource(modIdx, lessonIdx, rIdx)}
                                                    className="p-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-500 shrink-0 transition-colors"
                                                    title="Remove Worksheet"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Requirement 2: Button to add lesson at end of last lesson */}
                              <button
                                type="button"
                                onClick={() => handleAddLesson(modIdx)}
                                className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-white hover:bg-teal-50/50 text-teal-800 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-sm group"
                              >
                                <Plus className="w-4 h-4 text-teal-600 group-hover:scale-125 transition-transform" />
                                <span>+ Add Lesson to Module {modIdx + 1}</span>
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Requirement 3: Button to add module where module ends */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleAddModule}
                            className="w-full py-4 px-6 rounded-3xl border-2 border-dashed border-teal-300 hover:border-teal-600 bg-white hover:bg-teal-50/40 text-slate-800 hover:text-teal-900 font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm group"
                          >
                            <Plus className="w-5 h-5 text-teal-700 group-hover:scale-125 transition-transform" />
                            <span>+ Add New Module to Curriculum (Module {courseForm.modules.length + 1})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 3: QUIZZES & ASSESSMENTS BUILDER */}
                  {activeStudioTab === 'quizzes' && (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">Clinical Assessments & Quiz Engine</h3>
                          <p className="text-xs text-slate-500">
                            Configure auto-graded multiple choice questions with per-question clinical explanations.
                          </p>
                        </div>
                      </div>

                      {courseForm.quizzes.map((quiz, qzIdx) => (
                        <div key={qzIdx} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="px-2.5 py-1 rounded-lg bg-teal-800 text-white font-mono font-bold text-xs">
                                Quiz ID: {quiz.quizId}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="font-bold text-slate-600">Passing Score:</span>
                                <input
                                  type="number"
                                  value={quiz.passingScore}
                                  onChange={(e) => {
                                    const updated = [...courseForm.quizzes];
                                    updated[qzIdx].passingScore = Number(e.target.value);
                                    setCourseForm({ ...courseForm, quizzes: updated });
                                  }}
                                  className="w-16 px-2 py-1 rounded-lg border border-slate-300 font-mono font-bold text-xs"
                                />
                                <span className="font-bold text-slate-500">%</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddQuestion(qzIdx)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-teal-800 hover:bg-slate-100"
                            >
                              <Plus className="w-3 h-3" />
                              Add Question
                            </button>
                          </div>

                          {/* Questions List */}
                          <div className="space-y-4">
                            {quiz.questions.map((q, qIdx) => (
                              <div key={qIdx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-xs text-teal-700">
                                    Question {qIdx + 1}:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuestion(qzIdx, qIdx)}
                                    className="p-1 rounded-lg hover:bg-red-50 text-red-500"
                                    title="Delete Question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <input
                                  type="text"
                                  value={q.questionText}
                                  onChange={(e) => {
                                    const updated = [...courseForm.quizzes];
                                    updated[qzIdx].questions[qIdx].questionText = e.target.value;
                                    setCourseForm({ ...courseForm, quizzes: updated });
                                  }}
                                  placeholder="Enter the question prompt..."
                                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                                />

                                {/* 4 Multiple Choice Options */}
                                <div className="space-y-2 pt-1">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                    Options & Correct Answer Selection:
                                  </label>
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`correct_${qzIdx}_${qIdx}`}
                                        checked={q.correctOptionIndex === optIdx}
                                        onChange={() => {
                                          const updated = [...courseForm.quizzes];
                                          updated[qzIdx].questions[qIdx].correctOptionIndex = optIdx;
                                          setCourseForm({ ...courseForm, quizzes: updated });
                                        }}
                                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                                      />
                                      <span className="w-5 text-xs font-mono font-bold text-slate-400">
                                        {String.fromCharCode(65 + optIdx)}.
                                      </span>
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const updated = [...courseForm.quizzes];
                                          updated[qzIdx].questions[qIdx].options[optIdx] = e.target.value;
                                          setCourseForm({ ...courseForm, quizzes: updated });
                                        }}
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                                      />
                                    </div>
                                  ))}
                                </div>

                                {/* Clinical Rationale Explanation */}
                                <div className="pt-2">
                                  <label className="block text-[10px] font-bold text-teal-800 mb-1">
                                    Clinical Explanation (Rendered to student post-submission):
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={q.explanation}
                                    onChange={(e) => {
                                      const updated = [...courseForm.quizzes];
                                      updated[qzIdx].questions[qIdx].explanation = e.target.value;
                                      setCourseForm({ ...courseForm, quizzes: updated });
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-teal-200 text-xs"
                                  />
                                </div>
                              </div>
                            ))}

                            {/* Requirement 5: Button to add question at end of last question */}
                            <button
                              type="button"
                              onClick={() => handleAddQuestion(qzIdx)}
                              className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-white hover:bg-teal-50/50 text-teal-800 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-sm group"
                            >
                              <Plus className="w-4 h-4 text-teal-600 group-hover:scale-125 transition-transform" />
                              <span>+ Add Question to Quiz (Question {quiz.questions.length + 1})</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* BOTTOM SAVE & PUBLISH ACTION BAR */}
                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStudioMode('list')}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>

                      {courseSaveStatus && (
                        <span className={`text-xs font-bold ${
                          courseSaveStatus.startsWith('✓') ? 'text-emerald-700' : 'text-red-600'
                        }`}>
                          {courseSaveStatus}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="px-8 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow-lg shadow-teal-900/20 transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isEditingExisting ? 'Save & Update Course' : 'Publish Course to Catalog'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Receipt Inspection */}
      {receiptModalUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 overflow-hidden shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-sm text-slate-900">Payment Screenshot Proof</span>
              <button
                onClick={() => setReceiptModalUrl(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50">
              <img src={receiptModalUrl} alt="Receipt proof" className="w-full h-auto object-contain" />
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setReceiptModalUrl(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Lightbox
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Update Modal for Administrator */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 overflow-hidden shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <KeyRound className="w-4 h-4 text-teal-700" />
                <span>Update Student Password</span>
              </div>
              <button
                onClick={() => { setPasswordModalUser(null); setPasswordUpdateStatus(null); }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{passwordModalUser.name}</p>
              <p className="text-slate-500 font-mono text-[11px]">{passwordModalUser.email}</p>
              {passwordModalUser.phoneNumber && (
                <p className="text-teal-800 font-mono text-[11px] font-bold flex items-center gap-1">
                  <Phone className="w-3 h-3 text-teal-600" />
                  {passwordModalUser.phoneNumber}
                </p>
              )}
              {passwordModalUser.password && (
                <p className="text-slate-400 text-[10px] pt-1">
                  Current password: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-mono">{passwordModalUser.password}</code>
                </p>
              )}
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (minimum 6 characters) *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="Enter new student password..."
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none"
                />
              </div>

              {passwordUpdateStatus && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  passwordUpdateStatus.startsWith('✓')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {passwordUpdateStatus}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setPasswordModalUser(null); setPasswordUpdateStatus(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordUpdating}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  {passwordUpdating ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Inspection Modal for Administrator */}
      {certModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 overflow-hidden shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Clinical Certificates — {certModalUser.name}</span>
              </div>
              <button
                onClick={() => setCertModalUser(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {(!certModalUser.certificates || certModalUser.certificates.length === 0) ? (
                <p className="text-xs text-slate-400 py-8 text-center italic">
                  This student has not earned any clinical completion certificates yet.
                </p>
              ) : (
                certModalUser.certificates.map((cert: any) => (
                  <div key={cert.certificateId} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                          Verified Certificate
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{cert.courseTitle}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        {cert.passingScore}% Score
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                      <p>Certificate ID: <strong className="text-slate-800">{cert.certificateId}</strong></p>
                      <p>Issued: {new Date(cert.completionDate).toLocaleDateString()}</p>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <Link
                        href={cert.verificationUrl || `/verify/${cert.certificateId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Inspect Public Verification Page</span>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setCertModalUser(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
