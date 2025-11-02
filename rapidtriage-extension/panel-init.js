/**
 * RapidTriage Panel Initialization
 * Simplified initialization that ensures proper connection
 */

// Initialize immediately when DOM is ready
(function() {
    'use strict';
    
    console.log('[RapidTriage] Panel initialization starting...');
    
    // Get config from config.js
    const config = window.RAPIDTRIAGE_CONFIG || {
        server: {
            defaultHost: 'localhost',
            defaultPort: 3025,
            timeout: 5000
        }
    };
    
    // Simple connection test
    async function testServerConnection() {
        const host = config.server.defaultHost;
        const port = config.server.defaultPort;
        
        console.log(`[RapidTriage] Testing connection to ${host}:${port}...`);
        
        try {
            const response = await fetch(`http://${host}:${port}/.identity`, {
                signal: AbortSignal.timeout(config.server.timeout)
            });
            
            if (response.ok) {
                const identity = await response.json();
                console.log('[RapidTriage] Server connected:', identity);
                return { success: true, identity };
            }
        } catch (error) {
            console.error('[RapidTriage] Connection failed:', error.message);
        }
        
        return { success: false };
    }
    
    // Update status display
    function updateStatus(message) {
        const statusElement = document.querySelector('#status');
        if (statusElement) {
            statusElement.textContent = message;
        }
        console.log('[RapidTriage]', message);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    async function init() {
        console.log('[RapidTriage] DOM ready, initializing...');
        updateStatus('Initializing...');
        
        // Wait a moment for everything to settle
        await new Promise(resolve => setTimeout(resolve, 200));
        
        updateStatus('Connecting to server...');
        
        // Try to connect
        const result = await testServerConnection();
        
        if (result.success) {
            updateStatus(`Connected to ${result.identity.name}`);
            // Store connection info for main panel.js
            window.rapidTriageServer = result.identity;
        } else {
            updateStatus('Server not found. Click "Test Server" to retry.');
        }
        
        console.log('[RapidTriage] Initialization complete');
    }
    
})();

