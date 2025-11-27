#!/usr/bin/env node

/**
 * Comprehensive API Test Script
 * Tests all backend API endpoints
 */

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

let authCookies = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      path: url.pathname + url.search,
      hostname: url.hostname,
      port: url.port || 3000,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (authCookies) {
      options.headers['Cookie'] = authCookies;
    }

    const req = http.request(options, (res) => {
      let body = '';
      const cookies = res.headers['set-cookie'];
      
      if (cookies) {
        authCookies = cookies.join('; ');
      }

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        let parsedBody;
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          parsedBody = body;
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsedBody,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test function (handles single or array of expected status codes)
async function test(name, method, path, expectedStatus = 200, data = null, description = '', extraHeaders = {}) {
  testResults.total++;
  const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  
  try {
    const response = await makeRequest(method, path, data, extraHeaders);
    const passed = expectedStatuses.includes(response.status);
    
    if (passed) {
      testResults.passed++;
      console.log(`${colors.green}✓${colors.reset} ${name} - ${colors.green}PASSED${colors.reset} (${response.status})`);
      if (description) console.log(`  ${colors.cyan}→${colors.reset} ${description}`);
    } else {
      testResults.failed++;
      console.log(`${colors.red}✗${colors.reset} ${name} - ${colors.red}FAILED${colors.reset}`);
      console.log(`  Expected: ${expectedStatuses.join(' or ')}, Got: ${response.status}`);
      if (response.body) {
        const bodyStr = typeof response.body === 'string' 
          ? response.body 
          : JSON.stringify(response.body, null, 2);
        console.log(`  Response:`, bodyStr.substring(0, 500));
      }
    }
    
    return { passed, response };
  } catch (error) {
    testResults.failed++;
    console.log(`${colors.red}✗${colors.reset} ${name} - ${colors.red}ERROR${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return { passed: false, error };
  }
}

// Main test function
async function runTests() {
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  API Endpoint Test Suite${colors.reset}`);
  console.log(`${colors.blue}  Testing: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // 1. Health Check
  console.log(`${colors.yellow}📋 Health Check${colors.reset}`);
  await test('Health Check', 'GET', '/health', 200, null, 'Server health status');
  console.log('');

  // 2. Auth Endpoints (Better Auth)
  console.log(`${colors.yellow}🔐 Authentication Endpoints${colors.reset}`);
  
  // Sign Up (Better Auth v1.4.1 uses /sign-up/email endpoint)
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';
  
  const signUpResult = await test(
    'POST /api/auth/sign-up/email',
    'POST',
    '/api/auth/sign-up/email',
    200,
    {
      email: testEmail,
      password: testPassword,
      name: testName,
    },
    'User registration'
  );
  console.log('');

  // Sign In (Better Auth v1.4.1 uses /sign-in/email endpoint)
  // Add small delay to ensure user is fully created
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const signInResult = await test(
    'POST /api/auth/sign-in/email',
    'POST',
    '/api/auth/sign-in/email',
    200,
    {
      email: testEmail,
      password: testPassword,
    },
    'User login',
    { 'Origin': BASE_URL } // Better Auth requires Origin header
  );
  console.log('');

  // Get Session (Custom Route)
  await test(
    'GET /api/auth/session',
    'GET',
    '/api/auth/session',
    200,
    null,
    'Get current session'
  );
  console.log('');

  // Get Me (Custom Route)
  await test(
    'GET /api/auth/me',
    'GET',
    '/api/auth/me',
    200,
    null,
    'Get current user'
  );
  console.log('');

  // 3. User Profile Endpoints
  console.log(`${colors.yellow}👤 User Profile Endpoints${colors.reset}`);
  
  // Get Profile (should fail if no profile exists, or succeed if it does)
  const getProfileResult = await test(
    'GET /api/users/profile',
    'GET',
    '/api/users/profile',
    [200, 404], // Accept either success or not found
    null,
    'Get user profile'
  );
  console.log('');

  // Create/Update Profile
  await test(
    'POST /api/users/profile',
    'POST',
    '/api/users/profile',
    200,
    {
      role: 'member',
      phone: '+1234567890',
    },
    'Create/update user profile'
  );
  console.log('');

  // Get Profile Again (should succeed now)
  await test(
    'GET /api/users/profile (after create)',
    'GET',
    '/api/users/profile',
    200,
    null,
    'Get user profile after creation'
  );
  console.log('');

  // 4. Placeholder Endpoints
  console.log(`${colors.yellow}📦 Placeholder Endpoints${colors.reset}`);
  
  await test(
    'GET /api/gyms',
    'GET',
    '/api/gyms',
    200,
    null,
    'Gym routes placeholder'
  );
  
  await test(
    'GET /api/members',
    'GET',
    '/api/members',
    200,
    null,
    'Member routes placeholder'
  );
  
  await test(
    'GET /api/workouts',
    'GET',
    '/api/workouts',
    200,
    null,
    'Workout routes placeholder'
  );
  
  await test(
    'GET /api/payments',
    'GET',
    '/api/payments',
    200,
    null,
    'Payment routes placeholder'
  );
  console.log('');

  // 5. Sign Out (Better Auth requires Origin header)
  console.log(`${colors.yellow}🚪 Sign Out${colors.reset}`);
  await test(
    'POST /api/auth/sign-out',
    'POST',
    '/api/auth/sign-out',
    200,
    null,
    'User logout',
    { 'Origin': BASE_URL } // Better Auth requires Origin header
  );
  console.log('');

  // 6. Test Protected Routes Without Auth
  console.log(`${colors.yellow}🔒 Protected Routes (Without Auth)${colors.reset}`);
  authCookies = ''; // Clear cookies
  
  await test(
    'GET /api/auth/session (no auth)',
    'GET',
    '/api/auth/session',
    401,
    null,
    'Should fail without authentication'
  );
  
  await test(
    'GET /api/users/profile (no auth)',
    'GET',
    '/api/users/profile',
    401,
    null,
    'Should fail without authentication'
  );
  console.log('');

  // Summary
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  Test Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  if (testResults.failed === 0) {
    console.log(`${colors.green}✅ All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some tests failed. Please check the output above.${colors.reset}\n`);
    process.exit(1);
  }
}


// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

