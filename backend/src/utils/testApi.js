import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const runTests = async () => {
  console.log('=====================================================');
  console.log('   RUNNING COMPLETE E2E VERIFICATION SUITE           ');
  console.log('   (PHASE 1-7: REAL-TIME, NOTIFICATIONS & SOCKET.IO) ');
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

  const cleanupSockets = [];

  try {
    // 1. Health Check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json();
    assert(
      healthRes.status === 200 && healthJson.success === true,
      'GET /api/health returns 200 and healthy status'
    );

    const randomSuffix = Math.floor(Math.random() * 100000);

    // 2. Register Veteran A
    const vetAEmail = `vet.realtime.${randomSuffix}@defense.gov.in`;
    const vetARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Subedar Major Vikram Batra',
        email: vetAEmail,
        phone: '+919876543220',
        password: 'Password@12345',
        role: 'VETERAN',
      }),
    });
    const vetAJson = await vetARes.json();
    assert(
      vetARes.status === 201 && !!vetAJson.data?.token,
      'POST /api/auth/register registers Veteran A and returns JWT'
    );
    const tokenVetA = vetAJson.data.token;
    const userIdVetA = vetAJson.data.user.id;

    // 3. Register Veteran B (for isolation tests)
    const vetBEmail = `vet.isol.${randomSuffix}@defense.gov.in`;
    const vetBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Havildar Sanjay Kumar',
        email: vetBEmail,
        phone: '+919876543221',
        password: 'Password@12345',
        role: 'VETERAN',
      }),
    });
    const vetBJson = await vetBRes.json();
    assert(
      vetBRes.status === 201 && !!vetBJson.data?.token,
      'POST /api/auth/register registers Veteran B'
    );
    const tokenVetB = vetBJson.data.token;

    // 4. Register Employer A
    const empAEmail = `hr.lnt.${randomSuffix}@defense.lnt.com`;
    const empARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'L&T Defense Recruitment',
        email: empAEmail,
        phone: '+919876543222',
        password: 'Password@12345',
        role: 'EMPLOYER',
      }),
    });
    const empAJson = await empARes.json();
    assert(
      empARes.status === 201 && !!empAJson.data?.token,
      'POST /api/auth/register registers Employer A'
    );
    const tokenEmpA = empAJson.data.token;

    // 5. Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'AdminPassword123!',
      }),
    });
    const adminJson = await adminLoginRes.json();
    assert(
      adminLoginRes.status === 200 && adminJson.data?.user?.role === 'ADMIN',
      'POST /api/auth/login authenticates Admin officer'
    );
    const tokenAdmin = adminJson.data.token;

    // 6. Veteran Profile Creation
    await fetch(`${BASE_URL}/veterans/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVetA}`,
      },
      body: JSON.stringify({
        personalInformation: {
          fullName: 'Subedar Major Vikram Batra',
          phone: '+919876543220',
          state: 'Maharashtra',
          city: 'Pune',
        },
        serviceInformation: {
          serviceBranch: 'Army',
          rank: 'Subedar Major',
          yearsOfService: 22,
          serviceStatus: 'Retired',
        },
        skills: ['Special Forces Operations', 'Tactical Security', 'Crisis Management'],
      }),
    });

    // 7. Employer Profile Creation
    await fetch(`${BASE_URL}/employer/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenEmpA}`,
      },
      body: JSON.stringify({
        companyName: `L&T Defense Strategic Systems ${randomSuffix}`,
        companyDescription: 'Heavy artillery and armored naval defense assemblies.',
        industry: 'Defense & Aerospace',
        companySize: '1000+ Employees',
        email: empAEmail,
        phone: '+912267525656',
        city: 'Mumbai',
        state: 'Maharashtra',
        contactPerson: {
          name: 'Col. Rajesh Verma (Retd.)',
          designation: 'Head of Strategic Resettlement',
          phone: '+919820011223',
          email: empAEmail,
        },
      }),
    });

    // 8. Socket.IO Authentication: Connect Veteran A Socket Client
    const vetASocket = await new Promise((resolve, reject) => {
      const socket = io(SOCKET_URL, {
        auth: { token: tokenVetA },
        transports: ['websocket'],
        reconnection: false,
      });

      const timer = setTimeout(() => {
        reject(new Error('Socket.IO connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timer);
        resolve(socket);
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    cleanupSockets.push(vetASocket);
    assert(
      vetASocket.connected === true,
      'Socket.IO connects with valid Veteran A JWT handshake'
    );

    // 9. Socket.IO Authentication: Connect Employer A Socket Client
    const empASocket = await new Promise((resolve, reject) => {
      const socket = io(SOCKET_URL, {
        auth: { token: tokenEmpA },
        transports: ['websocket'],
        reconnection: false,
      });

      const timer = setTimeout(() => {
        reject(new Error('Socket.IO connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timer);
        resolve(socket);
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    cleanupSockets.push(empASocket);
    assert(
      empASocket.connected === true,
      'Socket.IO connects with valid Employer A JWT handshake'
    );

    // 10. Socket.IO Security: Reject Anonymous / Invalid Token Connection
    const unauthRejected = await new Promise((resolve) => {
      const socket = io(SOCKET_URL, {
        auth: { token: 'invalid_malformed_token' },
        transports: ['websocket'],
        reconnection: false,
      });

      socket.on('connect', () => {
        socket.disconnect();
        resolve(false);
      });

      socket.on('connect_error', () => {
        socket.disconnect();
        resolve(true);
      });
    });

    assert(
      unauthRejected === true,
      'Socket.IO rejects unauthenticated or invalid JWT connection'
    );

    // 11. Employer A Creates a New Job Posting
    const createJobRes = await fetch(`${BASE_URL}/employer/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenEmpA}`,
      },
      body: JSON.stringify({
        title: `Armored Vehicle Project Director ${randomSuffix}`,
        description: 'Direct assembly of tactical armored combat vehicles.',
        industry: 'Defense & Aerospace',
        location: 'Powai Complex, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        salaryMin: 2200000,
        salaryMax: 3500000,
        status: 'ACTIVE',
      }),
    });
    const createJobJson = await createJobRes.json();
    const jobId = createJobJson.data.job.jobId;
    assert(
      createJobRes.status === 201 && !!jobId,
      `POST /api/employer/jobs creates active job opening (${jobId})`
    );

    // Join room for this job
    empASocket.emit('join:room', `job:${jobId}`);

    // 12. Real-Time Application Submission & Live Socket Event
    const receivedByEmployerPromise = new Promise((resolve) => {
      empASocket.on('job:applicationCreated', (data) => {
        resolve(data);
      });
    });

    const receivedByVeteranPromise = new Promise((resolve) => {
      vetASocket.on('notification:new', (data) => {
        resolve(data);
      });
    });

    const applyRes = await fetch(`${BASE_URL}/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenVetA}`,
      },
      body: JSON.stringify({
        coverLetter: '22 years of combat vehicle and tactical leadership.',
      }),
    });
    const applyJson = await applyRes.json();
    const jobAppId = applyJson.data?.application?.applicationId;
    assert(
      applyRes.status === 201 && !!jobAppId,
      `POST /api/jobs/:jobId/apply submits application (${jobAppId})`
    );

    const empReceivedData = await Promise.race([
      receivedByEmployerPromise,
      new Promise((_, r) => setTimeout(() => r(new Error('Timeout waiting for employer socket event')), 5000)),
    ]);
    assert(
      empReceivedData && empReceivedData.jobId === jobId,
      'Socket.IO: Employer received real-time "job:applicationCreated" event instantly'
    );

    const vetNotificationData = await Promise.race([
      receivedByVeteranPromise,
      new Promise((_, r) => setTimeout(() => r(new Error('Timeout waiting for veteran socket notification')), 5000)),
    ]);
    assert(
      vetNotificationData && vetNotificationData.type === 'APPLICATION_SUBMITTED',
      'Socket.IO: Veteran received real-time "notification:new" confirmation event'
    );

    // 13. Notification REST APIs: Get Notifications for Veteran A
    const notifsRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenVetA}` },
    });
    const notifsJson = await notifsRes.json();
    assert(
      notifsRes.status === 200 &&
        notifsJson.data?.notifications?.length >= 1 &&
        typeof notifsJson.data?.unreadCount === 'number',
      'GET /api/notifications returns user-isolated notification records with unread count'
    );
    const notifId = notifsJson.data.notifications[0]._id;

    // 14. Notification REST APIs: Unread Count API
    const countRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tokenVetA}` },
    });
    const countJson = await countRes.json();
    assert(
      countRes.status === 200 && countJson.data?.unreadCount >= 1,
      'GET /api/notifications/unread-count returns accurate real-time count'
    );

    // 15. Notification REST APIs: Mark Single Notification as Read
    const markReadRes = await fetch(`${BASE_URL}/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenVetA}` },
    });
    const markReadJson = await markReadRes.json();
    assert(
      markReadRes.status === 200 && markReadJson.data?.notification?.isRead === true,
      'PUT /api/notifications/:id/read marks single notification as read'
    );

    // 16. Real-Time Status Change: Employer updates applicant status to SHORTLISTED
    const vetStatusEventPromise = new Promise((resolve) => {
      vetASocket.on('job:applicationStatusChanged', (data) => {
        resolve(data);
      });
    });

    const updateStatusRes = await fetch(
      `${BASE_URL}/employer/applications/${jobAppId}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenEmpA}`,
        },
        body: JSON.stringify({
          status: 'SHORTLISTED',
          employerRemarks: 'Shortlisted for executive technical interview round.',
        }),
      }
    );
    const updateStatusJson = await updateStatusRes.json();
    assert(
      updateStatusRes.status === 200 &&
        updateStatusJson.data?.application?.status === 'SHORTLISTED',
      'PUT /api/employer/applications/:id/status updates hiring stage to SHORTLISTED'
    );

    const vetReceivedStatus = await Promise.race([
      vetStatusEventPromise,
      new Promise((_, r) => setTimeout(() => r(new Error('Timeout waiting for status socket event')), 5000)),
    ]);
    assert(
      vetReceivedStatus && vetReceivedStatus.status === 'SHORTLISTED',
      'Socket.IO: Veteran received real-time "job:applicationStatusChanged" event without browser refresh'
    );

    // 17. Notification REST APIs: Mark All as Read
    const markAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenVetA}` },
    });
    const markAllJson = await markAllRes.json();
    assert(
      markAllRes.status === 200 && markAllJson.data?.unreadCount === 0,
      'PUT /api/notifications/read-all resets unread count to 0'
    );

    // 18. Cross-User Security: Veteran B cannot delete or view Veteran A's notification
    const crossNotifRes = await fetch(`${BASE_URL}/notifications/${notifId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenVetB}` },
    });
    assert(
      crossNotifRes.status === 404 || crossNotifRes.status === 403,
      'DELETE /api/notifications/:id isolates notifications and blocks unauthorized users (404/403)'
    );

    // 19. Delete Notification
    const deleteNotifRes = await fetch(`${BASE_URL}/notifications/${notifId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenVetA}` },
    });
    assert(
      deleteNotifRes.status === 200,
      'DELETE /api/notifications/:id deletes notification successfully'
    );

    // 20. Public Job Search & Filter API
    const publicJobsRes = await fetch(
      `${BASE_URL}/jobs?search=Armored&industry=Defense%20%26%20Aerospace`
    );
    const publicJobsJson = await publicJobsRes.json();
    assert(
      publicJobsRes.status === 200 && publicJobsJson.data?.jobs?.length >= 1,
      'GET /api/jobs returns active defense opportunities'
    );

    // 21. Resend Email Test Endpoint: POST /api/test/email
    const testEmailRes = await fetch(`${BASE_URL}/test/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        to: 'officer.verification@defense.gov.in',
      }),
    });
    const testEmailJson = await testEmailRes.json();
    assert(
      testEmailRes.status === 200 && testEmailJson.success === true,
      'POST /api/test/email dispatches transactional test email non-blockingly'
    );
  } catch (error) {
    console.error('[UNEXPECTED ERROR]:', error);
    failed++;
  } finally {
    cleanupSockets.forEach((s) => s && s.disconnect());
  }

  console.log('\n=====================================================');
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
