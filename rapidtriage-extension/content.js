// Enhanced content script with element selection tracking
(function() {
    'use strict';
    
    // Initialize RapidTriage
    if (!window.__RAPIDTRIAGE__) {
        window.__RAPIDTRIAGE__ = {
            version: '2.3.0',
            ready: true,
            selectedElement: null,
            lastHoveredElement: null
        };
        
        console.log('[RapidTriage] Content script loaded');
    }
    
    // Get XPath for an element
    function getXPath(element) {
        if (!element) return '';
        
        if (element.id !== '') {
            return `//*[@id="${element.id}"]`;
        }
        
        if (element === document.body) {
            return '/html/body';
        }
        
        let nodeCount = 0;
        let siblings = element.parentNode ? element.parentNode.childNodes : [];
        
        for (let i = 0; i < siblings.length; i++) {
            let sibling = siblings[i];
            if (sibling === element) {
                return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (nodeCount + 1) + ']';
            }
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                nodeCount++;
            }
        }
        
        return '';
    }
    
    // Get CSS selector for an element
    function getCSSSelector(element) {
        if (!element) return '';
        
        const path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            
            if (element.id) {
                selector = '#' + element.id;
                path.unshift(selector);
                break;
            } else {
                let sibling = element;
                let nth = 1;
                
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName.toLowerCase() === selector) nth++;
                }
                
                if (nth !== 1) selector += `:nth-of-type(${nth})`;
            }
            
            path.unshift(selector);
            element = element.parentNode;
        }
        
        return path.join(' > ');
    }
    
    // Get element attributes
    function getElementAttributes(element) {
        if (!element || !element.attributes) return {};
        
        const attrs = {};
        for (let attr of element.attributes) {
            attrs[attr.name] = attr.value;
        }
        return attrs;
    }
    
    // Get element info
    function getElementInfo(element) {
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        
        return {
            tagName: element.tagName.toLowerCase(),
            id: element.id || null,
            className: element.className || null,
            xpath: getXPath(element),
            cssSelector: getCSSSelector(element),
            attributes: getElementAttributes(element),
            text: element.textContent ? element.textContent.substring(0, 100) : '',
            innerHTML: element.innerHTML ? element.innerHTML.substring(0, 200) : '',
            position: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            },
            styles: {
                display: computedStyle.display,
                position: computedStyle.position,
                color: computedStyle.color,
                backgroundColor: computedStyle.backgroundColor,
                fontSize: computedStyle.fontSize,
                fontWeight: computedStyle.fontWeight,
                zIndex: computedStyle.zIndex
            },
            parent: element.parentElement ? {
                tagName: element.parentElement.tagName.toLowerCase(),
                id: element.parentElement.id || null,
                className: element.parentElement.className || null
            } : null
        };
    }
    
    // Track clicked elements
    let lastClickedElement = null;
    let isInspectMode = false;
    
    // Highlight styles
    const highlightStyles = document.createElement('style');
    highlightStyles.innerHTML = `
        .rapidtriage-highlight {
            outline: 2px solid #007ACC !important;
            outline-offset: 2px !important;
            background-color: rgba(0, 122, 204, 0.1) !important;
            cursor: crosshair !important;
        }
        .rapidtriage-selected {
            outline: 3px solid #4CAF50 !important;
            outline-offset: 2px !important;
            background-color: rgba(76, 175, 80, 0.1) !important;
        }
    `;
    document.head.appendChild(highlightStyles);
    
    // Element hover handler for inspect mode
    function handleMouseOver(e) {
        if (!isInspectMode) return;
        
        const element = e.target;
        if (element === lastClickedElement) return;
        
        // Remove previous highlight
        document.querySelectorAll('.rapidtriage-highlight').forEach(el => {
            el.classList.remove('rapidtriage-highlight');
        });
        
        element.classList.add('rapidtriage-highlight');
        window.__RAPIDTRIAGE__.lastHoveredElement = getElementInfo(element);
    }
    
    // Element click handler for inspect mode
    function handleClick(e) {
        if (!isInspectMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const element = e.target;
        
        // Remove all highlights and selections
        document.querySelectorAll('.rapidtriage-highlight, .rapidtriage-selected').forEach(el => {
            el.classList.remove('rapidtriage-highlight', 'rapidtriage-selected');
        });
        
        // Mark as selected
        element.classList.add('rapidtriage-selected');
        lastClickedElement = element;
        
        // Store selected element info
        const elementInfo = getElementInfo(element);
        window.__RAPIDTRIAGE__.selectedElement = elementInfo;
        
        // Store in Chrome storage for persistence
        chrome.storage.local.set({
            'rapidtriage_selected_element': elementInfo,
            'rapidtriage_selected_time': Date.now()
        });
        
        // Send to extension
        chrome.runtime.sendMessage({
            type: 'ELEMENT_SELECTED',
            data: elementInfo
        });
        
        // Show a temporary notification
        showSelectionNotification(elementInfo);
        
        // Exit inspect mode after a delay to allow popup to receive the message
        setTimeout(() => {
            isInspectMode = false;
            document.body.style.cursor = '';
            document.removeEventListener('mouseover', handleMouseOver, true);
            document.removeEventListener('click', handleClick, true);
        }, 100);
        
        console.log('[RapidTriage] Element selected:', elementInfo);
    }
    
    // Show a temporary notification when element is selected
    function showSelectionNotification(elementInfo) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: system-ui, sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `
            ✅ Element Selected: <strong>${elementInfo.tagName}</strong>
            ${elementInfo.id ? '#' + elementInfo.id : ''}
            <br><small>Open extension to see details</small>
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }, 3000);
    }
    
    // Listen for messages from extension
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('[RapidTriage] Message received:', request.type);
        
        switch(request.type) {
            case 'GET_SELECTED_ELEMENT':
                // Get the currently selected element info
                if (window.__RAPIDTRIAGE__.selectedElement) {
                    sendResponse({
                        success: true,
                        data: window.__RAPIDTRIAGE__.selectedElement
                    });
                } else {
                    // Try to get info from Chrome's $0 (last inspected element)
                    try {
                        if (window.$0) {
                            const elementInfo = getElementInfo(window.$0);
                            window.__RAPIDTRIAGE__.selectedElement = elementInfo;
                            sendResponse({
                                success: true,
                                data: elementInfo
                            });
                        } else {
                            sendResponse({
                                success: false,
                                error: 'No element selected'
                            });
                        }
                    } catch (e) {
                        sendResponse({
                            success: false,
                            error: 'Could not access selected element'
                        });
                    }
                }
                break;
                
            case 'START_INSPECT_MODE':
                // Start element inspection mode
                isInspectMode = true;
                document.body.style.cursor = 'crosshair';
                
                // Add event listeners
                document.addEventListener('mouseover', handleMouseOver, true);
                document.addEventListener('click', handleClick, true);
                
                sendResponse({success: true});
                break;
                
            case 'STOP_INSPECT_MODE':
                // Stop element inspection mode
                isInspectMode = false;
                document.body.style.cursor = '';
                
                // Remove event listeners
                document.removeEventListener('mouseover', handleMouseOver, true);
                document.removeEventListener('click', handleClick, true);
                
                // Remove highlights
                document.querySelectorAll('.rapidtriage-highlight, .rapidtriage-selected').forEach(el => {
                    el.classList.remove('rapidtriage-highlight', 'rapidtriage-selected');
                });
                
                sendResponse({success: true});
                break;
                
            case 'PING':
                sendResponse({success: true, ready: true});
                break;
                
            default:
                sendResponse({success: false, error: 'Unknown message type'});
        }
        
        return true; // Keep message channel open for async response
    });
    
    // Auto-detect if DevTools element is selected
    let devToolsCheckInterval = setInterval(() => {
        try {
            // Check if Chrome DevTools $0 exists (last inspected element)
            if (typeof $0 !== 'undefined' && $0) {
                const currentElement = $0;
                if (currentElement !== window.__RAPIDTRIAGE__.lastDevToolsElement) {
                    window.__RAPIDTRIAGE__.lastDevToolsElement = currentElement;
                    window.__RAPIDTRIAGE__.selectedElement = getElementInfo(currentElement);
                    
                    // Notify extension
                    chrome.runtime.sendMessage({
                        type: 'DEVTOOLS_ELEMENT_SELECTED',
                        data: window.__RAPIDTRIAGE__.selectedElement
                    });
                }
            }
        } catch (e) {
            // $0 not available, ignore
        }
    }, 1000);
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        clearInterval(devToolsCheckInterval);
    });
    
})();