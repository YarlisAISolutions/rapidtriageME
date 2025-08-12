// Performance Tests Module
const performanceTests = {
    metrics: {},
    
    measureLoad() {
        testRunner.logActivity('Measuring page load time...', 'info');
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        document.getElementById('load-time').textContent = `${loadTime}ms`;
        this.updateStatus('load-status', loadTime < 1000 ? 'good' : loadTime < 3000 ? 'needs-improvement' : 'poor');
        testRunner.updateTestResults(1, 0, 0);
    },
    
    measureFCP() {
        testRunner.logActivity('Measuring First Contentful Paint...', 'info');
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    document.getElementById('fcp-time').textContent = `${Math.round(entry.startTime)}ms`;
                    this.updateStatus('fcp-status', entry.startTime < 1000 ? 'good' : entry.startTime < 2500 ? 'needs-improvement' : 'poor');
                }
            }
        });
        observer.observe({ entryTypes: ['paint'] });
        testRunner.updateTestResults(1, 0, 0);
    },
    
    measureLCP() {
        testRunner.logActivity('Measuring Largest Contentful Paint...', 'info');
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                document.getElementById('lcp-time').textContent = `${Math.round(entry.renderTime || entry.loadTime)}ms`;
                const time = entry.renderTime || entry.loadTime;
                this.updateStatus('lcp-status', time < 2500 ? 'good' : time < 4000 ? 'needs-improvement' : 'poor');
            }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        testRunner.updateTestResults(1, 0, 0);
    },
    
    measureCLS() {
        testRunner.logActivity('Measuring Cumulative Layout Shift...', 'info');
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            document.getElementById('cls-score').textContent = clsValue.toFixed(3);
            this.updateStatus('cls-status', clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor');
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        testRunner.updateTestResults(1, 0, 0);
    },
    
    async runBenchmark() {
        testRunner.logActivity('Running full performance benchmark...', 'info');
        
        this.measureLoad();
        await TestUtils.sleep(100);
        
        this.measureFCP();
        await TestUtils.sleep(100);
        
        this.measureLCP();
        await TestUtils.sleep(100);
        
        this.measureCLS();
        
        // Measure resource timing
        const resources = performance.getEntriesByType('resource');
        const resourceList = document.getElementById('resource-list');
        if (resourceList) {
            resourceList.innerHTML = `
                <div>Total Resources: ${resources.length}</div>
                <div>Total Size: ${TestUtils.formatBytes(resources.reduce((sum, r) => sum + (r.transferSize || 0), 0))}</div>
                <div>Total Duration: ${Math.round(resources.reduce((sum, r) => sum + r.duration, 0))}ms</div>
            `;
        }
        
        testRunner.logActivity('Performance benchmark completed', 'success');
    },
    
    updateStatus(elementId, status) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = status.replace('-', ' ');
            element.className = `metric-status ${status}`;
        }
    }
};