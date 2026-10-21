import { db } from '../config/firebaseAdmin.js';

// Schema validation helper for SEC-03 Course Document
export const validateCourseSchema = (data) => {
  const errors = [];
  if (!data.courseId || typeof data.courseId !== 'string') errors.push('courseId must be a non-empty string');
  if (!data.title || typeof data.title !== 'string') errors.push('title must be a non-empty string');
  if (!data.subtitle || typeof data.subtitle !== 'string') errors.push('subtitle must be a non-empty string');
  if (!data.instructorName || typeof data.instructorName !== 'string') errors.push('instructorName must be a non-empty string');
  if (!data.instructorTitle || typeof data.instructorTitle !== 'string') errors.push('instructorTitle must be a non-empty string');
  if (typeof data.pricePKR !== 'number' || data.pricePKR < 0) errors.push('pricePKR must be a non-negative number');
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(data.difficulty)) {
    errors.push('difficulty must be one of: Beginner, Intermediate, Advanced');
  }
  if (typeof data.totalDurationMinutes !== 'number' || data.totalDurationMinutes < 0) {
    errors.push('totalDurationMinutes must be a non-negative number');
  }
  if (typeof data.totalItems !== 'number' || data.totalItems < 0) {
    errors.push('totalItems must be a non-negative number');
  }
  if (typeof data.isPublished !== 'boolean') errors.push('isPublished must be a boolean');
  if (data.instructorSharePercent !== undefined) {
    const share = Number(data.instructorSharePercent);
    if (isNaN(share) || share < 0 || share > 100) {
      errors.push('instructorSharePercent must be a number between 0 and 100');
    }
  }
  return errors;
};

// GET /api/courses (Public)
// Returns all isPublished: true courses for catalog grid
export const getCourses = async (req, res) => {
  try {
    const snap = await db.collection('courses')
      .where('isPublished', '==', true)
      .get();

    const courses = snap.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        courseId: doc.id
      };
    });

    return res.status(200).json({ courses });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch published courses',
      details: err.message
    });
  }
};

// GET /api/courses/:courseId (Public)
// Returns course metadata + curriculum titles. Redacts non-preview video IDs/PDFs.
export const getCourseById = async (req, res) => {
  const { courseId } = req.params;
  try {
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const courseData = courseDoc.data();

    // Fetch modules sub-collection
    const modulesSnap = await db.collection('courses').doc(courseId).collection('modules').get();
    const modules = [];

    modulesSnap.docs.forEach(doc => {
      const mod = doc.data();
      // Redact sensitive video IDs & download URLs if not free preview
      const sanitizedLessons = (mod.lessons || []).map(lesson => {
        if (lesson.isFreePreview === true) {
          return {
            ...lesson,
            isLocked: false
          };
        }
        return {
          lessonId: lesson.lessonId,
          title: lesson.title,
          type: lesson.type,
          durationMinutes: lesson.durationMinutes,
          isFreePreview: false,
          isLocked: true,
          summaryText: lesson.summaryText,
          // Redacted fields
          youtubeVideoId: null,
          resources: (lesson.resources || []).map(r => ({
            title: r.title,
            pdfUrl: null,
            isLocked: true
          })),
          quizId: lesson.quizId || null
        };
      });

      modules.push({
        ...mod,
        moduleId: doc.id,
        lessons: sanitizedLessons
      });
    });

    // Sort modules by order
    modules.sort((a, b) => (a.order || 0) - (b.order || 0));

    return res.status(200).json({
      course: {
        ...courseData,
        courseId,
        modules
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch course details',
      details: err.message
    });
  }
};

// POST /api/admin/courses (isAdmin)
// Creates or updates course document, module sub-collections, and quizzes
export const createOrUpdateCourse = async (req, res) => {
  const body = req.body;
  const errors = validateCourseSchema(body);
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Course schema validation failed',
      validationErrors: errors
    });
  }

  const courseId = body.courseId;
  try {
    const coursePayload = {
      courseId,
      title: body.title,
      subtitle: body.subtitle,
      instructorName: body.instructorName,
      instructorTitle: body.instructorTitle,
      instructorSharePercent: Number(body.instructorSharePercent !== undefined ? body.instructorSharePercent : 40),
      pricePKR: body.pricePKR,
      difficulty: body.difficulty,
      totalDurationMinutes: body.totalDurationMinutes,
      totalItems: body.totalItems,
      isPublished: body.isPublished,
      thumbnailUrl: body.thumbnailUrl || '',
      liveMeetLink: body.liveMeetLink || '',
      liveMeetSchedule: body.liveMeetSchedule || '',
      updatedAt: new Date().toISOString()
    };

    await db.collection('courses').doc(courseId).set(coursePayload, { merge: true });

    // If modules provided in body, save each module into the sub-collection
    if (Array.isArray(body.modules)) {
      for (const mod of body.modules) {
        if (!mod.moduleId) continue;
        await db.collection('courses').doc(courseId).collection('modules').doc(mod.moduleId).set({
          moduleId: mod.moduleId,
          title: mod.title,
          order: mod.order || 1,
          lessons: mod.lessons || []
        }, { merge: true });
      }
    }

    // If quizzes provided in body, save each into quizzes collection
    if (Array.isArray(body.quizzes)) {
      for (const quiz of body.quizzes) {
        if (!quiz.quizId) continue;
        await db.collection('quizzes').doc(quiz.quizId).set({
          quizId: quiz.quizId,
          courseId,
          passingScore: quiz.passingScore || 70,
          questions: quiz.questions || []
        }, { merge: true });
      }
    }

    return res.status(200).json({
      message: 'Course saved successfully',
      courseId
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to create or update course',
      details: err.message
    });
  }
};
