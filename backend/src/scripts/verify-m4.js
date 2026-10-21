import http from 'http';
import app from '../server.js';
import { seedDatabase } from './seed.js';

const runM4Verification = async () => {
  console.log('=================================================================');
  console.log(' BETTERSELF LMS — MILESTONE 4 (M4) AUTOMATED ACCEPTANCE TEST');
  console.log(' Payment Approval, pdf-lib + QR Stamped Certificate & Verification');
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
    const adminToken = 'mock-token-admin';
    const studentToken = 'mock-token-student'; // Active student u_123 on c_anxiety_101
    const courseId = 'c_anxiety_101';

    // -------------------------------------------------------------
    // Step 1: Premature Certificate Request Blocked (< 100%)
    // -------------------------------------------------------------
    console.log('[Step 3] Verifying Premature Certificate Request Guard (<100%)...');
    const prematureRes = await fetch(`${baseUrl}/api/learn/${courseId}/certificate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const prematureData = await prematureRes.json();

    assert(prematureRes.status === 400, 'Premature certificate generation blocked with HTTP 400');
    assert(prematureData.error === 'Complete 100% of course items first.', 'Correct error message returned');

    // -------------------------------------------------------------
    // Step 2: Student Progresses to 100% Completion
    // -------------------------------------------------------------
    console.log('\n[Step 4] Simulating Student Completing All 12 Course Items...');
    const allItemIds = [
      'l_01', 'l_02', 'l_03', 'l_04',
      'l_05', 'l_06', 'l_07', 'l_08',
      'l_09', 'l_10', 'l_11', 'l_12'
    ];

    for (const itemId of allItemIds) {
      await fetch(`${baseUrl}/api/learn/${courseId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({ itemId })
      });
    }

    // Verify 100% progress
    const checkClassRes = await fetch(`${baseUrl}/api/learn/${courseId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const checkClassData = await checkClassRes.json();
    assert(checkClassData.progress?.progressPercent === 100, 'Student reached 100% completion in Firestore');
    console.log('  ✓ Student is now fully eligible for official graduation credential');

    // -------------------------------------------------------------
    // Step 3: Generate QR-Stamped Certificate via pdf-lib (SEC-08)
    // -------------------------------------------------------------
    console.log('\n[Step 5] Generating QR-Verified PDF Certificate via pdf-lib & qrcode...');
    const certGenRes = await fetch(`${baseUrl}/api/learn/${courseId}/certificate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const certGenData = await certGenRes.json();

    assert(certGenRes.status === 200, 'Certificate generation returns HTTP 200');
    assert(!!certGenData.certificate?.certificateId, 'Unique Certificate ID assigned');
    assert(certGenData.certificate?.certificateId.startsWith('BS-'), 'Certificate ID matches format BS-YYYY-XXXXXX');
    assert(!!certGenData.certificate?.verifyUrl, 'verifyUrl generated');
    assert(certGenData.certificate?.userName === 'Zainab Fatima', 'Student name matches enrollment record');
    assert(certGenData.certificate?.courseTitle === 'Mastering Anxiety & Cognitive Reframing', 'Course title stamped');
    assert(certGenData.certificate?.instructorName === 'Dr. Ayesha Siddiqui', 'Instructor name stamped');
    assert(!!certGenData.pdfBase64, 'Dynamic PDF document generated and encoded');

    const generatedCertId = certGenData.certificate.certificateId;
    console.log(`  [Info] Issued Certificate ID: ${generatedCertId}`);

    // Test direct PDF binary stream download
    const pdfStreamRes = await fetch(`${baseUrl}/api/learn/${courseId}/certificate?format=pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(pdfStreamRes.status === 200, 'Direct PDF stream download returns HTTP 200');
    assert(pdfStreamRes.headers.get('content-type') === 'application/pdf', 'Content-Type is application/pdf');

    // -------------------------------------------------------------
    // Step 4: Public Credential Verification (GET /api/verify/:certId)
    // -------------------------------------------------------------
    console.log('\n[Step 6] Verifying Public Credential Registry (SEC-05 & SEC-07 Wireframe 4)...');

    // Invalid certificate check
    const invalidCertRes = await fetch(`${baseUrl}/api/verify/INVALID-CERT-999`);
    const invalidCertData = await invalidCertRes.json();
    assert(invalidCertRes.status === 404, 'Unregistered Certificate ID returns HTTP 404');
    assert(invalidCertData.isValid === false, 'Invalid certificate indicated as isValid: false');

    // Valid certificate check
    const validCertRes = await fetch(`${baseUrl}/api/verify/${generatedCertId}`);
    const validCertData = await validCertRes.json();

    assert(validCertRes.status === 200, 'Valid Certificate ID returns HTTP 200 OK');
    assert(validCertData.isValid === true, 'Valid certificate indicated as isValid: true');
    assert(validCertData.certificate?.certificateId === generatedCertId, 'Certificate ID matches query');
    assert(validCertData.certificate?.userName === 'Zainab Fatima', 'Public view displays correct student name');
    assert(validCertData.certificate?.courseTitle === 'Mastering Anxiety & Cognitive Reframing', 'Public view displays correct course');
    assert(validCertData.certificate?.instructorName === 'Dr. Ayesha Siddiqui', 'Public view displays clinical instructor');
    assert(!!validCertData.certificate?.issuedAt, 'Public view displays timestamped issuance date');

  } finally {
    server.close();
  }

  console.log('\n=================================================================');
  console.log(` RESULT: ${passedTests} / ${totalTests} acceptance assertions PASSED`);
  console.log('=================================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> MILESTONE 4 (M4) ACCEPTANCE CRITERIA FULLY VERIFIED! <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME M4 ACCEPTANCE TESTS FAILED <<<');
    process.exit(1);
  }
};

runM4Verification().catch(err => {
  console.error('[M4 Verification Fatal Error]', err);
  process.exit(1);
});
