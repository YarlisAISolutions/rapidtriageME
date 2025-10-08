# 🐛 Bug Report: Inspect Element Feature Enhancement

## Issue Title
**Inspect Element button should inject content script for element selection**

## Current Behavior
When clicking the "Inspect Element" button, the extension only shows a message saying "Click on any element on the page to inspect it" but doesn't actually enable element selection or inspection functionality.

## Expected Behavior
1. When user clicks "Inspect Element" button:
   - Content script should be injected into the current tab
   - Visual overlay should appear on page elements as user hovers
   - Clicking an element should capture its details and show in Results Preview
   - Element details should include: tag name, classes, ID, dimensions, computed styles

## Root Cause
The current implementation lacks:
1. Content script injection for element selection
2. Visual feedback overlay for hovering elements
3. Communication between content script and extension popup/panel
4. Element data extraction and display logic

## Proposed Solution

### 1. Create Element Inspector Content Script
**File**: `rapidtriage-extension/element-inspector.js`
```javascript
// Content script for element inspection
let inspectorActive = false;
let selectedElement = null;
let overlay = null;

function createOverlay() {
    overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        pointer-events: none;
        border: 2px solid #007ACC;
        background: rgba(0, 122, 204, 0.1);
        z-index: 999999;
        transition: all 0.1s;
    `;
    document.body.appendChild(overlay);
}

function updateOverlay(element) {
    const rect = element.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
}

function handleMouseMove(e) {
    if (!inspectorActive) return;
    updateOverlay(e.target);
}

function handleClick(e) {
    if (!inspectorActive) return;
    e.preventDefault();
    e.stopPropagation();
    
    selectedElement = e.target;
    const elementData = {
        tagName: selectedElement.tagName,
        id: selectedElement.id,
        className: selectedElement.className,
        innerText: selectedElement.innerText?.substring(0, 100),
        innerHTML: selectedElement.innerHTML?.substring(0, 100),
        rect: selectedElement.getBoundingClientRect(),
        computedStyle: {
            color: getComputedStyle(selectedElement).color,
            backgroundColor: getComputedStyle(selectedElement).backgroundColor,
            fontSize: getComputedStyle(selectedElement).fontSize,
            fontFamily: getComputedStyle(selectedElement).fontFamily
        }
    };
    
    // Send element data back to extension
    chrome.runtime.sendMessage({
        type: 'ELEMENT_SELECTED',
        data: elementData
    });
    
    deactivateInspector();
}

function activateInspector() {
    inspectorActive = true;
    createOverlay();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.body.style.cursor = 'crosshair';
}

function deactivateInspector() {
    inspectorActive = false;
    if (overlay) {
        overlay.remove();
        overlay = null;
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick, true);
    document.body.style.cursor = '';
}

// Listen for activation message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ACTIVATE_INSPECTOR') {
        activateInspector();
        sendResponse({success: true});
    } else if (request.action === 'DEACTIVATE_INSPECTOR') {
        deactivateInspector();
        sendResponse({success: true});
    }
});
```

### 2. Update popup.js inspectElement Function
```javascript
function inspectElement(button) {
    if (button) setButtonLoading(button, true);
    
    addLog('Activating element inspector...');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = tabs[0]?.url || 'unknown';
        
        // Inject the inspector script
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['element-inspector.js']
        }, () => {
            // Activate the inspector
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'ACTIVATE_INSPECTOR'
            }, (response) => {
                if (response && response.success) {
                    const content = `
                        <div class="info">🔍 Element Inspector Active</div>
                        <strong>Status:</strong> Ready to inspect<br>
                        <strong>Instructions:</strong><br>
                        • Hover over elements to highlight<br>
                        • Click to select and inspect<br>
                        • ESC to cancel
                    `;
                    showPreview('🔍 Element Inspector', content, 'info');
                }
            });
        });
        
        if (button) setButtonLoading(button, false);
    });
}

// Listen for element selection
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ELEMENT_SELECTED') {
        const data = request.data;
        const content = `
            <div class="success">✅ Element Selected</div>
            <strong>Tag:</strong> ${data.tagName}<br>
            <strong>ID:</strong> ${data.id || 'none'}<br>
            <strong>Class:</strong> ${data.className || 'none'}<br>
            <strong>Size:</strong> ${Math.round(data.rect.width)}x${Math.round(data.rect.height)}px<br>
            <strong>Position:</strong> (${Math.round(data.rect.left)}, ${Math.round(data.rect.top)})<br>
            <strong>Color:</strong> ${data.computedStyle.color}<br>
            <strong>Background:</strong> ${data.computedStyle.backgroundColor}<br>
            <strong>Font:</strong> ${data.computedStyle.fontSize} ${data.computedStyle.fontFamily}
        `;
        showPreview('🔍 Element Details', content, 'success');
        addLog(`✅ Inspected: <${data.tagName}> ${data.id ? '#' + data.id : ''}`);
    }
});
```

### 3. Update Manifest Permissions
Add to `manifest.json`:
```json
{
    "permissions": [
        // ... existing permissions
        "scripting"
    ],
    "content_scripts": [
        {
            "matches": ["<all_urls>"],
            "js": ["content.js", "element-inspector.js"],
            "run_at": "document_idle"
        }
    ]
}
```

## Implementation Steps
1. Create `element-inspector.js` with overlay and selection logic
2. Update `inspectElement()` function to inject and activate inspector
3. Add message passing between content script and popup
4. Update manifest with scripting permission
5. Test on various websites to ensure overlay works correctly

## Testing Checklist
- [ ] Click "Inspect Element" activates overlay
- [ ] Hovering highlights elements with blue border
- [ ] Clicking element captures its data
- [ ] Element details show in Results Preview
- [ ] ESC key deactivates inspector
- [ ] Works on different types of elements (div, button, img, etc.)
- [ ] Handles iframes and shadow DOM appropriately

## Priority
**Medium** - Feature enhancement, not blocking core functionality

## Estimated Effort
**4-6 hours** including testing and edge cases

## Additional Notes
- Consider adding keyboard shortcuts (ESC to cancel, Enter to select)
- Add option to copy element selector to clipboard
- Consider showing element hierarchy/breadcrumb
- Add ability to inspect computed CSS properties
- Consider integrating with Chrome DevTools Element panel

---
*Created: August 9, 2025*
*Status: Open*
*Assignee: TBD*