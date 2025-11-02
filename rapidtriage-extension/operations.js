// RapidTriage Operations Module
// Provides all debugging operations for issue fixing

class RapidTriageOperations {
    constructor() {
        this.config = typeof RAPIDTRIAGE_CONFIG !== 'undefined' ? RAPIDTRIAGE_CONFIG : null;
        this.isConnected = false;
        this.connectionType = null; // 'local' or 'remote'
        this.currentTab = null;
        this.logs = [];
    }

    // Initialize and test connection
    async initialize() {
        try {
            // Get current tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tabs[0];

            // Test local connection first
            const localConnected = await this.testConnection('local');
            if (localConnected) {
                this.isConnected = true;
                this.connectionType = 'local';
                this.log('✅ Connected to local browser connector');
                return { success: true, type: 'local' };
            }

            // Test remote connection
            const remoteConnected = await this.testConnection('remote');
            if (remoteConnected) {
                this.isConnected = true;
                this.connectionType = 'remote';
                this.log('✅ Connected to RapidTriage remote server');
                return { success: true, type: 'remote' };
            }

            this.log('❌ No connection available');
            return { success: false, error: 'No connection available' };
        } catch (error) {
            this.log(`❌ Initialization error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // Test connection to server
    async testConnection(type = 'local') {
        try {
            const url = type === 'local'
                ? 'http://localhost:3025/.identity'
                : 'https://rapidtriage.me/health';

            const response = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });

            if (!response.ok) return false;

            const data = await response.json();

            if (type === 'local') {
                return data.signature === 'mcp-browser-connector-24x7';
            } else {
                return data.status === 'healthy';
            }
        } catch (error) {
            return false;
        }
    }

    // Navigate to URL
    async navigate(url) {
        if (!this.isConnected) {
            await this.initialize();
        }

        try {
            const endpoint = this.connectionType === 'local'
                ? 'http://localhost:3025/navigate'
                : 'https://rapidtriage.me/api/navigate';

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({ url })
            });

            this.log(`🌐 Navigated to: ${url}`);
            return response;
        } catch (error) {
            this.log(`❌ Navigation failed: ${error.message}`);
            throw error;
        }
    }

    // Take screenshot
    async captureScreenshot(fullPage = false) {
        if (!this.isConnected) {
            await this.initialize();
        }

        try {
            if (this.connectionType === 'local') {
                // Local screenshot via browser connector
                const response = await this.makeRequest('http://localhost:3025/screenshot', {
                    method: 'POST',
                    body: JSON.stringify({ fullPage })
                });
                this.log('📸 Screenshot captured (local)');
                return response;
            } else {
                // Remote screenshot via extension API
                return new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({
                        type: 'CAPTURE_SCREENSHOT',
                        tabId: this.currentTab.id
                    }, response => {
                        if (response.success) {
                            this.log('📸 Screenshot captured (remote)');
                            resolve(response);
                        } else {
                            reject(new Error(response.error));
                        }
                    });
                });
            }
        } catch (error) {
            this.log(`❌ Screenshot failed: ${error.message}`);
            throw error;
        }
    }

    // Get console logs
    async getConsoleLogs() {
        if (!this.isConnected) {
            await this.initialize();
        }

        try {
            const endpoint = this.connectionType === 'local'
                ? 'http://localhost:3025/console'
                : 'https://rapidtriage.me/api/console-logs';

            const response = await this.makeRequest(endpoint, {
                method: this.connectionType === 'local' ? 'GET' : 'POST',
                body: this.connectionType === 'local' ? undefined : JSON.stringify({})
            });

            const logs = response.logs || [];
            this.log(`📋 Retrieved ${logs.length} console logs`);
            return logs;
        } catch (error) {
            this.log(`❌ Failed to get console logs: ${error.message}`);
            throw error;
        }
    }

    // Get console errors
    async getConsoleErrors() {
        if (!this.isConnected) {
            await this.initialize();
        }

        try {
            const endpoint = this.connectionType === 'local'
                ? 'http://localhost:3025/console/errors'
                : 'https://rapidtriage.me/api/console-errors';

            const response = await this.makeRequest(endpoint, {
                method: this.connectionType === 'local' ? 'GET' : 'POST',
                body: this.connectionType === 'local' ? undefined : JSON.stringify({})
            });

            const errors = response.errors || [];
            this.log(`🔴 Retrieved ${errors.length} console errors`);
            return errors;
        } catch (error) {
            this.log(`❌ Failed to get console errors: ${error.message}`);
            throw error;
        }
    }

    // Get network logs
    async getNetworkLogs() {
        if (!this.isConnected) {
            await this.initialize();
        }

        try {
            const endpoint = this.connectionType === 'local'
                ? 'http://localhost:3025/network'
                : 'https://rapidtriage.me/api/network-logs';

            const response = await this.makeRequest(endpoint, {
                method: this.connectionType === 'local' ? 'GET' : 'POST',
                body: this.connectionType === 'local' ? undefined : JSON.stringify({})
            });

            const requests = response.requests || [];
            this.log(`🌐 Retrieved ${requests.length} network requests`);
            return requests;
        } catch (error) {
            this.log(`❌ Failed to get network logs: ${error.message}`);
            throw error;
        }
    }

    // Get network errors
    async getNetworkErrors() {
        if (!this.isConnected) {
            await this.initialize();
        }

        try {
            const endpoint = this.connectionType === 'local'
                ? 'http://localhost:3025/network/errors'
                : 'https://rapidtriage.me/api/network-errors';

            const response = await this.makeRequest(endpoint, {
                method: this.connectionType === 'local' ? 'GET' : 'POST',
                body: this.connectionType === 'local' ? undefined : JSON.stringify({})
            });

            const errors = response.errors || [];
            this.log(`⚠️ Retrieved ${errors.length} network errors`);
            return errors;
        } catch (error) {
            this.log(`❌ Failed to get network errors: ${error.message}`);
            throw error;
        }
    }

    // Run Lighthouse audit
    async runLighthouseAudit(type = 'performance') {
        if (!this.isConnected) {
            await this.initialize();
        }

        try {
            const endpoint = this.connectionType === 'local'
                ? `http://localhost:3025/lighthouse/${type}`
                : `https://rapidtriage.me/api/lighthouse/${type}`;

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({})
            });

            const score = response.score;
            if (score !== undefined) {
                this.log(`📊 ${type} audit score: ${Math.round(score * 100)}/100`);
            }
            return response;
        } catch (error) {
            this.log(`❌ Lighthouse ${type} audit failed: ${error.message}`);
            throw error;
        }
    }

    // Execute JavaScript
    async executeJS(script) {
        if (!this.isConnected) {
            await this.initialize();
        }

        try {
            const endpoint = this.connectionType === 'local'
                ? 'http://localhost:3025/execute'
                : 'https://rapidtriage.me/api/execute-js';

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({ script })
            });

            this.log('✅ JavaScript executed');
            return response;
        } catch (error) {
            this.log(`❌ JavaScript execution failed: ${error.message}`);
            throw error;
        }
    }

    // Inspect element
    async inspectElement(selector) {
        if (!this.isConnected) {
            await this.initialize();
        }

        try {
            const endpoint = this.connectionType === 'local'
                ? 'http://localhost:3025/inspect-element'
                : 'https://rapidtriage.me/api/inspect-element';

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({ selector })
            });

            this.log(`🔍 Element inspected: ${selector}`);
            return response;
        } catch (error) {
            this.log(`❌ Element inspection failed: ${error.message}`);
            throw error;
        }
    }

    // Generate triage report
    async generateTriageReport() {
        if (!this.isConnected) {
            await this.initialize();
        }

        try {
            // Collect all data
            const [consoleLogs, consoleErrors, networkLogs, networkErrors] = await Promise.all([
                this.getConsoleLogs().catch(() => []),
                this.getConsoleErrors().catch(() => []),
                this.getNetworkLogs().catch(() => []),
                this.getNetworkErrors().catch(() => [])
            ]);

            // Run audits
            const audits = {};
            for (const type of ['performance', 'accessibility', 'seo', 'best-practices']) {
                try {
                    audits[type] = await this.runLighthouseAudit(type);
                } catch (e) {
                    audits[type] = { error: e.message };
                }
            }

            const report = {
                timestamp: new Date().toISOString(),
                url: this.currentTab?.url || 'Unknown',
                title: this.currentTab?.title || 'Unknown',
                consoleLogs: consoleLogs.length,
                consoleErrors: consoleErrors.length,
                networkRequests: networkLogs.length,
                networkErrors: networkErrors.length,
                audits: audits,
                logs: this.logs
            };

            this.log('📄 Triage report generated');
            return report;
        } catch (error) {
            this.log(`❌ Report generation failed: ${error.message}`);
            throw error;
        }
    }

    // Clear all data
    async clearData() {
        if (!this.isConnected) {
            await this.initialize();
        }

        try {
            const endpoint = this.connectionType === 'local'
                ? 'http://localhost:3025/clear'
                : 'https://rapidtriage.me/api/clear-browser-data';

            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    cache: true,
                    cookies: true,
                    localStorage: true
                })
            });

            this.logs = [];
            this.log('🧹 Data cleared');
            return response;
        } catch (error) {
            this.log(`❌ Failed to clear data: ${error.message}`);
            throw error;
        }
    }

    // Make authenticated request
    async makeRequest(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add auth token for remote requests
        if (this.connectionType === 'remote') {
            const token = await this.getAuthToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Request failed: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    // Get auth token from storage
    async getAuthToken() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['apiToken'], (items) => {
                resolve(items.apiToken || null);
            });
        });
    }

    // Log message
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.push(logEntry);
        console.log(`RapidTriage: ${message}`);

        // Limit logs to last 100 entries
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(-100);
        }
    }

    // Get operation logs
    getLogs() {
        return this.logs;
    }
}

// Export for use in extension
if (typeof window !== 'undefined') {
    window.RapidTriageOperations = RapidTriageOperations;
}