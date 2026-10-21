import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import { db } from '../config/firebaseAdmin.js';

// POST /api/learn/:courseId/certificate (verifyActive)
// Requires progressPercent === 100 . Generates QR-stamped PDF via pdf-lib
export const generateCertificate = async (req, res) => {
  const { courseId } = req.params;

  try {
    // Check progress
    const enrollment = req.enrollmentData;
    if (!enrollment || (enrollment.progressPercent || 0) < 100) {
      return res.status(400).json({
        error: 'Complete 100% of course items first.'
      });
    }

    // Fetch course details
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const course = courseDoc.data();

    // Check if certificate already exists for this enrollment/user
    const existingSnap = await db.collection('certificates')
      .where('userId', '==', req.user.uid)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    let certId;
    let certRecord;
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const data = existingDoc.data();
      certId = data.certificateId || existingDoc.id;

      certRecord = {
        certificateId: certId,
        userId: data.userId || req.user.uid,
        userName: data.userName || data.studentName || req.user.name || enrollment.userName || 'Valued Learner',
        courseId,
        courseTitle: data.courseTitle || course.title || 'BetterSelf Clinical Mastery Track',
        instructorName: data.instructorName || course.instructorName || 'Dr. Ayesha Siddiqui',
        instructorTitle: data.instructorTitle || course.instructorTitle || 'Clinical Psychologist, MS',
        issuedAt: data.issuedAt || data.completionDate || new Date().toISOString(),
        verifyUrl: data.verifyUrl || (data.verificationUrl ? `${protocol}://${host}${data.verificationUrl.startsWith('/') ? '' : '/'}${data.verificationUrl}` : `${protocol}://${host}/verify/${certId}`),
        enrollmentId: data.enrollmentId || enrollment.enrollmentId || null
      };

      await db.collection('certificates').doc(existingDoc.id).set(certRecord, { merge: true });
    } else {
      const year = new Date().getFullYear();
      certId = `BS-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
      const verifyUrl = `${protocol}://${host}/verify/${certId}`;
      const studentName = req.user.name || enrollment.userName || 'Valued Learner';

      certRecord = {
        certificateId: certId,
        userId: req.user.uid,
        userName: studentName,
        courseId,
        courseTitle: course.title || 'BetterSelf Clinical Course',
        instructorName: course.instructorName || 'Dr. Ayesha Siddiqui',
        instructorTitle: course.instructorTitle || 'Clinical Psychologist, MS',
        issuedAt: new Date().toISOString(),
        verifyUrl,
        enrollmentId: enrollment.enrollmentId || null
      };

      await db.collection('certificates').doc(certId).set(certRecord);
    }

    // Generate PDF with pdf-lib
    const pdfDoc = await PDFDocument.create();
    // A4 Landscape: 841.89 x 595.28 points
    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Decorative Border: Navy / Emerald palette
    page.drawRectangle({
      x: 20,
      y: 20,
      width: pageWidth - 40,
      height: pageHeight - 40,
      borderColor: rgb(0.08, 0.38, 0.45), // BetterSelf Teal
      borderWidth: 3,
      color: rgb(0.99, 0.99, 1.0)
    });

    page.drawRectangle({
      x: 28,
      y: 28,
      width: pageWidth - 56,
      height: pageHeight - 56,
      borderColor: rgb(0.85, 0.70, 0.35), // Gold Accent
      borderWidth: 1.5,
      color: rgb(0.98, 0.99, 0.99)
    });

    // Header Branding
    const brand = 'BETTERSELF LEARNING MANAGEMENT SYSTEM';
    const brandWidth = fontBold.widthOfTextAtSize(brand, 14);
    page.drawText(brand, {
      x: (pageWidth - brandWidth) / 2,
      y: 520,
      size: 14,
      font: fontBold,
      color: rgb(0.08, 0.38, 0.45)
    });

    const title = 'CERTIFICATE OF CLINICAL MASTERY';
    const titleWidth = fontBold.widthOfTextAtSize(title, 26);
    page.drawText(title, {
      x: (pageWidth - titleWidth) / 2,
      y: 470,
      size: 26,
      font: fontBold,
      color: rgb(0.09, 0.15, 0.28)
    });

    const subtitle = 'This certifies that';
    const subWidth = fontReg.widthOfTextAtSize(subtitle, 13);
    page.drawText(subtitle, {
      x: (pageWidth - subWidth) / 2,
      y: 430,
      size: 13,
      font: fontReg,
      color: rgb(0.35, 0.4, 0.45)
    });

    // Student Name
    const name = String(certRecord.userName || 'Valued Learner');
    const nameWidth = fontBold.widthOfTextAtSize(name, 28);
    page.drawText(name, {
      x: (pageWidth - nameWidth) / 2,
      y: 380,
      size: 28,
      font: fontBold,
      color: rgb(0.08, 0.38, 0.45)
    });

    // Completion statement
    const stmt = 'has successfully completed all modules, psychoeducation labs, and assessments for:';
    const stmtWidth = fontReg.widthOfTextAtSize(stmt, 12);
    page.drawText(stmt, {
      x: (pageWidth - stmtWidth) / 2,
      y: 335,
      size: 12,
      font: fontReg,
      color: rgb(0.3, 0.35, 0.4)
    });

    // Course Title
    const cTitle = String(certRecord.courseTitle || 'Clinical Psychoeducation Course');
    const cTitleWidth = fontBold.widthOfTextAtSize(cTitle, 20);
    page.drawText(cTitle, {
      x: (pageWidth - cTitleWidth) / 2,
      y: 295,
      size: 20,
      font: fontBold,
      color: rgb(0.09, 0.15, 0.28)
    });

    // QR Code generation
    const qrTargetUrl = String(certRecord.verifyUrl || `http://localhost:3000/verify/${certId}`);
    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
      margin: 1,
      width: 120,
      color: { dark: '#144e59', light: '#ffffff' }
    });
    const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    // Draw QR Code
    page.drawImage(qrImage, {
      x: 80,
      y: 90,
      width: 100,
      height: 100
    });

    page.drawText('Scan to Verify Credential', {
      x: 75,
      y: 72,
      size: 8,
      font: fontReg,
      color: rgb(0.4, 0.45, 0.5)
    });

    // Signatures
    const instructorLine = String(certRecord.instructorName || 'Dr. Ayesha Siddiqui');
    page.drawText(instructorLine, {
      x: 550,
      y: 135,
      size: 13,
      font: fontBold,
      color: rgb(0.09, 0.15, 0.28)
    });

    const instTitleStr = String(certRecord.instructorTitle || 'Clinical Psychologist, MS');
    page.drawText(instTitleStr, {
      x: 550,
      y: 118,
      size: 10,
      font: fontItalic,
      color: rgb(0.4, 0.45, 0.5)
    });

    page.drawText('Clinical Program Lead, BetterSelf', {
      x: 550,
      y: 103,
      size: 9,
      font: fontReg,
      color: rgb(0.4, 0.45, 0.5)
    });

    // Meta details (Certificate ID & Date)
    page.drawText(`Certificate ID: ${certRecord.certificateId}`, {
      x: 320,
      y: 125,
      size: 9,
      font: fontBold,
      color: rgb(0.3, 0.35, 0.4)
    });

    const issueDateStr = new Date(certRecord.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    page.drawText(`Issued: ${issueDateStr}`, {
      x: 320,
      y: 108,
      size: 9,
      font: fontReg,
      color: rgb(0.4, 0.45, 0.5)
    });

    const pdfBytes = await pdfDoc.save();

    // If client requested download as PDF directly
    if (req.query.format === 'pdf' || req.headers.accept?.includes('application/pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${certId}.pdf"`);
      return res.status(200).send(Buffer.from(pdfBytes));
    }

    return res.status(200).json({
      message: 'Certificate generated successfully',
      certificate: certRecord,
      pdfBase64: Buffer.from(pdfBytes).toString('base64')
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to generate certificate',
      details: err.message
    });
  }
};

// GET /api/verify/:certificateId (Public)
// Returns verified certificate record for public QR / LinkedIn credential check
export const verifyCertificate = async (req, res) => {
  const { certificateId } = req.params;

  try {
    const certDoc = await db.collection('certificates').doc(certificateId).get();
    if (!certDoc.exists) {
      return res.status(404).json({
        isValid: false,
        error: 'Certificate not found. This credential may be invalid or expired.'
      });
    }

    const certData = certDoc.data();
    return res.status(200).json({
      isValid: true,
      certificate: {
        certificateId: certData.certificateId,
        userName: certData.userName,
        courseTitle: certData.courseTitle,
        instructorName: certData.instructorName,
        instructorTitle: certData.instructorTitle,
        issuedAt: certData.issuedAt,
        verifyUrl: certData.verifyUrl
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to query certificate verification registry',
      details: err.message
    });
  }
};
