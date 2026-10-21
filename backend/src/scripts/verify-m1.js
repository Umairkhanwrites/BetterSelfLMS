import http from 'http';
import app from '../server.js';
import { seedDatabase } from './seed.js';

const runVerification = async () => {
  console.log('=================================================================');
  console.log(' BETTERSELF LMS — MILESTONE 1 (M1) AUTOMATED ACCEPTANCE TEST');
  console.log('=================================================================\n');

  // Step 1: Run Seeding
  console.log('[Step 1] Seeding database with realistic BetterSelf Anxiety Course...');
  await seedDatabase();
  console.log('✓ Seeding complete.\n');

  // Step 2: Start server on ephemeral port for tests
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Step 2] Test HTTP Server running on ${baseUrl}\n`);

  let passedTests = 0;
  let totalTests = 0;

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
    // Test 1: Public GET /api/courses returns seeded catalog
    // -------------------------------------------------------------
    console.log('[Step 3] Verifying Public Course Discovery Contract (SEC-05)...');
    const coursesRes = await fetch(`${baseUrl}/api/courses`);
    const coursesData = await coursesRes.json();

    assert(coursesRes.status === 200, 'GET /api/courses returns HTTP 200');
    assert(Array.isArray(coursesData.courses), 'Response contains courses array');
    const anxietyCourse = coursesData.courses.find(c => c.courseId === 'c_anxiety_101');
    assert(!!anxietyCourse, 'Seeded course c_anxiety_101 found in catalog');
    assert(anxietyCourse?.pricePKR === 3500, 'Course price is 3500 PKR');
    assert(anxietyCourse?.instructorName === 'Dr. Ayesha Siddiqui', 'Instructor is Dr. Ayesha Siddiqui');
    assert(anxietyCourse?.totalItems === 12, 'totalItems is exactly 12');

    // -------------------------------------------------------------
    // Test 2: Public GET /api/courses/:courseId leaks NO non-preview video IDs
    // -------------------------------------------------------------
    console.log('\n[Step 4] Verifying Free Preview vs Non-Preview Redaction...');
    const singleCourseRes = await fetch(`${baseUrl}/api/courses/c_anxiety_101`);
    const singleCourseData = await singleCourseRes.json();

    assert(singleCourseRes.status === 200, 'GET /api/courses/c_anxiety_101 returns HTTP 200');
    const modules = singleCourseData.course?.modules || [];
    assert(modules.length === 3, 'Course contains 3 structured modules');

    const lesson1 = modules[0]?.lessons[0];
    const lesson2 = modules[0]?.lessons[1];

    assert(lesson1?.isFreePreview === true, 'Lesson 1 is marked as isFreePreview: true');
    assert(lesson1?.youtubeVideoId === 'dQw4w9WgXcQ', 'Lesson 1 (Preview) includes youtubeVideoId for modal preview');

    assert(lesson2?.isFreePreview === false, 'Lesson 2 is marked as isFreePreview: false');
    assert(lesson2?.youtubeVideoId === null, 'Lesson 2 (Paid) DOES NOT leak youtubeVideoId (redacted to null)');
    assert(lesson2?.resources[0]?.pdfUrl === null, 'Lesson 2 paid worksheet download URL is redacted to null');

    // -------------------------------------------------------------
    // Test 3: Unauthenticated requests to protected endpoints return 401
    // -------------------------------------------------------------
    console.log('\n[Step 5] Verifying Authentication Guards (401 on unauthenticated requests)...');

    const testEndpoints = [
      { method: 'GET', path: '/api/enrollments/my', name: 'GET /api/enrollments/my' },
      { method: 'POST', path: '/api/enrollments/request', name: 'POST /api/enrollments/request' },
      { method: 'GET', path: '/api/learn/c_anxiety_101', name: 'GET /api/learn/:courseId' },
      { method: 'POST', path: '/api/learn/c_anxiety_101/complete', name: 'POST /api/learn/:courseId/complete' },
      { method: 'POST', path: '/api/learn/c_anxiety_101/quiz', name: 'POST /api/learn/:courseId/quiz' },
      { method: 'POST', path: '/api/learn/c_anxiety_101/notes', name: 'POST /api/learn/:courseId/notes' },
      { method: 'POST', path: '/api/learn/c_anxiety_101/certificate', name: 'POST /api/learn/:courseId/certificate' },
      { method: 'GET', path: '/api/admin/enrollments', name: 'GET /api/admin/enrollments' },
      { method: 'PATCH', path: '/api/admin/enrollments/enr_123', name: 'PATCH /api/admin/enrollments/:id' },
      { method: 'POST', path: '/api/admin/courses', name: 'POST /api/admin/courses' }
    ];

    for (const ep of testEndpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' }
      });
      assert(res.status === 401, `Unauthenticated ${ep.name} returns 401 Unauthorized`);
    }

    // -------------------------------------------------------------
    // Test 4: Admin Guard (isAdmin) blocks standard students with 403
    // -------------------------------------------------------------
    console.log('\n[Step 6] Verifying Admin Guard (403 for non-admin students)...');
    const studentAdminRes = await fetch(`${baseUrl}/api/admin/enrollments`, {
      headers: {
        'Authorization': 'Bearer mock-token-student'
      }
    });
    assert(studentAdminRes.status === 403, 'Student access to /api/admin/enrollments returns 403 Forbidden');

    // Admin access succeeds
    const adminRes = await fetch(`${baseUrl}/api/admin/enrollments`, {
      headers: {
        'Authorization': 'Bearer mock-token-admin'
      }
    });
    assert(adminRes.status === 200, 'Admin access to /api/admin/enrollments returns 200 OK');

    // -------------------------------------------------------------
    // Test 5: verifyCourseAccess Guard (SEC-04 & SEC-06)
    // -------------------------------------------------------------
    console.log('\n[Step 7] Verifying Course Access & 24h Pending Module-1 Trial Rule...');

    // 5a: Un-enrolled user accessing classroom -> 403 Not enrolled
    const unenrolledToken = 'mock-token-custom:u_random_visitor:visitor@example.com:false';
    const unenrolledRes = await fetch(`${baseUrl}/api/learn/c_anxiety_101`, {
      headers: { 'Authorization': `Bearer ${unenrolledToken}` }
    });
    assert(unenrolledRes.status === 403, 'Un-enrolled user gets 403 Forbidden (Not enrolled in this course)');

    // 5b: Active user (u_123) gets FULL access to all modules
    const activeRes = await fetch(`${baseUrl}/api/learn/c_anxiety_101`, {
      headers: { 'Authorization': 'Bearer mock-token-student' }
    });
    const activeData = await activeRes.json();
    assert(activeRes.status === 200, 'Active student u_123 gets 200 OK');
    assert(activeData.access?.level === 'FULL', 'Active student gets FULL accessLevel');
    assert(activeData.course?.modules[1]?.lessons[0]?.youtubeVideoId !== null, 'Active student can view Module 2 video IDs');

    // 5c: Pending user under 24h (u_trial_01) gets Module 1 Trial unlocked, Module 2 locked
    const trialToken = 'mock-token-custom:u_trial_01:trial@example.com:false';
    const trialRes = await fetch(`${baseUrl}/api/learn/c_anxiety_101`, {
      headers: { 'Authorization': `Bearer ${trialToken}` }
    });
    const trialData = await trialRes.json();
    assert(trialRes.status === 200, 'Pending user (< 24h) gets 200 OK for instant trial');
    assert(trialData.access?.level === 'TRIAL_MODULE_1', 'Pending user gets TRIAL_MODULE_1 accessLevel');
    assert(trialData.access?.isTrial === true, 'isTrial flag is true');
    assert(trialData.course?.modules[0]?.isLocked === false, 'Module 1 is UNLOCKED for trial user');
    assert(trialData.course?.modules[0]?.lessons[1]?.youtubeVideoId !== null, 'Trial user CAN view Module 1 lesson 2 video ID');
    assert(trialData.course?.modules[1]?.isLocked === true, 'Module 2 is LOCKED for trial user');
    assert(trialData.course?.modules[1]?.lessons[0]?.youtubeVideoId === null, 'Trial user CANNOT view Module 2 video IDs (redacted)');

    // 5d: Pending user > 24h (u_expired) gets 403 Forbidden (trialExpired: true)
    const expiredToken = 'mock-token-custom:u_expired:expired@example.com:false';
    const expiredRes = await fetch(`${baseUrl}/api/learn/c_anxiety_101`, {
      headers: { 'Authorization': `Bearer ${expiredToken}` }
    });
    const expiredData = await expiredRes.json();
    assert(expiredRes.status === 403, 'Expired pending user (> 24h) gets 403 Forbidden');
    assert(expiredData.trialExpired === true, 'Response indicates trialExpired: true');

  } finally {
    server.close();
  }

  console.log('\n=================================================================');
  console.log(` RESULT: ${passedTests} / ${totalTests} acceptance assertions PASSED`);
  console.log('=================================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> MILESTONE 1 (M1) ACCEPTANCE CRITERIA FULLY VERIFIED! <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME ACCEPTANCE TESTS FAILED <<<');
    process.exit(1);
  }
};

runVerification().catch(err => {
  console.error('[Verification Fatal Error]', err);
  process.exit(1);
});
