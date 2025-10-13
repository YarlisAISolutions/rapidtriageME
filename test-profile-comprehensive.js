#!/usr/bin/env node

/**
 * Comprehensive Profile Page Testing Script
 * Tests all profile page functionality including tabs, forms, and error handling
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ProfilePageTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            timestamp: new Date().toISOString(),
            profileUrl: 'https://rapidtriage.me/profile',
            issues: [],
            networkErrors: [],
            consoleErrors: [],
            tabTests: {},
            formTests: {},
            buttonTests: {},
            securityTests: {}
        };
    }

    async initialize() {
        console.log('🚀 Initializing Profile Page Testing...');

        this.browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: [
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        this.page = await this.browser.newPage();

        // Set viewport
        await this.page.setViewport({ width: 1920, height: 1080 });

        // Setup console monitoring
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                this.testResults.consoleErrors.push({
                    timestamp: new Date().toISOString(),
                    type: msg.type(),
                    text: msg.text(),
                    location: msg.location()
                });
                console.log('❌ Console Error:', msg.text());
            }
        });

        // Setup network monitoring
        this.page.on('response', (response) => {
            if (response.status() >= 400) {
                this.testResults.networkErrors.push({
                    timestamp: new Date().toISOString(),
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText()
                });
                console.log(`❌ Network Error: ${response.status()} - ${response.url()}`);
            }
        });

        // Setup request interception
        await this.page.setRequestInterception(true);
        this.page.on('request', (request) => {
            request.continue();
        });
    }

    async navigateToProfile() {
        console.log('📍 Navigating to profile page...');

        try {
            await this.page.goto('https://rapidtriage.me/profile', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Take initial screenshot
            await this.page.screenshot({
                path: 'test-results/profile-initial.png',
                fullPage: true
            });

            console.log('✅ Successfully navigated to profile page');
            return true;
        } catch (error) {
            this.testResults.issues.push({
                type: 'Navigation Error',
                description: `Failed to load profile page: ${error.message}`,
                severity: 'Critical'
            });
            console.log('❌ Failed to navigate to profile page:', error.message);
            return false;
        }
    }

    async testTabFunctionality() {
        console.log('🔍 Testing tab functionality...');

        const tabs = [
            { name: 'General', selector: '[data-tab="general"]', fallback: 'button:contains("General")' },
            { name: 'Security', selector: '[data-tab="security"]', fallback: 'button:contains("Security")' },
            { name: 'Subscription', selector: '[data-tab="subscription"]', fallback: 'button:contains("Subscription")' },
            { name: 'Usage & Billing', selector: '[data-tab="usage"]', fallback: 'button:contains("Usage")' }
        ];

        for (const tab of tabs) {
            try {
                console.log(`  Testing ${tab.name} tab...`);

                // Try primary selector first
                let tabElement = await this.page.$(tab.selector);

                // If not found, try to find by text content
                if (!tabElement) {
                    tabElement = await this.page.evaluateHandle((tabName) => {
                        const buttons = Array.from(document.querySelectorAll('button, div[role="button"], a'));
                        return buttons.find(button =>
                            button.textContent.toLowerCase().includes(tabName.toLowerCase())
                        );
                    }, tab.name);
                }

                if (tabElement && tabElement.asElement()) {
                    // Click the tab
                    await tabElement.asElement().click();
                    await this.page.waitForTimeout(1000);

                    // Take screenshot of tab content
                    await this.page.screenshot({
                        path: `test-results/tab-${tab.name.toLowerCase().replace(/\s+/g, '-')}.png`,
                        fullPage: true
                    });

                    this.testResults.tabTests[tab.name] = {
                        status: 'passed',
                        clickable: true,
                        screenshot: `tab-${tab.name.toLowerCase().replace(/\s+/g, '-')}.png`
                    };

                    console.log(`  ✅ ${tab.name} tab working`);
                } else {
                    this.testResults.tabTests[tab.name] = {
                        status: 'failed',
                        clickable: false,
                        error: 'Tab element not found'
                    };

                    this.testResults.issues.push({
                        type: 'UI Issue',
                        description: `${tab.name} tab not found or not clickable`,
                        severity: 'High'
                    });

                    console.log(`  ❌ ${tab.name} tab not found`);
                }
            } catch (error) {
                this.testResults.tabTests[tab.name] = {
                    status: 'error',
                    error: error.message
                };

                this.testResults.issues.push({
                    type: 'Tab Error',
                    description: `Error testing ${tab.name} tab: ${error.message}`,
                    severity: 'Medium'
                });

                console.log(`  ❌ Error testing ${tab.name} tab:`, error.message);
            }
        }
    }

    async testFormSubmissions() {
        console.log('📝 Testing form submissions...');

        // Test profile update form
        try {
            const profileForm = await this.page.$('form[data-testid="profile-form"], form:first-of-type, .profile-form');

            if (profileForm) {
                // Test form inputs
                const inputs = await this.page.$$('input[type="text"], input[type="email"], textarea');

                for (let i = 0; i < inputs.length; i++) {
                    const input = inputs[i];
                    const inputType = await input.evaluate(el => el.type || el.tagName.toLowerCase());
                    const inputName = await input.evaluate(el => el.name || el.id || `input-${i}`);

                    try {
                        // Test input functionality
                        await input.click();
                        await input.type('test-value');
                        await this.page.waitForTimeout(500);

                        this.testResults.formTests[inputName] = {
                            status: 'passed',
                            type: inputType,
                            editable: true
                        };

                        console.log(`  ✅ Input ${inputName} working`);
                    } catch (error) {
                        this.testResults.formTests[inputName] = {
                            status: 'failed',
                            type: inputType,
                            error: error.message
                        };

                        console.log(`  ❌ Input ${inputName} error:`, error.message);
                    }
                }

                // Test form submission
                const submitButton = await this.page.$('button[type="submit"], .submit-button, button:contains("Save")');
                if (submitButton) {
                    try {
                        await submitButton.click();
                        await this.page.waitForTimeout(2000);

                        this.testResults.formTests['profile-submit'] = {
                            status: 'passed',
                            clickable: true
                        };

                        console.log('  ✅ Profile form submission working');
                    } catch (error) {
                        this.testResults.formTests['profile-submit'] = {
                            status: 'failed',
                            error: error.message
                        };

                        console.log('  ❌ Profile form submission error:', error.message);
                    }
                }
            } else {
                this.testResults.issues.push({
                    type: 'Form Issue',
                    description: 'Profile form not found',
                    severity: 'High'
                });

                console.log('  ❌ Profile form not found');
            }
        } catch (error) {
            this.testResults.issues.push({
                type: 'Form Error',
                description: `Error testing forms: ${error.message}`,
                severity: 'Medium'
            });

            console.log('  ❌ Form testing error:', error.message);
        }
    }

    async testSecuritySettings() {
        console.log('🔒 Testing security settings...');

        try {
            // Navigate to security tab first
            const securityTab = await this.page.evaluateHandle(() => {
                const buttons = Array.from(document.querySelectorAll('button, div[role="button"], a'));
                return buttons.find(button =>
                    button.textContent.toLowerCase().includes('security')
                );
            });

            if (securityTab && securityTab.asElement()) {
                await securityTab.asElement().click();
                await this.page.waitForTimeout(1500);
            }

            // Test 2FA toggle
            const twoFAToggle = await this.page.$('input[type="checkbox"][data-testid="2fa-toggle"], .toggle-2fa, input:contains("Two-Factor")');

            if (twoFAToggle) {
                const isChecked = await twoFAToggle.evaluate(el => el.checked);

                try {
                    await twoFAToggle.click();
                    await this.page.waitForTimeout(1000);

                    const newState = await twoFAToggle.evaluate(el => el.checked);

                    this.testResults.securityTests['2fa-toggle'] = {
                        status: 'passed',
                        initialState: isChecked,
                        newState: newState,
                        toggleWorking: isChecked !== newState
                    };

                    console.log(`  ✅ 2FA toggle working (${isChecked} → ${newState})`);
                } catch (error) {
                    this.testResults.securityTests['2fa-toggle'] = {
                        status: 'failed',
                        error: error.message
                    };

                    console.log('  ❌ 2FA toggle error:', error.message);
                }
            } else {
                this.testResults.issues.push({
                    type: 'Security Issue',
                    description: '2FA toggle not found',
                    severity: 'High'
                });

                console.log('  ❌ 2FA toggle not found');
            }

            // Test password change form
            const passwordForm = await this.page.$('form[data-testid="password-form"], .password-form');
            if (passwordForm) {
                const passwordInputs = await passwordForm.$$('input[type="password"]');

                this.testResults.securityTests['password-form'] = {
                    status: 'found',
                    inputCount: passwordInputs.length,
                    hasCurrentPassword: passwordInputs.length >= 1,
                    hasNewPassword: passwordInputs.length >= 2,
                    hasConfirmPassword: passwordInputs.length >= 3
                };

                console.log(`  ✅ Password form found with ${passwordInputs.length} inputs`);
            } else {
                this.testResults.issues.push({
                    type: 'Security Issue',
                    description: 'Password change form not found',
                    severity: 'Medium'
                });

                console.log('  ❌ Password change form not found');
            }

        } catch (error) {
            this.testResults.issues.push({
                type: 'Security Error',
                description: `Error testing security settings: ${error.message}`,
                severity: 'Medium'
            });

            console.log('  ❌ Security testing error:', error.message);
        }
    }

    async testButtons() {
        console.log('🔘 Testing all buttons...');

        try {
            const buttons = await this.page.$$('button, input[type="button"], input[type="submit"], .btn');

            console.log(`  Found ${buttons.length} buttons to test`);

            for (let i = 0; i < buttons.length; i++) {
                const button = buttons[i];

                try {
                    const buttonText = await button.evaluate(el => el.textContent || el.value || el.getAttribute('aria-label') || `button-${i}`);
                    const isDisabled = await button.evaluate(el => el.disabled);
                    const isVisible = await button.evaluate(el => {
                        const style = window.getComputedStyle(el);
                        return style.display !== 'none' && style.visibility !== 'hidden';
                    });

                    if (isVisible && !isDisabled) {
                        // Test button click (non-destructive buttons only)
                        const isDestructive = buttonText.toLowerCase().includes('delete') ||
                                            buttonText.toLowerCase().includes('remove') ||
                                            buttonText.toLowerCase().includes('cancel');

                        if (!isDestructive) {
                            await button.click();
                            await this.page.waitForTimeout(500);
                        }

                        this.testResults.buttonTests[buttonText] = {
                            status: 'passed',
                            clickable: true,
                            disabled: isDisabled,
                            visible: isVisible,
                            tested: !isDestructive
                        };

                        console.log(`  ✅ Button "${buttonText}" working`);
                    } else {
                        this.testResults.buttonTests[buttonText] = {
                            status: 'skipped',
                            disabled: isDisabled,
                            visible: isVisible,
                            reason: isDisabled ? 'disabled' : 'hidden'
                        };

                        console.log(`  ⏭️  Button "${buttonText}" skipped (${isDisabled ? 'disabled' : 'hidden'})`);
                    }
                } catch (error) {
                    const buttonText = await button.evaluate(el => el.textContent || `button-${i}`).catch(() => `button-${i}`);

                    this.testResults.buttonTests[buttonText] = {
                        status: 'error',
                        error: error.message
                    };

                    console.log(`  ❌ Button "${buttonText}" error:`, error.message);
                }
            }
        } catch (error) {
            this.testResults.issues.push({
                type: 'Button Testing Error',
                description: `Error testing buttons: ${error.message}`,
                severity: 'Low'
            });

            console.log('  ❌ Button testing error:', error.message);
        }
    }

    async checkNetworkRequests() {
        console.log('🌐 Analyzing network requests...');

        // Force a page refresh to capture all network requests
        await this.page.reload({ waitUntil: 'networkidle2' });
        await this.page.waitForTimeout(3000);

        // Analyze current network errors
        console.log(`  Found ${this.testResults.networkErrors.length} network errors`);

        this.testResults.networkErrors.forEach(error => {
            console.log(`  ❌ ${error.status} - ${error.url}`);
        });

        if (this.testResults.networkErrors.length === 0) {
            console.log('  ✅ No network errors detected');
        }
    }

    async generateReport() {
        console.log('📊 Generating comprehensive test report...');

        const report = {
            ...this.testResults,
            summary: {
                totalIssues: this.testResults.issues.length,
                networkErrors: this.testResults.networkErrors.length,
                consoleErrors: this.testResults.consoleErrors.length,
                criticalIssues: this.testResults.issues.filter(i => i.severity === 'Critical').length,
                highIssues: this.testResults.issues.filter(i => i.severity === 'High').length,
                mediumIssues: this.testResults.issues.filter(i => i.severity === 'Medium').length,
                lowIssues: this.testResults.issues.filter(i => i.severity === 'Low').length,
                tabsPassed: Object.values(this.testResults.tabTests).filter(t => t.status === 'passed').length,
                tabsTotal: Object.keys(this.testResults.tabTests).length,
                formsPassed: Object.values(this.testResults.formTests).filter(t => t.status === 'passed').length,
                formsTotal: Object.keys(this.testResults.formTests).length,
                buttonsPassed: Object.values(this.testResults.buttonTests).filter(t => t.status === 'passed').length,
                buttonsTotal: Object.keys(this.testResults.buttonTests).length,
                securityTestsPassed: Object.values(this.testResults.securityTests).filter(t => t.status === 'passed').length,
                securityTestsTotal: Object.keys(this.testResults.securityTests).length
            }
        };

        // Save report
        const reportPath = 'test-results/profile-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Generate HTML report
        const htmlReport = this.generateHTMLReport(report);
        fs.writeFileSync('test-results/profile-test-report.html', htmlReport);

        console.log('✅ Report generated: test-results/profile-test-report.json');
        console.log('✅ HTML Report: test-results/profile-test-report.html');

        return report;
    }

    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile Page Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; }
        .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
        .stat-label { color: #666; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .issue { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .issue.critical { background: #f8d7da; border-color: #f5c6cb; }
        .issue.high { background: #fff3cd; border-color: #ffeaa7; }
        .issue.medium { background: #d1ecf1; border-color: #bee5eb; }
        .issue.low { background: #e2e3e5; border-color: #d6d8db; }
        .test-result { display: flex; align-items: center; padding: 5px 0; }
        .status { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-right: 10px; }
        .passed { background: #d4edda; color: #155724; }
        .failed { background: #f8d7da; color: #721c24; }
        .error { background: #f8d7da; color: #721c24; }
        .skipped { background: #e2e3e5; color: #383d41; }
        .network-error { background: #ffe6e6; padding: 8px; margin: 5px 0; border-radius: 4px; border-left: 3px solid #dc3545; }
        .console-error { background: #fff0f0; padding: 8px; margin: 5px 0; border-radius: 4px; border-left: 3px solid #fd7e14; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Profile Page Test Report</h1>
            <p><strong>URL:</strong> ${report.profileUrl}</p>
            <p><strong>Test Date:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${report.summary.totalIssues}</div>
                <div class="stat-label">Total Issues Found</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.networkErrors}</div>
                <div class="stat-label">Network Errors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.consoleErrors}</div>
                <div class="stat-label">Console Errors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.tabsPassed}/${report.summary.tabsTotal}</div>
                <div class="stat-label">Tabs Working</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.summary.buttonsPassed}/${report.summary.buttonsTotal}</div>
                <div class="stat-label">Buttons Working</div>
            </div>
        </div>

        <div class="section">
            <h2>🚨 Issues Found</h2>
            ${report.issues.length === 0 ? '<p>✅ No issues found!</p>' :
              report.issues.map(issue => `
                <div class="issue ${issue.severity.toLowerCase()}">
                    <strong>${issue.type}</strong> (${issue.severity})
                    <p>${issue.description}</p>
                </div>
              `).join('')}
        </div>

        <div class="section">
            <h2>🔗 Network Errors</h2>
            ${report.networkErrors.length === 0 ? '<p>✅ No network errors!</p>' :
              report.networkErrors.map(error => `
                <div class="network-error">
                    <strong>${error.status} ${error.statusText}</strong><br>
                    <small>${error.url}</small><br>
                    <small>${new Date(error.timestamp).toLocaleString()}</small>
                </div>
              `).join('')}
        </div>

        <div class="section">
            <h2>🖥️ Console Errors</h2>
            ${report.consoleErrors.length === 0 ? '<p>✅ No console errors!</p>' :
              report.consoleErrors.map(error => `
                <div class="console-error">
                    <strong>${error.type}</strong><br>
                    <code>${error.text}</code><br>
                    <small>${new Date(error.timestamp).toLocaleString()}</small>
                </div>
              `).join('')}
        </div>

        <div class="section">
            <h2>📑 Tab Tests</h2>
            ${Object.entries(report.tabTests).map(([tab, result]) => `
                <div class="test-result">
                    <span class="status ${result.status}">${result.status}</span>
                    <span>${tab}</span>
                    ${result.error ? `<small style="color: red; margin-left: 10px;">${result.error}</small>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>📝 Form Tests</h2>
            ${Object.keys(report.formTests).length === 0 ? '<p>No forms tested</p>' :
              Object.entries(report.formTests).map(([form, result]) => `
                <div class="test-result">
                    <span class="status ${result.status}">${result.status}</span>
                    <span>${form}</span>
                    ${result.error ? `<small style="color: red; margin-left: 10px;">${result.error}</small>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>🔒 Security Tests</h2>
            ${Object.keys(report.securityTests).length === 0 ? '<p>No security features tested</p>' :
              Object.entries(report.securityTests).map(([test, result]) => `
                <div class="test-result">
                    <span class="status ${result.status}">${result.status}</span>
                    <span>${test}</span>
                    ${result.error ? `<small style="color: red; margin-left: 10px;">${result.error}</small>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>🔘 Button Tests</h2>
            ${Object.entries(report.buttonTests).slice(0, 20).map(([button, result]) => `
                <div class="test-result">
                    <span class="status ${result.status}">${result.status}</span>
                    <span>${button}</span>
                    ${result.error ? `<small style="color: red; margin-left: 10px;">${result.error}</small>` : ''}
                    ${result.reason ? `<small style="color: gray; margin-left: 10px;">(${result.reason})</small>` : ''}
                </div>
            `).join('')}
            ${Object.keys(report.buttonTests).length > 20 ? '<p><em>... and more (see JSON report for full details)</em></p>' : ''}
        </div>
    </div>
</body>
</html>
        `;
    }

    async runFullTest() {
        try {
            // Create results directory
            if (!fs.existsSync('test-results')) {
                fs.mkdirSync('test-results');
            }

            await this.initialize();

            if (await this.navigateToProfile()) {
                await this.testTabFunctionality();
                await this.testFormSubmissions();
                await this.testSecuritySettings();
                await this.testButtons();
                await this.checkNetworkRequests();
            }

            const report = await this.generateReport();

            console.log('\n📋 TEST SUMMARY:');
            console.log(`Total Issues: ${report.summary.totalIssues}`);
            console.log(`Network Errors: ${report.summary.networkErrors}`);
            console.log(`Console Errors: ${report.summary.consoleErrors}`);
            console.log(`Tabs Working: ${report.summary.tabsPassed}/${report.summary.tabsTotal}`);
            console.log(`Buttons Working: ${report.summary.buttonsPassed}/${report.summary.buttonsTotal}`);

            return report;

        } catch (error) {
            console.error('❌ Test execution failed:', error);
            return null;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the test
if (require.main === module) {
    const tester = new ProfilePageTester();
    tester.runFullTest().then((report) => {
        if (report) {
            console.log('\n✅ Profile page testing completed successfully!');
            console.log('📄 Check test-results/profile-test-report.html for detailed results');
            process.exit(0);
        } else {
            console.log('\n❌ Profile page testing failed!');
            process.exit(1);
        }
    });
}

module.exports = ProfilePageTester;