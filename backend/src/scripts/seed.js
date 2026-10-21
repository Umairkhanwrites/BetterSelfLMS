import { db, mockStore } from '../config/firebaseAdmin.js';

export const seedDatabase = async () => {
  console.log('[Seed] Seeding BetterSelf LMS database according to SEC-03 specification...');

  // Reset in-memory / mock store to pristine state
  if (mockStore && typeof mockStore === 'object') {
    for (const key of Object.keys(mockStore)) {
      delete mockStore[key];
    }
  }

  // 1. Root Collection: courses/{courseId}
  const courseData = {
    courseId: 'c_anxiety_101',
    title: 'Mastering Anxiety & Cognitive Reframing',
    subtitle: 'Evidence-based CBT tools to manage daily overwhelm',
    instructorName: 'Dr. Ayesha Siddiqui',
    instructorTitle: 'Clinical Psychologist, MS',
    instructorSharePercent: 40,
    pricePKR: 3500,
    difficulty: 'Beginner', // "Beginner" | "Intermediate" | "Advanced"
    totalDurationMinutes: 210,
    totalItems: 12, // Sum of all lessons + required quizzes across modules
    isPublished: true,
    thumbnailUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    liveMeetLink: '',
    liveMeetSchedule: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection('courses').doc(courseData.courseId).set(courseData);
  console.log(`[Seed] Course document created: ${courseData.courseId}`);

  // 2. Sub-Collection: courses/{courseId}/modules/{moduleId}
  const modules = [
    {
      moduleId: 'm_01',
      title: 'Module 1: Understanding Your Triggers',
      order: 1,
      lessons: [
        {
          lessonId: 'l_01',
          title: 'Welcome & The 3 Loops of Anxiety',
          type: 'video',
          durationMinutes: 12,
          isFreePreview: true, // Unlocked on public sales page & pending enrollments
          youtubeVideoId: 'dQw4w9WgXcQ',
          summaryText: 'Core breakdown of cognitive, physical, and behavioral loops.',
          resources: [
            {
              title: 'Trigger Mapping Worksheet',
              pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            }
          ],
          quizId: null
        },
        {
          lessonId: 'l_02',
          title: 'The Autonomic Nervous System & Fight-or-Flight',
          type: 'video',
          durationMinutes: 18,
          isFreePreview: false,
          youtubeVideoId: '9mS0_6Qc6oU',
          summaryText: 'Understanding how sympathetic arousal impairs rational prefrontal cortex control.',
          resources: [
            {
              title: 'Vagus Nerve Somatic Reset Guide',
              pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            }
          ],
          quizId: null
        },
        {
          lessonId: 'l_03',
          title: 'Identifying Automatic Thoughts (ANTs)',
          type: 'video',
          durationMinutes: 15,
          isFreePreview: false,
          youtubeVideoId: '2n7lJv9I5vI',
          summaryText: 'Techniques to detect subtle catastrophizing and mind reading before emotional flooding.',
          resources: [
            {
              title: 'Daily Thought Catching Log',
              pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            }
          ],
          quizId: null
        },
        {
          lessonId: 'l_04',
          title: 'Check-in: Triggers & Loops Assessment',
          type: 'quiz',
          durationMinutes: 10,
          isFreePreview: false,
          youtubeVideoId: null,
          summaryText: 'Test your mastery of anxiety loop mechanics and trigger identification.',
          resources: [],
          quizId: 'q_01'
        }
      ]
    },
    {
      moduleId: 'm_02',
      title: 'Module 2: Cognitive Restructuring & Decatastrophizing',
      order: 2,
      lessons: [
        {
          lessonId: 'l_05',
          title: 'The 10 Cognitive Distortions in Clinical Practice',
          type: 'video',
          durationMinutes: 20,
          isFreePreview: false,
          youtubeVideoId: 'kJQP7kiw5Fk',
          summaryText: 'Deep dive into black-and-white thinking, fortune telling, and emotional reasoning.',
          resources: [
            {
              title: 'Cognitive Distortions Master Reference Card',
              pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            }
          ],
          quizId: null
        },
        {
          lessonId: 'l_06',
          title: 'The Socratic Dialogue for Catastrophic Beliefs',
          type: 'video',
          durationMinutes: 22,
          isFreePreview: false,
          youtubeVideoId: 'kJQP7kiw5Fk',
          summaryText: 'Systematic inquiry to examine empirical evidence and worst/best/realistic case scenarios.',
          resources: [
            {
              title: 'Socratic Questioning Protocol',
              pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            }
          ],
          quizId: null
        },
        {
          lessonId: 'l_07',
          title: 'Structured 7-Column Thought Record Lab',
          type: 'pdf',
          durationMinutes: 15,
          isFreePreview: false,
          youtubeVideoId: null,
          summaryText: 'Practical exercise using the clinical standard 7-column cognitive restructuring record.',
          resources: [
            {
              title: 'Interactive 7-Column Thought Record',
              pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            }
          ],
          quizId: null
        },
        {
          lessonId: 'l_08',
          title: 'Assessment: Cognitive Reframing Competency',
          type: 'quiz',
          durationMinutes: 12,
          isFreePreview: false,
          youtubeVideoId: null,
          summaryText: 'Evaluate your ability to reframe real-world catastrophic scenarios.',
          resources: [],
          quizId: 'q_02'
        }
      ]
    },
    {
      moduleId: 'm_03',
      title: 'Module 3: Somatic Regulation & Relapse Prevention',
      order: 3,
      lessons: [
        {
          lessonId: 'l_09',
          title: 'Physiological Sigh & 5-4-3-2-1 Sensory Grounding',
          type: 'video',
          durationMinutes: 16,
          isFreePreview: false,
          youtubeVideoId: 'kJQP7kiw5Fk',
          summaryText: 'Neurobiological grounding tools to abort panic spikes within 90 seconds.',
          resources: [
            {
              title: 'Acute Panic Protocol Pocket Guide',
              pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            }
          ],
          quizId: null
        },
        {
          lessonId: 'l_10',
          title: 'Designing an In-Vivo Exposure Hierarchy',
          type: 'video',
          durationMinutes: 25,
          isFreePreview: false,
          youtubeVideoId: 'kJQP7kiw5Fk',
          summaryText: 'Step-by-step gradual exposure ladder using Subjective Units of Distress (SUDS).',
          resources: [
            {
              title: 'SUDS Exposure Ladder Worksheet',
              pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            }
          ],
          quizId: null
        },
        {
          lessonId: 'l_11',
          title: 'Building Your Long-Term Relapse Prevention Blueprint',
          type: 'video',
          durationMinutes: 25,
          isFreePreview: false,
          youtubeVideoId: 'kJQP7kiw5Fk',
          summaryText: 'Early warning signs, maintenance rituals, and psychoeducational resilience habits.',
          resources: [
            {
              title: 'BetterSelf Relapse Prevention Blueprint',
              pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            }
          ],
          quizId: null
        },
        {
          lessonId: 'l_12',
          title: 'Final Clinical Mastery Exam',
          type: 'quiz',
          durationMinutes: 20,
          isFreePreview: false,
          youtubeVideoId: null,
          summaryText: 'Comprehensive psychoeducation assessment required for official certification.',
          resources: [],
          quizId: 'q_03'
        }
      ]
    }
  ];

  for (const mod of modules) {
    await db.collection('courses').doc(courseData.courseId).collection('modules').doc(mod.moduleId).set(mod);
    console.log(`[Seed] Sub-collection module saved: ${mod.moduleId} with ${mod.lessons.length} lessons`);
  }

  // 3. Root Collection: quizzes/{quizId}
  const quizzes = [
    {
      quizId: 'q_01',
      courseId: 'c_anxiety_101',
      passingScore: 70,
      questions: [
        {
          questionText: "Which thought pattern is an example of 'Catastrophizing'?",
          options: [
            'Assuming a minor error costs your job',
            'Feeling tired after work',
            'Planning ahead for a meeting',
            'Journaling about your day'
          ],
          correctOptionIndex: 0,
          explanation: 'Catastrophizing leaps directly to the worst-case outcome from a minor trigger.'
        },
        {
          questionText: 'What are the three interacting components of an anxiety loop?',
          options: [
            'Cognitive thoughts, physical sensations, and behavioral responses',
            'Diet, weather, and screen time',
            'Genetics, blood pressure, and sleep',
            'Medication, vitamins, and relaxation'
          ],
          correctOptionIndex: 0,
          explanation: 'Cognitive-Behavioral Therapy models anxiety as an ongoing loop between negative thoughts, bodily arousal, and avoidance behaviors.'
        }
      ]
    },
    {
      quizId: 'q_02',
      courseId: 'c_anxiety_101',
      passingScore: 70,
      questions: [
        {
          questionText: "In Socratic questioning, what is the primary purpose of asking 'What is the empirical evidence supporting this thought?'",
          options: [
            'To scientifically separate verifiable facts from cognitive distortions',
            'To convince the patient they are completely wrong',
            'To ignore emotional sensations',
            'To memorize psychological theories'
          ],
          correctOptionIndex: 0,
          explanation: 'Socratic dialogue helps individuals objectively examine empirical facts rather than emotionally-driven cognitive assumptions.'
        },
        {
          questionText: 'Which cognitive distortion involves believing that you know what others are thinking without proof?',
          options: [
            'Mind Reading',
            'Overgeneralization',
            'Emotional Reasoning',
            'Personalization'
          ],
          correctOptionIndex: 0,
          explanation: 'Mind reading assumes negative thoughts or judgements in others without concrete evidence.'
        }
      ]
    },
    {
      quizId: 'q_03',
      courseId: 'c_anxiety_101',
      passingScore: 70,
      questions: [
        {
          questionText: "What is the biological mechanism of the double-inhale 'physiological sigh'?",
          options: [
            'Re-inflating collapsed alveoli in the lungs and rapidly offloading CO2 to activate the parasympathetic brake',
            'Hyperventilating to increase adrenaline',
            'Forcing breath holding to cause dizziness',
            'Increasing heart rate to stimulate panic'
          ],
          correctOptionIndex: 0,
          explanation: 'The physiological sigh engages the vagus nerve and activates the parasympathetic nervous system to quickly lower heart rate.'
        },
        {
          questionText: 'Why is gradual exposure structured as a progressive hierarchy rather than abrupt flooding?',
          options: [
            'To allow the nervous system to habituate at manageable distress levels without retraumatization',
            'Because systematic exposure requires no client effort',
            'To prevent any emotional feeling whatsoever',
            'Because avoidance is considered a best practice'
          ],
          correctOptionIndex: 0,
          explanation: 'Systematic exposure enables clients to build distress tolerance and neural habituation incrementally.'
        }
      ]
    }
  ];

  for (const quiz of quizzes) {
    await db.collection('quizzes').doc(quiz.quizId).set(quiz);
    console.log(`[Seed] Quiz document created: ${quiz.quizId}`);
  }

  // 4. Root Collection: users/{uid}
  // Dedicated Credentials requested by user:
  // 1. Admin: admin@betterself.pk / Admin@12345
  // 2. Active Student: active.student@betterself.pk / Student@12345
  // 3. Pending Student: pending.student@betterself.pk / Pending@12345
  // 4. Fresh Registered Student: hamza.new@betterself.pk / Hamza@12345
  const users = [
    {
      uid: 'u_admin_001',
      email: 'admin@betterself.pk',
      name: 'Dr. Ayesha Siddiqui',
      phoneNumber: '+92 300 0000000',
      password: 'Admin@12345',
      role: 'admin',
      createdAt: '2026-01-15T09:00:00.000Z'
    },
    {
      uid: 'u_student_active',
      email: 'active.student@betterself.pk',
      name: 'Zainab Fatima',
      phoneNumber: '+92 321 8765432',
      password: 'Student@12345',
      role: 'student',
      createdAt: '2026-02-10T10:30:00.000Z'
    },
    {
      uid: 'u_student_pending',
      email: 'pending.student@betterself.pk',
      name: 'Ahmed Raza',
      phoneNumber: '+92 333 4567890',
      password: 'Pending@12345',
      role: 'student',
      createdAt: '2026-03-01T14:15:00.000Z'
    },
    {
      uid: 'u_student_new',
      email: 'hamza.new@betterself.pk',
      name: 'Hamza Tariq',
      phoneNumber: '+92 345 9876543',
      password: 'Hamza@12345',
      role: 'student',
      createdAt: '2026-03-15T11:00:00.000Z'
    }
  ];

  for (const user of users) {
    await db.collection('users').doc(user.uid).set(user);
    console.log(`[Seed] User credential created: ${user.email} (${user.role})`);
  }

  // 5. Root Collection: enrollments/{enrollmentId} (Test enrollments)
  // a) Active enrollment with 67% progress (for active.student@betterself.pk)
  const activeEnrollment = {
    enrollmentId: 'enr_active_student_01',
    userId: 'u_student_active',
    userEmail: 'active.student@betterself.pk',
    userName: 'Zainab Fatima',
    userPhone: '+92 321 8765432',
    courseId: 'c_anxiety_101',
    courseTitle: 'Mastering Anxiety & Cognitive Reframing',
    pricePKR: 3500,
    status: 'active',
    paymentMethod: 'JazzCash',
    transactionId: 'JC-88392019',
    receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date(Date.now() - 48 * 36e5).toISOString(),
    completedItemIds: ['l_01', 'l_02', 'l_03', 'l_04', 'l_05', 'l_06', 'l_07', 'l_08'],
    progressPercent: 67
  };
  await db.collection('enrollments').doc(activeEnrollment.enrollmentId).set(activeEnrollment);
  console.log(`[Seed] Active enrollment seeded for user u_student_active: ${activeEnrollment.enrollmentId}`);

  // b) Pending enrollment awaiting admin review (for pending.student@betterself.pk)
  const pendingTrialEnrollment = {
    enrollmentId: 'enr_pending_student_02',
    userId: 'u_student_pending',
    userEmail: 'pending.student@betterself.pk',
    userName: 'Ahmed Raza',
    userPhone: '+92 333 4567890',
    courseId: 'c_anxiety_101',
    courseTitle: 'Mastering Anxiety & Cognitive Reframing',
    pricePKR: 3500,
    status: 'pending',
    paymentMethod: 'EasyPaisa',
    transactionId: 'EP-99120485',
    receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date(Date.now() - 2 * 36e5).toISOString(),
    completedItemIds: [],
    progressPercent: 0
  };
  await db.collection('enrollments').doc(pendingTrialEnrollment.enrollmentId).set(pendingTrialEnrollment);
  console.log(`[Seed] Pending enrollment seeded for user u_student_pending: ${pendingTrialEnrollment.enrollmentId}`);

  // 6. Root Collection: certificates/{certificateId}
  const sampleCert = {
    certificateId: 'cert_anxiety_101_001',
    userId: 'u_student_active',
    userEmail: 'active.student@betterself.pk',
    studentName: 'Zainab Fatima',
    courseId: 'c_anxiety_101',
    courseTitle: 'Mastering Anxiety & Cognitive Reframing',
    instructorName: 'Dr. Ayesha Siddiqui',
    completionDate: new Date(Date.now() - 24 * 36e5).toISOString(),
    issuedAt: new Date(Date.now() - 24 * 36e5).toISOString(),
    passingScore: 95,
    verificationUrl: '/verify/cert_anxiety_101_001',
    pdfUrl: null
  };
  await db.collection('certificates').doc(sampleCert.certificateId).set(sampleCert);
  console.log(`[Seed] Sample certificate seeded: ${sampleCert.certificateId}`);

  console.log('[Seed] Database seeding completed successfully.');
};

// If executed directly via CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });
}
