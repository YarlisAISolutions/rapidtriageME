#!/bin/bash

# RapidTriage Extension Reload Script
# This script helps reload the extension for testing

echo "🚀 RapidTriage Extension Reload Helper"
echo "======================================="

# Check if browser connector server is running
echo "📡 Checking browser connector server..."
if curl -s http://localhost:3025/.identity > /dev/null 2>&1; then
    echo "✅ Browser connector server is running on port 3025"

    # Get server identity
    IDENTITY=$(curl -s http://localhost:3025/.identity | jq -r '.name + " v" + .version')
    echo "🔍 Server: $IDENTITY"
else
    echo "❌ Browser connector server is NOT running on port 3025"
    echo "📝 Please start it with: cd rapidtriageME && npm start"
    echo ""
    read -p "Press Enter to continue anyway..."
fi

echo ""
echo "🔧 Extension Loading Instructions:"
echo "1. Open Chrome and go to: chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked' and select:"
echo "   📁 /Users/yarlis/Downloads/rapidtriageME/rapidtriage-extension"
echo "4. If extension is already loaded, click the refresh button ⟳"
echo ""

echo "🧪 Testing Instructions:"
echo "1. Open any website (try the test page below)"
echo "2. Press F12 to open DevTools"
echo "3. Look for 'RapidTriage' tab in DevTools"
echo "4. Check if it shows 'Connected' status"
echo ""

echo "📋 Test Page:"
echo "   file:///Users/yarlis/Downloads/rapidtriageME/test-extension-connection.html"
echo ""

# Ask if user wants to open the test page
read -p "🌐 Open test page in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌍 Opening test page..."
    open /Users/yarlis/Downloads/rapidtriageME/test-extension-connection.html
fi

echo ""
echo "🐛 If you see issues:"
echo "   • Check browser console for errors"
echo "   • Look at DevTools console in the RapidTriage panel"
echo "   • Verify server is responding: curl http://localhost:3025/.identity"
echo ""

echo "✨ Happy debugging!"