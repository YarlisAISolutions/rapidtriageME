// Extension Tests Module
const extensionTests = {
    extensionId: null,
    
    async checkInstalled() {
        testRunner.logActivity('Checking extension installation...', 'info');
        
        // Check if chrome extension APIs are available
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            this.extensionId = chrome.runtime.id;
            this.updateOutput(`Extension detected: ${this.extensionId}`, 'success');
            testRunner.logActivity('Extension is installed', 'success');
            testRunner.updateTestResults(1, 0, 0);
            return true;
        } else {
            this.updateOutput('Extension not detected. Please install RapidTriageME extension.', 'warning');
            testRunner.logActivity('Extension not detected', 'warning');
            testRunner.updateTestResults(0, 0, 1);
            return false;
        }
    },
    
    async testButtons() {
        testRunner.logActivity('Testing all extension buttons...', 'info');
        
        const tests = [
            'Lighthouse',
            'Console Logs',
            'Screenshot',
            'Inspect'
        ];
        
        for (const test of tests) {
            await this[`test${test.replace(' ', '')}`]();
            await TestUtils.sleep(500);
        }
        
        testRunner.logActivity('All button tests completed', 'success');
    },
    
    async testLighthouse() {
        testRunner.logActivity('Testing Lighthouse audit...', 'info');
        const resultDiv = document.getElementById('lighthouse-result');
        
        try {
            const apiUrl = testRunner.getActiveServerUrl();
            const response = await fetch(`${apiUrl}/api/lighthouse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-Id': 'test'
                },
                body: JSON.stringify({ url: window.location.href })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (resultDiv) {
                    resultDiv.textContent = '✅ Lighthouse API working';
                    resultDiv.style.color = 'green';
                }
                this.updateOutput('Lighthouse test successful', 'success');
                testRunner.updateTestResults(1, 0, 0);
            } else {
                throw new Error(`API returned ${response.status}`);
            }
        } catch (error) {
            if (resultDiv) {
                resultDiv.textContent = `❌ Failed: ${error.message}`;
                resultDiv.style.color = 'red';
            }
            this.updateOutput(`Lighthouse test failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    async testConsoleLogs() {
        testRunner.logActivity('Testing Console Logs API...', 'info');
        const resultDiv = document.getElementById('console-logs-result');
        
        try {
            const apiUrl = testRunner.getActiveServerUrl();
            const response = await fetch(`${apiUrl}/api/console-logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-Id': 'test'
                },
                body: JSON.stringify({ url: window.location.href })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (resultDiv) {
                    resultDiv.textContent = '✅ Console Logs API working';
                    resultDiv.style.color = 'green';
                }
                this.updateOutput('Console Logs test successful', 'success');
                testRunner.updateTestResults(1, 0, 0);
            } else {
                throw new Error(`API returned ${response.status}`);
            }
        } catch (error) {
            if (resultDiv) {
                resultDiv.textContent = `❌ Failed: ${error.message}`;
                resultDiv.style.color = 'red';
            }
            this.updateOutput(`Console Logs test failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    async testScreenshot() {
        testRunner.logActivity('Testing Screenshot API...', 'info');
        const resultDiv = document.getElementById('screenshot-result');
        
        try {
            const apiUrl = testRunner.getActiveServerUrl();
            const response = await fetch(`${apiUrl}/api/screenshot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-Id': 'test'
                },
                body: JSON.stringify({ url: window.location.href })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (resultDiv) {
                    resultDiv.textContent = '✅ Screenshot API working';
                    resultDiv.style.color = 'green';
                }
                this.updateOutput('Screenshot test successful', 'success');
                testRunner.updateTestResults(1, 0, 0);
            } else {
                throw new Error(`API returned ${response.status}`);
            }
        } catch (error) {
            if (resultDiv) {
                resultDiv.textContent = `❌ Failed: ${error.message}`;
                resultDiv.style.color = 'red';
            }
            this.updateOutput(`Screenshot test failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    async testInspect() {
        testRunner.logActivity('Testing Element Inspection API...', 'info');
        const resultDiv = document.getElementById('inspect-result');
        
        try {
            const apiUrl = testRunner.getActiveServerUrl();
            const response = await fetch(`${apiUrl}/api/inspect-element`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-Id': 'test'
                },
                body: JSON.stringify({ 
                    url: window.location.href,
                    selector: 'body'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (resultDiv) {
                    resultDiv.textContent = '✅ Inspect API working';
                    resultDiv.style.color = 'green';
                }
                this.updateOutput('Inspect test successful', 'success');
                testRunner.updateTestResults(1, 0, 0);
            } else {
                throw new Error(`API returned ${response.status}`);
            }
        } catch (error) {
            if (resultDiv) {
                resultDiv.textContent = `❌ Failed: ${error.message}`;
                resultDiv.style.color = 'red';
            }
            this.updateOutput(`Inspect test failed: ${error.message}`, 'error');
            testRunner.updateTestResults(0, 1, 0);
        }
    },
    
    async testAPI() {
        testRunner.logActivity('Testing API communication...', 'info');
        
        // Test both local and remote servers
        const servers = [
            { name: 'local', url: 'http://localhost:3025' },
            { name: 'remote', url: 'https://rapidtriage.me' }
        ];
        
        for (const server of servers) {
            try {
                const response = await TestUtils.fetchWithTimeout(
                    `${server.url}/.identity`,
                    { headers: { 'X-Extension-Id': 'test' } },
                    5000
                );
                
                if (response.ok) {
                    const data = await response.json();
                    this.updateOutput(`${server.name} server: ${data.name} v${data.version}`, 'success');
                    testRunner.updateTestResults(1, 0, 0);
                } else {
                    this.updateOutput(`${server.name} server: HTTP ${response.status}`, 'error');
                    testRunner.updateTestResults(0, 1, 0);
                }
            } catch (error) {
                this.updateOutput(`${server.name} server: ${error.message}`, 'error');
                testRunner.updateTestResults(0, 1, 0);
            }
        }
    },
    
    updateOutput(message, type = 'info') {
        const output = document.getElementById('extension-output');
        if (!output) return;
        
        const entry = document.createElement('div');
        entry.style.padding = '5px';
        entry.style.borderBottom = '1px solid #333';
        
        const timestamp = new Date().toLocaleTimeString();
        entry.textContent = `[${timestamp}] ${message}`;
        
        switch(type) {
            case 'success':
                entry.style.color = '#4caf50';
                break;
            case 'error':
                entry.style.color = '#f44336';
                break;
            case 'warning':
                entry.style.color = '#ff9800';
                break;
            default:
                entry.style.color = '#2196f3';
        }
        
        output.appendChild(entry);
        output.scrollTop = output.scrollHeight;
        
        // Keep only last 20 entries
        while (output.children.length > 20) {
            output.removeChild(output.firstChild);
        }
    }
};