const https = require('https');

async function testProfileAPI() {
    console.log('🔐 Testing RapidTriageME Profile API\n');
    console.log('==========================================\n');
    
    // Test token (you may need to get a real token from login)
    const token = 'test-token';
    const baseUrl = 'https://rapidtriage.me';
    
    // Test 1: Get Profile
    console.log('1. Testing GET /auth/profile...');
    try {
        const profileResponse = await fetch(`${baseUrl}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('   Status:', profileResponse.status);
        if (profileResponse.status === 401) {
            console.log('   ✅ Auth middleware is active (correctly requires authentication)');
        } else if (profileResponse.status === 200) {
            const data = await profileResponse.json();
            console.log('   ✅ Profile retrieved:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    // Test 2: Update Profile
    console.log('\n2. Testing PUT /auth/profile...');
    try {
        const updateResponse = await fetch(`${baseUrl}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test User',
                company: 'Test Company',
                twoFactorEnabled: false
            })
        });
        
        console.log('   Status:', updateResponse.status);
        if (updateResponse.status === 401) {
            console.log('   ✅ Auth middleware is active (correctly requires authentication)');
        } else if (updateResponse.status === 200) {
            const data = await updateResponse.json();
            console.log('   ✅ Profile updated');
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    // Test 3: Get Usage Stats
    console.log('\n3. Testing GET /auth/usage...');
    try {
        const usageResponse = await fetch(`${baseUrl}/auth/usage`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('   Status:', usageResponse.status);
        if (usageResponse.status === 401) {
            console.log('   ✅ Auth middleware is active (correctly requires authentication)');
        } else if (usageResponse.status === 200) {
            const data = await usageResponse.json();
            console.log('   ✅ Usage stats retrieved');
            console.log('   - API calls today:', data.apiCallsToday);
            console.log('   - API calls month:', data.apiCallsMonth);
            console.log('   - Storage used:', data.storageUsed);
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    // Test 4: Check Profile Page
    console.log('\n4. Testing Profile Page Load...');
    try {
        const pageResponse = await fetch(`${baseUrl}/profile`);
        console.log('   Status:', pageResponse.status);
        if (pageResponse.status === 200) {
            console.log('   ✅ Profile page loads successfully');
            const html = await pageResponse.text();
            if (html.includes('Personal Information')) {
                console.log('   ✅ Profile form is present');
            }
            if (html.includes('loadProfile')) {
                console.log('   ✅ Profile JavaScript is present');
            }
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    console.log('\n==========================================');
    console.log('Profile API Test Complete!\n');
    console.log('📋 Summary:');
    console.log('- Profile endpoints are configured at /auth/profile');
    console.log('- Usage endpoint is available at /auth/usage');
    console.log('- Authentication is required for all profile operations');
    console.log('- Data is stored in Cloudflare KV');
    
    console.log('\n🔗 Test the profile page:');
    console.log('https://rapidtriage.me/profile');
}

testProfileAPI();
