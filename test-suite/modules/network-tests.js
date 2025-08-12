// Network Tests Module
const networkTests = {
    requests: [],
    
    async testGET() {
        testRunner.logActivity('Testing GET request...', 'info');
        const start = performance.now();
        
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
            const data = await response.json();
            const duration = performance.now() - start;
            
            this.logRequest('GET', response.url, response.status, duration, JSON.stringify(data).length);
            testRunner.logActivity(`GET request successful (${duration.toFixed(2)}ms)`, 'success');
            testRunner.updateTestResults(1, 0, 0);
        } catch (error) {
            testRunner.logActivity(`GET request failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    async testPOST() {
        testRunner.logActivity('Testing POST request...', 'info');
        const start = performance.now();
        
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'Test Post',
                    body: 'Test body content',
                    userId: 1
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
            });
            const data = await response.json();
            const duration = performance.now() - start;
            
            this.logRequest('POST', response.url, response.status, duration, JSON.stringify(data).length);
            testRunner.logActivity(`POST request successful (${duration.toFixed(2)}ms)`, 'success');
            testRunner.updateTestResults(1, 0, 0);
        } catch (error) {
            testRunner.logActivity(`POST request failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    async testTimeout() {
        testRunner.logActivity('Testing request timeout...', 'info');
        
        try {
            await TestUtils.fetchWithTimeout('https://httpstat.us/200?sleep=10000', {}, 2000);
            testRunner.logActivity('Timeout test failed - request should have timed out', 'error');
            testRunner.updateTestResults(0, 1, 0);
        } catch (error) {
            if (error.message.includes('timeout')) {
                testRunner.logActivity('Timeout test successful - request timed out as expected', 'success');
                testRunner.updateTestResults(1, 0, 0);
            } else {
                testRunner.logActivity(`Timeout test failed: ${error.message}`, 'error');
                testRunner.updateTestResults(0, 1, 0);
            }
        }
    },
    
    async testError() {
        testRunner.logActivity('Testing error handling...', 'info');
        
        try {
            const response = await fetch('https://httpstat.us/500');
            
            if (!response.ok) {
                testRunner.logActivity(`Error test successful - received ${response.status}`, 'success');
                testRunner.updateTestResults(1, 0, 0);
            } else {
                testRunner.logActivity('Error test failed - expected error response', 'error');
                testRunner.updateTestResults(0, 1, 0);
            }
        } catch (error) {
            testRunner.logActivity(`Error test exception: ${error.message}`, 'warning');
            testRunner.updateTestResults(0, 0, 1);
        }
    },
    
    async testCORS() {
        testRunner.logActivity('Testing CORS...', 'info');
        const apiUrl = testRunner.getActiveServerUrl();
        
        try {
            const response = await fetch(`${apiUrl}/.identity`, {
                headers: { 'X-Extension-Id': 'test' }
            });
            
            if (response.ok) {
                testRunner.logActivity('CORS test successful', 'success');
                testRunner.updateTestResults(1, 0, 0);
            } else {
                testRunner.logActivity(`CORS test failed: ${response.status}`, 'error');
                testRunner.updateTestResults(0, 1, 0);
            }
        } catch (error) {
            testRunner.logActivity(`CORS test failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    async testLargePayload() {
        testRunner.logActivity('Testing large payload...', 'info');
        const largeData = TestUtils.generateTestData('string', 10000);
        
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                body: JSON.stringify({ data: largeData }),
                headers: {
                    'Content-type': 'application/json'
                }
            });
            
            if (response.ok) {
                testRunner.logActivity(`Large payload test successful (${TestUtils.formatBytes(largeData.length)})`, 'success');
                testRunner.updateTestResults(1, 0, 0);
            } else {
                testRunner.logActivity(`Large payload test failed: ${response.status}`, 'error');
                testRunner.updateTestResults(0, 1, 0);
            }
        } catch (error) {
            testRunner.logActivity(`Large payload test failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    async testAPIEndpoint() {
        const endpoint = document.getElementById('api-endpoint').value;
        const server = document.getElementById('api-server').value;
        const apiUrl = server === 'local' ? 'http://localhost:3025' : 'https://rapidtriage.me';
        
        testRunner.logActivity(`Testing API endpoint: ${endpoint} on ${server} server...`, 'info');
        
        try {
            const url = `${apiUrl}${endpoint}`;
            const options = {
                method: endpoint.includes('console') || endpoint.includes('lighthouse') ? 'POST' : 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-Id': 'test'
                }
            };
            
            if (options.method === 'POST') {
                options.body = JSON.stringify({ url: 'https://example.com' });
            }
            
            const response = await TestUtils.fetchWithTimeout(url, options, 10000);
            const data = await response.json();
            
            const responseDiv = document.getElementById('api-response');
            if (responseDiv) {
                responseDiv.textContent = JSON.stringify(data, null, 2);
            }
            
            if (response.ok) {
                testRunner.logActivity(`API test successful: ${endpoint}`, 'success');
                testRunner.updateTestResults(1, 0, 0);
            } else {
                testRunner.logActivity(`API test failed: ${response.status}`, 'error');
                testRunner.updateTestResults(0, 1, 0);
            }
        } catch (error) {
            const responseDiv = document.getElementById('api-response');
            if (responseDiv) {
                responseDiv.textContent = `Error: ${error.message}`;
            }
            testRunner.logActivity(`API test failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    logRequest(method, url, status, duration, size) {
        this.requests.push({
            method,
            url,
            status,
            duration,
            size,
            timestamp: Date.now()
        });
        
        const tbody = document.getElementById('network-log');
        if (!tbody) return;
        
        // Clear placeholder if exists
        if (tbody.children.length === 1 && tbody.children[0].children[0].colSpan === 5) {
            tbody.innerHTML = '';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${method}</td>
            <td>${url.length > 50 ? url.substring(0, 50) + '...' : url}</td>
            <td class="${status >= 200 && status < 300 ? 'status-check' : status >= 400 ? 'status-fail' : 'status-pending'}">${status}</td>
            <td>${duration.toFixed(2)}ms</td>
            <td>${TestUtils.formatBytes(size)}</td>
        `;
        
        tbody.appendChild(row);
        
        // Keep only last 20 entries
        while (tbody.children.length > 20) {
            tbody.removeChild(tbody.firstChild);
        }
    },
    
    async runAll() {
        testRunner.logActivity('Running all network tests...', 'info');
        
        await this.testGET();
        await TestUtils.sleep(500);
        
        await this.testPOST();
        await TestUtils.sleep(500);
        
        await this.testTimeout();
        await TestUtils.sleep(500);
        
        await this.testError();
        await TestUtils.sleep(500);
        
        await this.testCORS();
        await TestUtils.sleep(500);
        
        await this.testLargePayload();
        
        testRunner.logActivity('Network tests completed', 'success');
    }
};