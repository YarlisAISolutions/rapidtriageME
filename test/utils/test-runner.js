// RapidTriageME Test Runner
class TestRunner {
    constructor() {
        this.tests = {
            passed: 0,
            failed: 0,
            pending: 0,
            total: 0
        };
        this.currentTab = 'overview';
        this.servers = {
            local: 'http://localhost:3025',
            remote: 'https://rapidtriage.me'
        };
        this.activeServer = null;
    }

    initialize() {
        this.setupTabNavigation();
        this.checkSystemStatus();
        this.checkConnections();
        this.detectExtension();
        this.logActivity('Test suite initialized', 'info');
        
        // Start periodic status checks
        setInterval(() => this.checkConnections(), 30000);
    }

    setupTabNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        const contents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // Add active to clicked tab
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                const content = document.getElementById(`${tabName}-tab`);
                if (content) {
                    content.classList.add('active');
                    this.currentTab = tabName;
                    this.logActivity(`Switched to ${tabName} tab`, 'info');
                }
            });
        });
    }

    checkSystemStatus() {
        // Browser info
        const userAgent = navigator.userAgent;
        let browserInfo = 'Unknown';
        
        if (userAgent.includes('Chrome')) {
            const version = userAgent.match(/Chrome\/(\d+)/);
            browserInfo = `Chrome ${version ? version[1] : ''}`;
        } else if (userAgent.includes('Firefox')) {
            browserInfo = 'Firefox';
        } else if (userAgent.includes('Safari')) {
            browserInfo = 'Safari';
        } else if (userAgent.includes('Edge')) {
            browserInfo = 'Edge';
        }
        
        document.getElementById('browser-info').textContent = browserInfo;
        
        // Current URL
        document.getElementById('current-url').textContent = window.location.href;
        
        // Environment
        const env = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ? 'Local' : 'Production';
        document.getElementById('environment').textContent = env;
    }

    async checkConnections() {
        // Check local server
        try {
            const localResponse = await fetch(`${this.servers.local}/.identity`);
            if (localResponse.ok) {
                const data = await localResponse.json();
                this.updateConnectionStatus('local', true, data);
            } else {
                this.updateConnectionStatus('local', false);
            }
        } catch (error) {
            this.updateConnectionStatus('local', false);
        }
        
        // Check remote server
        try {
            const remoteResponse = await fetch(`${this.servers.remote}/.identity`, {
                headers: { 'X-Extension-Id': 'test-suite' }
            });
            if (remoteResponse.ok) {
                const data = await remoteResponse.json();
                this.updateConnectionStatus('remote', true, data);
            } else {
                this.updateConnectionStatus('remote', false);
            }
        } catch (error) {
            this.updateConnectionStatus('remote', false);
        }
        
        // Determine active server
        const localConnected = document.getElementById('local-server-status').classList.contains('success');
        const remoteConnected = document.getElementById('remote-server-status').classList.contains('success');
        
        if (localConnected) {
            this.activeServer = 'local';
        } else if (remoteConnected) {
            this.activeServer = 'remote';
        } else {
            this.activeServer = null;
        }
    }

    updateConnectionStatus(server, connected, data = null) {
        const statusElement = document.getElementById(`${server}-server-status`);
        const indicatorElement = document.getElementById(`${server}-status`);
        
        if (statusElement) {
            statusElement.textContent = connected ? 'Connected' : 'Disconnected';
            statusElement.className = `badge ${connected ? 'success' : 'error'}`;
        }
        
        if (indicatorElement) {
            indicatorElement.textContent = `${server === 'local' ? 'Local' : 'Remote'}: ${connected ? '✓' : '✗'}`;
            indicatorElement.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`;
        }
        
        if (connected && data) {
            this.logActivity(`Connected to ${server} server: ${data.name} v${data.version}`, 'success');
        }
    }

    detectExtension() {
        // Try to detect if RapidTriageME extension is installed
        const extensionDetected = false; // This would need actual extension detection logic
        
        const statusElement = document.getElementById('extension-detection');
        const indicatorElement = document.getElementById('extension-status');
        
        if (statusElement) {
            statusElement.textContent = extensionDetected ? 'Installed' : 'Not Detected';
            statusElement.className = `badge ${extensionDetected ? 'success' : 'warning'}`;
        }
        
        if (indicatorElement) {
            indicatorElement.textContent = `Extension: ${extensionDetected ? '✓' : '?'}`;
            indicatorElement.className = `status-indicator ${extensionDetected ? 'connected' : ''}`;
        }
    }

    async runQuickTest(type) {
        this.logActivity(`Running quick test: ${type}`, 'info');
        
        switch(type) {
            case 'console':
                console.log('Test log message');
                console.info('Test info message');
                console.warn('Test warning message');
                console.error('Test error message');
                this.logActivity('Console test completed', 'success');
                this.updateTestResults(1, 0, 0);
                break;
                
            case 'network':
                try {
                    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
                    const data = await response.json();
                    this.logActivity(`Network test successful: ${data.title}`, 'success');
                    this.updateTestResults(1, 0, 0);
                } catch (error) {
                    this.logActivity(`Network test failed: ${error.message}`, 'error');
                    this.updateTestResults(0, 1, 0);
                }
                break;
                
            case 'error':
                try {
                    throw new Error('Test error message');
                } catch (error) {
                    console.error('Caught test error:', error);
                    this.logActivity('Error test completed', 'success');
                    this.updateTestResults(1, 0, 0);
                }
                break;
        }
    }

    async runAllTests() {
        this.logActivity('Running all tests...', 'info');
        this.resetTestResults();
        
        // Run all quick tests
        await this.runQuickTest('console');
        await this.runQuickTest('network');
        await this.runQuickTest('error');
        
        // Run module tests if available
        if (typeof consoleTests !== 'undefined') {
            await consoleTests.runAll();
        }
        
        if (typeof networkTests !== 'undefined') {
            await networkTests.runAll();
        }
        
        this.logActivity('All tests completed', 'info');
    }

    updateTestResults(passed = 0, failed = 0, pending = 0) {
        this.tests.passed += passed;
        this.tests.failed += failed;
        this.tests.pending += pending;
        this.tests.total = this.tests.passed + this.tests.failed + this.tests.pending;
        
        document.getElementById('tests-passed').textContent = this.tests.passed;
        document.getElementById('tests-failed').textContent = this.tests.failed;
        document.getElementById('tests-pending').textContent = this.tests.pending;
    }

    resetTestResults() {
        this.tests = {
            passed: 0,
            failed: 0,
            pending: 0,
            total: 0
        };
        this.updateTestResults(0, 0, 0);
    }

    logActivity(message, type = 'info') {
        const log = document.getElementById('activity-log');
        if (!log) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        entry.textContent = `[${timestamp}] ${message}`;
        
        log.insertBefore(entry, log.firstChild);
        
        // Keep only last 100 entries
        while (log.children.length > 100) {
            log.removeChild(log.lastChild);
        }
    }

    getActiveServerUrl() {
        return this.activeServer ? this.servers[this.activeServer] : this.servers.remote;
    }
}

// Global functions
function clearActivityLog() {
    const log = document.getElementById('activity-log');
    if (log) {
        log.innerHTML = '<div class="log-entry info">Activity log cleared</div>';
    }
}

function exportActivityLog() {
    const log = document.getElementById('activity-log');
    if (!log) return;
    
    const entries = Array.from(log.children).map(entry => entry.textContent).join('\n');
    const blob = new Blob([entries], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapidtriage-test-log-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    testRunner.logActivity('Activity log exported', 'success');
}

// Initialize test runner
const testRunner = new TestRunner();