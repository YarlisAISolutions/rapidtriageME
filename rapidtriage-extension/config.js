// RapidTriage Extension Configuration
const RAPIDTRIAGE_CONFIG = {
    // API Endpoints
    LOCAL_API: 'http://localhost:3025',
    REMOTE_API: 'https://rapidtriage.me',

    // Default API Token
    DEFAULT_TOKEN: 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8',

    // Server Signatures
    LOCAL_SIGNATURE: 'mcp-browser-connector-24x7',
    REMOTE_SIGNATURE: 'rapidtriage-remote',

    // Timeouts
    CONNECTION_TIMEOUT: 3000,
    REQUEST_TIMEOUT: 30000,
    RETRY_DELAY: 500,
    MAX_RETRIES: 3,

    // Operations
    OPERATIONS: {
        // Navigation & Control
        NAVIGATE: '/navigate',
        EXECUTE_JS: '/execute',
        CLEAR: '/clear',

        // Data Capture
        SCREENSHOT: '/screenshot',
        CONSOLE_LOGS: '/console',
        CONSOLE_ERRORS: '/console/errors',
        NETWORK_LOGS: '/network',
        NETWORK_ERRORS: '/network/errors',
        PAGE_INFO: '/page-info',

        // Lighthouse Audits
        LIGHTHOUSE_PERFORMANCE: '/lighthouse/performance',
        LIGHTHOUSE_ACCESSIBILITY: '/lighthouse/accessibility',
        LIGHTHOUSE_SEO: '/lighthouse/seo',
        LIGHTHOUSE_BEST_PRACTICES: '/lighthouse/best-practices',

        // Element Inspection
        INSPECT_ELEMENT: '/inspect-element',
        GET_SELECTED_ELEMENT: '/selected-element',

        // Health & Identity
        HEALTH: '/health',
        IDENTITY: '/.identity'
    },

    // Remote API Operations (require auth)
    REMOTE_OPERATIONS: {
        SCREENSHOT: '/api/screenshot',
        CONSOLE_LOGS: '/api/console-logs',
        CONSOLE_ERRORS: '/api/console-errors',
        NETWORK_LOGS: '/api/network-logs',
        NETWORK_ERRORS: '/api/network-errors',
        LIGHTHOUSE: '/api/lighthouse',
        LIGHTHOUSE_ACCESSIBILITY: '/api/lighthouse/accessibility',
        LIGHTHOUSE_PERFORMANCE: '/api/lighthouse/performance',
        LIGHTHOUSE_SEO: '/api/lighthouse/seo',
        LIGHTHOUSE_BEST_PRACTICES: '/api/lighthouse/best-practices',
        NAVIGATE: '/api/navigate',
        EXECUTE_JS: '/api/execute-js',
        INSPECT_ELEMENT: '/api/inspect-element',
        TRIAGE_REPORT: '/api/triage-report',
        CLEAR_BROWSER_DATA: '/api/clear-browser-data'
    },

    // Debug Mode
    DEBUG_ENABLED: false,

    // Auto-discovery settings
    AUTO_DISCOVERY: {
        ENABLED: true,
        INTERVAL: 5000,
        MAX_ATTEMPTS: 10
    }
};

// Helper function to get the appropriate API endpoint
function getApiEndpoint(operation, isRemote = false) {
    if (isRemote) {
        return RAPIDTRIAGE_CONFIG.REMOTE_API + (RAPIDTRIAGE_CONFIG.REMOTE_OPERATIONS[operation] || '');
    }
    return RAPIDTRIAGE_CONFIG.LOCAL_API + (RAPIDTRIAGE_CONFIG.OPERATIONS[operation] || '');
}

// Helper function to determine if we should use remote API
function shouldUseRemoteApi(currentUrl) {
    // Use local API for local development
    if (!currentUrl ||
        currentUrl.startsWith('http://localhost') ||
        currentUrl.startsWith('http://127.0.0.1') ||
        currentUrl.startsWith('file://') ||
        currentUrl.startsWith('chrome://') ||
        currentUrl.startsWith('chrome-extension://')) {
        return false;
    }
    // Use remote API for production sites
    return true;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RAPIDTRIAGE_CONFIG,
        getApiEndpoint,
        shouldUseRemoteApi
    };
}