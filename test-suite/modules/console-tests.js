// Console Tests Module
const consoleTests = {
    originalConsole: {},
    
    init() {
        // Store original console methods
        this.originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        };
    },
    
    log() {
        console.log('Test log message at', new Date().toISOString());
        this.updateMonitor('log', 'Test log message');
        testRunner.logActivity('Console log test executed', 'success');
    },
    
    info() {
        console.info('Information message:', { test: true, timestamp: Date.now() });
        this.updateMonitor('info', 'Information message');
        testRunner.logActivity('Console info test executed', 'success');
    },
    
    warn() {
        console.warn('Warning: This is a test warning!');
        this.updateMonitor('warn', 'Warning: This is a test warning!');
        testRunner.logActivity('Console warn test executed', 'success');
    },
    
    error() {
        console.error('Error: Test error message', new Error('Test error'));
        this.updateMonitor('error', 'Error: Test error message');
        testRunner.logActivity('Console error test executed', 'success');
    },
    
    group() {
        console.group('Test Group');
        console.log('Inside group message 1');
        console.log('Inside group message 2');
        console.groupEnd();
        this.updateMonitor('log', 'Group: Test Group (2 messages)');
        testRunner.logActivity('Console group test executed', 'success');
    },
    
    table() {
        const data = [
            { name: 'Test 1', value: 100, status: 'passed' },
            { name: 'Test 2', value: 200, status: 'failed' },
            { name: 'Test 3', value: 300, status: 'pending' }
        ];
        console.table(data);
        this.updateMonitor('log', 'Table: 3 rows displayed');
        testRunner.logActivity('Console table test executed', 'success');
    },
    
    clear() {
        console.clear();
        const monitor = document.getElementById('console-monitor');
        if (monitor) {
            monitor.innerHTML = '<div class="console-entry log">[LOG] Console cleared</div>';
        }
        testRunner.logActivity('Console cleared', 'info');
    },
    
    testTrace() {
        console.trace('Stack trace test');
        this.updateMonitor('log', 'Stack trace generated');
        testRunner.logActivity('Console trace test executed', 'success');
    },
    
    testTime() {
        console.time('test-timer');
        setTimeout(() => {
            console.timeEnd('test-timer');
            this.updateMonitor('log', 'Timer: test-timer completed');
            testRunner.logActivity('Console timer test completed', 'success');
        }, 1000);
    },
    
    testAssert() {
        console.assert(true, 'This should not appear');
        console.assert(false, 'This assertion failed (expected)');
        this.updateMonitor('error', 'Assertion failed (expected)');
        testRunner.logActivity('Console assert test executed', 'success');
    },
    
    testCount() {
        for (let i = 0; i < 5; i++) {
            console.count('test-counter');
        }
        console.countReset('test-counter');
        this.updateMonitor('log', 'Counter: test-counter (5 times)');
        testRunner.logActivity('Console count test executed', 'success');
    },
    
    updateMonitor(type, message) {
        const monitor = document.getElementById('console-monitor');
        if (!monitor) return;
        
        const entry = document.createElement('div');
        entry.className = `console-entry ${type}`;
        const timestamp = new Date().toLocaleTimeString();
        entry.textContent = `[${type.toUpperCase()}] ${message}`;
        
        monitor.appendChild(entry);
        
        // Keep only last 50 entries
        while (monitor.children.length > 50) {
            monitor.removeChild(monitor.firstChild);
        }
        
        // Auto-scroll to bottom
        monitor.scrollTop = monitor.scrollHeight;
    },
    
    async runAll() {
        testRunner.logActivity('Running all console tests...', 'info');
        
        this.log();
        await TestUtils.sleep(100);
        
        this.info();
        await TestUtils.sleep(100);
        
        this.warn();
        await TestUtils.sleep(100);
        
        this.error();
        await TestUtils.sleep(100);
        
        this.group();
        await TestUtils.sleep(100);
        
        this.table();
        
        testRunner.updateTestResults(6, 0, 0);
        testRunner.logActivity('Console tests completed', 'success');
    }
};

// Initialize on load
consoleTests.init();