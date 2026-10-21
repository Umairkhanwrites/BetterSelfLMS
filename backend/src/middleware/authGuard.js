import { auth, db } from '../config/firebaseAdmin.js';

// Helper to determine if user matches admin configuration
export const checkIsAdmin = (user) => {
  if (!user) return false;
  if (user.admin === true) return true;

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    return true;
  }

  const adminUids = (process.env.ADMIN_UIDS || '')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);

  if (user.uid && adminUids.includes(user.uid)) {
    return true;
  }

  return false;
};

// Middleware: verify Firebase ID Token from Authorization header
export const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Authorization Bearer token is missing or malformed'
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Token string is empty'
    });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const isAdmin = checkIsAdmin(decodedToken);
    req.user = {
      ...decodedToken,
      admin: isAdmin
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase ID token',
      details: err.message
    });
  }
};

// Middleware: restrict route to Admins only
export const isAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.admin || checkIsAdmin(req.user)) {
    return next();
  }

  return res.status(403).json({
    error: 'Forbidden: Administrator privileges required for this action'
  });
};

// Middleware: Course Access Guard (Strict Verification: Full Access on Active, Locked on Pending)
export const verifyCourseAccess = async (req, res, next) => {
  const { courseId } = req.params;
  if (!courseId) {
    return res.status(400).json({ error: 'courseId parameter is required' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Admins always have full uninhibited access for preview and verification
  if (req.user.admin || checkIsAdmin(req.user)) {
    req.accessLevel = 'FULL';
    req.isAdminAccess = true;
    req.enrollmentData = {
      status: 'active',
      progressPercent: 100,
      completedItemIds: []
    };
    return next();
  }

  try {
    const snap = await db.collection('enrollments')
      .where('userId', '==', req.user.uid)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(403).json({
        error: 'You are not enrolled in this course. Please enroll to access course materials.',
        status: 'not_enrolled'
      });
    }

    const enrollmentDoc = snap.docs[0];
    const enrollment = enrollmentDoc.data();
    enrollment.enrollmentId = enrollmentDoc.id;

    if (enrollment.status === 'active') {
      req.accessLevel = 'FULL';
      req.enrollmentData = enrollment;
      return next();
    }

    if (enrollment.status === 'pending') {
      return res.status(403).json({
        error: 'Your payment proof has been received and is currently under administrative review. Full course access will unlock automatically as soon as verified.',
        status: 'pending',
        pendingReview: true,
        transactionId: enrollment.transactionId,
        paymentMethod: enrollment.paymentMethod
      });
    }

    if (enrollment.status === 'rejected') {
      return res.status(403).json({
        error: 'Your enrollment receipt could not be verified. Please contact support or re-submit proof of payment.',
        status: 'rejected'
      });
    }

    return res.status(403).json({ error: 'Access denied to this course.' });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to verify course access permissions',
      details: err.message
    });
  }
};

// Middleware: verify user has an active (approved) enrollment
export const verifyActive = async (req, res, next) => {
  // First run course access check if not already performed
  if (!req.enrollmentData) {
    return verifyCourseAccess(req, res, () => {
      if (req.enrollmentData?.status !== 'active' && !req.user?.admin) {
        return res.status(403).json({
          error: 'Action requires active verified enrollment status.'
        });
      }
      return next();
    });
  }

  if (req.enrollmentData.status !== 'active' && !req.user?.admin) {
    return res.status(403).json({
      error: 'Action requires active verified enrollment status.'
    });
  }

  return next();
};
