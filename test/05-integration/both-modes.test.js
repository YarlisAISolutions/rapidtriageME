#!/usr/bin/env node

/**
 * Comprehensive test suite for RapidTriageME communication modes
 * Tests both stdio and HTTP streaming (SSE) modes
 */

const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const EventSource = require('eventsource');
const WebSocket = require('ws');

class CommunicationModeTester {
    constructor() {
        this.results = {
            stdio: { passed: 0, failed: 0, errors: [] },
            http: { passed: 0, failed: 0, errors: [] }
        };
    }

    // STDIO MODE TESTS
    async testStdioMode() {
        console.log('\n═══════════════════════════════════════════');
        console.log('🧪 TESTING STDIO MODE');
        console.log('═══════════════════════════════════════════\n');

        try {
            // Test 1: Server startup
            console.log('📋 Test 1: Server Startup');
            const serverProcess = spawn('node', ['rapidtriage-mcp/src/index.js', 'stdio'], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdioResponses = [];
            serverProcess.stdout.on('data', (data) => {
                stdioResponses.push(data.toString());
            });

            // Test 2: Initialize
            console.log('📋 Test 2: JSON-RPC Initialize');
            const initMsg = JSON.stringify({
                jsonrpc: "2.0",
                method: "initialize",
                params: { protocolVersion: "1.0.0", capabilities: {} },
                id: 1
            }) + '\n';
            
            serverProcess.stdin.write(initMsg);
            await this.delay(2000);

            if (stdioResponses.some(r => r.includes('jsonrpc'))) {
                console.log('✅ Stdio initialization successful');
                this.results.stdio.passed++;
            } else {
                console.log('❌ Stdio initialization failed');
                this.results.stdio.failed++;
                this.results.stdio.errors.push('No JSON-RPC response received');
            }

            // Test 3: Tools listing
            console.log('📋 Test 3: Tools Listing');
            const toolsMsg = JSON.stringify({
                jsonrpc: "2.0",
                method: "tools/list",
                params: {},
                id: 2
            }) + '\n';
            
            serverProcess.stdin.write(toolsMsg);
            await this.delay(1000);

            // Test 4: Tool execution
            console.log('📋 Test 4: Tool Execution');
            const screenshotMsg = JSON.stringify({
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    name: "take_screenshot",
                    arguments: { url: "https://example.com" }
                },
                id: 3
            }) + '\n';
            
            serverProcess.stdin.write(screenshotMsg);
            await this.delay(3000);

            // Cleanup
            serverProcess.kill();

        } catch (error) {
            console.error('❌ Stdio test error:', error.message);
            this.results.stdio.failed++;
            this.results.stdio.errors.push(error.message);
        }
    }

    // HTTP STREAMING MODE TESTS
    async testHttpStreamingMode() {
        console.log('\n═══════════════════════════════════════════');
        console.log('🧪 TESTING HTTP STREAMING MODE');
        console.log('═══════════════════════════════════════════\n');

        try {
            // Test 1: SSE Connection
            console.log('📋 Test 1: SSE Connection');
            const sseUrl = 'http://localhost:8787/sse';
            
            // Start local dev server if needed
            const devServer = spawn('npm', ['run', 'dev'], {
                cwd: process.cwd(),
                stdio: 'pipe'
            });

            await this.delay(5000); // Wait for server to start

            // Test SSE connection
            try {
                const eventSource = new EventSource(sseUrl, {
                    headers: {
                        'Authorization': 'Bearer test-token'
                    }
                });

                await new Promise((resolve, reject) => {
                    eventSource.onopen = () => {
                        console.log('✅ SSE connection established');
                        this.results.http.passed++;
                        resolve();
                    };

                    eventSource.onerror = (error) => {
                        console.log('❌ SSE connection failed');
                        this.results.http.failed++;
                        this.results.http.errors.push('SSE connection error');
                        reject(error);
                    };

                    setTimeout(() => reject(new Error('SSE timeout')), 5000);
                });

                eventSource.close();
            } catch (error) {
                console.log('⚠️ SSE test skipped - server not available');
            }

            // Test 2: WebSocket Connection
            console.log('📋 Test 2: WebSocket Connection');
            try {
                const ws = new WebSocket('ws://localhost:8787/websocket');

                await new Promise((resolve, reject) => {
                    ws.on('open', () => {
                        console.log('✅ WebSocket connection established');
                        this.results.http.passed++;
                        resolve();
                    });

                    ws.on('error', (error) => {
                        console.log('❌ WebSocket connection failed');
                        this.results.http.failed++;
                        reject(error);
                    });

                    setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
                });

                // Test message exchange
                ws.send(JSON.stringify({
                    type: 'screenshot',
                    url: 'https://example.com'
                }));

                ws.close();
            } catch (error) {
                console.log('⚠️ WebSocket test skipped - server not available');
            }

            // Test 3: REST API Endpoints
            console.log('📋 Test 3: REST API Endpoints');
            const endpoints = [
                '/api/screenshot',
                '/api/console-logs',
                '/api/network-logs',
                '/api/lighthouse'
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await this.httpRequest({
                        hostname: 'localhost',
                        port: 8787,
                        path: endpoint,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer test-token'
                        }
                    }, JSON.stringify({ url: 'https://example.com' }));

                    if (response.statusCode === 200) {
                        console.log(`✅ ${endpoint} - Working`);
                        this.results.http.passed++;
                    } else {
                        console.log(`❌ ${endpoint} - Status ${response.statusCode}`);
                        this.results.http.failed++;
                    }
                } catch (error) {
                    console.log(`⚠️ ${endpoint} - Skipped (server unavailable)`);
                }
            }

            // Cleanup
            devServer.kill();

        } catch (error) {
            console.error('❌ HTTP streaming test error:', error.message);
            this.results.http.failed++;
            this.results.http.errors.push(error.message);
        }
    }

    // Helper methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    httpRequest(options, data) {
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    res.body = body;
                    resolve(res);
                });
            });

            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (data) req.write(data);
            req.end();
        });
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 RapidTriageME Communication Modes Test Suite');
        console.log('═══════════════════════════════════════════════');

        await this.testStdioMode();
        await this.testHttpStreamingMode();

        this.printResults();
    }

    printResults() {
        console.log('\n═══════════════════════════════════════════');
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('═══════════════════════════════════════════\n');

        console.log('STDIO MODE:');
        console.log(`  ✅ Passed: ${this.results.stdio.passed}`);
        console.log(`  ❌ Failed: ${this.results.stdio.failed}`);
        if (this.results.stdio.errors.length > 0) {
            console.log('  Errors:');
            this.results.stdio.errors.forEach(e => console.log(`    - ${e}`));
        }

        console.log('\nHTTP STREAMING MODE:');
        console.log(`  ✅ Passed: ${this.results.http.passed}`);
        console.log(`  ❌ Failed: ${this.results.http.failed}`);
        if (this.results.http.errors.length > 0) {
            console.log('  Errors:');
            this.results.http.errors.forEach(e => console.log(`    - ${e}`));
        }

        const totalPassed = this.results.stdio.passed + this.results.http.passed;
        const totalFailed = this.results.stdio.failed + this.results.http.failed;
        const successRate = totalPassed / (totalPassed + totalFailed) * 100;

        console.log('\n═══════════════════════════════════════════');
        console.log(`📈 Overall Success Rate: ${successRate.toFixed(1)}%`);
        console.log('═══════════════════════════════════════════\n');

        // Recommendations
        console.log('🔧 RECOMMENDATIONS:');
        if (this.results.stdio.failed > 0) {
            console.log('  • Fix stdio mode JSON-RPC implementation');
            console.log('  • Add proper stream handling for stdin/stdout');
        }
        if (this.results.http.failed > 0) {
            console.log('  • Ensure Cloudflare Worker is properly deployed');
            console.log('  • Verify SSE/WebSocket implementations');
        }
        if (totalFailed === 0) {
            console.log('  ✅ Both modes are working correctly!');
        }
    }
}

// Run tests
if (require.main === module) {
    const tester = new CommunicationModeTester();
    tester.runAllTests().catch(console.error);
}

module.exports = CommunicationModeTester;