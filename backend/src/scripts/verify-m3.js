import http from 'http';
import app from '../server.js';
import { seedDatabase } from './seed.js';

const runM3Verification = async () => {
  console.log('=================================================================');
  console.log(' BETTERSELF LMS — MILESTONE 3 (M3) AUTOMATED ACCEPTANCE TEST');
  console.log(' Classroom Split View, Progress Tracking & Clinical Quiz Engine');
  console.log('=================================================================\n');

  // Step 1: Seed fresh DB
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
    const studentToken = 'mock-token-student'; // Active student u_123 on c_anxiety_101
    const courseId = 'c_anxiety_101';

    // -------------------------------------------------------------
    // Test 1: Fetch Initial Classroom Data & 4-Tab Materials
    // -------------------------------------------------------------
    console.log('[Step 3] Verifying Distraction-Free Classroom Materials (SEC-07 Wireframe 3)...');
    const classRes = await fetch(`${baseUrl}/api/learn/${courseId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const classData = await classRes.json();

    assert(classRes.status === 200, 'Classroom data loaded successfully');
    assert(classData.course?.modules?.length === 3, 'All 3 modules present in curriculum sidebar');
    assert(!!classData.course?.liveMeetLink, 'Live Google Meet link present for Q&A tab');
    assert(classData.course?.liveMeetSchedule === 'Every Saturday, 7:00 PM PKT', 'Live meet schedule present');

    const initialProgress = classData.progress?.progressPercent;
    console.log(`  [Info] Student initial progress: ${initialProgress}% (${classData.progress?.completedItemIds?.length} completed items)`);

    // -------------------------------------------------------------
    // Test 2: Auto-Complete on Video End (POST /api/learn/:courseId/complete)
    // -------------------------------------------------------------
    console.log('\n[Step 4] Verifying Video Auto-Completion & Progress Increment (SEC-08)...');
    const itemToComplete = 'l_09'; // Physiological Sigh & Grounding video lesson

    const completeRes = await fetch(`${baseUrl}/api/learn/${courseId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ itemId: itemToComplete })
    });
    const completeData = await completeRes.json();

    assert(completeRes.status === 200, 'Complete item request returns HTTP 200');
    assert(completeData.completedItemIds.includes(itemToComplete), 'Item l_09 added to completedItemIds list');
    assert(completeData.progressPercent > initialProgress, 'progressPercent incremented accurately');
    console.log(`  [Info] Updated progress: ${completeData.progressPercent}%`);

    // -------------------------------------------------------------
    // Test 3: Timestamped Private Student Notes (POST & GET /api/learn/:courseId/notes)
    // -------------------------------------------------------------
    console.log('\n[Step 5] Verifying Timestamped Student Notes (SEC-08)...');
    const notePayload = {
      lessonId: 'l_09',
      videoTimestampSeconds: 94, // 1m 34s
      content: 'Clinical breakthrough: double-inhale physiological sigh rapidly down-regulates sympathetic spike.'
    };

    const saveNoteRes = await fetch(`${baseUrl}/api/learn/${courseId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify(notePayload)
    });
    const saveNoteData = await saveNoteRes.json();

    assert(saveNoteRes.status === 201, 'Note saved with HTTP 201 Created');
    assert(saveNoteData.note?.videoTimestampSeconds === 94, 'Video timestamp captured accurately (94s)');
    assert(saveNoteData.note?.content === notePayload.content, 'Note content preserved');

    // Retrieve saved notes
    const getNotesRes = await fetch(`${baseUrl}/api/learn/${courseId}/notes`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const getNotesData = await getNotesRes.json();
    assert(getNotesRes.status === 200, 'GET notes returns HTTP 200');
    assert(getNotesData.notes.length > 0, 'Notes list contains created note');
    assert(getNotesData.notes[0].lessonId === 'l_09', 'Note associates with lessonId l_09');

    // -------------------------------------------------------------
    // Test 4: Clinical Quiz Engine — Auto-Grading, Explanations & Retry
    // -------------------------------------------------------------
    console.log('\n[Step 6] Verifying Clinical Quiz Engine Auto-Grading & Explanations (SEC-01 & SEC-05)...');

    // Scenario 4a: Failing Quiz Submission (< 70%)
    const failQuizPayload = {
      quizId: 'q_01',
      answers: [1, 1] // Both incorrect answers
    };

    const failQuizRes = await fetch(`${baseUrl}/api/learn/${courseId}/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify(failQuizPayload)
    });
    const failQuizData = await failQuizRes.json();

    assert(failQuizRes.status === 200, 'Quiz grading returns HTTP 200');
    assert(failQuizData.scorePercent === 0, 'Failing score calculated as 0%');
    assert(failQuizData.passed === false, 'Quiz status is passed: false (<70%)');
    assert(failQuizData.perQuestionReview?.length === 2, 'Returns review for all 2 questions');
    assert(failQuizData.perQuestionReview[0].isCorrect === false, 'Question 1 marked incorrect');
    assert(!!failQuizData.perQuestionReview[0].explanation, 'Per-question clinical explanation rendered');
    assert(failQuizData.updatedProgress === null, 'Progress is NOT auto-completed on failed quiz');

    // Scenario 4b: Passing Quiz Submission (>= 70%)
    const passQuizPayload = {
      quizId: 'q_01',
      answers: [0, 0] // Both correct answers
    };

    const passQuizRes = await fetch(`${baseUrl}/api/learn/${courseId}/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify(passQuizPayload)
    });
    const passQuizData = await passQuizRes.json();

    assert(passQuizRes.status === 200, 'Passing quiz grading returns HTTP 200');
    assert(passQuizData.scorePercent === 100, 'Passing score calculated as 100%');
    assert(passQuizData.passed === true, 'Quiz status is passed: true (>=70%)');
    assert(passQuizData.perQuestionReview[0].isCorrect === true, 'Question 1 marked correct');
    assert(
      passQuizData.perQuestionReview[0].explanation.includes('Catastrophizing'),
      'Clinical rationale returned for Question 1'
    );
    assert(!!passQuizData.updatedProgress, 'Quiz pass automatically increments course progress');
    assert(
      passQuizData.updatedProgress.completedItemIds.includes('q_01'),
      'Quiz ID q_01 added to completedItemIds'
    );

  } finally {
    server.close();
  }

  console.log('\n=================================================================');
  console.log(` RESULT: ${passedTests} / ${totalTests} acceptance assertions PASSED`);
  console.log('=================================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> MILESTONE 3 (M3) ACCEPTANCE CRITERIA FULLY VERIFIED! <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME M3 ACCEPTANCE TESTS FAILED <<<');
    process.exit(1);
  }
};

runM3Verification().catch(err => {
  console.error('[M3 Verification Fatal Error]', err);
  process.exit(1);
});
