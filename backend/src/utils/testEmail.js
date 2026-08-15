import { emailService } from '../services/emailService.js';
import { buildApplicationSubmittedEmail } from '../emails/applicationSubmitted.js';
import { buildApplicationStatusChangedEmail } from '../emails/applicationStatusChanged.js';
import {
  buildJobApplicationSubmittedEmail,
  buildJobApplicationReceivedEmail,
} from '../emails/jobApplicationReceived.js';
import { buildJobApplicationStatusChangedEmail } from '../emails/jobApplicationStatusChanged.js';

const runEmailVerification = async () => {
  console.log('=====================================================');
  console.log('       RESEND EMAIL INTEGRATION TEST SUITE           ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`[PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ✗ ${testName} - ${details}`);
      failed++;
    }
  };

  // 1. Template Generation Tests
  const subEmail = buildApplicationSubmittedEmail({
    veteranName: 'Subedar Major Vikram Batra',
    applicationId: 'APP-2026-000001',
    schemeName: 'Prime Minister Scholarship Scheme',
    submissionDate: new Date(),
    status: 'SUBMITTED',
    actionUrl: 'http://localhost:5173/veteran/applications/APP-2026-000001',
  });

  assert(
    subEmail.subject.includes('APP-2026-000001') &&
      subEmail.html.includes('Prime Minister Scholarship Scheme') &&
      !subEmail.html.includes('password'),
    'Email Template: Scheme Application Submitted builds compliant HTML without sensitive data'
  );

  const statusEmail = buildApplicationStatusChangedEmail({
    veteranName: 'Subedar Major Vikram Batra',
    applicationId: 'APP-2026-000001',
    schemeName: 'Prime Minister Scholarship Scheme',
    newStatus: 'APPROVED',
    adminRemarks: 'Documents verified by Kendriya Sainik Board.',
    actionUrl: 'http://localhost:5173/veteran/applications/APP-2026-000001',
  });

  assert(
    statusEmail.subject.includes('Application Status Updated') &&
      statusEmail.html.includes('APPROVED') &&
      statusEmail.html.includes('Documents verified by Kendriya Sainik Board.'),
    'Email Template: Scheme Application Status Changed renders status and remarks correctly'
  );

  const jobSubEmail = buildJobApplicationSubmittedEmail({
    veteranName: 'Subedar Major Vikram Batra',
    jobTitle: 'Tactical Security Officer',
    companyName: 'Bharat Electronics Limited',
    applicationId: 'JOBAPP-2026-000001',
    applicationDate: new Date(),
    status: 'APPLIED',
    actionUrl: 'http://localhost:5173/veteran/job-applications/JOBAPP-2026-000001',
  });

  assert(
    jobSubEmail.subject.includes('JOBAPP-2026-000001') &&
      jobSubEmail.html.includes('Bharat Electronics Limited'),
    'Email Template: Job Application Confirmation (Veteran) builds cleanly'
  );

  const recruiterAlert = buildJobApplicationReceivedEmail({
    applicantName: 'Subedar Major Vikram Batra',
    veteranId: 'VET-2026-00001',
    jobTitle: 'Tactical Security Officer',
    applicationId: 'JOBAPP-2026-000001',
    applicationDate: new Date(),
    actionUrl: 'http://localhost:5173/employer/applications/JOBAPP-2026-000001',
  });

  assert(
    recruiterAlert.subject.includes('New Job Application - Tactical Security Officer') &&
      recruiterAlert.html.includes('VET-2026-00001'),
    'Email Template: New Applicant Recruiter Alert builds cleanly'
  );

  const jobStatusEmail = buildJobApplicationStatusChangedEmail({
    veteranName: 'Subedar Major Vikram Batra',
    jobTitle: 'Tactical Security Officer',
    companyName: 'Bharat Electronics Limited',
    applicationId: 'JOBAPP-2026-000001',
    newStatus: 'SHORTLISTED',
    employerRemarks: 'Invited for stage-1 technical defense round.',
    actionUrl: 'http://localhost:5173/veteran/job-applications/JOBAPP-2026-000001',
  });

  assert(
    jobStatusEmail.subject.includes('Tactical Security Officer') &&
      jobStatusEmail.html.includes('SHORTLISTED'),
    'Email Template: Job Application Status Update builds cleanly'
  );

  // 2. Email Service Resilience & Non-blocking test
  const sendRes = await emailService.sendEmail({
    to: 'test.veteran@example.com',
    subject: 'Verification Test',
    html: '<p>Integration test.</p>',
    text: 'Integration test.',
  });

  assert(
    sendRes && typeof sendRes.success === 'boolean',
    'EmailService: sendEmail returns non-blocking execution result'
  );

  // 3. Graceful handling of missing recipient
  const missingToRes = await emailService.sendEmail({
    to: null,
    subject: 'No recipient',
    html: '<p>Empty</p>',
  });

  assert(
    missingToRes.success === false && missingToRes.error.includes('Recipient address missing'),
    'EmailService: Gracefully catches and handles missing recipient without crashing'
  );

  console.log('\n=====================================================');
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
};

runEmailVerification();
