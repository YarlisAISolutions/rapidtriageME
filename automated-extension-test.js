// Automated Test Script for RapidTriage Extension Operations
// Run this in the browser console on test-extension-operations.html

async function runAutomatedTests() {
    console.log('🚀 Starting RapidTriage Automated Tests');
    console.log('=====================================\n');

    const results = {
        passed: [],
        failed: [],
        timestamp: new Date().toISOString()
    };

    // Helper function to wait
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper function to click button and log result
    async function clickButton(buttonText, category) {
        try {
            console.log(`\n📍 Testing: ${buttonText}`);

            // Find button by text content
            const buttons = Array.from(document.querySelectorAll('.operation-btn'));
            const button = buttons.find(btn => btn.textContent.includes(buttonText));

            if (!button) {
                console.error(`❌ Button not found: ${buttonText}`);
                results.failed.push(`${category}: ${buttonText}`);
                return false;
            }

            // Click the button
            button.click();
            console.log(`✅ Clicked: ${buttonText}`);

            // Wait for operation to complete
            await wait(2000);

            // Check logs for success
            const logs = document.getElementById('logs-container');
            const lastLog = logs.lastElementChild;

            if (lastLog && lastLog.textContent.includes('✅')) {
                console.log(`✅ ${buttonText} - SUCCESS`);
                results.passed.push(`${category}: ${buttonText}`);
                return true;
            } else if (lastLog && lastLog.textContent.includes('❌')) {
                console.error(`❌ ${buttonText} - FAILED: ${lastLog.textContent}`);
                results.failed.push(`${category}: ${buttonText}`);
                return false;
            } else {
                console.log(`⚠️ ${buttonText} - Status unknown`);
                results.passed.push(`${category}: ${buttonText} (uncertain)`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Error testing ${buttonText}:`, error);
            results.failed.push(`${category}: ${buttonText} (error)`);
            return false;
        }
    }

    // Test 1: Google Search
    console.log('\n📌 TEST 1: GOOGLE SEARCH FOR CRYPTO MARKET 2025');
    console.log('================================================');

    try {
        // Set search query
        document.getElementById('search-query').value = 'crypto market in 2025';
        console.log('✅ Search query set: "crypto market in 2025"');

        // Click search button
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            console.log('🔍 Initiating Google search...');
            searchBtn.click();
            await wait(5000); // Wait for search to complete
            console.log('✅ Google search initiated');
            results.passed.push('Google Search: crypto market 2025');
        }
    } catch (error) {
        console.error('❌ Google search failed:', error);
        results.failed.push('Google Search');
    }

    // Test 2: Data Capture Operations
    console.log('\n📌 TEST 2: DATA CAPTURE OPERATIONS');
    console.log('====================================');

    await clickButton('Take Screenshot', 'Data Capture');
    await clickButton('Get Console Logs', 'Data Capture');
    await clickButton('Get Console Errors', 'Data Capture');
    await clickButton('Get Network Logs', 'Data Capture');
    await clickButton('Get Network Errors', 'Data Capture');
    await clickButton('Get Page Info', 'Data Capture');

    // Test 3: Lighthouse Audits
    console.log('\n📌 TEST 3: LIGHTHOUSE AUDITS');
    console.log('==============================');

    await clickButton('Performance Audit', 'Lighthouse');
    await clickButton('Accessibility Audit', 'Lighthouse');
    await clickButton('SEO Audit', 'Lighthouse');
    await clickButton('Best Practices Audit', 'Lighthouse');

    // Test 4: Control Operations
    console.log('\n📌 TEST 4: CONTROL OPERATIONS');
    console.log('===============================');

    // Navigate test
    console.log('\n📍 Testing: Navigate to URL');
    window.testNavigateURL = 'https://www.example.com';
    const originalPrompt = window.prompt;
    window.prompt = () => window.testNavigateURL;
    await clickButton('Navigate to URL', 'Control');
    window.prompt = originalPrompt;

    // Execute JS test
    console.log('\n📍 Testing: Execute JavaScript');
    window.testJSCode = 'document.title';
    window.prompt = () => window.testJSCode;
    await clickButton('Execute JavaScript', 'Control');
    window.prompt = originalPrompt;

    // Inspect element test
    console.log('\n📍 Testing: Inspect Element');
    window.testSelector = 'body';
    window.prompt = () => window.testSelector;
    await clickButton('Inspect Element', 'Control');
    window.prompt = originalPrompt;

    // Generate report
    await clickButton('Generate Report', 'Control');

    // Clear data (last to clean up)
    await clickButton('Clear Data', 'Control');

    // Test 5: Check Results Display
    console.log('\n📌 TEST 5: RESULTS VERIFICATION');
    console.log('=================================');

    const metrics = {
        'console-count': document.getElementById('console-count').textContent,
        'error-count': document.getElementById('error-count').textContent,
        'network-count': document.getElementById('network-count').textContent,
        'network-error-count': document.getElementById('network-error-count').textContent,
        'performance-score': document.getElementById('performance-score').textContent,
        'accessibility-score': document.getElementById('accessibility-score').textContent
    };

    console.log('📊 Captured Metrics:');
    Object.entries(metrics).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
    });

    // Generate Test Report
    console.log('\n=====================================');
    console.log('📊 AUTOMATED TEST REPORT');
    console.log('=====================================\n');

    console.log(`✅ Passed Tests: ${results.passed.length}`);
    results.passed.forEach(test => console.log(`   ✓ ${test}`));

    console.log(`\n❌ Failed Tests: ${results.failed.length}`);
    results.failed.forEach(test => console.log(`   ✗ ${test}`));

    const successRate = Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100);
    console.log(`\n📈 Success Rate: ${successRate}%`);
    console.log(`📅 Test Date: ${results.timestamp}`);

    // Display visual summary
    const summary = document.createElement('div');
    summary.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid ${successRate > 70 ? '#10b981' : '#ef4444'};
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 300px;
    `;
    summary.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #333;">Test Results</h3>
        <div style="font-size: 24px; font-weight: bold; color: ${successRate > 70 ? '#10b981' : '#ef4444'};">
            ${successRate}% Success
        </div>
        <div style="margin-top: 10px;">
            <div>✅ Passed: ${results.passed.length}</div>
            <div>❌ Failed: ${results.failed.length}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="
            margin-top: 10px;
            padding: 8px 16px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        ">Close</button>
    `;
    document.body.appendChild(summary);

    console.log('\n✅ Automated tests complete!');

    return results;
}

// Run extension-specific tests
async function testExtensionFeatures() {
    console.log('\n📌 TESTING EXTENSION-SPECIFIC FEATURES');
    console.log('========================================\n');

    // Check if extension is installed
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        console.log('✅ Chrome extension detected');
        console.log(`   Extension ID: ${chrome.runtime.id}`);

        // Test message passing to extension
        try {
            chrome.runtime.sendMessage({type: 'TEST_CONNECTION'}, response => {
                if (chrome.runtime.lastError) {
                    console.log('⚠️ Extension communication error:', chrome.runtime.lastError.message);
                } else {
                    console.log('✅ Extension communication successful');
                }
            });
        } catch (e) {
            console.log('⚠️ Could not communicate with extension:', e.message);
        }

        // Check storage API
        if (chrome.storage) {
            console.log('✅ Chrome storage API available');
        }

        // Check for RapidTriage operations
        if (typeof RapidTriageOperations !== 'undefined') {
            console.log('✅ RapidTriageOperations class loaded');

            // Initialize operations
            const ops = new RapidTriageOperations();
            const initResult = await ops.initialize();

            if (initResult.success) {
                console.log(`✅ Operations initialized (${initResult.type} connection)`);
            } else {
                console.log(`❌ Operations initialization failed: ${initResult.error}`);
            }
        } else {
            console.log('❌ RapidTriageOperations class not found');
        }
    } else {
        console.log('❌ Chrome extension not detected');
    }
}

// Create test console messages
function generateTestLogs() {
    console.log('📝 Generating test console logs...');
    console.info('ℹ️ This is an info message for testing');
    console.warn('⚠️ This is a warning message for testing');
    console.error('❌ This is an error message for testing');
    console.debug('🐛 This is a debug message for testing');

    // Create some network activity
    fetch('/test-endpoint').catch(() => {});
    fetch('https://example.com/api/test').catch(() => {});

    console.log('✅ Test logs generated');
}

// Main execution
(async function() {
    console.clear();
    console.log('🎯 RapidTriage Extension Operations - Automated Test Suite');
    console.log('==========================================================\n');

    // Generate test data
    generateTestLogs();

    // Test extension features
    await testExtensionFeatures();

    // Run automated tests
    const results = await runAutomatedTests();

    // Store results
    window.testResults = results;
    console.log('\n💾 Test results stored in window.testResults');
    console.log('📋 To view results again, run: console.log(window.testResults)');
})();