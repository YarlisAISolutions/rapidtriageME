// RapidTriageME Extension Configuration
// This file contains configuration that can be updated without rebuilding the extension
// Values can be overridden via Chrome storage or environment variables

const RAPIDTRIAGE_CONFIG = {
  // API Configuration - DO NOT hardcode sensitive tokens
  api: {
    // Default fallback token (should be overridden via Chrome storage)
    defaultToken: null,  // Set via chrome.storage.sync.get(['apiToken'])
    tokenStorageKey: 'apiToken'
  },
  
  // Server connection defaults
  server: {
    defaultHost: 'localhost',
    defaultPort: 3025,
    remoteHost: 'rapidtriage.me',
    remotePort: 443,
    remoteProtocol: 'https',
    fallbackHosts: ['127.0.0.1', 'localhost'],
    fallbackPorts: [3025, 3026, 3027, 3028, 3029, 3030],
    timeout: 5000,
    reconnectDelay: 30000,
    identityEndpoint: '/.identity',
    healthEndpoint: '/health'
  },
  
  // Extension defaults
  extension: {
    logLimit: 50,
    queryLimit: 30000,
    stringSizeLimit: 500,
    maxLogSize: 20000,
    allowAutoPaste: false,
    showRequestHeaders: false,
    showResponseHeaders: false
  },
  
  // Identity signatures for server validation
  serverSignatures: [
    'mcp-browser-connector-24x7',  // Local browser tools server
    'rapidtriage-remote'            // Remote RapidTriage server
  ],
  
  // Remote server options (if using cloud deployment)
  remote: {
    enabled: false,
    host: 'rapidtriage.me',
    port: 443,
    protocol: 'https'
  },
  
  // Feature flags
  features: {
    autoDiscovery: true,
    remoteScreenshot: true,
    performanceMetrics: true,
    networkAnalysis: true
  },
  
  // Chrome version compatibility
  compatibility: {
    minChromeVersion: 135,
    useDelayedInit: true,
    initDelay: 200
  },
  
  // API Endpoints
  endpoints: {
    screenshot: '/screenshot',
    screenshotRemote: '/api/screenshot',
    lighthouse: '/api/lighthouse',
    consoleLogs: '/api/console-logs',
    consoleErrors: '/api/console-errors',
    networkLogs: '/api/network-logs',
    networkErrors: '/api/network-errors',
    openFolder: '/open-folder'
  },
  
  // Helper functions
  getLocalServerUrl: function() {
    return `http://${this.server.defaultHost}:${this.server.defaultPort}`;
  },
  
  getRemoteServerUrl: function() {
    return `${this.remote.protocol}://${this.remote.host}`;
  },
  
  getApiToken: function(callback) {
    // Try to get token from Chrome storage first
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get([this.api.tokenStorageKey], function(items) {
        const token = items[RAPIDTRIAGE_CONFIG.api.tokenStorageKey] || null;
        callback(token);
      });
    } else {
      callback(this.api.defaultToken);
    }
  }
};

// Make globally accessible
if (typeof window !== 'undefined') {
  window.RAPIDTRIAGE_CONFIG = RAPIDTRIAGE_CONFIG;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RAPIDTRIAGE_CONFIG;
}
