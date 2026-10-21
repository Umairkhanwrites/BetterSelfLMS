import { db } from '../config/firebaseAdmin.js';

// GET /api/learn/:courseId (verifyAccess)
// Returns full lessons/PDFs/Meet links if active, or Module 1 only if pending < 24h
export const getCourseClassroom = async (req, res) => {
  const { courseId } = req.params;
  const accessLevel = req.accessLevel; // 'FULL' or 'TRIAL_MODULE_1'
  const isTrial = accessLevel === 'TRIAL_MODULE_1';

  try {
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const courseData = courseDoc.data();

    // Fetch all modules
    const modulesSnap = await db.collection('courses').doc(courseId).collection('modules').get();
    const modules = [];

    modulesSnap.docs.forEach((doc, idx) => {
      const mod = doc.data();
      const order = mod.order || (idx + 1);
      const isModuleUnlocked = accessLevel === 'FULL' || order === 1;

      const sanitizedLessons = (mod.lessons || []).map(lesson => {
        if (isModuleUnlocked) {
          return {
            ...lesson,
            isLocked: false
          };
        }

        // Locked lessons in higher modules for trial users
        return {
          lessonId: lesson.lessonId,
          title: lesson.title,
          type: lesson.type,
          durationMinutes: lesson.durationMinutes,
          isFreePreview: !!lesson.isFreePreview,
          isLocked: true,
          summaryText: lesson.summaryText,
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
        moduleId: doc.id,
        title: mod.title,
        order,
        isLocked: !isModuleUnlocked,
        lessons: sanitizedLessons
      });
    });

    // Sort modules in ascending order
    modules.sort((a, b) => a.order - b.order);

    // Fetch user enrollment info
    let enrollment = req.enrollmentData;
    if (!enrollment && req.user) {
      const enrSnap = await db.collection('enrollments')
        .where('userId', '==', req.user.uid)
        .where('courseId', '==', courseId)
        .limit(1)
        .get();
      if (!enrSnap.empty) {
        enrollment = enrSnap.docs[0].data();
      }
    }

    return res.status(200).json({
      course: {
        ...courseData,
        courseId,
        // Live meet is unlocked for FULL access or pending trial
        liveMeetLink: courseData.liveMeetLink || '',
        liveMeetSchedule: courseData.liveMeetSchedule || '',
        modules
      },
      access: {
        level: accessLevel,
        isTrial,
        trialHoursRemaining: req.trialHoursRemaining || 0,
        status: enrollment?.status || (req.isAdminAccess ? 'active' : 'unknown')
      },
      progress: {
        completedItemIds: enrollment?.completedItemIds || [],
        progressPercent: enrollment?.progressPercent || 0
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch course classroom materials',
      details: err.message
    });
  }
};

// POST /api/learn/:courseId/complete (verifyAccess)
// Body: { itemId } . Adds to completedItemIds, updates progressPercent
export const markItemComplete = async (req, res) => {
  const { courseId } = req.params;
  const { itemId } = req.body;

  if (!itemId) {
    return res.status(400).json({ error: 'itemId is required' });
  }

  try {
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const course = courseDoc.data();
    const totalItems = course.totalItems || 12;

    // Check if item is a quiz item - quizzes CANNOT be marked complete manually without taking the exam
    const modulesSnap = await db.collection('courses').doc(courseId).collection('modules').get();
    let isQuizItem = itemId.startsWith('q_');
    modulesSnap.docs.forEach(mDoc => {
      const lessons = mDoc.data().lessons || [];
      const found = lessons.find(l => l.lessonId === itemId || l.quizId === itemId);
      if (found && (found.type === 'quiz' || found.quizId)) {
        isQuizItem = true;
      }
    });

    if (isQuizItem) {
      return res.status(400).json({
        error: 'Assessments and final exams cannot be marked complete manually. You must score 70% or higher on the quiz assessment to complete this item.'
      });
    }

    const enrSnap = await db.collection('enrollments')
      .where('userId', '==', req.user.uid)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (enrSnap.empty) {
      // If admin testing without explicit enrollment doc, return mock progress
      if (req.user.admin) {
        return res.status(200).json({
          message: 'Admin simulation: Item marked as complete',
          completedItemIds: [itemId],
          progressPercent: Math.min(100, Math.round((1 / totalItems) * 100))
        });
      }
      return res.status(403).json({ error: 'No enrollment found to track progress' });
    }

    const enrollmentDoc = enrSnap.docs[0];
    const enrollment = enrollmentDoc.data();
    const completedSet = new Set(enrollment.completedItemIds || []);
    completedSet.add(itemId);

    const completedItemIds = Array.from(completedSet);
    const progressPercent = Math.min(100, Math.round((completedItemIds.length / totalItems) * 100));

    await db.collection('enrollments').doc(enrollmentDoc.id).update({
      completedItemIds,
      progressPercent,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({
      message: 'Item completion recorded',
      itemId,
      completedItemIds,
      progressPercent
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to record completion',
      details: err.message
    });
  }
};

// GET /api/learn/:courseId/quiz/:quizId (verifyAccess)
// Returns sanitized questions (without answers/explanations) for client exam taking
export const getQuiz = async (req, res) => {
  const { courseId, quizId } = req.params;

  try {
    const quizDoc = await db.collection('quizzes').doc(quizId).get();
    if (!quizDoc.exists) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = quizDoc.data();
    const sanitizedQuestions = (quiz.questions || []).map((q, index) => ({
      questionIndex: index,
      questionText: q.questionText,
      options: q.options || []
    }));

    return res.status(200).json({
      quizId: quizDoc.id,
      courseId: quiz.courseId || courseId,
      passingScore: typeof quiz.passingScore === 'number' ? quiz.passingScore : 70,
      questions: sanitizedQuestions
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch quiz questions',
      details: err.message
    });
  }
};

// POST /api/learn/:courseId/quiz (verifyAccess)
// Body: { quizId, answers: [] } . Grades quiz, returns score %, pass status, & explanations
export const submitQuiz = async (req, res) => {
  const { courseId } = req.params;
  const { quizId, answers } = req.body;

  if (!quizId || !Array.isArray(answers)) {
    return res.status(400).json({
      error: 'Invalid request: quizId and answers array are required'
    });
  }

  try {
    const quizDoc = await db.collection('quizzes').doc(quizId).get();
    if (!quizDoc.exists) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = quizDoc.data();
    const questions = quiz.questions || [];
    if (questions.length === 0) {
      return res.status(400).json({ error: 'Quiz has no questions configured' });
    }

    let correctCount = 0;
    const perQuestionReview = questions.map((q, index) => {
      // answers can be an array of numbers or objects: { questionIndex, selectedOptionIndex }
      let selectedIndex = null;
      if (typeof answers[index] === 'number') {
        selectedIndex = answers[index];
      } else if (answers[index] && typeof answers[index].selectedOptionIndex === 'number') {
        selectedIndex = answers[index].selectedOptionIndex;
      }

      const isCorrect = selectedIndex === q.correctOptionIndex;
      if (isCorrect) correctCount += 1;

      return {
        questionIndex: index,
        questionText: q.questionText,
        options: q.options,
        selectedOptionIndex: selectedIndex,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation || 'No clinical rationale provided.'
      };
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const passingScore = typeof quiz.passingScore === 'number' ? quiz.passingScore : 70;
    const passed = scorePercent >= passingScore;

    // If passed, auto-complete the quiz item in user's enrollment
    let updatedProgress = null;
    if (passed) {
      const courseDoc = await db.collection('courses').doc(courseId).get();
      const course = courseDoc.exists ? courseDoc.data() : { totalItems: 12 };
      const totalItems = course.totalItems || 12;

      const enrSnap = await db.collection('enrollments')
        .where('userId', '==', req.user.uid)
        .where('courseId', '==', courseId)
        .limit(1)
        .get();

      if (!enrSnap.empty) {
        const enrollmentDoc = enrSnap.docs[0];
        const enrollment = enrollmentDoc.data();
        const completedSet = new Set(enrollment.completedItemIds || []);
        completedSet.add(quizId);

        // Also add the associated lessonId so the sidebar displays the checkmark and counts progress
        const modsSnap = await db.collection('courses').doc(courseId).collection('modules').get();
        modsSnap.docs.forEach(mDoc => {
          const lessons = mDoc.data().lessons || [];
          const found = lessons.find(l => l.quizId === quizId);
          if (found && found.lessonId) {
            completedSet.add(found.lessonId);
          }
        });

        const completedItemIds = Array.from(completedSet);
        const progressPercent = Math.min(100, Math.round((completedItemIds.length / totalItems) * 100));

        await db.collection('enrollments').doc(enrollmentDoc.id).update({
          completedItemIds,
          progressPercent,
          updatedAt: new Date().toISOString()
        });

        updatedProgress = { completedItemIds, progressPercent };
      }
    }

    return res.status(200).json({
      quizId,
      scorePercent,
      passed,
      passingScore,
      correctCount,
      totalQuestions: questions.length,
      perQuestionReview,
      updatedProgress
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to grade quiz submission',
      details: err.message
    });
  }
};

// POST /api/learn/:courseId/notes (verifyAccess)
// Body: { lessonId, videoTimestampSeconds, content } . Saves timestamped student note
export const saveNote = async (req, res) => {
  const { courseId } = req.params;
  const { lessonId, videoTimestampSeconds, content } = req.body;

  if (!lessonId || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({
      error: 'lessonId and non-empty content string are required'
    });
  }

  const timestamp = typeof videoTimestampSeconds === 'number' ? Math.max(0, Math.floor(videoTimestampSeconds)) : 0;
  const noteId = `note_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  try {
    const newNote = {
      noteId,
      userId: req.user.uid,
      courseId,
      lessonId,
      videoTimestampSeconds: timestamp,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    await db.collection('notes').doc(noteId).set(newNote);

    return res.status(201).json({
      message: 'Timestamped note saved successfully',
      note: newNote
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to save note',
      details: err.message
    });
  }
};

// GET /api/learn/:courseId/notes (verifyAccess)
// Returns all notes created by current student for this course
export const getNotes = async (req, res) => {
  const { courseId } = req.params;
  try {
    const snap = await db.collection('notes')
      .where('userId', '==', req.user.uid)
      .where('courseId', '==', courseId)
      .get();

    const notes = snap.docs.map(doc => ({
      ...doc.data(),
      noteId: doc.id
    }));

    // Sort by createdAt descending
    notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({ notes });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch notes',
      details: err.message
    });
  }
};
