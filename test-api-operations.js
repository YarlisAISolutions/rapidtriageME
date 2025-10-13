const https = require('https');

// Configuration
const API_BASE_URL = 'https://rapidtriage.me';
const AUTH_TOKEN = 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8';
const TARGET_URL = 'https://www.google.com';
const SEARCH_QUERY = 'crypto market in 2025';

// Helper function to make API calls
async function callAPI(endpoint, method = 'POST', body = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_BASE_URL}${endpoint}`);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        status: res.statusCode,
                        headers: res.headers,
                        data: data ? JSON.parse(data) : null
                    };
                    resolve(result);
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        if (method === 'POST' && body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

// Test all API operations
async function testAllAPIOperations() {
    console.log('🚀 Testing RapidTriageME API Operations');
    console.log('=========================================\n');

    const results = {
        passed: [],
        failed: [],
        timestamp: new Date().toISOString()
    };

    try {
        // 1. Navigate to Google
        console.log('1️⃣ Testing Navigation API - Going to Google.com');
        const navigateResult = await callAPI('/api/navigate', 'POST', {
            url: TARGET_URL
        });
        console.log(`   Status: ${navigateResult.status}`);
        if (navigateResult.status === 200) {
            console.log('   ✅ Successfully navigated to Google.com');
            results.passed.push('Navigate to Google');
        } else {
            console.log(`   ❌ Navigation failed: ${JSON.stringify(navigateResult.data)}`);
            results.failed.push('Navigate to Google');
        }
        console.log();

        // Wait a moment for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. Execute JavaScript to search
        console.log('2️⃣ Testing JavaScript Execution - Searching for "crypto market in 2025"');
        const searchScript = `
            const searchBox = document.querySelector('input[name="q"], textarea[name="q"]');
            if (searchBox) {
                searchBox.value = "${SEARCH_QUERY}";
                searchBox.dispatchEvent(new Event('input', { bubbles: true }));
                const form = searchBox.closest('form');
                if (form) {
                    form.submit();
                    return 'Search submitted';
                }
                return 'Search box filled';
            }
            return 'Search box not found';
        `;

        const executeResult = await callAPI('/api/execute-js', 'POST', {
            script: searchScript
        });
        console.log(`   Status: ${executeResult.status}`);
        if (executeResult.status === 200) {
            console.log(`   ✅ JavaScript executed: ${JSON.stringify(executeResult.data)}`);
            results.passed.push('Execute JavaScript');
        } else {
            console.log(`   ❌ Execution failed: ${JSON.stringify(executeResult.data)}`);
            results.failed.push('Execute JavaScript');
        }
        console.log();

        // Wait for search results to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 3. Capture Screenshot
        console.log('3️⃣ Testing Screenshot Capture API');
        const screenshotResult = await callAPI('/api/screenshot', 'POST', {
            fullPage: false
        });
        console.log(`   Status: ${screenshotResult.status}`);
        if (screenshotResult.status === 200) {
            console.log('   ✅ Screenshot captured successfully');
            if (screenshotResult.data?.url) {
                console.log(`   📸 Screenshot URL: ${screenshotResult.data.url}`);
            }
            results.passed.push('Screenshot Capture');
        } else {
            console.log(`   ❌ Screenshot failed: ${JSON.stringify(screenshotResult.data)}`);
            results.failed.push('Screenshot Capture');
        }
        console.log();

        // 4. Get Console Logs
        console.log('4️⃣ Testing Console Logs API');
        const consoleLogsResult = await callAPI('/api/console-logs', 'POST', {});
        console.log(`   Status: ${consoleLogsResult.status}`);
        if (consoleLogsResult.status === 200) {
            const logs = consoleLogsResult.data?.logs || [];
            console.log(`   ✅ Retrieved ${logs.length} console logs`);
            if (logs.length > 0) {
                console.log(`   📋 Sample log: ${logs[0].text?.substring(0, 100)}...`);
            }
            results.passed.push('Console Logs');
        } else {
            console.log(`   ❌ Console logs failed: ${JSON.stringify(consoleLogsResult.data)}`);
            results.failed.push('Console Logs');
        }
        console.log();

        // 5. Get Console Errors
        console.log('5️⃣ Testing Console Errors API');
        const consoleErrorsResult = await callAPI('/api/console-errors', 'POST', {});
        console.log(`   Status: ${consoleErrorsResult.status}`);
        if (consoleErrorsResult.status === 200) {
            const errors = consoleErrorsResult.data?.errors || [];
            console.log(`   ✅ Retrieved ${errors.length} console errors`);
            if (errors.length > 0) {
                console.log(`   🔴 Sample error: ${errors[0].text?.substring(0, 100)}...`);
            }
            results.passed.push('Console Errors');
        } else {
            console.log(`   ❌ Console errors failed: ${JSON.stringify(consoleErrorsResult.data)}`);
            results.failed.push('Console Errors');
        }
        console.log();

        // 6. Get Network Logs
        console.log('6️⃣ Testing Network Logs API');
        const networkLogsResult = await callAPI('/api/network-logs', 'POST', {});
        console.log(`   Status: ${networkLogsResult.status}`);
        if (networkLogsResult.status === 200) {
            const requests = networkLogsResult.data?.requests || [];
            console.log(`   ✅ Retrieved ${requests.length} network requests`);
            if (requests.length > 0) {
                console.log(`   🌐 Sample request: ${requests[0].url?.substring(0, 100)}...`);
            }
            results.passed.push('Network Logs');
        } else {
            console.log(`   ❌ Network logs failed: ${JSON.stringify(networkLogsResult.data)}`);
            results.failed.push('Network Logs');
        }
        console.log();

        // 7. Get Network Errors
        console.log('7️⃣ Testing Network Errors API');
        const networkErrorsResult = await callAPI('/api/network-errors', 'POST', {});
        console.log(`   Status: ${networkErrorsResult.status}`);
        if (networkErrorsResult.status === 200) {
            const errors = networkErrorsResult.data?.errors || [];
            console.log(`   ✅ Retrieved ${errors.length} network errors`);
            if (errors.length > 0) {
                console.log(`   ⚠️ Sample error: ${errors[0].url?.substring(0, 100)}...`);
            }
            results.passed.push('Network Errors');
        } else {
            console.log(`   ❌ Network errors failed: ${JSON.stringify(networkErrorsResult.data)}`);
            results.failed.push('Network Errors');
        }
        console.log();

        // 8. Run Lighthouse Accessibility Audit
        console.log('8️⃣ Testing Lighthouse Accessibility Audit API');
        const accessibilityResult = await callAPI('/api/lighthouse/accessibility', 'POST', {});
        console.log(`   Status: ${accessibilityResult.status}`);
        if (accessibilityResult.status === 200) {
            const score = accessibilityResult.data?.score;
            console.log(`   ✅ Accessibility audit completed`);
            if (score !== undefined) {
                console.log(`   ♿ Accessibility Score: ${Math.round(score * 100)}/100`);
            }
            results.passed.push('Accessibility Audit');
        } else {
            console.log(`   ❌ Accessibility audit failed: ${JSON.stringify(accessibilityResult.data)}`);
            results.failed.push('Accessibility Audit');
        }
        console.log();

        // 9. Run Lighthouse Performance Audit
        console.log('9️⃣ Testing Lighthouse Performance Audit API');
        const performanceResult = await callAPI('/api/lighthouse/performance', 'POST', {});
        console.log(`   Status: ${performanceResult.status}`);
        if (performanceResult.status === 200) {
            const score = performanceResult.data?.score;
            console.log(`   ✅ Performance audit completed`);
            if (score !== undefined) {
                console.log(`   ⚡ Performance Score: ${Math.round(score * 100)}/100`);
            }
            results.passed.push('Performance Audit');
        } else {
            console.log(`   ❌ Performance audit failed: ${JSON.stringify(performanceResult.data)}`);
            results.failed.push('Performance Audit');
        }
        console.log();

        // 10. Run Lighthouse SEO Audit
        console.log('🔟 Testing Lighthouse SEO Audit API');
        const seoResult = await callAPI('/api/lighthouse/seo', 'POST', {});
        console.log(`   Status: ${seoResult.status}`);
        if (seoResult.status === 200) {
            const score = seoResult.data?.score;
            console.log(`   ✅ SEO audit completed`);
            if (score !== undefined) {
                console.log(`   🔍 SEO Score: ${Math.round(score * 100)}/100`);
            }
            results.passed.push('SEO Audit');
        } else {
            console.log(`   ❌ SEO audit failed: ${JSON.stringify(seoResult.data)}`);
            results.failed.push('SEO Audit');
        }
        console.log();

        // 11. Run Best Practices Audit
        console.log('1️⃣1️⃣ Testing Lighthouse Best Practices Audit API');
        const bestPracticesResult = await callAPI('/api/lighthouse/best-practices', 'POST', {});
        console.log(`   Status: ${bestPracticesResult.status}`);
        if (bestPracticesResult.status === 200) {
            const score = bestPracticesResult.data?.score;
            console.log(`   ✅ Best practices audit completed`);
            if (score !== undefined) {
                console.log(`   📊 Best Practices Score: ${Math.round(score * 100)}/100`);
            }
            results.passed.push('Best Practices Audit');
        } else {
            console.log(`   ❌ Best practices audit failed: ${JSON.stringify(bestPracticesResult.data)}`);
            results.failed.push('Best Practices Audit');
        }
        console.log();

        // 12. Inspect Element
        console.log('1️⃣2️⃣ Testing Element Inspection API');
        const inspectResult = await callAPI('/api/inspect-element', 'POST', {
            selector: 'input[name="q"], textarea[name="q"]'
        });
        console.log(`   Status: ${inspectResult.status}`);
        if (inspectResult.status === 200) {
            console.log('   ✅ Element inspection completed');
            if (inspectResult.data?.element) {
                console.log(`   🔍 Element found: ${inspectResult.data.element.tagName}`);
                console.log(`   📝 Attributes: ${JSON.stringify(inspectResult.data.element.attributes)}`);
            }
            results.passed.push('Element Inspection');
        } else {
            console.log(`   ❌ Element inspection failed: ${JSON.stringify(inspectResult.data)}`);
            results.failed.push('Element Inspection');
        }
        console.log();

        // 13. Generate Triage Report
        console.log('1️⃣3️⃣ Testing Triage Report Generation API');
        const reportResult = await callAPI('/api/triage-report', 'POST', {
            includeScreenshot: true,
            includeConsoleLogs: true,
            includeNetworkLogs: true,
            includePerformance: true
        });
        console.log(`   Status: ${reportResult.status}`);
        if (reportResult.status === 200) {
            console.log('   ✅ Triage report generated successfully');
            if (reportResult.data?.reportId) {
                console.log(`   📄 Report ID: ${reportResult.data.reportId}`);
            }
            results.passed.push('Triage Report');
        } else {
            console.log(`   ❌ Triage report failed: ${JSON.stringify(reportResult.data)}`);
            results.failed.push('Triage Report');
        }
        console.log();

        // 14. Clear Browser Data
        console.log('1️⃣4️⃣ Testing Clear Browser Data API');
        const clearResult = await callAPI('/api/clear-browser-data', 'POST', {
            cache: true,
            cookies: true,
            localStorage: true
        });
        console.log(`   Status: ${clearResult.status}`);
        if (clearResult.status === 200) {
            console.log('   ✅ Browser data cleared successfully');
            results.passed.push('Clear Browser Data');
        } else {
            console.log(`   ❌ Clear browser data failed: ${JSON.stringify(clearResult.data)}`);
            results.failed.push('Clear Browser Data');
        }
        console.log();

    } catch (error) {
        console.error('❌ Test execution error:', error.message);
        results.error = error.message;
    }

    // Print summary
    console.log('=========================================');
    console.log('📊 API TEST SUMMARY\n');
    console.log(`✅ Passed: ${results.passed.length} operations`);
    console.log(`❌ Failed: ${results.failed.length} operations`);
    console.log(`📈 Success Rate: ${Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100)}%`);

    console.log('\n✅ Successful Operations:');
    results.passed.forEach(op => console.log(`   - ${op}`));

    if (results.failed.length > 0) {
        console.log('\n❌ Failed Operations:');
        results.failed.forEach(op => console.log(`   - ${op}`));
    }

    console.log('\n=========================================');
    console.log('🎯 Target: Google.com');
    console.log(`🔍 Search Query: "${SEARCH_QUERY}"`);
    console.log('📅 Test Date:', new Date().toISOString());
    console.log('=========================================\n');

    // Save results to file
    const fs = require('fs');
    fs.writeFileSync('api-test-results.json', JSON.stringify(results, null, 2));
    console.log('💾 Results saved to api-test-results.json\n');
}

// Run the tests
testAllAPIOperations().catch(console.error);