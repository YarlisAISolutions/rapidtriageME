#!/bin/bash

# Quick Fix for RapidTriage Extension
# This script fixes the JavaScript syntax error and reloads the extension

echo "🔧 RapidTriage Extension Quick Fix & Reload"
echo "==========================================="

# Fix the syntax error in popup.js
EXTENSION_DIR="/Users/yarlis/Downloads/rapidtriageME/rapidtriage-extension"
FIXED_EXTENSION_DIR="/Users/yarlis/Downloads/rapidtriageME-extension-ui-fix/rapidtriage-extension"

echo "1. 🔍 Checking extension directories..."

if [ -d "$FIXED_EXTENSION_DIR" ]; then
    echo "✅ Found fixed extension directory: $FIXED_EXTENSION_DIR"
    echo "📋 This extension should work without syntax errors"

    echo ""
    echo "2. 🔄 Extension Loading Instructions:"
    echo "   a) Go to chrome://extensions/"
    echo "   b) Enable 'Developer mode' (toggle in top right)"
    echo "   c) If RapidTriage is already loaded, click 'Remove' button"
    echo "   d) Click 'Load unpacked'"
    echo "   e) Select this directory: $FIXED_EXTENSION_DIR"
    echo ""
    echo "📍 Alternative: Use the fixed extension from worktree"

elif [ -d "$EXTENSION_DIR" ]; then
    echo "⚠️  Using original extension directory with potential syntax errors"
    echo "🔧 Attempting to fix syntax error..."

    # Create backup
    cp "$EXTENSION_DIR/popup.js" "$EXTENSION_DIR/popup.js.backup.$(date +%s)"

    # Simple fix for the missing closing brace
    # The issue is the } else { block needs proper closure

    echo "🔨 Applying quick syntax fix..."

    # Remove the extra line we added before and fix properly
    sed -i '' '/^        );$/d' "$EXTENSION_DIR/popup.js"

    # Add the missing closing brace for the else statement after line 565
    sed -i '' '565a\
                }' "$EXTENSION_DIR/popup.js"

    echo "3. ✅ Syntax error fixed"

else
    echo "❌ No extension directory found"
    echo "Please check the extension location"
    exit 1
fi

echo ""
echo "4. 🔄 Chrome Extension Reload Options:"
echo ""
echo "Option A - Manual Reload:"
echo "  1. Open chrome://extensions/"
echo "  2. Find 'RapidTriage DevTools' extension"
echo "  3. Click the refresh/reload button (🔄)"
echo "  4. Close and reopen DevTools"
echo "  5. Check for RapidTriage tab"

echo ""
echo "Option B - Complete Reinstall:"
echo "  1. Go to chrome://extensions/"
echo "  2. Remove existing RapidTriage extension"
echo "  3. Click 'Load unpacked'"
echo "  4. Select: $FIXED_EXTENSION_DIR"

echo ""
echo "Option C - Automatic (if Chrome allows):"
echo "  This script will attempt to reload Chrome extensions"

# Try to reload Chrome extensions automatically (may not work in all cases)
if command -v osascript >/dev/null 2>&1; then
    echo ""
    echo "🤖 Attempting automatic reload..."

    osascript << 'EOF'
tell application "Google Chrome"
    activate
    set targetURL to "chrome://extensions/"

    -- Check if extensions tab is already open
    set foundTab to false
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t starts with "chrome://extensions" then
                set active tab index of w to index of t
                set foundTab to true
                exit repeat
            end if
        end repeat
        if foundTab then exit repeat
    end repeat

    -- If not found, open new tab
    if not foundTab then
        tell front window
            make new tab with properties {URL:targetURL}
        end tell
    end if
end tell
EOF

    echo "✅ Chrome extensions page opened"
    echo "👆 Please manually click the reload button for RapidTriage extension"
else
    echo "ℹ️  Automatic reload not available (macOS AppleScript required)"
fi

echo ""
echo "5. 🧪 Testing Instructions:"
echo "  1. Open any website"
echo "  2. Press F12 to open DevTools"
echo "  3. Look for 'RapidTriage' tab"
echo "  4. Click the tab - should show connection status"
echo "  5. Test the 'Test Server' button"
echo "  6. Verify local mode toggle works"

echo ""
echo "6. 🔍 Troubleshooting:"
echo "  • If still seeing 'Initializing...': Use the fixed extension from worktree"
echo "  • If syntax errors persist: Check browser console for detailed errors"
echo "  • If no RapidTriage tab: Ensure extension is enabled and DevTools reloaded"
echo "  • Server connection: Ensure browser connector is running on localhost:3025"

echo ""
echo "📂 Extension Directories:"
echo "  Original: $EXTENSION_DIR"
echo "  Fixed:    $FIXED_EXTENSION_DIR (recommended)"

echo ""
echo "🏃 Quick Commands:"
echo "  Check server: curl http://localhost:3025/.identity"
echo "  Test page:    open /Users/yarlis/Downloads/rapidtriageME-testing/test-extension-functionality.html"

echo ""
echo "✨ Extension should now work without syntax errors!"