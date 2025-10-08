// RapidTriageME Test Utilities

class TestUtils {
    // API Helper Methods
    static async fetchWithTimeout(url, options = {}, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
            }
            throw error;
        }
    }

    // Get the appropriate API base URL
    static getApiUrl(useLocal = false) {
        if (useLocal || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            return 'http://localhost:3025';
        }
        return 'https://rapidtriage.me';
    }

    // Format bytes to human readable
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Format milliseconds to human readable
    static formatTime(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    }

    // Generate random test data
    static generateTestData(type = 'string', length = 100) {
        switch(type) {
            case 'string':
                return Math.random().toString(36).substring(2, length + 2);
            case 'number':
                return Math.floor(Math.random() * length);
            case 'array':
                return Array.from({length}, () => Math.random());
            case 'object':
                return {
                    id: Math.random().toString(36).substring(2, 9),
                    timestamp: Date.now(),
                    value: Math.random(),
                    nested: {
                        level: 2,
                        data: Math.random().toString(36)
                    }
                };
            default:
                return null;
        }
    }

    // Wait for a condition to be true
    static async waitFor(condition, timeout = 5000, interval = 100) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return true;
            }
            await this.sleep(interval);
        }
        
        throw new Error('Timeout waiting for condition');
    }

    // Sleep helper
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Measure function execution time
    static async measureTime(fn, name = 'Function') {
        const start = performance.now();
        try {
            const result = await fn();
            const end = performance.now();
            const duration = end - start;
            console.log(`${name} took ${duration.toFixed(2)}ms`);
            return { result, duration };
        } catch (error) {
            const end = performance.now();
            const duration = end - start;
            console.error(`${name} failed after ${duration.toFixed(2)}ms:`, error);
            throw error;
        }
    }

    // Create a mock console
    static createMockConsole() {
        const logs = [];
        
        return {
            log: (...args) => logs.push({type: 'log', args, timestamp: Date.now()}),
            info: (...args) => logs.push({type: 'info', args, timestamp: Date.now()}),
            warn: (...args) => logs.push({type: 'warn', args, timestamp: Date.now()}),
            error: (...args) => logs.push({type: 'error', args, timestamp: Date.now()}),
            getLogs: () => logs,
            clear: () => logs.length = 0
        };
    }

    // Create a performance observer
    static observePerformance(callback) {
        if (!window.PerformanceObserver) {
            console.warn('PerformanceObserver not supported');
            return null;
        }
        
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                callback(entry);
            }
        });
        
        try {
            observer.observe({ entryTypes: ['measure', 'navigation', 'resource', 'paint'] });
        } catch (error) {
            console.error('Failed to observe performance:', error);
        }
        
        return observer;
    }

    // Test assertion helpers
    static assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    static assertEquals(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`Assertion failed: Expected ${expected}, got ${actual}. ${message}`);
        }
    }

    static assertContains(haystack, needle, message = '') {
        if (!haystack.includes(needle)) {
            throw new Error(`Assertion failed: "${haystack}" does not contain "${needle}". ${message}`);
        }
    }

    // Network monitoring helper
    static monitorNetworkRequests() {
        const requests = [];
        
        // Override fetch
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const start = performance.now();
            const [url, options] = args;
            
            try {
                const response = await originalFetch.apply(this, args);
                const end = performance.now();
                
                requests.push({
                    url: url.toString(),
                    method: options?.method || 'GET',
                    status: response.status,
                    duration: end - start,
                    timestamp: Date.now()
                });
                
                return response;
            } catch (error) {
                const end = performance.now();
                
                requests.push({
                    url: url.toString(),
                    method: options?.method || 'GET',
                    status: 0,
                    error: error.message,
                    duration: end - start,
                    timestamp: Date.now()
                });
                
                throw error;
            }
        };
        
        return {
            getRequests: () => requests,
            clear: () => requests.length = 0,
            restore: () => window.fetch = originalFetch
        };
    }

    // DOM helper methods
    static createElement(tag, className, textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    static clearElement(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.innerHTML = '';
        }
    }

    static updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            if (typeof content === 'string') {
                element.textContent = content;
            } else {
                element.innerHTML = '';
                element.appendChild(content);
            }
        }
    }

    // Test result formatting
    static formatTestResult(passed, message = '') {
        return {
            passed,
            message,
            timestamp: Date.now(),
            formatted: passed 
                ? `✅ PASS: ${message}` 
                : `❌ FAIL: ${message}`
        };
    }

    // Browser detection
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = '';
        
        if (ua.includes('Chrome')) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/(\d+)/)?.[1] || '';
        } else if (ua.includes('Firefox')) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/(\d+)/)?.[1] || '';
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browser = 'Safari';
            version = ua.match(/Version\/(\d+)/)?.[1] || '';
        } else if (ua.includes('Edge')) {
            browser = 'Edge';
            version = ua.match(/Edge\/(\d+)/)?.[1] || '';
        }
        
        return { browser, version, userAgent: ua };
    }

    // Local storage helpers
    static saveTestData(key, data) {
        try {
            localStorage.setItem(`rapidtriage-test-${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save test data:', error);
            return false;
        }
    }

    static loadTestData(key) {
        try {
            const data = localStorage.getItem(`rapidtriage-test-${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load test data:', error);
            return null;
        }
    }

    static clearTestData() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('rapidtriage-test-'));
        keys.forEach(key => localStorage.removeItem(key));
        return keys.length;
    }

    // Event simulation
    static simulateClick(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            const event = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(event);
        }
    }

    static simulateInput(element, value) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.value = value;
            const event = new Event('input', {
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(event);
        }
    }

    // Error handling helper
    static async tryCatch(fn, errorHandler) {
        try {
            return await fn();
        } catch (error) {
            if (errorHandler) {
                return errorHandler(error);
            }
            console.error('Error in test:', error);
            return null;
        }
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestUtils;
}