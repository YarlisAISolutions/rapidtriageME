#!/usr/bin/env node

/**
 * RapidTriageME Production API Test Script
 * Tests HTTP streaming and REST API endpoints on https://rapidtriage.me
 */

const https = require('https');
// EventSource only needed for SSE testing
let EventSource;
try {
    const eventsource = require('eventsource');
    EventSource = eventsource.EventSource || eventsource;
} catch (e) {
    console.log('Note: EventSource not available, SSE test will be skipped');
}

const API_BASE = 'https://rapidtriage.me';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test-token';

class RapidTriageAPITester {
    constructor() {
        this.authToken = AUTH_TOKEN;
        this.targetUrl = 'https://example.com';
    }

    // Helper function to make API calls
    async makeAPICall(endpoint, data = {}) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({ url: this.targetUrl, ...data });
            
            const options = {
                hostname: 'rapidtriage.me',
                path: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            console.log(`\n📤 Calling ${endpoint}...`);

            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    console.log(`   Status: ${res.statusCode}`);
                    
                    try {
                        const result = JSON.parse(responseData);
                        
                        if (res.statusCode === 200) {
                            console.log('   ✅ Success!');
                            console.log('   Response:', JSON.stringify(result, null, 2).substring(0, 500));
                            resolve(result);
                        } else {
                            console.log(`   ❌ Error: ${result.error || result.message}`);
                            resolve(null);
                        }
                    } catch (error) {
                        console.log('   ❌ Failed to parse response:', responseData.substring(0, 200));
                        resolve(null);
                    }
                });
            });

            req.on('error', (error) => {
                console.error(`   ❌ Request failed: ${error.message}`);
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    // Test health endpoint
    async testHealth() {
        console.log('\n🏥 Testing Health Endpoint...');
        
        return new Promise((resolve) => {
            https.get(`${API_BASE}/health`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const health = JSON.parse(data);
                        console.log('   ✅ API is healthy!');
                        console.log('   Status:', health.status);
                        console.log('   Version:', health.version);
                        console.log('   Environment:', health.environment);
                        resolve(true);
                    } catch (error) {
                        console.log('   ❌ Health check failed');
                        resolve(false);
                    }
                });
            }).on('error', (error) => {
                console.log(`   ❌ Connection failed: ${error.message}`);
                resolve(false);
            });
        });
    }

    // Test SSE connection
    async testSSE() {
        console.log('\n📡 Testing Server-Sent Events (SSE)...');
        
        if (!EventSource) {
            console.log('   ⚠️ SSE test skipped (EventSource not available)');
            return null;
        }
        
        return new Promise((resolve) => {
            const eventSource = new EventSource(`${API_BASE}/sse`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            let messageCount = 0;
            const timeout = setTimeout(() => {
                eventSource.close();
                console.log(`   ✅ SSE working! Received ${messageCount} messages`);
                resolve(true);
            }, 5000);

            eventSource.onopen = () => {
                console.log('   ✅ SSE connection established');
            };

            eventSource.onmessage = (event) => {
                messageCount++;
                console.log(`   📨 Message ${messageCount}:`, event.data.substring(0, 100));
            };

            eventSource.onerror = (error) => {
                clearTimeout(timeout);
                eventSource.close();
                console.log('   ❌ SSE connection failed');
                resolve(false);
            };
        });
    }

    // Test screenshot endpoint
    async testScreenshot() {
        console.log('\n📸 Testing Screenshot Capture...');
        
        await this.makeAPICall('/api/screenshot', {
            fullPage: false,
            format: 'png',
            quality: 90
        });
    }

    // Test console logs endpoint
    async testConsoleLogs() {
        console.log('\n📝 Testing Console Logs Retrieval...');
        
        await this.makeAPICall('/api/console-logs', {
            level: 'all',
            limit: 50
        });
    }

    // Test network logs endpoint
    async testNetworkLogs() {
        console.log('\n🌐 Testing Network Logs...');
        
        await this.makeAPICall('/api/network-logs', {
            limit: 25
        });
    }

    // Test Lighthouse audit
    async testLighthouse() {
        console.log('\n🎯 Testing Lighthouse Audit...');
        
        await this.makeAPICall('/api/lighthouse', {
            categories: ['performance', 'accessibility'],
            device: 'desktop'
        });
    }

    // Test full triage report
    async testTriageReport() {
        console.log('\n📊 Testing Full Triage Report...');
        
        await this.makeAPICall('/api/triage-report', {
            includeScreenshot: true,
            includeLogs: true,
            includeNetworkAnalysis: true,
            includePerformanceAudit: true
        });
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 RapidTriageME Production API Test Suite');
        console.log('═══════════════════════════════════════════');
        console.log(`🌐 API Base: ${API_BASE}`);
        console.log(`🎯 Target URL: ${this.targetUrl}`);
        console.log(`🔑 Auth Token: ${this.authToken.substring(0, 10)}...`);
        console.log('═══════════════════════════════════════════');

        const results = {
            health: await this.testHealth(),
            sse: await this.testSSE(),
            screenshot: await this.testScreenshot(),
            consoleLogs: await this.testConsoleLogs(),
            networkLogs: await this.testNetworkLogs(),
            lighthouse: await this.testLighthouse(),
            triageReport: await this.testTriageReport()
        };

        console.log('\n═══════════════════════════════════════════');
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('═══════════════════════════════════════════');
        
        const tests = Object.keys(results);
        const passed = tests.filter(test => results[test]).length;
        const failed = tests.length - passed;
        
        console.log(`✅ Passed: ${passed}/${tests.length}`);
        console.log(`❌ Failed: ${failed}/${tests.length}`);
        console.log(`📈 Success Rate: ${(passed / tests.length * 100).toFixed(1)}%`);
        
        console.log('\n🔍 Individual Results:');
        for (const [test, result] of Object.entries(results)) {
            console.log(`   ${result ? '✅' : '❌'} ${test}`);
        }

        console.log('\n💡 NEXT STEPS:');
        if (failed > 0) {
            console.log('1. Check if browser tools server is running locally');
            console.log('2. Verify authentication token is correct');
            console.log('3. Ensure Cloudflare Worker has proper secrets configured');
            console.log('4. Check browser tools server connectivity');
        } else {
            console.log('✨ All tests passed! The API is fully functional.');
        }
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new RapidTriageAPITester();
    
    // Allow custom target URL via command line
    if (process.argv[2]) {
        tester.targetUrl = process.argv[2];
        console.log(`\n🎯 Using custom target URL: ${tester.targetUrl}`);
    }
    
    tester.runAllTests().catch(console.error);
}

module.exports = RapidTriageAPITester;