const https = require('https');

async function testSSOIntegration() {
    console.log('🔐 Testing RapidTriageME SSO Integration\n');
    console.log('==========================================\n');
    
    // Test 1: Check Keycloak availability
    console.log('1. Testing Keycloak realm configuration...');
    const keycloakConfig = await fetch('https://auth.yarlis.ai/realms/rapidtriage-production/.well-known/openid-configuration')
        .then(res => res.json())
        .catch(err => ({ error: err.message }));
    
    if (keycloakConfig.error) {
        console.log('   ❌ Keycloak not accessible:', keycloakConfig.error);
    } else {
        console.log('   ✅ Keycloak realm active');
        console.log('   - Issuer:', keycloakConfig.issuer);
        console.log('   - Auth endpoint:', keycloakConfig.authorization_endpoint);
    }
    
    // Test 2: Check production API
    console.log('\n2. Testing production API...');
    const apiHealth = await fetch('https://rapidtriage.me/health')
        .then(res => res.json())
        .catch(err => ({ error: err.message }));
    
    if (apiHealth.error) {
        console.log('   ❌ API not accessible:', apiHealth.error);
    } else {
        console.log('   ✅ API healthy');
        console.log('   - Status:', apiHealth.status);
        console.log('   - Environment:', apiHealth.environment);
        console.log('   - Version:', apiHealth.version);
    }
    
    // Test 3: Generate login URL
    console.log('\n3. Generating SSO login URLs...');
    const clients = [
        { name: 'Web App', clientId: 'rapidtriage-webapp' },
        { name: 'Extension', clientId: 'rapidtriage-extension' },
        { name: 'Mobile', clientId: 'rapidtriage-mobile' }
    ];
    
    for (const client of clients) {
        const params = new URLSearchParams({
            client_id: client.clientId,
            response_type: 'code',
            scope: 'openid profile email',
            redirect_uri: 'https://rapidtriage.me/auth/callback'
        });
        
        const loginUrl = `https://auth.yarlis.ai/realms/rapidtriage-production/protocol/openid-connect/auth?${params}`;
        console.log(`   🔗 ${client.name}: ${loginUrl}`);
    }
    
    // Test 4: Check API authentication endpoint
    console.log('\n4. Testing API authentication endpoint...');
    const authTest = await fetch('https://rapidtriage.me/api/auth/verify', {
        headers: {
            'Authorization': 'Bearer test-token'
        }
    }).then(res => ({ 
        status: res.status, 
        statusText: res.statusText 
    })).catch(err => ({ error: err.message }));
    
    if (authTest.error) {
        console.log('   ❌ Auth endpoint error:', authTest.error);
    } else {
        console.log(`   ℹ️  Auth endpoint responded: ${authTest.status} ${authTest.statusText}`);
        if (authTest.status === 401) {
            console.log('   ✅ Auth middleware is active (correctly rejecting invalid token)');
        }
    }
    
    console.log('\n==========================================');
    console.log('SSO Integration Test Complete!\n');
    console.log('📋 Summary:');
    console.log('- Keycloak realm: rapidtriage-production');
    console.log('- Test user: test@example.com / Test123!');
    console.log('- API endpoint: https://rapidtriage.me');
    console.log('- Auth endpoint: https://auth.yarlis.ai');
    
    console.log('\n🔗 Login URL for testing:');
    console.log('https://auth.yarlis.ai/realms/rapidtriage-production/account');
}

testSSOIntegration();
