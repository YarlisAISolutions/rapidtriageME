const http = require('http');
const fs = require('fs');

// Configuration for local browser connector
const BROWSER_CONNECTOR_URL = 'http://localhost:3025';
const TARGET_URL = 'https://www.google.com';
const SEARCH_QUERY = 'crypto market in 2025';

// Helper function to make API calls to local browser connector
async function callBrowserAPI(endpoint, method = 'POST', body = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BROWSER_CONNECTOR_URL}${endpoint}`);
        const postData = JSON.stringify(body);

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.error(`Request failed: ${error.message}`);
            reject(error);
        });

        if (method === 'POST') {
            req.write(postData);
        }
        req.end();
    });
}

// Test all browser operations
async function testBrowserOperations() {
    console.log('🚀 Testing RapidTriageME Browser Operations via Local Connector');
    console.log('================================================================\n');
    console.log('🔌 Browser Connector: http://localhost:3025');
    console.log('🎯 Target: Google.com');
    console.log(`🔍 Search Query: "${SEARCH_QUERY}"\n`);
    console.log('================================================================\n');

    const results = {
        passed: [],
        failed: [],
        data: {},
        timestamp: new Date().toISOString()
    };

    try {
        // 0. Check browser connector health
        console.log('0️⃣ Checking Browser Connector Health');
        try {
            const healthResult = await callBrowserAPI('/health', 'GET');
            console.log(`   Status: ${healthResult.status}`);
            if (healthResult.status === 200) {
                console.log('   ✅ Browser connector is healthy');
                console.log(`   📊 ${JSON.stringify(healthResult.data)}`);
                results.passed.push('Health Check');
            } else {
                console.log('   ❌ Browser connector health check failed');
                results.failed.push('Health Check');
            }
        } catch (error) {
            console.log('   ❌ Browser connector is not running!');
            console.log('   Please start it with: cd rapidtriage-server && npm start');
            return;
        }
        console.log();

        // 1. Navigate to Google
        console.log('1️⃣ Navigating to Google.com');
        const navigateResult = await callBrowserAPI('/navigate', 'POST', {
            url: TARGET_URL
        });
        console.log(`   Status: ${navigateResult.status}`);
        if (navigateResult.status === 200) {
            console.log('   ✅ Successfully navigated to Google.com');
            results.passed.push('Navigate');
            results.data.navigation = navigateResult.data;
        } else {
            console.log(`   ❌ Navigation failed: ${JSON.stringify(navigateResult.data)}`);
            results.failed.push('Navigate');
        }
        console.log();

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. Execute JavaScript to perform search
        console.log('2️⃣ Executing JavaScript to Search for Crypto Market 2025');
        const searchScript = `
            // Try to find the search box
            const searchBox = document.querySelector('input[name="q"], textarea[name="q"], input[type="search"]');
            if (searchBox) {
                searchBox.value = "${SEARCH_QUERY}";
                searchBox.dispatchEvent(new Event('input', { bubbles: true }));

                // Try to submit the form
                const form = searchBox.closest('form');
                if (form) {
                    // Trigger enter key press
                    const enterEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        keyCode: 13,
                        bubbles: true
                    });
                    searchBox.dispatchEvent(enterEvent);

                    // Also try form submit
                    setTimeout(() => form.submit(), 100);
                    return { success: true, message: 'Search submitted', query: "${SEARCH_QUERY}" };
                }
                return { success: true, message: 'Search box filled', value: searchBox.value };
            }
            return { success: false, message: 'Search box not found' };
        `;

        const executeResult = await callBrowserAPI('/execute', 'POST', {
            script: searchScript
        });
        console.log(`   Status: ${executeResult.status}`);
        if (executeResult.status === 200) {
            console.log(`   ✅ JavaScript executed: ${JSON.stringify(executeResult.data)}`);
            results.passed.push('Execute JavaScript');
            results.data.jsExecution = executeResult.data;
        } else {
            console.log(`   ❌ Execution failed: ${JSON.stringify(executeResult.data)}`);
            results.failed.push('Execute JavaScript');
        }
        console.log();

        // Wait for search results
        await new Promise(resolve => setTimeout(resolve, 4000));

        // 3. Take Screenshot
        console.log('3️⃣ Capturing Screenshot of Search Results');
        const screenshotResult = await callBrowserAPI('/screenshot', 'POST', {
            fullPage: false,
            quality: 80
        });
        console.log(`   Status: ${screenshotResult.status}`);
        if (screenshotResult.status === 200 && screenshotResult.data?.screenshot) {
            const filename = `screenshot-${Date.now()}.png`;
            const screenshotBuffer = Buffer.from(screenshotResult.data.screenshot, 'base64');
            fs.writeFileSync(filename, screenshotBuffer);
            console.log(`   ✅ Screenshot captured and saved to ${filename}`);
            console.log(`   📸 Size: ${(screenshotBuffer.length / 1024).toFixed(2)} KB`);
            results.passed.push('Screenshot');
            results.data.screenshot = filename;
        } else {
            console.log(`   ❌ Screenshot failed: ${JSON.stringify(screenshotResult.data)}`);
            results.failed.push('Screenshot');
        }
        console.log();

        // 4. Get Console Logs
        console.log('4️⃣ Retrieving Console Logs');
        const consoleLogsResult = await callBrowserAPI('/console', 'GET');
        console.log(`   Status: ${consoleLogsResult.status}`);
        if (consoleLogsResult.status === 200) {
            const logs = consoleLogsResult.data?.logs || [];
            console.log(`   ✅ Retrieved ${logs.length} console logs`);
            if (logs.length > 0) {
                console.log('   📋 Recent logs:');
                logs.slice(-3).forEach(log => {
                    console.log(`      - [${log.type}] ${log.text?.substring(0, 80)}...`);
                });
            }
            results.passed.push('Console Logs');
            results.data.consoleLogs = logs;
        } else {
            console.log(`   ❌ Console logs failed: ${JSON.stringify(consoleLogsResult.data)}`);
            results.failed.push('Console Logs');
        }
        console.log();

        // 5. Get Console Errors
        console.log('5️⃣ Retrieving Console Errors');
        const consoleErrorsResult = await callBrowserAPI('/console/errors', 'GET');
        console.log(`   Status: ${consoleErrorsResult.status}`);
        if (consoleErrorsResult.status === 200) {
            const errors = consoleErrorsResult.data?.errors || [];
            console.log(`   ✅ Retrieved ${errors.length} console errors`);
            if (errors.length > 0) {
                console.log('   🔴 Recent errors:');
                errors.slice(-3).forEach(error => {
                    console.log(`      - ${error.text?.substring(0, 80)}...`);
                });
            }
            results.passed.push('Console Errors');
            results.data.consoleErrors = errors;
        } else {
            console.log(`   ❌ Console errors failed: ${JSON.stringify(consoleErrorsResult.data)}`);
            results.failed.push('Console Errors');
        }
        console.log();

        // 6. Get Network Logs
        console.log('6️⃣ Retrieving Network Logs');
        const networkLogsResult = await callBrowserAPI('/network', 'GET');
        console.log(`   Status: ${networkLogsResult.status}`);
        if (networkLogsResult.status === 200) {
            const requests = networkLogsResult.data?.requests || [];
            console.log(`   ✅ Retrieved ${requests.length} network requests`);
            if (requests.length > 0) {
                // Show summary by type
                const types = {};
                requests.forEach(req => {
                    const type = req.type || 'other';
                    types[type] = (types[type] || 0) + 1;
                });
                console.log('   🌐 Network summary:');
                Object.entries(types).forEach(([type, count]) => {
                    console.log(`      - ${type}: ${count} requests`);
                });
            }
            results.passed.push('Network Logs');
            results.data.networkLogs = requests;
        } else {
            console.log(`   ❌ Network logs failed: ${JSON.stringify(networkLogsResult.data)}`);
            results.failed.push('Network Logs');
        }
        console.log();

        // 7. Get Network Errors
        console.log('7️⃣ Retrieving Network Errors');
        const networkErrorsResult = await callBrowserAPI('/network/errors', 'GET');
        console.log(`   Status: ${networkErrorsResult.status}`);
        if (networkErrorsResult.status === 200) {
            const errors = networkErrorsResult.data?.errors || [];
            console.log(`   ✅ Retrieved ${errors.length} network errors`);
            if (errors.length > 0) {
                console.log('   ⚠️ Network errors found:');
                errors.slice(0, 3).forEach(error => {
                    console.log(`      - [${error.status}] ${error.url?.substring(0, 60)}...`);
                });
            }
            results.passed.push('Network Errors');
            results.data.networkErrors = errors;
        } else {
            console.log(`   ❌ Network errors failed: ${JSON.stringify(networkErrorsResult.data)}`);
            results.failed.push('Network Errors');
        }
        console.log();

        // 8. Run Lighthouse Audits
        console.log('8️⃣ Running Lighthouse Audits (This may take a minute...)');

        // Performance Audit
        console.log('   📊 Performance Audit...');
        const perfResult = await callBrowserAPI('/lighthouse/performance', 'POST', {});
        if (perfResult.status === 200 && perfResult.data?.score !== undefined) {
            console.log(`   ✅ Performance Score: ${Math.round(perfResult.data.score * 100)}/100`);
            results.passed.push('Performance Audit');
            results.data.performanceScore = perfResult.data.score;
        } else {
            console.log(`   ❌ Performance audit failed`);
            results.failed.push('Performance Audit');
        }

        // Accessibility Audit
        console.log('   ♿ Accessibility Audit...');
        const a11yResult = await callBrowserAPI('/lighthouse/accessibility', 'POST', {});
        if (a11yResult.status === 200 && a11yResult.data?.score !== undefined) {
            console.log(`   ✅ Accessibility Score: ${Math.round(a11yResult.data.score * 100)}/100`);
            results.passed.push('Accessibility Audit');
            results.data.accessibilityScore = a11yResult.data.score;
        } else {
            console.log(`   ❌ Accessibility audit failed`);
            results.failed.push('Accessibility Audit');
        }

        // SEO Audit
        console.log('   🔍 SEO Audit...');
        const seoResult = await callBrowserAPI('/lighthouse/seo', 'POST', {});
        if (seoResult.status === 200 && seoResult.data?.score !== undefined) {
            console.log(`   ✅ SEO Score: ${Math.round(seoResult.data.score * 100)}/100`);
            results.passed.push('SEO Audit');
            results.data.seoScore = seoResult.data.score;
        } else {
            console.log(`   ❌ SEO audit failed`);
            results.failed.push('SEO Audit');
        }

        // Best Practices Audit
        console.log('   📚 Best Practices Audit...');
        const bpResult = await callBrowserAPI('/lighthouse/best-practices', 'POST', {});
        if (bpResult.status === 200 && bpResult.data?.score !== undefined) {
            console.log(`   ✅ Best Practices Score: ${Math.round(bpResult.data.score * 100)}/100`);
            results.passed.push('Best Practices Audit');
            results.data.bestPracticesScore = bpResult.data.score;
        } else {
            console.log(`   ❌ Best practices audit failed`);
            results.failed.push('Best Practices Audit');
        }
        console.log();

        // 9. Get Page Info
        console.log('9️⃣ Getting Page Information');
        const pageInfoResult = await callBrowserAPI('/page-info', 'GET');
        console.log(`   Status: ${pageInfoResult.status}`);
        if (pageInfoResult.status === 200) {
            console.log('   ✅ Page info retrieved');
            console.log(`   📄 Title: ${pageInfoResult.data?.title}`);
            console.log(`   🔗 URL: ${pageInfoResult.data?.url}`);
            results.passed.push('Page Info');
            results.data.pageInfo = pageInfoResult.data;
        } else {
            console.log(`   ❌ Page info failed`);
            results.failed.push('Page Info');
        }
        console.log();

        // 10. Clear Logs
        console.log('🔟 Clearing Browser Logs');
        const clearResult = await callBrowserAPI('/clear', 'POST', {});
        console.log(`   Status: ${clearResult.status}`);
        if (clearResult.status === 200) {
            console.log('   ✅ Logs cleared successfully');
            results.passed.push('Clear Logs');
        } else {
            console.log(`   ❌ Clear logs failed`);
            results.failed.push('Clear Logs');
        }
        console.log();

    } catch (error) {
        console.error('❌ Test execution error:', error.message);
        results.error = error.message;
    }

    // Print summary
    console.log('================================================================');
    console.log('📊 BROWSER OPERATIONS TEST SUMMARY\n');
    console.log(`✅ Passed: ${results.passed.length} operations`);
    console.log(`❌ Failed: ${results.failed.length} operations`);
    console.log(`📈 Success Rate: ${Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100)}%`);

    if (results.passed.length > 0) {
        console.log('\n✅ Successful Operations:');
        results.passed.forEach(op => console.log(`   ✓ ${op}`));
    }

    if (results.failed.length > 0) {
        console.log('\n❌ Failed Operations:');
        results.failed.forEach(op => console.log(`   ✗ ${op}`));
    }

    // Show collected data summary
    console.log('\n📦 Data Collected:');
    if (results.data.screenshot) {
        console.log(`   📸 Screenshot: ${results.data.screenshot}`);
    }
    if (results.data.consoleLogs) {
        console.log(`   📋 Console Logs: ${results.data.consoleLogs.length} entries`);
    }
    if (results.data.consoleErrors) {
        console.log(`   🔴 Console Errors: ${results.data.consoleErrors.length} entries`);
    }
    if (results.data.networkLogs) {
        console.log(`   🌐 Network Logs: ${results.data.networkLogs.length} requests`);
    }
    if (results.data.networkErrors) {
        console.log(`   ⚠️ Network Errors: ${results.data.networkErrors.length} errors`);
    }
    if (results.data.performanceScore !== undefined) {
        console.log(`   ⚡ Performance Score: ${Math.round(results.data.performanceScore * 100)}/100`);
    }
    if (results.data.accessibilityScore !== undefined) {
        console.log(`   ♿ Accessibility Score: ${Math.round(results.data.accessibilityScore * 100)}/100`);
    }
    if (results.data.seoScore !== undefined) {
        console.log(`   🔍 SEO Score: ${Math.round(results.data.seoScore * 100)}/100`);
    }
    if (results.data.bestPracticesScore !== undefined) {
        console.log(`   📚 Best Practices Score: ${Math.round(results.data.bestPracticesScore * 100)}/100`);
    }

    console.log('\n================================================================');
    console.log('📅 Test Date:', new Date().toISOString());
    console.log('================================================================\n');

    // Save results to file
    fs.writeFileSync('browser-test-results.json', JSON.stringify(results, null, 2));
    console.log('💾 Results saved to browser-test-results.json');

    // Generate HTML report
    const htmlReport = generateHTMLReport(results);
    fs.writeFileSync('browser-test-report.html', htmlReport);
    console.log('📄 HTML report saved to browser-test-report.html\n');
}

// Generate HTML report
function generateHTMLReport(results) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RapidTriageME Browser Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-card h3 {
            margin: 0;
            color: #667eea;
            font-size: 36px;
        }
        .stat-card p {
            margin: 5px 0 0 0;
            color: #666;
        }
        .success { color: #10b981; }
        .error { color: #ef4444; }
        .results-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        .result-section {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
        }
        .result-section h2 {
            margin-top: 0;
            color: #333;
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        li:last-child {
            border-bottom: none;
        }
        .score {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: bold;
            margin-left: 10px;
        }
        .high-score { background: #d1fae5; color: #065f46; }
        .medium-score { background: #fed7aa; color: #92400e; }
        .low-score { background: #fee2e2; color: #991b1b; }
        .screenshot {
            max-width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        .metadata {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-top: 30px;
        }
        .metadata p {
            margin: 5px 0;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 RapidTriageME Browser Test Report</h1>

        <div class="summary">
            <div class="stat-card">
                <h3 class="success">${results.passed.length}</h3>
                <p>Tests Passed</p>
            </div>
            <div class="stat-card">
                <h3 class="error">${results.failed.length}</h3>
                <p>Tests Failed</p>
            </div>
            <div class="stat-card">
                <h3>${Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100)}%</h3>
                <p>Success Rate</p>
            </div>
        </div>

        <div class="results-grid">
            <div class="result-section">
                <h2>✅ Successful Operations</h2>
                <ul>
                    ${results.passed.map(op => `<li>✓ ${op}</li>`).join('')}
                </ul>
            </div>

            ${results.failed.length > 0 ? `
            <div class="result-section">
                <h2>❌ Failed Operations</h2>
                <ul>
                    ${results.failed.map(op => `<li>✗ ${op}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>

        ${results.data.performanceScore !== undefined ? `
        <div class="result-section">
            <h2>📊 Lighthouse Scores</h2>
            <ul>
                <li>Performance <span class="score ${results.data.performanceScore > 0.8 ? 'high-score' : results.data.performanceScore > 0.5 ? 'medium-score' : 'low-score'}">${Math.round(results.data.performanceScore * 100)}/100</span></li>
                <li>Accessibility <span class="score ${results.data.accessibilityScore > 0.8 ? 'high-score' : results.data.accessibilityScore > 0.5 ? 'medium-score' : 'low-score'}">${Math.round(results.data.accessibilityScore * 100)}/100</span></li>
                <li>SEO <span class="score ${results.data.seoScore > 0.8 ? 'high-score' : results.data.seoScore > 0.5 ? 'medium-score' : 'low-score'}">${Math.round(results.data.seoScore * 100)}/100</span></li>
                <li>Best Practices <span class="score ${results.data.bestPracticesScore > 0.8 ? 'high-score' : results.data.bestPracticesScore > 0.5 ? 'medium-score' : 'low-score'}">${Math.round(results.data.bestPracticesScore * 100)}/100</span></li>
            </ul>
        </div>
        ` : ''}

        <div class="metadata">
            <p><strong>Test Date:</strong> ${results.timestamp}</p>
            <p><strong>Target URL:</strong> ${TARGET_URL}</p>
            <p><strong>Search Query:</strong> "${SEARCH_QUERY}"</p>
            ${results.data.pageInfo ? `
            <p><strong>Final Page Title:</strong> ${results.data.pageInfo.title}</p>
            <p><strong>Final URL:</strong> ${results.data.pageInfo.url}</p>
            ` : ''}
            ${results.data.consoleLogs ? `<p><strong>Console Logs:</strong> ${results.data.consoleLogs.length} entries</p>` : ''}
            ${results.data.networkLogs ? `<p><strong>Network Requests:</strong> ${results.data.networkLogs.length} requests</p>` : ''}
        </div>
    </div>
</body>
</html>`;
}

// Run the tests
testBrowserOperations().catch(console.error);