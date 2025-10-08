#!/usr/bin/env node

/**
 * Test authentication flow for RapidTriageME
 * This script tests login and profile data retrieval
 */

const API_URL = 'http://localhost:8787';

async function testAuthFlow() {
  console.log('🔍 Testing RapidTriageME Authentication Flow\n');
  
  // Step 1: Register a test user
  console.log('1️⃣ Registering test user...');
  const registerResponse = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@rapidtriage.me',
      password: 'TestPassword123!',
      name: 'Test User',
      acceptTerms: true
    })
  });
  
  const registerData = await registerResponse.json();
  
  if (registerResponse.ok) {
    console.log('✅ Registration successful:', {
      email: registerData.user.email,
      name: registerData.user.name
    });
  } else {
    console.log('⚠️ Registration failed (user may already exist):', registerData.message);
    
    // Try to login instead
    console.log('\n2️⃣ Attempting login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@rapidtriage.me',
        password: 'TestPassword123!'
      })
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('❌ Login failed:', error);
      return;
    }
    
    const loginData = await loginResponse.json();
    registerData.token = loginData.token;
    registerData.user = loginData.user;
    console.log('✅ Login successful!');
  }
  
  const token = registerData.token;
  console.log('\n📝 Token obtained:', token.substring(0, 20) + '...');
  
  // Step 3: Test profile retrieval
  console.log('\n3️⃣ Testing profile retrieval...');
  const profileResponse = await fetch(`${API_URL}/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!profileResponse.ok) {
    const error = await profileResponse.json();
    console.error('❌ Profile fetch failed:', error);
    return;
  }
  
  const profileData = await profileResponse.json();
  console.log('✅ Profile retrieved successfully:', {
    name: profileData.name,
    email: profileData.email,
    company: profileData.company || 'Not set',
    subscription: profileData.subscription?.plan || 'free'
  });
  
  // Step 4: Test profile update
  console.log('\n4️⃣ Testing profile update...');
  const updateResponse = await fetch(`${API_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Updated Test User',
      company: 'Test Company Inc.'
    })
  });
  
  if (updateResponse.ok) {
    console.log('✅ Profile updated successfully!');
  } else {
    const error = await updateResponse.json();
    console.log('⚠️ Profile update failed:', error.message);
  }
  
  // Step 5: Verify update
  console.log('\n5️⃣ Verifying profile update...');
  const verifyResponse = await fetch(`${API_URL}/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (verifyResponse.ok) {
    const updatedProfile = await verifyResponse.json();
    console.log('✅ Updated profile data:', {
      name: updatedProfile.name,
      company: updatedProfile.company || 'Not set'
    });
  }
  
  console.log('\n✨ Authentication flow test completed!');
  console.log('ℹ️ You can now login with:');
  console.log('   Email: test@rapidtriage.me');
  console.log('   Password: TestPassword123!');
}

// Run the test
testAuthFlow().catch(console.error);