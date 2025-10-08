// Options page script for RapidTriage Settings

// Default settings
const DEFAULT_SETTINGS = {
    screenshotPath: '~/RapidTriage_Screenshots/',
    autoSaveScreenshots: true,
    timestampScreenshots: true,
    serverMode: 'auto',
    customServerUrl: 'http://localhost:3025',
    localPort: '3025',
    apiToken: '', // API authentication token (stored securely)
    enableDebugMode: false,
    verboseLogging: false,
    persistLogs: true,
    logLimit: '100',
    autoRunAudits: false,
    saveAuditReports: false,
    auditAccessibility: true,
    auditPerformance: true,
    auditSeo: true,
    auditBestPractices: true
};

// Load settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    attachEventListeners();
});

// Load settings from Chrome storage
function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, function(items) {
        // Populate form fields
        document.getElementById('screenshot-path').value = items.screenshotPath;
        document.getElementById('auto-save-screenshots').checked = items.autoSaveScreenshots;
        document.getElementById('timestamp-screenshots').checked = items.timestampScreenshots;
        
        document.getElementById('server-mode').value = items.serverMode;
        document.getElementById('custom-server-url').value = items.customServerUrl;
        document.getElementById('local-port').value = items.localPort;
        
        document.getElementById('enable-debug-mode').checked = items.enableDebugMode;
        document.getElementById('verbose-logging').checked = items.verboseLogging;
        document.getElementById('persist-logs').checked = items.persistLogs;
        document.getElementById('log-limit').value = items.logLimit;
        
        document.getElementById('auto-run-audits').checked = items.autoRunAudits;
        document.getElementById('save-audit-reports').checked = items.saveAuditReports;
        document.getElementById('audit-accessibility').checked = items.auditAccessibility;
        document.getElementById('audit-performance').checked = items.auditPerformance;
        document.getElementById('audit-seo').checked = items.auditSeo;
        document.getElementById('audit-best-practices').checked = items.auditBestPractices;
        
        // Show/hide custom server URL field
        toggleCustomServerField();
    });
}

// Attach event listeners to form elements
function attachEventListeners() {
    // Save button
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
    // Reset button
    document.getElementById('reset-defaults').addEventListener('click', resetToDefaults);
    
    // Clear data button
    document.getElementById('clear-data').addEventListener('click', clearAllData);
    
    // Server mode change
    document.getElementById('server-mode').addEventListener('change', toggleCustomServerField);
    
    // Browse button (placeholder - would need native messaging for real implementation)
    document.getElementById('browse-path').addEventListener('click', browsePath);
}

// Save settings to Chrome storage
function saveSettings() {
    const settings = {
        screenshotPath: document.getElementById('screenshot-path').value || DEFAULT_SETTINGS.screenshotPath,
        autoSaveScreenshots: document.getElementById('auto-save-screenshots').checked,
        timestampScreenshots: document.getElementById('timestamp-screenshots').checked,
        serverMode: document.getElementById('server-mode').value,
        customServerUrl: document.getElementById('custom-server-url').value,
        localPort: document.getElementById('local-port').value,
        enableDebugMode: document.getElementById('enable-debug-mode').checked,
        verboseLogging: document.getElementById('verbose-logging').checked,
        persistLogs: document.getElementById('persist-logs').checked,
        logLimit: document.getElementById('log-limit').value || DEFAULT_SETTINGS.logLimit,
        autoRunAudits: document.getElementById('auto-run-audits').checked,
        saveAuditReports: document.getElementById('save-audit-reports').checked,
        auditAccessibility: document.getElementById('audit-accessibility').checked,
        auditPerformance: document.getElementById('audit-performance').checked,
        auditSeo: document.getElementById('audit-seo').checked,
        auditBestPractices: document.getElementById('audit-best-practices').checked
    };
    
    // Validate settings
    if (!validateSettings(settings)) {
        return;
    }
    
    // Save to Chrome storage
    chrome.storage.sync.set(settings, function() {
        showStatus('Settings saved successfully!', 'success');
        
        // Notify popup if it's open
        chrome.runtime.sendMessage({
            type: 'SETTINGS_UPDATED',
            settings: settings
        });
        
        // Update server configuration if needed
        if (settings.serverMode === 'custom' && settings.customServerUrl) {
            updateServerConfig(settings.customServerUrl);
        }
    });
}

// Reset to default settings
function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        chrome.storage.sync.set(DEFAULT_SETTINGS, function() {
            loadSettings();
            showStatus('Settings reset to defaults', 'success');
        });
    }
}

// Clear all stored data
function clearAllData() {
    if (confirm('This will clear all stored data including logs, screenshots metadata, and settings. Are you sure?')) {
        // Clear sync storage
        chrome.storage.sync.clear(function() {
            // Clear local storage
            chrome.storage.local.clear(function() {
                // Reset to defaults
                chrome.storage.sync.set(DEFAULT_SETTINGS, function() {
                    loadSettings();
                    showStatus('All data cleared successfully', 'success');
                });
            });
        });
    }
}

// Toggle custom server URL field visibility
function toggleCustomServerField() {
    const serverMode = document.getElementById('server-mode').value;
    const customServerGroup = document.getElementById('custom-server-group');
    
    if (serverMode === 'custom') {
        customServerGroup.style.display = 'block';
    } else {
        customServerGroup.style.display = 'none';
    }
}

// Browse for path (placeholder function)
function browsePath() {
    // This would require native messaging to actually browse folders
    // For now, just show an info message
    const currentPath = document.getElementById('screenshot-path').value;
    const examplePaths = {
        'Windows': 'C:\\Users\\YourName\\RapidTriage\\Screenshots\\',
        'Mac': '/Users/YourName/RapidTriage/Screenshots/',
        'Linux': '/home/yourname/RapidTriage/Screenshots/'
    };
    
    let platform = 'Windows';
    if (navigator.platform.includes('Mac')) platform = 'Mac';
    else if (navigator.platform.includes('Linux')) platform = 'Linux';
    
    const suggestedPath = examplePaths[platform];
    
    if (confirm(`Current path: ${currentPath}\n\nSuggested path for ${platform}:\n${suggestedPath}\n\nUse suggested path?`)) {
        document.getElementById('screenshot-path').value = suggestedPath;
    }
}

// Validate settings before saving
function validateSettings(settings) {
    // Validate screenshot path
    if (settings.screenshotPath && !isValidPath(settings.screenshotPath)) {
        showStatus('Invalid screenshot path format', 'error');
        return false;
    }
    
    // Validate custom server URL
    if (settings.serverMode === 'custom') {
        if (!settings.customServerUrl) {
            showStatus('Custom server URL is required when using custom mode', 'error');
            return false;
        }
        if (!isValidUrl(settings.customServerUrl)) {
            showStatus('Invalid server URL format', 'error');
            return false;
        }
    }
    
    // Validate port number
    const port = parseInt(settings.localPort);
    if (isNaN(port) || port < 1 || port > 65535) {
        showStatus('Invalid port number (must be 1-65535)', 'error');
        return false;
    }
    
    // Validate log limit
    const logLimit = parseInt(settings.logLimit);
    if (isNaN(logLimit) || logLimit < 10 || logLimit > 10000) {
        showStatus('Invalid log limit (must be 10-10000)', 'error');
        return false;
    }
    
    return true;
}

// Check if path is valid
function isValidPath(path) {
    // Basic path validation - just check for invalid characters
    const invalidChars = /[<>"|?*]/;
    return !invalidChars.test(path);
}

// Check if URL is valid
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Update server configuration
function updateServerConfig(serverUrl) {
    // Send message to background script to update server config
    chrome.runtime.sendMessage({
        type: 'UPDATE_SERVER_CONFIG',
        serverUrl: serverUrl
    });
}

// Show status message
function showStatus(message, type) {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        statusElement.style.display = 'none';
    }, 3000);
}

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveSettings();
    }
    
    // Escape to close
    if (e.key === 'Escape') {
        window.close();
    }
});

// Auto-save on change (optional - can be enabled)
function enableAutoSave() {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            // Debounce to avoid too many saves
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = setTimeout(() => {
                saveSettings();
            }, 1000);
        });
    });
}

// Export settings to file
function exportSettings() {
    chrome.storage.sync.get(null, function(settings) {
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapidtriage-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        showStatus('Settings exported successfully', 'success');
    });
}

// Import settings from file
function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const settings = JSON.parse(e.target.result);
                
                // Validate imported settings
                if (validateSettings(settings)) {
                    chrome.storage.sync.set(settings, function() {
                        loadSettings();
                        showStatus('Settings imported successfully', 'success');
                    });
                }
            } catch (error) {
                showStatus('Failed to import settings: Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Add export/import buttons if needed
function addExportImportButtons() {
    const buttonGroup = document.querySelector('.button-group');
    
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📥 Export';
    exportBtn.className = 'btn-secondary';
    exportBtn.onclick = exportSettings;
    
    const importBtn = document.createElement('button');
    importBtn.textContent = '📤 Import';
    importBtn.className = 'btn-secondary';
    importBtn.onclick = importSettings;
    
    buttonGroup.appendChild(exportBtn);
    buttonGroup.appendChild(importBtn);
}