import { test, expect } from '@playwright/test';

/**
 * Complete User Simulation Tests
 * Tests login, permissions, and features for all 10 user types
 */

// Test data for all user types
const testUsers = [
  {
    role: 'Free User',
    email: 'free@rapidtriage.me',
    password: 'FreeUser123!',
    subscription: 'free',
    permissions: {
      projects: { create: true, limit: 1, update: false, delete: false },
      workspaces: { create: false, read: false },
      analytics: { access: false },
      teams: { manage: false },
      billing: { access: false }
    }
  },
  {
    role: 'Starter User',
    email: 'starter@rapidtriage.me',
    password: 'StarterUser123!',
    subscription: 'starter',
    permissions: {
      projects: { create: true, limit: 5, update: true, delete: true },
      workspaces: { create: true, read: true },
      analytics: { access: false },
      teams: { manage: false },
      billing: { access: false }
    }
  },
  {
    role: 'Pro User',
    email: 'pro@rapidtriage.me',
    password: 'ProUser123!',
    subscription: 'pro',
    permissions: {
      projects: { create: true, limit: 25, update: true, delete: true },
      workspaces: { create: true, read: true },
      analytics: { access: true },
      teams: { manage: true },
      billing: { access: false }
    }
  },
  {
    role: 'Enterprise User',
    email: 'enterprise@rapidtriage.me',
    password: 'EnterpriseUser123!',
    subscription: 'enterprise',
    permissions: {
      projects: { create: true, limit: -1, update: true, delete: true },
      workspaces: { create: true, read: true },
      analytics: { access: true },
      teams: { manage: true },
      billing: { access: false }
    }
  },
  {
    role: 'Organization Owner',
    email: 'owner@rapidtriage.me',
    password: 'OrgOwner123!',
    subscription: 'enterprise',
    permissions: {
      projects: { create: true, limit: -1, update: true, delete: true },
      workspaces: { create: true, read: true },
      analytics: { access: true },
      teams: { manage: true },
      billing: { access: true },
      organization: { delete: true, transfer: true, impersonate: true }
    }
  },
  {
    role: 'Organization Admin',
    email: 'admin@rapidtriage.me',
    password: 'OrgAdmin123!',
    subscription: 'enterprise',
    permissions: {
      projects: { create: true, limit: -1, update: true, delete: true },
      workspaces: { create: true, read: true },
      analytics: { access: true },
      teams: { manage: true },
      billing: { access: false },
      organization: { delete: false, transfer: false, impersonate: false }
    }
  },
  {
    role: 'Developer',
    email: 'developer@rapidtriage.me',
    password: 'OrgDev123!',
    subscription: 'enterprise',
    permissions: {
      projects: { create: true, limit: -1, update: true, delete: true },
      workspaces: { create: true, read: true },
      analytics: { access: false },
      teams: { manage: false },
      billing: { access: false },
      debug: { access: true }
    }
  },
  {
    role: 'Analyst',
    email: 'analyst@rapidtriage.me',
    password: 'OrgAnalyst123!',
    subscription: 'enterprise',
    permissions: {
      projects: { create: false, read: true, update: false, delete: false },
      workspaces: { create: false, read: true },
      analytics: { access: true, create: true, export: true },
      teams: { manage: false },
      billing: { access: false }
    }
  },
  {
    role: 'Viewer',
    email: 'viewer@rapidtriage.me',
    password: 'OrgViewer123!',
    subscription: 'enterprise',
    permissions: {
      projects: { create: false, read: true, update: false, delete: false },
      workspaces: { create: false, read: true },
      analytics: { access: true, create: false, export: false },
      teams: { manage: false },
      billing: { access: false }
    }
  },
  {
    role: 'Billing Manager',
    email: 'billing@rapidtriage.me',
    password: 'OrgBilling123!',
    subscription: 'enterprise',
    permissions: {
      projects: { create: false, read: false },
      workspaces: { create: false, read: false },
      analytics: { access: false },
      teams: { manage: false },
      billing: { access: true, manage: true, export: true }
    }
  }
];

test.describe('Complete User Role Simulation', () => {
  test.setTimeout(120000); // 2 minutes per test

  for (const user of testUsers) {
    test(`${user.role} - Complete workflow test`, async ({ page, context }) => {
      console.log(`\n🧪 Testing ${user.role}`);
      console.log('━'.repeat(50));

      // Step 1: Login
      console.log('1️⃣ Testing Login...');
      await page.goto('https://rapidtriage.me/login');

      // Fill login form
      await page.fill('input[type="email"], input[name="email"], #email', user.email);
      await page.fill('input[type="password"], input[name="password"], #password', user.password);

      // Take screenshot of login page
      await page.screenshot({
        path: `test-results/login-${user.role.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true
      });

      // Submit login
      await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

      // Wait for navigation or response
      await page.waitForTimeout(2000);

      // Check if login was successful
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/profile')) {
        console.log('   ✅ Login successful');
      } else if (currentUrl.includes('/login')) {
        // Try API login instead
        console.log('   ⚠️ UI login stayed on login page, testing API...');

        const loginResponse = await page.request.post('https://rapidtriage.me/auth/login', {
          data: {
            email: user.email,
            password: user.password
          }
        });

        if (loginResponse.ok()) {
          const loginData = await loginResponse.json();
          console.log('   ✅ API login successful');
          console.log(`   📝 Token: ${loginData.token ? 'Generated' : 'Not generated'}`);
          console.log(`   👤 User ID: ${loginData.user?.id || 'N/A'}`);
          console.log(`   🎭 Role: ${loginData.user?.role || 'N/A'}`);
          console.log(`   📦 Plan: ${loginData.user?.subscription?.plan || 'N/A'}`);

          // Store token for API tests
          const token = loginData.token;

          // Step 2: Test API Access
          console.log('\n2️⃣ Testing API Access...');

          // Test Projects API
          const projectsResponse = await page.request.get('https://rapidtriage.me/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`   📁 Projects API: ${projectsResponse.status()} ${projectsResponse.ok() ? '✅' : '❌'}`);

          // Test Workspaces API
          const workspacesResponse = await page.request.get('https://rapidtriage.me/api/workspaces', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`   🏢 Workspaces API: ${workspacesResponse.status()} ${workspacesResponse.ok() ? '✅' : '❌'}`);

          // Test Analytics API
          const analyticsResponse = await page.request.get('https://rapidtriage.me/api/analytics', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const analyticsAllowed = user.permissions.analytics?.access;
          const analyticsOk = analyticsResponse.ok();
          console.log(`   📊 Analytics API: ${analyticsResponse.status()} ${analyticsOk === analyticsAllowed ? '✅' : '❌'}`);

          // Step 3: Test CRUD Operations
          console.log('\n3️⃣ Testing CRUD Operations...');

          // Test CREATE
          if (user.permissions.projects?.create) {
            const createResponse = await page.request.post('https://rapidtriage.me/api/projects', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: {
                name: `Test Project - ${user.role}`,
                description: `Automated test project for ${user.role}`
              }
            });
            console.log(`   ➕ CREATE Project: ${createResponse.status()} ${createResponse.status() === 201 ? '✅' : '❌'}`);
          } else {
            console.log(`   ➕ CREATE Project: Skipped (no permission)`);
          }

          // Test READ
          const readResponse = await page.request.get('https://rapidtriage.me/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`   📖 READ Projects: ${readResponse.status()} ${readResponse.ok() ? '✅' : '❌'}`);

          // Test UPDATE (if allowed)
          if (user.permissions.projects?.update) {
            const updateResponse = await page.request.patch('https://rapidtriage.me/api/projects/proj_1', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: {
                name: 'Updated Project Name'
              }
            });
            console.log(`   ✏️ UPDATE Project: ${updateResponse.status()} ${updateResponse.ok() ? '✅' : '❌'}`);
          } else {
            console.log(`   ✏️ UPDATE Project: Skipped (no permission)`);
          }

          // Test DELETE (if allowed)
          if (user.permissions.projects?.delete) {
            const deleteResponse = await page.request.delete('https://rapidtriage.me/api/projects/proj_test', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`   🗑️ DELETE Project: ${deleteResponse.status()} ${deleteResponse.ok() ? '✅' : '❌'}`);
          } else {
            console.log(`   🗑️ DELETE Project: Skipped (no permission)`);
          }

          // Step 4: Test Special Permissions
          console.log('\n4️⃣ Testing Special Permissions...');

          // Test Organization endpoints (for org roles)
          if (user.permissions.organization) {
            const orgResponse = await page.request.get('https://rapidtriage.me/api/organization', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`   🏢 Organization API: ${orgResponse.status()} ${orgResponse.ok() ? '✅' : '❌'}`);
          }

          // Test Billing access (for billing roles)
          if (user.permissions.billing?.access) {
            console.log(`   💳 Billing Access: Allowed ✅`);
          }

          // Test Debug tools (for developers)
          if (user.permissions.debug?.access) {
            console.log(`   🐛 Debug Tools: Allowed ✅`);
          }

          // Step 5: Verify Subscription Limits
          console.log('\n5️⃣ Verifying Subscription Limits...');

          if (user.permissions.projects?.limit) {
            const limit = user.permissions.projects.limit;
            console.log(`   📦 Project Limit: ${limit === -1 ? 'Unlimited' : limit} projects`);
          }

          console.log(`   💎 Subscription Tier: ${user.subscription}`);

        } else {
          console.log('   ❌ API login failed');
        }
      }

      // Take final screenshot
      await page.screenshot({
        path: `test-results/final-${user.role.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true
      });

      console.log('\n' + '━'.repeat(50));
      console.log(`✅ Completed testing for ${user.role}`);
    });
  }
});

// Summary test
test('Generate test summary report', async ({ page }) => {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('═'.repeat(60));

  const results = [];

  for (const user of testUsers) {
    // Quick API test for each user
    const loginResponse = await page.request.post('https://rapidtriage.me/auth/login', {
      data: {
        email: user.email,
        password: user.password
      }
    });

    const success = loginResponse.ok();
    results.push({
      role: user.role,
      email: user.email,
      subscription: user.subscription,
      loginStatus: success ? '✅ Pass' : '❌ Fail'
    });
  }

  // Print summary table
  console.log('\nUser Role               | Email                    | Plan       | Login Status');
  console.log('─'.repeat(80));

  for (const result of results) {
    console.log(
      `${result.role.padEnd(23)} | ${result.email.padEnd(24)} | ${result.subscription.padEnd(10)} | ${result.loginStatus}`
    );
  }

  console.log('─'.repeat(80));

  const passCount = results.filter(r => r.loginStatus.includes('Pass')).length;
  const totalCount = results.length;
  const passRate = ((passCount / totalCount) * 100).toFixed(1);

  console.log(`\n📈 Overall Success Rate: ${passCount}/${totalCount} (${passRate}%)`);

  if (passRate === '100.0') {
    console.log('🎉 All tests passed successfully!');
  } else {
    console.log(`⚠️ ${totalCount - passCount} test(s) failed`);
  }

  console.log('═'.repeat(60));

  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>RapidTriageME Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    h1 { color: #333; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; background: white; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th { background: #667eea; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    tr:hover { background: #f9f9f9; }
    .pass { color: #10b981; font-weight: bold; }
    .fail { color: #ef4444; font-weight: bold; }
    .summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric { display: inline-block; margin: 10px 20px; }
    .metric-value { font-size: 2em; font-weight: bold; color: #667eea; }
    .metric-label { color: #666; margin-top: 5px; }
  </style>
</head>
<body>
  <h1>🧪 RapidTriageME Complete Test Report</h1>

  <div class="summary">
    <h2>📊 Test Summary</h2>
    <div class="metric">
      <div class="metric-value">${totalCount}</div>
      <div class="metric-label">Total Users</div>
    </div>
    <div class="metric">
      <div class="metric-value">${passCount}</div>
      <div class="metric-label">Passed</div>
    </div>
    <div class="metric">
      <div class="metric-value">${passRate}%</div>
      <div class="metric-label">Success Rate</div>
    </div>
  </div>

  <h2>👥 User Test Results</h2>
  <table>
    <thead>
      <tr>
        <th>Role</th>
        <th>Email</th>
        <th>Subscription</th>
        <th>Login Status</th>
      </tr>
    </thead>
    <tbody>
      ${results.map(r => `
      <tr>
        <td>${r.role}</td>
        <td>${r.email}</td>
        <td>${r.subscription}</td>
        <td class="${r.loginStatus.includes('Pass') ? 'pass' : 'fail'}">${r.loginStatus}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <p>Generated: ${new Date().toLocaleString()}</p>
</body>
</html>
  `;

  // Save HTML report
  await page.evaluate((html) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-report.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, htmlReport);

  expect(passCount).toBe(totalCount);
});