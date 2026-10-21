import { db } from '../config/firebaseAdmin.js';

// GET /api/admin/stats (isAdmin) - Live KPI metrics with date filtering & instructor revenue share
export const getAdminStats = async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;

    let filterStart = null;
    let filterEnd = null;
    const now = new Date();

    if (startDate) {
      filterStart = new Date(startDate);
    }
    if (endDate) {
      filterEnd = new Date(endDate);
      if (endDate.length <= 10) {
        filterEnd.setHours(23, 59, 59, 999);
      }
    }

    if (!startDate && !endDate && period && period !== 'all') {
      if (period === 'today') {
        filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (period === '7d') {
        filterStart = new Date(now.getTime() - 7 * 24 * 36e5);
        filterEnd = now;
      } else if (period === '30d') {
        filterStart = new Date(now.getTime() - 30 * 24 * 36e5);
        filterEnd = now;
      } else if (period === 'this_month') {
        filterStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        filterEnd = now;
      }
    }

    const enrollmentsSnap = await db.collection('enrollments').get();
    const coursesSnap = await db.collection('courses').get();
    const usersSnap = await db.collection('users').get();
    const certsSnap = await db.collection('certificates').get();

    // Initialize course map for per-course and per-instructor analytics
    const courseMap = {};
    coursesSnap.docs.forEach(doc => {
      const c = doc.data();
      const cId = doc.id;
      courseMap[cId] = {
        courseId: cId,
        title: c.title || cId,
        instructorName: c.instructorName || 'Dr. Ayesha Siddiqui',
        instructorTitle: c.instructorTitle || 'Clinical Faculty',
        instructorSharePercent: Number(c.instructorSharePercent !== undefined ? c.instructorSharePercent : 40),
        pricePKR: Number(c.pricePKR) || 3500,
        activeSalesCount: 0,
        grossRevenuePKR: 0,
        instructorEarningsPKR: 0,
        platformRevenuePKR: 0
      };
    });

    let totalRevenue = 0;
    let totalInstructorPayout = 0;
    let netPlatformRevenue = 0;
    let pendingApprovals = 0;
    let activeEnrollments = 0;
    let rejectedEnrollments = 0;

    enrollmentsSnap.docs.forEach(doc => {
      const data = doc.data();
      const enrDate = new Date(data.createdAt || data.updatedAt || 0);

      // Check date filter
      const matchesDate = (!filterStart || enrDate >= filterStart) && (!filterEnd || enrDate <= filterEnd);

      if (data.status === 'active') {
        if (matchesDate) {
          activeEnrollments += 1;
          const price = Number(data.pricePKR) || 0;

          // Lookup course for revenue share calculation
          const cInfo = courseMap[data.courseId] || {
            courseId: data.courseId,
            title: data.courseTitle || data.courseId,
            instructorName: 'Dr. Ayesha Siddiqui',
            instructorTitle: 'Clinical Psychologist',
            instructorSharePercent: 40,
            pricePKR: price,
            activeSalesCount: 0,
            grossRevenuePKR: 0,
            instructorEarningsPKR: 0,
            platformRevenuePKR: 0
          };

          const sharePct = cInfo.instructorSharePercent;
          const instCut = Math.round(price * (sharePct / 100));
          const platCut = price - instCut;

          cInfo.activeSalesCount += 1;
          cInfo.grossRevenuePKR += price;
          cInfo.instructorEarningsPKR += instCut;
          cInfo.platformRevenuePKR += platCut;

          totalRevenue += price;
          totalInstructorPayout += instCut;
          netPlatformRevenue += platCut;
        }
      } else if (data.status === 'pending') {
        if (matchesDate) pendingApprovals += 1;
      } else if (data.status === 'rejected') {
        if (matchesDate) rejectedEnrollments += 1;
      }
    });

    // Group courses by instructor
    const instructorMap = {};
    Object.values(courseMap).forEach(c => {
      const instName = c.instructorName || 'Dr. Ayesha Siddiqui';
      if (!instructorMap[instName]) {
        instructorMap[instName] = {
          instructorName: instName,
          instructorTitle: c.instructorTitle,
          coursesCount: 0,
          coursesTaught: [],
          totalSalesCount: 0,
          grossRevenuePKR: 0,
          instructorEarningsPKR: 0,
          platformRetainedPKR: 0,
          coursesBreakdown: []
        };
      }
      const inst = instructorMap[instName];
      inst.coursesCount += 1;
      inst.coursesTaught.push(c.title);
      inst.totalSalesCount += c.activeSalesCount;
      inst.grossRevenuePKR += c.grossRevenuePKR;
      inst.instructorEarningsPKR += c.instructorEarningsPKR;
      inst.platformRetainedPKR += c.platformRevenuePKR;

      inst.coursesBreakdown.push({
        courseId: c.courseId,
        courseTitle: c.title,
        pricePKR: c.pricePKR,
        sharePercent: c.instructorSharePercent,
        salesCount: c.activeSalesCount,
        grossRevenuePKR: c.grossRevenuePKR,
        instructorEarningsPKR: c.instructorEarningsPKR,
        platformRevenuePKR: c.platformRevenuePKR
      });
    });

    const revenueByInstructor = Object.values(instructorMap).sort((a, b) => b.grossRevenuePKR - a.grossRevenuePKR);
    const revenueByCourse = Object.values(courseMap).sort((a, b) => b.grossRevenuePKR - a.grossRevenuePKR);

    const studentsCount = usersSnap.docs.filter(d => d.data().role !== 'admin').length;

    return res.status(200).json({
      stats: {
        totalRevenuePKR: totalRevenue,
        totalInstructorPayoutPKR: totalInstructorPayout,
        netPlatformRevenuePKR: netPlatformRevenue,
        totalStudents: studentsCount,
        pendingApprovals,
        activeEnrollments,
        rejectedEnrollments,
        totalCourses: coursesSnap.size,
        totalCertificatesIssued: certsSnap.size,
        completionRate: activeEnrollments > 0 ? Math.round((certsSnap.size / activeEnrollments) * 100) : 0,
        revenueByCourse,
        revenueByInstructor,
        dateFilter: {
          period: period || 'all',
          startDate: filterStart ? filterStart.toISOString() : null,
          endDate: filterEnd ? filterEnd.toISOString() : null
        }
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to compute administrative statistics',
      details: err.message
    });
  }
};

// GET /api/admin/students (isAdmin) - Directory with phone numbers & earned certificates
export const getStudentsList = async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();
    const enrollmentsSnap = await db.collection('enrollments').get();
    const certsSnap = await db.collection('certificates').get();

    const enrollmentsByUser = {};
    enrollmentsSnap.docs.forEach(doc => {
      const data = doc.data();
      if (!enrollmentsByUser[data.userId]) {
        enrollmentsByUser[data.userId] = [];
      }
      enrollmentsByUser[data.userId].push({
        enrollmentId: doc.id,
        courseId: data.courseId,
        courseTitle: data.courseTitle,
        status: data.status,
        progressPercent: data.progressPercent || 0,
        createdAt: data.createdAt
      });
    });

    const certsByUser = {};
    certsSnap.docs.forEach(doc => {
      const c = doc.data();
      if (!certsByUser[c.userId]) {
        certsByUser[c.userId] = [];
      }
      certsByUser[c.userId].push({
        certificateId: doc.id,
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        studentName: c.studentName,
        completionDate: c.completionDate || c.issuedAt || new Date().toISOString(),
        passingScore: c.passingScore || 100,
        verificationUrl: `/verify/${doc.id}`
      });
    });

    const students = usersSnap.docs
      .map(doc => {
        const u = doc.data();
        return {
          uid: doc.id,
          name: u.name,
          email: u.email,
          phoneNumber: u.phoneNumber || u.phone || '',
          password: u.password,
          role: u.role || 'student',
          createdAt: u.createdAt,
          enrollments: enrollmentsByUser[doc.id] || [],
          certificates: certsByUser[doc.id] || []
        };
      })
      .filter(u => u.role !== 'admin');

    // Sort newest students first
    students.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return res.status(200).json({ students });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch student directory',
      details: err.message
    });
  }
};

// PATCH /api/admin/students/:uid/password (isAdmin) - Admin can update password of student
export const updateStudentPassword = async (req, res) => {
  const { uid } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Student account not found' });
    }

    await userRef.set({
      password: newPassword.trim(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return res.status(200).json({
      message: `Password updated successfully for student "${userDoc.data().name || userDoc.data().email}"`,
      uid
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to update student password',
      details: err.message
    });
  }
};

// GET /api/admin/courses (isAdmin) - List all courses including drafts
export const getAdminCourses = async (req, res) => {
  try {
    const snap = await db.collection('courses').get();
    const courses = snap.docs.map(doc => ({
      ...doc.data(),
      courseId: doc.id
    }));
    return res.status(200).json({ courses });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch admin course catalog',
      details: err.message
    });
  }
};

// GET /api/admin/courses/:courseId (isAdmin) - Fetch full unredacted course for editing
export const getAdminCourseById = async (req, res) => {
  const { courseId } = req.params;
  try {
    const doc = await db.collection('courses').doc(courseId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const course = doc.data();

    // Fetch modules
    const modsSnap = await db.collection('courses').doc(courseId).collection('modules').get();
    const modules = modsSnap.docs.map(d => ({
      ...d.data(),
      moduleId: d.id
    }));
    modules.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Fetch quizzes for this course
    const quizSnap = await db.collection('quizzes').where('courseId', '==', courseId).get();
    const quizzes = quizSnap.docs.map(d => ({
      ...d.data(),
      quizId: d.id
    }));

    return res.status(200).json({
      course: {
        ...course,
        courseId,
        modules,
        quizzes
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch course details for CMS',
      details: err.message
    });
  }
};

// DELETE /api/admin/courses/:courseId (isAdmin)
export const deleteCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    await db.collection('courses').doc(courseId).delete();
    return res.status(200).json({
      message: `Course ${courseId} deleted successfully`
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to delete course',
      details: err.message
    });
  }
};
