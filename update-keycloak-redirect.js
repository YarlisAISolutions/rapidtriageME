const axios = require('axios');

async function updateKeycloakRedirectUris() {
    const KEYCLOAK_URL = 'https://auth.yarlis.ai';
    const REALM = 'rapidtriage-production';
    const ADMIN_USER = 'root';
    const ADMIN_PASSWORD = 'BkdNHvll-QeL5-lngxWKcs';
    
    console.log('🔐 Updating Keycloak Redirect URIs...\n');
    
    try {
        // Get admin token
        console.log('1. Authenticating as admin...');
        const tokenResponse = await axios.post(
            `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
            new URLSearchParams({
                grant_type: 'password',
                client_id: 'admin-cli',
                username: ADMIN_USER,
                password: ADMIN_PASSWORD
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
        
        const accessToken = tokenResponse.data.access_token;
        console.log('   ✅ Admin authenticated');
        
        // Update webapp client redirect URIs
        console.log('\n2. Updating webapp client redirect URIs...');
        
        // First get the client
        const clientsResponse = await axios.get(
            `${KEYCLOAK_URL}/admin/realms/${REALM}/clients`,
            {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        );
        
        const webappClient = clientsResponse.data.find(c => c.clientId === 'rapidtriage-webapp');
        
        if (webappClient) {
            // Update redirect URIs
            const updatedClient = {
                ...webappClient,
                redirectUris: [
                    'https://rapidtriage.me/auth/callback',
                    'https://rapidtriage.me/auth/callback/*',
                    'https://rapidtriage.me/profile',
                    'https://rapidtriage.me/dashboard',
                    'https://rapidtriage.me/*',
                    'http://localhost:3000/auth/callback',
                    'http://localhost:3000/*'
                ],
                webOrigins: [
                    'https://rapidtriage.me',
                    'http://localhost:3000',
                    '+'
                ]
            };
            
            await axios.put(
                `${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${webappClient.id}`,
                updatedClient,
                {
                    headers: { 
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('   ✅ Webapp client redirect URIs updated');
            console.log('   Redirect URIs:');
            updatedClient.redirectUris.forEach(uri => console.log(`     - ${uri}`));
        }
        
        console.log('\n✅ Keycloak configuration updated successfully!');
        console.log('\n📋 You can now use these URLs:');
        console.log('   - https://rapidtriage.me/profile');
        console.log('   - https://rapidtriage.me/auth/callback');
        
    } catch (error) {
        console.error('❌ Error updating Keycloak:', error.response?.data || error.message);
    }
}

updateKeycloakRedirectUris();
