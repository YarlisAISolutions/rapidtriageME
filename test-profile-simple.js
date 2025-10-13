#!/usr/bin/env node

/**
 * Simple Profile Page Testing Script
 * Compatible testing approach for profile page functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class SimpleProfileTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            url: 'https://rapidtriage.me/profile',
            issues: [],
            networkErrors: [],
            consoleErrors: [],
            tests: {}
        };
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async initialize() {
        console.log('🚀 Starting Profile Page Test...');

        this.browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: ['--disable-web-security', '--no-sandbox']
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });

        // Monitor console errors
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                this.results.consoleErrors.push({
                    timestamp: new Date().toISOString(),
                    text: msg.text(),
                    type: msg.type()
                });
                console.log('❌ Console Error:', msg.text());
            }
        });

        // Monitor network errors
        this.page.on('response', (response) => {
            if (response.status() >= 400) {
                this.results.networkErrors.push({
                    timestamp: new Date().toISOString(),
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText()
                });
                console.log(`❌ Network Error: ${response.status()} - ${response.url()}`);
            }
        });
    }

    async navigateAndTest() {
        console.log('📍 Navigating to profile page...');

        try {
            await this.page.goto('https://rapidtriage.me/profile', {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            // Take screenshot
            if (!fs.existsSync('test-results')) {
                fs.mkdirSync('test-results');
            }

            await this.page.screenshot({
                path: 'test-results/profile-page.png',
                fullPage: true
            });

            console.log('✅ Screenshot saved: test-results/profile-page.png');

        } catch (error) {
            this.results.issues.push({
                type: 'Navigation',
                description: `Failed to navigate: ${error.message}`,
                severity: 'Critical'
            });
            console.log('❌ Navigation failed:', error.message);
            return false;
        }

        await this.sleep(2000);
        return true;
    }

    async testTabs() {
        console.log('🔍 Testing tabs...');

        const tabNames = ['General', 'Security', 'Subscription', 'Usage'];

        for (const tabName of tabNames) {
            try {
                console.log(`  Testing ${tabName} tab...`);

                // Find tab by text content
                const tabFound = await this.page.evaluate((name) => {
                    const elements = Array.from(document.querySelectorAll('*'));
                    const tab = elements.find(el =>
                        el.textContent &&
                        el.textContent.trim().toLowerCase().includes(name.toLowerCase()) &&
                        (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || el.onclick)
                    );

                    if (tab) {
                        tab.click();
                        return true;
                    }
                    return false;
                }, tabName);

                if (tabFound) {
                    await this.sleep(1000);

                    // Take screenshot of tab
                    await this.page.screenshot({
                        path: `test-results/tab-${tabName.toLowerCase()}.png`,
                        fullPage: true
                    });

                    this.results.tests[`${tabName}_tab`] = {
                        status: 'passed',
                        description: `${tabName} tab is clickable and loads content`
                    };

                    console.log(`  ✅ ${tabName} tab working`);
                } else {
                    this.results.tests[`${tabName}_tab`] = {
                        status: 'failed',
                        description: `${tabName} tab not found or not clickable`
                    };

                    this.results.issues.push({
                        type: 'UI',
                        description: `${tabName} tab not found`,
                        severity: 'High'
                    });

                    console.log(`  ❌ ${tabName} tab not found`);
                }

            } catch (error) {
                this.results.tests[`${tabName}_tab`] = {
                    status: 'error',
                    description: `Error testing ${tabName} tab: ${error.message}`
                };

                console.log(`  ❌ ${tabName} tab error:`, error.message);
            }
        }
    }

    async testForms() {
        console.log('📝 Testing forms...');

        try {
            // Test input fields
            const inputs = await this.page.$$('input[type="text"], input[type="email"], textarea');
            console.log(`  Found ${inputs.length} input fields`);

            let inputsWorking = 0;
            for (let i = 0; i < inputs.length; i++) {
                try {
                    const input = inputs[i];

                    // Get input details
                    const inputInfo = await input.evaluate(el => ({
                        type: el.type,
                        name: el.name || el.id || `input-${Math.random()}`,
                        placeholder: el.placeholder,
                        readonly: el.readOnly,
                        disabled: el.disabled
                    }));

                    if (!inputInfo.readonly && !inputInfo.disabled) {
                        await input.click();
                        await input.focus();
                        await this.sleep(100);

                        // Clear and type test value
                        await input.evaluate(el => el.value = '');
                        await input.type('test-value');

                        inputsWorking++;
                        console.log(`  ✅ Input "${inputInfo.name}" working`);
                    } else {
                        console.log(`  ⏭️  Input "${inputInfo.name}" skipped (readonly/disabled)`);
                    }

                } catch (error) {
                    console.log(`  ❌ Input ${i} error:`, error.message);
                }
            }

            this.results.tests['form_inputs'] = {
                status: inputsWorking > 0 ? 'passed' : 'failed',
                description: `${inputsWorking}/${inputs.length} input fields working`
            };

            // Test submit buttons
            const submitButtons = await this.page.$$('button[type="submit"], .submit-btn, button');
            console.log(`  Found ${submitButtons.length} buttons`);

            this.results.tests['submit_buttons'] = {
                status: submitButtons.length > 0 ? 'passed' : 'failed',
                description: `${submitButtons.length} buttons found`
            };

        } catch (error) {
            this.results.issues.push({
                type: 'Form',
                description: `Form testing error: ${error.message}`,
                severity: 'Medium'
            });

            console.log('  ❌ Form testing error:', error.message);
        }
    }

    async testSecurity() {
        console.log('🔒 Testing security features...');

        try {
            // Look for 2FA toggle
            const twoFAElements = await this.page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*'));
                const twoFARelated = elements.filter(el =>
                    el.textContent &&
                    (el.textContent.toLowerCase().includes('two-factor') ||
                     el.textContent.toLowerCase().includes('2fa') ||
                     el.textContent.toLowerCase().includes('authentication'))
                );
                return twoFARelated.length;
            });

            this.results.tests['2fa_elements'] = {
                status: twoFAElements > 0 ? 'passed' : 'failed',
                description: `${twoFAElements} 2FA-related elements found`
            };

            console.log(`  ${twoFAElements > 0 ? '✅' : '❌'} 2FA elements: ${twoFAElements}`);

            // Look for password fields
            const passwordFields = await this.page.$$('input[type="password"]');
            this.results.tests['password_fields'] = {
                status: passwordFields.length > 0 ? 'passed' : 'failed',
                description: `${passwordFields.length} password fields found`
            };

            console.log(`  ${passwordFields.length > 0 ? '✅' : '❌'} Password fields: ${passwordFields.length}`);

        } catch (error) {
            this.results.issues.push({
                type: 'Security',
                description: `Security testing error: ${error.message}`,
                severity: 'Medium'
            });

            console.log('  ❌ Security testing error:', error.message);
        }
    }

    async testSubscription() {
        console.log('💳 Testing subscription elements...');

        try {
            // Look for subscription-related elements
            const subscriptionElements = await this.page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*'));
                const subRelated = elements.filter(el =>
                    el.textContent &&
                    (el.textContent.toLowerCase().includes('subscription') ||
                     el.textContent.toLowerCase().includes('billing') ||
                     el.textContent.toLowerCase().includes('plan') ||
                     el.textContent.toLowerCase().includes('upgrade'))
                );
                return subRelated.length;
            });

            this.results.tests['subscription_elements'] = {
                status: subscriptionElements > 0 ? 'passed' : 'failed',
                description: `${subscriptionElements} subscription-related elements found`
            };

            console.log(`  ${subscriptionElements > 0 ? '✅' : '❌'} Subscription elements: ${subscriptionElements}`);

        } catch (error) {
            console.log('  ❌ Subscription testing error:', error.message);
        }
    }

    generateReport() {
        console.log('📊 Generating report...');

        const summary = {
            totalIssues: this.results.issues.length,
            networkErrors: this.results.networkErrors.length,
            consoleErrors: this.results.consoleErrors.length,
            testsTotal: Object.keys(this.results.tests).length,
            testsPassed: Object.values(this.results.tests).filter(t => t.status === 'passed').length,
            testsFailed: Object.values(this.results.tests).filter(t => t.status === 'failed').length,
            testsError: Object.values(this.results.tests).filter(t => t.status === 'error').length
        };

        const report = {
            ...this.results,
            summary
        };

        // Save JSON report
        fs.writeFileSync('test-results/profile-test-simple.json', JSON.stringify(report, null, 2));

        // Generate HTML report
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Profile Page Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .issue { background: #ffe6e6; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .test { padding: 5px 0; }
        .passed { color: green; }
        .failed { color: red; }
        .error { color: orange; }
        .network-error { background: #ffebe6; padding: 8px; margin: 5px 0; border-radius: 4px; }
        .console-error { background: #fff0e6; padding: 8px; margin: 5px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Profile Page Test Report</h1>
        <p><strong>URL:</strong> ${report.url}</p>
        <p><strong>Test Date:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Issues:</strong> ${summary.totalIssues}</p>
        <p><strong>Network Errors:</strong> ${summary.networkErrors}</p>
        <p><strong>Console Errors:</strong> ${summary.consoleErrors}</p>
        <p><strong>Tests:</strong> ${summary.testsPassed} passed, ${summary.testsFailed} failed, ${summary.testsError} errors</p>
    </div>

    <h2>Issues Found</h2>
    ${report.issues.length === 0 ? '<p>No issues found!</p>' :
      report.issues.map(issue => `
        <div class="issue">
            <strong>${issue.type}</strong> (${issue.severity}): ${issue.description}
        </div>
      `).join('')}

    <h2>Network Errors</h2>
    ${report.networkErrors.length === 0 ? '<p>No network errors!</p>' :
      report.networkErrors.map(error => `
        <div class="network-error">
            ${error.status} ${error.statusText} - ${error.url}
        </div>
      `).join('')}

    <h2>Console Errors</h2>
    ${report.consoleErrors.length === 0 ? '<p>No console errors!</p>' :
      report.consoleErrors.map(error => `
        <div class="console-error">
            ${error.text}
        </div>
      `).join('')}

    <h2>Test Results</h2>
    ${Object.entries(report.tests).map(([test, result]) => `
        <div class="test">
            <span class="${result.status}">[${result.status.toUpperCase()}]</span>
            <strong>${test}:</strong> ${result.description}
        </div>
    `).join('')}

</body>
</html>`;

        fs.writeFileSync('test-results/profile-test-simple.html', html);

        console.log('✅ Reports saved:');
        console.log('  - test-results/profile-test-simple.json');
        console.log('  - test-results/profile-test-simple.html');

        return report;
    }

    async run() {
        try {
            await this.initialize();

            if (await this.navigateAndTest()) {
                await this.testTabs();
                await this.testForms();
                await this.testSecurity();
                await this.testSubscription();
            }

            const report = this.generateReport();

            console.log('\n📋 FINAL SUMMARY:');
            console.log(`Issues Found: ${report.summary.totalIssues}`);
            console.log(`Network Errors: ${report.summary.networkErrors}`);
            console.log(`Console Errors: ${report.summary.consoleErrors}`);
            console.log(`Tests Passed: ${report.summary.testsPassed}/${report.summary.testsTotal}`);

            return report;

        } catch (error) {
            console.error('❌ Test failed:', error);
            return null;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run test
if (require.main === module) {
    const tester = new SimpleProfileTester();
    tester.run().then((report) => {
        if (report) {
            console.log('\n✅ Test completed! Check test-results/ for detailed reports.');
            process.exit(0);
        } else {
            console.log('\n❌ Test failed!');
            process.exit(1);
        }
    });
}

module.exports = SimpleProfileTester;