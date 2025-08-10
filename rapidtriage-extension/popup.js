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

function testServer(button) {
    console.log('testServer called with button:', button);
    if (button) setButtonLoading(button, true);
    
    addLog('Testing server connection...');
    document.getElementById('status').textContent = 'Testing...';
    
    // Show immediate preview
    showPreview('🔍 Server Connection Test', 'Testing connection to http://localhost:3025...<br>Please wait...', 'info');
    
    fetch('http://localhost:3025/.identity')
        .then(response => response.json())
        .then(data => {
            addLog(`✅ Connected: ${data.name} v${data.version}`);
            document.getElementById('status').textContent = 'Connected';
            
            // Update preview with results
            const content = `
                <div class="success">✅ Connection Successful</div>
                <strong>Server:</strong> ${data.name}<br>
                <strong>Version:</strong> ${data.version}<br>
                <strong>Port:</strong> ${data.port}<br>
                <strong>Signature:</strong> ${data.signature}
            `;
            showPreview('🔍 Server Connection Test', content, 'success');
        })
        .catch(error => {
            addLog(`❌ Connection failed: ${error.message}`);
            document.getElementById('status').textContent = 'Disconnected';
            
            // Update preview with error
            const content = `
                <div class="error">❌ Connection Failed</div>
                <strong>Error:</strong> ${error.message}<br>
                <strong>Solution:</strong> Make sure the server is running on port 3025
            `;
            showPreview('🔍 Server Connection Test', content, 'error');
        })
        .finally(() => {
            if (button) setButtonLoading(button, false);
        });
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
                    fetch('http://localhost:3025/screenshot', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            data: dataUrl,
                            timestamp: new Date().toISOString(),
                            url: currentUrl
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
                        addLog(`📁 Saved as: ${result.path || 'screenshot.png'}`);
                        document.getElementById('status').textContent = 'Screenshot completed';
                        
                        // Update preview with final result
                        const content = `
                            <div class="success">✅ Screenshot Complete</div>
                            <strong>File:</strong> ${result.path}<br>
                            <strong>Size:</strong> ~${Math.round(result.size/1024)}KB<br>
                            <strong>URL:</strong> ${currentUrl}<br>
                            <strong>Time:</strong> ${new Date().toLocaleTimeString()}
                        `;
                        showPreview('📷 Screenshot Capture', content, 'success');
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
    
    addLog('Opening DevTools...');
    
    // Show immediate preview
    showPreview('🔧 DevTools Access', 'Attempting to open DevTools...<br>Please wait...', 'info');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (chrome.runtime.lastError || !tabs[0]) {
            const error = chrome.runtime.lastError?.message || 'No active tab';
            addLog(`❌ DevTools failed: ${error}`);
            
            const content = `
                <div class="error">❌ DevTools Failed</div>
                <strong>Error:</strong> ${error}<br>
                <strong>Solution:</strong> Make sure you have an active tab open
            `;
            showPreview('🔧 DevTools Access', content, 'error');
            if (button) setButtonLoading(button, false);
            return;
        }
        
        chrome.debugger.attach({tabId: tabs[0].id}, '1.0', function() {
            if (chrome.runtime.lastError) {
                const error = chrome.runtime.lastError.message;
                addLog(`❌ DevTools failed: ${error}`);
                
                const content = `
                    <div class="error">❌ DevTools Access Failed</div>
                    <strong>Error:</strong> ${error}<br>
                    <strong>Alternative:</strong> Press F12 to open DevTools manually<br>
                    <strong>Tab ID:</strong> ${tabs[0].id}
                `;
                showPreview('🔧 DevTools Access', content, 'error');
            } else {
                addLog('✅ DevTools opened (press F12 to see)');
                
                const content = `
                    <div class="success">✅ DevTools Access Granted</div>
                    <strong>Status:</strong> Debugger attached successfully<br>
                    <strong>Tab ID:</strong> ${tabs[0].id}<br>
                    <strong>Instructions:</strong> Press F12 to open DevTools<br>
                    <strong>Time:</strong> ${new Date().toLocaleTimeString()}
                `;
                showPreview('🔧 DevTools Access', content, 'success');
            }
            
            if (button) setButtonLoading(button, false);
        });
    });
}

function runLighthouseAudit(button) {
    console.log('runLighthouseAudit called with button:', button);
    if (button) setButtonLoading(button, true);
    
    addLog('🔍 Starting Lighthouse audit...');
    document.getElementById('status').textContent = 'Running audit...';
    
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
                <div class="info">🔍 Lighthouse Audit Started</div>
                <strong>URL:</strong> ${currentUrl}<br>
                <strong>Status:</strong> Analyzing performance...<br>
                <div style="margin-top: 5px;">This may take a few seconds...</div>
            `;
            showPreview('🔍 Lighthouse Audit', content, 'info');
            
            fetch('http://localhost:3025/api/lighthouse', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({url: currentUrl})
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const scores = data.data.scores;
                    const metrics = data.data.metrics;
                    
                    addLog('✅ Lighthouse Audit Complete:');
                    addLog(`  🏃 Performance: ${scores.performance}/100`);
                    addLog(`  ♿ Accessibility: ${scores.accessibility}/100`);
                    addLog(`  🎯 Best Practices: ${scores.bestPractices}/100`);
                    addLog(`  🔍 SEO: ${scores.seo}/100`);
                    addLog(`  ⏱️ Load Time: ${metrics.loadTime}ms`);
                    
                    document.getElementById('status').textContent = `Audit complete - Performance: ${scores.performance}`;
                    
                    // Update preview with detailed results
                    const content = `
                        <div class="success">✅ Lighthouse Audit Complete</div>
                        <strong>🏃 Performance:</strong> ${scores.performance}/100<br>
                        <strong>♿ Accessibility:</strong> ${scores.accessibility}/100<br>
                        <strong>🎯 Best Practices:</strong> ${scores.bestPractices}/100<br>
                        <strong>🔍 SEO:</strong> ${scores.seo}/100<br>
                        <strong>⏱️ Load Time:</strong> ${metrics.loadTime}ms<br>
                        <strong>📅 Time:</strong> ${new Date().toLocaleTimeString()}
                    `;
                    showPreview('🔍 Lighthouse Audit', content, 'success');
                } else {
                    addLog(`❌ Lighthouse failed: ${data.error}`);
                    document.getElementById('status').textContent = 'Audit failed';
                    
                    const content = `
                        <div class="error">❌ Audit Failed</div>
                        <strong>Error:</strong> ${data.error}<br>
                        <strong>URL:</strong> ${currentUrl}
                    `;
                    showPreview('🔍 Lighthouse Audit', content, 'error');
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
            
            fetch('http://localhost:3025/api/console-logs', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({url: currentUrl})
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const logs = data.data.logs;
                    const summary = data.data.summary;
                    
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
                } else {
                    addLog(`❌ Console logs failed: ${data.error}`);
                    document.getElementById('status').textContent = 'Logs fetch failed';
                    
                    const content = `
                        <div class="error">❌ Console Logs Failed</div>
                        <strong>Error:</strong> ${data.error}<br>
                        <strong>URL:</strong> ${currentUrl}
                    `;
                    showPreview('📋 Console Logs', content, 'error');
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

// Attach event listeners to buttons (required for Chrome extensions)
function attachButtonListeners() {
    console.log('Attaching button listeners...');
    
    // Get all buttons and attach listeners
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
    
    document.getElementById('btn-lighthouse')?.addEventListener('click', function() {
        runLighthouseAudit(this);
    });
    
    document.getElementById('btn-console')?.addEventListener('click', function() {
        getConsoleLogs(this);
    });
    
    document.getElementById('btn-inspect')?.addEventListener('click', function() {
        inspectElement(this);
    });
    
    console.log('Button listeners attached successfully');
}

// Auto-test server on load
setTimeout(() => testServer(), 500);