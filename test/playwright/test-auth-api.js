#!/usr/bin/env node

/**
 * Test authentication API with test credentials
 */

async function testAuthAPI() {
  console.log('🔐 Testing Authentication API...\n');
  console.log('Base URL: https://rapidtriage.me');
  console.log('═'.repeat(50));

  const testUsers = [
    { email: 'free@rapidtriage.me', password: 'FreeUser123!', role: 'Free User' },
    { email: 'pro@rapidtriage.me', password: 'ProUser123!', role: 'Pro User' },
    { email: 'enterprise@rapidtriage.me', password: 'EnterpriseUser123!', role: 'Enterprise User' },
    { email: 'owner@rapidtriage.me', password: 'OrgOwner123!', role: 'Organization Owner' },
    { email: 'admin@rapidtriage.me', password: 'OrgAdmin123!', role: 'Organization Admin' },
    { email: 'developer@rapidtriage.me', password: 'OrgDev123!', role: 'Developer' }
  ];

  const results = [];

  for (const user of testUsers) {
    console.log(`\nTesting ${user.role}:`);
    console.log('─'.repeat(30));

    try {
      // Test login
      console.log(`  1. Login with ${user.email}...`);
      const loginResponse = await fetch('https://rapidtriage.me/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password
        })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.status === 200) {
        console.log(`  ✅ Login successful!`);
        console.log(`     Token: ${loginData.token ? loginData.token.substring(0, 20) + '...' : 'N/A'}`);
        console.log(`     User ID: ${loginData.user?.id || 'N/A'}`);
        console.log(`     Role: ${loginData.user?.role || 'N/A'}`);
        console.log(`     Plan: ${loginData.user?.subscription?.plan || 'N/A'}`);

        if (loginData.user?.permissions) {
          console.log(`     Permissions: ${loginData.user.permissions.slice(0, 3).join(', ')}${loginData.user.permissions.length > 3 ? '...' : ''}`);
        }

        // Test API access with token
        if (loginData.token) {
          console.log(`\n  2. Testing API access...`);

          // Test /api/profile
          const profileResponse = await fetch('https://rapidtriage.me/api/profile', {
            headers: {
              'Authorization': `Bearer ${loginData.token}`
            }
          });
          console.log(`     /api/profile: ${profileResponse.status} ${profileResponse.status === 200 ? '✅' : '❌'}`);

          // Test /api/projects
          const projectsResponse = await fetch('https://rapidtriage.me/api/projects', {
            headers: {
              'Authorization': `Bearer ${loginData.token}`
            }
          });
          console.log(`     /api/projects: ${projectsResponse.status} ${projectsResponse.status === 200 ? '✅' : '❌'}`);

          // Test /api/workspaces
          const workspacesResponse = await fetch('https://rapidtriage.me/api/workspaces', {
            headers: {
              'Authorization': `Bearer ${loginData.token}`
            }
          });
          console.log(`     /api/workspaces: ${workspacesResponse.status} ${workspacesResponse.status === 200 ? '✅' : '❌'}`);

          // Test /api/analytics (should fail for free users)
          const analyticsResponse = await fetch('https://rapidtriage.me/api/analytics', {
            headers: {
              'Authorization': `Bearer ${loginData.token}`
            }
          });
          console.log(`     /api/analytics: ${analyticsResponse.status} ${analyticsResponse.status === 200 ? '✅' : '❌'}`);
        }

        results.push({ user: user.role, status: 'SUCCESS', token: !!loginData.token });
      } else {
        console.log(`  ❌ Login failed: ${loginResponse.status}`);
        console.log(`     Error: ${loginData.error || loginData.message || 'Unknown error'}`);
        results.push({ user: user.role, status: 'FAILED', error: loginData.error });
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({ user: user.role, status: 'ERROR', error: error.message });
    }
  }

  // Print summary
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(50));
  console.log('User Role                | Status    | Token');
  console.log('─'.repeat(50));

  for (const result of results) {
    const status = result.status === 'SUCCESS' ? '✅ SUCCESS' :
                   result.status === 'FAILED' ? '❌ FAILED' : '⚠️ ERROR';
    const token = result.token ? 'Yes' : 'No';
    console.log(`${result.user.padEnd(24)} | ${status.padEnd(10)} | ${token}`);
  }

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  console.log('─'.repeat(50));
  console.log(`Total: ${successCount}/${results.length} successful`);

  return successCount === results.length;
}

// Run the test
testAuthAPI()
  .then((success) => {
    console.log('\n' + (success ? '🎉 All tests passed!' : '⚠️ Some tests failed'));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });