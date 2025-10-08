#!/usr/bin/env node

/**
 * Test script to verify RapidTriage extension integration
 */

const fs = require('fs');
const path = require('path');

// Test data for development
const mockAuditData = {
    url: 'http://localhost:3000/test',
    scores: {
        performance: 85,
        accessibility: 92,
        bestPractices: 88,
        seo: 94
    },
    metrics: {
        loadTime: 1200,
        timestamp: new Date().toISOString()
    },
    recommendations: [
        "Good page load performance",
        "Review accessibility standards",
        "Check SEO meta tags and structure"
    ]
};

const mockConsoleData = {
    url: 'http://localhost:3000/test',
    logs: [
        { level: 'log', text: 'Application initialized successfully', timestamp: new Date().toISOString() },
        { level: 'warn', text: 'Deprecated API usage detected in component', timestamp: new Date().toISOString() },
        { level: 'error', text: 'Failed to load resource: net::ERR_NETWORK_CHANGED', timestamp: new Date().toISOString() },
        { level: 'info', text: 'User authentication completed', timestamp: new Date().toISOString() }
    ],
    count: 4,
    timestamp: new Date().toISOString(),
    summary: {
        errors: 1,
        warnings: 1,
        info: 1,
        logs: 1
    }
};

console.log('🚀 Testing RapidTriage Extension Integration\n');

async function testServerEndpoints() {
    const fetch = (await import('node-fetch')).default;
    
    try {
        // Test server identity
        console.log('📍 Testing server identity...');
        const identityResponse = await fetch('http://localhost:3025/.identity');
        const identity = await identityResponse.json();
        console.log('✅ Server identity:', identity.name, 'v' + identity.version);
        
        // Test audit endpoint availability
        console.log('\n🔍 Testing audit endpoint...');
        const auditResponse = await fetch('http://localhost:3025/api/latest-audit');
        const auditResult = await auditResponse.json();
        
        if (auditResult.success) {
            console.log('✅ Audit data available:', auditResult.data.url);
        } else {
            console.log('ℹ️ No audit data available yet (expected on first run)');
        }
        
        // Test console logs endpoint
        console.log('\n📋 Testing console logs endpoint...');
        const logsResponse = await fetch('http://localhost:3025/api/latest-console');
        const logsResult = await logsResponse.json();
        
        if (logsResult.success && logsResult.data.count > 0) {
            console.log('✅ Console logs available:', logsResult.data.count, 'entries');
        } else {
            console.log('ℹ️ No console logs available yet');
        }
        
        // Test screenshot endpoint
        console.log('\n📷 Testing screenshot endpoint...');
        const screenshotResponse = await fetch('http://localhost:3025/api/latest-screenshot');
        const screenshotResult = await screenshotResponse.json();
        
        if (screenshotResult.success) {
            console.log('✅ Screenshot data available:', screenshotResult.data.path);
        } else {
            console.log('ℹ️ No screenshot data available yet');
        }
        
        console.log('\n🎯 Server endpoints are working correctly!');
        console.log('📝 To test extension functionality:');
        console.log('   1. Load the extension in Chrome from rapidtriage-extension folder');
        console.log('   2. Click the extension popup or open DevTools panel');
        console.log('   3. Use the buttons to test each feature');
        console.log('   4. Check that results show in the interface');
        
    } catch (error) {
        console.error('❌ Server test failed:', error.message);
        console.log('\n💡 Make sure the server is running: node rapidtriage-server/server.js');
    }
}

// Create a simple HTML test page if it doesn't exist
const testPagePath = path.join(__dirname, 'test-extension-features.html');
if (!fs.existsSync(testPagePath)) {
    const testPageContent = `<!DOCTYPE html>
<html>
<head>
    <title>RapidTriage Extension Feature Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .feature { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
        button { background: #007ACC; color: white; border: none; padding: 8px 15px; border-radius: 3px; cursor: pointer; margin: 5px; }
        button:hover { background: #005a9e; }
    </style>
</head>
<body>
    <h1>🚀 RapidTriage Extension Feature Test</h1>
    
    <div class="feature">
        <h3>📷 Screenshot Test</h3>
        <p>Use the extension to take a screenshot of this page</p>
        <button onclick="console.log('Screenshot button clicked')">Test Button</button>
    </div>
    
    <div class="feature">
        <h3>🔍 Lighthouse Audit Test</h3>
        <p>Run a lighthouse audit on this page to test performance metrics</p>
        <button onclick="console.log('Lighthouse test initiated')">Audit Button</button>
    </div>
    
    <div class="feature">
        <h3>📋 Console Logs Test</h3>
        <p>Generate some console messages for testing</p>
        <button onclick="generateTestLogs()">Generate Logs</button>
    </div>
    
    <script>
        function generateTestLogs() {
            console.log('🟢 Test log message generated');
            console.info('ℹ️ Test info message');
            console.warn('⚠️ Test warning message');
            console.error('❌ Test error message (simulated)');
        }
        
        // Auto-generate some logs for testing
        console.log('Page loaded successfully');
        console.info('RapidTriage test page ready');
    </script>
</body>
</html>`;
    
    fs.writeFileSync(testPagePath, testPageContent);
    console.log('📄 Created test page:', testPagePath);
}

// Run the test
testServerEndpoints();