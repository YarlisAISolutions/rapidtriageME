#!/usr/bin/env node

/**
 * Specific Profile Tabs Testing
 * Tests the actual tabs visible in the profile page
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class ProfileTabsTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            url: 'https://rapidtriage.me/profile',
            tabTests: {},
            issues: [],
            networkErrors: [],
            consoleErrors: []
        };
    }

    async initialize() {
        this.browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: ['--disable-web-security', '--no-sandbox']
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });

        // Monitor errors
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                this.results.consoleErrors.push({
                    timestamp: new Date().toISOString(),
                    text: msg.text()
                });
                console.log('❌ Console Error:', msg.text());
            }
        });

        this.page.on('response', (response) => {
            if (response.status() >= 400) {
                this.results.networkErrors.push({
                    timestamp: new Date().toISOString(),
                    url: response.url(),
                    status: response.status()
                });
                console.log(`❌ Network Error: ${response.status()} - ${response.url()}`);
            }
        });
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async testSpecificTabs() {
        console.log('🚀 Testing Profile Page Tabs...');

        await this.page.goto('https://rapidtriage.me/profile', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        await this.sleep(2000);

        // Test each tab by clicking on them
        const tabs = [
            { name: 'General', selector: 'text=General' },
            { name: 'Security', selector: 'text=Security' },
            { name: 'Subscription', selector: 'text=Subscription' },
            { name: 'Usage & Billing', selector: 'text=Usage & Billing' }
        ];

        for (const tab of tabs) {
            console.log(`\n🔍 Testing ${tab.name} tab...`);

            try {
                // Find and click the tab
                const tabElement = await this.page.evaluateHandle((tabName) => {
                    const elements = Array.from(document.querySelectorAll('*'));
                    return elements.find(el =>
                        el.textContent &&
                        el.textContent.trim() === tabName &&
                        (el.tagName === 'BUTTON' || el.tagName === 'A' ||
                         el.getAttribute('role') === 'tab' ||
                         el.classList.contains('tab') ||
                         el.onclick !== null)
                    );
                }, tab.name);

                if (tabElement && tabElement.asElement) {
                    console.log(`  ✅ Found ${tab.name} tab element`);

                    // Click the tab
                    await tabElement.asElement().click();
                    await this.sleep(2000);

                    // Take screenshot
                    await this.page.screenshot({
                        path: `test-results/tab-${tab.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
                        fullPage: true
                    });

                    // Check if content changed
                    const pageContent = await this.page.content();
                    const hasTabContent = await this.page.evaluate((tabName) => {
                        // Look for tab-specific content
                        const content = document.body.textContent.toLowerCase();
                        if (tabName === 'General') {
                            return content.includes('personal information') || content.includes('full name');
                        } else if (tabName === 'Security') {
                            return content.includes('password') || content.includes('two-factor') || content.includes('2fa');
                        } else if (tabName === 'Subscription') {
                            return content.includes('plan') || content.includes('billing') || content.includes('subscription');
                        } else if (tabName === 'Usage & Billing') {
                            return content.includes('usage') || content.includes('billing') || content.includes('api calls');
                        }
                        return false;
                    }, tab.name);

                    this.results.tabTests[tab.name] = {
                        status: 'passed',
                        clickable: true,
                        contentLoaded: hasTabContent,
                        screenshot: `tab-${tab.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`
                    };

                    console.log(`  ✅ ${tab.name} tab is clickable`);
                    console.log(`  ${hasTabContent ? '✅' : '❌'} ${tab.name} tab content ${hasTabContent ? 'loaded' : 'not detected'}`);

                } else {
                    this.results.tabTests[tab.name] = {
                        status: 'failed',
                        clickable: false,
                        error: 'Tab element not found'
                    };

                    this.results.issues.push({
                        type: 'UI',
                        description: `${tab.name} tab not found`,
                        severity: 'High'
                    });

                    console.log(`  ❌ ${tab.name} tab not found`);
                }

            } catch (error) {
                this.results.tabTests[tab.name] = {
                    status: 'error',
                    error: error.message
                };

                console.log(`  ❌ Error testing ${tab.name} tab:`, error.message);
            }
        }

        // Test forms in each tab
        await this.testFormsInTabs();

        // Test 2FA toggle if on Security tab
        await this.test2FAToggle();

        // Test subscription upgrade buttons
        await this.testSubscriptionButtons();
    }

    async testFormsInTabs() {
        console.log('\n📝 Testing forms in all tabs...');

        // Click General tab first
        await this.page.evaluate(() => {
            const generalTab = Array.from(document.querySelectorAll('*')).find(el =>
                el.textContent && el.textContent.trim() === 'General'
            );
            if (generalTab) generalTab.click();
        });

        await this.sleep(1000);

        // Test form inputs
        try {
            const nameInput = await this.page.$('input[placeholder*="name"], input[name*="name"]');
            const emailInput = await this.page.$('input[type="email"], input[placeholder*="email"]');
            const companyInput = await this.page.$('input[placeholder*="company"], input[name*="company"]');

            if (nameInput) {
                await nameInput.click();
                await nameInput.clear();
                await nameInput.type('Test User');
                console.log('  ✅ Name input field working');
            }

            if (emailInput) {
                await emailInput.click();
                console.log('  ✅ Email input field found (likely readonly)');
            }

            if (companyInput) {
                await companyInput.click();
                await companyInput.clear();
                await companyInput.type('Test Company');
                console.log('  ✅ Company input field working');
            }

            // Test Save Changes button
            const saveButton = await this.page.evaluateHandle(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.find(btn => btn.textContent.includes('Save Changes'));
            });

            if (saveButton && saveButton.asElement) {
                console.log('  ✅ Save Changes button found');

                // Don't actually click it to avoid submitting
                this.results.tabTests['General'].formSubmission = 'available';
            }

        } catch (error) {
            console.log('  ❌ Form testing error:', error.message);
        }
    }

    async test2FAToggle() {
        console.log('\n🔒 Testing 2FA toggle...');

        // Click Security tab
        await this.page.evaluate(() => {
            const securityTab = Array.from(document.querySelectorAll('*')).find(el =>
                el.textContent && el.textContent.trim() === 'Security'
            );
            if (securityTab) securityTab.click();
        });

        await this.sleep(2000);

        try {
            // Look for 2FA toggle
            const twoFAToggle = await this.page.$('input[type="checkbox"]');

            if (twoFAToggle) {
                const isChecked = await twoFAToggle.evaluate(el => el.checked);
                console.log(`  ✅ 2FA toggle found (currently ${isChecked ? 'enabled' : 'disabled'})`);

                // Test clicking the toggle (but don't actually change it)
                console.log('  ⚠️  Not clicking 2FA toggle to avoid changing security settings');

                this.results.tabTests['Security'] = {
                    ...this.results.tabTests['Security'],
                    twoFAToggleFound: true,
                    twoFAStatus: isChecked ? 'enabled' : 'disabled'
                };
            } else {
                console.log('  ❌ 2FA toggle not found');
            }

            // Look for password change form
            const passwordInputs = await this.page.$$('input[type="password"]');
            if (passwordInputs.length > 0) {
                console.log(`  ✅ Password change form found (${passwordInputs.length} password fields)`);
                this.results.tabTests['Security'] = {
                    ...this.results.tabTests['Security'],
                    passwordChangeForm: true,
                    passwordFields: passwordInputs.length
                };
            }

        } catch (error) {
            console.log('  ❌ Security testing error:', error.message);
        }
    }

    async testSubscriptionButtons() {
        console.log('\n💳 Testing subscription features...');

        // Click Subscription tab
        await this.page.evaluate(() => {
            const subTab = Array.from(document.querySelectorAll('*')).find(el =>
                el.textContent && el.textContent.trim() === 'Subscription'
            );
            if (subTab) subTab.click();
        });

        await this.sleep(2000);

        try {
            // Look for upgrade buttons
            const upgradeButtons = await this.page.$$eval('button', buttons =>
                buttons.filter(btn =>
                    btn.textContent.toLowerCase().includes('upgrade') ||
                    btn.textContent.toLowerCase().includes('select') ||
                    btn.textContent.toLowerCase().includes('contact')
                ).map(btn => btn.textContent.trim())
            );

            if (upgradeButtons.length > 0) {
                console.log(`  ✅ Found ${upgradeButtons.length} subscription buttons: ${upgradeButtons.join(', ')}`);
                this.results.tabTests['Subscription'] = {
                    ...this.results.tabTests['Subscription'],
                    upgradeButtons: upgradeButtons
                };
            } else {
                console.log('  ❌ No subscription upgrade buttons found');
            }

        } catch (error) {
            console.log('  ❌ Subscription testing error:', error.message);
        }

        // Test Usage & Billing tab
        await this.page.evaluate(() => {
            const usageTab = Array.from(document.querySelectorAll('*')).find(el =>
                el.textContent && el.textContent.trim() === 'Usage & Billing'
            );
            if (usageTab) usageTab.click();
        });

        await this.sleep(2000);

        try {
            // Look for usage statistics or billing info
            const pageText = await this.page.evaluate(() => document.body.textContent.toLowerCase());

            const hasUsageInfo = pageText.includes('api calls') ||
                               pageText.includes('requests') ||
                               pageText.includes('usage');

            const hasBillingInfo = pageText.includes('billing') ||
                                 pageText.includes('payment') ||
                                 pageText.includes('invoice');

            console.log(`  ${hasUsageInfo ? '✅' : '❌'} Usage information ${hasUsageInfo ? 'found' : 'not found'}`);
            console.log(`  ${hasBillingInfo ? '✅' : '❌'} Billing information ${hasBillingInfo ? 'found' : 'not found'}`);

            this.results.tabTests['Usage & Billing'] = {
                ...this.results.tabTests['Usage & Billing'],
                usageInfo: hasUsageInfo,
                billingInfo: hasBillingInfo
            };

        } catch (error) {
            console.log('  ❌ Usage & Billing testing error:', error.message);
        }
    }

    generateReport() {
        console.log('\n📊 Generating detailed report...');

        const summary = {
            totalIssues: this.results.issues.length,
            networkErrors: this.results.networkErrors.length,
            consoleErrors: this.results.consoleErrors.length,
            tabsTotal: Object.keys(this.results.tabTests).length,
            tabsPassed: Object.values(this.results.tabTests).filter(t => t.status === 'passed').length,
            tabsFailed: Object.values(this.results.tabTests).filter(t => t.status === 'failed').length,
            tabsError: Object.values(this.results.tabTests).filter(t => t.status === 'error').length
        };

        const report = { ...this.results, summary };

        fs.writeFileSync('test-results/profile-tabs-detailed.json', JSON.stringify(report, null, 2));

        const html = this.generateHTMLReport(report);
        fs.writeFileSync('test-results/profile-tabs-detailed.html', html);

        console.log('✅ Detailed reports saved:');
        console.log('  - test-results/profile-tabs-detailed.json');
        console.log('  - test-results/profile-tabs-detailed.html');

        return report;
    }

    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Profile Tabs Detailed Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .tab-result { background: #fff; border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
        .tab-result.passed { border-color: #28a745; }
        .tab-result.failed { border-color: #dc3545; }
        .tab-result.error { border-color: #ffc107; }
        .issue { background: #ffe6e6; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .network-error { background: #ffebe6; padding: 8px; margin: 5px 0; border-radius: 4px; }
        .console-error { background: #fff0e6; padding: 8px; margin: 5px 0; border-radius: 4px; }
        .status { font-weight: bold; padding: 3px 8px; border-radius: 12px; }
        .passed { background: #d4edda; color: #155724; }
        .failed { background: #f8d7da; color: #721c24; }
        .error { background: #fff3cd; color: #856404; }
        ul { margin: 5px 0; }
        li { margin: 3px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Profile Tabs Detailed Test Report</h1>
        <p><strong>URL:</strong> ${report.url}</p>
        <p><strong>Test Date:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Tabs Tested:</strong> ${report.summary.tabsTotal}</p>
        <p><strong>Tabs Passed:</strong> ${report.summary.tabsPassed}</p>
        <p><strong>Tabs Failed:</strong> ${report.summary.tabsFailed}</p>
        <p><strong>Network Errors:</strong> ${report.summary.networkErrors}</p>
        <p><strong>Console Errors:</strong> ${report.summary.consoleErrors}</p>
    </div>

    <h2>Tab Test Results</h2>
    ${Object.entries(report.tabTests).map(([tabName, result]) => `
        <div class="tab-result ${result.status}">
            <h3>${tabName} Tab <span class="status ${result.status}">${result.status.toUpperCase()}</span></h3>

            <ul>
                <li><strong>Clickable:</strong> ${result.clickable ? 'Yes' : 'No'}</li>
                ${result.contentLoaded !== undefined ? `<li><strong>Content Loaded:</strong> ${result.contentLoaded ? 'Yes' : 'No'}</li>` : ''}
                ${result.screenshot ? `<li><strong>Screenshot:</strong> ${result.screenshot}</li>` : ''}
                ${result.error ? `<li><strong>Error:</strong> ${result.error}</li>` : ''}
                ${result.formSubmission ? `<li><strong>Form Submission:</strong> ${result.formSubmission}</li>` : ''}
                ${result.twoFAToggleFound ? `<li><strong>2FA Toggle:</strong> Found (${result.twoFAStatus})</li>` : ''}
                ${result.passwordChangeForm ? `<li><strong>Password Form:</strong> ${result.passwordFields} fields found</li>` : ''}
                ${result.upgradeButtons ? `<li><strong>Upgrade Buttons:</strong> ${result.upgradeButtons.join(', ')}</li>` : ''}
                ${result.usageInfo !== undefined ? `<li><strong>Usage Info:</strong> ${result.usageInfo ? 'Found' : 'Not found'}</li>` : ''}
                ${result.billingInfo !== undefined ? `<li><strong>Billing Info:</strong> ${result.billingInfo ? 'Found' : 'Not found'}</li>` : ''}
            </ul>
        </div>
    `).join('')}

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
            ${error.status} - ${error.url}
        </div>
      `).join('')}

    <h2>Console Errors</h2>
    ${report.consoleErrors.length === 0 ? '<p>No console errors!</p>' :
      report.consoleErrors.map(error => `
        <div class="console-error">
            ${error.text}
        </div>
      `).join('')}

</body>
</html>`;
    }

    async run() {
        try {
            if (!fs.existsSync('test-results')) {
                fs.mkdirSync('test-results');
            }

            await this.initialize();
            await this.testSpecificTabs();
            const report = this.generateReport();

            console.log('\n📋 FINAL DETAILED SUMMARY:');
            console.log(`Tabs Tested: ${report.summary.tabsTotal}`);
            console.log(`Tabs Working: ${report.summary.tabsPassed}`);
            console.log(`Tabs Failed: ${report.summary.tabsFailed}`);
            console.log(`Network Errors: ${report.summary.networkErrors}`);
            console.log(`Console Errors: ${report.summary.consoleErrors}`);

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
    const tester = new ProfileTabsTester();
    tester.run().then((report) => {
        if (report) {
            console.log('\n✅ Detailed tab testing completed!');
            process.exit(0);
        } else {
            console.log('\n❌ Detailed tab testing failed!');
            process.exit(1);
        }
    });
}

module.exports = ProfileTabsTester;