#!/usr/bin/env node

/**
 * Simulate login for all user types with Playwright
 * Tests authentication, permissions, and CRUD operations
 */

const { chromium } = require('@playwright/test');

// Test users configuration
const testUsers = [
  {
    role: 'Free User',
    email: 'free@rapidtriage.me',
    password: 'FreeUser123!',
    subscription: 'free',
    expectedPermissions: {
      projects: true,
      workspaces: true,
      analytics: false,
      billing: false
    }
  },
  {
    role: 'Starter User',
    email: 'starter@rapidtriage.me',
    password: 'StarterUser123!',
    subscription: 'starter',
    expectedPermissions: {
      projects: true,
      workspaces: true,
      analytics: false,
      billing: false
    }
  },
  {
    role: 'Pro User',
    email: 'pro@rapidtriage.me',
    password: 'ProUser123!',
    subscription: 'pro',
    expectedPermissions: {
      projects: true,
      workspaces: true,
      analytics: true,
      billing: false
    }
  },
  {
    role: 'Enterprise User',
    email: 'enterprise@rapidtriage.me',
    password: 'EnterpriseUser123!',
    subscription: 'enterprise',
    expectedPermissions: {
      projects: true,
      workspaces: true,
      analytics: true,
      billing: false
    }
  },
  {
    role: 'Organization Owner',
    email: 'owner@rapidtriage.me',
    password: 'OrgOwner123!',
    subscription: 'enterprise',
    expectedPermissions: {
      projects: true,
      workspaces: true,
      analytics: true,
      billing: true,
      organization: true,
      impersonate: true
    }
  },
  {
    role: 'Organization Admin',
    email: 'admin@rapidtriage.me',
    password: 'OrgAdmin123!',
    subscription: 'enterprise',
    expectedPermissions: {
      projects: true,
      workspaces: true,
      analytics: true,
      billing: false,
      organization: true
    }
  },
  {
    role: 'Developer',
    email: 'developer@rapidtriage.me',
    password: 'OrgDev123!',
    subscription: 'enterprise',
    expectedPermissions: {
      projects: true,
      workspaces: true,
      analytics: false,
      debug: true
    }
  },
  {
    role: 'Analyst',
    email: 'analyst@rapidtriage.me',
    password: 'OrgAnalyst123!',
    subscription: 'enterprise',
    expectedPermissions: {
      projects: 'read',
      workspaces: 'read',
      analytics: true,
      reports: true
    }
  },
  {
    role: 'Viewer',
    email: 'viewer@rapidtriage.me',
    password: 'OrgViewer123!',
    subscription: 'enterprise',
    expectedPermissions: {
      projects: 'read',
      workspaces: 'read',
      analytics: 'read',
      write: false
    }
  },
  {
    role: 'Billing Manager',
    email: 'billing@rapidtriage.me',
    password: 'OrgBilling123!',
    subscription: 'enterprise',
    expectedPermissions: {
      projects: false,
      workspaces: false,
      billing: true,
      invoices: true
    }
  }
];

async function simulateUserLogin(user) {
  const browser = await chromium.launch({
    headless: true,
    timeout: 30000
  });

  const results = {
    role: user.role,
    email: user.email,
    subscription: user.subscription,
    tests: {}
  };

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`\n🧪 Testing ${user.role}`);
    console.log('━'.repeat(50));

    // Step 1: Test API Login
    console.log('1️⃣ Testing API Login...');
    const loginResponse = await page.request.post('https://rapidtriage.me/auth/login', {
      data: { email: user.email, password: user.password }
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      results.tests.login = 'PASS';
      console.log('   ✅ Login successful');

      const token = loginData.token;
      results.token = token;
      results.userId = loginData.user?.id;
      results.userRole = loginData.user?.role;
      results.plan = loginData.user?.subscription?.plan;

      console.log(`   📝 User ID: ${results.userId}`);
      console.log(`   🎭 Role: ${results.userRole}`);
      console.log(`   💎 Plan: ${results.plan}`);

      // Step 2: Test API Access
      console.log('\n2️⃣ Testing API Access...');

      // Test Projects API
      const projectsResp = await page.request.get('https://rapidtriage.me/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      results.tests.projects = projectsResp.ok() ? 'PASS' : 'FAIL';
      console.log(`   📁 Projects: ${projectsResp.status()} ${projectsResp.ok() ? '✅' : '❌'}`);

      // Test Workspaces API
      const workspacesResp = await page.request.get('https://rapidtriage.me/api/workspaces', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      results.tests.workspaces = workspacesResp.ok() ? 'PASS' : 'FAIL';
      console.log(`   🏢 Workspaces: ${workspacesResp.status()} ${workspacesResp.ok() ? '✅' : '❌'}`);

      // Test Analytics API
      const analyticsResp = await page.request.get('https://rapidtriage.me/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      results.tests.analytics = analyticsResp.ok() ? 'PASS' : 'FAIL';
      console.log(`   📊 Analytics: ${analyticsResp.status()} ${analyticsResp.ok() ? '✅' : '❌'}`);

      // Test Organization API
      const orgResp = await page.request.get('https://rapidtriage.me/api/organization', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      results.tests.organization = orgResp.ok() ? 'PASS' : 'FAIL';
      console.log(`   🏢 Organization: ${orgResp.status()} ${orgResp.ok() ? '✅' : '❌'}`);

      // Step 3: Test CRUD Operations
      console.log('\n3️⃣ Testing CRUD Operations...');

      // Test CREATE
      const createResp = await page.request.post('https://rapidtriage.me/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          name: `Test Project - ${user.role}`,
          description: 'Automated test'
        }
      });
      results.tests.create = createResp.status() === 201 ? 'PASS' : 'FAIL';
      console.log(`   ➕ CREATE: ${createResp.status()} ${createResp.status() === 201 ? '✅' : '❌'}`);

      // Test UPDATE
      const updateResp = await page.request.patch('https://rapidtriage.me/api/projects/proj_1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { name: 'Updated Name' }
      });
      results.tests.update = updateResp.ok() ? 'PASS' : 'FAIL';
      console.log(`   ✏️ UPDATE: ${updateResp.status()} ${updateResp.ok() ? '✅' : '❌'}`);

      // Test DELETE
      const deleteResp = await page.request.delete('https://rapidtriage.me/api/projects/proj_test', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      results.tests.delete = deleteResp.ok() ? 'PASS' : 'FAIL';
      console.log(`   🗑️ DELETE: ${deleteResp.status()} ${deleteResp.ok() ? '✅' : '❌'}`);

      // Step 4: Test UI Login
      console.log('\n4️⃣ Testing UI Login...');
      await page.goto('https://rapidtriage.me/login');
      await page.fill('input[type="email"], input[name="email"], #email', user.email);
      await page.fill('input[type="password"], input[name="password"], #password', user.password);

      // Take screenshot
      await page.screenshot({
        path: `test-results/login-${user.role.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true
      });

      await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/profile')) {
        results.tests.uiLogin = 'PASS';
        console.log('   ✅ UI login successful - redirected to dashboard/profile');
      } else {
        results.tests.uiLogin = 'PARTIAL';
        console.log('   ⚠️ UI login completed but stayed on login page');
      }

    } else {
      results.tests.login = 'FAIL';
      console.log('   ❌ Login failed');
    }

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    results.tests.error = error.message;
  } finally {
    await browser.close();
  }

  return results;
}

async function runAllTests() {
  console.log('🚀 RapidTriageME Complete User Simulation');
  console.log('═'.repeat(60));

  const allResults = [];

  // Test each user sequentially
  for (const user of testUsers) {
    const result = await simulateUserLogin(user);
    allResults.push(result);
  }

  // Generate summary report
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('═'.repeat(60));

  // Print detailed results table
  console.log('\nDetailed Results:');
  console.log('─'.repeat(100));
  console.log('User Role            | Login | Projects | Workspaces | Analytics | Org    | CRUD   | UI');
  console.log('─'.repeat(100));

  for (const result of allResults) {
    const login = result.tests.login === 'PASS' ? '✅' : '❌';
    const projects = result.tests.projects === 'PASS' ? '✅' : '❌';
    const workspaces = result.tests.workspaces === 'PASS' ? '✅' : '❌';
    const analytics = result.tests.analytics === 'PASS' ? '✅' : '❌';
    const org = result.tests.organization === 'PASS' ? '✅' : '❌';
    const crud = result.tests.create === 'PASS' ? '✅' : '❌';
    const ui = result.tests.uiLogin === 'PASS' ? '✅' :
               result.tests.uiLogin === 'PARTIAL' ? '⚠️' : '❌';

    console.log(
      `${result.role.padEnd(20)} | ${login}    | ${projects}       | ${workspaces}         | ${analytics}        | ${org}     | ${crud}     | ${ui}`
    );
  }

  console.log('─'.repeat(100));

  // Calculate statistics
  const totalTests = allResults.length;
  const passedLogins = allResults.filter(r => r.tests.login === 'PASS').length;
  const passedProjects = allResults.filter(r => r.tests.projects === 'PASS').length;
  const passedCRUD = allResults.filter(r => r.tests.create === 'PASS').length;

  console.log('\nStatistics:');
  console.log(`✅ Login Success Rate: ${passedLogins}/${totalTests} (${(passedLogins/totalTests*100).toFixed(0)}%)`);
  console.log(`✅ Projects API Access: ${passedProjects}/${totalTests} (${(passedProjects/totalTests*100).toFixed(0)}%)`);
  console.log(`✅ CRUD Operations: ${passedCRUD}/${totalTests} (${(passedCRUD/totalTests*100).toFixed(0)}%)`);

  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>RapidTriageME User Simulation Report</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    h1 { color: #667eea; text-align: center; margin-bottom: 30px; }
    .stats { display: flex; justify-content: space-around; margin: 30px 0; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; flex: 1; margin: 0 10px; }
    .stat-value { font-size: 3em; font-weight: bold; }
    .stat-label { margin-top: 10px; opacity: 0.9; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #667eea; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    tr:hover { background: #f5f5f5; }
    .pass { color: #10b981; font-weight: bold; }
    .fail { color: #ef4444; font-weight: bold; }
    .partial { color: #f59e0b; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 RapidTriageME Complete User Simulation Report</h1>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${totalTests}</div>
        <div class="stat-label">Total Users Tested</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${passedLogins}</div>
        <div class="stat-label">Successful Logins</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${(passedLogins/totalTests*100).toFixed(0)}%</div>
        <div class="stat-label">Success Rate</div>
      </div>
    </div>

    <h2>Detailed Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>User Role</th>
          <th>Email</th>
          <th>Subscription</th>
          <th>Login</th>
          <th>API Access</th>
          <th>CRUD Ops</th>
          <th>UI Login</th>
        </tr>
      </thead>
      <tbody>
        ${allResults.map(r => `
        <tr>
          <td><strong>${r.role}</strong></td>
          <td>${r.email}</td>
          <td>${r.subscription}</td>
          <td class="${r.tests.login === 'PASS' ? 'pass' : 'fail'}">${r.tests.login === 'PASS' ? '✅ Pass' : '❌ Fail'}</td>
          <td class="${r.tests.projects === 'PASS' ? 'pass' : 'fail'}">${r.tests.projects === 'PASS' ? '✅ Pass' : '❌ Fail'}</td>
          <td class="${r.tests.create === 'PASS' ? 'pass' : 'fail'}">${r.tests.create === 'PASS' ? '✅ Pass' : '❌ Fail'}</td>
          <td class="${r.tests.uiLogin === 'PASS' ? 'pass' : r.tests.uiLogin === 'PARTIAL' ? 'partial' : 'fail'}">
            ${r.tests.uiLogin === 'PASS' ? '✅ Pass' : r.tests.uiLogin === 'PARTIAL' ? '⚠️ Partial' : '❌ Fail'}
          </td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Test Environment: Production (https://rapidtriage.me)</p>
    </div>
  </div>
</body>
</html>
  `;

  // Save HTML report
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'test-results', 'simulation-report.html');

  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }

  fs.writeFileSync(reportPath, htmlReport);
  console.log(`\n📄 HTML report saved to: ${reportPath}`);

  // Final summary
  if (passedLogins === totalTests) {
    console.log('\n🎉 Perfect! All users can login successfully!');
  } else {
    console.log(`\n⚠️ ${totalTests - passedLogins} user(s) failed to login`);
  }

  console.log('═'.repeat(60));
}

// Run all tests
runAllTests()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });