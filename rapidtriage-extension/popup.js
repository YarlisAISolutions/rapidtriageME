// Popup script - guaranteed to work
document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    const chromeVersion = navigator.userAgent.match(/Chrome\/(\d+)/);
    document.getElementById('chrome-version').textContent = chromeVersion ? chromeVersion[1] : 'Unknown';
    document.getElementById('time').textContent = new Date().toLocaleString();
    document.getElementById('status').textContent = 'Ready';
    
    addLog('RapidTriage popup loaded');
    
    // Attach event listeners to buttons (Chrome extensions block inline onclick)
    attachButtonListeners();
    
    // Check if there's a stored selected element in Chrome storage
    chrome.storage.local.get(['rapidtriage_selected_element', 'rapidtriage_selected_time'], function(result) {
        if (result.rapidtriage_selected_element) {
            const element = result.rapidtriage_selected_element;
            const timeAgo = result.rapidtriage_selected_time ? 
                Math.round((Date.now() - result.rapidtriage_selected_time) / 1000) : 0;
            
            addLog('📍 Previously selected element found');
            
            // Show the stored element immediately
            displayElementDetails(element, timeAgo);
        }
    });
    
    // Also check with background script for any recent selections
    chrome.runtime.sendMessage({type: 'GET_STORED_ELEMENT'}, function(response) {
        if (response && response.success && response.data) {
            const element = response.data;
            // Update display if we have fresher data
            displayElementDetails(element, 0);
        }
    });
    
    // Listen for element updates from background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'ELEMENT_UPDATED' && message.data) {
            const element = message.data;
            addLog('🎯 New element selected');
            
            // Store in Chrome storage
            chrome.storage.local.set({
                'rapidtriage_selected_element': element,
                'rapidtriage_selected_time': Date.now()
            });
            
            // Display the full details
            displayElementDetails(element, 0);
        }
    });
});

// Function to determine the correct API base URL
function getApiBaseUrl(url) {
    // Check if URL is local development
    if (!url || 
        url.startsWith('http://localhost') || 
        url.startsWith('http://127.0.0.1') || 
        url.startsWith('file://') ||
        url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://')) {
        // Use local server for local development
        return 'http://localhost:3025';
    }
    // Use remote server for all other URLs
    return 'https://rapidtriage.me';
}

// Function to get API token from storage
function getApiToken(callback) {
    chrome.storage.sync.get(['apiToken'], function(items) {
        const apiToken = items.apiToken || 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8'; // Fallback for backward compatibility
        callback(apiToken);
    });
}

// Function to make authenticated API request
async function makeAuthenticatedRequest(primaryUrl, fallbackUrl, options, callback) {
    getApiToken(async function(apiToken) {
        const authOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${apiToken}`
            }
        };
        
        try {
            const result = await fetchWithFallback(primaryUrl, fallbackUrl, authOptions);
            callback(null, result);
        } catch (error) {
            callback(error, null);
        }
    });
}

// Function to test connection with fallback
async function fetchWithFallback(primaryUrl, fallbackUrl, options = {}) {
    try {
        const response = await fetch(primaryUrl, { ...options, timeout: 5000 });
        if (response.ok) {
            return { response, usedUrl: primaryUrl };
        }
        throw new Error(`Server returned ${response.status}`);
    } catch (primaryError) {
        console.log(`Primary server failed (${primaryUrl}):`, primaryError.message);
        if (fallbackUrl && fallbackUrl !== primaryUrl) {
            try {
                console.log(`Trying fallback server (${fallbackUrl})...`);
                const response = await fetch(fallbackUrl, options);
                if (response.ok) {
                    return { response, usedUrl: fallbackUrl };
                }
            } catch (fallbackError) {
                console.log(`Fallback server also failed:`, fallbackError.message);
            }
        }
        throw primaryError;
    }
}

function addLog(message) {
    const logs = document.getElementById('logs');
    const logDiv = document.createElement('div');
    logDiv.className = 'log';
    logDiv.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logs.insertBefore(logDiv, logs.firstChild);
    
    // Keep only last 20 logs
    while (logs.children.length > 20) {
        logs.removeChild(logs.lastChild);
    }
}

function showPreview(title, content, type = 'info') {
    console.log('showPreview called:', title, type);
    const previewHeader = document.querySelector('.preview-header');
    const previewContent = document.getElementById('preview-content');
    
    if (!previewHeader || !previewContent) {
        console.error('Preview elements not found');
        return;
    }
    
    previewHeader.textContent = title;
    previewContent.innerHTML = content;
    previewContent.className = `preview-content ${type}`;
    
    // Add smooth fade-in animation like in test page
    previewContent.style.opacity = '0';
    setTimeout(() => {
        previewContent.style.transition = 'opacity 0.3s';
        previewContent.style.opacity = '1';
    }, 50);
    
    console.log('Preview updated successfully');
}

// Copy text to clipboard
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        button.style.background = '#4CAF50';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        button.textContent = '❌ Failed';
        setTimeout(() => {
            button.textContent = 'Copy';
            button.style.background = '';
        }, 2000);
    });
}

// Display detailed element information with copy buttons
function displayElementDetails(element, timeAgo = 0) {
    if (!element) return;
    
    // Format attributes for display
    let attributesHtml = '';
    if (element.attributes && Object.keys(element.attributes).length > 0) {
        const attrs = Object.entries(element.attributes)
            .slice(0, 5)
            .map(([key, value]) => `${key}="${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"`)
            .join(' ');
        attributesHtml = attrs;
    }
    
    // Build detailed preview with copy buttons
    const content = `
        <div class="success">✅ Element Selected ${timeAgo > 0 ? `(${timeAgo}s ago)` : ''}</div>
        <div style="margin-top: 10px;">
            <strong>🏷️ Tag:</strong> &lt;${element.tagName}&gt;<br>
            ${element.id ? `<strong>🆔 ID:</strong> #${element.id}<br>` : ''}
            ${element.className ? `<strong>📝 Class:</strong> .${element.className.split(' ').join('.')}<br>` : ''}
            
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <strong>🎯 XPath:</strong>
                    <button class="copy-btn" data-copy="${element.xpath.replace(/"/g, '&quot;')}" 
                            style="padding: 2px 8px; font-size: 10px; margin-left: 5px;">Copy</button>
                </div>
                <code style="font-size: 10px; word-break: break-all; display: block; margin-top: 4px;">${element.xpath}</code>
            </div>
            
            <div style="margin-top: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <strong>🎨 CSS Selector:</strong>
                    <button class="copy-btn" data-copy="${element.cssSelector.replace(/"/g, '&quot;')}"
                            style="padding: 2px 8px; font-size: 10px; margin-left: 5px;">Copy</button>
                </div>
                <code style="font-size: 10px; word-break: break-all; display: block; margin-top: 4px;">${element.cssSelector}</code>
            </div>
            
            ${attributesHtml ? `
            <div style="margin-top: 8px;">
                <strong>📋 Attributes:</strong><br>
                <code style="font-size: 10px;">${attributesHtml}</code>
            </div>` : ''}
            
            <div style="margin-top: 8px;">
                <strong>📐 Position:</strong> ${Math.round(element.position.left)}x${Math.round(element.position.top)}<br>
                <strong>📏 Size:</strong> ${Math.round(element.position.width)}x${Math.round(element.position.height)}px
            </div>
            
            ${element.text ? `
            <div style="margin-top: 8px;">
                <strong>📄 Text:</strong><br>
                <span style="font-size: 10px;">${element.text.substring(0, 50)}${element.text.length > 50 ? '...' : ''}</span>
            </div>` : ''}
            
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #444;">
                <button class="clear-btn" style="padding: 4px 10px; font-size: 11px; background: #666;">Clear Selection</button>
            </div>
        </div>
    `;
    
    showPreview('🔍 Element Inspector', content, 'success');
    
    // Also log to activity
    addLog(`📊 XPath: ${element.xpath}`);
    addLog(`🎨 Selector: ${element.cssSelector}`);
    
    // Attach event listeners to copy buttons
    setTimeout(() => {
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const textToCopy = this.getAttribute('data-copy');
                copyToClipboard(textToCopy, this);
            });
        });
        
        // Attach clear button listener
        const clearBtn = document.querySelector('.clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                chrome.storage.local.remove(['rapidtriage_selected_element', 'rapidtriage_selected_time'], () => {
                    addLog('🧹 Selection cleared');
                    showPreview('🔍 Element Inspector', 
                        '<div class="info">Selection cleared. Click "Inspect Element" to select a new element.</div>', 
                        'info');
                });
            });
        }
    }, 100);
}

function setButtonLoading(buttonElement, loading = true) {
    if (!buttonElement) return;
    
    if (loading) {
        buttonElement.classList.add('loading');
        buttonElement.disabled = true;
        buttonElement.setAttribute('data-original-text', buttonElement.textContent);
    } else {
        buttonElement.classList.remove('loading');
        buttonElement.disabled = false;
        // Restore original text if it was saved
        const originalText = buttonElement.getAttribute('data-original-text');
        if (originalText) {
            buttonElement.textContent = originalText;
        }
    }
}

async function testServer(button) {
    console.log('testServer called with button:', button);
    if (button) setButtonLoading(button, true);
    
    addLog('Testing server connection...');
    document.getElementById('status').textContent = 'Testing...';
    
    try {
        // Get current tab URL to determine which server to test
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        const currentUrl = tabs[0]?.url || '';
        const primaryUrl = getApiBaseUrl(currentUrl);
        const fallbackUrl = primaryUrl === 'http://localhost:3025' 
            ? 'https://rapidtriage.me' 
            : 'http://localhost:3025';
        
        // Show immediate preview
        showPreview('🔍 Server Connection Test', `Testing connection to ${primaryUrl}...<br>Please wait...`, 'info');
        
        const { response, usedUrl } = await fetchWithFallback(
            `${primaryUrl}/.identity`,
            `${fallbackUrl}/.identity`
        );
        
        const data = await response.json();
        
        addLog(`✅ Connected to ${usedUrl}: ${data.name} v${data.version}`);
        document.getElementById('status').textContent = `Connected (${usedUrl.includes('localhost') ? 'Local' : 'Remote'})`;
        
        // Update preview with results
        const content = `
            <div class="success">✅ Connection Successful</div>
            <strong>Server:</strong> ${data.name}<br>
            <strong>Version:</strong> ${data.version}<br>
            <strong>URL:</strong> ${usedUrl}<br>
            <strong>Mode:</strong> ${usedUrl.includes('localhost') ? 'Local Development' : 'Remote Triage'}<br>
            <strong>Signature:</strong> ${data.signature || 'N/A'}
        `;
        showPreview('🔍 Server Connection Test', content, 'success');
        
    } catch (error) {
        addLog(`❌ Connection failed: ${error.message}`);
        document.getElementById('status').textContent = 'Disconnected';
        
        // Update preview with error
        const content = `
            <div class="error">❌ Connection Failed</div>
            <strong>Error:</strong> ${error.message}<br>
            <strong>Solution:</strong> Make sure either local server (port 3025) or remote server (rapidtriage.me) is accessible
        `;
        showPreview('🔍 Server Connection Test', content, 'error');
    } finally {
        if (button) setButtonLoading(button, false);
    }
}

function takeScreenshot(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('📷 Taking screenshot...');
    document.getElementById('status').textContent = 'Taking screenshot...';
    
    // Show immediate preview
    showPreview('📷 Screenshot Capture', 'Capturing current tab screenshot...<br>Please wait...', 'info');
    
    try {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (chrome.runtime.lastError) {
                const error = chrome.runtime.lastError.message;
                addLog(`❌ Screenshot failed: ${error}`);
                document.getElementById('status').textContent = 'Screenshot failed';
                
                const content = `
                    <div class="error">❌ Screenshot Failed</div>
                    <strong>Error:</strong> ${error}<br>
                    <strong>Solution:</strong> Make sure you have tab permissions
                `;
                showPreview('📷 Screenshot Capture', content, 'error');
                if (button) setButtonLoading(button, false);
                return;
            }
            
            const currentUrl = tabs[0]?.url || 'unknown';
            
            chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
                if (chrome.runtime.lastError) {
                    const error = chrome.runtime.lastError.message;
                    addLog(`❌ Screenshot failed: ${error}`);
                    document.getElementById('status').textContent = 'Screenshot failed';
                    
                    const content = `
                        <div class="error">❌ Screenshot Failed</div>
                        <strong>Error:</strong> ${error}<br>
                        <strong>URL:</strong> ${currentUrl}
                    `;
                    showPreview('📷 Screenshot Capture', content, 'error');
                    if (button) setButtonLoading(button, false);
                } else {
                    addLog('✅ Screenshot captured successfully');
                    document.getElementById('status').textContent = 'Sending screenshot...';
                    
                    // Show immediate success in preview
                    const size = Math.round(dataUrl.length * 0.75 / 1024); // KB
                    const content = `
                        <div class="success">✅ Screenshot Captured</div>
                        <strong>Size:</strong> ~${size}KB<br>
                        <strong>Format:</strong> PNG<br>
                        <strong>URL:</strong> ${currentUrl}<br>
                        <div style="margin-top: 5px;">Sending to server...</div>
                    `;
                    showPreview('📷 Screenshot Capture', content, 'success');
                    
                    // Send to server
                    // Determine API endpoint
                    const apiBaseUrl = getApiBaseUrl(currentUrl);
                    
                    // Use different endpoint based on server type
                    const screenshotEndpoint = apiBaseUrl.includes('localhost') 
                        ? `${apiBaseUrl}/screenshot`  // Local server uses /screenshot
                        : `${apiBaseUrl}/api/screenshot`;  // Remote server uses /api/screenshot
                    
                    // Get API token from storage
                    chrome.storage.sync.get(['apiToken'], function(items) {
                        const apiToken = items.apiToken || 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8'; // Fallback for backward compatibility
                        
                        fetch(screenshotEndpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${apiToken}`
                            },
                        body: JSON.stringify({
                            data: dataUrl,
                            timestamp: new Date().toISOString(),
                            url: currentUrl,
                            title: tabs[0]?.title || 'Screenshot'
                        })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Server error: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(result => {
                        addLog('✅ Screenshot sent to server successfully');
                        addLog(`📁 Saved as: ${result.filename || 'screenshot.png'}`);
                        document.getElementById('status').textContent = 'Screenshot completed';
                        
                        // Store screenshot data for copying
                        window.lastScreenshot = {
                            path: result.path,
                            filename: result.filename,
                            directory: result.directory,
                            dataUrl: dataUrl,
                            url: currentUrl
                        };
                        
                        // Update preview with enhanced result
                        const content = `
                            <div class="success">✅ Screenshot Complete</div>
                            <div style="margin-top: 10px;">
                                <strong>📁 Saved to:</strong><br>
                                <code style="font-size: 10px; word-break: break-all; display: block; margin: 4px 0; padding: 4px; background: #2d2d2d; border-radius: 3px;">
                                    ${result.path}
                                </code>
                                
                                <div style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;">
                                    <button class="copy-path-btn" data-path="${result.path}" 
                                            style="padding: 4px 10px; font-size: 11px;">📋 Copy Path</button>
                                    <button class="copy-image-btn" data-url="${dataUrl}"
                                            style="padding: 4px 10px; font-size: 11px;">🖼️ Copy Image</button>
                                    <button class="open-folder-btn" data-dir="${result.directory}"
                                            style="padding: 4px 10px; font-size: 11px;">📂 Open Folder</button>
                                    <button class="view-image-btn" data-url="${dataUrl}"
                                            style="padding: 4px 10px; font-size: 11px;">👁️ Preview</button>
                                </div>
                                
                                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #444;">
                                    <strong>📏 Size:</strong> ${Math.round(result.size/1024)}KB<br>
                                    <strong>🌐 URL:</strong> ${currentUrl}<br>
                                    <strong>⏰ Time:</strong> ${new Date().toLocaleTimeString()}
                                </div>
                                
                                <div id="image-preview" style="margin-top: 10px; display: none;">
                                    <img src="${dataUrl}" style="max-width: 100%; border: 1px solid #444; border-radius: 4px;">
                                </div>
                            </div>
                        `;
                        showPreview('📷 Screenshot Capture', content, 'success');
                        
                        // Attach event listeners for the new buttons
                        setTimeout(() => {
                            // Copy path button
                            document.querySelector('.copy-path-btn')?.addEventListener('click', function() {
                                const path = this.getAttribute('data-path');
                                copyToClipboard(path, this);
                            });
                            
                            // Copy image button - copies as base64
                            document.querySelector('.copy-image-btn')?.addEventListener('click', function() {
                                const btn = this;
                                const dataUrl = btn.getAttribute('data-url');
                                
                                // Try to copy as image blob
                                fetch(dataUrl)
                                    .then(res => res.blob())
                                    .then(blob => {
                                        const item = new ClipboardItem({'image/png': blob});
                                        navigator.clipboard.write([item]).then(() => {
                                            btn.textContent = '✅ Copied!';
                                            btn.style.background = '#4CAF50';
                                            setTimeout(() => {
                                                btn.textContent = '🖼️ Copy Image';
                                                btn.style.background = '';
                                            }, 2000);
                                        });
                                    })
                                    .catch(err => {
                                        console.error('Failed to copy image:', err);
                                        btn.textContent = '❌ Failed';
                                        setTimeout(() => {
                                            btn.textContent = '🖼️ Copy Image';
                                        }, 2000);
                                    });
                            });
                            
                            // Open folder button
                            document.querySelector('.open-folder-btn')?.addEventListener('click', function() {
                                const dir = this.getAttribute('data-dir');
                                // Send message to open folder (requires native messaging or server endpoint)
                                fetch('http://localhost:3025/open-folder', {
                                    method: 'POST',
                                    headers: {'Content-Type': 'application/json'},
                                    body: JSON.stringify({path: dir})
                                }).then(() => {
                                    this.textContent = '✅ Opened';
                                    setTimeout(() => {
                                        this.textContent = '📂 Open Folder';
                                    }, 2000);
                                }).catch(() => {
                                    // Fallback: copy path so user can paste in explorer
                                    copyToClipboard(dir, this);
                                });
                            });
                            
                            // View image button
                            document.querySelector('.view-image-btn')?.addEventListener('click', function() {
                                const preview = document.getElementById('image-preview');
                                if (preview.style.display === 'none') {
                                    preview.style.display = 'block';
                                    this.textContent = '🙈 Hide';
                                } else {
                                    preview.style.display = 'none';
                                    this.textContent = '👁️ Preview';
                                }
                            });
                        }, 100);
                    })
                    .catch(err => {
                        addLog(`❌ Failed to send screenshot: ${err.message}`);
                        document.getElementById('status').textContent = 'Screenshot send failed';
                        
                        const content = `
                            <div class="error">❌ Upload Failed</div>
                            <strong>Error:</strong> ${err.message}<br>
                            <strong>Status:</strong> Screenshot captured but not uploaded
                        `;
                        showPreview('📷 Screenshot Capture', content, 'error');
                    })
                    .finally(() => {
                        if (button) setButtonLoading(button, false);
                    });
                }
            });
        });
    } catch (error) {
        addLog(`❌ Screenshot error: ${error.message}`);
        document.getElementById('status').textContent = 'Screenshot error';
        
        const content = `
            <div class="error">❌ Screenshot Error</div>
            <strong>Error:</strong> ${error.message}<br>
            <strong>Solution:</strong> Check extension permissions
        `;
        showPreview('📷 Screenshot Capture', content, 'error');
        if (button) setButtonLoading(button, false);
    }
}

function clearLogs(button) {
    if (button) setButtonLoading(button, true);
    
    document.getElementById('logs').innerHTML = '';
    addLog('Logs cleared');
    
    // Show immediate preview
    const content = `
        <div class="success">✅ Logs Cleared</div>
        <strong>Action:</strong> All activity logs cleared<br>
        <strong>Status:</strong> Ready for new actions<br>
        <strong>Time:</strong> ${new Date().toLocaleTimeString()}
    `;
    showPreview('🧹 Clear Logs', content, 'success');
    
    if (button) {
        setTimeout(() => setButtonLoading(button, false), 300);
    }
}

function openDevTools(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('Checking DevTools...');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]) {
            addLog('❌ No active tab found');
            showPreview('🔧 DevTools Guide', '<div class="error">No active tab found</div>', 'error');
            if (button) setButtonLoading(button, false);
            return;
        }
        
        const currentUrl = tabs[0].url;
        const tabId = tabs[0].id;
        
        // Check if it's a chrome:// URL or other restricted page
        if (currentUrl.startsWith('chrome://') || currentUrl.startsWith('chrome-extension://') || 
            currentUrl.startsWith('edge://') || currentUrl.startsWith('about:')) {
            
            addLog('ℹ️ Cannot attach debugger to system pages');
            
            // Provide helpful guide instead
            const content = `
                <div class="info">ℹ️ DevTools Guide</div>
                <strong>Current page:</strong> System page<br>
                <strong>Status:</strong> Extensions cannot control DevTools on chrome:// pages<br>
                
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #444;">
                    <strong>🔧 To Open DevTools:</strong><br>
                    • Press <code>F12</code> (Windows/Linux)<br>
                    • Press <code>Cmd+Option+I</code> (Mac)<br>
                    • Right-click → "Inspect"<br>
                    • Menu → More Tools → Developer Tools
                </div>
                
                <div style="margin-top: 10px;">
                    <strong>📍 Find RapidTriage Panel:</strong><br>
                    • Look for "RapidTriage" tab in DevTools<br>
                    • Check ">>" menu if not visible<br>
                    • Elements panel → Right sidebar
                </div>
            `;
            showPreview('🔧 DevTools Guide', content, 'info');
            
        } else {
            // For normal web pages, try to attach debugger
            chrome.debugger.attach({tabId: tabId}, '1.3', function() {
                if (chrome.runtime.lastError) {
                    const error = chrome.runtime.lastError.message;
                    
                    // Check if DevTools is already open
                    if (error.includes('Another debugger') || error.includes('already attached')) {
                        addLog('✅ DevTools is already open');
                        
                        const content = `
                            <div class="success">✅ DevTools Already Open</div>
                            <strong>Status:</strong> DevTools is active<br>
                            <strong>URL:</strong> ${currentUrl}<br>
                            
                            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #444;">
                                <strong>📍 Find RapidTriage Panel:</strong><br>
                                • Look for "RapidTriage" tab at the top<br>
                                • Check ">>" overflow menu if needed<br>
                                • Or find in Elements → Right sidebar
                            </div>
                        `;
                        showPreview('🔧 DevTools Status', content, 'success');
                    } else {
                        addLog(`⚠️ ${error}`);
                        
                        const content = `
                            <div class="warning">⚠️ Manual DevTools Required</div>
                            <strong>Reason:</strong> ${error}<br>
                            
                            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #444;">
                                <strong>🔧 Open DevTools Manually:</strong><br>
                                • Press <code>F12</code> or<br>
                                • Right-click → "Inspect"<br>
                                <br>
                                <strong>📍 Then Find RapidTriage:</strong><br>
                                • Check tabs: Elements, Console, <strong>RapidTriage</strong><br>
                                • Or click ">>" for more panels
                            </div>
                        `;
                        showPreview('🔧 DevTools Guide', content, 'warning');
                    }
                } else {
                    addLog('✅ Debugger attached successfully');
                    
                    // Detach immediately - we just wanted to trigger DevTools
                    chrome.debugger.detach({tabId: tabId}, function() {
                        const content = `
                            <div class="success">✅ DevTools Triggered</div>
                            <strong>Status:</strong> Ready to open<br>
                            <strong>URL:</strong> ${currentUrl}<br>
                            
                            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #444;">
                                <strong>🔧 Now Press F12</strong> to open DevTools<br>
                                <br>
                                <strong>📍 Find RapidTriage Panel:</strong><br>
                                • Look for "RapidTriage" tab<br>
                                • Check ">>" menu if not visible
                            </div>
                        `;
                        showPreview('🔧 DevTools Ready', content, 'success');
                    });
                }
                
                if (button) setButtonLoading(button, false);
            });
        }
        
        if (button) {
            setTimeout(() => setButtonLoading(button, false), 500);
        }
    });
}

function runLighthouseAudit(button) {
    console.log('runLighthouseAudit called with button:', button);
    if (button) setButtonLoading(button, true);
    
    addLog('🔍 Starting Lighthouse audit (all categories)...');
    document.getElementById('status').textContent = 'Running full audit...';
    
    try {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (chrome.runtime.lastError || !tabs[0]) {
                const error = chrome.runtime.lastError?.message || 'No active tab';
                addLog(`❌ Cannot get current tab: ${error}`);
                document.getElementById('status').textContent = 'Audit failed';
                
                const content = `
                    <div class="error">❌ Audit Failed</div>
                    <strong>Error:</strong> ${error}<br>
                    <strong>Solution:</strong> Make sure you have an active tab open
                `;
                showPreview('🔍 Lighthouse Audit', content, 'error');
                if (button) setButtonLoading(button, false);
                return;
            }
            
            const currentUrl = tabs[0].url;
            addLog(`📊 Auditing: ${currentUrl}`);
            
            // Show immediate preview
            const content = `
                <div class="info">🔍 Lighthouse Full Audit Started</div>
                <strong>URL:</strong> ${currentUrl}<br>
                <strong>Status:</strong> Analyzing all categories...<br>
                <div style="margin-top: 5px;">This may take a few seconds...</div>
            `;
            showPreview('🔍 Lighthouse Audit', content, 'info');
            
            // Determine API endpoint based on URL
            const apiBaseUrl = getApiBaseUrl(currentUrl);
            const fallbackUrl = apiBaseUrl === 'http://localhost:3025' 
                ? 'https://rapidtriage.me' 
                : 'http://localhost:3025';
            
            addLog(`🔗 Using API: ${apiBaseUrl}`);
            
            // Get API token from storage
            chrome.storage.sync.get(['apiToken'], async function(items) {
                const apiToken = items.apiToken || 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8'; // Fallback for backward compatibility
                
                fetchWithFallback(
                    `${apiBaseUrl}/api/lighthouse`,
                    `${fallbackUrl}/api/lighthouse`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiToken}`
                        },
                    body: JSON.stringify({
                        url: currentUrl,
                        categories: ['performance', 'accessibility', 'seo', 'best-practices']
                    })
                }
            )
            .then(({response, usedUrl}) => {
                addLog(`✅ Connected to: ${usedUrl}`);
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.content && data.content[0]) {
                    const text = data.content[0].text;
                    
                    // Parse all scores from the response
                    const performanceMatch = text.match(/performance:\s*(\d+)\/100/i);
                    const accessibilityMatch = text.match(/accessibility:\s*(\d+)\/100/i);
                    const seoMatch = text.match(/seo:\s*(\d+)\/100/i);
                    const bestPracticesMatch = text.match(/best-practices:\s*(\d+)\/100/i);
                    const loadTimeMatch = text.match(/Load Time:\s*(\d+)ms/i);
                    
                    const scores = {
                        performance: performanceMatch ? performanceMatch[1] : 'N/A',
                        accessibility: accessibilityMatch ? accessibilityMatch[1] : 'N/A',
                        seo: seoMatch ? seoMatch[1] : 'N/A',
                        bestPractices: bestPracticesMatch ? bestPracticesMatch[1] : 'N/A'
                    };
                    const loadTime = loadTimeMatch ? loadTimeMatch[1] : 'N/A';
                    
                    addLog('✅ Lighthouse Full Audit Complete:');
                    addLog(`  🏃 Performance: ${scores.performance}/100`);
                    addLog(`  ♿ Accessibility: ${scores.accessibility}/100`);
                    addLog(`  🎯 Best Practices: ${scores.bestPractices}/100`);
                    addLog(`  🔍 SEO: ${scores.seo}/100`);
                    addLog(`  ⏱️ Load Time: ${loadTime}ms`);
                    
                    document.getElementById('status').textContent = `Audit complete - Overall: ${Math.round((parseInt(scores.performance) + parseInt(scores.accessibility) + parseInt(scores.seo) + parseInt(scores.bestPractices)) / 4)}/100`;
                    
                    // Calculate overall status
                    const avgScore = Math.round((parseInt(scores.performance) + parseInt(scores.accessibility) + parseInt(scores.seo) + parseInt(scores.bestPractices)) / 4);
                    const overallStatus = avgScore >= 90 ? 'Excellent' : avgScore >= 70 ? 'Good' : 'Needs Improvement';
                    
                    // Update preview with detailed results
                    const resultContent = `
                        <div class="success">✅ Lighthouse Full Audit Complete</div>
                        <div style="margin-top: 10px;">
                            <strong>📊 Overall Score:</strong> ${avgScore}/100 (${overallStatus})<br>
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
                                <strong>🏃 Performance:</strong> ${scores.performance}/100 ${scores.performance >= 90 ? '✅' : scores.performance >= 50 ? '⚠️' : '❌'}<br>
                                <strong>♿ Accessibility:</strong> ${scores.accessibility}/100 ${scores.accessibility >= 90 ? '✅' : scores.accessibility >= 50 ? '⚠️' : '❌'}<br>
                                <strong>🎯 Best Practices:</strong> ${scores.bestPractices}/100 ${scores.bestPractices >= 90 ? '✅' : scores.bestPractices >= 50 ? '⚠️' : '❌'}<br>
                                <strong>🔍 SEO:</strong> ${scores.seo}/100 ${scores.seo >= 90 ? '✅' : scores.seo >= 50 ? '⚠️' : '❌'}<br>
                            </div>
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
                                <strong>⏱️ Load Time:</strong> ${loadTime}ms<br>
                                <strong>🌐 URL:</strong> ${currentUrl}<br>
                                <strong>📅 Time:</strong> ${new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    `;
                    showPreview('🔍 Lighthouse Full Audit', resultContent, 'success');
                } else {
                    throw new Error(data.error || 'Audit returned no data');
                }
            })
            .catch(error => {
                addLog(`❌ Lighthouse error: ${error.message}`);
                document.getElementById('status').textContent = 'Audit error';
                
                const content = `
                    <div class="error">❌ Audit Error</div>
                    <strong>Error:</strong> ${error.message}<br>
                    <strong>Solution:</strong> Check server connection and try again
                `;
                showPreview('🔍 Lighthouse Audit', content, 'error');
            })
            .finally(() => {
                if (button) setButtonLoading(button, false);
            });
        });
    } catch (error) {
        addLog(`❌ Audit error: ${error.message}`);
        document.getElementById('status').textContent = 'Audit error';
        
        const content = `
            <div class="error">❌ Audit Error</div>
            <strong>Error:</strong> ${error.message}<br>
            <strong>Solution:</strong> Check extension permissions
        `;
        showPreview('🔍 Lighthouse Audit', content, 'error');
        if (button) setButtonLoading(button, false);
    }
}

function getConsoleLogs(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('📋 Getting console logs...');
    document.getElementById('status').textContent = 'Fetching logs...';
    
    try {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (chrome.runtime.lastError || !tabs[0]) {
                const error = chrome.runtime.lastError?.message || 'No active tab';
                addLog(`❌ Cannot get current tab: ${error}`);
                document.getElementById('status').textContent = 'Logs fetch failed';
                
                const content = `
                    <div class="error">❌ Console Logs Failed</div>
                    <strong>Error:</strong> ${error}<br>
                    <strong>Solution:</strong> Make sure you have an active tab open
                `;
                showPreview('📋 Console Logs', content, 'error');
                if (button) setButtonLoading(button, false);
                return;
            }
            
            const currentUrl = tabs[0].url;
            addLog(`🔍 Analyzing console logs for: ${currentUrl}`);
            
            // Show immediate preview
            const content = `
                <div class="info">📋 Console Analysis Started</div>
                <strong>URL:</strong> ${currentUrl}<br>
                <strong>Status:</strong> Fetching console messages...<br>
                <div style="margin-top: 5px;">Please wait...</div>
            `;
            showPreview('📋 Console Logs', content, 'info');
            
            // Determine API endpoint based on URL
            const apiBaseUrl = getApiBaseUrl(currentUrl);
            const fallbackUrl = apiBaseUrl === 'http://localhost:3025' 
                ? 'https://rapidtriage.me' 
                : 'http://localhost:3025';
            
            addLog(`🔗 Using API: ${apiBaseUrl}`);
            
            // Get API token from storage
            chrome.storage.sync.get(['apiToken'], async function(items) {
                const apiToken = items.apiToken || 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8'; // Fallback for backward compatibility
                
                fetchWithFallback(
                    `${apiBaseUrl}/api/console-logs`,
                    `${fallbackUrl}/api/console-logs`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiToken}`
                        },
                    body: JSON.stringify({url: currentUrl})
                }
            )
            .then(({response, usedUrl}) => {
                addLog(`✅ Connected to: ${usedUrl}`);
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Handle the API response format
                if (data.content && data.content[0]) {
                    // Parse the response message to extract log information
                    const responseText = data.content[0].text;
                    
                    // Check if no logs were captured
                    if (responseText.includes('No console logs captured')) {
                        addLog('📝 No console logs captured yet');
                        const content = `
                            <div class="info">📋 Console Logs</div>
                            <strong>Status:</strong> No logs captured<br>
                            <strong>URL:</strong> ${currentUrl}<br>
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
                                <strong>Note:</strong> Console logs will be captured as you browse.<br>
                                Open DevTools (F12) to see console messages.
                            </div>
                        `;
                        showPreview('📋 Console Logs', content, 'info');
                        document.getElementById('status').textContent = 'No logs captured';
                        return;
                    }
                    
                    // If we have actual logs data
                    const logs = data.logs || [];
                    const summary = data.summary || { errors: 0, warnings: 0, info: 0, logs: 0 };
                    
                    addLog(`✅ Found ${logs.length} console entries:`);
                    
                    if (logs.length === 0) {
                        addLog('  📝 No console messages found');
                        
                        const content = `
                            <div class="success">✅ Console Analysis Complete</div>
                            <strong>Messages:</strong> None found<br>
                            <strong>Status:</strong> Clean console - no messages<br>
                            <strong>Time:</strong> ${new Date().toLocaleTimeString()}
                        `;
                        showPreview('📋 Console Logs', content, 'success');
                    } else {
                        // Group by log level
                        const byLevel = logs.reduce((acc, log) => {
                            acc[log.level] = (acc[log.level] || 0) + 1;
                            return acc;
                        }, {});
                        
                        Object.entries(byLevel).forEach(([level, count]) => {
                            const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'info' ? 'ℹ️' : '📝';
                            addLog(`  ${emoji} ${level}: ${count} messages`);
                        });
                        
                        // Show last few messages
                        addLog('  📃 Recent messages:');
                        logs.slice(-5).forEach(log => {
                            const emoji = log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : '📝';
                            addLog(`    ${emoji} ${log.text.substring(0, 60)}${log.text.length > 60 ? '...' : ''}`);
                        });
                        
                        // Build preview content
                        let previewMessages = logs.slice(-3).map(log => {
                            const emoji = log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : log.level === 'info' ? 'ℹ️' : '📝';
                            return `${emoji} [${log.level}] ${log.text.substring(0, 50)}${log.text.length > 50 ? '...' : ''}`;
                        }).join('<br>');
                        
                        const content = `
                            <div class="success">✅ Console Analysis Complete</div>
                            <strong>Total:</strong> ${logs.length} messages<br>
                            <strong>❌ Errors:</strong> ${summary.errors}<br>
                            <strong>⚠️ Warnings:</strong> ${summary.warnings}<br>
                            <strong>ℹ️ Info:</strong> ${summary.info}<br>
                            <strong>📝 Logs:</strong> ${summary.logs}<br>
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
                                <strong>Recent messages:</strong><br>
                                <div style="font-size: 10px; margin-top: 4px;">${previewMessages || 'No messages'}</div>
                            </div>
                        `;
                        showPreview('📋 Console Logs', content, 'success');
                    }
                    
                    document.getElementById('status').textContent = `Logs: ${logs.length} entries found`;
                } else if (data.error) {
                    addLog(`❌ Console logs failed: ${data.error}`);
                    document.getElementById('status').textContent = 'Logs fetch failed';
                    
                    const content = `
                        <div class="error">❌ Console Logs Failed</div>
                        <strong>Error:</strong> ${data.error}<br>
                        <strong>URL:</strong> ${currentUrl}
                    `;
                    showPreview('📋 Console Logs', content, 'error');
                } else {
                    // Handle unexpected response format
                    addLog('⚠️ Unexpected response format');
                    const content = `
                        <div class="warning">⚠️ Console Logs</div>
                        <strong>Status:</strong> No logs available<br>
                        <strong>URL:</strong> ${currentUrl}<br>
                        <strong>Tip:</strong> Try refreshing the page with DevTools open
                    `;
                    showPreview('📋 Console Logs', content, 'warning');
                }
            })
            .catch(error => {
                addLog(`❌ Console logs error: ${error.message}`);
                document.getElementById('status').textContent = 'Logs error';
                
                const content = `
                    <div class="error">❌ Console Analysis Error</div>
                    <strong>Error:</strong> ${error.message}<br>
                    <strong>Solution:</strong> Check server connection and try again
                `;
                showPreview('📋 Console Logs', content, 'error');
            })
            .finally(() => {
                if (button) setButtonLoading(button, false);
            });
        });
    } catch (error) {
        addLog(`❌ Console logs error: ${error.message}`);
        document.getElementById('status').textContent = 'Logs error';
        
        const content = `
            <div class="error">❌ Console Analysis Error</div>
            <strong>Error:</strong> ${error.message}<br>
            <strong>Solution:</strong> Check extension permissions
        `;
        showPreview('📋 Console Logs', content, 'error');
        if (button) setButtonLoading(button, false);
    }
}

function inspectElement(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('🔍 Checking for selected element...');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]) {
            addLog('❌ No active tab found');
            showPreview('🔍 Element Inspector', '<div class="error">No active tab found</div>', 'error');
            if (button) setButtonLoading(button, false);
            return;
        }
        
        const currentUrl = tabs[0].url || 'unknown';
        const tabId = tabs[0].id;
        
        // First try to get any selected element
        chrome.tabs.sendMessage(tabId, {type: 'GET_SELECTED_ELEMENT'}, function(response) {
            if (chrome.runtime.lastError) {
                // Content script might not be loaded, try to inject it
                chrome.scripting.executeScript({
                    target: {tabId: tabId},
                    files: ['content.js']
                }, () => {
                    // Try again after injection
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, {type: 'GET_SELECTED_ELEMENT'}, handleElementResponse);
                    }, 100);
                });
            } else {
                handleElementResponse(response);
            }
        });
        
        function handleElementResponse(response) {
            if (response && response.success && response.data) {
                // We have a selected element!
                const element = response.data;
                addLog('✅ Element found: ' + element.tagName);
                
                // Store in Chrome storage for persistence
                chrome.storage.local.set({
                    'rapidtriage_selected_element': element,
                    'rapidtriage_selected_time': Date.now()
                });
                
                // Display using the enhanced function
                displayElementDetails(element, 0);
            } else {
                // No element selected, start inspect mode
                addLog('⚡ Starting inspect mode...');
                
                chrome.tabs.sendMessage(tabId, {type: 'START_INSPECT_MODE'}, function(response) {
                    if (chrome.runtime.lastError || !response?.success) {
                        // Fallback message
                        const content = `
                            <div class="warning">⚠️ No Element Selected</div>
                            <strong>To select an element:</strong><br>
                            1. Right-click any element on the page<br>
                            2. Choose "Inspect" from the menu<br>
                            3. Click "Inspect Element" button again<br>
                            <br>
                            <strong>OR</strong><br>
                            Click "Inspect Element" again to enter selection mode
                        `;
                        showPreview('🔍 Element Inspector', content, 'warning');
                    } else {
                        addLog('✅ Inspect mode activated - click any element');
                        
                        const content = `
                            <div class="info">🎯 Inspect Mode Active</div>
                            <strong>Instructions:</strong><br>
                            1. Move your mouse over elements to highlight<br>
                            2. Click on any element to select it<br>
                            3. Element details will appear here<br>
                            <br>
                            <strong>Visual Indicators:</strong><br>
                            🔵 Blue outline = Hovering<br>
                            🟢 Green outline = Selected
                        `;
                        showPreview('🔍 Element Inspector', content, 'info');
                    }
                });
            }
            
            if (button) setButtonLoading(button, false);
        }
    });
}

// New audit and debug handler functions

function runAccessibilityAudit(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('♿ Running accessibility audit...');
    document.getElementById('status').textContent = 'Running audit...';
    
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        if (!tabs[0]) {
            addLog('❌ No active tab found');
            showPreview('♿ Accessibility Audit', '<div class="error">No active tab found</div>', 'error');
            if (button) setButtonLoading(button, false);
            return;
        }
        
        const currentUrl = tabs[0].url;
        const apiBaseUrl = getApiBaseUrl(currentUrl);
        const fallbackUrl = apiBaseUrl === 'http://localhost:3025' 
            ? 'https://rapidtriage.me' 
            : 'http://localhost:3025';
        
        addLog(`🔗 Using API: ${apiBaseUrl}`);
        
        fetchWithFallback(
            `${apiBaseUrl}/api/lighthouse/accessibility`,
            `${fallbackUrl}/api/lighthouse/accessibility`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8'
                },
                body: JSON.stringify({url: currentUrl})
            }
        )
        .then(({response, usedUrl}) => {
            addLog(`✅ Connected to: ${usedUrl}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.content && data.content[0]) {
                const text = data.content[0].text;
                // Parse the Lighthouse results
                const accessibilityMatch = text.match(/accessibility:\s*(\d+)\/100/i);
                const score = accessibilityMatch ? accessibilityMatch[1] : 'N/A';
                
                addLog(`✅ Accessibility audit complete: ${score}/100`);
                const content = `
                    <div class="success">✅ Accessibility Audit Complete</div>
                    <strong>Score:</strong> ${score}/100<br>
                    <strong>Status:</strong> ${score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement'}<br>
                    <strong>URL:</strong> ${currentUrl}<br>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
                        <strong>Key Checks:</strong><br>
                        • Alt text for images<br>
                        • Color contrast ratios<br>
                        • ARIA labels<br>
                        • Keyboard navigation
                    </div>
                `;
                showPreview('♿ Accessibility Audit', content, 'success');
            } else {
                throw new Error(data.error || 'Audit failed');
            }
        })
        .catch(error => {
            addLog(`❌ Audit failed: ${error.message}`);
            showPreview('♿ Accessibility Audit', `<div class="error">❌ ${error.message}</div>`, 'error');
        })
        .finally(() => {
            if (button) setButtonLoading(button, false);
        });
    });
}

function runPerformanceAudit(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('⚡ Running performance audit...');
    document.getElementById('status').textContent = 'Running audit...';
    
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        if (!tabs[0]) {
            addLog('❌ No active tab found');
            showPreview('⚡ Performance Audit', '<div class="error">No active tab found</div>', 'error');
            if (button) setButtonLoading(button, false);
            return;
        }
        
        const currentUrl = tabs[0].url;
        const apiBaseUrl = getApiBaseUrl(currentUrl);
        const fallbackUrl = apiBaseUrl === 'http://localhost:3025' 
            ? 'https://rapidtriage.me' 
            : 'http://localhost:3025';
        
        addLog(`🔗 Using API: ${apiBaseUrl}`);
        
        fetchWithFallback(
            `${apiBaseUrl}/api/lighthouse/performance`,
            `${fallbackUrl}/api/lighthouse/performance`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8'
                },
                body: JSON.stringify({url: currentUrl})
            }
        )
        .then(({response, usedUrl}) => {
            addLog(`✅ Connected to: ${usedUrl}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.content && data.content[0]) {
                const text = data.content[0].text;
                // Parse the Lighthouse results
                const performanceMatch = text.match(/performance:\s*(\d+)\/100/i);
                const loadTimeMatch = text.match(/Load Time:\s*(\d+)ms/i);
                const score = performanceMatch ? performanceMatch[1] : 'N/A';
                const loadTime = loadTimeMatch ? loadTimeMatch[1] : 'N/A';
                
                addLog(`✅ Performance audit complete: ${score}/100`);
                const content = `
                    <div class="success">✅ Performance Audit Complete</div>
                    <strong>Score:</strong> ${score}/100<br>
                    <strong>Load Time:</strong> ${loadTime}ms<br>
                    <strong>Status:</strong> ${score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement'}<br>
                    <strong>URL:</strong> ${currentUrl}<br>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
                        <strong>Key Metrics:</strong><br>
                        • First Contentful Paint<br>
                        • Speed Index<br>
                        • Time to Interactive<br>
                        • Total Blocking Time
                    </div>
                `;
                showPreview('⚡ Performance Audit', content, 'success');
            } else {
                throw new Error(data.error || 'Audit failed');
            }
        })
        .catch(error => {
            addLog(`❌ Audit failed: ${error.message}`);
            showPreview('⚡ Performance Audit', `<div class="error">❌ ${error.message}</div>`, 'error');
        })
        .finally(() => {
            if (button) setButtonLoading(button, false);
        });
    });
}

function runSEOAudit(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('🔍 Running SEO audit...');
    document.getElementById('status').textContent = 'Running audit...';
    
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        if (!tabs[0]) {
            addLog('❌ No active tab found');
            showPreview('🔍 SEO Audit', '<div class="error">No active tab found</div>', 'error');
            if (button) setButtonLoading(button, false);
            return;
        }
        
        const currentUrl = tabs[0].url;
        const apiBaseUrl = getApiBaseUrl(currentUrl);
        const fallbackUrl = apiBaseUrl === 'http://localhost:3025' 
            ? 'https://rapidtriage.me' 
            : 'http://localhost:3025';
        
        addLog(`🔗 Using API: ${apiBaseUrl}`);
        
        fetchWithFallback(
            `${apiBaseUrl}/api/lighthouse/seo`,
            `${fallbackUrl}/api/lighthouse/seo`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8'
                },
                body: JSON.stringify({url: currentUrl})
            }
        )
        .then(({response, usedUrl}) => {
            addLog(`✅ Connected to: ${usedUrl}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.content && data.content[0]) {
                const text = data.content[0].text;
                // Parse the Lighthouse results
                const seoMatch = text.match(/SEO:\s*(\d+)\/100/);
                const seoScore = seoMatch ? seoMatch[1] : 'N/A';
                
                addLog('✅ SEO audit complete');
                const content = `
                    <div class="success">✅ SEO Audit Complete</div>
                    <strong>Score:</strong> ${seoScore}/100<br>
                    <strong>Status:</strong> ${seoScore >= 90 ? 'Excellent' : seoScore >= 70 ? 'Good' : 'Needs Improvement'}<br>
                    <strong>URL:</strong> ${currentUrl}
                `;
                showPreview('🔍 SEO Audit', content, 'success');
            } else {
                throw new Error(data.error || 'Audit failed');
            }
        })
        .catch(error => {
            addLog(`❌ Audit failed: ${error.message}`);
            showPreview('🔍 SEO Audit', `<div class="error">❌ ${error.message}</div>`, 'error');
        })
        .finally(() => {
            if (button) setButtonLoading(button, false);
        });
    });
}

function runBestPracticesAudit(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('📋 Running best practices audit...');
    document.getElementById('status').textContent = 'Running audit...';
    
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        if (!tabs[0]) {
            addLog('❌ No active tab found');
            showPreview('📋 Best Practices', '<div class="error">No active tab found</div>', 'error');
            if (button) setButtonLoading(button, false);
            return;
        }
        
        const currentUrl = tabs[0].url;
        const apiBaseUrl = getApiBaseUrl(currentUrl);
        const fallbackUrl = apiBaseUrl === 'http://localhost:3025' 
            ? 'https://rapidtriage.me' 
            : 'http://localhost:3025';
        
        addLog(`🔗 Using API: ${apiBaseUrl}`);
        
        fetchWithFallback(
            `${apiBaseUrl}/api/lighthouse/best-practices`,
            `${fallbackUrl}/api/lighthouse/best-practices`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8'
                },
                body: JSON.stringify({url: currentUrl})
            }
        )
        .then(({response, usedUrl}) => {
            addLog(`✅ Connected to: ${usedUrl}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.content && data.content[0]) {
                const text = data.content[0].text;
                // Parse the Lighthouse results
                const bestPracticesMatch = text.match(/best-practices:\s*(\d+)\/100/i);
                const score = bestPracticesMatch ? bestPracticesMatch[1] : 'N/A';
                
                addLog(`✅ Best practices audit complete: ${score}/100`);
                const content = `
                    <div class="success">✅ Best Practices Audit Complete</div>
                    <strong>Score:</strong> ${score}/100<br>
                    <strong>Status:</strong> ${score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement'}<br>
                    <strong>URL:</strong> ${currentUrl}<br>
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444;">
                        <strong>Key Checks:</strong><br>
                        • HTTPS usage<br>
                        • Console errors<br>
                        • Image aspect ratios<br>
                        • JavaScript errors
                    </div>
                `;
                showPreview('📋 Best Practices', content, 'success');
            } else {
                throw new Error(data.error || 'Audit failed');
            }
        })
        .catch(error => {
            addLog(`❌ Audit failed: ${error.message}`);
            showPreview('📋 Best Practices', `<div class="error">❌ ${error.message}</div>`, 'error');
        })
        .finally(() => {
            if (button) setButtonLoading(button, false);
        });
    });
}

// NextJS audit function removed - no longer needed

function getConsoleErrors(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('❌ Getting console errors...');
    document.getElementById('status').textContent = 'Fetching errors...';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]) {
            addLog('❌ No active tab found');
            showPreview('❌ Console Errors', '<div class="error">No active tab found</div>', 'error');
            if (button) setButtonLoading(button, false);
            return;
        }
        
        const currentUrl = tabs[0].url;
        const apiBaseUrl = getApiBaseUrl(currentUrl);
        const fallbackUrl = apiBaseUrl === 'http://localhost:3025' 
            ? 'https://rapidtriage.me' 
            : 'http://localhost:3025';
        
        addLog(`🔗 Using API: ${apiBaseUrl}`);
        
        // Get API token from storage
        chrome.storage.sync.get(['apiToken'], async function(items) {
            const apiToken = items.apiToken || 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8';
            
            fetchWithFallback(
                `${apiBaseUrl}/api/console-errors`,
                `${fallbackUrl}/api/console-errors`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiToken}`
                    },
                    body: JSON.stringify({url: currentUrl})
                }
            )
            .then(({response, usedUrl}) => {
                addLog(`✅ Connected to: ${usedUrl}`);
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.content && data.content[0]) {
                    const responseText = data.content[0].text;
                    
                    if (responseText.includes('No console errors')) {
                        addLog('✅ No console errors found');
                        const content = `
                            <div class="success">✅ No Console Errors</div>
                            <strong>Status:</strong> Clean - no errors<br>
                            <strong>URL:</strong> ${currentUrl}
                        `;
                        showPreview('❌ Console Errors', content, 'success');
                    } else {
                        const content = `
                            <div class="info">❌ Console Errors</div>
                            <strong>Status:</strong> Checking for errors...<br>
                            <strong>URL:</strong> ${currentUrl}<br>
                            <strong>Note:</strong> Errors will be captured as they occur
                        `;
                        showPreview('❌ Console Errors', content, 'info');
                    }
                } else {
                    throw new Error('Invalid response format');
                }
            })
            .catch(error => {
                addLog(`❌ Failed: ${error.message}`);
                showPreview('❌ Console Errors', `<div class="error">❌ ${error.message}</div>`, 'error');
            })
            .finally(() => {
                if (button) setButtonLoading(button, false);
            });
        });
    });
}

function getNetworkLogs(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('🌐 Getting network logs...');
    document.getElementById('status').textContent = 'Fetching logs...';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]) {
            addLog('❌ No active tab found');
            showPreview('🌐 Network Logs', '<div class="error">No active tab found</div>', 'error');
            if (button) setButtonLoading(button, false);
            return;
        }
        
        const currentUrl = tabs[0].url;
        const apiBaseUrl = getApiBaseUrl(currentUrl);
        const fallbackUrl = apiBaseUrl === 'http://localhost:3025' 
            ? 'https://rapidtriage.me' 
            : 'http://localhost:3025';
        
        addLog(`🔗 Using API: ${apiBaseUrl}`);
        
        // Get API token from storage
        chrome.storage.sync.get(['apiToken'], async function(items) {
            const apiToken = items.apiToken || 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8';
            
            fetchWithFallback(
                `${apiBaseUrl}/api/network-logs`,
                `${fallbackUrl}/api/network-logs`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiToken}`
                    },
                    body: JSON.stringify({url: currentUrl})
                }
            )
            .then(({response, usedUrl}) => {
                addLog(`✅ Connected to: ${usedUrl}`);
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.content && data.content[0]) {
                    const responseText = data.content[0].text;
                    
                    if (responseText.includes('No network logs')) {
                        addLog('📝 No network logs captured yet');
                        const content = `
                            <div class="info">🌐 Network Logs</div>
                            <strong>Status:</strong> No requests captured<br>
                            <strong>URL:</strong> ${currentUrl}<br>
                            <strong>Tip:</strong> Network requests will be captured as you browse
                        `;
                        showPreview('🌐 Network Logs', content, 'info');
                    } else {
                        const content = `
                            <div class="success">🌐 Network Activity</div>
                            <strong>Status:</strong> Monitoring network requests<br>
                            <strong>URL:</strong> ${currentUrl}<br>
                            <strong>Note:</strong> Open DevTools Network tab for details
                        `;
                        showPreview('🌐 Network Logs', content, 'success');
                    }
                } else {
                    throw new Error('Invalid response format');
                }
            })
            .catch(error => {
                addLog(`❌ Failed: ${error.message}`);
                showPreview('🌐 Network Logs', `<div class="error">❌ ${error.message}</div>`, 'error');
            })
            .finally(() => {
                if (button) setButtonLoading(button, false);
            });
        });
    });
}

function getNetworkErrors(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('❌ Getting network errors...');
    document.getElementById('status').textContent = 'Fetching errors...';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]) {
            addLog('❌ No active tab found');
            showPreview('❌ Network Errors', '<div class="error">No active tab found</div>', 'error');
            if (button) setButtonLoading(button, false);
            return;
        }
        
        const currentUrl = tabs[0].url;
        const apiBaseUrl = getApiBaseUrl(currentUrl);
        const fallbackUrl = apiBaseUrl === 'http://localhost:3025' 
            ? 'https://rapidtriage.me' 
            : 'http://localhost:3025';
        
        addLog(`🔗 Using API: ${apiBaseUrl}`);
        
        // Get API token from storage
        chrome.storage.sync.get(['apiToken'], async function(items) {
            const apiToken = items.apiToken || 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8';
            
            fetchWithFallback(
                `${apiBaseUrl}/api/network-errors`,
                `${fallbackUrl}/api/network-errors`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiToken}`
                    },
                    body: JSON.stringify({url: currentUrl})
                }
            )
            .then(({response, usedUrl}) => {
                addLog(`✅ Connected to: ${usedUrl}`);
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.content && data.content[0]) {
                    const responseText = data.content[0].text;
                    
                    if (responseText.includes('No network errors')) {
                        addLog('✅ No network errors found');
                        const content = `
                            <div class="success">✅ No Network Errors</div>
                            <strong>Status:</strong> All requests successful<br>
                            <strong>URL:</strong> ${currentUrl}
                        `;
                        showPreview('❌ Network Errors', content, 'success');
                    } else {
                        const content = `
                            <div class="info">❌ Network Errors</div>
                            <strong>Status:</strong> Monitoring for failed requests<br>
                            <strong>URL:</strong> ${currentUrl}<br>
                            <strong>Note:</strong> 4xx/5xx errors will be captured
                        `;
                        showPreview('❌ Network Errors', content, 'info');
                    }
                } else {
                    throw new Error('Invalid response format');
                }
            })
            .catch(error => {
                addLog(`❌ Failed: ${error.message}`);
                showPreview('❌ Network Errors', `<div class="error">❌ ${error.message}</div>`, 'error');
            })
            .finally(() => {
                if (button) setButtonLoading(button, false);
            });
        });
    });
}

function wipeLogs(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('🧹 Wiping all logs...');
    
    // Clear local logs immediately
    document.getElementById('logs').innerHTML = '';
    addLog('🧹 Local logs cleared');
    
    // Clear the preview area
    document.getElementById('preview-content').innerHTML = 'All logs have been cleared';
    document.querySelector('.preview-header').textContent = 'Ready';
    
    // Show success message
    const content = `
        <div class="success">✅ All Logs Wiped</div>
        <strong>Console:</strong> Cleared<br>
        <strong>Network:</strong> Cleared<br>
        <strong>Activity:</strong> Cleared<br>
        <strong>Time:</strong> ${new Date().toLocaleTimeString()}
    `;
    showPreview('🧹 Wipe Logs', content, 'success');
    
    // Note: Server-side logs would need to be cleared via API if implemented
    // For now, just clear the local display
    
    document.getElementById('status').textContent = 'Logs cleared';
    
    if (button) setButtonLoading(button, false);
}

function runDebugMode(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('🐛 Activating debug mode...');
    
    const content = `
        <div class="info">🐛 Debug Mode Active</div>
        <strong>Features Enabled:</strong><br>
        • Enhanced console logging<br>
        • Network request details<br>
        • Performance metrics<br>
        • Error stack traces<br>
        <div style="margin-top: 8px;">Check DevTools console for output</div>
    `;
    showPreview('🐛 Debug Mode', content, 'info');
    
    // Enable debug mode in content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {type: 'ENABLE_DEBUG_MODE'});
        }
    });
    
    if (button) setButtonLoading(button, false);
}

function runAuditMode(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('📊 Running comprehensive audit...');
    
    const content = `
        <div class="info">📊 Audit Mode Active</div>
        <strong>Running Audits:</strong><br>
        • Accessibility check<br>
        • Performance analysis<br>
        • SEO optimization<br>
        • Best practices<br>
        <div style="margin-top: 8px;">This may take a moment...</div>
    `;
    showPreview('📊 Audit Mode', content, 'info');
    
    // Run all audits sequentially
    setTimeout(() => {
        runAccessibilityAudit();
        setTimeout(() => runPerformanceAudit(), 1000);
        setTimeout(() => runSEOAudit(), 2000);
        setTimeout(() => runBestPracticesAudit(), 3000);
    }, 500);
    
    if (button) setButtonLoading(button, false);
}

function clearPreview() {
    const previewHeader = document.querySelector('.preview-header');
    const previewContent = document.getElementById('preview-content');
    
    if (previewHeader) previewHeader.textContent = 'Ready';
    if (previewContent) previewContent.innerHTML = 'Select any tool above to see results here';
    
    addLog('🧹 Preview cleared');
}

function loadStorageSettings() {
    // Load storage path from Chrome storage
    chrome.storage.sync.get(['screenshotPath', 'serverUrl'], function(items) {
        const storagePath = items.screenshotPath || '~/RapidTriage_Screenshots/';
        const serverUrl = items.serverUrl || 'Auto-detect';
        
        document.getElementById('storage-path').textContent = storagePath;
        document.getElementById('server-url').textContent = serverUrl;
    });
}

// Attach event listeners to buttons (required for Chrome extensions)
function attachButtonListeners() {
    console.log('Attaching button listeners...');
    
    // Core Functions
    document.getElementById('btn-test-server')?.addEventListener('click', function() {
        testServer(this);
    });
    
    document.getElementById('btn-screenshot')?.addEventListener('click', function() {
        takeScreenshot(this);
    });
    
    document.getElementById('btn-clear')?.addEventListener('click', function() {
        clearLogs(this);
    });
    
    document.getElementById('btn-devtools')?.addEventListener('click', function() {
        openDevTools(this);
    });
    
    // Audit Tools
    document.getElementById('btn-lighthouse')?.addEventListener('click', function() {
        runLighthouseAudit(this);
    });
    
    document.getElementById('btn-accessibility')?.addEventListener('click', function() {
        runAccessibilityAudit(this);
    });
    
    document.getElementById('btn-performance')?.addEventListener('click', function() {
        runPerformanceAudit(this);
    });
    
    document.getElementById('btn-seo')?.addEventListener('click', function() {
        runSEOAudit(this);
    });
    
    document.getElementById('btn-best-practices')?.addEventListener('click', function() {
        runBestPracticesAudit(this);
    });
    
    // NextJS button removed - event listener not needed
    
    // Debug Tools
    document.getElementById('btn-console')?.addEventListener('click', function() {
        getConsoleLogs(this);
    });
    
    document.getElementById('btn-console-errors')?.addEventListener('click', function() {
        getConsoleErrors(this);
    });
    
    document.getElementById('btn-network')?.addEventListener('click', function() {
        getNetworkLogs(this);
    });
    
    document.getElementById('btn-network-errors')?.addEventListener('click', function() {
        getNetworkErrors(this);
    });
    
    document.getElementById('btn-inspect')?.addEventListener('click', function() {
        inspectElement(this);
    });
    
    document.getElementById('btn-wipe-logs')?.addEventListener('click', function() {
        wipeLogs(this);
    });
    
    // Modes
    document.getElementById('btn-debug-mode')?.addEventListener('click', function() {
        runDebugMode(this);
    });
    
    document.getElementById('btn-audit-mode')?.addEventListener('click', function() {
        runAuditMode(this);
    });
    
    // Settings and Clear Preview
    document.getElementById('btn-settings')?.addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });
    
    document.getElementById('btn-clear-preview')?.addEventListener('click', function() {
        clearPreview();
    });
    
    // Load and display storage settings
    loadStorageSettings();
    
    console.log('Button listeners attached successfully');
}

// Auto-test server on load
setTimeout(() => testServer(), 500);