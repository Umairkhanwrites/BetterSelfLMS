import { db } from '../config/firebaseAdmin.js';

// POST /api/enrollments/request (verifyToken)
// Body: { courseId, paymentMethod, transactionId, receiptImageUrl }
export const requestEnrollment = async (req, res) => {
  const { courseId, paymentMethod, transactionId, receiptImageUrl } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: 'courseId is required' });
  }

  const validMethods = ['JazzCash', 'EasyPaisa', 'Bank Transfer'];
  if (!validMethods.includes(paymentMethod)) {
    return res.status(400).json({
      error: `Invalid paymentMethod. Must be one of: ${validMethods.join(', ')}`
    });
  }

  if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
    return res.status(400).json({ error: 'Valid transactionId is required' });
  }

  try {
    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course does not exist' });
    }
    const course = courseDoc.data();

    // Check if enrollment already exists for this user & course
    const existingSnap = await db.collection('enrollments')
      .where('userId', '==', req.user.uid)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0].data();
      return res.status(409).json({
        error: 'You already have an enrollment record for this course',
        enrollmentId: existingSnap.docs[0].id,
        status: existing.status
      });
    }

    let userPhone = '';
    try {
      const uDoc = await db.collection('users').doc(req.user.uid).get();
      if (uDoc.exists) {
        userPhone = uDoc.data().phoneNumber || uDoc.data().phone || '';
      }
    } catch (e) {}

    const enrollmentId = `enr_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const newEnrollment = {
      enrollmentId,
      userId: req.user.uid,
      userEmail: req.user.email || '',
      userName: req.user.name || '',
      userPhone,
      courseId,
      courseTitle: course.title,
      pricePKR: course.pricePKR,
      status: 'pending',
      paymentMethod,
      transactionId: transactionId.trim(),
      receiptImageUrl: receiptImageUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedItemIds: [],
      progressPercent: 0
    };

    await db.collection('enrollments').doc(enrollmentId).set(newEnrollment);

    return res.status(201).json({
      message: 'Enrollment submitted successfully. 24-hour instant trial unlocked for Module 1.',
      enrollment: newEnrollment
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to create enrollment request',
      details: err.message
    });
  }
};

// GET /api/enrollments/my (verifyToken)
// Returns user's active & pending enrollments with progress percentages
export const getMyEnrollments = async (req, res) => {
  try {
    const snap = await db.collection('enrollments')
      .where('userId', '==', req.user.uid)
      .get();

    const enrollments = snap.docs.map(doc => {
      const data = doc.data();
      const createdAtDate = new Date(data.createdAt);
      const hoursSinceOrder = (Date.now() - createdAtDate.getTime()) / 36e5;
      const trialExpired = data.status === 'pending' && hoursSinceOrder > 24;

      return {
        ...data,
        enrollmentId: doc.id,
        hoursSinceOrder: Math.round(hoursSinceOrder * 10) / 10,
        trialExpired,
        trialHoursRemaining: data.status === 'pending' && !trialExpired ? Math.max(0, 24 - hoursSinceOrder) : 0
      };
    });

    return res.status(200).json({ enrollments });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to retrieve your enrollments',
      details: err.message
    });
  }
};

// PATCH /api/admin/enrollments/:id (isAdmin)
// Body: { status: "active" | "rejected" } . 1-click payment approval
export const updateEnrollmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({
      error: 'Invalid status. Status must be "active" or "rejected"'
    });
  }

  try {
    const docRef = db.collection('enrollments').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    await docRef.update({
      status,
      verifiedAt: new Date().toISOString(),
      verifiedBy: req.user.email || req.user.uid
    });

    const updated = (await docRef.get()).data();
    return res.status(200).json({
      message: `Enrollment status updated to ${status}`,
      enrollment: {
        ...updated,
        enrollmentId: id
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to update enrollment status',
      details: err.message
    });
  }
};

// GET /api/admin/enrollments (isAdmin)
// For Admin Verification Queue Table
export const getAllEnrollmentsAdmin = async (req, res) => {
  try {
    const snap = await db.collection('enrollments').get();
    const usersSnap = await db.collection('users').get();
    const phoneByUser = {};
    usersSnap.docs.forEach(uDoc => {
      const u = uDoc.data();
      phoneByUser[uDoc.id] = u.phoneNumber || u.phone || '';
    });

    const enrollments = snap.docs.map(doc => {
      const d = doc.data();
      return {
        ...d,
        userPhone: d.userPhone || phoneByUser[d.userId] || '',
        enrollmentId: doc.id
      };
    });

    // Sort by createdAt descending
    enrollments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({ enrollments });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch admin enrollment list',
      details: err.message
    });
  }
};
