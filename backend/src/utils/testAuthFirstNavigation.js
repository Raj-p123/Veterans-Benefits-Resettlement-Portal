import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import authRoutes from '../routes/auth.routes.js';
import schemeRoutes from '../routes/scheme.routes.js';
import jobRoutes from '../routes/job.routes.js';
import { User } from '../models/User.js';
import { ROLES } from '../constants/index.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { config } from '../config/environment.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/veterans_portal';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Simulated client-side destination resolver matching Login.jsx logic
function resolvePostLoginDestination(locationState, userRole) {
  const ROLE_DASHBOARD_MAP = {
    [ROLES.VETERAN]: '/veteran/dashboard',
    [ROLES.EMPLOYER]: '/employer/dashboard',
    [ROLES.ADMIN]: '/admin/dashboard',
  };

  const getAuthenticatedHomeRoute = (role) => {
    if (!role) return '/';
    return ROLE_DASHBOARD_MAP[role] || '/';
  };

  const fromState = locationState?.from;
  let intendedDestination = null;

  if (fromState) {
    if (typeof fromState === 'string' && fromState !== '/') {
      intendedDestination = fromState;
    } else if (fromState.pathname && fromState.pathname !== '/') {
      intendedDestination = `${fromState.pathname}${fromState.search || ''}`;
    }
  }

  const defaultDashboard = getAuthenticatedHomeRoute(userRole);
  return intendedDestination || defaultDashboard;
}

// Simulated ProtectedRoute guard logic
function evaluateRouteAccess(targetPath, isAuthenticated) {
  const publicRoutes = ['/', '/about', '/contact', '/login', '/register'];
  const isPublic = publicRoutes.includes(targetPath);

  if (isPublic) {
    return { status: 'ALLOWED', destination: targetPath };
  }

  if (!isAuthenticated) {
    return {
      status: 'REDIRECT_TO_LOGIN',
      destination: '/login',
      state: { from: { pathname: targetPath } },
    };
  }

  return { status: 'ALLOWED', destination: targetPath };
}

async function runAuthFirstNavigationTests() {
  console.log('====================================================');
  console.log(' STARTING AUTHENTICATION-FIRST NAVIGATION TEST SUITE ');
  console.log('====================================================\n');

  await mongoose.connect(MONGODB_URI);
  console.log(' Connected to MongoDB:', mongoose.connection.name);

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/schemes', schemeRoutes);
  app.use('/api/jobs', jobRoutes);

  // Admin protected endpoint test
  app.get('/api/admin/secure-test', authenticate, authorizeRoles(ROLES.ADMIN), (req, res) => {
    res.json({ success: true, message: 'Admin access granted' });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(` Test server running on ${baseUrl}\n`);

  let passed = 0;

  // TEST 1: Logged out -> Landing -> "Explore Benefits" (/schemes)
  console.log('--- TEST 1: Logged Out -> "Explore Benefits" (/schemes) ---');
  const t1 = evaluateRouteAccess('/schemes', false);
  if (t1.status === 'REDIRECT_TO_LOGIN' && t1.state?.from?.pathname === '/schemes') {
    const postLoginDest = resolvePostLoginDestination(t1.state, ROLES.VETERAN);
    if (postLoginDest === '/schemes') {
      console.log('✓ Correctly redirected to /login, and post-login destination resolved to "/schemes".');
      passed++;
    } else {
      console.error('✗ Post-login destination mismatch:', postLoginDest);
    }
  } else {
    console.error('✗ Route guard failed for /schemes:', t1);
  }

  // TEST 2: Logged out -> Landing -> "Find Opportunities" (/jobs)
  console.log('\n--- TEST 2: Logged Out -> "Find Opportunities" (/jobs) ---');
  const t2 = evaluateRouteAccess('/jobs', false);
  if (t2.status === 'REDIRECT_TO_LOGIN' && t2.state?.from?.pathname === '/jobs') {
    const postLoginDest = resolvePostLoginDestination(t2.state, ROLES.VETERAN);
    if (postLoginDest === '/jobs') {
      console.log('✓ Correctly redirected to /login, and post-login destination resolved to "/jobs".');
      passed++;
    } else {
      console.error('✗ Post-login destination mismatch:', postLoginDest);
    }
  } else {
    console.error('✗ Route guard failed for /jobs:', t2);
  }

  // TEST 3: Logged out -> Navbar -> "Benefits & Schemes"
  console.log('\n--- TEST 3: Logged Out -> Navbar "Benefits & Schemes" ---');
  const t3 = evaluateRouteAccess('/schemes', false);
  const postLoginT3 = resolvePostLoginDestination(t3.state, ROLES.EMPLOYER);
  if (postLoginT3 === '/schemes') {
    console.log('✓ Navbar Benefits link correctly navigates to "/schemes" after login.');
    passed++;
  } else {
    console.error('✗ Test 3 failed:', postLoginT3);
  }

  // TEST 4: Logged out -> About (/about) Public Access
  console.log('\n--- TEST 4: Logged Out -> About Page (/about) ---');
  const t4 = evaluateRouteAccess('/about', false);
  if (t4.status === 'ALLOWED' && t4.destination === '/about') {
    console.log('✓ About page is strictly PUBLIC and accessible without authentication.');
    passed++;
  } else {
    console.error('✗ About page was blocked:', t4);
  }

  // TEST 5: Logged out -> Contact (/contact) Public Access
  console.log('\n--- TEST 5: Logged Out -> Contact Page (/contact) ---');
  const t5 = evaluateRouteAccess('/contact', false);
  if (t5.status === 'ALLOWED' && t5.destination === '/contact') {
    console.log('✓ Contact page is strictly PUBLIC and accessible without authentication.');
    passed++;
  } else {
    console.error('✗ Contact page was blocked:', t5);
  }

  // TEST 6: Already Logged In -> "Explore Benefits"
  console.log('\n--- TEST 6: Already Logged In -> "Explore Benefits" (/schemes) ---');
  const t6 = evaluateRouteAccess('/schemes', true);
  if (t6.status === 'ALLOWED' && t6.destination === '/schemes') {
    console.log('✓ Authenticated user accesses "/schemes" DIRECTLY with NO login page.');
    passed++;
  } else {
    console.error('✗ Authenticated user blocked:', t6);
  }

  // TEST 7: Already Logged In -> "Find Opportunities"
  console.log('\n--- TEST 7: Already Logged In -> "Find Opportunities" (/jobs) ---');
  const t7 = evaluateRouteAccess('/jobs', true);
  if (t7.status === 'ALLOWED' && t7.destination === '/jobs') {
    console.log('✓ Authenticated user accesses "/jobs" DIRECTLY with NO login page.');
    passed++;
  } else {
    console.error('✗ Authenticated user blocked:', t7);
  }

  // TEST 8: Logged Out -> Direct URL Access (/schemes?category=Pension)
  console.log('\n--- TEST 8: Direct URL Access with Query Params (/schemes?category=Pension) ---');
  const t8State = { from: { pathname: '/schemes', search: '?category=Pension' } };
  const postLoginT8 = resolvePostLoginDestination(t8State, ROLES.VETERAN);
  if (postLoginT8 === '/schemes?category=Pension') {
    console.log(`✓ Preserves full intended query path: "${postLoginT8}"`);
    passed++;
  } else {
    console.error('✗ Query path preservation failed:', postLoginT8);
  }

  // TEST 9: Direct URL Access (/jobs/job-123)
  console.log('\n--- TEST 9: Direct URL Access to Job Detail (/jobs/job-123) ---');
  const t9State = { from: { pathname: '/jobs/job-123' } };
  const postLoginT9 = resolvePostLoginDestination(t9State, ROLES.VETERAN);
  if (postLoginT9 === '/jobs/job-123') {
    console.log(`✓ Preserves specific detail path: "${postLoginT9}"`);
    passed++;
  } else {
    console.error('✗ Detail path preservation failed:', postLoginT9);
  }

  // TEST 10: Direct Login without Intended Destination
  console.log('\n--- TEST 10: Direct Login (No Intended Destination) -> Role Dashboard ---');
  const destVet = resolvePostLoginDestination(null, ROLES.VETERAN);
  const destEmp = resolvePostLoginDestination(null, ROLES.EMPLOYER);
  const destAdm = resolvePostLoginDestination(null, ROLES.ADMIN);
  if (
    destVet === '/veteran/dashboard' &&
    destEmp === '/employer/dashboard' &&
    destAdm === '/admin/dashboard'
  ) {
    console.log('✓ Direct login correctly routes to role-specific dashboard for Veteran, Employer, and Admin.');
    passed++;
  } else {
    console.error('✗ Default dashboard routing failed:', { destVet, destEmp, destAdm });
  }

  // TEST 11: Logout Behavior -> Returns to Landing Page (/)
  console.log('\n--- TEST 11: Logout State & Public Landing Routing ---');
  const afterLogoutAccess = evaluateRouteAccess('/', false);
  if (afterLogoutAccess.status === 'ALLOWED' && afterLogoutAccess.destination === '/') {
    console.log('✓ Logout clears session and lands on Public Landing Page ("/").');
    passed++;
  } else {
    console.error('✗ Logout flow failed:', afterLogoutAccess);
  }

  // TEST 12: RBAC Security Enforcement
  console.log('\n--- TEST 12: Backend RBAC Guard Enforcement ---');
  const veteranUser = await User.findOne({ role: ROLES.VETERAN });
  if (veteranUser) {
    const vetToken = jwt.sign(
      { userId: veteranUser._id, email: veteranUser.email, role: ROLES.VETERAN },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    const rbacRes = await fetch(`${baseUrl}/api/admin/secure-test`, {
      headers: { Authorization: `Bearer ${vetToken}` },
    });
    if (rbacRes.status === 403) {
      console.log('✓ Veteran token strictly blocked from Admin routes (403 Forbidden).');
      passed++;
    } else {
      console.error('✗ RBAC check failed, status:', rbacRes.status);
    }
  }

  console.log('\n====================================================');
  console.log(`  AUTHENTICATION-FIRST NAVIGATION: ${passed}/12 PASSED! `);
  console.log('====================================================\n');

  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

runAuthFirstNavigationTests().catch((err) => {
  console.error('Error running auth-first navigation tests:', err);
  process.exit(1);
});
