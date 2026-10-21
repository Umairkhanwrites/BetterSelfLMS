import http from 'http';
import app from '../server.js';
import { seedDatabase } from './seed.js';

const runM2Verification = async () => {
  console.log('=================================================================');
  console.log(' BETTERSELF LMS — MILESTONE 2 (M2) AUTOMATED ACCEPTANCE TEST');
  console.log(' Checkout Flow, 24h Module 1 Trial Unlock & Admin CMS');
  console.log('=================================================================\n');

  // Step 1: Seed initial state
  console.log('[Step 1] Initializing fresh database state...');
  await seedDatabase();
  console.log('✓ Seeding complete.\n');

  // Step 2: Spin up test server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Step 2] Test Server running on ${baseUrl}\n`);

  let totalTests = 0;
  let passedTests = 0;

  const assert = (condition, testName, details = '') => {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    }
  };

  try {
    // -------------------------------------------------------------
    // Scenario A: New Student Discovers Course & Checks Curriculum
    // -------------------------------------------------------------
    console.log('[Step 3] Scenario A: Course Discovery & Free Preview Verification...');
    const courseRes = await fetch(`${baseUrl}/api/courses/c_anxiety_101`);
    const courseData = await courseRes.json();
    assert(courseRes.status === 200, 'Public course details retrieved');
    assert(courseData.course?.pricePKR === 3500, 'Course price is PKR 3,500');

    // Free preview lesson should be accessible
    const mod1 = courseData.course.modules[0];
    const previewLesson = mod1.lessons[0];
    assert(previewLesson.isFreePreview === true, 'Lesson 1 is tagged as Free Preview');
    assert(previewLesson.youtubeVideoId === 'dQw4w9WgXcQ', 'Lesson 1 preview video ID is available for modal');

    // Paid lesson 2 must be locked in public route
    const paidLesson = mod1.lessons[1];
    assert(paidLesson.isFreePreview === false, 'Lesson 2 is marked non-preview');
    assert(paidLesson.youtubeVideoId === null, 'Lesson 2 video ID is redacted');

    // -------------------------------------------------------------
    // Scenario B: Checkout Drawer Submission (JazzCash / EasyPaisa / Bank Transfer)
    // -------------------------------------------------------------
    console.log('\n[Step 4] Scenario B: Student Submits TID + Screenshot via Checkout Drawer...');
    const newStudentToken = 'mock-token-custom:u_checkout_student_99:newlearner@example.com:false';

    // Before enrolling, classroom access should be 403
    const preEnrRes = await fetch(`${baseUrl}/api/learn/c_anxiety_101`, {
      headers: { Authorization: `Bearer ${newStudentToken}` }
    });
    assert(preEnrRes.status === 403, 'Pre-enrollment classroom access returns 403 Forbidden');

    // Student submits checkout form: TID + Screenshot
    const checkoutPayload = {
      courseId: 'c_anxiety_101',
      paymentMethod: 'JazzCash',
      transactionId: 'JC-994827104',
      receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80'
    };

    const checkoutRes = await fetch(`${baseUrl}/api/enrollments/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newStudentToken}`
      },
      body: JSON.stringify(checkoutPayload)
    });
    const checkoutData = await checkoutRes.json();

    assert(checkoutRes.status === 201, 'Checkout request returns HTTP 201 Created');
    assert(checkoutData.enrollment?.status === 'pending', 'Enrollment status is pending');
    assert(checkoutData.enrollment?.transactionId === 'JC-994827104', 'TID is recorded accurately');
    assert(checkoutData.enrollment?.paymentMethod === 'JazzCash', 'Payment method is recorded');
    const createdEnrollmentId = checkoutData.enrollment.enrollmentId;

    // Duplicate submission check
    const duplicateRes = await fetch(`${baseUrl}/api/enrollments/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newStudentToken}`
      },
      body: JSON.stringify(checkoutPayload)
    });
    assert(duplicateRes.status === 409, 'Duplicate enrollment request prevented with HTTP 409 Conflict');

    // Student checks My Enrollments list
    const myEnrRes = await fetch(`${baseUrl}/api/enrollments/my`, {
      headers: { Authorization: `Bearer ${newStudentToken}` }
    });
    const myEnrData = await myEnrRes.json();
    assert(myEnrRes.status === 200, 'GET /api/enrollments/my returns 200 OK');
    const userEnrollment = myEnrData.enrollments.find(e => e.enrollmentId === createdEnrollmentId);
    assert(!!userEnrollment, 'Newly created enrollment appears in My Enrollments list');
    assert(userEnrollment?.trialHoursRemaining > 23, 'Trial has ~24 hours remaining');

    // -------------------------------------------------------------
    // Scenario C: Immediate Module 1 Instant Trial Unlock Verification
    // -------------------------------------------------------------
    console.log('\n[Step 5] Scenario C: Immediate Module 1 Trial Unlock in GET /api/learn/:id...');
    const classroomRes = await fetch(`${baseUrl}/api/learn/c_anxiety_101`, {
      headers: { Authorization: `Bearer ${newStudentToken}` }
    });
    const classroomData = await classroomRes.json();

    assert(classroomRes.status === 200, 'GET /api/learn/c_anxiety_101 returns HTTP 200');
    assert(classroomData.access?.level === 'TRIAL_MODULE_1', 'Access level is TRIAL_MODULE_1');
    assert(classroomData.access?.isTrial === true, 'isTrial flag is TRUE');

    // Module 1 check: UNLOCKED with full video IDs
    const classMod1 = classroomData.course.modules[0];
    assert(classMod1.isLocked === false, 'Module 1 is UNLOCKED for pending student');
    assert(classMod1.lessons[0].youtubeVideoId === 'dQw4w9WgXcQ', 'Module 1 Lesson 1 video ID accessible');
    assert(classMod1.lessons[1].youtubeVideoId === '9mS0_6Qc6oU', 'Module 1 Lesson 2 (Paid) video ID UNLOCKED during trial');
    assert(classMod1.lessons[0].resources[0].pdfUrl !== null, 'Module 1 worksheet download URL is unlocked');

    // Module 2 check: LOCKED for trial student (video IDs redacted)
    const classMod2 = classroomData.course.modules[1];
    assert(classMod2.isLocked === true, 'Module 2 is LOCKED during trial');
    assert(classMod2.lessons[0].youtubeVideoId === null, 'Module 2 Lesson video ID is REDACTED/null');

    // -------------------------------------------------------------
    // Scenario D: Admin CMS — Course Creation & Module Builder
    // -------------------------------------------------------------
    console.log('\n[Step 6] Scenario D: Admin CMS Course & Module Creation (POST /api/admin/courses)...');
    const adminToken = 'mock-token-admin';

    const newCoursePayload = {
      courseId: 'c_depression_cbt_202',
      title: 'Behavioral Activation & Depression Recovery',
      subtitle: 'Structured clinical protocols to overcome depressive inertia',
      instructorName: 'Dr. Bilal Qureshi',
      instructorTitle: 'Consultant Psychiatrist & CBT Specialist',
      pricePKR: 4500,
      difficulty: 'Intermediate',
      totalDurationMinutes: 180,
      totalItems: 8,
      isPublished: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      liveMeetLink: 'https://meet.google.com/dep-recovery-qa',
      liveMeetSchedule: 'Every Sunday, 8:00 PM PKT',
      modules: [
        {
          moduleId: 'm_ba_01',
          title: 'Module 1: The Inertia Spiral & Activity Monitoring',
          order: 1,
          lessons: [
            {
              lessonId: 'l_ba_01',
              title: 'Introduction to Behavioral Activation',
              type: 'video',
              durationMinutes: 15,
              isFreePreview: true,
              youtubeVideoId: 'dQw4w9WgXcQ',
              summaryText: 'How depression dismantles positive reinforcement loops.',
              resources: [
                { title: 'Weekly Activity Schedule', pdfUrl: 'https://storage.betterself.pk/sheets/was.pdf' }
              ],
              quizId: null
            }
          ]
        }
      ],
      quizzes: [
        {
          quizId: 'q_ba_01',
          passingScore: 70,
          questions: [
            {
              questionText: 'What is the primary objective of Behavioral Activation?',
              options: [
                'Gradually increasing engagement in reinforcing and values-congruent activities',
                'Prescribing medication',
                'Encouraging bed rest',
                'Ignoring emotions'
              ],
              correctOptionIndex: 0,
              explanation: 'Behavioral Activation breaks the depressive cycle by restoring systematic positive reinforcement.'
            }
          ]
        }
      ]
    };

    const createCourseRes = await fetch(`${baseUrl}/api/admin/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(newCoursePayload)
    });
    assert(createCourseRes.status === 200, 'Admin creates course with modules & quiz (HTTP 200)');

    // Verify course appears in public catalog
    const catalogRes = await fetch(`${baseUrl}/api/courses`);
    const catalogData = await catalogRes.json();
    const foundNewCourse = catalogData.courses.find(c => c.courseId === 'c_depression_cbt_202');
    assert(!!foundNewCourse, 'Newly created course appears in public catalog grid');
    assert(foundNewCourse?.pricePKR === 4500, 'Catalog price matches PKR 4,500');

    // -------------------------------------------------------------
    // Scenario E: Admin Verification Queue & 1-Click Approval
    // -------------------------------------------------------------
    console.log('\n[Step 7] Scenario E: Admin Payment Verification & Approval...');
    const adminQueueRes = await fetch(`${baseUrl}/api/admin/enrollments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminQueueData = await adminQueueRes.json();
    assert(adminQueueRes.status === 200, 'Admin views payment verification queue');
    const queueItem = adminQueueData.enrollments.find(e => e.enrollmentId === createdEnrollmentId);
    assert(!!queueItem, 'Pending student enrollment found in admin queue');
    assert(queueItem?.status === 'pending', 'Status is pending before approval');
    assert(queueItem?.transactionId === 'JC-994827104', 'Admin can inspect student TID');
    assert(!!queueItem?.receiptImageUrl, 'Admin can inspect student receipt screenshot');

    // 1-Click Approval
    const approveRes = await fetch(`${baseUrl}/api/admin/enrollments/${createdEnrollmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'active' })
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, 'Admin approves payment with 1-click (HTTP 200)');
    assert(approveData.enrollment?.status === 'active', 'Enrollment status updated to ACTIVE');

    // -------------------------------------------------------------
    // Scenario F: Post-Approval FULL Access Upgrade
    // -------------------------------------------------------------
    console.log('\n[Step 8] Scenario F: Student Returns to Classroom with FULL Access...');
    const postApproveRes = await fetch(`${baseUrl}/api/learn/c_anxiety_101`, {
      headers: { Authorization: `Bearer ${newStudentToken}` }
    });
    const postApproveData = await postApproveRes.json();

    assert(postApproveRes.status === 200, 'Student accesses classroom post-approval');
    assert(postApproveData.access?.level === 'FULL', 'Access level successfully upgraded to FULL');
    assert(postApproveData.access?.isTrial === false, 'isTrial flag is FALSE (Permit permanent full access)');

    // Module 2 is now completely UNLOCKED
    const postMod2 = postApproveData.course.modules[1];
    assert(postMod2.isLocked === false, 'Module 2 is now UNLOCKED for approved student');
    assert(postMod2.lessons[0].youtubeVideoId !== null, 'Module 2 Lesson video IDs are fully accessible');

  } finally {
    server.close();
  }

  console.log('\n=================================================================');
  console.log(` RESULT: ${passedTests} / ${totalTests} acceptance assertions PASSED`);
  console.log('=================================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> MILESTONE 2 (M2) ACCEPTANCE CRITERIA FULLY VERIFIED! <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME M2 ACCEPTANCE TESTS FAILED <<<');
    process.exit(1);
  }
};

runM2Verification().catch(err => {
  console.error('[M2 Verification Fatal Error]', err);
  process.exit(1);
});
