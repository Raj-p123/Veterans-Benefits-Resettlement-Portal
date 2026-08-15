import mongoose from 'mongoose';
import { config } from '../config/environment.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { Application } from '../models/Application.js';
import { JobApplication } from '../models/JobApplication.js';
import { notificationService } from '../services/notification.service.js';
import { socketService } from '../services/socketService.js';
import { emailService } from '../services/emailService.js';

const runNotificationSystemTest = async () => {
  console.log('=====================================================');
  console.log('   REAL-TIME NOTIFICATIONS & APPLICATION STATUS TEST  ');
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

  try {
    await mongoose.connect(config.mongodbUri);
    console.log('[Database] Connected to MongoDB for notification verification.\n');

    // 1. Setup Test Users
    const testUserAId = new mongoose.Types.ObjectId();
    const testUserBId = new mongoose.Types.ObjectId();

    // Clean any prior test notifications
    await Notification.deleteMany({ user: { $in: [testUserAId, testUserBId] } });

    // 2. Test Notification Creation & Persistence in MongoDB
    const notif1 = await notificationService.createNotification({
      userId: testUserAId,
      type: 'APPLICATION_SUBMITTED',
      title: 'Scheme Claim Submitted',
      message: 'Your application for PMSS (APP-2026-9001) has been received.',
      entityType: 'SCHEME_APPLICATION',
      entityId: 'APP-2026-9001',
      actionUrl: '/veteran/applications/APP-2026-9001',
    });

    assert(
      notif1 && notif1._id && notif1.isRead === false,
      'Notification Persistence: Stored in MongoDB with isRead=false'
    );

    const notif2 = await notificationService.createNotification({
      userId: testUserAId,
      type: 'JOB_APPLICATION_STATUS_CHANGED',
      title: 'Candidate Status: Shortlisted',
      message: 'You have been shortlisted for Security Lead position.',
      entityType: 'JOB_APPLICATION',
      entityId: 'JOBAPP-2026-9002',
      actionUrl: '/veteran/job-applications/JOBAPP-2026-9002',
    });

    const notif3 = await notificationService.createNotification({
      userId: testUserAId,
      type: 'DOCUMENT_STATUS_CHANGED',
      title: 'Document Verified: PPO Certificate',
      message: 'Your Pension Payment Order has been verified.',
      entityType: 'DOCUMENT',
      entityId: 'DOC-2026-9003',
      actionUrl: '/veteran/documents',
    });

    // 3. Test Unread Count Aggregation
    const countA = await notificationService.getUnreadCount(testUserAId);
    assert(
      countA === 3,
      `Unread Count: Correctly counts 3 unread notifications for User A (got ${countA})`
    );

    // 4. Test User Isolation & Privacy
    const notifB = await notificationService.createNotification({
      userId: testUserBId,
      type: 'EMPLOYER_VERIFIED',
      title: 'Employer Verified',
      message: 'Your employer account has been approved.',
      entityType: 'EMPLOYER',
      entityId: 'EMP-2026-9004',
      actionUrl: '/employer/profile',
    });

    const countB = await notificationService.getUnreadCount(testUserBId);
    const countAAfterB = await notificationService.getUnreadCount(testUserAId);

    assert(
      countB === 1 && countAAfterB === 3,
      'User Privacy Isolation: User B notifications do not affect User A unread counts'
    );

    const userANotifs = await Notification.find({ user: testUserAId });
    const hasUserBInA = userANotifs.some((n) => n.user.toString() === testUserBId.toString());
    assert(
      !hasUserBInA && userANotifs.length === 3,
      'User Query Isolation: User A query strictly contains only User A records'
    );

    // 5. Test Mark Single Notification As Read
    await Notification.updateOne({ _id: notif1._id, user: testUserAId }, { isRead: true });
    const countAfterRead1 = await notificationService.getUnreadCount(testUserAId);
    assert(
      countAfterRead1 === 2,
      `Mark Single As Read: Unread count decremented to 2 (got ${countAfterRead1})`
    );

    // 6. Test Mark All As Read
    await Notification.updateMany({ user: testUserAId, isRead: false }, { isRead: true });
    const countAfterReadAll = await notificationService.getUnreadCount(testUserAId);
    assert(
      countAfterReadAll === 0,
      `Mark All As Read: Unread count updated to 0 (got ${countAfterReadAll})`
    );

    // 7. Test Delete Notification
    await Notification.deleteOne({ _id: notif3._id, user: testUserAId });
    const remainingA = await Notification.find({ user: testUserAId });
    assert(
      remainingA.length === 2 && !remainingA.some((n) => n._id.toString() === notif3._id.toString()),
      'Delete Notification: Target notification removed cleanly'
    );

    // 8. Test Non-blocking Resend Email Dispatch
    const emailResult = await notificationService.dispatchEmail({
      toEmail: 'test.veteran@example.com',
      templateType: 'SCHEME_STATUS_CHANGED',
      data: {
        veteranName: 'Sepoy Rajesh Kumar',
        applicationId: 'APP-2026-9001',
        schemeName: 'Education Grant',
        newStatus: 'APPROVED',
        adminRemarks: 'Sanctioned by ZSB.',
        actionUrl: 'http://localhost:5173/veteran/applications/APP-2026-9001',
      },
    });

    assert(
      emailResult && typeof emailResult.success === 'boolean',
      'Resend Email Integration: Dispatches email or gracefully falls back without blocking main workflow'
    );

    // 9. Clean up test records
    await Notification.deleteMany({ user: { $in: [testUserAId, testUserBId] } });
    console.log('[Cleanup] Test notifications removed.\n');

  } catch (error) {
    console.error('Test execution exception:', error);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('=====================================================');
    console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  }
};

runNotificationSystemTest();
