# DevTools Panel Not Showing - Troubleshooting Guide

## Problem
The RapidTriage panel is not appearing in Chrome DevTools (Chrome 138)

## Solutions to Try (in order)

### 1. Load the Simplified Extension First
This tests if ANY DevTools panel works in your Chrome:
```bash
1. Open chrome://extensions/
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select: /Users/yarlis/Downloads/rapidtriageME/chrome138-devtools-fix
5. Open any webpage
6. Open DevTools (F12)
7. Look for "RapidTriage" tab
```

### 2. Use the Simplified Version of Your Extension
I've updated your extension to use a simplified script:
```bash
1. Go to chrome://extensions/
2. Find "RapidTriage DevTools"
3. Click the refresh icon (↻)
4. Close ALL DevTools windows
5. Open a new tab
6. Open DevTools (F12)
7. Check for "RapidTriage" tab
```

### 3. Clear Chrome DevTools Cache
Sometimes DevTools caches can cause issues:
```bash
1. Close all Chrome DevTools windows
2. Open chrome://settings/
3. Go to "Privacy and security" → "Clear browsing data"
4. Select "Cached images and files"
5. Clear data
6. Restart Chrome completely
7. Reload the extension
```

### 4. Check Chrome Flags
Some flags might affect DevTools extensions:
```bash
1. Go to chrome://flags
2. Search for "developer"
3. Ensure "Developer Tools experiments" is set to Default or Enabled
4. Search for "extension"
5. Ensure no extension-related flags are set to Disabled
6. Restart Chrome if you made changes
```

### 5. Test in Chrome Canary
Download Chrome Canary to test if it's a Chrome 138 specific issue:
```bash
1. Download Chrome Canary from https://www.google.com/chrome/canary/
2. Load the extension in Canary
3. Test if the panel appears there
```

### 6. Check Console for Errors
When loading the extension:
```bash
1. Go to chrome://extensions/
2. Find your extension
3. Click "background page" or "service worker" (if visible)
4. Check the console for errors
5. Also check "Errors" button if present
```

### 7. Manual Panel Creation Test
Open any webpage, then open DevTools Console and run:
```javascript
// This should return 'object' if the API is available
typeof chrome.devtools

// This should list available methods
Object.keys(chrome.devtools.panels)
```

### 8. Reset Chrome DevTools
Reset all DevTools settings:
```bash
1. Open DevTools
2. Press F1 (Settings)
3. Scroll to bottom
4. Click "Restore defaults and reload"
```

## Files Created for Testing

1. **Minimal Working Extension**: `/chrome138-devtools-fix/`
   - Absolute minimum code that should work

2. **Simplified Script**: `devtools-simple.js`
   - Simplified version of your extension's script

3. **Debug Page**: `test-extension-debug.html`
   - Open in browser for debugging tools

## Current Status

Your extension now uses `devtools-simple.js` which has the absolute minimum code needed to create a panel. This eliminates any complex code that might be causing issues.

## If Nothing Works

This might be a Chrome 138 bug with DevTools extensions. You can:
1. Report it to Chrome: https://bugs.chromium.org/p/chromium/issues/entry
2. Use Chrome 137 or earlier temporarily
3. Wait for Chrome 139 which might fix the issue

## Command to Switch Back to Original

To restore the original devtools.js:
```bash
# In the extension directory
cp devtools-backup.js devtools.js
# Or edit devtools.html to load devtools.js instead of devtools-simple.js
```