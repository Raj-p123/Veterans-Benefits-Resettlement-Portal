import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import http from 'http';
import app from '../app.js';
import { config } from '../config/environment.js';
import { User } from '../models/User.js';
import { Veteran } from '../models/Veteran.js';
import { Employer } from '../models/Employer.js';
import { Job } from '../models/Job.js';
import { JobApplication } from '../models/JobApplication.js';
import { Document } from '../models/Document.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';

let server;
let port;
let baseUrl;

const makeRequest = (options, postData = null, isMultipart = false) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      if (isMultipart || Buffer.isBuffer(postData)) {
        req.write(postData);
      } else if (typeof postData === 'object') {
        req.write(JSON.stringify(postData));
      } else {
        req.write(postData);
      }
    }
    req.end();
  });
};

const createMultipartPayload = (fields, fileField, filename, fileBuffer, mimeType) => {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const parts = [];

  for (const [key, val] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`
      )
    );
  }

  if (fileField && filename && fileBuffer) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      )
    );
    parts.push(fileBuffer);
    parts.push(Buffer.from('\r\n'));
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(parts);

  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
};

const runSuite = async () => {
  console.log('================================================================');
  console.log('  PHASE: SECURITY, DOCUMENT VERIFICATION & ADMIN APPROVAL TEST  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`[PASS] ✓ ${title} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ✕ ${title} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  try {
    // 1. Connect MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('[MongoDB] Connected to database:', config.mongodbUri);

    // 2. Start HTTP server on dynamic port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`[Test Server] Listening on ${baseUrl}\n`);
        resolve();
      });
    });

    // 3. Create or identify test users: Veteran A, Veteran B, Employer, Admin
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin.sec.test@example.com' },
      {
        name: 'Sec Admin',
        email: 'admin.sec.test@example.com',
        role: 'ADMIN',
        isActive: true,
      },
      { upsert: true, new: true }
    );

    const vetAUser = await User.findOneAndUpdate(
      { email: 'vet.a.sec.test@example.com' },
      {
        name: 'Subedar Veteran A',
        email: 'vet.a.sec.test@example.com',
        role: 'VETERAN',
        isActive: true,
      },
      { upsert: true, new: true }
    );

    const vetBUser = await User.findOneAndUpdate(
      { email: 'vet.b.sec.test@example.com' },
      {
        name: 'Havildar Veteran B',
        email: 'vet.b.sec.test@example.com',
        role: 'VETERAN',
        isActive: true,
      },
      { upsert: true, new: true }
    );

    const employerUser = await User.findOneAndUpdate(
      { email: 'employer.sec.test@example.com' },
      {
        name: 'Defense Tech HR',
        email: 'employer.sec.test@example.com',
        role: 'EMPLOYER',
        isActive: true,
      },
      { upsert: true, new: true }
    );

    const vetA = await Veteran.findOneAndUpdate(
      { user: vetAUser._id },
      {
        user: vetAUser._id,
        veteranId: 'VET-SEC-001',
        personalInformation: { fullName: 'Subedar Veteran A', email: vetAUser.email },
      },
      { upsert: true, new: true }
    );

    const vetB = await Veteran.findOneAndUpdate(
      { user: vetBUser._id },
      {
        user: vetBUser._id,
        veteranId: 'VET-SEC-002',
        personalInformation: { fullName: 'Havildar Veteran B', email: vetBUser.email },
      },
      { upsert: true, new: true }
    );

    const employer = await Employer.findOneAndUpdate(
      { user: employerUser._id },
      {
        user: employerUser._id,
        companyName: 'Defense Tech Systems Ltd',
        verificationStatus: 'VERIFIED',
      },
      { upsert: true, new: true }
    );

    // Generate JWT tokens
    const adminToken = jwt.sign({ id: adminUser._id, role: 'ADMIN' }, config.jwtSecret, {
      expiresIn: '1h',
    });
    const vetAToken = jwt.sign({ id: vetAUser._id, role: 'VETERAN' }, config.jwtSecret, {
      expiresIn: '1h',
    });
    const vetBToken = jwt.sign({ id: vetBUser._id, role: 'VETERAN' }, config.jwtSecret, {
      expiresIn: '1h',
    });
    const employerToken = jwt.sign({ id: employerUser._id, role: 'EMPLOYER' }, config.jwtSecret, {
      expiresIn: '1h',
    });

    let uploadedDocAId;
    let uploadedDocBId;

    // -------------------------------------------------------------
    // TEST 1: Veteran Uploads Valid PDF Document
    // -------------------------------------------------------------
    console.log('--- TEST 1: Veteran A Uploads Valid PDF Document ---');
    const samplePdfBuffer = Buffer.from('%PDF-1.4 ... Sample Army Discharge Certificate content ...');
    const { body: pdfPayload, contentType: pdfContentType } = createMultipartPayload(
      {
        documentType: 'Discharge Certificate',
        documentName: 'Army Discharge Book Page 1',
      },
      'file',
      'discharge_book.pdf',
      samplePdfBuffer,
      'application/pdf'
    );

    const uploadResA = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/documents',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vetAToken}`,
          'Content-Type': pdfContentType,
          'Content-Length': pdfPayload.length,
        },
      },
      pdfPayload,
      true
    );

    assert(
      uploadResA.status === 201 && uploadResA.body.success,
      'PDF Document Upload Succeeded',
      `Status: ${uploadResA.status}`
    );
    uploadedDocAId = uploadResA.body?.data?.document?.id || uploadResA.body?.data?.document?._id;
    assert(
      uploadedDocAId && uploadResA.body?.data?.document?.verificationStatus === 'PENDING',
      'Document Initial Status is PENDING',
      `ID: ${uploadedDocAId}`
    );

    // -------------------------------------------------------------
    // TEST 2: Veteran Uploads Valid JPG & PNG Document
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Veteran Uploads Valid Image (JPG/PNG) ---');
    const sampleJpgBuffer = Buffer.from('ÿØÿà...Sample JPEG Binary Data...');
    const { body: jpgPayload, contentType: jpgContentType } = createMultipartPayload(
      {
        documentType: 'Identity Document',
        documentName: 'Ex-Servicemen Identity Card',
      },
      'file',
      'esm_card.jpg',
      sampleJpgBuffer,
      'image/jpeg'
    );

    const uploadJpgRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/documents',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vetAToken}`,
          'Content-Type': jpgContentType,
          'Content-Length': jpgPayload.length,
        },
      },
      jpgPayload,
      true
    );

    assert(
      uploadJpgRes.status === 201 && uploadJpgRes.body.success,
      'JPEG Image Document Upload Succeeded',
      `Status: ${uploadJpgRes.status}`
    );

    // -------------------------------------------------------------
    // TEST 3: Reject Executable / Script Files (.exe, .sh, .js)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Security: Reject Dangerous Executable / Script Uploads ---');
    const maliciousPayload = createMultipartPayload(
      {
        documentType: 'Service Certificate',
        documentName: 'Trojan Payload',
      },
      'file',
      'exploit.exe',
      Buffer.from('MZ...fake executable binary...'),
      'application/x-msdownload'
    );

    const rejectExeRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/documents',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vetAToken}`,
          'Content-Type': maliciousPayload.contentType,
          'Content-Length': maliciousPayload.body.length,
        },
      },
      maliciousPayload.body,
      true
    );

    assert(
      rejectExeRes.status === 400 && !rejectExeRes.body.success,
      'Malicious .exe File Upload Rejected with 400 Bad Request',
      `Status: ${rejectExeRes.status}`
    );

    // -------------------------------------------------------------
    // TEST 4: Reject Oversized Files (> 10 MB)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Security: Reject Oversized Documents (> 10 MB) ---');
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB
    const oversizedPayload = createMultipartPayload(
      {
        documentType: 'Service Certificate',
        documentName: 'Massive Scan File',
      },
      'file',
      'huge_scan.pdf',
      oversizedBuffer,
      'application/pdf'
    );

    const rejectSizeRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/documents',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vetAToken}`,
          'Content-Type': oversizedPayload.contentType,
          'Content-Length': oversizedPayload.body.length,
        },
      },
      oversizedPayload.body,
      true
    );

    assert(
      rejectSizeRes.status === 400 && !rejectSizeRes.body.success,
      'Oversized Document Rejected with 400 Bad Request',
      `Status: ${rejectSizeRes.status}`
    );

    // -------------------------------------------------------------
    // TEST 5: Veteran B Uploads Document (For Ownership Isolation Testing)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Veteran B Uploads Private Document ---');
    const sampleVetBPdf = Buffer.from('%PDF-1.4 ... Veteran B Private Pension Book ...');
    const { body: vetBPayload, contentType: vetBContentType } = createMultipartPayload(
      {
        documentType: 'Pension Document',
        documentName: 'Veteran B Pension Order',
      },
      'file',
      'pension_order_b.pdf',
      sampleVetBPdf,
      'application/pdf'
    );

    const uploadResB = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: '/api/documents',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vetBToken}`,
          'Content-Type': vetBContentType,
          'Content-Length': vetBPayload.length,
        },
      },
      vetBPayload,
      true
    );

    uploadedDocBId = uploadResB.body?.data?.document?.id || uploadResB.body?.data?.document?._id;
    assert(
      uploadResB.status === 201 && !!uploadedDocBId,
      'Veteran B Document Upload Succeeded',
      `ID: ${uploadedDocBId}`
    );

    // -------------------------------------------------------------
    // TEST 6: Private Document Access Isolation (Veteran A tries to access Veteran B)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Security: Veteran Cross-Access Isolation ---');
    const snoopRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: `/api/documents/${uploadedDocBId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${vetAToken}`,
      },
    });

    assert(
      snoopRes.status === 403,
      'Veteran A Blocked from Accessing Veteran B Document (403 Forbidden)',
      `Status: ${snoopRes.status}`
    );

    const snoopFileRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: `/api/documents/${uploadedDocBId}/file`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${vetAToken}`,
      },
    });

    assert(
      snoopFileRes.status === 403,
      'Veteran A Blocked from Downloading Veteran B Document Binary (403 Forbidden)',
      `Status: ${snoopFileRes.status}`
    );

    // -------------------------------------------------------------
    // TEST 7: Employer Access Isolation (Unrelated Employer Blocked)
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Security: Unrelated Employer Access Blocked ---');
    const employerSnoopRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: `/api/documents/${uploadedDocAId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${employerToken}`,
      },
    });

    assert(
      employerSnoopRes.status === 403,
      'Employer Blocked from Accessing Unattached Veteran Document (403 Forbidden)',
      `Status: ${employerSnoopRes.status}`
    );

    // -------------------------------------------------------------
    // TEST 8: Unauthenticated Access Blocked
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Security: Unauthenticated Access Blocked ---');
    const unauthRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: `/api/documents/${uploadedDocAId}`,
      method: 'GET',
    });

    assert(
      unauthRes.status === 401,
      'Unauthenticated Document Request Blocked with 401 Unauthorized',
      `Status: ${unauthRes.status}`
    );

    // -------------------------------------------------------------
    // TEST 9: Admin Scrutiny & Approval Workflow (VERIFY)
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Admin Approves Document (VERIFIED) & Audit Log ---');
    const verifyRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: `/api/admin/documents/${uploadedDocAId}/status`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        status: 'VERIFIED',
        adminRemarks: 'Official army seal and commanding officer signature verified.',
      }
    );

    assert(
      verifyRes.status === 200 && verifyRes.body.success,
      'Admin Verified Document Successfully',
      `Status: ${verifyRes.status}`
    );

    const verifiedDoc = await Document.findById(uploadedDocAId);
    assert(
      verifiedDoc.verificationStatus === 'VERIFIED' &&
        verifiedDoc.verifiedBy?.toString() === adminUser._id.toString() &&
        !!verifiedDoc.verifiedAt,
      'Document Saved with verifiedBy and verifiedAt Timestamps'
    );

    const auditLogVerify = await AuditLog.findOne({
      entityId: String(uploadedDocAId),
      action: 'DOCUMENT_VERIFIED',
    });
    assert(
      !!auditLogVerify,
      'Audit Log Recorded for DOCUMENT_VERIFIED Action',
      `Audit ID: ${auditLogVerify?._id}`
    );

    const verifyNotif = await Notification.findOne({
      user: vetAUser._id,
      entityId: String(uploadedDocAId),
      type: 'DOCUMENT_STATUS_CHANGED',
    });
    assert(
      !!verifyNotif,
      'Notification Created for Veteran upon Document Verification',
      `Title: "${verifyNotif?.title}"`
    );

    // -------------------------------------------------------------
    // TEST 10: Admin Rejection Requires Reason (REJECT)
    // -------------------------------------------------------------
    console.log('\n--- TEST 10: Admin Rejects Document with Mandatory Reason ---');
    // Attempt rejection without reason (Must Fail)
    const rejectNoReasonRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: `/api/admin/documents/${uploadedDocBId}/status`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        status: 'REJECTED',
        adminRemarks: '',
      }
    );

    assert(
      rejectNoReasonRes.status === 400,
      'Admin Document Rejection without Reason is Blocked (400 Bad Request)',
      `Status: ${rejectNoReasonRes.status}`
    );

    // Valid Rejection with Reason
    const rejectValidRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: `/api/admin/documents/${uploadedDocBId}/status`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        status: 'REJECTED',
        rejectionReason: 'Illegible photocopy. Please upload a clear high-resolution color scan.',
      }
    );

    assert(
      rejectValidRes.status === 200 && rejectValidRes.body.success,
      'Admin Successfully Rejected Document with Reason',
      `Status: ${rejectValidRes.status}`
    );

    const rejectedDoc = await Document.findById(uploadedDocBId);
    assert(
      rejectedDoc.verificationStatus === 'REJECTED' &&
        rejectedDoc.rejectionReason.includes('Illegible photocopy') &&
        rejectedDoc.reviewedBy?.toString() === adminUser._id.toString() &&
        !!rejectedDoc.reviewedAt,
      'Document Saved with rejectionReason and reviewedBy/At Timestamps'
    );

    const auditLogReject = await AuditLog.findOne({
      entityId: String(uploadedDocBId),
      action: 'DOCUMENT_REJECTED',
    });
    assert(
      !!auditLogReject,
      'Audit Log Recorded for DOCUMENT_REJECTED Action'
    );

    // -------------------------------------------------------------
    // TEST 11: Veteran B Replaces / Re-uploads Rejected Document
    // -------------------------------------------------------------
    console.log('\n--- TEST 11: Veteran B Replaces / Re-uploads Rejected Document ---');
    const replacementBuffer = Buffer.from('%PDF-1.4 ... High-Res Clear Pension Book Replacement ...');
    const { body: replacePayload, contentType: replaceContentType } = createMultipartPayload(
      {
        documentName: 'Veteran B Clear Pension Order',
      },
      'file',
      'clear_pension.pdf',
      replacementBuffer,
      'application/pdf'
    );

    const replaceRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: `/api/documents/${uploadedDocBId}/replace`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${vetBToken}`,
          'Content-Type': replaceContentType,
          'Content-Length': replacePayload.length,
        },
      },
      replacePayload,
      true
    );

    assert(
      replaceRes.status === 200 && replaceRes.body.success,
      'Veteran Replaced Rejected Document Successfully',
      `Status: ${replaceRes.status}`
    );

    const replacedDoc = await Document.findById(uploadedDocBId);
    assert(
      replacedDoc.verificationStatus === 'PENDING' && replacedDoc.rejectionReason === '',
      'Replacement Document Status Reset to PENDING with Cleared Reason'
    );

    // -------------------------------------------------------------
    // TEST 12: Authorized Document File Streaming / Download
    // -------------------------------------------------------------
    console.log('\n--- TEST 12: Authorized Document Binary Streaming (Inline & Download) ---');
    const streamRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: `/api/documents/${uploadedDocAId}/file`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${vetAToken}`,
      },
    });

    assert(
      streamRes.status === 200 || streamRes.status === 302,
      'Owner Veteran Successfully Streamed Document File',
      `Status: ${streamRes.status}`
    );

    const adminStreamRes = await makeRequest({
      hostname: 'localhost',
      port,
      path: `/api/documents/${uploadedDocAId}/file`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert(
      adminStreamRes.status === 200 || adminStreamRes.status === 302,
      'Admin Successfully Streamed Veteran Document File',
      `Status: ${adminStreamRes.status}`
    );

    // -------------------------------------------------------------
    // TEST 13: RBAC Protection on Admin Document Actions
    // -------------------------------------------------------------
    console.log('\n--- TEST 13: Non-Admin Token Blocked from Admin Status Update ---');
    const vetTriesAdminRes = await makeRequest(
      {
        hostname: 'localhost',
        port,
        path: `/api/admin/documents/${uploadedDocAId}/status`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${vetAToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        status: 'VERIFIED',
      }
    );

    assert(
      vetTriesAdminRes.status === 403,
      'Veteran Blocked from Calling Admin Status Update (403 Forbidden)',
      `Status: ${vetTriesAdminRes.status}`
    );

    // Clean up test documents & logs
    await Document.deleteMany({ _id: { $in: [uploadedDocAId, uploadedDocBId] } });
    await Notification.deleteMany({ user: { $in: [vetAUser._id, vetBUser._id] } });
    await AuditLog.deleteMany({ entityId: { $in: [String(uploadedDocAId), String(uploadedDocBId)] } });
    await User.deleteMany({ email: { $in: ['admin.sec.test@example.com', 'vet.a.sec.test@example.com', 'vet.b.sec.test@example.com', 'employer.sec.test@example.com'] } });
    await Veteran.deleteMany({ veteranId: { $in: ['VET-SEC-001', 'VET-SEC-002'] } });
    await Employer.deleteMany({ companyName: 'Defense Tech Systems Ltd' });

    console.log('\n================================================================');
    console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (server) server.close();
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal Test Suite Error:', error);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
};

runSuite();
