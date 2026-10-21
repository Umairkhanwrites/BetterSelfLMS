import express from 'express';
import {
  verifyFirebaseToken,
  isAdmin,
  verifyCourseAccess,
  verifyActive
} from '../middleware/authGuard.js';
import {
  login,
  register,
  getMe
} from '../controllers/authCtrl.js';
import {
  getAdminStats,
  getStudentsList,
  updateStudentPassword,
  getAdminCourses,
  getAdminCourseById,
  deleteCourse
} from '../controllers/adminCtrl.js';
import {
  getCourses,
  getCourseById,
  createOrUpdateCourse
} from '../controllers/courseCtrl.js';
import {
  requestEnrollment,
  getMyEnrollments,
  updateEnrollmentStatus,
  getAllEnrollmentsAdmin
} from '../controllers/enrollCtrl.js';
import {
  getCourseClassroom,
  getQuiz,
  markItemComplete,
  submitQuiz,
  saveNote,
  getNotes
} from '../controllers/learnCtrl.js';
import {
  generateCertificate,
  verifyCertificate
} from '../controllers/certCtrl.js';

const router = express.Router();

// Root /api endpoint directory & status
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'BetterSelf Learning Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      courses: '/api/courses',
      singleCourse: '/api/courses/:courseId',
      myEnrollments: '/api/enrollments/my',
      requestEnrollment: 'POST /api/enrollments/request',
      learnClassroom: '/api/learn/:courseId',
      completeItem: 'POST /api/learn/:courseId/complete',
      submitQuiz: 'POST /api/learn/:courseId/quiz',
      notes: '/api/learn/:courseId/notes',
      generateCertificate: 'POST /api/learn/:courseId/certificate',
      verifyCertificate: '/api/verify/:certificateId',
      adminEnrollments: '/api/admin/enrollments',
      adminCourses: 'POST /api/admin/courses'
    }
  });
});

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'BetterSelf LMS API', timestamp: new Date().toISOString() });
});

// ==========================================
// Authentication Endpoints
// ==========================================
// POST /api/auth/login
router.post('/auth/login', login);

// POST /api/auth/register
router.post('/auth/register', register);

// GET /api/auth/me (verifyToken)
router.get('/auth/me', verifyFirebaseToken, getMe);

// ==========================================
// SEC-05: Courses Endpoints
// ==========================================
// GET /api/courses (Public) - Returns all isPublished: true courses
router.get('/courses', getCourses);

// GET /api/courses/:courseId (Public) - Returns course metadata + curriculum titles (redacts non-preview video IDs/PDFs)
router.get('/courses/:courseId', getCourseById);

// ==========================================
// SEC-05: Enrollments Endpoints
// ==========================================
// POST /api/enrollments/request (verifyToken) - Creates pending record
router.post('/enrollments/request', verifyFirebaseToken, requestEnrollment);

// GET /api/enrollments/my (verifyToken) - Returns user's active & pending enrollments
router.get('/enrollments/my', verifyFirebaseToken, getMyEnrollments);

// ==========================================
// SEC-05: Classroom Learning Endpoints
// ==========================================
// GET /api/learn/:courseId (verifyAccess) - Returns full lessons/PDFs if active, or Module 1 only if pending < 24h
router.get('/learn/:courseId', verifyFirebaseToken, verifyCourseAccess, getCourseClassroom);

// POST /api/learn/:courseId/complete (verifyAccess) - Body: { itemId }. Adds to completedItemIds, updates progressPercent
router.post('/learn/:courseId/complete', verifyFirebaseToken, verifyCourseAccess, markItemComplete);

// GET /api/learn/:courseId/quiz/:quizId (verifyAccess) - Returns quiz questions
router.get('/learn/:courseId/quiz/:quizId', verifyFirebaseToken, verifyCourseAccess, getQuiz);

// POST /api/learn/:courseId/quiz (verifyAccess) - Body: { quizId, answers: [] }. Grades quiz, returns score %, pass status & explanations
router.post('/learn/:courseId/quiz', verifyFirebaseToken, verifyCourseAccess, submitQuiz);

// POST /api/learn/:courseId/notes (verifyAccess) - Body: { lessonId, videoTimestampSeconds, content }
router.post('/learn/:courseId/notes', verifyFirebaseToken, verifyCourseAccess, saveNote);

// GET /api/learn/:courseId/notes (verifyAccess) - Returns saved notes
router.get('/learn/:courseId/notes', verifyFirebaseToken, verifyCourseAccess, getNotes);

// POST /api/learn/:courseId/certificate (verifyActive) - Requires progressPercent === 100. Generates QR-stamped PDF via pdf-lib
router.post('/learn/:courseId/certificate', verifyFirebaseToken, verifyActive, generateCertificate);

// ==========================================
// SEC-05: Public Certificate Verification
// ==========================================
// GET /api/verify/:certificateId (Public) - Returns verified certificate record for public QR / LinkedIn credential check
router.get('/verify/:certificateId', verifyCertificate);

// ==========================================
// SEC-05: Admin Endpoints
// ==========================================
// GET /api/admin/stats (isAdmin) - Live KPI metrics
router.get('/admin/stats', verifyFirebaseToken, isAdmin, getAdminStats);

// GET /api/admin/students (isAdmin) - Directory of all registered student accounts
router.get('/admin/students', verifyFirebaseToken, isAdmin, getStudentsList);

// PATCH /api/admin/students/:uid/password (isAdmin) - Admin can update student password
router.patch('/admin/students/:uid/password', verifyFirebaseToken, isAdmin, updateStudentPassword);

// GET /api/admin/enrollments (isAdmin) - List all enrollments for verification queue
router.get('/admin/enrollments', verifyFirebaseToken, isAdmin, getAllEnrollmentsAdmin);

// PATCH /api/admin/enrollments/:id (isAdmin) - 1-click payment approval / rejection
router.patch('/admin/enrollments/:id', verifyFirebaseToken, isAdmin, updateEnrollmentStatus);

// GET /api/admin/courses (isAdmin) - List all courses including drafts for CMS
router.get('/admin/courses', verifyFirebaseToken, isAdmin, getAdminCourses);

// GET /api/admin/courses/:courseId (isAdmin) - Fetch full unredacted course for editing
router.get('/admin/courses/:courseId', verifyFirebaseToken, isAdmin, getAdminCourseById);

// POST /api/admin/courses (isAdmin) - Creates or updates course document, module sub-collections, and quizzes
router.post('/admin/courses', verifyFirebaseToken, isAdmin, createOrUpdateCourse);

// DELETE /api/admin/courses/:courseId (isAdmin) - Removes a course
router.delete('/admin/courses/:courseId', verifyFirebaseToken, isAdmin, deleteCourse);

export default router;
